<template>
    <div class="task-timeline-page">
        <div class="page-header">
            <div class="header-title">任务足迹</div>
            <div class="header-subtitle">记录任务生命周期的每一个关键时刻</div>
        </div>

        <div class="timeline-wrapper">
            <div v-if="items.length > 0" class="timeline-container">
                <div v-for="(group, date) in groupedItems" :key="date" class="timeline-group">
                    <div class="date-label">{{ formatDateLabel(String(date)) }}</div>
                    <div class="timeline-items">
                        <div v-for="item in group" :key="item.id" class="timeline-item" @click="viewTask(item)">
                            <div class="time-column">{{ formatTime(item.time) }}</div>
                            <div class="content-card" :class="item.type">
                                <div class="card-dot"></div>
                                <div class="card-main">
                                    <div class="card-header">
                                        <span class="item-title">{{ item.name }}</span>
                                        <span class="status-tag" :class="getStatusClass(item.status)">{{ item.statusText }}</span>
                                    </div>
                                    <div class="card-body">
                                        <div class="progress-bar" v-if="item.progress !== undefined">
                                            <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
                                        </div>
                                        <div class="item-desc" v-if="item.sub">{{ item.sub }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="empty-state">
                <el-empty description="暂无任务记录" :image-size="120" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getMyTaskNodes } from '@/api';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const router = useRouter();

interface TLItem { 
    id: string; 
    name: string; 
    time: string; 
    type?: string; 
    sub?: string;
    status?: number;
    statusText?: string;
    progress?: number;
}

const items = ref<TLItem[]>([]);

const groupedItems = computed(() => {
    const groups: Record<string, TLItem[]> = {};
    items.value.forEach(item => {
        const date = item.time.split('T')[0];
        if (!groups[date]) groups[date] = [];
        groups[date].push(item);
    });
    return groups;
});

function formatDateLabel(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === yesterday.toDateString()) return '昨天';
    
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
}

function formatTime(timeStr: string) {
    return new Date(timeStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function priorityToType(nodeType?: number): string {
    switch (nodeType) {
        case 1: return 'critical';
        case 2: return 'high';
        case 3: return 'medium';
        case 4: return 'low';
        default: return 'normal';
    }
}

function statusToText(status?: number): string {
    switch (status) {
        case 0: return '待开始';
        case 1: return '进行中';
        case 2: return '已完成';
        case 3: return '已取消';
        default: return '未知';
    }
}

function getStatusClass(status?: number) {
    switch (status) {
        case 1: return 'processing';
        case 2: return 'completed';
        case 3: return 'cancelled';
        default: return 'pending';
    }
}

function viewTask(task: TLItem) {
    if (task.id) {
        navigateToTaskNode(task.id);
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

async function loadData() {
    try {
        const res = await getMyTaskNodes({ page: 1, pageSize: 1000 });
        if (res.data.code !== 200) {
            items.value = [];
            return;
        }
        
        const responseData = res.data?.data || {};
        const executorTasks = responseData.executor_task || [];
        const leaderTasks = responseData.leader_task || [];
        const allTasks = [...executorTasks, ...leaderTasks];
        
        items.value = allTasks
            .map((it: any) => {
                const time = it.nodeDeadline || it.endTime || it.deadline || it.createTime || it.startTime || new Date().toISOString();
                return {
                    id: it.id || it.taskNodeId,
                    name: it.nodeName || it.taskNodeName || '未命名任务',
                    time,
                    type: priorityToType(it.nodeType || it.priority),
                    sub: it.nodeDetail || '',
                    status: it.status,
                    statusText: statusToText(it.status),
                    progress: it.progress || 0
                };
            })
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    } catch (error: any) {
        items.value = [];
    }
}

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.task-timeline-page {
    padding: 24px;
    background: #f9fafb;
    min-height: calc(100vh - 64px);
}

.page-header {
    margin-bottom: 32px;
    text-align: center;
}

.header-title {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
}

.header-subtitle {
    color: #6b7280;
    font-size: 14px;
}

.timeline-wrapper {
    max-width: 800px;
    margin: 0 auto;
}

.timeline-group {
    margin-bottom: 32px;
}

.date-label {
    font-size: 14px;
    font-weight: 600;
    color: #9ca3af;
    margin-bottom: 16px;
    padding-left: 76px;
    position: relative;
}

.date-label::before {
    content: '';
    position: absolute;
    left: 63px;
    top: 50%;
    width: 8px;
    height: 8px;
    background: #e5e7eb;
    border-radius: 50%;
    transform: translateY(-50%);
}

.timeline-item {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    position: relative;
    cursor: pointer;
}

.timeline-item::before {
    content: '';
    position: absolute;
    left: 66px;
    top: 24px;
    bottom: -24px;
    width: 2px;
    background: #f3f4f6;
}

.timeline-group:last-child .timeline-item:last-child::before {
    display: none;
}

.time-column {
    width: 50px;
    padding-top: 14px;
    font-size: 13px;
    color: #6b7280;
    text-align: right;
    font-variant-numeric: tabular-nums;
}

.content-card {
    flex: 1;
    background: #ffffff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    border: 1px solid transparent;
    transition: all 0.2s;
    position: relative;
}

.content-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.card-dot {
    position: absolute;
    left: -29px;
    top: 20px;
    width: 12px;
    height: 12px;
    background: #ffffff;
    border: 3px solid #e5e7eb;
    border-radius: 50%;
    z-index: 1;
}

/* Priority Styles */
.content-card.critical { border-left: 4px solid #ef4444; }
.content-card.critical .card-dot { border-color: #ef4444; }

.content-card.high { border-left: 4px solid #f59e0b; }
.content-card.high .card-dot { border-color: #f59e0b; }

.content-card.medium { border-left: 4px solid #3b82f6; }
.content-card.medium .card-dot { border-color: #3b82f6; }

.content-card.low { border-left: 4px solid #10b981; }
.content-card.low .card-dot { border-color: #10b981; }

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.item-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 15px;
}

.status-tag {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
}

.status-tag.processing { background: #eff6ff; color: #3b82f6; }
.status-tag.completed { background: #ecfdf5; color: #10b981; }
.status-tag.cancelled { background: #fef2f2; color: #ef4444; }
.status-tag.pending { background: #f3f4f6; color: #6b7280; }

.progress-bar {
    height: 4px;
    background: #f3f4f6;
    border-radius: 2px;
    margin-bottom: 8px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #3b82f6;
    border-radius: 2px;
}

.item-desc {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.5;
}

.empty-state {
    padding: 40px;
    display: flex;
    justify-content: center;
}
</style>
