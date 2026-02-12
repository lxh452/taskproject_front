<template>
  <div class="dashboard">
    <!-- 顶部切换栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="page-title">{{ greeting }}，{{ username }}</h1>
        <p class="page-subtitle">{{ currentDate }}</p>
      </div>
      <div class="header-center">
        <div class="view-mode-toggle">
          <button
            class="mode-btn"
            :class="{ active: dashboardMode === 'traditional' }"
            @click="dashboardMode = 'traditional'"
          >
            <el-icon><Odometer /></el-icon>
            <span>传统仪表盘</span>
          </button>
          <button
            class="mode-btn"
            :class="{ active: dashboardMode === 'rts' }"
            @click="dashboardMode = 'rts'"
          >
            <el-icon><Coordinate /></el-icon>
            <span>指挥模式</span>
          </button>
        </div>
      </div>
      <div class="header-right">
        <AiAssistant />
      </div>
    </div>

    <!-- 指挥模式 -->
    <template v-if="dashboardMode === 'rts'">
      <RTSCommandView @refresh="loadData" />
    </template>

    <!-- 传统仪表盘模式 -->
    <template v-else>
    <!-- 统计卡片 - Bento Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-total">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            <path d="M9 12h6M9 16h6"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value"><countup :end="metrics.totalTasks" :options="{ duration: 1 }" /></span>
          <span class="stat-label">总任务</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-pending">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value"><countup :end="metrics.pendingApprovals" :options="{ duration: 1 }" /></span>
          <span class="stat-label">待审批</span>
        </div>
        <span v-if="metrics.pendingApprovals > 0" class="stat-dot"></span>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-completed">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <path d="M22 4L12 14.01l-3-3"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value"><countup :end="metrics.completed" :options="{ duration: 1 }" /></span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="stat-progress">
          <div class="progress-bar" :style="{ width: completionRate + '%' }"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-critical">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value"><countup :end="metrics.critical" :options="{ duration: 1 }" /></span>
          <span class="stat-label">紧急任务</span>
        </div>
        <span v-if="metrics.critical > 0" class="stat-dot stat-dot-danger"></span>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-card">
        <div class="card-header">
          <span class="header-title">任务状态分布</span>
        </div>
        <div class="card-body">
          <v-chart v-if="!statusChartEmpty" :option="statusChartOption" class="chart" autoresize />
          <div v-else class="empty-chart">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            <p>暂无任务数据</p>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="header-title">优先级分布</span>
        </div>
        <div class="card-body">
          <v-chart v-if="!priorityChartEmpty" :option="priorityChartOption" class="chart" autoresize />
          <div v-else class="empty-chart">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            <p>暂无优先级数据</p>
          </div>
        </div>
      </div>

    </div>

    <!-- 任务视图区域 - 只看板 -->
    <div class="task-view-section">
      <div class="section-header">
        <div class="header-left">
          <h2 class="section-title">我的任务看板</h2>
          <span class="task-count">{{ metrics.totalTasks }} 个任务</span>
        </div>
      </div>
      <div class="section-body">
        <DashboardKanban :department-id="departmentId" />
      </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts" name="dashboard">
