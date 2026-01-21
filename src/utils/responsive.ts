/**
 * 响应式工具函数
 * Responsive Utility Functions
 */

// 断点定义 (与CSS变量保持一致)
export const BREAKPOINTS = {
  mobile: 320,
  mobileLg: 480,
  tablet: 768,
  desktop: 1024,
  desktopLg: 1440,
  desktopXl: 1920,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * 获取当前断点
 * @returns 当前断点名称
 */
export function getCurrentBreakpoint(): Breakpoint {
  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.mobileLg) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'mobileLg';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  if (width < BREAKPOINTS.desktopLg) return 'desktop';
  if (width < BREAKPOINTS.desktopXl) return 'desktopLg';
  return 'desktopXl';
}

/**
 * 检查是否为移动设备
 * @returns 是否为移动设备
 */
export function isMobile(): boolean {
  return window.innerWidth < BREAKPOINTS.tablet;
}

/**
 * 检查是否为平板设备
 * @returns 是否为平板设备
 */
export function isTablet(): boolean {
  const width = window.innerWidth;
  return width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
}

/**
 * 检查是否为桌面设备
 * @returns 是否为桌面设备
 */
export function isDesktop(): boolean {
  return window.innerWidth >= BREAKPOINTS.desktop;
}

/**
 * 检查是否为触摸设备
 * @returns 是否为触摸设备
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * 检查设备是否支持hover
 * @returns 是否支持hover
 */
export function hasHover(): boolean {
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * 检查是否偏好减少动画
 * @returns 是否偏好减少动画
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 检查是否为深色模式
 * @returns 是否为深色模式
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间(毫秒)
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 限制时间(毫秒)
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 媒体查询监听器类
 */
export class MediaQueryListener {
  private mediaQuery: MediaQueryList;
  private listeners: Set<(matches: boolean) => void> = new Set();

  constructor(query: string) {
    this.mediaQuery = window.matchMedia(query);
    this.mediaQuery.addEventListener('change', this.handleChange);
  }

  private handleChange = (e: MediaQueryListEvent) => {
    this.listeners.forEach(listener => listener(e.matches));
  };

  /**
   * 添加监听器
   * @param listener 监听函数
   */
  addListener(listener: (matches: boolean) => void): void {
    this.listeners.add(listener);
    // 立即调用一次,传入当前状态
    listener(this.mediaQuery.matches);
  }

  /**
   * 移除监听器
   * @param listener 监听函数
   */
  removeListener(listener: (matches: boolean) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * 获取当前匹配状态
   * @returns 是否匹配
   */
  get matches(): boolean {
    return this.mediaQuery.matches;
  }

  /**
   * 销毁监听器
   */
  destroy(): void {
    this.mediaQuery.removeEventListener('change', this.handleChange);
    this.listeners.clear();
  }
}

/**
 * 创建断点监听器
 * @param breakpoint 断点名称
 * @param callback 回调函数
 * @returns 监听器实例
 */
export function createBreakpointListener(
  breakpoint: Breakpoint,
  callback: (matches: boolean) => void
): MediaQueryListener {
  const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
  const listener = new MediaQueryListener(query);
  listener.addListener(callback);
  return listener;
}

/**
 * 获取视口尺寸
 * @returns 视口宽度和高度
 */
export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * 检查元素是否在视口内
 * @param element DOM元素
 * @returns 是否在视口内
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 锁定body滚动
 */
export function lockBodyScroll(): void {
  document.body.style.overflow = 'hidden';
}

/**
 * 解锁body滚动
 */
export function unlockBodyScroll(): void {
  document.body.style.overflow = '';
}

/**
 * 平滑滚动到元素
 * @param element 目标元素或选择器
 * @param offset 偏移量(像素)
 */
export function scrollToElement(
  element: HTMLElement | string,
  offset: number = 0
): void {
  const target = typeof element === 'string' 
    ? document.querySelector(element) as HTMLElement
    : element;
    
  if (!target) return;
  
  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
  
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth',
  });
}

/**
 * 获取滚动条宽度
 * @returns 滚动条宽度(像素)
 */
export function getScrollbarWidth(): number {
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);
  
  const inner = document.createElement('div');
  outer.appendChild(inner);
  
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  
  outer.parentNode?.removeChild(outer);
  
  return scrollbarWidth;
}
