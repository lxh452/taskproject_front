<template>
    <div class="task-gantt-page">
        <div class="toolbar">
            <div class="toolbar-title">
                任务时间轴
                <span class="subtitle">可视化查看任务进度与依赖</span>
            </div>
            <div class="toolbar-actions">
                <el-button :icon="Refresh" circle plain @click="loadData" />
            </div>
        </div>

        <div class="content-wrapper">
            <div class="timeline-panel">
                <div class="panel-header">
                    <span class="panel-title">最近动态</span>
                </div>
                <div class="timeline-list">
                    <el-timeline>
                        <el-timeline-item
                            v-for="item in timelineItems"
                            :key="item.id"
                            :timestamp="item.timeLabel"
                            :type="item.type"
                            :hollow="true"
                            size="large"
                        >
                            <div class="timeline-card" @click="viewTask(item)">
                                <div class="card-header">
                                    <span class="card-title">{{ item.name }}</span>
                                    <el-tag :type="item.urgencyType" size="small" effect="plain">{{ item.urgencyText }}</el-tag>
                                </div>
                                <div class="card-date">{{ item.rangeText }}</div>
                            </div>
                        </el-timeline-item>
                    </el-timeline>
                </div>
            </div>
            
            <div class="chart-panel">
                <div class="panel-header">
                    <span class="panel-title">甘特图</span>
                </div>
                <div v-if="items.length === 0" class="empty-state">
                    <el-empty description="暂无任务数据" />
                </div>
                <v-chart v-else :option="chartOption" autoresize class="gantt-chart" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import VChart from 'vue-echarts';
import { getMyTaskNodes } from '@/api';
import request from '@/utils/request';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CustomChart } from 'echarts/charts';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();

use([CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, CustomChart]);

interface TaskNodeItem {
    id: string;
    name: string;
    startTime?: string;
    endTime?: string;
    priority?: number;
}

const chartOption = ref<any>({});
const timelineItems = ref<any[]>([]);
const items = ref<TaskNodeItem[]>([]);

function toDate(val?: string): number | null {
    if (!val) return null;
    const ts = Date.parse(val);
    return isNaN(ts) ? null : ts;
}

function priorityToTag(p?: number) {
    switch (p) {
        case 1: return { text: '紧急', type: 'danger' };
        case 2: return { text: '高', type: 'warning' };
        case 3: return { text: '中', type: 'primary' };
        default: return { text: '低', type: 'success' };
    }
}

function buildChart(tasks: TaskNodeItem[]) {
    const items = tasks.map((t, idx) => {
        const start = toDate(t.startTime) ?? Date.now() - 3600_000 * 8;
        const end = toDate(t.endTime) ?? start + 3600_000 * 4;
        return { name: t.name || `任务${idx + 1}`, start, end, priority: t.priority || 3 };
    });

    const categories = items.map((it) => it.name);
    const data = items.map((it, i) => [i, it.start, it.end, it.priority]);

    chartOption.value = {
        tooltip: {
            formatter: (p: any) => {
                const v = p.value;
                const pr = priorityToTag(v[3]);
                return `
                    <div style="font-weight:600;margin-bottom:4px">${categories[v[0]]}</div>
                    <div style="font-size:12px;color:#666">
                        ${new Date(v[1]).toLocaleString()} - ${new Date(v[2]).toLocaleString()}
                    </div>
                    <div style="margin-top:4px">
                        <span style="display:inline-block;padding:2px 6px;border-radius:4px;background:${getColor(v[3])}20;color:${getColor(v[3])};font-size:12px">
                            ${pr.text}
                        </span>
                    </div>
                `;
            },
            backgroundColor: '#fff',
            borderColor: '#eee',
            textStyle: { color: '#333' },
            padding: 12
        },
        grid: { left: 120, right: 24, top: 40, bottom: 24 },
        xAxis: {
            type: 'time',
            axisLabel: { 
                formatter: '{MM}-{dd}',
                color: '#999'
            },
            axisLine: { lineStyle: { color: '#eee' } },
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f5f5f5' } }
        },
        yAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: '#666', fontWeight: 500 },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        series: [{
            type: 'custom',
            renderItem: (params: any, api: any) => {
                const idx = api.value(0);
                const start = api.coord([api.value(1), idx]);
                const end = api.coord([api.value(2), idx]);
                const barHeight = 24;
                const y = start[1] - barHeight / 2;
                const width = end[0] - start[0];
                const priority = api.value(3);
                
                return {
                    type: 'rect',
                    shape: { x: start[0], y, width, height: barHeight, r: 4 },
                    style: api.style({ fill: getColor(priority) })
                };
            },
            encode: { x: [1, 2], y: 0 },
            data
        }]
    };
}

