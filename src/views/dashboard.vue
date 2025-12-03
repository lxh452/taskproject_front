<template>
    <div class="dashboard-page">
        <!-- 指标卡片 -->
        <div class="metrics-row">
            <div class="metric-card">
                <div class="metric-icon bg-indigo">
                    <el-icon><DataLine /></el-icon>
                </div>
                <div class="metric-content">
                    <div class="metric-value">{{ metrics.totalTasks }}</div>
                    <div class="metric-label">总任务</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon bg-amber">
                    <el-icon><Clock /></el-icon>
                </div>
                <div class="metric-content">
                    <div class="metric-value">{{ metrics.pendingApprovals }}</div>
                    <div class="metric-label">待审批</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon bg-emerald">
                    <el-icon><Check /></el-icon>
                </div>
                <div class="metric-content">
                    <div class="metric-value">{{ metrics.completed }}</div>
                    <div class="metric-label">已完成</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon bg-rose">
                    <el-icon><Warning /></el-icon>
                </div>
                <div class="metric-content">
                    <div class="metric-value">{{ metrics.critical }}</div>
                    <div class="metric-label">紧急</div>
                </div>
            </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-row">
            <div class="chart-card">
                <div class="chart-header">
                    <h3 class="chart-title">任务状态分布</h3>
                </div>
                <div class="chart-content">
                    <v-chart v-if="!statusChartEmpty" :option="statusChartOption" class="status-chart" autoresize />
                    <el-empty v-else description="暂无数据" :image-size="80" />
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <h3 class="chart-title">工作量优先级</h3>
                </div>
                <div class="chart-content">
                    <v-chart v-if="!priorityChartEmpty" :option="priorityChartOption" class="priority-chart" autoresize />
                    <el-empty v-else description="暂无数据" :image-size="80" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" name="dashboard">
import { ref, onMounted } from 'vue';
import { use } from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { DataLine, Clock, Check, Warning } from '@element-plus/icons-vue';
import { getHandoverList, listTasks, getMyEmployee, getMyTaskNodes } from '@/api';

use([CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, PieChart, BarChart]);

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

async function loadData() {
    try {
        // 加载任务数据
        const empRes = await getMyEmployee();
        const emp = empRes?.data?.data || {};
        const rawDept = (emp.departmentId ?? emp.DepartmentId ?? emp.department_id);
        const departmentId = typeof rawDept === 'object' ? (rawDept?.String || rawDept?.string || '') : (rawDept != null ? String(rawDept) : '');

        if (departmentId) {
            const res = await listTasks({ page: 1, pageSize: 100, departmentId });
            const responseData = res.data?.data || res.data || {};
            const list = responseData.list || [];
        
            // 计算指标
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

            // 构建状态分布图
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

            // 构建优先级柱状图
            const priorityData = {
                low: list.filter((it: any) => (it.priority ?? it.Priority ?? 3) === 4).length,
                medium: list.filter((it: any) => (it.priority ?? it.Priority ?? 3) === 3).length,
                high: list.filter((it: any) => (it.priority ?? it.Priority ?? 3) === 2).length,
                critical: list.filter((it: any) => (it.priority ?? it.Priority ?? 3) === 1).length,
            };

            buildStatusChart(statusData);
            buildPriorityChart(priorityData);
        } else {
            // 如果没有部门，使用我的任务节点数据
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

        // 加载待审批数据
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
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            bottom: 0,
            left: 'center',
            itemGap: 20,
            textStyle: { color: '#6b7280' }
        },
        series: [
            {
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: { show: false },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                data: [
                    { value: data.done, name: '已完成', itemStyle: { color: '#10b981' } },
                    { value: data.inProgress, name: '进行中', itemStyle: { color: '#3b82f6' } },
                    { value: data.review, name: '审核中', itemStyle: { color: '#f59e0b' } },
                    { value: data.todo, name: '待办', itemStyle: { color: '#9ca3af' } }
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
            axisPointer: { type: 'shadow' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['低', '中', '高', '紧急'],
            axisLabel: { color: '#6b7280' },
            axisLine: { lineStyle: { color: '#e5e7eb' } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#6b7280' },
            splitLine: { lineStyle: { color: '#f3f4f6' } }
        },
        series: [
            {
                type: 'bar',
                data: [
                    { value: data.low, itemStyle: { color: '#6b7280' } },
                    { value: data.medium, itemStyle: { color: '#3b82f6' } },
                    { value: data.high, itemStyle: { color: '#f59e0b' } },
                    { value: data.critical, itemStyle: { color: '#ef4444' } }
                ],
                itemStyle: {
                    borderRadius: [4, 4, 0, 0]
                },
                barWidth: '40%'
            }
        ]
    };
}

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.dashboard-page {
    padding: 24px;
    background: #f9fafb;
    min-height: calc(100vh - 64px);
}

.metrics-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-bottom: 24px;
}

.metric-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.metric-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #ffffff;
    flex-shrink: 0;
}

.bg-indigo { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
.bg-amber { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.bg-emerald { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.bg-rose { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); }

.metric-content {
    flex: 1;
}

.metric-value {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
    margin-bottom: 4px;
}

.metric-label {
    font-size: 14px;
    color: #6b7280;
}

.charts-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}

.chart-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.chart-header {
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.chart-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

.chart-content {
    height: 350px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status-chart, .priority-chart {
    width: 100%;
    height: 350px;
}

@media (max-width: 1400px) {
    .metrics-row { grid-template-columns: repeat(2, 1fr); }
    .charts-row { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
    .metrics-row { grid-template-columns: 1fr; }
}
</style>
