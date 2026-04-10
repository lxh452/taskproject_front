<template>
  <div class="my-tasks-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">我的任务</h1>
      <p class="page-subtitle">查看和管理分配给我的所有任务节点</p>
    </div>

    <!-- 按任务分组的节点列表 -->
    <div class="filters-bar">
      <el-input 
        v-model="filters.keyword" 
        placeholder="搜索节点名称或任务" 
        clearable 
        class="filter-input"
        :prefix-icon="Search"
      />
      <el-select v-model="filters.status" placeholder="状态" clearable class="filter-select">
        <el-option label="待处理" :value="0" />
        <el-option label="进行中" :value="1" />
        <el-option label="已完成" :value="2" />
      </el-select>
      <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
    </div>

    <!-- 按任务分组的节点列表 -->
    <div class="task-list" v-loading="loading">
      <template v-if="groupedTasks.length > 0">
        <div v-for="group in groupedTasks" :key="group.taskId" class="task-card-wrapper">
          <div class="task-card" @click.stop="toggleTaskExpand(group.taskId)">
            <div class="task-card-header">
              <div class="task-info">
                <h3 class="task-name">{{ group.taskTitle }}</h3>
                <span class="node-count">{{ group.nodes.length }} 个节点</span>
              </div>
              <div class="task-header-actions">
                <button class="expand-btn" @click.stop="toggleTaskExpand(group.taskId)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ rotated: expandedTasks[group.taskId] }">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  {{ expandedTasks[group.taskId] ? '收起' : '展开' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 节点浮窗 -->
          <div v-if="expandedTasks[group.taskId]" class="nodes-panel">
            <div v-if="nodesLoading[group.taskId]" class="nodes-loading">
              <el-icon class="is-loading"><Loading /></el-icon> 加载中...
            </div>
            <template v-else>
              <div v-if="taskNodesMap[group.taskId]?.length > 0" class="nodes-list">
                <div v-for="node in taskNodesMap[group.taskId]" :key="node.TaskNodeId" class="node-item">
                  <div class="node-info" @click.stop="goToTask(group.taskId)">
                    <span class="node-title">{{ node.NodeName || node.nodeName || '未命名节点' }}</span>
                    <span class="node-status" :class="'status-' + (node.NodeStatus ?? node.Status ?? node.status ?? 0)">
                      {{ (node.NodeStatus ?? node.Status ?? node.status) === 2 ? '已完成' : (node.NodeStatus ?? node.Status ?? node.status) === 1 ? '进行中' : '待处理' }}
                    </span>
                  </div>
                  <div class="node-meta">
                    <span v-if="node.LeaderName || node.leaderName">负责人: {{ node.LeaderName || node.leaderName }}</span>
                    <span v-if="node.ExecutorName || node.executorName">执行人: {{ node.ExecutorName || node.executorName }}</span>
                    <span v-if="node.EstimatedDays || node.estimatedDays">预计 {{ node.EstimatedDays || node.estimatedDays }} 天</span>
                  </div>
                  <el-dropdown trigger="click" @command="(cmd: string) => cmd === 'delete' ? handleDeleteNode(node, group.taskId) : goToTask(group.taskId)" class="node-menu-dropdown">
                    <button class="node-menu-btn" @click.stop>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="view">查看任务详情</el-dropdown-item>
                        <el-dropdown-item command="delete">删除节点</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              <div v-else class="nodes-empty">暂无任务节点</div>
            </template>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="暂无任务节点" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Search, Refresh, User, Star, Calendar, OfficeBuilding, Loading
} from '@element-plus/icons-vue';
import { listMyTaskNodes, listTasks, listTaskNodesByTask, deleteTaskNode } from '@/api';
import { clearDebounceForUrl } from '@/utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();

// State
const activeTab = ref('executor');
const loading = ref(false);
const executorTasks = ref<any[]>([]);
const leaderTasks = ref<any[]>([]);
const taskMap = ref<Record<string, any>>({});

// 按任务分组
const expandedTasks = ref<Record<string, boolean>>({});
const taskNodesMap = ref<Record<string, any[]>>({});
const nodesLoading = ref<Record<string, boolean>>({});

// Filters
const filters = ref({
  keyword: '',
  status: null as number | null,
});

// Computed
const currentTasks = computed(() => {
  return activeTab.value === 'executor' ? executorTasks.value : leaderTasks.value;
});

const filteredTasks = computed(() => {
  const { keyword, status } = filters.value;
  return currentTasks.value.filter((task) => {
    const matchKeyword = !keyword || 
      task.nodeName.toLowerCase().includes(keyword.toLowerCase()) ||
      task.taskTitle.toLowerCase().includes(keyword.toLowerCase());
    const matchStatus = status === null || task.status === status;
    return matchKeyword && matchStatus;
  });
});

// 按任务分组
interface TaskGroup {
  taskId: string;
  taskTitle: string;
  nodes: any[];
}

const groupedTasks = computed((): TaskGroup[] => {
  const taskGroups: Record<string, TaskGroup> = {};
  filteredTasks.value.forEach((task) => {
    const tid = task.taskId;
    if (!tid) return;
    if (!taskGroups[tid]) {
      taskGroups[tid] = {
        taskId: tid,
        taskTitle: task.taskTitle,
        nodes: []
      };
    }
    taskGroups[tid].nodes.push(task);
  });
  return Object.values(taskGroups).filter(g => g.nodes.length > 0);
});

// Methods
function getStatusClass(status: number) {
  if (status === 2) return 'status-success';
  if (status === 1) return 'status-warning';
  return 'status-info';
}

function handleTabChange() {
  // Tab changed, filters remain
}

function resetFilters() {
  filters.value = {
    keyword: '',
    status: null,
  };
}

async function toggleTaskExpand(taskId: string) {
  if (!taskId || typeof taskId !== 'string') return;
  
  if (expandedTasks.value[taskId]) {
    delete expandedTasks.value[taskId];
  } else {
    expandedTasks.value[taskId] = true;
    if (!taskNodesMap.value[taskId] && !nodesLoading.value[taskId]) {
      nodesLoading.value[taskId] = true;
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
        nodesLoading.value[taskId] = false;
      }
    }
  }
}

