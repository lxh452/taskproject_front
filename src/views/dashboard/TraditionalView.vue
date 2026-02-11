<template>
  <div class="traditional-view">
    <div class="stats-row">
      <InfoBox
        v-for="stat in taskStats"
        :key="stat.label"
        :icon="stat.icon"
        :label="stat.label"
        :value="stat.value"
        :trend="stat.trend"
        :color="stat.color"
      />
    </div>

    <div class="main-grid">
      <div class="left-column">
        <div class="section-card">
          <div class="section-header">
            <h3>📈 任务趋势</h3>
            <el-radio-group v-model="trendPeriod" size="small">
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container">
            <v-chart class="trend-chart" :option="trendChartOption" autoresize />
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3>🎯 项目进度</h3>
            <el-button link @click="viewAllProjects">查看全部</el-button>
          </div>
          <div class="projects-list">
            <div
              v-for="project in dashboardData?.value?.projects"
              :key="project.id"
              class="project-item"
            >
              <div class="project-info">
                <span class="project-name">{{ project.name }}</span>
                <div class="project-meta">
                  <el-tag size="small" :type="getProjectStatusType(project.status)">
                    {{ getProjectStatusLabel(project.status) }}
                  </el-tag>
                  <span class="member-count">{{ project.memberCount }} 人</span>
                </div>
              </div>
              <div class="project-progress">
                <el-progress
                  :percentage="project.progress"
                  :status="project.progress === 100 ? 'success' : ''"
                  :stroke-width="8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-column">
        <div class="section-card alerts-card">
          <div class="section-header">
            <h3>🔔 实时提醒</h3>
            <el-badge :value="dashboardData?.value?.alerts?.length" v-if="dashboardData?.value?.alerts?.length" />
          </div>
          <div class="alerts-list">
            <div
              v-for="alert in dashboardData?.value?.alerts"
              :key="alert.id"
              class="alert-item"
              :class="`alert-${alert.type}`"
            >
              <el-icon class="alert-icon">
                <Warning v-if="alert.type === 'warning'" />
                <CircleClose v-else-if="alert.type === 'danger'" />
                <InfoFilled v-else-if="alert.type === 'info'" />
                <SuccessFilled v-else />
              </el-icon>
              <div class="alert-content">
                <p class="alert-message">{{ alert.message }}</p>
                <span class="alert-time">{{ alert.time }}</span>
              </div>
            </div>
            <div v-if="!dashboardData?.value?.alerts?.length" class="empty-alerts">
              暂无提醒
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3>⏰ 今日待办</h3>
            <el-button link type="primary" @click="viewAllTasks">查看全部</el-button>
          </div>
          <div class="tasks-list">
            <div
              v-for="task in todayTasks"
              :key="task.id"
              class="task-item"
              :class="`status-${task.status}`"
            >
              <el-checkbox v-model="task.completed" @change="toggleTask(task)">
                <span class="task-title">{{ task.title }}</span>
              </el-checkbox>
              <div class="task-assignee">
                <el-avatar :size="24" :src="getAvatar(task.assignee)" />
                <span>{{ task.assignee }}</span>
              </div>
            </div>
            <div v-if="!todayTasks.length" class="empty-tasks">
              今日暂无待办任务
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3>👥 团队状态</h3>
          </div>
          <div class="team-stats">
            <div class="team-stat">
              <Gauge
                :value="dashboardData?.value?.team?.averageWorkload || 0"
                :max="100"
                label="平均负载"
                :color="getWorkloadColor"
              />
            </div>
            <div class="team-stat">
              <Gauge
                :value="dashboardData?.value?.team?.efficiency || 0"
                :max="100"
                label="团队效率"
                color="#67c23a"
              />
            </div>
          </div>
          <div class="team-members">
            <h4>活跃成员 ({{ dashboardData?.value?.team?.activeMembers || 0 }}/{{ dashboardData?.value?.team?.totalMembers || 0 }})</h4>
            <div class="member-avatars">
              <el-tooltip
                v-for="i in Math.min(dashboardData?.value?.team?.activeMembers || 0, 8)"
                :key="i"
                :content="`成员 ${i}`"
                placement="top"
              >
                <el-avatar :size="36" :src="getAvatar(`成员 ${i}`)" />
              </el-tooltip>
              <el-avatar
                v-if="(dashboardData?.value?.team?.activeMembers || 0) > 8"
                :size="36"
                class="more-members"
              >
                +{{ (dashboardData?.value?.team?.activeMembers || 0) - 8 }}
              </el-avatar>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import { Warning, CircleClose, InfoFilled, SuccessFilled } from '@element-plus/icons-vue';
import InfoBox from './components/InfoBox.vue';
import Gauge from './components/Gauge.vue';
import { getMyTaskNodes } from '@/api';
import type { DashboardData, Task } from './types';

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
]);

const dashboardData = inject<any>('dashboardData');

const trendPeriod = ref<'week' | 'month'>('week');
const myTasks = ref<any[]>([]);

