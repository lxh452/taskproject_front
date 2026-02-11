<template>
  <div class="dashboard-kanban">
    <div class="kanban-header">
      <el-select v-model="filterStatus" placeholder="状态筛选" clearable size="small" class="filter-select">
        <el-option label="全部" value="" />
        <el-option label="待处理" :value="0" />
        <el-option label="进行中" :value="1" />
        <el-option label="已完成" :value="2" />
      </el-select>
    </div>
    
    <div class="kanban-board" v-loading="loading">
      <!-- 待处理列 -->
      <div class="kanban-column">
        <div class="column-header">
          <div class="column-indicator pending"></div>
          <span class="column-title">待处理</span>
          <span class="column-count">{{ pendingTasks.length }}</span>
        </div>
        <div class="column-body">
          <div 
            v-for="task in pendingTasks" 
            :key="task.id" 
            class="task-card"
            :class="getPriorityClass(task.priority)"
            @click="viewTask(task)"
          >
            <div class="task-header">
              <span class="task-title">{{ task.name || task.nodeName || '-' }}</span>
              <span class="task-status status-pending">待处理</span>
            </div>
            <p v-if="task.taskTitle" class="task-desc">{{ task.taskTitle }}</p>
            <div class="task-progress-bar">
              <div class="progress-fill" :style="{ width: (task.progress || 0) + '%' }"></div>
            </div>
            <div class="task-footer">
              <span class="task-progress-text">{{ task.progress || 0 }}%</span>
              <span v-if="task.endTime" class="task-date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ formatDate(task.endTime) }}
              </span>
            </div>
          </div>
          <div v-if="pendingTasks.length === 0" class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            <span>暂无待处理任务</span>
          </div>
        </div>
      </div>

      <!-- 进行中列 -->
      <div class="kanban-column">
        <div class="column-header">
          <div class="column-indicator in-progress"></div>
          <span class="column-title">进行中</span>
          <span class="column-count">{{ inProgressTasks.length }}</span>
        </div>
        <div class="column-body">
          <div 
            v-for="task in inProgressTasks" 
            :key="task.id" 
            class="task-card"
            :class="getPriorityClass(task.priority)"
            @click="viewTask(task)"
          >
            <div class="task-header">
              <span class="task-title">{{ task.name || task.nodeName || '-' }}</span>
              <span class="task-status status-progress">进行中</span>
            </div>
            <p v-if="task.taskTitle" class="task-desc">{{ task.taskTitle }}</p>
            <div class="task-progress-bar">
              <div class="progress-fill progress-warning" :style="{ width: (task.progress || 0) + '%' }"></div>
            </div>
            <div class="task-footer">
              <span class="task-progress-text">{{ task.progress || 0 }}%</span>
              <span v-if="task.endTime" class="task-date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ formatDate(task.endTime) }}
              </span>
            </div>
          </div>
          <div v-if="inProgressTasks.length === 0" class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <span>暂无进行中任务</span>
          </div>
        </div>
      </div>

      <!-- 已完成列 -->
      <div class="kanban-column">
        <div class="column-header">
          <div class="column-indicator completed"></div>
          <span class="column-title">已完成</span>
          <span class="column-count">{{ completedTasks.length }}</span>
        </div>
        <div class="column-body">
          <div 
            v-for="task in completedTasks" 
            :key="task.id" 
            class="task-card task-completed"
            @click="viewTask(task)"
          >
            <div class="task-header">
              <span class="task-title">{{ task.name || task.nodeName || '-' }}</span>
              <span class="task-status status-completed">已完成</span>
            </div>
            <p v-if="task.taskTitle" class="task-desc">{{ task.taskTitle }}</p>
            <div class="task-progress-bar">
              <div class="progress-fill progress-success" style="width: 100%"></div>
            </div>
            <div class="task-footer">
              <span class="task-progress-text">100%</span>
              <span v-if="task.finishTime" class="task-date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <path d="M22 4L12 14.01l-3-3"/>
                </svg>
                {{ formatDate(task.finishTime) }}
              </span>
            </div>
          </div>
          <div v-if="completedTasks.length === 0" class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
            <span>暂无已完成任务</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getMyTaskNodes } from '@/api';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const tasks = ref<any[]>([]);
const filterStatus = ref<number | string>('');

