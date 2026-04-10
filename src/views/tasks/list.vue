<template>
  <div class="tasks-page">
    <!-- 页面头部 - Swiss Minimalism -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">任务列表</h1>
        <p class="page-desc">管理和追踪所有项目任务</p>
      </div>
      <button class="btn-primary" @click="openCreateTaskDialog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        创建任务
      </button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input v-model="query.keyword" placeholder="搜索任务名称..." class="search-input" />
        </div>
        <el-select v-model="query.priority" placeholder="优先级" clearable class="filter-select">
          <el-option label="紧急" :value="1" />
          <el-option label="高" :value="2" />
          <el-option label="中" :value="3" />
          <el-option label="低" :value="4" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" clearable class="filter-select">
          <el-option label="待处理" :value="0" />
          <el-option label="进行中" :value="1" />
          <el-option label="已完成" :value="2" />
        </el-select>
      </div>
      <button class="btn-icon" @click="resetFilter">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/>
          <path d="M8 16H3v5"/>
        </svg>
      </button>
    </div>

    <!-- 任务卡片网格 -->
    <div class="content-area">
      <div v-if="loading" class="skeleton-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-header"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w-80"></div>
            <div class="skeleton-line w-50"></div>
          </div>
        </div>
      </div>
      <template v-else>
        <div v-if="filteredRows.length > 0" class="tasks-grid">
          <div
            v-for="row in filteredRows"
            :key="row.id"
            class="task-card-wrapper"
          >
            <div
              class="task-card"
              :class="'priority-' + row.priorityType"
              :style="{ cursor: 'default' }"
            >
              <div class="card-header">
                <div class="task-title-row">
                  <el-checkbox 
                    v-model="row.checked" 
                    @change="() => {}" 
                    class="task-checkbox"
                  />
                  <h3 class="task-title" @click.stop="viewDetail(row.id)">{{ row.taskTitle }}</h3>
                  <el-dropdown trigger="click" @command="(cmd: string) => handleTaskMenu(cmd, row)" class="task-menu-dropdown">
                    <button class="menu-btn" @click.stop>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="view">查看详情</el-dropdown-item>
                        <el-dropdown-item command="edit">编辑任务</el-dropdown-item>
                        <el-dropdown-item command="add-node">添加节点</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除任务</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <span class="status-badge" :class="getStatusClass(row.status)">{{ row.statusText }}</span>
              </div>

              <div class="task-meta">
                <span class="meta-item priority" :class="row.priorityType">
                  <span class="priority-dot"></span>
                  {{ row.priorityText }}
                </span>
                <span class="meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {{ row.deadline || '无截止日期' }}
                </span>
              </div>

              <div class="progress-section">
                <div class="progress-header">
                  <span class="progress-label">进度</span>
                  <span class="progress-value">{{ row.progress }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :class="getProgressClass(row.progress)" :style="{ width: row.progress + '%' }"></div>
                </div>
              </div>

              <div class="expand-btn-row">
                <button class="expand-btn" @click.stop="toggleTaskExpand(row.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ rotated: expandedTasks.has(row.id) }">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  {{ expandedTasks.has(row.id) ? '收起节点' : '查看节点' }}
                  <span class="node-count" v-if="row.nodeCount > 0">{{ row.nodeCount }}</span>
                </button>
              </div>
            </div>

            <!-- 展开的任务节点列表 -->
            <div v-if="expandedTasks.has(row.id)" class="nodes-panel">
              <div v-if="nodesLoading.has(row.id)" class="nodes-loading">
                <el-icon class="is-loading"><Loading /></el-icon> 加载中...
              </div>
              <template v-else>
                <div v-if="taskNodesMap[row.id]?.length > 0" class="nodes-list">
                  <div v-for="node in taskNodesMap[row.id]" :key="node.TaskNodeId" class="node-item">
                    <div class="node-info">
                      <span class="node-title" @click.stop="goEditNode(node.TaskNodeId)">{{ node.NodeName || node.nodeName || node.TaskNodeTitle || '未命名节点' }}</span>
                      <span class="node-status" :class="'status-' + (node.NodeStatus ?? node.Status ?? node.status ?? 0)">
                        {{ (node.NodeStatus ?? node.Status ?? node.status) === 2 ? '已完成' : (node.NodeStatus ?? node.Status ?? node.status) === 1 ? '进行中' : '待处理' }}
                      </span>
                    </div>
                    <div class="node-meta">
                      <span v-if="node.LeaderName || node.leaderName">负责人: {{ node.LeaderName || node.leaderName }}</span>
                      <span v-if="node.ExecutorName || node.executorName">执行人: {{ node.ExecutorName || node.executorName }}</span>
                      <span v-if="node.EstimatedDays || node.estimatedDays">预计 {{ node.EstimatedDays || node.estimatedDays }} 天</span>
                    </div>
                    <el-dropdown trigger="click" @command="(cmd: string) => cmd === 'delete' ? handleDeleteNode(node, row.id) : goEditNode(node.TaskNodeId)" class="node-menu-dropdown">
                      <button class="node-menu-btn" @click.stop>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                      </button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="edit">编辑</el-dropdown-item>
                          <el-dropdown-item command="delete">删除</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
                <div v-else class="nodes-empty">
                  暂无任务节点
                </div>
              </template>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 12h6M9 16h6"/>
          </svg>
          <p>暂无任务</p>
          <button class="btn-secondary" @click="openCreateTaskDialog">创建第一个任务</button>
        </div>
      </template>
    </div>

    <!-- 创建任务抽屉 -->
    <el-drawer v-model="createTaskDialogVisible" title="创建任务" size="520px" :close-on-click-modal="false" destroy-on-close>
      <create-task-form v-if="createTaskDialogVisible" @success="handleTaskCreated" @cancel="createTaskDialogVisible = false" />
    </el-drawer>

    <!-- 创建节点抽屉 -->
    <el-drawer v-model="createNodeDialogVisible" title="创建任务节点" size="520px" :close-on-click-modal="false" destroy-on-close>
      <create-node-form v-if="createNodeDialogVisible" :task-id="selectedTaskId" @success="handleNodeCreated" @cancel="createNodeDialogVisible = false" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, computed } from 'vue';
