<template>
  <div class="dashboard">
    <!-- 顶部欢迎区域 - 带渐变背景 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">{{ greeting }}，{{ username }} <span class="wave-emoji">👋</span></h1>
          <p class="welcome-subtitle">这是你的工作概览，今天也要加油哦！</p>
        </div>
        <div class="welcome-meta">
          <!-- AI助手小圆球 -->
          <AiAssistant />
          <div class="date-badge">
            <el-icon><Calendar /></el-icon>
            <span>{{ currentDate }}</span>
          </div>
        </div>
      </div>
      <div class="welcome-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
    </div>

    <!-- 统计卡片 - 带动画效果 -->
    <div class="stats-grid">
      <div class="stat-card stat-total" @mouseenter="animateCard($event)" @mouseleave="resetCard($event)">
        <div class="stat-icon-wrapper">
          <div class="stat-icon">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="stat-ring"></div>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            <countup :end="metrics.totalTasks" :options="{ duration: 1.5 }" />
          </div>
          <div class="stat-label">总任务</div>
        </div>
        <div class="stat-trend up">
          <el-icon><TrendCharts /></el-icon>
          <span>+12%</span>
        </div>
      </div>

      <div class="stat-card stat-pending" @mouseenter="animateCard($event)" @mouseleave="resetCard($event)">
        <div class="stat-icon-wrapper">
          <div class="stat-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-ring"></div>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            <countup :end="metrics.pendingApprovals" :options="{ duration: 1.5 }" />
          </div>
          <div class="stat-label">待审批</div>
        </div>
        <div class="stat-badge" v-if="metrics.pendingApprovals > 0">需处理</div>
      </div>

      <div class="stat-card stat-completed" @mouseenter="animateCard($event)" @mouseleave="resetCard($event)">
        <div class="stat-icon-wrapper">
          <div class="stat-icon">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-ring"></div>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            <countup :end="metrics.completed" :options="{ duration: 1.5 }" />
          </div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-progress">
          <div class="progress-bar" :style="{ width: completionRate + '%' }"></div>
        </div>
      </div>

      <div class="stat-card stat-critical" @mouseenter="animateCard($event)" @mouseleave="resetCard($event)">
        <div class="stat-icon-wrapper">
          <div class="stat-icon">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div class="stat-ring"></div>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            <countup :end="metrics.critical" :options="{ duration: 1.5 }" />
          </div>
          <div class="stat-label">紧急任务</div>
        </div>
        <div class="stat-pulse" v-if="metrics.critical > 0"></div>
      </div>
    </div>

    <!-- 图表区域 - 双列布局 -->
    <div class="charts-section">
      <div class="chart-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon class="title-icon"><PieChart /></el-icon>
            <span>任务状态分布</span>
          </div>
          <el-dropdown trigger="click">
            <el-button text :icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>导出数据</el-dropdown-item>
                <el-dropdown-item>刷新</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="card-body">
          <v-chart v-if="!statusChartEmpty" :option="statusChartOption" class="chart" autoresize />
          <div v-else class="empty-chart">
            <el-icon class="empty-icon"><DocumentRemove /></el-icon>
            <p>暂无任务数据</p>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon class="title-icon"><Histogram /></el-icon>
            <span>优先级分布</span>
          </div>
          <el-dropdown trigger="click">
            <el-button text :icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>导出数据</el-dropdown-item>
                <el-dropdown-item>刷新</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="card-body">
          <v-chart v-if="!priorityChartEmpty" :option="priorityChartOption" class="chart" autoresize />
          <div v-else class="empty-chart">
            <el-icon class="empty-icon"><DocumentRemove /></el-icon>
            <p>暂无优先级数据</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务视图区域 -->
    <div class="task-view-section">
      <div class="section-header">
        <div class="header-left">
          <h2 class="section-title">
            <el-icon class="title-icon"><Grid /></el-icon>
            任务视图
          </h2>
          <span class="task-count">共 {{ metrics.totalTasks }} 个任务</span>
        </div>
        <div class="header-right">
          <div class="view-switcher">
            <button 
              class="switch-btn" 
              :class="{ active: activeView === 'kanban' }" 
              @click="activeView = 'kanban'"
            >
              <el-icon><Menu /></el-icon>
              <span>看板</span>
            </button>
            <button 
              class="switch-btn" 
              :class="{ active: activeView === 'gantt' }" 
              @click="activeView = 'gantt'"
            >
              <el-icon><DataBoard /></el-icon>
              <span>甘特图</span>
            </button>
          </div>
        </div>
      </div>
      <div class="section-body">
        <transition name="fade-slide" mode="out-in">
          <DashboardKanban v-if="activeView === 'kanban'" :department-id="departmentId" :key="'kanban'" />
          <DepartmentGantt v-else :department-id="departmentId" :key="'gantt'" />
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="dashboard">
import { ref, onMounted, computed } from 'vue';
import { use } from 'echarts/core';
import { PieChart as EchartsPie, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { 
  DataLine, Clock, CircleCheckFilled, WarningFilled, Calendar, 
  TrendCharts, PieChart, Histogram, MoreFilled, DocumentRemove,
  Grid, Menu, DataBoard
} from '@element-plus/icons-vue';
import { getHandoverList, listTasks, getMyEmployee, getMyTaskNodes, getDashboardStats } from '@/api';
import { useUserStore } from '@/store/user';
import countup from '@/components/countup.vue';
import DashboardKanban from '@/components/DashboardKanban.vue';
import DepartmentGantt from '@/components/DepartmentGantt.vue';
import AiAssistant from '@/components/AiAssistant.vue';

use([CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, EchartsPie, BarChart]);

const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');
const departmentId = ref('');
const activeView = ref('kanban');

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
const statusChartOption = ref<any>({});
const priorityChartOption = ref<any>({});
const statusChartEmpty = ref(false);
const priorityChartEmpty = ref(false);

// 卡片动画
function animateCard(event: MouseEvent) {
  const card = event.currentTarget as HTMLElement;
  card.style.transform = 'translateY(-8px) scale(1.02)';
}

function resetCard(event: MouseEvent) {
  const card = event.currentTarget as HTMLElement;
  card.style.transform = 'translateY(0) scale(1)';
}

async function loadData() {
  try {
    const empRes = await getMyEmployee();
    const emp = empRes?.data?.data || {};
    username.value = emp.realName || emp.name || username.value;
    
    const rawDept = emp.departmentId ?? emp.DepartmentId ?? emp.department_id;
    departmentId.value = typeof rawDept === 'object' ? (rawDept?.String || '') : (rawDept != null ? String(rawDept) : '');

    // 使用新的仪表盘统计API获取四个数据容器的数据
    try {
      const statsRes = await getDashboardStats({ scope: 'personal' });
      const stats = statsRes?.data?.data || {};
      metrics.value.totalTasks = stats.totalTasks || 0;
      metrics.value.pendingApprovals = stats.pendingApprovals || 0;
      metrics.value.completed = stats.completedTasks || 0;
      metrics.value.critical = stats.criticalTasks || 0;
    } catch (e) {
      console.error('加载仪表盘统计失败:', e);
    }

    // 获取任务列表用于图表展示
    if (departmentId.value) {
      const res = await listTasks({ page: 1, pageSize: 100, departmentId: departmentId.value });
      const list = res.data?.data?.list || [];
      buildCharts(list);
    } else {
      const res = await getMyTaskNodes({ page: 1, pageSize: 100 });
      const data = res.data?.data || {};
      const allTasks = [...(data.executor_task || []), ...(data.leader_task || [])];
      buildCharts(allTasks);
    }
  } catch (e) {
    console.error('加载数据失败:', e);
    statusChartEmpty.value = true;
    priorityChartEmpty.value = true;
  }
}

function buildCharts(list: any[]) {
  const statusData = {
    done: list.filter((it: any) => (it.progress ?? 0) >= 100 || (it.status ?? 0) === 2).length,
    inProgress: list.filter((it: any) => ((it.status ?? 0) === 1 || (it.status ?? 0) === 0) && (it.progress ?? 0) < 100).length,
    review: list.filter((it: any) => (it.status ?? 0) === 3).length,
    todo: list.filter((it: any) => (it.status ?? 0) === 0 && (it.progress ?? 0) === 0).length,
  };

  const priorityData = {
    low: list.filter((it: any) => (it.priority ?? 3) === 4).length,
    medium: list.filter((it: any) => (it.priority ?? 3) === 3).length,
    high: list.filter((it: any) => (it.priority ?? 3) === 2).length,
    critical: list.filter((it: any) => (it.priority ?? 3) === 1).length,
  };

  const total1 = statusData.done + statusData.inProgress + statusData.review + statusData.todo;
  const total2 = priorityData.low + priorityData.medium + priorityData.high + priorityData.critical;

  statusChartEmpty.value = total1 === 0;
  priorityChartEmpty.value = total2 === 0;

  if (total1 > 0) {
    statusChartOption.value = {
      tooltip: { 
        trigger: 'item', 
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
      },
      legend: { 
        bottom: 10, 
        left: 'center', 
        itemGap: 20, 
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { color: '#6b7280', fontSize: 13 }
      },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '42%'],
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.15)' }
        },
        data: [
          { value: statusData.done, name: '已完成', itemStyle: { color: '#10b981' } },
          { value: statusData.inProgress, name: '进行中', itemStyle: { color: '#4f46e5' } },
          { value: statusData.review, name: '审核中', itemStyle: { color: '#f59e0b' } },
          { value: statusData.todo, name: '待办', itemStyle: { color: '#9ca3af' } }
        ]
      }]
    };
  }

  if (total2 > 0) {
    priorityChartOption.value = {
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['低优先级', '中优先级', '高优先级', '紧急'],
        axisLabel: { color: '#6b7280', fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
        axisLine: { show: false }
      },
      series: [{
        type: 'bar',
        data: [
          { value: priorityData.low, itemStyle: { color: '#9ca3af', borderRadius: [6, 6, 0, 0] } },
          { value: priorityData.medium, itemStyle: { color: '#4f46e5', borderRadius: [6, 6, 0, 0] } },
          { value: priorityData.high, itemStyle: { color: '#f59e0b', borderRadius: [6, 6, 0, 0] } },
          { value: priorityData.critical, itemStyle: { color: '#ef4444', borderRadius: [6, 6, 0, 0] } }
        ],
        barWidth: '45%',
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' }
        }
      }]
    };
  }
}