async function handleDeleteNode(node: any, taskId: string) {
  try {
    await ElMessageBox.confirm(`确定要删除任务节点「${node.NodeName || node.nodeName || '未命名节点'}」吗？`, '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' });
    const resp = await deleteTaskNode({ nodeId: node.TaskNodeId || node.id });
    if (resp.data.code === 200) {
      ElMessage.success('节点已删除');
      loadMyTasks();
    } else {
      ElMessage.error(resp.data.msg || '删除失败');
    }
  } catch (err: any) { if (err !== 'cancel') ElMessage.error('删除失败'); }
}

function goToTask(taskId: string) {
  if (!taskId) {
    ElMessage.warning('任务 ID 不存在');
    return;
  }
  // 确保 taskId 是有效的字符串
  const tid = String(taskId).trim();
  if (tid) {
    router.push(`/tasks/detail/${tid}`);
  } else {
    ElMessage.warning('无效的任务 ID');
  }
}

async function loadTasks() {
  try {
    const resp = await listTasks({ page: 1, pageSize: 1000 });
    if (resp.data?.code === 200) {
      const list = resp.data?.data?.list || [];
      list.forEach((t: any) => {
        const taskId = t.taskId || t.id;
        if (taskId) {
          taskMap.value[String(taskId)] = {
            id: taskId,
            title: t.taskTitle || t.title || '未命名任务',
          };
        }
      });
    }
  } catch (error: any) {
    console.error('加载任务列表失败:', error);
  }
}

