<template>
    <div class="tasks-page">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-left">
                <h1 class="page-title">任务列表</h1>
                <p class="page-desc">管理和追踪所有项目任务</p>
            </div>
            <el-button type="primary" :icon="Plus" @click="openCreateTaskDialog" class="create-btn">
                创建任务
            </el-button>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
            <div class="filter-left">
                <el-input 
                    v-model="query.keyword" 
                    placeholder="搜索任务名称..." 
                    clearable 
                    class="search-input"
                    :prefix-icon="Search"
                />
                <el-select v-model="query.priority" placeholder="优先级" clearable class="filter-select">
                    <el-option label="紧急" :value="1">
                        <span class="priority-option"><span class="dot danger"></span>紧急</span>
                    </el-option>
                    <el-option label="高" :value="2">
                        <span class="priority-option"><span class="dot warning"></span>高</span>
                    </el-option>
                    <el-option label="中" :value="3">
                        <span class="priority-option"><span class="dot info"></span>中</span>
                    </el-option>
                    <el-option label="低" :value="4">
                        <span class="priority-option"><span class="dot success"></span>低</span>
                    </el-option>
                </el-select>
                <el-select v-model="query.status" placeholder="状态" clearable class="filter-select">
                    <el-option label="待处理" :value="0" />
                    <el-option label="进行中" :value="1" />
                    <el-option label="已完成" :value="2" />
                </el-select>
            </div>
            <div class="filter-right">
                <el-button :icon="Refresh" circle @click="resetFilter" />
            </div>
        </div>
        
        <!-- 任务卡片网格 -->
        <div class="content-area">
            <el-skeleton :rows="4" animated v-if="loading" />
            <template v-else>
                <div v-if="filteredRows.length > 0" class="tasks-grid">
                    <div
                        v-for="row in filteredRows"
                        :key="row.id"
                        class="task-card"
                        @click="viewDetail(row.id)"
                    >
                        <div class="card-header">
                            <div class="task-icon" :class="row.priorityType">
                                <el-icon><Document /></el-icon>
                            </div>
                            <div class="status-badge" :class="getStatusClass(row.status)">
                                {{ row.statusText }}
                            </div>
                        </div>

                        <div class="card-body">
                            <h3 class="task-title">{{ row.taskTitle }}</h3>
                            <div class="task-meta">
                                <span class="meta-item priority" :class="row.priorityType">
                                    <span class="dot"></span>
                                    {{ row.priorityText }}
                                </span>
                                <span class="meta-item date">
                                    <el-icon><Calendar /></el-icon>
                                    {{ row.deadline || '无截止日期' }}
                                </span>
                            </div>
                        </div>
                        
                        <div class="card-footer">
                            <div class="progress-info">
                                <span class="progress-label">进度</span>
                                <span class="progress-value">{{ row.progress }}%</span>
                            </div>
                            <el-progress 
                                :percentage="row.progress" 
                                :stroke-width="6"
                                :show-text="false"
                                :color="getProgressColor(row.progress)"
                            />
                        </div>

                        <div class="card-actions">
                            <el-button type="primary" size="default" @click.stop="viewDetail(row.id)" class="action-btn">
                                <el-icon><View /></el-icon>
                                <span>查看</span>
                            </el-button>
                            <el-button type="warning" size="default" @click.stop="editTask(row.id)" class="action-btn">
                                <el-icon><Edit /></el-icon>
                                <span>编辑</span>
                            </el-button>
                            <el-button type="success" size="default" @click.stop="openCreateNodeDialog(row)" class="action-btn">
                                <el-icon><Plus /></el-icon>
                                <span>节点</span>
                            </el-button>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <el-empty description="暂无任务" />
                </div>
            </template>
        </div>

        <!-- 创建任务抽屉 -->
        <el-drawer
            v-model="createTaskDialogVisible"
            title="创建任务"
            size="560px"
            :close-on-click-modal="false"
            destroy-on-close
            class="vben-drawer"
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
            size="560px"
            :close-on-click-modal="false"
            destroy-on-close
            class="vben-drawer"
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
import { Search, Refresh, Document, Calendar, Plus, View, Edit } from '@element-plus/icons-vue';
import { listTasks } from '@/api';
import { ElMessage } from 'element-plus';
import CreateTaskForm from './create-task-form.vue';
import CreateNodeForm from '../tasknodes/create-node-form.vue';

const router = useRouter();

const rows = ref<any[]>([]);
const query = ref<any>({ keyword: '', priority: null, status: null });
const loading = ref(false);

const createTaskDialogVisible = ref(false);
const createNodeDialogVisible = ref(false);
const selectedTaskId = ref('');

