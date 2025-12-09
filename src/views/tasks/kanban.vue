<template>
    <div class="kanban-page">
        <div class="action-bar">
            <div class="action-left">
                <el-input
                    v-model="searchKeyword"
                    placeholder="搜索任务..."
                    class="search-input"
                    :prefix-icon="Search"
                    clearable
                />
                <el-select v-model="selectedPriority" placeholder="全部优先级" class="filter-select" clearable>
                    <el-option label="紧急" value="critical" />
                    <el-option label="高" value="high" />
                    <el-option label="中" value="medium" />
                    <el-option label="低" value="low" />
                </el-select>
                <el-select v-model="selectedAssignee" placeholder="全部负责人" class="filter-select" clearable>
                    <el-option
                        v-for="emp in employeeOptions"
                        :key="emp.id"
                        :label="emp.name"
                        :value="emp.id"
                    />
                </el-select>
            </div>
            <div class="action-right">
                <el-button type="primary" class="new-task-btn" :icon="Plus" @click="openCreateDialog">
                    新建任务
                </el-button>
            </div>
        </div>

        <div class="kanban-board" v-loading="loading">
            <div
                v-for="column in columns"
                :key="column.status"
                class="kanban-column"
            >
                <div class="column-header">
                    <h3 class="column-title">{{ column.title }}</h3>
                    <span class="column-count">{{ getTasksByStatus(column.status).length }}</span>
                </div>
                <div class="column-content" :ref="el => setColumnRef(el, column.status)">
                    <div
                        v-for="task in getTasksByStatus(column.status)"
                        :key="task.id"
                        class="task-card"
                        :class="{ 'task-node-card': task.type === 'taskNode', 'task-card-main': task.type === 'task' }"
                        @click="viewTaskDetail(task)"
                    >
                        <div class="task-badges">
                            <span class="type-indicator" :class="task.type"></span>
                            <span class="priority-dot" :class="getPriorityValue(task.priority)"></span>
                        </div>
                        <h4 class="task-title">{{ task.title }}</h4>
                        <p class="task-description">{{ task.description }}</p>
                        <div class="task-meta">
                            <div class="task-date" v-if="task.dueDate">
                                <el-icon><Clock /></el-icon>
                                <span>{{ formatDate(task.dueDate) }}</span>
                            </div>
                            <el-avatar
                                v-if="task.assignee"
                                :size="24"
                                :src="task.assigneeAvatar"
                                class="task-assignee"
                            >
                                {{ task.assigneeName?.charAt(0) }}
                            </el-avatar>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 创建任务抽屉 -->
        <el-drawer
            v-model="createDialogVisible"
            title="新建任务"
            size="600px"
            class="modern-drawer"
            destroy-on-close
        >
            <el-form :model="taskForm" label-position="top" class="drawer-form">
                <el-form-item label="任务标题" required>
                    <el-input v-model="taskForm.title" placeholder="请输入任务名称" />
                </el-form-item>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="优先级">
                            <el-select v-model="taskForm.priority" placeholder="选择优先级" class="full-width">
                                <el-option label="紧急" value="critical" />
                                <el-option label="高" value="high" />
                                <el-option label="中" value="medium" />
                                <el-option label="低" value="low" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="负责人">
                            <el-select v-model="taskForm.assigneeId" placeholder="选择负责人" class="full-width">
                                <el-option
                                    v-for="emp in employeeOptions"
                                    :key="emp.id"
                                    :label="emp.name"
                                    :value="emp.id"
                                />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="开始日期">
                            <el-date-picker
                                v-model="taskForm.startDate"
                                type="date"
                                placeholder="选择日期"
                                class="full-width"
                                value-format="YYYY/MM/DD"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="截止日期">
                            <el-date-picker
                                v-model="taskForm.dueDate"
                                type="date"
                                placeholder="选择日期"
                                class="full-width"
                                value-format="YYYY/MM/DD"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="任务描述">
                    <el-input
                        v-model="taskForm.description"
                        type="textarea"
                        :rows="6"
                        placeholder="请输入任务详细描述..."
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="createDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="createTask">创建任务</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Plus, Clock } from '@element-plus/icons-vue';
import { listTasks, listEmployees, listTaskNodesByTask, getMyTaskNodes } from '@/api';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const searchKeyword = ref('');
const selectedPriority = ref('');
const selectedAssignee = ref('');
const employeeOptions = ref<any[]>([]);

