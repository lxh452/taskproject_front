<template>
    <div class="dashboard-page">
        <!-- 欢迎区域 -->
        <div class="welcome-section">
            <div class="welcome-content">
                <h1 class="welcome-title">欢迎回来，{{ username }} 👋</h1>
                <p class="welcome-subtitle">这里是您的工作概览，祝您今天工作顺利！</p>
            </div>
            <div class="welcome-date">
                <div class="date-text">{{ currentDate }}</div>
                <div class="week-text">{{ currentWeek }}</div>
            </div>
        </div>

        <!-- 指标卡片 -->
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon primary">
                        <el-icon><DataLine /></el-icon>
                    </div>
                    <el-tag type="info" size="small" effect="plain">本周</el-tag>
                </div>
                <div class="metric-body">
                    <div class="metric-value">{{ metrics.totalTasks }}</div>
                    <div class="metric-label">总任务数</div>
                </div>
                <div class="metric-trend up">
                    <el-icon><Top /></el-icon>
                    <span>12% 较上周</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon warning">
                        <el-icon><Clock /></el-icon>
                    </div>
                    <el-tag type="warning" size="small" effect="plain">待处理</el-tag>
                </div>
                <div class="metric-body">
                    <div class="metric-value">{{ metrics.pendingApprovals }}</div>
                    <div class="metric-label">待审批</div>
                </div>
                <div class="metric-footer">
                    <span class="footer-hint">需要您的关注</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon success">
                        <el-icon><Check /></el-icon>
                    </div>
                    <el-tag type="success" size="small" effect="plain">已完成</el-tag>
                </div>
                <div class="metric-body">
                    <div class="metric-value">{{ metrics.completed }}</div>
                    <div class="metric-label">完成任务</div>
                </div>
                <div class="metric-trend up">
                    <el-icon><Top /></el-icon>
                    <span>8% 较上周</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon danger">
                        <el-icon><Warning /></el-icon>
                    </div>
                    <el-tag type="danger" size="small" effect="plain">紧急</el-tag>
                </div>
                <div class="metric-body">
                    <div class="metric-value">{{ metrics.critical }}</div>
                    <div class="metric-label">紧急任务</div>
                </div>
                <div class="metric-footer">
                    <span class="footer-hint warning">需要优先处理</span>
                </div>
            </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-grid">
            <div class="chart-card">
                <div class="card-header">
                    <div class="card-title">
                        <el-icon><PieChart /></el-icon>
                        <span>任务状态分布</span>
                    </div>
                    <el-dropdown trigger="click">
                        <el-button text :icon="MoreFilled" />
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item>导出图片</el-dropdown-item>
                                <el-dropdown-item>刷新数据</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
                <div class="card-body">
                    <v-chart v-if="!statusChartEmpty" :option="statusChartOption" class="chart" autoresize />
                    <div v-else class="chart-empty">
                        <el-empty description="暂无数据" :image-size="80" />
                    </div>
                </div>
            </div>

            <div class="chart-card">
                <div class="card-header">
                    <div class="card-title">
                        <el-icon><Histogram /></el-icon>
                        <span>优先级分布</span>
                    </div>
                    <el-dropdown trigger="click">
                        <el-button text :icon="MoreFilled" />
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item>导出图片</el-dropdown-item>
                                <el-dropdown-item>刷新数据</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
                <div class="card-body">
                    <v-chart v-if="!priorityChartEmpty" :option="priorityChartOption" class="chart" autoresize />
                    <div v-else class="chart-empty">
                        <el-empty description="暂无数据" :image-size="80" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" name="dashboard">