import { ref, onMounted, onActivated, computed, provide, watch } from 'vue';
import { useRouter } from 'vue-router';
import { use } from 'echarts/core';
import { PieChart as EchartsPie, BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { Odometer, Coordinate } from '@element-plus/icons-vue';
import { getMyEmployee, listTasks, getMyTaskNodes } from '@/api';
import { useUserStore } from '@/store/user';
import { clearDebounceForUrl } from '@/utils/request';
import countup from '@/components/countup.vue';
import DashboardKanban from '@/components/DashboardKanban.vue';
import AiAssistant from '@/components/AiAssistant.vue';
import RTSCommandView from './dashboard/RTSCommandView.vue';

use([CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, EchartsPie, BarChart, LineChart]);

const router = useRouter();
const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');
const departmentId = ref('');
// 仪表盘模式：仅在当前页面生命周期内有效，刷新后重置为传统模式
const dashboardMode = ref('traditional');

// 跳转到 AI 仪表盘
const goToAiDashboard = () => {
  router.push('/ai-dashboard');
};

const currentDate = computed(() => {
  const d = new Date();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
});

const completionRate = computed(() => {
  if (metrics.value.totalTasks === 0) return 0;
  return Math.round((metrics.value.completed / metrics.value.totalTasks) * 100);
});

const metrics = ref({ totalTasks: 0, pendingApprovals: 0, completed: 0, critical: 0 });
const taskList = ref<any[]>([]);
const statusChartOption = ref<any>({});
const priorityChartOption = ref<any>({});
const statusChartEmpty = ref(false);
const priorityChartEmpty = ref(false);

async function loadData() {
  try {
    const empRes = await getMyEmployee();
    const emp = empRes?.data?.data || {};
    username.value = emp.realName || emp.name || username.value;
    
    const rawDept = emp.departmentId ?? emp.DepartmentId ?? emp.department_id;
    departmentId.value = typeof rawDept === 'object' ? (rawDept?.String || '') : (rawDept != null ? String(rawDept) : '');

    // 传统仪表盘只加载个人任务数据
    let list: any[] = [];
    const res = await getMyTaskNodes({ page: 1, pageSize: 100 });
    const data = res.data?.data || {};
    list = [...(data.executor_task || []), ...(data.leader_task || [])];
    taskList.value = list;

    // 从任务列表计算指标
    metrics.value.totalTasks = list.length;
    metrics.value.completed = list.filter((t: any) => (t.status ?? t.nodeStatus ?? 0) === 2).length;
    metrics.value.critical = list.filter((t: any) => (t.priority ?? 2) === 4).length;
    // pendingApprovals 暂时设为0，因为需要额外的审批数据
    metrics.value.pendingApprovals = 0;

    // 统计任务状态分布
    const statusData = { done: 0, inProgress: 0, review: 0, todo: 0 };
    const priorityData = { low: 0, medium: 0, high: 0, critical: 0 };
    list.forEach((task: any) => {
      const s = task.status ?? task.nodeStatus ?? 0;
      if (s === 2) statusData.done++;
      else if (s === 1) statusData.inProgress++;
      else if (s === 3) statusData.review++;
      else statusData.todo++;

      const p = task.priority ?? 2;
      if (p === 1) priorityData.low++;
      else if (p === 2) priorityData.medium++;
      else if (p === 3) priorityData.high++;
      else if (p === 4) priorityData.critical++;
    });
    const total1 = statusData.done + statusData.inProgress + statusData.review + statusData.todo;
    const total2 = priorityData.low + priorityData.medium + priorityData.high + priorityData.critical;
    statusChartEmpty.value = total1 === 0;
    priorityChartEmpty.value = total2 === 0;

  // Swiss Minimalism 风格图表配色
  if (total1 > 0) {
    statusChartOption.value = {
      tooltip: { 
        trigger: 'item', 
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: '#fff',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        textStyle: { color: 'var(--text-primary)', fontSize: 13 },
        extraCssText: 'box-shadow: var(--shadow-md); border-radius: 8px;'
      },
      legend: { 
        bottom: 16, 
        left: 'center', 
        itemGap: 24, 
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: 'var(--text-secondary)', fontSize: 13 }
      },
      series: [{
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 6 },
        data: [
          { value: statusData.done, name: '已完成', itemStyle: { color: '#059669' } },
          { value: statusData.inProgress, name: '进行中', itemStyle: { color: '#1E3A5F' } },
          { value: statusData.review, name: '审核中', itemStyle: { color: '#D97706' } },
          { value: statusData.todo, name: '待办', itemStyle: { color: '#94A3B8' } }
        ]
      }]
    };
  }

  if (total2 > 0) {
    priorityChartOption.value = {
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' },
        backgroundColor: '#fff',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        textStyle: { color: 'var(--text-primary)', fontSize: 13 },
        extraCssText: 'box-shadow: var(--shadow-md); border-radius: 8px;'
      },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['低', '中', '高', '紧急'],
        axisLabel: { color: 'var(--text-secondary)', fontSize: 13 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: 'var(--text-muted)', fontSize: 12 },
        splitLine: { lineStyle: { color: 'var(--border-light)', type: 'dashed' } },
        axisLine: { show: false }
      },
      series: [{
        type: 'bar',
        data: [
          { value: priorityData.low, itemStyle: { color: '#94A3B8', borderRadius: [4, 4, 0, 0] } },
          { value: priorityData.medium, itemStyle: { color: '#0284C7', borderRadius: [4, 4, 0, 0] } },
          { value: priorityData.high, itemStyle: { color: '#D97706', borderRadius: [4, 4, 0, 0] } },
          { value: priorityData.critical, itemStyle: { color: '#DC2626', borderRadius: [4, 4, 0, 0] } }
        ],
        barWidth: '40%'
      }]
    };
  }
  } catch (error: any) {
    // 忽略防抖取消的请求，不显示错误提示
    if (error.isDebounce || (error.message && error.message.includes('防抖'))) {
      console.log('请求被防抖拦截，跳过错误提示');
      return;
    }
    console.error('加载仪表盘数据失败:', error);
  }
}