import { useRouter } from 'vue-router';
import { listTasks, listTaskNodesByTask, deleteTask, deleteTaskNode } from '@/api';
import { clearDebounceForUrl } from '@/utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import CreateTaskForm from './create-task-form.vue';
import CreateNodeForm from '../tasknodes/create-node-form.vue';

const router = useRouter();
const rows = ref<any[]>([]);
const query = ref<any>({ keyword: '', priority: null, status: null });
const loading = ref(false);
const createTaskDialogVisible = ref(false);
const createNodeDialogVisible = ref(false);
const selectedTaskId = ref('');
const expandedTasks = ref<Set<string>>(new Set());
const taskNodesMap = ref<Record<string, any[]>>({});
const nodesLoading = ref<Set<string>>(new Set());
const taskExecutorsMap = ref<Record<string, any>>({});

const filteredRows = computed(() => {
  const { keyword, priority, status } = query.value;
  return rows.value.filter((r) => {
    const byKw = !keyword || r.taskTitle.toLowerCase().includes(keyword.toLowerCase());
    const byPr = !priority || r.priority === priority;
    const bySt = (status === '' || status === null || status === undefined) || r.status === status;
    return byKw && byPr && bySt;
  });
});

const resetFilter = () => { query.value = { keyword: '', priority: null, status: null }; };

function openCreateTaskDialog() { 
  router.push({ path: '/ai-task-creator', query: { mode: 'task' } });
}

function openCreateNodeDialog(row: any) {
  router.push({ path: '/task-nodes/create', query: { taskId: row.id } });
}