import { ref, onMounted } from 'vue';
import { use } from 'echarts/core';
import { PieChart as EchartsPie, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { DataLine, Clock, Check, Warning, Top, PieChart, Histogram, MoreFilled } from '@element-plus/icons-vue';
import { getHandoverList, listTasks, getMyEmployee, getMyTaskNodes } from '@/api';
import { useUserStore } from '@/store/user';

use([CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, EchartsPie, BarChart]);

const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');

const currentDate = ref('');
const currentWeek = ref('');

const metrics = ref({ 
    totalTasks: 0, 
    pendingApprovals: 0, 
    completed: 0, 
    critical: 0 
});

const statusChartOption = ref<any>({});
const priorityChartOption = ref<any>({});
const statusChartEmpty = ref(false);
const priorityChartEmpty = ref(false);

function initDate() {
    const now = new Date();
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    currentWeek.value = weekDays[now.getDay()];
}

async function loadData() {
    try {
        const empRes = await getMyEmployee();
        const emp = empRes?.data?.data || {};
        username.value = emp.realName || emp.name || username.value;
        
        const rawDept = (emp.departmentId ?? emp.DepartmentId ?? emp.department_id);
        const departmentId = typeof rawDept === 'object' ? (rawDept?.String || rawDept?.string || '') : (rawDept != null ? String(rawDept) : '');

        if (departmentId) {
            const res = await listTasks({ page: 1, pageSize: 100, departmentId });
            const responseData = res.data?.data || res.data || {};
            const list = responseData.list || [];
        
            metrics.value.totalTasks = list.length;
            metrics.value.completed = list.filter((it: any) => {
                const progress = it.progress ?? it.Progress ?? 0;
                const status = it.status ?? it.Status ?? 0;
                return progress >= 100 || status === 2;
            }).length;
            metrics.value.critical = list.filter((it: any) => {
                const priority = it.priority ?? it.Priority ?? 3;
                return priority === 1;
            }).length;

            const statusData = {
                done: list.filter((it: any) => {
                    const progress = it.progress ?? it.Progress ?? 0;
                    const status = it.status ?? it.Status ?? 0;
                    return progress >= 100 || status === 2;
                }).length,
                inProgress: list.filter((it: any) => {
                    const status = it.status ?? it.Status ?? 0;
                    const progress = it.progress ?? it.Progress ?? 0;
                    return (status === 1 || status === 0) && progress < 100;
                }).length,
                review: list.filter((it: any) => {
                    const status = it.status ?? it.Status ?? 0;
                    return status === 3;
                }).length,
                todo: list.filter((it: any) => {
                    const status = it.status ?? it.Status ?? 0;
                    const progress = it.progress ?? it.Progress ?? 0;
                    return status === 0 && progress === 0;
                }).length,
            };

            const priorityData = {
                low: list.filter((it: any) => (it.priority ?? it.Priority ?? 3) === 4).length,
                medium: list.filter((it: any) => (it.priority ?? it.Priority ?? 3) === 3).length,
                high: list.filter((it: any) => (it.priority ?? it.Priority ?? 3) === 2).length,
                critical: list.filter((it: any) => (it.priority ?? it.Priority ?? 3) === 1).length,
            };

            buildStatusChart(statusData);
            buildPriorityChart(priorityData);
        } else {
            const res = await getMyTaskNodes({ page: 1, pageSize: 100 });
            const responseData = res.data?.data || res.data || {};
            const executorTasks = responseData.executor_task || [];
            const leaderTasks = responseData.leader_task || [];
            const allTasks = [...executorTasks, ...leaderTasks];

            metrics.value.totalTasks = allTasks.length;
            metrics.value.completed = allTasks.filter((it: any) => {
                const progress = it.progress ?? 0;
                const status = it.status ?? it.nodeStatus ?? 0;
                return progress >= 100 || status === 2;
            }).length;
            metrics.value.critical = allTasks.filter((it: any) => {
                const priority = it.nodeType ?? it.priority ?? 3;
                return priority === 1;
            }).length;

            const statusData = {
                done: allTasks.filter((it: any) => {
                    const progress = it.progress ?? 0;
                    const status = it.status ?? it.nodeStatus ?? 0;
                    return progress >= 100 || status === 2;
                }).length,
                inProgress: allTasks.filter((it: any) => {
                    const status = it.status ?? it.nodeStatus ?? 0;
                    const progress = it.progress ?? 0;
                    return (status === 1 || status === 0) && progress < 100;
                }).length,
                review: allTasks.filter((it: any) => {
                    const status = it.status ?? it.nodeStatus ?? 0;
                    return status === 3;
                }).length,
                todo: allTasks.filter((it: any) => {
                    const status = it.status ?? it.nodeStatus ?? 0;
                    const progress = it.progress ?? 0;
                    return status === 0 && progress === 0;
                }).length,
            };

            const priorityData = {
                low: allTasks.filter((it: any) => (it.nodeType ?? it.priority ?? 3) === 4).length,
                medium: allTasks.filter((it: any) => (it.nodeType ?? it.priority ?? 3) === 3).length,
                high: allTasks.filter((it: any) => (it.nodeType ?? it.priority ?? 3) === 2).length,
                critical: allTasks.filter((it: any) => (it.nodeType ?? it.priority ?? 3) === 1).length,
            };

            buildStatusChart(statusData);
            buildPriorityChart(priorityData);
        }

        try {
            const handoverRes = await getHandoverList({ page: 1, pageSize: 1, status: 0 });
            const handoverData = handoverRes.data?.data || handoverRes.data || {};
            metrics.value.pendingApprovals = handoverData.total || 0;
        } catch (error: any) {
            console.error('加载待审批数据失败:', error);
        }
    } catch (error: any) {
        console.error('加载数据失败:', error);
        statusChartEmpty.value = true;
        priorityChartEmpty.value = true;
    }
}

function buildStatusChart(data: any) {
    const total = data.done + data.inProgress + data.review + data.todo;
    if (total === 0) {
        statusChartEmpty.value = true;
        return;
    }
    statusChartEmpty.value = false;

    statusChartOption.value = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)',
            backgroundColor: '#fff',
            borderColor: '#f1f5f9',
            borderWidth: 1,
            textStyle: { color: '#334155' }
        },
        legend: {
            bottom: 0,
            left: 'center',
            itemGap: 24,
            itemWidth: 12,
            itemHeight: 12,
            textStyle: { color: '#64748b', fontSize: 12 }
        },
        series: [
            {
                type: 'pie',
                radius: ['50%', '75%'],
                center: ['50%', '42%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 3
                },
                label: { show: false },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: '600'
                    },
                    scaleSize: 6
                },
                data: [
                    { value: data.done, name: '已完成', itemStyle: { color: '#10b981' } },
                    { value: data.inProgress, name: '进行中', itemStyle: { color: '#dc2626' } },
                    { value: data.review, name: '审核中', itemStyle: { color: '#f59e0b' } },
                    { value: data.todo, name: '待办', itemStyle: { color: '#94a3b8' } }
                ]
            }
        ]
    };
}

