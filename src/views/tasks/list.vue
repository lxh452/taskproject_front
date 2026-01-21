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
            class="task-card"
            :class="'priority-' + row.priorityType"
            @click="viewDetail(row.id)"
          >
            <div class="card-header">
              <h3 class="task-title">{{ row.taskTitle }}</h3>
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

            <div class="card-actions">
              <button class="action-btn" @click.stop="viewDetail(row.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                查看
              </button>
              <button class="action-btn" @click.stop="editTask(row.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                编辑
              </button>
              <button class="action-btn action-primary" @click.stop="openCreateNodeDialog(row)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                节点
              </button>
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
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

const resetFilter = () => { query.value = { keyword: '', priority: null, status: null }; };

function openCreateTaskDialog() { createTaskDialogVisible.value = true; }

function openCreateNodeDialog(row: any) {
  selectedTaskId.value = row.id;
  createNodeDialogVisible.value = true;
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
      };
    });
  } catch { ElMessage.error('加载任务列表失败'); rows.value = []; }
  finally { loading.value = false; }
}

onMounted(() => { loadData(); });
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
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover { background: var(--color-primary-hover); }

.btn-secondary {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover { background: var(--color-primary-light); }

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover { background: var(--bg-tertiary); color: var(--text-primary); }

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

/* Task Card with Priority Left Line */
.task-card {
  position: relative;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: var(--space-5);
  padding-left: calc(var(--space-5) + 3px);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
}

/* Priority Colors */
.task-card.priority-critical::before { background: #DC2626; }
.task-card.priority-high::before { background: #D97706; }
.task-card.priority-medium::before { background: #0284C7; }
.task-card.priority-low::before { background: #94A3B8; }

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
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
}

/* Status Badge */
.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.status-badge.completed { background: #D1FAE5; color: #059669; }
.status-badge.progress { background: #FEF3C7; color: #D97706; }
.status-badge.pending { background: #DBEAFE; color: #1D4ED8; }

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

/* Progress Section */
.progress-section {
  padding-top: var(--space-4);
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
  height: 4px;
  background: var(--border-light);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
  background: var(--color-warning);
}

.progress-fill.complete { background: var(--color-success); }
.progress-fill.high { background: var(--color-primary); }

/* Card Actions */
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
  padding: var(--space-2);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-btn.action-primary {
  background: var(--color-primary-light);
  border-color: transparent;
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
  background: rgba(96, 165, 250, 0.15);
  color: #60A5FA;
}

html.dark-mode .action-btn.action-primary:hover {
  background: #60A5FA;
  color: #0F172A;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .task-card, .skeleton-header, .skeleton-line, .progress-fill { animation: none; transition: none; }
}
</style>
