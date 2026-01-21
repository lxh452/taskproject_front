/**
 * Vue 3 响应式组合式函数
 * Vue 3 Responsive Composables
 */

import { ref, onMounted, onUnmounted, computed, Ref } from 'vue';
import {
  getCurrentBreakpoint,
  isMobile as checkIsMobile,
  isTablet as checkIsTablet,
  isDesktop as checkIsDesktop,
  isTouchDevice as checkIsTouchDevice,
  hasHover as checkHasHover,
  prefersReducedMotion as checkPrefersReducedMotion,
  prefersDarkMode as checkPrefersDarkMode,
  debounce,
  MediaQueryListener,
  BREAKPOINTS,
  type Breakpoint,
} from '@/utils/responsive';

/**
 * 使用响应式断点
 * @returns 当前断点和检查函数
 */
export function useBreakpoint() {
  const breakpoint = ref<Breakpoint>(getCurrentBreakpoint());
  const width = ref(window.innerWidth);

  const updateBreakpoint = debounce(() => {
    breakpoint.value = getCurrentBreakpoint();
    width.value = window.innerWidth;
  }, 150);

  onMounted(() => {
    window.addEventListener('resize', updateBreakpoint);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateBreakpoint);
  });

  const isMobile = computed(() => width.value < BREAKPOINTS.tablet);
  const isTablet = computed(() => width.value >= BREAKPOINTS.tablet && width.value < BREAKPOINTS.desktop);
  const isDesktop = computed(() => width.value >= BREAKPOINTS.desktop);

  return {
    breakpoint,
    width,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * 使用媒体查询
 * @param query 媒体查询字符串
 * @returns 是否匹配
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false);
  let listener: MediaQueryListener | null = null;

  onMounted(() => {
    listener = new MediaQueryListener(query);
    listener.addListener((m) => {
      matches.value = m;
    });
  });

  onUnmounted(() => {
    listener?.destroy();
  });

  return matches;
}

/**
 * 使用移动端检测
 * @returns 是否为移动端
 */
export function useMobile(): Ref<boolean> {
  const isMobile = ref(checkIsMobile());

  const updateMobile = debounce(() => {
    isMobile.value = checkIsMobile();
  }, 150);

  onMounted(() => {
    window.addEventListener('resize', updateMobile);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateMobile);
  });

  return isMobile;
}

/**
 * 使用触摸设备检测
 * @returns 设备特性
 */
export function useDeviceCapabilities() {
  const isTouchDevice = ref(checkIsTouchDevice());
  const hasHover = ref(checkHasHover());
  const prefersReducedMotion = ref(checkPrefersReducedMotion());
  const prefersDarkMode = ref(checkPrefersDarkMode());

  return {
    isTouchDevice,
    hasHover,
    prefersReducedMotion,
    prefersDarkMode,
  };
}

/**
 * 使用窗口尺寸
 * @returns 窗口宽度和高度
 */
export function useWindowSize() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  const updateSize = debounce(() => {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
  }, 150);

  onMounted(() => {
    window.addEventListener('resize', updateSize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize);
  });

  return {
    width,
    height,
  };
}

/**
 * 使用滚动位置
 * @returns 滚动位置
 */
export function useScrollPosition() {
  const x = ref(window.scrollX);
  const y = ref(window.scrollY);

  const updatePosition = debounce(() => {
    x.value = window.scrollX;
    y.value = window.scrollY;
  }, 100);

  onMounted(() => {
    window.addEventListener('scroll', updatePosition, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', updatePosition);
  });

  return {
    x,
    y,
  };
}

/**
 * 使用元素可见性检测
 * @param elementRef 元素引用
 * @returns 是否可见
 */
export function useIntersectionObserver(
  elementRef: Ref<HTMLElement | null>,
  options?: IntersectionObserverInit
) {
  const isVisible = ref(false);
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    if (!elementRef.value) return;

    observer = new IntersectionObserver(
      (entries) => {
        isVisible.value = entries[0].isIntersecting;
      },
      options
    );

    observer.observe(elementRef.value);
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return isVisible;
}

/**
 * 使用响应式图表
 * @param chartRef 图表实例引用
 * @returns 图表响应式配置
 */
export function useResponsiveChart(chartRef: Ref<any>) {
  const { isMobile } = useBreakpoint();

  const resizeChart = debounce(() => {
    if (chartRef.value && typeof chartRef.value.resize === 'function') {
      chartRef.value.resize();
    }
  }, 300);

  onMounted(() => {
    window.addEventListener('resize', resizeChart);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', resizeChart);
  });

  // 移动端图表配置
  const mobileChartOptions = computed(() => ({
    grid: {
      left: isMobile.value ? '10%' : '3%',
      right: isMobile.value ? '10%' : '4%',
      bottom: isMobile.value ? '15%' : '3%',
      top: isMobile.value ? '15%' : '10%',
      containLabel: true,
    },
    legend: {
      show: !isMobile.value,
      textStyle: {
        fontSize: isMobile.value ? 10 : 12,
      },
    },
    xAxis: {
      axisLabel: {
        fontSize: isMobile.value ? 10 : 12,
        rotate: isMobile.value ? 45 : 0,
      },
    },
    yAxis: {
      axisLabel: {
        fontSize: isMobile.value ? 10 : 12,
      },
    },
    tooltip: {
      textStyle: {
        fontSize: isMobile.value ? 12 : 14,
      },
    },
  }));

  return {
    mobileChartOptions,
    resizeChart,
  };
}

/**
 * 使用Body滚动锁定
 * @returns 锁定和解锁函数
 */
export function useBodyScrollLock() {
  const isLocked = ref(false);

  const lock = () => {
    if (isLocked.value) return;
    document.body.style.overflow = 'hidden';
    isLocked.value = true;
  };

  const unlock = () => {
    if (!isLocked.value) return;
    document.body.style.overflow = '';
    isLocked.value = false;
  };

  // 组件卸载时自动解锁
  onUnmounted(() => {
    unlock();
  });

  return {
    isLocked,
    lock,
    unlock,
  };
}