async function loadMyTasks() {
  loading.value = true;
  try {
    await loadTasks();
    const resp = await listMyTaskNodes({ page: 1, pageSize: 1000 });
    
    if (resp.data.code !== 200) {
      ElMessage.error(resp.data.msg || '加载失败');
      return;
    }

    const responseData = resp.data?.data || resp.data || {};
    const leaderList = responseData.leader_task || [];
    const executorList = responseData.executor_task || [];

    const now = Date.now();
    const processNodes = (nodes: any[]) => {
      return nodes
        .filter((n: any) => {
          const nodeId = n.id || n.taskNodeId;
          const nodeName = n.nodeName || n.taskNodeName || n.NodeName;
          return nodeId && nodeName && nodeName.trim() !== '';
        })
        .map((n: any) => {
          const deadline = n.nodeDeadline || n.endTime;
          const left = deadline ? Math.ceil((Date.parse(deadline) - now) / (24 * 3600 * 1000)) : 0;
          const progress = n.progress ?? 0;
          const status = n.status ?? n.nodeStatus ?? 0;
          const taskId = n.taskId || n.TaskId || '';
          const task = taskMap.value[String(taskId)];

          return {
            id: n.id || n.taskNodeId,
            nodeName: n.nodeName || n.taskNodeName || n.NodeName,
            taskId,
            taskTitle: task?.title || n.taskTitle || n.TaskTitle || '未命名任务',
            department: n.departmentName || n.departmentId || '-',
            deadline: deadline ? new Date(deadline).toLocaleDateString('zh-CN') : '-',
            progress,
            status,
            statusText: status === 1 ? '进行中' : status === 2 ? '已完成' : status === 0 ? '待处理' : '未知',
            progressStatus: left < 0 && progress < 100 ? 'exception' : left <= 1 && progress < 100 ? 'warning' : undefined,
          };
        });
    };

    executorTasks.value = processNodes(executorList);
    leaderTasks.value = processNodes(leaderList);
    
    // 调试信息
    console.log('【调试】API返回数据:', {
      executorListLength: executorList.length,
      leaderListLength: leaderList.length,
      executorTaskCount: responseData.executor_task_count,
      leaderTaskCount: responseData.leader_task_count
    });
    console.log('【调试】处理后数据:', {
      executorTasksLength: executorTasks.value.length,
      leaderTasksLength: leaderTasks.value.length
    });
    console.log('【调试】当前Tab:', activeTab.value);
    console.log('【调试】filteredTasks:', filteredTasks.value.length);
  } catch (error: any) {
    // 忽略防抖取消的请求，不显示错误提示
    if (error.isDebounce || (error.message && error.message.includes('防抖'))) {
      console.log('请求被防抖拦截，跳过错误提示');
      return;
    }
    console.error('加载任务节点失败:', error);
    ElMessage.error('网络错误，请稍后重试');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadMyTasks();
});
// keep-alive 激活时重新加载数据
onActivated(() => {
  // 清除防抖记录，确保页面切换后能重新加载数据
  clearDebounceForUrl('/tasknode/my');
  clearDebounceForUrl('/task/list');
  loadMyTasks();
});
</script>

<style scoped>
.my-tasks-page {
  padding: var(--space-6);
  background: var(--bg-page);
  min-height: calc(100vh - var(--header-height));
}

/* Header */
.page-header {
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.page-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Tabs */
.task-tabs {
  margin-bottom: var(--space-4);
}

.tab-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tab-badge {
  margin-left: var(--space-1);
}

/* Filters */
.filters-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.filter-input {
  width: 300px;
}

.filter-select {
  width: 140px;
}

/* Task List */
.task-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: var(--space-4);
}

.task-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid var(--border-color);
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
  gap: var(--space-3);
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  flex-shrink: 0;
}

.view-details-btn {
    display: none;
  }

/* 浮窗样式 */
.task-card-wrapper {
  position: relative;
  margin-bottom: var(--space-4);
}

.task-card {
  cursor: pointer;
  transition: all var(--transition-fast);
}

.task-card:hover {
  border-color: var(--color-primary-light);
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.node-count {
  background: var(--color-primary);
  color: #fff;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  cursor: pointer;
}

.expand-btn svg {
  transition: transform var(--transition-fast);
}

.expand-btn svg.rotated {
  transform: rotate(180deg);
}

/* 浮窗 */
.nodes-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-top: var(--space-2);
  max-height: 400px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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
}

.node-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
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
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.node-menu-dropdown {
  flex-shrink: 0;
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

.nodes-empty {
  text-align: center;
  padding: var(--space-4);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}
</style>
