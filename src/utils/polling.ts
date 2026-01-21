/**
 * 轮询管理器
 * 用于管理定时轮询任务，支持自动重试、超时控制和资源清理
 */

export interface PollingOptions {
  /** 轮询间隔（毫秒），默认5000ms */
  interval?: number;
  /** 超时时间（毫秒），默认30分钟 */
  timeout?: number;
  /** 错误重试次数，默认3次 */
  maxRetries?: number;
  /** 是否立即执行第一次轮询，默认true */
  immediate?: boolean;
}

export interface PollingCallback<T> {
  (): Promise<T>;
}

export interface PollingStopCondition<T> {
  (result: T): boolean;
}

export class PollingManager<T = any> {
  private intervalId: number | null = null;
  private timeoutId: number | null = null;
  private startTime: number = 0;
  private retryCount: number = 0;
  private isRunning: boolean = false;

  private readonly interval: number;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly immediate: boolean;

  constructor(options: PollingOptions = {}) {
    this.interval = options.interval ?? 5000; // 默认5秒
    this.timeout = options.timeout ?? 30 * 60 * 1000; // 默认30分钟
    this.maxRetries = options.maxRetries ?? 3;
    this.immediate = options.immediate ?? true;
  }

  /**
   * 开始轮询
   * @param callback 轮询回调函数
   * @param stopCondition 停止条件函数，返回true时停止轮询
   * @param onError 错误处理函数
   * @param onTimeout 超时处理函数
   */
  start(
    callback: PollingCallback<T>,
    stopCondition: PollingStopCondition<T>,
    onError?: (error: Error) => void,
    onTimeout?: () => void
  ): void {
    if (this.isRunning) {
      console.warn('PollingManager: 轮询已在运行中');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    this.retryCount = 0;

    // 设置超时定时器
    this.timeoutId = window.setTimeout(() => {
      this.stop();
      if (onTimeout) {
        onTimeout();
      }
    }, this.timeout);

    // 执行轮询
    const poll = async () => {
      try {
        const result = await callback();
        this.retryCount = 0; // 成功后重置重试计数

        // 检查是否满足停止条件
        if (stopCondition(result)) {
          this.stop();
          return;
        }
      } catch (error) {
        this.retryCount++;
        console.error(`PollingManager: 轮询错误 (重试 ${this.retryCount}/${this.maxRetries})`, error);

        if (onError) {
          onError(error as Error);
        }

        // 达到最大重试次数，停止轮询
        if (this.retryCount >= this.maxRetries) {
          console.error('PollingManager: 达到最大重试次数，停止轮询');
          this.stop();
          return;
        }
      }
    };

    // 立即执行第一次
    if (this.immediate) {
      poll();
    }

    // 设置定时轮询
    this.intervalId = window.setInterval(poll, this.interval);
  }

  /**
   * 停止轮询
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.isRunning = false;
  }

  /**
   * 检查轮询是否正在运行
   */
  isPolling(): boolean {
    return this.isRunning;
  }

  /**
   * 获取已运行时间（毫秒）
   */
  getElapsedTime(): number {
    if (!this.isRunning) {
      return 0;
    }
    return Date.now() - this.startTime;
  }

  /**
   * 获取剩余时间（毫秒）
   */
  getRemainingTime(): number {
    if (!this.isRunning) {
      return 0;
    }
    const elapsed = this.getElapsedTime();
    return Math.max(0, this.timeout - elapsed);
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stop();
  }
}

/**
 * 创建一个简单的轮询管理器实例
 */
export function createPollingManager<T = any>(options?: PollingOptions): PollingManager<T> {
  return new PollingManager<T>(options);
}
