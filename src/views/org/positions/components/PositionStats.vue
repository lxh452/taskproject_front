<template>
  <div class="stats-row">
    <div class="stat-card" v-for="stat in statCards" :key="stat.key">
      <div class="stat-icon" :class="stat.iconClass">
        <el-icon><component :is="stat.icon" /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats[stat.key as keyof PositionStats] }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Briefcase, CircleCheck, UserFilled, Warning } from '@element-plus/icons-vue';
import type { PositionStats } from '../types';

interface Props {
  stats: PositionStats;
}

const props = defineProps<Props>();

const statCards = computed(() => [
  {
    key: 'total',
    label: '职位总数',
    icon: Briefcase,
    iconClass: 'total',
  },
  {
    key: 'enabled',
    label: '启用中',
    icon: CircleCheck,
    iconClass: 'enabled',
  },
  {
    key: 'management',
    label: '管理岗',
    icon: UserFilled,
    iconClass: 'management',
  },
  {
    key: 'vacancy',
    label: '有空缺',
    icon: Warning,
    iconClass: 'vacancy',
  },
]);
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--border-color);
  transition: all var(--transition-base);
}

.stat-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-icon.total {
  background: var(--color-primary);
  color: #fff;
}

.stat-icon.enabled {
  background: var(--color-success);
  color: #fff;
}

.stat-icon.management {
  background: var(--color-warning);
  color: #fff;
}

.stat-icon.vacancy {
  background: var(--color-info);
  color: #fff;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .stat-value {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