onMounted(loadData);
</script>


<style scoped>
/* ==================== Dashboard Page Container ==================== */
.dashboard {
  padding: var(--page-padding, 24px);
  min-height: 100vh;
  background: var(--bg-page);
}

/* ==================== Welcome Section ==================== */
.welcome-section {
  position: relative;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
  border-radius: var(--radius-xl, 16px);
  padding: 32px 40px;
  margin-bottom: 28px;
  overflow: hidden;
  box-shadow: 0 10px 40px -10px rgba(79, 70, 229, 0.4);
}

.welcome-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text {
  color: #fff;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.wave-emoji {
  display: inline-block;
  animation: wave 2.5s ease-in-out infinite;
  transform-origin: 70% 70%;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60%, 100% { transform: rotate(0deg); }
}

.welcome-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.welcome-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.date-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 10px 18px;
  border-radius: var(--radius-full, 9999px);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.date-badge .el-icon {
  font-size: 16px;
}

/* Decoration Circles */
.welcome-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -60px;
  right: -40px;
  animation: float 8s ease-in-out infinite;
}

.circle-2 {
  width: 120px;
  height: 120px;
  bottom: -30px;
  right: 150px;
  animation: float 6s ease-in-out infinite reverse;
}

.circle-3 {
  width: 80px;
  height: 80px;
  top: 20px;
  right: 280px;
  animation: float 7s ease-in-out infinite 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

/* ==================== Stats Grid ==================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

/* ==================== Stat Card ==================== */
.stat-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-lg, 12px);
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  cursor: pointer;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 12px 12px 0 0;
  transition: height 0.3s ease;
}

