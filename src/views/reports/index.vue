<template>
  <div class="reports-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">统计报表</h1>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <el-segmented v-model="scope" :options="scopeOptions" size="default" @change="loadData" />
      <el-select v-model="timePeriod" placeholder="时间范围" style="width: 160px" @change="loadData">
        <el-option label="今天" value="today" />
        <el-option label="最近7天" value="7days" />
        <el-option label="最近30天" value="30days" />
        <el-option label="最近90天" value="90days" />
        <el-option label="本年度" value="year" />
      </el-select>
      <el-button :icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
      <div class="last-updated">
        最后更新: {{ lastUpdated }}
      </div>
    </div>

    <!-- Stats Grid - 6 cards with more metrics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-total">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            <path d="M9 12h6M9 16h6"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.totalTasks }}</span>
          <span class="stat-label">总任务数</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-completed">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <path d="M22 4L12 14.01l-3-3"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ completionRate }}%</span>
          <span class="stat-label">完成率</span>
        </div>
        <div class="stat-progress">
          <div class="progress-bar" :style="{ width: completionRate + '%' }"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-overdue">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.overdueTasks }}</span>
          <span class="stat-label">逾期任务</span>
        </div>
        <span v-if="stats.overdueTasks > 0" class="stat-dot stat-dot-danger"></span>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-avg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.avgCompletionDays }}</span>
          <span class="stat-label">平均完成天数</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-ontime">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <path d="M22 4L12 14.01l-3-3"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.onTimeRate }}%</span>
          <span class="stat-label">按时完成率</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.activeMembers }}</span>
          <span class="stat-label">活跃成员</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <el-empty v-if="!loading && stats.totalTasks === 0" description="暂无统计数据" :image-size="120">
      <template #description>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-3);">
          当前没有任务数据可供统计分析
        </p>
      </template>
    </el-empty>

    <!-- Charts Section - 4 Charts in 2x2 Grid -->
    <div v-if="stats.totalTasks > 0" class="charts-section">
      <!-- Task Status Distribution -->
      <div class="chart-card">
        <div class="card-header">
          <span class="header-title">任务状态分布</span>
          <span class="header-subtitle">完成/进行/逾期</span>
        </div>
        <div class="card-body">
          <v-chart v-if="!statusChartEmpty" :option="statusChartOption" class="chart" autoresize />
          <div v-else class="empty-chart">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <p>暂无状态数据</p>
          </div>
        </div>
      </div>

      <!-- Priority Distribution -->
      <div class="chart-card">
        <div class="card-header">
          <span class="header-title">优先级分布</span>
          <span class="header-subtitle">任务优先级统计</span>
        </div>
        <div class="card-body">
          <v-chart v-if="!priorityChartEmpty" :option="priorityChartOption" class="chart" autoresize />
          <div v-else class="empty-chart">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <p>暂无优先级数据</p>
          </div>
        </div>
      </div>

      <!-- 7-Day Trend -->
      <div class="chart-card chart-card-wide">
        <div class="card-header">
          <span class="header-title">最近7天趋势</span>
          <span class="header-subtitle">新建与完成</span>
        </div>
        <div class="card-body">
          <v-chart v-if="!trendChartEmpty" :option="trendChartOption" class="chart" autoresize />
          <div v-else class="empty-chart">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
              <path d="M3 3v18h18"/>
              <path d="M18 17l-5-5-4 4-6-6"/>
            </svg>
            <p>暂无趋势数据</p>
          </div>
        </div>
      </div>

      <!-- Top Performers -->
      <div class="chart-card chart-card-wide">
        <div class="card-header">
          <span class="header-title">员工绩效排行</span>
          <span class="header-subtitle">Top 10</span>
        </div>
        <div class="card-body">
          <v-chart v-if="!performerChartEmpty" :option="performerChartOption" class="chart" autoresize />
          <div v-else class="empty-chart">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8v6M23 11h-6"/>
            </svg>
            <p>暂无绩效数据</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getDashboardStats, listTasks, getMyTaskNodes, getMyEmployee } from '@/api';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { use } from 'echarts/core';
