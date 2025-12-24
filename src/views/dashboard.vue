<template>
  <div class="dashboard">
    <!-- 顶部欢迎 -->
    <div class="welcome-bar">
      <div class="welcome-left">
        <h1>{{ greeting }}，{{ username }} 👋</h1>
        <p>这是你的工作概览</p>
      </div>
      <div class="welcome-right">
        <span class="date-text">{{ currentDate }}</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon blue"><el-icon><DataLine /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value"><countup :end="metrics.totalTasks" :options="{ duration: 1 }" /></div>
          <div class="stat-label">总任务</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><el-icon><Clock /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value"><countup :end="metrics.pendingApprovals" :options="{ duration: 1 }" /></div>
          <div class="stat-label">待审批</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><el-icon><Check /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value"><countup :end="metrics.completed" :options="{ duration: 1 }" /></div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><el-icon><Warning /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value"><countup :end="metrics.critical" :options="{ duration: 1 }" /></div>
          <div class="stat-label">紧急</div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="charts-row">
      <div class="chart-box">
        <div class="box-header">任务状态</div>
        <div class="box-body">
          <v-chart v-if="!statusChartEmpty" :option="statusChartOption" class="chart" autoresize />
          <el-empty v-else description="暂无数据" :image-size="60" />
        </div>
      </div>
      <div class="chart-box">
        <div class="box-header">优先级分布</div>
        <div class="box-body">
          <v-chart v-if="!priorityChartEmpty" :option="priorityChartOption" class="chart" autoresize />
          <el-empty v-else description="暂无数据" :image-size="60" />
        </div>
      </div>
    </div>

    <!-- 任务视图 -->
    <div class="task-section">
      <div class="section-header">
        <span class="section-title">任务视图</span>
        <div class="view-tabs">
          <button :class="{ active: activeView === 'kanban' }" @click="activeView = 'kanban'">看板</button>
          <button :class="{ active: activeView === 'gantt' }" @click="activeView = 'gantt'">甘特图</button>
        </div>
      </div>
      <div class="section-body">
        <DashboardKanban v-if="activeView === 'kanban'" :department-id="departmentId" />
        <DepartmentGantt v-else :department-id="departmentId" />
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
import { DataLine, Clock, Check, Warning } from '@element-plus/icons-vue';
import { getHandoverList, listTasks, getMyEmployee, getMyTaskNodes } from '@/api';
import { useUserStore } from '@/store/user';
import countup from '@/components/countup.vue';
import DashboardKanban from '@/components/DashboardKanban.vue';
import DepartmentGantt from '@/components/DepartmentGantt.vue';

use([CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, EchartsPie, BarChart]);

const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');
const departmentId = ref('');
const activeView = ref('kanban');

const currentDate = computed(() => {
  const d = new Date();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const metrics = ref({ totalTasks: 0, pendingApprovals: 0, completed: 0, critical: 0 });
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

    if (departmentId.value) {
      const res = await listTasks({ page: 1, pageSize: 100, departmentId: departmentId.value });
      const list = res.data?.data?.list || [];
      
      metrics.value.totalTasks = list.length;
      metrics.value.completed = list.filter((it: any) => (it.progress ?? 0) >= 100 || (it.status ?? 0) === 2).length;
      metrics.value.critical = list.filter((it: any) => (it.priority ?? 3) === 1).length;

      buildCharts(list);
    } else {
      const res = await getMyTaskNodes({ page: 1, pageSize: 100 });
      const data = res.data?.data || {};
      const allTasks = [...(data.executor_task || []), ...(data.leader_task || [])];
      
      metrics.value.totalTasks = allTasks.length;
      metrics.value.completed = allTasks.filter((it: any) => (it.progress ?? 0) >= 100 || (it.status ?? 0) === 2).length;
      metrics.value.critical = allTasks.filter((it: any) => (it.nodeType ?? it.priority ?? 3) === 1).length;

      buildCharts(allTasks);
    }

    try {
      const handoverRes = await getHandoverList({ page: 1, pageSize: 1, status: 0 });
      metrics.value.pendingApprovals = handoverRes.data?.data?.total || 0;
    } catch (e) {
      console.error('加载待审批失败:', e);
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
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, left: 'center', itemGap: 16, textStyle: { color: '#666', fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: statusData.done, name: '已完成', itemStyle: { color: '#10b981' } },
          { value: statusData.inProgress, name: '进行中', itemStyle: { color: '#3b82f6' } },
          { value: statusData.review, name: '审核中', itemStyle: { color: '#f59e0b' } },
          { value: statusData.todo, name: '待办', itemStyle: { color: '#9ca3af' } }
        ]
      }]
    };
  }

  if (total2 > 0) {
    priorityChartOption.value = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['低', '中', '高', '紧急'],
        axisLabel: { color: '#666' },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLine: { show: false }
      },
      series: [{
        type: 'bar',
        data: [
          { value: priorityData.low, itemStyle: { color: '#9ca3af', borderRadius: [4, 4, 0, 0] } },
          { value: priorityData.medium, itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] } },
          { value: priorityData.high, itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } },
          { value: priorityData.critical, itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] } }
        ],
        barWidth: '50%'
      }]
    };
  }
}

onMounted(loadData);
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background: #f9fafb;
  min-height: 100vh;
}

/* 欢迎栏 */
.welcome-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.welcome-left h1 {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px;
}

.welcome-left p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.date-text {
  font-size: 14px;
  color: #6b7280;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #e5e7eb;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.stat-icon.blue { background: #eff6ff; color: #3b82f6; }
.stat-icon.orange { background: #fff7ed; color: #f59e0b; }
.stat-icon.green { background: #ecfdf5; color: #10b981; }
.stat-icon.red { background: #fef2f2; color: #ef4444; }

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

/* 图表区 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-box {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.box-header {
  padding: 14px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
}

.box-body {
  padding: 16px;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart {
  width: 100%;
  height: 220px;
}

/* 任务视图 */
.task-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #f3f4f6;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.view-tabs {
  display: flex;
  gap: 4px;
  background: #f3f4f6;
  padding: 3px;
  border-radius: 6px;
}

.view-tabs button {
  padding: 6px 14px;
  font-size: 13px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.view-tabs button.active {
  background: #fff;
  color: #1f2937;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.section-body {
  min-height: 300px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard {
    padding: 16px;
  }
  .stats-row {
    grid-template-columns: 1fr;
  }
  .welcome-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
