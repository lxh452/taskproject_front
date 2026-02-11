<template>
  <div class="gauge" :style="gaugeStyle">
    <svg class="gauge-svg" :viewBox="`0 0 ${size} ${size * 0.6}`">
      <!-- 背景弧线 -->
      <path
        :d="backgroundArc"
        fill="none"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
      />
      <!-- 进度弧线 -->
      <path
        :d="progressArc"
        fill="none"
        :stroke="gaugeColor"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        class="progress-path"
      />
    </svg>
    <div class="gauge-content">
      <span class="gauge-value" :style="{ color: gaugeColor }">
        {{ displayValue }}
        <span class="unit">%</span>
      </span>
      <span class="gauge-label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  value: number;
  max?: number;
  min?: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  min: 0,
  label: '',
  size: 120,
  strokeWidth: 8,
  color: '#409eff',
  trackColor: '#e4e7ed',
  showValue: true
});

const displayValue = computed(() => {
  const percentage = ((props.value - props.min) / (props.max - props.min)) * 100;
  return Math.round(percentage);
});

const gaugeColor = computed(() => {
  if (props.color) return props.color;
  const percentage = displayValue.value;
  if (percentage > 80) return '#67c23a';
  if (percentage > 60) return '#e6a23c';
  if (percentage > 40) return '#409eff';
  return '#f56c6c';
});

const gaugeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size * 0.6}px`
}));

const center = computed(() => props.size / 2);
const radius = computed(() => (props.size - props.strokeWidth) / 2);

const arcPath = (startAngle: number, endAngle: number) => {
  const start = polarToCartesian(center.value, center.value, radius.value, endAngle);
  const end = polarToCartesian(center.value, center.value, radius.value, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius.value} ${radius.value} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
  const rad = (angle * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
};

const backgroundArc = computed(() => arcPath(180, 0));

const progressArc = computed(() => {
  const percentage = displayValue.value / 100;
  const endAngle = 180 - percentage * 180;
  return arcPath(180, endAngle);
});
</script>

<style scoped>
.gauge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-path {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.gauge-content {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.gauge-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  transition: color 0.3s ease;
}

.unit {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
}

.gauge-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
</style>