function getColor(priority: number) {
    switch(priority) {
        case 1: return '#ef4444';
        case 2: return '#f59e0b';
        case 3: return '#3b82f6';
        default: return '#10b981';
    }
}

function buildTimeline(tasks: TaskNodeItem[]) {
    timelineItems.value = tasks.map((t) => {
        const start = toDate(t.startTime);
        const end = toDate(t.endTime);
        const pr = priorityToTag(t.priority);
        return {
            id: t.id,
            name: t.name,
            timeLabel: end ? new Date(end).toLocaleDateString() : '未设截止',
            rangeText: `${start ? new Date(start).toLocaleDateString() : '未开始'} - ${end ? new Date(end).toLocaleDateString() : '未截止'}`,
            type: pr.type,
            urgencyText: pr.text,
            urgencyType: pr.type
        };
    });
}

async function loadData() {
    try {
        const res = await getMyTaskNodes({ page: 1, pageSize: 1000 });
        if (res.data.code !== 200) {
            items.value = [];
            buildTimeline([]);
            buildChart([]);
            return;
        }
        
        const responseData = res.data?.data || {};
        const executorTasks = responseData.executor_task || [];
        const leaderTasks = responseData.leader_task || [];
        const allTasks = [...executorTasks, ...leaderTasks];
        
        const tasks: TaskNodeItem[] = allTasks.map((it: any) => ({
            id: it.id || it.taskNodeId,
            name: it.nodeName || it.taskNodeName || '未命名任务',
            startTime: it.createTime || it.startTime,
            endTime: it.nodeDeadline || it.endTime || it.deadline,
            priority: it.nodeType || it.priority || 3,
        }));
        
        items.value = tasks;
        buildTimeline(tasks);
        buildChart(tasks);
    } catch (error: any) {
        items.value = [];
        buildTimeline([]);
        buildChart([]);
    }
}

// 点击任务卡片跳转
function viewTask(item: any) {
    if (item.id) {
        navigateToTaskNode(item.id);
    }
}

// 跳转到任务节点所属的任务详情
async function navigateToTaskNode(taskNodeId: string) {
    try {
        const resp = await request({ url: '/tasknode/get', method: 'post', data: { taskNodeId } });
        if (resp.data.code === 200 && resp.data.data) {
            const data = resp.data.data;
            const taskNode = data.taskNode || data;
            const taskId = taskNode.taskId || taskNode.TaskId || taskNode.taskID;
            if (taskId) {
                router.push(`/tasks/detail/${taskId}`);
                return;
            }
        }
        ElMessage.warning('无法获取任务节点信息');
    } catch (error) {
        console.error('获取任务节点失败:', error);
        ElMessage.error('获取任务节点信息失败');
    }
}

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.task-gantt-page {
    padding: 24px;
    background: #f9fafb;
    min-height: calc(100vh - 64px);
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.toolbar-title {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.subtitle {
    font-size: 13px;
    color: #6b7280;
    font-weight: 400;
}

.content-wrapper {
    display: flex;
    gap: 24px;
    height: calc(100vh - 160px);
}

.timeline-panel {
    width: 320px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chart-panel {
    flex: 1;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;
}

.panel-title {
    font-weight: 600;
    color: #374151;
}

.timeline-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

.timeline-card {
    background: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #f3f4f6;
    cursor: pointer;
    transition: all 0.2s;
}

.timeline-card:hover {
    background: #f3f4f6;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.card-title {
    font-weight: 600;
    color: #374151;
    font-size: 14px;
}

.card-date {
    font-size: 12px;
    color: #9ca3af;
}

.gantt-chart {
    flex: 1;
    width: 100%;
    min-height: 400px;
    padding: 20px;
}

.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
