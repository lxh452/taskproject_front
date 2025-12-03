<template>
    <div class="tasks-list-page">
        <div class="toolbar">
            <div class="toolbar-left">
                <el-input 
                    v-model="query.keyword" 
                    placeholder="搜索任务..." 
                    clearable 
                    class="search-input"
                    :prefix-icon="Search"
                />
                <el-select v-model="query.priority" placeholder="优先级" clearable class="filter-select">
                    <el-option label="紧急" :value="1">
                        <span class="priority-dot danger"></span>紧急
                    </el-option>
                    <el-option label="高" :value="2">
                        <span class="priority-dot warning"></span>高
                    </el-option>
                    <el-option label="中" :value="3">
                        <span class="priority-dot info"></span>中
                    </el-option>
                    <el-option label="低" :value="4">
                        <span class="priority-dot success"></span>低
                    </el-option>
                </el-select>
                <el-select v-model="query.status" placeholder="状态" clearable class="filter-select">
                    <el-option label="待处理" :value="0" />
                    <el-option label="进行中" :value="1" />
                    <el-option label="已完成" :value="2" />
                </el-select>
                <el-date-picker
                    v-model="query.deadlineRange"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="开始"
                    end-placeholder="结束"
                    value-format="YYYY-MM-DD"
                    class="date-picker"
                />
            </div>
            <div class="toolbar-right">
                <el-button @click="resetFilter" plain :icon="Refresh">重置</el-button>
                <el-button type="primary" :icon="Plus" @click="openCreateTaskDialog">
                    创建任务
                </el-button>
            </div>
        </div>
        
        <div class="table-container">
            <el-table :data="filteredRows" style="width: 100%" v-loading="loading" class="tasks-table" :header-cell-style="{ background: '#f9fafb', color: '#6b7280', fontWeight: '600' }">
                <el-table-column prop="taskTitle" label="任务标题" min-width="240">
                    <template #default="{ row }">
                        <div class="task-title-cell">
                            <div class="task-icon-wrapper">
                                <el-icon><Document /></el-icon>
                            </div>
                            <span class="task-title">{{ row.taskTitle }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="priorityText" label="优先级" width="120" align="center">
                    <template #default="{ row }">
                        <div class="priority-badge" :class="row.priorityType">
                            {{ row.priorityText }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="deadline" label="截止时间" width="180">
                    <template #default="{ row }">
                        <div class="deadline-cell">
                            <el-icon><Calendar /></el-icon>
                            <span>{{ row.deadline || '-' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="statusText" label="状态" width="120" align="center">
                    <template #default="{ row }">
                        <div class="status-badge" :class="getStatusClass(row.status)">
                            {{ row.statusText }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="进度" width="200" align="center">
                    <template #default="{ row }">
                        <el-progress 
                            :percentage="row.progress" 
                            :status="row.progressStatus"
                            :stroke-width="8"
                            :format="(percentage) => `${percentage}%`"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="260" align="right" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="viewDetail(row.id)">查看</el-button>
                        <el-button link type="primary" @click="editTask(row.id)">编辑</el-button>
                        <el-button link type="primary" @click="openCreateNodeDialog(row)">创建节点</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 创建任务抽屉 -->
        <el-drawer
            v-model="createTaskDialogVisible"
            title="创建任务"
            size="600px"
            :close-on-click-modal="false"
            destroy-on-close
            class="modern-drawer"
        >
            <create-task-form 
                v-if="createTaskDialogVisible"
                @success="handleTaskCreated"
                @cancel="createTaskDialogVisible = false"
            />
        </el-drawer>

        <!-- 创建节点抽屉 -->
        <el-drawer
            v-model="createNodeDialogVisible"
            title="创建任务节点"
            size="600px"
            :close-on-click-modal="false"
            destroy-on-close
            class="modern-drawer"
        >
            <create-node-form 
                v-if="createNodeDialogVisible"
                :task-id="selectedTaskId"
                @success="handleNodeCreated"
                @cancel="createNodeDialogVisible = false"
            />
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Document, Calendar, Plus } from '@element-plus/icons-vue';
import { listTasks } from '@/api';
import { ElMessage } from 'element-plus';
import CreateTaskForm from './create-task-form.vue';
import CreateNodeForm from '../tasknodes/create-node-form.vue';

const router = useRouter();

const rows = ref<any[]>([]);
const query = ref<any>({ keyword: '', priority: null, status: null, deadlineRange: null });
const loading = ref(false);

const createTaskDialogVisible = ref(false);
const createNodeDialogVisible = ref(false);
const selectedTaskId = ref('');

const filteredRows = computed(() => {
    const { keyword, priority, status, deadlineRange } = query.value;
    return rows.value.filter((r) => {
        const byKw = !keyword || r.taskTitle.toLowerCase().includes(keyword.toLowerCase());
        const byPr = !priority || r.priority === priority;
        const bySt = (status === '' || status === null || status === undefined) || r.status === status;
        const byDl = !deadlineRange || deadlineRange.length !== 2
            ? true
            : (r.deadline >= `${deadlineRange[0]} 00:00:00` && r.deadline <= `${deadlineRange[1]} 23:59:59`);
        return byKw && byPr && bySt && byDl;
    });
});

const resetFilter = () => { 
    query.value = { keyword: '', priority: null, status: null, deadlineRange: null }; 
};

function openCreateTaskDialog() {
    createTaskDialogVisible.value = true;
}

function openCreateNodeDialog(row: any) {
    selectedTaskId.value = row.id;
    createNodeDialogVisible.value = true;
}

function handleTaskCreated() {
    createTaskDialogVisible.value = false;
    loadData();
}

function handleNodeCreated() {
    createNodeDialogVisible.value = false;
    selectedTaskId.value = '';
    loadData();
}

function viewDetail(taskId: string) {
    router.push({ name: 'tasks-detail', params: { id: taskId } });
}

function editTask(taskId: string) {
    console.log('编辑任务:', taskId);
}

function pr(p: number) { 
    return p === 1 ? { text: '紧急', type: 'danger' } : 
           p === 2 ? { text: '高', type: 'warning' } : 
           p === 3 ? { text: '中', type: 'info' } : 
           { text: '低', type: 'success' }; 
}

function getStatusClass(status: number) {
    if (status === 2) return 'success';
    if (status === 1) return 'warning';
    return 'default';
}

async function loadData() {
    loading.value = true;
    try {
        const resp = await listTasks({ page: 1, pageSize: 100 });
        if (resp.data.code !== 200) {
            ElMessage.error(resp.data.msg || '加载任务列表失败');
            rows.value = [];
            return;
        }
        const responseData = resp.data?.data || resp.data || {};
        const list = responseData.list || [];
        rows.value = list.map((t: any) => {
            const pri = pr((t.priority ?? t.taskPriority ?? 3) as number);
            const deadline = t.deadline || t.taskDeadline;
            const progress = t.progress ?? 0;
            const status = t.status ?? 0;
            const left = deadline ? Math.ceil((Date.parse(deadline) - Date.now()) / (24 * 3600 * 1000)) : 0;
            return {
                id: t.id || t.taskId,
                taskTitle: t.taskTitle || t.title || '未命名任务',
                priority: t.priority ?? t.taskPriority ?? 3,
                deadline: deadline ? new Date(deadline).toLocaleDateString('zh-CN') : '-',
                status,
                progress,
                priorityText: pri.text,
                priorityType: pri.type,
                statusText: status === 1 ? '进行中' : status === 2 ? '已完成' : status === 0 ? '待处理' : '未知',
                progressStatus: left < 0 && progress < 100 ? 'exception' : left <= 1 && progress < 100 ? 'warning' : undefined,
            } as any;
        });
    } catch (error: any) {
        console.error('加载任务列表失败:', error);
        ElMessage.error('加载任务列表失败，请稍后重试');
        rows.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.tasks-list-page {
    padding: 24px;
    background: #f9fafb;
    min-height: calc(100vh - 64px);
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: #ffffff;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    flex-wrap: wrap;
    gap: 16px;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.search-input {
    width: 240px;
}

.filter-select {
    width: 140px;
}

.date-picker {
    width: 260px;
}

.table-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 4px;
}

.tasks-table {
    --el-table-border-color: #f3f4f6;
    --el-table-header-bg-color: #f9fafb;
}

.task-title-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.task-icon-wrapper {
    width: 32px;
    height: 32px;
    background: #eff6ff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    font-size: 16px;
}

.task-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
}

.deadline-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;
    font-size: 13px;
}

/* Badges */
.priority-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.priority-badge.danger { background: #fef2f2; color: #ef4444; }
.priority-badge.warning { background: #fffbeb; color: #f59e0b; }
.priority-badge.info { background: #f3f4f6; color: #6b7280; }
.priority-badge.success { background: #ecfdf5; color: #10b981; }

.priority-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}
.priority-dot.danger { background: #ef4444; }
.priority-dot.warning { background: #f59e0b; }
.priority-dot.info { background: #6b7280; }
.priority-dot.success { background: #10b981; }

.status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.status-badge.success { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.status-badge.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.status-badge.default { color: #6b7280; background: rgba(107, 114, 128, 0.1); }

/* Modern Drawer Styles */
:deep(.modern-drawer) {
    background: #ffffff !important;
}

:deep(.modern-drawer .el-drawer__header) {
    margin-bottom: 0;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
    font-weight: 600;
}

:deep(.modern-drawer .el-drawer__body) {
    padding: 24px;
    overflow-y: auto;
}
</style>
