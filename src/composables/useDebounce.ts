import { ref } from 'vue';

/**
 * 防抖 Hook
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数和加载状态
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) {
  const loading = ref(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    loading.value = true;
    timeoutId = setTimeout(() => {
      fn(...args);
      loading.value = false;
    }, delay);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      loading.value = false;
    }
  };

  return {
    debouncedFn,
    loading,
    cancel,
  };
}

/**
 * 节流 Hook
 * @param fn 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数和加载状态
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) {
  const loading = ref(false);
  let lastRun = 0;

  const throttledFn = (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRun >= delay) {
      loading.value = true;
      fn(...args);
      lastRun = now;
      
      setTimeout(() => {
        loading.value = false;
      }, delay);
    }
  };

  return {
    throttledFn,
    loading,
  };
}

/**
 * 防止重复点击 Hook
 * @param fn 要执行的异步函数
 * @returns 包装后的函数和加载状态
 */
export function usePreventRepeat<T extends (...args: any[]) => Promise<any>>(
  fn: T
) {
  const loading = ref(false);

  const wrappedFn = async (...args: Parameters<T>) => {
    if (loading.value) {
      console.warn('操作进行中，请勿重复点击');
      return;
    }

    loading.value = true;
    try {
      return await fn(...args);
    } finally {
      loading.value = false;
    }
  };

  return {
    wrappedFn,
    loading,
  };
}