async function toggleTaskExpand(taskId: string) {
  if (expandedTasks.value.has(taskId)) {
    expandedTasks.value.delete(taskId);
  } else {
    expandedTasks.value.add(taskId);
    if (!taskNodesMap.value[taskId] && !nodesLoading.value.has(taskId)) {
      nodesLoading.value.add(taskId);
      try {
        console.log('请求节点列表, taskId:', taskId);
        const resp = await listTaskNodesByTask({ taskId });
        console.log('节点列表响应:', resp);
        if (resp.data.code === 200) {
          taskNodesMap.value[taskId] = resp.data.data || [];
        }
      } catch (e) {
        console.error('加载节点失败:', e);
      } finally {
        nodesLoading.value.delete(taskId);
      }
    }
  }
}

async function handleDeleteTask(task: any) {
  try {
    await ElMessageBox.confirm(`确定要删除任务「${task.taskTitle}」吗？`, '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' });
    const resp = await deleteTask({ taskId: task.id });
    if (resp.data.code === 200) {
      ElMessage.success('任务已删除');
      loadData();
    } else {
      ElMessage.error(resp.data.msg || '删除失败');
    }
  } catch (err: any) { if (err !== 'cancel') ElMessage.error('删除失败'); }
}

async function handleDeleteNode(node: any, taskId: string) {
  try {
    await ElMessageBox.confirm(`确定要删除任务节点「${node.TaskNodeTitle || node.nodeTitle || '未命名节点'}」吗？`, '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' });
    const resp = await deleteTaskNode({ nodeId: node.TaskNodeId || node.id });
    if (resp.data.code === 200) {
      ElMessage.success('节点已删除');
      taskNodesMap.value[taskId] = taskNodesMap.value[taskId].filter((n: any) => (n.TaskNodeId || n.id) !== (node.TaskNodeId || node.id));
    } else {
      ElMessage.error(resp.data.msg || '删除失败');
    }
  } catch (err: any) { if (err !== 'cancel') ElMessage.error('删除失败'); }
}

function goEditNode(nodeId: string) { router.push({ name: 'tasknodes-detail', params: { id: nodeId } }); }

function handleTaskMenu(cmd: string, row: any) {
  if (cmd === 'view') viewDetail(row.id);
  else if (cmd === 'edit') editTask(row.id);
  else if (cmd === 'add-node') openCreateNodeDialog(row);
  else if (cmd === 'delete') handleDeleteTask(row);
}

function handleTaskCreated() { createTaskDialogVisible.value = false; loadData(); }
function handleNodeCreated() { createNodeDialogVisible.value = false; selectedTaskId.value = ''; loadData(); }

function viewDetail(taskId: string) { router.push({ name: 'tasks-detail', params: { id: taskId } }); }
function editTask(taskId: string) { router.push({ name: 'tasks-detail', params: { id: taskId }, query: { edit: 'true' } }); }

function pr(p: number) {
  return p === 1 ? { text: '紧急', type: 'critical' } :
    p === 2 ? { text: '高', type: 'high' } :
    p === 3 ? { text: '中', type: 'medium' } : { text: '低', type: 'low' };
}

function getStatusClass(status: number) {
  if (status === 2) return 'completed';
  if (status === 1) return 'progress';
  return 'pending';
}

function getProgressClass(progress: number) {
  if (progress >= 100) return 'complete';
  if (progress >= 60) return 'high';
  return 'normal';
}