import { PieChart as EchartsPie, BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';

use([CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, EchartsPie, BarChart, LineChart]);

// State
const loading = ref(false);
const scope = ref('personal');
const timePeriod = ref('30days');
const lastUpdated = ref('');
const departmentId = ref('');

const scopeOptions = [
  { label: '个人', value: 'personal' },
  { label: '部门', value: 'department' }
];

// Stats data
const stats = ref({
  totalTasks: 0,
  completedTasks: 0,
  pendingApprovals: 0,
  criticalTasks: 0,
  overdueTasks: 0,
  avgCompletionDays: 0,
  onTimeRate: 0,
  activeMembers: 0
});

// Chart data
const performerChartOption = ref<any>({});
const performerChartEmpty = ref(false);
const statusChartOption = ref<any>({});
const statusChartEmpty = ref(false);
const priorityChartOption = ref<any>({});
const priorityChartEmpty = ref(false);
const trendChartOption = ref<any>({});
const trendChartEmpty = ref(false);

// Computed
const completionRate = computed(() => {
  if (stats.value.totalTasks === 0) return 0;
  return Math.round((stats.value.completedTasks / stats.value.totalTasks) * 100);
});

// Methods
async function loadData() {
  loading.value = true;
  try {
    // Load employee info
    const empRes = await getMyEmployee();
    const emp = empRes?.data?.data || {};
    const rawDept = emp.departmentId ?? emp.DepartmentId ?? emp.department_id;
    departmentId.value = typeof rawDept === 'object' ? (rawDept?.String || '') : (rawDept != null ? String(rawDept) : '');

    // Load stats
    const res = await getDashboardStats({ scope: scope.value });
    if (res.data.code === 200 && res.data.data) {
      stats.value = res.data.data;
    }
    lastUpdated.value = new Date().toLocaleString('zh-CN');

    // Load chart data
    if (stats.value.totalTasks > 0) {
      await loadChartData();
    }
  } catch (error) {
    console.error('[Reports] 加载数据失败:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

async function loadChartData() {
  try {
    let list: any[] = [];
    
    if (scope.value === 'department' && departmentId.value) {
      const res = await listTasks({ page: 1, pageSize: 1000, departmentId: departmentId.value });
      list = res.data?.data?.list || [];
    } else {
      const res = await getMyTaskNodes({ page: 1, pageSize: 1000 });
      const data = res.data?.data || {};
      list = [...(data.executor_task || []), ...(data.leader_task || [])];
    }

    buildPerformerChart(list);
    buildStatusChart(list);
    buildPriorityChart(list);
    buildTrendChart(list);
    calculateAdvancedStats(list);
  } catch (error) {
    console.error('[Reports] 加载图表数据失败:', error);
    performerChartEmpty.value = true;
    statusChartEmpty.value = true;
    priorityChartEmpty.value = true;
    trendChartEmpty.value = true;
  }
}

function calculateAdvancedStats(list: any[]) {
  // Calculate overdue tasks
  const now = new Date().getTime();
  stats.value.overdueTasks = list.filter((task: any) => {
    const deadline = task.deadline ? new Date(task.deadline).getTime() : null;
    return deadline && deadline < now && (task.progress ?? 0) < 100;
  }).length;

  // Calculate average completion days
  const completedTasks = list.filter((task: any) => (task.progress ?? 0) >= 100);
  if (completedTasks.length > 0) {
    const totalDays = completedTasks.reduce((sum: number, task: any) => {
      const start = task.createdAt ? new Date(task.createdAt).getTime() : 0;
      const end = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
      const days = start && end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) : 0;
      return sum + days;
    }, 0);
    stats.value.avgCompletionDays = Math.round(totalDays / completedTasks.length);
  }

  // Calculate on-time completion rate
  const tasksWithDeadline = list.filter((task: any) => task.deadline && (task.progress ?? 0) >= 100);
  if (tasksWithDeadline.length > 0) {
    const onTimeTasks = tasksWithDeadline.filter((task: any) => {
      const deadline = new Date(task.deadline).getTime();
      const completed = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
      return completed <= deadline;
    }).length;
    stats.value.onTimeRate = Math.round((onTimeTasks / tasksWithDeadline.length) * 100);
  }

  // Calculate active members (unique executors in last 30 days)
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const activeExecutors = new Set();
  list.forEach((task: any) => {
    const updated = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
    if (updated > thirtyDaysAgo && task.executorId) {
      activeExecutors.add(task.executorId);
    }
  });
  stats.value.activeMembers = activeExecutors.size;
}

function buildPerformerChart(list: any[]) {
  // Calculate top performers by completion count
  const performerMap = new Map<string, { name: string; completed: number }>();
  
  list.filter((task: any) => (task.progress ?? 0) >= 100).forEach((task: any) => {
    const executorId = task.executorId || 'unknown';
    const executorName = task.executorName || '未知';
    if (!performerMap.has(executorId)) {
      performerMap.set(executorId, { name: executorName, completed: 0 });
    }
    performerMap.get(executorId)!.completed++;
  });

  const performers = Array.from(performerMap.values())
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 10);

  performerChartEmpty.value = performers.length === 0;

  if (performers.length > 0) {
    performerChartOption.value = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#fff',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        textStyle: { color: 'var(--text-primary)', fontSize: 13 },
        extraCssText: 'box-shadow: var(--shadow-md); border-radius: 8px;'
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: 'var(--text-muted)', fontSize: 12 },
        splitLine: { lineStyle: { color: 'var(--border-light)', type: 'dashed' } },
        axisLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: performers.map(p => p.name),
        axisLabel: { color: 'var(--text-secondary)', fontSize: 13 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        data: performers.map((p, idx) => ({
          value: p.completed,
          itemStyle: {
            color: idx < 3 ? '#059669' : '#1E3A5F',
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barWidth: '60%'
      }]
    };
  }
}

function buildStatusChart(list: any[]) {
  const now = new Date().getTime();
  
  const completed = list.filter((task: any) => (task.progress ?? 0) >= 100).length;
  const overdue = list.filter((task: any) => {
    const deadline = task.deadline ? new Date(task.deadline).getTime() : null;
    return deadline && deadline < now && (task.progress ?? 0) < 100;
  }).length;
  const inProgress = list.length - completed - overdue;

  statusChartEmpty.value = list.length === 0;

  if (list.length > 0) {
    statusChartOption.value = {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        textStyle: { color: 'var(--text-primary)', fontSize: 13 },
        extraCssText: 'box-shadow: var(--shadow-md); border-radius: 8px;',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: { color: 'var(--text-secondary)', fontSize: 12 }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{d}%',
          fontSize: 14,
          fontWeight: 'bold',
          color: 'var(--text-primary)'
        },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        data: [
          { value: completed, name: '已完成', itemStyle: { color: '#059669' } },
          { value: inProgress, name: '进行中', itemStyle: { color: '#0284C7' } },
          { value: overdue, name: '已逾期', itemStyle: { color: '#DC2626' } }
        ]
      }]
    };
  }
}