.stat-card:hover::before {
  height: 4px;
}

/* Card Variants */
.stat-total::before { background: linear-gradient(90deg, #4f46e5, #7c3aed); }
.stat-pending::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.stat-completed::before { background: linear-gradient(90deg, #10b981, #34d399); }
.stat-critical::before { background: linear-gradient(90deg, #ef4444, #f87171); }

/* Icon Wrapper */
.stat-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.stat-icon .el-icon {
  font-size: 24px;
  color: #fff;
}

.stat-total .stat-icon { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
.stat-pending .stat-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.stat-completed .stat-icon { background: linear-gradient(135deg, #10b981, #34d399); }
.stat-critical .stat-icon { background: linear-gradient(135deg, #ef4444, #f87171); }

/* Icon Ring Animation */
.stat-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg, 12px);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: all 0.3s ease;
}

.stat-total .stat-ring { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
.stat-pending .stat-ring { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
.stat-completed .stat-ring { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
.stat-critical .stat-ring { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }

.stat-card:hover .stat-ring {
  opacity: 1;
  animation: ring-pulse 1.5s ease-out infinite;
}

@keyframes ring-pulse {
  0% { 
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  100% { 
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

/* Stat Content */
.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 500;
}

/* Stat Trend */
.stat-trend {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: var(--radius-full, 9999px);
}

.stat-trend.up {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-trend.down {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.stat-trend .el-icon {
  font-size: 14px;
}

/* Stat Badge */
.stat-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full, 9999px);
  animation: badge-bounce 2s ease-in-out infinite;
}

@keyframes badge-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* Stat Progress */
.stat-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--border-light);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 0 0 0 12px;
  transition: width 1s ease-out;
}

/* Stat Pulse (for critical) */
.stat-pulse {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  animation: critical-pulse 1.5s ease-in-out infinite;
}

@keyframes critical-pulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% { 
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

/* ==================== Charts Section ==================== */
.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.chart-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-light);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.title-icon {
  font-size: 18px;
  color: var(--color-primary);
}

.card-body {
  padding: 20px;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart {
  width: 100%;
  height: 260px;
}

/* Empty Chart State */
.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-chart p {
  font-size: 14px;
  margin: 0;
}

/* ==================== Task View Section ==================== */
.task-view-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-title .title-icon {
  font-size: 20px;
  color: var(--color-primary);
}

.task-count {
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg-hover);
  padding: 4px 12px;
  border-radius: var(--radius-full, 9999px);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* View Switcher */
.view-switcher {
  display: flex;
  background: var(--bg-hover);
  border-radius: var(--radius-full, 9999px);
  padding: 4px;
  gap: 4px;
}

.switch-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: var(--radius-full, 9999px);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-btn:hover {
  color: var(--text-primary);
}

.switch-btn.active {
  background: var(--bg-card);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.switch-btn .el-icon {
  font-size: 16px;
}

.section-body {
  padding: 20px;
  min-height: 400px;
}

/* ==================== Fade Slide Transition ==================== */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ==================== Responsive Design ==================== */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  
  .welcome-section {
    padding: 24px;
  }
  
  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .welcome-title {
    font-size: 22px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .stat-value {
    font-size: 28px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 20px;
  }
  
  .header-right {
    width: 100%;
  }
  
  .view-switcher {
    width: 100%;
    justify-content: center;
  }
  
  .switch-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .welcome-section {
    padding: 20px;
  }
  
  .welcome-title {
    font-size: 20px;
  }
  
  .date-badge {
    padding: 8px 14px;
    font-size: 13px;
  }
  
  .stat-icon {
    width: 44px;
    height: 44px;
  }
  
  .stat-icon .el-icon {
    font-size: 20px;
  }
  
  .stat-value {
    font-size: 24px;
  }
}

/* ==================== Dark Mode Adjustments ==================== */
html.dark-mode .welcome-section {
  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 50%, #7c3aed 100%);
  box-shadow: 0 10px 40px -10px rgba(79, 70, 229, 0.3);
}

html.dark-mode .stat-card {
  background: var(--bg-card);
  border-color: var(--border-color);
}

html.dark-mode .chart-card {
  background: var(--bg-card);
  border-color: var(--border-color);
}

html.dark-mode .task-view-section {
  background: var(--bg-card);
  border-color: var(--border-color);
}

html.dark-mode .view-switcher {
  background: var(--bg-hover);
}

html.dark-mode .switch-btn.active {
  background: var(--bg-active);
}

html.dark-mode .task-count {
  background: var(--bg-active);
}
</style>
