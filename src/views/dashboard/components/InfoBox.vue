<template>
  <div class="info-box" :style="boxStyle">
    <div class="icon-wrapper" :style="iconStyle">
      <el-icon :size="24">
        <component :is="iconComponent" />
      </el-icon>
    </div>
    <div class="content">
      <span class="label">{{ label }}</span>
      <div class="value-row">
        <span class="value" :style="valueStyle">{{ displayValue }}</span>
        <span v-if="trend !== undefined" class="trend" :class="trendClass">
          <el-icon :size="12">
            <ArrowUp v-if="trend > 0" />
            <ArrowDown v-else />
          </el-icon>
          {{ Math.abs(trend) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Document, Clock, Loading, CircleCheck, ArrowUp, ArrowDown,
  User, Files, TrendCharts, Collection
} from '@element-plus/icons-vue';

interface Props {
  icon: string;
  label: string;
  value: number | string;
  trend?: number;
  color?: string;
  size?: 'default' | 'large' | 'small';
}

const props = withDefaults(defineProps<Props>(), {
  trend: undefined,
  color: '#409eff',
  size: 'default'
});

const iconMap: Record<string, any> = {
  Document,
  Clock,
  Loading,
  CircleCheck,
  User,
  Files,
  TrendCharts,
  Collection
};

const iconComponent = computed(() => iconMap[props.icon] || Document);

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString();
  }
  return props.value;
});

const trendClass = computed(() => ({
  positive: (props.trend || 0) > 0,
  negative: (props.trend || 0) < 0
}));

const boxStyle = computed(() => {
  const sizes = {
    small: { padding: '12px 16px', minWidth: '140px' },
    default: { padding: '20px 24px', minWidth: '180px' },
    large: { padding: '24px 28px', minWidth: '220px' }
  };
  return sizes[props.size];
});

const iconStyle = computed(() => ({
  backgroundColor: `${props.color}20`,
  color: props.color
}));

const valueStyle = computed(() => ({
  color: props.color
}));
</script>

<style scoped>
.info-box {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.info-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.info-box:hover .icon-wrapper {
  transform: scale(1.05);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.value-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.trend.positive {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

.trend.negative {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}
</style>