function buildPriorityChart(list: any[]) {
  const priorityMap = new Map<number, { name: string; count: number; color: string }>();
  priorityMap.set(1, { name: '低优先级', count: 0, color: '#94A3B8' });
  priorityMap.set(2, { name: '中优先级', count: 0, color: '#0284C7' });
  priorityMap.set(3, { name: '高优先级', count: 0, color: '#D97706' });
  priorityMap.set(4, { name: '紧急', count: 0, color: '#DC2626' });

  list.forEach((task: any) => {
    const priority = task.priority ?? 2;
    if (priorityMap.has(priority)) {
      priorityMap.get(priority)!.count++;
    }
  });

  const priorityData = Array.from(priorityMap.values()).filter(p => p.count > 0);
  priorityChartEmpty.value = priorityData.length === 0;

  if (priorityData.length > 0) {
    priorityChartOption.value = {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        textStyle: { color: 'var(--text-primary)', fontSize: 13 },
        extraCssText: 'box-shadow: var(--shadow-md); border-radius: 8px;',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: { color: 'var(--text-secondary)', fontSize: 12 }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{d}%',
          fontSize: 14,
          fontWeight: 'bold',
          color: 'var(--text-primary)'
        },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        data: priorityData.map(p => ({
          value: p.count,
          name: p.name,
          itemStyle: { color: p.color }
        }))
      }]
    };
  }
}