const columns = [
    { status: 0, title: '待处理' },
    { status: 1, title: '进行中' },
    { status: 3, title: '待审核' },
    { status: 2, title: '已完成' },
];

const tasks = ref<any[]>([]);
const columnRefs = ref<Record<string, HTMLElement>>({});

const setColumnRef = (el: HTMLElement | null, status: number) => {
    if (el) {
        columnRefs.value[status] = el;
    }
};

const getTasksByStatus = (status: number) => {
    return computed(() => {
        let filtered = tasks.value.filter(t => t.status === status);
        
        if (searchKeyword.value) {
            const keyword = searchKeyword.value.toLowerCase();
            filtered = filtered.filter(t =>
                t.title?.toLowerCase().includes(keyword) ||
                t.description?.toLowerCase().includes(keyword) ||
                t.tags?.some((tag: string) => tag.toLowerCase().includes(keyword))
            );
        }
        
        if (selectedPriority.value) {
            filtered = filtered.filter(t => getPriorityValue(t.priority) === selectedPriority.value);
        }
        
        if (selectedAssignee.value) {
            filtered = filtered.filter(t => t.assigneeId === selectedAssignee.value);
        }
        
        return filtered;
    }).value;
};

const getPriorityValue = (priority: number) => {
    const map: Record<number, string> = {
        1: 'critical',
        2: 'high',
        3: 'medium',
        4: 'low',
    };
    return map[priority] || 'medium';
};

const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};

const createDialogVisible = ref(false);
const taskForm = ref({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium',
    startDate: '',
    dueDate: '',
});

const openCreateDialog = () => {
    createDialogVisible.value = true;
    taskForm.value = {
        title: '',
        description: '',
        assigneeId: '',
        priority: 'medium',
        startDate: '',
        dueDate: '',
    };
};

const createTask = () => {
    if (!taskForm.value.title) {
        ElMessage.warning('请输入任务标题');
        return;
    }
    ElMessage.success('任务创建成功');
    createDialogVisible.value = false;
    loadData();
};

const viewTaskDetail = (task: any) => {
    if (task.type === 'taskNode' && task.taskId) {
        router.push({ name: 'tasks-detail', params: { id: task.taskId } });
    } else {
        router.push({ name: 'tasks-detail', params: { id: task.id } });
    }
};

async function loadEmployees() {
    try {
        const companyId = userStore.companyId || '';
        let targetCompanyId = companyId;
        
        if (!targetCompanyId) {
            const { getMyEmployee } = await import('@/api');
            const empRes = await getMyEmployee();
            const emp = empRes?.data?.data || {};
            targetCompanyId = emp.companyId || emp.CompanyId || '';
        }
        
        if (!targetCompanyId) {
            console.warn('无法获取公司ID');
            return;
        }

        const allEmployees: any[] = [];
        let page = 1;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
            const resp = await listEmployees({ page, pageSize, companyId: targetCompanyId });
            if (resp.data?.code === 200) {
                const list = resp.data?.data?.list || [];
                const total = resp.data?.data?.total || 0;
                allEmployees.push(...list);
                if (list.length < pageSize || allEmployees.length >= total) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        }

        employeeOptions.value = allEmployees.map((e: any) => ({
            id: e.id || e.employeeId,
            name: e.realName || e.name || '未知',
            avatar: e.avatar || '',
        }));
    } catch (error: any) {
        console.error('加载员工列表失败:', error);
    }
}

