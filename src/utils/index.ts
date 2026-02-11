// 工具函数导出

/**
 * 混合两个颜色
 * @param color1 第一个颜色（十六进制）
 * @param color2 第二个颜色（十六进制）
 * @param weight 混合权重 (0-1)
 * @returns 混合后的颜色
 */
export function mix(color1: string, color2: string, weight: number): string {
  if (!color1 || !color2) return color2 || color1 || '';

  const parseColor = (hex: string): number[] => {
    const clean = hex.replace('#', '');
    return [
      parseInt(clean.substring(0, 2), 16),
      parseInt(clean.substring(2, 4), 16),
      parseInt(clean.substring(4, 6), 16)
    ];
  };

  const [r1, g1, b1] = parseColor(color1);
  const [r2, g2, b2] = parseColor(color2);

  const r = Math.round(r1 * weight + r2 * (1 - weight));
  const g = Math.round(g1 * weight + g2 * (1 - weight));
  const b = Math.round(b1 * weight + b2 * (1 - weight));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 设置 CSS 自定义属性
 * @param property CSS 属性名
 * @param value CSS 属性值
 */
export function setProperty(property: string, value: string): void {
  if (value) {
    document.documentElement.style.setProperty(property, value);
  } else {
    document.documentElement.style.removeProperty(property);
  }
}

// 导出其他工具模块
export * from './request';
export * from './validation';
export * from './errorHandler';
export * from './fileUrl';
export * from './polling';