async function loadData() {
  loading.value = true;
  try {
    const resp = await listTasks({ page: 1, pageSize: 100 });
    if (resp.data.code !== 200) { ElMessage.error(resp.data.msg || '加载任务列表失败'); rows.value = []; return; }
    const list = resp.data?.data?.list || [];
    rows.value = list.map((t: any) => {
      const pri = pr((t.priority ?? t.taskPriority ?? 3) as number);
      const deadline = t.deadline || t.taskDeadline;
      const progress = Math.round(t.progress ?? 0);
      const status = t.status ?? 0;
      return {
        id: t.id || t.taskId,
        taskTitle: t.taskTitle || t.title || '未命名任务',
        priority: t.priority ?? t.taskPriority ?? 3,
        deadline: deadline ? new Date(deadline).toLocaleDateString('zh-CN') : '-',
        status, progress,
        priorityText: pri.text,
        priorityType: pri.type,
        statusText: status === 1 ? '进行中' : status === 2 ? '已完成' : '待处理',
        nodeCount: t.nodeCount || 0,
        checked: false,
      };
    });
  } catch (error: any) {
    // 忽略防抖取消的请求，不显示错误提示
    if (error.isDebounce || (error.message && error.message.includes('防抖'))) {
      console.log('请求被防抖拦截，跳过错误提示');
      return;
    }
    ElMessage.error('加载任务列表失败');
    rows.value = [];
  }
  finally { loading.value = false; }
}

onMounted(() => { loadData(); });
// keep-alive 激活时重新加载数据
onActivated(() => {
  // 清除防抖记录，确保页面切换后能重新加载数据
  clearDebounceForUrl('/task/list');
  loadData();
});
</script>


<style scoped>
.tasks-page {
  padding: var(--space-6);
  background: var(--bg-secondary);
  min-height: 100vh;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
}

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.btn-secondary {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.btn-secondary:hover {
  background: var(--color-primary);
  color: #fff;
}

.btn-secondary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.btn-icon:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary-light);
  color: var(--color-primary);
}

.btn-icon:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: var(--space-5);
}

.filter-left {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  height: 36px;
}

.search-box svg { color: var(--text-muted); flex-shrink: 0; }

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  width: 200px;
}

.search-input::placeholder { color: var(--text-muted); }
.filter-select { width: 110px; }

/* Skeleton */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.skeleton-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: var(--space-5);
}