async function loadData() {
    loading.value = true;
    try {
        const employeesMap: Record<string, any> = {};
        employeeOptions.value.forEach((emp: any) => {
            employeesMap[String(emp.id)] = emp;
        });
        
        const allItems: any[] = [];
        await loadMyTaskNodes(employeesMap, allItems);
        const resp = await listTasks({ page: 1, pageSize: 100 });
        
        if (resp.data?.code === 200) {
            const taskList = resp.data?.data?.list || resp.data?.data || [];
            const validTasks = taskList.filter((t: any) => {
                const taskId = t.id || t.taskId;
                const taskTitle = t.taskTitle || t.title || t.TaskTitle;
                return taskId && taskTitle && taskTitle.trim() !== '';
            });
            
            const loadPromises: Promise<void>[] = [];
            validTasks.forEach((t: any) => {
                const assigneeId = t.assigneeId || t.executorId || t.responsibleEmployeeIds?.split(',')[0];
                const assignee = assigneeId ? employeesMap[String(assigneeId)] : null;
                const taskExists = allItems.find(item => item.id === (t.id || t.taskId) && item.type === 'task');
                if (!taskExists) {
                    allItems.push({
                        id: t.id || t.taskId,
                        type: 'task',
                        title: t.taskTitle || t.title || t.TaskTitle,
                        description: t.description || t.taskDescription || '',
                        status: t.status ?? 0,
                        priority: t.priority ?? 3,
                        progress: t.progress ?? 0,
                        dueDate: t.deadline || t.taskDeadline,
                        assigneeId,
                        assigneeName: assignee?.name || '',
                        assigneeAvatar: assignee?.avatar || '',
                        tags: t.tags || ['任务'],
                    });
                }
                loadPromises.push(loadTaskNodesForTask(t.id || t.taskId, employeesMap, allItems));
            });
            await Promise.all(loadPromises);
        }
        tasks.value = allItems;
    } catch (error: any) {
        console.error('加载任务失败:', error);
        ElMessage.error('加载任务失败，请稍后重试');
        tasks.value = [];
    } finally {
        loading.value = false;
    }
}

async function loadMyTaskNodes(employeesMap: Record<string, any>, allItems: any[]) {
    try {
        const res = await getMyTaskNodes({ page: 1, pageSize: 1000 });
        if (res.data.code === 200) {
            const responseData = res.data?.data || {};
            const executorTasks = responseData.executor_task || [];
            const leaderTasks = responseData.leader_task || [];
            const allMyNodes = [...leaderTasks, ...executorTasks];
            const nodeMap = new Map();
            
            allMyNodes.forEach((it: any) => {
                const nodeId = it.id || it.taskNodeId;
                const nodeName = it.nodeName || it.taskNodeName || it.NodeName;
                if (!nodeId || !nodeName || nodeName.trim() === '') return;
                if (nodeMap.has(nodeId)) return;
                
                const executorIdStr = it.executorId || it.executorIds || '';
                const executorIds = Array.isArray(executorIdStr) ? executorIdStr : (executorIdStr ? executorIdStr.split(',').filter(Boolean) : []);
                const leaderId = it.leaderId || it.LeaderId || '';
                const assigneeId = leaderId || executorIds[0] || '';
                const assignee = assigneeId ? employeesMap[String(assigneeId)] : null;
                
                nodeMap.set(nodeId, {
                    id: nodeId,
                    type: 'taskNode',
                    taskId: it.taskId || it.TaskId,
                    title: nodeName,
                    description: it.nodeDetail || it.NodeDetail || '',
                    status: it.nodeStatus ?? it.status ?? 0,
                    priority: it.nodePriority ?? it.priority ?? 3,
                    progress: it.progress ?? 0,
                    dueDate: it.nodeDeadline || it.deadline,
                    assigneeId,
                    assigneeName: assignee?.name || '',
                    assigneeAvatar: assignee?.avatar || '',
                    leaderId,
                    executorIds,
                    tags: ['节点'],
                });
            });
            
            nodeMap.forEach((node) => {
                const exists = allItems.find(item => item.id === node.id && item.type === 'taskNode');
                if (!exists) allItems.push(node);
            });
        }
    } catch (error: any) {
        console.error('加载我的任务节点失败:', error);
    }
}