const pendingTasks = computed(() => tasks.value.filter(t => (t.status ?? t.nodeStatus ?? 0) === 0));
const inProgressTasks = computed(() => tasks.value.filter(t => (t.status ?? t.nodeStatus ?? 0) === 1));
const completedTasks = computed(() => tasks.value.filter(t => (t.status ?? t.nodeStatus ?? 0) === 2));

function getPriorityClass(priority: number): string {
  switch (priority) {
    case 1: return 'priority-critical';
    case 2: return 'priority-high';
    case 3: return 'priority-medium';
    case 4: return 'priority-low';
    default: return 'priority-medium';
  }
}

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
    navigateToTaskNode(nodeId);
  }
}

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

async function loadTasks() {
  loading.value = true;
  try {
    const resp = await getMyTaskNodes({ page: 1, pageSize: 100 });
    if (resp.data?.code === 200) {
      const data = resp.data?.data || {};
      const executorTasks = data.executor_task || data.executorTask || [];
      const leaderTasks = data.leader_task || data.leaderTask || [];
      
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
            priority: t.priority ?? 3,
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
  margin-bottom: var(--space-4);
}

.filter-select {
  width: 120px;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  flex: 1;
  min-height: 0;
}

.kanban-column {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 680px;
}

/* Column Header - Swiss Minimalism */
.column-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
}

.column-indicator {
  width: 3px;
  height: 16px;
  border-radius: 2px;
}

.column-indicator.pending {
  background: var(--color-info);
}

.column-indicator.in-progress {
  background: var(--color-warning);
}

.column-indicator.completed {
  background: var(--color-success);
}

.column-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.column-count {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.column-body {
  padding: var(--space-3);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 600px;
}

/* Task Card - Priority Left Line */
.task-card {
  position: relative;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  padding-left: calc(var(--space-4) + 3px);
  cursor: pointer;
  border: 1px solid var(--border-color);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

/* Priority Colors */
.task-card.priority-critical::before { background: #DC2626; }
.task-card.priority-high::before { background: #D97706; }
.task-card.priority-medium::before { background: #0284C7; }
.task-card.priority-low::before { background: #94A3B8; }
.task-card.task-completed::before { background: #059669; }

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.task-card.task-completed {
  opacity: 0.85;
}

/* Task Header */
.task-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.task-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  flex: 1;
}

/* Status Tags */
.task-status {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.status-pending {
  background: #DBEAFE;
  color: #1D4ED8;
}

.status-progress {
  background: #FEF3C7;
  color: #D97706;
}

.status-completed {
  background: #D1FAE5;
  color: #059669;
}

.task-desc {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: 0 0 var(--space-3) 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Progress Bar */
.task-progress-bar {
  height: 3px;
  background: var(--border-light);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--space-3);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-fill.progress-warning {
  background: var(--color-warning);
}

.progress-fill.progress-success {
  background: var(--color-success);
}

/* Task Footer */
.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.task-progress-text {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-weight: 500;
}

.task-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.task-date svg {
  opacity: 0.6;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-4);
  color: var(--text-muted);
}

.empty-state svg {
  opacity: 0.4;
}

.empty-state span {
  font-size: var(--font-size-sm);
}

/* Responsive */
@media (max-width: 1024px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
  
  .kanban-column {
    max-height: 320px;
  }
}

/* Dark Mode */
html.dark-mode .column-header {
  background: var(--bg-secondary);
}

html.dark-mode .task-card {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

html.dark-mode .status-pending {
  background: rgba(59, 130, 246, 0.15);
  color: #60A5FA;
}

html.dark-mode .status-progress {
  background: rgba(251, 191, 36, 0.15);
  color: #FBBF24;
}

html.dark-mode .status-completed {
  background: rgba(52, 211, 153, 0.15);
  color: #34D399;
}

/* Custom Scrollbar for Column Body */
.column-body::-webkit-scrollbar {
  width: 6px;
}

.column-body::-webkit-scrollbar-track {
  background: var(--border-light);
  border-radius: 3px;
}

.column-body::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.column-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Show scroll hint when more than 6 tasks */
.column-header:has(~ .column-body > .task-card:nth-child(7))::after {
  content: '↓ 滚动查看更多';
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
  font-weight: 400;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .task-card,
  .progress-fill {
    transition: none;
  }
}
</style>