// 加载个人任务数据
async function loadMyTasks() {
  try {
    console.log('TraditionalView: 开始加载个人任务...');
    const res = await getMyTaskNodes({ page: 1, pageSize: 100 });
    console.log('TraditionalView: getMyTaskNodes 响应:', res);
    const data = res?.data?.data || {};
    const executorTasks = data.executor_task || [];
    const leaderTasks = data.leader_task || [];
    myTasks.value = [...executorTasks, ...leaderTasks];
    console.log('TraditionalView: 个人任务加载完成:', myTasks.value.length, '个任务');
  } catch (e) {
    console.error('TraditionalView: 加载个人任务失败:', e);
  }
}

onMounted(() => {
  loadMyTasks();
});

// 传统仪表盘显示个人任务统计
const taskStats = computed(() => {
  const total = myTasks.value.length;
  const pending = myTasks.value.filter((t: any) => t.status === 0).length;
  const inProgress = myTasks.value.filter((t: any) => t.status === 1).length;
  const completed = myTasks.value.filter((t: any) => t.status === 2).length;
  
  return [
    { icon: 'Document', label: '总任务', value: total, trend: 12, color: '#409eff' },
    { icon: 'Clock', label: '待处理', value: pending, trend: -5, color: '#e6a23c' },
    { icon: 'Loading', label: '进行中', value: inProgress, trend: 8, color: '#409eff' },
    { icon: 'CircleCheck', label: '已完成', value: completed, trend: 15, color: '#67c23a' }
  ];
});

const todayTasks = ref<(Task & { completed?: boolean })[]>([
  { id: '1', title: '评审设计文档', status: 'pending', assignee: '张三', dueDate: '2026-02-03', completed: false },
  { id: '2', title: '修复登录Bug', status: 'in_progress', assignee: '李四', dueDate: '2026-02-03', completed: false },
  { id: '3', title: '更新API文档', status: 'completed', assignee: '王五', dueDate: '2026-02-03', completed: true },
  { id: '4', title: '代码审查', status: 'pending', assignee: '赵六', dueDate: '2026-02-03', completed: false }
]);

const trendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['新建', '完成'],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: trendPeriod.value === 'week'
      ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      : ['1日', '5日', '10日', '15日', '20日', '25日', '30日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '新建',
      type: 'line',
      smooth: true,
      data: trendPeriod.value === 'week'
        ? [12, 18, 15, 22, 28, 20, 16]
        : [45, 52, 48, 60, 55, 68, 72],
      itemStyle: { color: '#409eff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ]
        }
      }
    },
    {
      name: '完成',
      type: 'line',
      smooth: true,
      data: trendPeriod.value === 'week'
        ? [8, 12, 18, 15, 20, 14, 10]
        : [38, 42, 50, 48, 58, 62, 65],
      itemStyle: { color: '#67c23a' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ]
        }
      }
    }
  ]
}));

const getWorkloadColor = computed(() => {
  const workload = dashboardData?.value?.team?.averageWorkload || 0;
  if (workload > 85) return '#f56c6c';
  if (workload > 70) return '#e6a23c';
  return '#67c23a';
});

const getProjectStatusType = (status: string) => {
  const types: Record<string, 'success' | 'info' | 'warning'> = {
    active: 'info',
    completed: 'success',
    paused: 'warning'
  };
  return types[status] || 'info';
};

const getProjectStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停'
  };
  return labels[status] || status;
};

const getAvatar = (name: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
};

const toggleTask = (task: Task & { completed?: boolean }) => {
  if (task.completed) {
    task.status = 'completed';
  }
};

const viewAllProjects = () => {
  console.log('查看全部项目');
};

const viewAllTasks = () => {
  console.log('查看全部任务');
};
</script>

<style scoped>
.traditional-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.chart-container {
  height: 280px;
}

.trend-chart {
  width: 100%;
  height: 100%;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-name {
  font-weight: 500;
  color: #303133;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-count {
  font-size: 12px;
  color: #909399;
}

.project-progress {
  width: 100%;
}

.alerts-card {
  max-height: 300px;
  overflow: hidden;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 220px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
}

.alert-item.alert-warning {
  background: #fdf6ec;
}

.alert-item.alert-danger {
  background: #fef0f0;
}

.alert-item.alert-info {
  background: #f4f4f5;
}

.alert-item.alert-success {
  background: #f0f9eb;
}

.alert-icon {
  font-size: 20px;
}

.alert-warning .alert-icon {
  color: #e6a23c;
}

.alert-danger .alert-icon {
  color: #f56c6c;
}

.alert-info .alert-icon {
  color: #909399;
}

.alert-success .alert-icon {
  color: #67c23a;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 14px;
  color: #303133;
  margin: 0 0 4px 0;
}

.alert-time {
  font-size: 12px;
  color: #909399;
}

.empty-alerts,
.empty-tasks {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.task-item.status-completed {
  opacity: 0.6;
}

.task-item.status-completed .task-title {
  text-decoration: line-through;
}

.task-title {
  font-size: 14px;
  color: #303133;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.team-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.team-stat {
  display: flex;
  justify-content: center;
}

.team-members h4 {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin: 0 0 12px 0;
}

.member-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.more-members {
  background: #409eff;
  color: #fff;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