function buildTrendChart(list: any[]) {
  // Get last 7 days
  const now = new Date();
  const days: string[] = [];
  const createdCounts: number[] = [];
  const completedCounts: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    days.push(dateStr);

    const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();

    // Count created tasks
    const created = list.filter((task: any) => {
      const createdTime = task.createdAt ? new Date(task.createdAt).getTime() : 0;
      return createdTime >= dayStart && createdTime <= dayEnd;
    }).length;
    createdCounts.push(created);

    // Count completed tasks
    const completed = list.filter((task: any) => {
      const updatedTime = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
      return updatedTime >= dayStart && updatedTime <= dayEnd && (task.progress ?? 0) >= 100;
    }).length;
    completedCounts.push(completed);
  }

  trendChartEmpty.value = list.length === 0;

  if (list.length > 0) {
    trendChartOption.value = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        textStyle: { color: 'var(--text-primary)', fontSize: 13 },
        extraCssText: 'box-shadow: var(--shadow-md); border-radius: 8px;'
      },
      legend: {
        top: '5%',
        textStyle: { color: 'var(--text-secondary)', fontSize: 12 }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: days,
        axisLabel: { color: 'var(--text-muted)', fontSize: 12 },
        axisLine: { lineStyle: { color: 'var(--border-color)' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: 'var(--text-muted)', fontSize: 12 },
        splitLine: { lineStyle: { color: 'var(--border-light)', type: 'dashed' } },
        axisLine: { show: false }
      },
      series: [
        {
          name: '新建任务',
          type: 'line',
          smooth: true,
          data: createdCounts,
          itemStyle: { color: '#0284C7' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(2, 132, 199, 0.3)' },
                { offset: 1, color: 'rgba(2, 132, 199, 0.05)' }
              ]
            }
          }
        },
        {
          name: '完成任务',
          type: 'line',
          smooth: true,
          data: completedCounts,
          itemStyle: { color: '#059669' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(5, 150, 105, 0.3)' },
                { offset: 1, color: 'rgba(5, 150, 105, 0.05)' }
              ]
            }
          }
        }
      ]
    };
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.reports-page {
  padding: var(--space-6);
  background: var(--bg-page);
  min-height: calc(100vh - var(--header-height));
}

/* Header */
.page-header {
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.last-updated {
  margin-left: auto;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* Stats Grid - Bento Layout - 6 cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Stat Icons - Circular Background */
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 20px;
  height: 20px;
}

.stat-icon-total {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.stat-icon-pending {
  background: #FEF3C7;
  color: #D97706;
}

.stat-icon-completed {
  background: #D1FAE5;
  color: #059669;
}

.stat-icon-overdue {
  background: #FEE2E2;
  color: #DC2626;
}

.stat-icon-avg {
  background: #DBEAFE;
  color: #0284C7;
}

.stat-icon-ontime {
  background: #D1FAE5;
  color: #059669;
}

.stat-icon-active {
  background: #E0E7FF;
  color: #6366F1;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* Notification Dot */
.stat-dot {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  width: 8px;
  height: 8px;
  background: #D97706;
  border-radius: 50%;
}

.stat-dot-danger {
  background: #DC2626;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Progress Bar */
.stat-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--border-light);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #059669;
  transition: width 0.8s ease;
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .reports-page {
    padding: var(--space-4);
  }

  .filters-bar {
    flex-wrap: wrap;
  }

  .last-updated {
    width: 100%;
    margin-left: 0;
    margin-top: var(--space-2);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: var(--space-4);
  }

  .stat-value {
    font-size: var(--font-size-2xl);
  }
}

/* Dark Mode */
html.dark-mode .stat-icon-total {
  background: rgba(96, 165, 250, 0.15);
  color: #60A5FA;
}

html.dark-mode .stat-icon-pending {
  background: rgba(251, 191, 36, 0.15);
  color: #FBBF24;
}

html.dark-mode .stat-icon-completed {
  background: rgba(52, 211, 153, 0.15);
  color: #34D399;
}

html.dark-mode .stat-icon-overdue {
  background: rgba(248, 113, 113, 0.15);
  color: #F87171;
}

html.dark-mode .stat-icon-avg {
  background: rgba(96, 165, 250, 0.15);
  color: #60A5FA;
}

html.dark-mode .stat-icon-ontime {
  background: rgba(52, 211, 153, 0.15);
  color: #34D399;
}

html.dark-mode .stat-icon-active {
  background: rgba(129, 140, 248, 0.15);
  color: #818CF8;
}

/* Charts Section - 2x2 Grid Layout */
.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.chart-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Wide chart spans 2 columns */
.chart-card-wide {
  grid-column: span 2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-light);
}

.header-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.header-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.card-body {
  padding: var(--space-4);
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart {
  width: 100%;
  height: 240px;
}

.chart-tall {
  height: 300px;
}

/* Empty State */
.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--text-muted);
}

.empty-icon {
  opacity: 0.4;
}

.empty-chart p {
  font-size: var(--font-size-sm);
  margin: 0;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  
  .stat-dot-danger {
    animation: none;
  }
}

/* Responsive - Charts */
@media (max-width: 992px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
}
</style>