async function loadTaskNodesForTask(taskId: string, employeesMap: Record<string, any>, allItems: any[]) {
    try {
        const nodeResp = await listTaskNodesByTask({ taskId, page: 1, pageSize: 100 });
        if (nodeResp.data?.code === 200) {
            const nodeList = nodeResp.data?.data?.list || nodeResp.data?.data || [];
            const validNodes = nodeList.filter((node: any) => {
                const nodeId = node.id || node.taskNodeId;
                const nodeName = node.nodeName || node.NodeName;
                return nodeId && nodeName && nodeName.trim() !== '';
            });
            
            validNodes.forEach((node: any) => {
                const nodeId = node.id || node.taskNodeId;
                const nodeName = node.nodeName || node.NodeName;
                const nodeExists = allItems.find(item => item.id === nodeId && item.type === 'taskNode');
                if (nodeExists) return;
                
                const executorIdStr = node.executorId || node.executorIds || '';
                const executorIds = Array.isArray(executorIdStr) ? executorIdStr : (executorIdStr ? executorIdStr.split(',').filter(Boolean) : []);
                const leaderId = node.leaderId || node.LeaderId || '';
                const assigneeId = leaderId || executorIds[0] || '';
                const assignee = assigneeId ? employeesMap[String(assigneeId)] : null;
                
                allItems.push({
                    id: nodeId,
                    type: 'taskNode',
                    taskId: taskId,
                    title: nodeName,
                    description: node.nodeDetail || node.NodeDetail || '',
                    status: node.nodeStatus ?? node.status ?? 0,
                    priority: node.nodePriority ?? node.priority ?? 3,
                    progress: node.progress ?? 0,
                    dueDate: node.nodeDeadline || node.deadline,
                    assigneeId,
                    assigneeName: assignee?.name || '',
                    assigneeAvatar: assignee?.avatar || '',
                    leaderId,
                    executorIds,
                    tags: ['节点'],
                });
            });
        }
    } catch (error: any) {
        console.error(`加载任务 ${taskId} 的节点失败:`, error);
    }
}

onMounted(async () => {
    await loadEmployees();
    await loadData();
});
</script>

<style scoped>
.kanban-page {
    padding: 24px;
    background: var(--bg-page);
    min-height: calc(100vh - 64px);
    overflow-x: hidden;
}

.action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-card);
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
}

.action-left {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.search-input { width: 240px; }
.filter-select { width: 160px; }

.kanban-board {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    padding-bottom: 20px;
    height: calc(100vh - 180px);
}

.kanban-column {
    flex: 1;
    min-width: 300px;
    max-width: 350px;
    background: var(--bg-base);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
}

.column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px 12px 4px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 12px;
}

.column-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0;
}

.column-count {
    background: var(--bg-hover);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
}

.column-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
}

/* Task Card */
.task-card {
    background: var(--bg-card);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid var(--border-color);
}

.task-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.task-card-main { border-left: 3px solid var(--color-primary); }
.task-node-card { border-left: 3px solid var(--color-success); }

.task-badges {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.priority-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}
.priority-dot.critical { background: var(--color-danger); }
.priority-dot.high { background: var(--color-warning); }
.priority-dot.medium { background: var(--color-primary); }
.priority-dot.low { background: var(--color-success); }

.task-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 6px 0;
    line-height: 1.4;
}

.task-description {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.task-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.task-date {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-muted);
}

/* Drawer Styles */
:deep(.modern-drawer) {
    background: var(--bg-card) !important;
}
:deep(.modern-drawer .el-drawer__header) {
    margin-bottom: 0;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-main);
}
:deep(.modern-drawer .el-drawer__body) {
    background: var(--bg-card);
    color: var(--text-main);
}
.drawer-form {
    padding: 20px;
}
.full-width { width: 100%; }
.drawer-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    background: var(--bg-card);
}
</style>
