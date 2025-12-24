<template>
    <div class="dashboard-kanban">
        <div class="kanban-header">
            <div class="kanban-filters">
                <el-select v-model="filterStatus" placeholder="状态筛选" clearable size="small" class="filter-select">
                    <el-option label="全部" value="" />
                    <el-option label="待处理" :value="0" />
                    <el-option label="进行中" :value="1" />
                    <el-option label="已完成" :value="2" />
                </el-select>
            </div>
        </div>
        
        <div class="kanban-board" v-loading="loading">
            <!-- 待处理列 -->
            <div class="kanban-column">
                <div class="column-header pending">
                    <div class="column-title">
                        <el-icon><Clock /></el-icon>
                        <span>待处理</span>
                    </div>
                    <el-badge :value="pendingTasks.length" type="info" />
                </div>
                <div class="column-body">
                    <div 
                        v-for="task in displayPendingTasks" 
                        :key="task.id" 
                        class="task-card"
                        @click="viewTask(task)"
                    >
                        <div class="task-title">{{ task.name || task.nodeName || '-' }}</div>
                        <div class="task-meta">
                            <span v-if="task.taskTitle" class="task-parent">{{ task.taskTitle }}</span>
                        </div>
                        <div class="task-footer">
                            <div class="task-progress">
                                <el-progress :percentage="task.progress || 0" :stroke-width="4" :show-text="false" />
                            </div>
                            <span class="task-date" v-if="task.endTime">{{ formatDate(task.endTime) }}</span>
                        </div>
                    </div>
                    <el-empty v-if="pendingTasks.length === 0" description="暂无待处理任务" :image-size="60" />
                </div>
            </div>

            <!-- 进行中列 -->
            <div class="kanban-column">
                <div class="column-header in-progress">
                    <div class="column-title">
                        <el-icon><Loading /></el-icon>
                        <span>进行中</span>
                    </div>
                    <el-badge :value="inProgressTasks.length" type="warning" />
                </div>
                <div class="column-body">
                    <div 
                        v-for="task in displayInProgressTasks" 
                        :key="task.id" 
                        class="task-card"
                        @click="viewTask(task)"
                    >
                        <div class="task-title">{{ task.name || task.nodeName || '-' }}</div>
                        <div class="task-meta">
                            <span v-if="task.taskTitle" class="task-parent">{{ task.taskTitle }}</span>
                        </div>
                        <div class="task-footer">
                            <div class="task-progress">
                                <el-progress :percentage="task.progress || 0" :stroke-width="4" :show-text="false" status="warning" />
                            </div>
                            <span class="task-date" v-if="task.endTime">{{ formatDate(task.endTime) }}</span>
                        </div>
                    </div>
                    <el-empty v-if="inProgressTasks.length === 0" description="暂无进行中任务" :image-size="60" />
                </div>
            </div>

            <!-- 已完成列 -->
            <div class="kanban-column">
                <div class="column-header completed">
                    <div class="column-title">
                        <el-icon><CircleCheck /></el-icon>
                        <span>已完成</span>
                    </div>
                    <el-badge :value="completedTasks.length" type="success" />
                </div>
                <div class="column-body">
                    <div 
                        v-for="task in displayCompletedTasks" 
                        :key="task.id" 
                        class="task-card completed"
                        @click="viewTask(task)"
                    >
                        <div class="task-title">{{ task.name || task.nodeName || '-' }}</div>
                        <div class="task-meta">
                            <span v-if="task.taskTitle" class="task-parent">{{ task.taskTitle }}</span>
                        </div>
                        <div class="task-footer">
                            <div class="task-progress">
                                <el-progress :percentage="100" :stroke-width="4" :show-text="false" status="success" />
                            </div>
                            <span class="task-date" v-if="task.finishTime">{{ formatDate(task.finishTime) }}</span>
                        </div>
                    </div>
                    <el-empty v-if="completedTasks.length === 0" description="暂无已完成任务" :image-size="60" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Clock, Loading, CircleCheck } from '@element-plus/icons-vue';