.skeleton-header {
  height: 20px;
  width: 60%;
  background: linear-gradient(90deg, var(--border-light) 25%, var(--bg-secondary) 50%, var(--border-light) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: var(--space-4);
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-body { display: flex; flex-direction: column; gap: var(--space-2); }

.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, var(--border-light) 25%, var(--bg-secondary) 50%, var(--border-light) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-line.w-80 { width: 80%; }
.skeleton-line.w-50 { width: 50%; }

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Tasks Grid */
.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

/* Task Card - Modern Design */
.task-card {
  position: relative;
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  padding: var(--space-5);
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.task-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

/* Priority Indicator - Top Border Style */
.task-card.priority-critical { border-top: 3px solid #DC2626; }
.task-card.priority-high { border-top: 3px solid #D97706; }
.task-card.priority-medium { border-top: 3px solid #0284C7; }
.task-card.priority-low { border-top: 3px solid #94A3B8; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.task-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-wrap: balance;
}

/* Status Badge - Modern Tag Style */
.status-badge {
  font-size: var(--font-size-xs);
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.status-badge.completed { background: rgba(5, 150, 105, 0.1); color: #059669; }
.status-badge.progress { background: rgba(217, 119, 6, 0.1); color: #D97706; }
.status-badge.pending { background: rgba(29, 78, 216, 0.1); color: #1D4ED8; }

/* Task Meta */
.task-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.meta-item svg { opacity: 0.6; }

.meta-item.priority { font-weight: 500; }
.meta-item.priority.critical { color: #DC2626; }
.meta-item.priority.high { color: #D97706; }
.meta-item.priority.medium { color: #0284C7; }
.meta-item.priority.low { color: #94A3B8; }

.priority-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* Progress Section - Refined */
.progress-section {
  padding: var(--space-4) 0;
  border-top: 1px solid var(--border-light);
  margin-bottom: var(--space-4);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.progress-label { font-size: var(--font-size-xs); color: var(--text-muted); }
.progress-value { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-primary); }

.progress-bar {
  height: 6px;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(90deg, var(--color-warning) 0%, #F59E0B 100%);
}

.progress-fill.complete { background: linear-gradient(90deg, var(--color-success) 0%, #34D399 100%); }
.progress-fill.high { background: linear-gradient(90deg, var(--color-primary) 0%, #60A5FA 100%); }

/* Card Actions - Ghost Button Style */
.card-actions {
  display: flex;
  gap: var(--space-2);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary-light);
  color: var(--color-primary);
}

.action-btn.action-primary {
  background: transparent;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn.action-primary:hover {
  background: var(--color-primary);
  color: #fff;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-12);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
}

.empty-state svg { opacity: 0.4; }
.empty-state p { font-size: var(--font-size-sm); margin: 0; }

/* Responsive */
@media (max-width: 768px) {
  .tasks-page { padding: var(--space-4); }

  .page-header {
    flex-direction: column;
    gap: var(--space-4);
    align-items: stretch;
  }

  .btn-primary { width: 100%; justify-content: center; }

  .filter-bar {
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .filter-left {
    flex-direction: column;
    width: 100%;
  }

  .search-box, .filter-select { width: 100%; }
  .search-input { width: 100%; }

  .tasks-grid, .skeleton-grid { grid-template-columns: 1fr; }

  .card-actions { flex-wrap: wrap; }
  .action-btn { flex: 1 1 calc(50% - var(--space-1)); }
}

/* Dark Mode */
html.dark-mode .search-box { background: var(--bg-tertiary); }

html.dark-mode .status-badge.completed { background: rgba(52, 211, 153, 0.15); color: #34D399; }
html.dark-mode .status-badge.progress { background: rgba(251, 191, 36, 0.15); color: #FBBF24; }
html.dark-mode .status-badge.pending { background: rgba(96, 165, 250, 0.15); color: #60A5FA; }

html.dark-mode .action-btn.action-primary {
  background: transparent;
  border-color: #60A5FA;
  color: #60A5FA;
}

html.dark-mode .action-btn.action-primary:hover {
  background: #60A5FA;
  color: #0F172A;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .task-card,
  .skeleton-header,
  .skeleton-line,
  .progress-fill,
  .btn-primary,
  .btn-secondary,
  .btn-icon,
  .action-btn {
    animation: none;
    transition: none;
  }

  .btn-primary:hover,
  .task-card:hover {
    transform: none;
  }
}

/* New styles for task list with nodes */
.task-card-wrapper {
  display: flex;
  flex-direction: column;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
}

.task-checkbox {
  flex-shrink: 0;
}

.task-title {
  cursor: pointer;
}

.task-menu-dropdown {
  flex-shrink: 0;
  z-index: 10;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-muted);
  position: relative;
  z-index: 10;
}

.menu-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.expand-btn-row {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-light);
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.expand-btn:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary-light);
  color: var(--color-primary);
}

.expand-btn svg {
  transition: transform var(--transition-fast);
}

.expand-btn svg.rotated {
  transform: rotate(180deg);
}

.node-count {
  background: var(--color-primary);
  color: #fff;
  padding: 0 6px;
  border-radius: var(--radius-full);
  font-size: 10px;
}

.nodes-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  padding: var(--space-4);
  margin-top: -1px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1;
  position: relative;
}

.nodes-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 300px;
  overflow-y: auto;
}

.node-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.node-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.node-title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
}

.node-title:hover {
  color: var(--color-primary);
}

.node-status {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.node-status.status-0 {
  background: rgba(29, 78, 216, 0.1);
  color: #1D4ED8;
}

.node-status.status-1 {
  background: rgba(217, 119, 6, 0.1);
  color: #D97706;
}

.node-status.status-2 {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
}

.node-meta {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.node-menu-dropdown {
  flex-shrink: 0;
  z-index: 10;
}

.node-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
}

.node-menu-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nodes-more, .nodes-empty {
  text-align: center;
  padding: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
</style>
