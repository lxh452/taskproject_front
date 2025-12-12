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

        <!-- 待处理节点快捷入口 -->
        <div class="pending-section" v-if="pendingNodes.length > 0">
            <div class="section-header">
                <div class="section-title">
                    <el-icon><Clock /></el-icon>
                    <span>待处理节点</span>
                    <el-tag type="warning" size="small" effect="dark" round>{{ pendingNodes.length }}</el-tag>
                </div>
                <el-button link type="primary" @click="$router.push('/task/my')">查看全部</el-button>
            </div>
            <div class="pending-list">
                <div 
                    v-for="node in pendingNodes.slice(0, 6)" 
                    :key="node.id || node.taskNodeId" 
                    class="pending-item"
                    @click="goToTask(node)"
                >
                    <div class="pending-icon" :class="`priority-${node.priority || 3}`">
                        <el-icon><Document /></el-icon>
                    </div>
                    <div class="pending-content">
                        <div class="pending-title">{{ node.nodeName || node.taskTitle || '未命名节点' }}</div>
                        <div class="pending-meta">
                            <span v-if="node.taskTitle" class="task-name">{{ node.taskTitle }}</span>
                            <span v-if="node.nodeDeadline" class="deadline" :class="{ overdue: isOverdue(node.nodeDeadline) }">
                                <el-icon><Calendar /></el-icon>
                                {{ formatDeadline(node.nodeDeadline) }}
                            </span>
                        </div>
                    </div>
                    <div class="pending-progress">
                        <el-progress 
                            :percentage="node.progress || 0" 
                            :status="node.progress >= 100 ? 'success' : undefined"
                            :stroke-width="6"
                            :show-text="false"
                        />
                        <span class="progress-text">{{ node.progress || 0 }}%</span>
                    </div>
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
import { DataLine, Clock, Check, Warning, Top, PieChart, Histogram, MoreFilled, Document, Calendar } from '@element-plus/icons-vue';
import { getHandoverList, listTasks, getMyEmployee, getMyTaskNodes } from '@/api';
import { useUserStore } from '@/store/user';
import { useRouter } from 'vue-router';

use([CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, EchartsPie, BarChart]);

const router = useRouter();
const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');
const pendingNodes = ref<any[]>([]);

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

            // 过滤出待处理节点（状态为0或1且进度<100）
            pendingNodes.value = allTasks.filter((node: any) => {
                const status = node.status ?? node.nodeStatus ?? 0;
                const progress = node.progress ?? 0;
                return status < 2 && progress < 100;
            }).sort((a: any, b: any) => {
                // 按优先级和截止时间排序
                const priorityA = a.priority ?? a.nodeType ?? 3;
                const priorityB = b.priority ?? b.nodeType ?? 3;
                if (priorityA !== priorityB) return priorityA - priorityB;
                const deadlineA = a.nodeDeadline || a.deadline || '';
                const deadlineB = b.nodeDeadline || b.deadline || '';
                return new Date(deadlineA).getTime() - new Date(deadlineB).getTime();
            });

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

// 跳转到任务详情
function goToTask(node: any) {
    const taskId = node.taskId || node.task_id;
    if (taskId) {
        router.push(`/tasks/detail/${taskId}`);
    }
}

// 判断是否过期
function isOverdue(deadline: string): boolean {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
}

// 格式化截止时间
function formatDeadline(deadline: string): string {
    if (!deadline) return '';
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `已逾期${Math.abs(days)}天`;
    if (days === 0) return '今天';
    if (days === 1) return '明天';
    if (days <= 7) return `${days}天后`;
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
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

/* 待处理节点区域 */
.pending-section {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-main);
}

.section-title .el-icon {
    color: #f59e0b;
}

.pending-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 12px;
}

.pending-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: var(--bg-hover);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
}

.pending-item:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
}

.pending-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: white;
    flex-shrink: 0;
}

.pending-icon.priority-1 {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.pending-icon.priority-2 {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.pending-icon.priority-3 {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.pending-icon.priority-4 {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.pending-content {
    flex: 1;
    min-width: 0;
}

.pending-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
}

.pending-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--text-secondary);
}

.pending-meta .task-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pending-meta .deadline {
    display: flex;
    align-items: center;
    gap: 4px;
}

.pending-meta .deadline.overdue {
    color: #ef4444;
    font-weight: 500;
}

.pending-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.pending-progress .el-progress {
    width: 60px;
}

.pending-progress .progress-text {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
    min-width: 36px;
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