import { getMyTaskNodes } from '@/api';

const props = defineProps({
    maxTasksPerColumn: { type: Number, default: 10 },
    showExpiring: { type: Boolean, default: false }
});

const router = useRouter();
const loading = ref(false);
const tasks = ref<any[]>([]);
const filterStatus = ref<number | string>('');

// 按状态分类任务
const pendingTasks = computed(() => tasks.value.filter(t => (t.status ?? t.nodeStatus ?? 0) === 0));
const inProgressTasks = computed(() => tasks.value.filter(t => (t.status ?? t.nodeStatus ?? 0) === 1));
const completedTasks = computed(() => tasks.value.filter(t => (t.status ?? t.nodeStatus ?? 0) === 2));

// 限制显示数量
const displayPendingTasks = computed(() => pendingTasks.value.slice(0, props.maxTasksPerColumn));
const displayInProgressTasks = computed(() => inProgressTasks.value.slice(0, props.maxTasksPerColumn));
const displayCompletedTasks = computed(() => completedTasks.value.slice(0, props.maxTasksPerColumn));

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch {
        return dateStr;
    }
}

function viewTask(task: any) {
    const nodeId = task.id || task.taskNodeId || task.nodeId;
    if (nodeId) {
        router.push(`/task-nodes/detail/${nodeId}`);
    }
}

async function loadTasks() {
    loading.value = true;
    try {
        const resp = await getMyTaskNodes({ page: 1, pageSize: 100 });
        if (resp.data?.code === 200) {
            const data = resp.data?.data || {};
            const executorTasks = data.executor_task || data.executorTask || [];
            const leaderTasks = data.leader_task || data.leaderTask || [];
            
            // 合并去重
            const allTasksMap = new Map();
            [...executorTasks, ...leaderTasks].forEach((t: any) => {
                const id = t.id || t.taskNodeId || t.nodeId;
                if (id && !allTasksMap.has(id)) {
                    allTasksMap.set(id, {
                        id,
                        name: t.nodeName || t.name || t.taskNodeName,
                        taskTitle: t.taskTitle || t.task_title,
                        status: t.nodeStatus ?? t.status ?? 0,
                        progress: t.progress ?? 0,
                        startTime: t.nodeStartTime || t.startTime,
                        endTime: t.nodeEndTime || t.endTime,
                        finishTime: t.nodeFinishTime || t.finishTime,
                    });
                }
            });
            tasks.value = Array.from(allTasksMap.values());
        }
    } catch (error) {
        console.error('加载任务失败:', error);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadTasks();
});
</script>

<style scoped>
.dashboard-kanban {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.kanban-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}

.filter-select {
    width: 120px;
}

.kanban-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    flex: 1;
    min-height: 0;
}

.kanban-column {
    background: #f8fafc;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 2px solid;
}

.column-header.pending {
    background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
    border-color: #6366f1;
}

.column-header.in-progress {
    background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%);
    border-color: #eab308;
}

.column-header.completed {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border-color: #22c55e;
}

.column-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    color: #1f2937;
}

.column-body {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.task-card {
    background: #fff;
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
}

.task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #c7d2fe;
}

.task-card.completed {
    opacity: 0.8;
}

.task-title {
    font-weight: 600;
    font-size: 13px;
    color: #1f2937;
    margin-bottom: 6px;
    line-height: 1.4;
}

.task-meta {
    margin-bottom: 10px;
}

.task-parent {
    font-size: 11px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
}

.task-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.task-progress {
    flex: 1;
}

.task-date {
    font-size: 11px;
    color: #9ca3af;
    white-space: nowrap;
}

@media (max-width: 1024px) {
    .kanban-board {
        grid-template-columns: 1fr;
    }
    
    .kanban-column {
        max-height: 300px;
    }
}
</style>