function buildPriorityChart(data: any) {
    const total = data.low + data.medium + data.high + data.critical;
    if (total === 0) {
        priorityChartEmpty.value = true;
        return;
    }
    priorityChartEmpty.value = false;

    priorityChartOption.value = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#fff',
            borderColor: '#f1f5f9',
            borderWidth: 1,
            textStyle: { color: '#334155' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '8%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['低', '中', '高', '紧急'],
            axisLabel: { color: '#64748b', fontSize: 12 },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#64748b', fontSize: 12 },
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
            axisLine: { show: false }
        },
        series: [
            {
                type: 'bar',
                data: [
                    { value: data.low, itemStyle: { color: '#94a3b8' } },
                    { value: data.medium, itemStyle: { color: '#dc2626' } },
                    { value: data.high, itemStyle: { color: '#f59e0b' } },
                    { value: data.critical, itemStyle: { color: '#ef4444' } }
                ],
                itemStyle: {
                    borderRadius: [6, 6, 0, 0]
                },
                barWidth: '50%'
            }
        ]
    };
}

onMounted(() => {
    initDate();
    loadData();
});
</script>

<style scoped>
.dashboard-page {
    padding: clamp(16px, 1.5vw, 24px);
    background: var(--bg-page);
    min-height: calc(100vh - clamp(56px, 8vh, 64px));
    width: 100%;
    box-sizing: border-box;
}

/* Welcome Section */
.welcome-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    background: var(--bg-card);
    border-radius: 16px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
}

.welcome-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 8px;
}

.welcome-subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
}

.welcome-date {
    text-align: right;
}

.date-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);
}

.week-text {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 4px;
}

/* Metrics Grid */
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: clamp(12px, 1.3vw, 20px);
    margin-bottom: clamp(16px, 1.5vw, 24px);
    width: 100%;
}

.metric-card {
    background: var(--bg-card);
    border-radius: clamp(12px, 1vw, 16px);
    padding: clamp(16px, 1.3vw, 24px);
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
}

.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.metric-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.metric-icon {
    width: clamp(40px, 3vw, 52px);
    height: clamp(40px, 3vw, 52px);
    border-radius: clamp(10px, 0.8vw, 14px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(18px, 1.4vw, 24px);
}

.metric-icon.primary {
    background: var(--color-primary-light);
    color: var(--color-primary);
}

.metric-icon.warning {
    background: #fef3c7;
    color: #d97706;
}

.metric-icon.success {
    background: #d1fae5;
    color: #059669;
}

.metric-icon.danger {
    background: #fee2e2;
    color: #dc2626;
}

.metric-body {
    margin-bottom: 12px;
}

.metric-value {
    font-size: clamp(24px, 2.2vw, 36px);
    font-weight: 700;
    color: var(--text-main);
    line-height: 1;
    margin-bottom: clamp(4px, 0.4vw, 8px);
}

.metric-label {
    font-size: clamp(12px, 0.9vw, 14px);
    color: var(--text-secondary);
}

.metric-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
}

.metric-trend.up {
    color: #059669;
}

.metric-trend.down {
    color: #dc2626;
}

.metric-footer {
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
}

.footer-hint {
    font-size: 12px;
    color: var(--text-secondary);
}

.footer-hint.warning {
    color: #d97706;
}

/* Charts Grid */
.charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: clamp(12px, 1.3vw, 20px);
    width: 100%;
}

.chart-card {
    background: var(--bg-card);
    border-radius: clamp(12px, 1vw, 16px);
    border: 1px solid var(--border-color);
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: clamp(16px, 1.3vw, 24px) clamp(16px, 1.5vw, 24px);
    border-bottom: 1px solid var(--border-color);
}

.card-title {
    display: flex;
    align-items: center;
    gap: clamp(8px, 0.7vw, 12px);
    font-size: clamp(14px, 1vw, 16px);
    font-weight: 600;
    color: var(--text-main);
}

.card-title .el-icon {
    color: var(--color-danger);
}

.card-body {
    padding: clamp(16px, 1.3vw, 24px);
    height: clamp(280px, 22vw, 400px);
}

.chart {
    width: 100%;
    height: 100%;
}

.chart-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 响应式布局 - 保持比例 */
@media (max-width: 1024px) {
    .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .charts-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .dashboard-page {
        padding: 4vw;
    }
    
    .metrics-grid {
        grid-template-columns: 1fr;
        gap: 3vw;
    }
    
    .welcome-section {
        flex-direction: column;
        gap: 2vw;
        text-align: center;
        padding: 2.5vw;
    }
    
    .welcome-date {
        text-align: center;
    }
}
</style>