const filteredRows = computed(() => {
    const { keyword, priority, status } = query.value;
    return rows.value.filter((r) => {
        const byKw = !keyword || r.taskTitle.toLowerCase().includes(keyword.toLowerCase());
        const byPr = !priority || r.priority === priority;
        const bySt = (status === '' || status === null || status === undefined) || r.status === status;
        return byKw && byPr && bySt;
    });
});

const resetFilter = () => { 
    query.value = { keyword: '', priority: null, status: null }; 
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
    // 跳转到任务详情页面进行编辑
    router.push({ name: 'tasks-detail', params: { id: taskId }, query: { edit: 'true' } });
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

function getProgressColor(progress: number) {
    if (progress >= 100) return '#10b981';
    if (progress >= 60) return '#dc2626';
    return '#f59e0b';
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
/* ==================== Tasks Page ==================== */
.tasks-page {
    padding: var(--page-padding);
    background: var(--bg-page);
    min-height: calc(100vh - var(--header-height));
}

/* ==================== Page Header ==================== */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--card-gap);
}

.page-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs);
}

.page-desc {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    margin: 0;
}

.create-btn {
    height: 40px;
    padding: 0 var(--spacing-xl);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-md);
}

/* ==================== Filter Bar ==================== */
.filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    margin-bottom: var(--card-gap);
    box-shadow: var(--shadow-card);
}

.filter-left {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
}

.search-input { width: 260px; }
.filter-select { width: 130px; }

.priority-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: var(--radius-full);
}

.dot.danger { background: var(--color-danger); }
.dot.warning { background: var(--color-warning); }
.dot.info { background: var(--color-primary); }
.dot.success { background: var(--color-success); }

/* ==================== Tasks Grid - 16px gap, responsive ==================== */
.tasks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg);
}

/* ==================== Task Card ==================== */
.task-card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    padding: var(--card-padding);
    cursor: pointer;
    transition: transform var(--transition-base), box-shadow var(--transition-base);
    box-shadow: var(--shadow-card);
}

.task-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-card-hover);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-lg);
}

.task-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}

.task-icon.danger { background: var(--color-danger-light); color: var(--color-danger); }
.task-icon.warning { background: var(--color-warning-light); color: var(--color-warning); }
.task-icon.info { background: var(--color-primary-light); color: var(--color-primary); }
.task-icon.success { background: var(--color-success-light); color: var(--color-success); }

.status-badge {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-full);
}

.status-badge.success { background: var(--color-success-light); color: var(--color-success-dark); }
.status-badge.warning { background: var(--color-warning-light); color: var(--color-warning-dark); }
.status-badge.default { background: var(--bg-hover); color: var(--text-secondary); }

.card-body { margin-bottom: var(--spacing-lg); }

.task-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-md);
    line-height: var(--line-height-snug);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 40px;
}

.task-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
}

.meta-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

.meta-item.priority .dot { width: 5px; height: 5px; }
.meta-item.priority.danger { color: var(--color-danger); }
.meta-item.priority.warning { color: var(--color-warning); }
.meta-item.priority.info { color: var(--color-primary); }
.meta-item.priority.success { color: var(--color-success); }

.card-footer {
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--border-color);
}

.progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
}

.progress-label { font-size: var(--font-size-xs); color: var(--text-muted); }
.progress-value { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--text-primary); }

/* ==================== Card Actions ==================== */
.card-actions {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color);
}

.card-actions .action-btn {
    flex: 1;
    height: 34px;
    font-size: var(--font-size-sm);
    border-radius: var(--radius-md);
}

/* ==================== Empty State ==================== */
.empty-state {
    padding: var(--spacing-5xl);
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    text-align: center;
}

/* ==================== Drawer Styles ==================== */
:deep(.vben-drawer .el-drawer__header) {
    padding: var(--spacing-lg) var(--spacing-xl);
    border-bottom: 1px solid var(--border-color);
}

:deep(.vben-drawer .el-drawer__body) {
    padding: var(--spacing-xl);
}

/* ==================== Responsive Layout ==================== */
@media (max-width: 768px) {
    .tasks-page { padding: var(--spacing-lg); }
    .page-header { flex-direction: column; gap: var(--spacing-md); }
    .create-btn { width: 100%; }
    .filter-bar { flex-direction: column; gap: var(--spacing-md); }
    .filter-left { flex-direction: column; width: 100%; }
    .search-input, .filter-select { width: 100%; }
    .tasks-grid { grid-template-columns: 1fr; }
    
    /* Mobile: always show card actions */
    .card-actions {
        opacity: 1;
    }
}
</style>