// 为 RTSCommandView 提供数据
const dashboardData = computed(() => ({
  tasks: {
    total: metrics.value.totalTasks,
    pending: metrics.value.pendingApprovals,
    inProgress: taskList.value.filter((t: any) => t.status === 1).length,
    completed: metrics.value.completed,
    overdue: metrics.value.critical,
    todayDue: 0
  },
  team: {
    totalMembers: 0,
    activeMembers: 0,
    averageWorkload: 75,
    efficiency: 85
  },
  projects: [],
  recentTasks: taskList.value.slice(0, 5),
  alerts: []
}));

const loading = ref(false);

provide('dashboardData', dashboardData);
provide('refreshDashboard', loadData);
provide('loading', loading);

onMounted(loadData);
// keep-alive 激活时重新加载数据
onActivated(() => {
  // 清除防抖记录，确保页面切换后能重新加载数据
  clearDebounceForUrl('/dashboard/stats');
  loadData();
});
</script>


<style scoped>
/* Dashboard Container */
.dashboard {
  padding: var(--space-6);
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* Dashboard Header - 顶部切换栏 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding: var(--space-5) var(--space-6);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

/* 视图模式切换按钮组 */
.view-mode-toggle {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.mode-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.mode-btn.active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.mode-btn .el-icon {
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

/* 全屏视图容器 */
.full-view-container {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: var(--space-5);
  min-height: calc(100vh - 200px);
}

/* Stats Grid - Bento Layout */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
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

.stat-icon-critical {
  background: #FEE2E2;
  color: #DC2626;
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

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.chart-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.chart-card-full {
  grid-column: 1 / -1; /* 占满整行 */
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

.chart-trend {
  height: 280px;
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

/* Task View Section */
.task-view-section {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.task-count {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* View Switcher */
.view-switcher {
  display: flex;
  gap: var(--space-1);
  background: var(--bg-secondary);
  padding: 3px;
  border-radius: var(--radius-md);
}

.switch-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.switch-btn:hover {
  color: var(--text-primary);
}

.switch-btn.active {
  background: var(--bg-primary);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.switch-btn svg {
  flex-shrink: 0;
}

.section-body {
  padding: var(--space-5);
  min-height: 400px;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-header {
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .header-center {
    order: 3;
    flex-basis: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 992px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: var(--space-4);
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-4);
  }

  .header-center {
    width: 100%;
    order: 2;
  }

  .view-mode-toggle {
    width: 100%;
    justify-content: center;
  }

  .mode-btn {
    flex: 1;
    justify-content: center;
    padding: var(--space-2) var(--space-2);
  }

  .mode-btn span {
    display: none;
  }

  .header-right {
    order: 3;
  }

  .page-title {
    font-size: var(--font-size-lg);
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .stat-card {
    padding: var(--space-4);
  }

  .stat-value {
    font-size: var(--font-size-2xl);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  .view-switcher {
    width: 100%;
  }

  .switch-btn {
    flex: 1;
    justify-content: center;
  }

  .section-body {
    padding: var(--space-4);
  }

  .full-view-container {
    padding: var(--space-3);
    min-height: calc(100vh - 180px);
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

html.dark-mode .stat-icon-critical {
  background: rgba(248, 113, 113, 0.15);
  color: #F87171;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
  
  .stat-dot-danger {
    animation: none;
  }
}
</style>
