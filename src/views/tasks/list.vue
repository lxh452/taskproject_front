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
      const progress = Math.round(t.progress ?? 0);
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
.tasks-page {
  padding: 20px;
  background: #f9fafb;
  min-height: calc(100vh - 64px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.create-btn {
  height: 40px;
  padding: 0 20px;
  font-weight: 500;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input { width: 240px; }
.filter-select { width: 120px; }

.priority-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.danger { background: #ef4444; }
.dot.warning { background: #f59e0b; }
.dot.info { background: #4f46e5; }
.dot.success { background: #10b981; }

/* 任务网格 */
.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* 任务卡片 */
.task-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 18px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.task-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.task-icon.danger { background: #fee2e2; color: #ef4444; }
.task-icon.warning { background: #fef3c7; color: #f59e0b; }
.task-icon.info { background: #e0e7ff; color: #4f46e5; }
.task-icon.success { background: #d1fae5; color: #10b981; }

.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
}

.status-badge.success { background: #d1fae5; color: #059669; }
.status-badge.warning { background: #fef3c7; color: #d97706; }
.status-badge.default { background: #f3f4f6; color: #6b7280; }

.card-body { margin-bottom: 14px; }

.task-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #6b7280;
}

.meta-item.priority .dot { width: 5px; height: 5px; }
.meta-item.priority.danger { color: #ef4444; }
.meta-item.priority.warning { color: #f59e0b; }
.meta-item.priority.info { color: #4f46e5; }
.meta-item.priority.success { color: #10b981; }

.card-footer {
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label { font-size: 11px; color: #6b7280; }
.progress-value { font-size: 11px; font-weight: 600; color: #1f2937; }

/* 操作按钮 */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.card-actions .action-btn {
  flex: 1;
  height: 34px;
  font-size: 12px;
}

/* 空状态 */
.empty-state {
  padding: 60px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* 抽屉 */
:deep(.vben-drawer .el-drawer__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.vben-drawer .el-drawer__body) {
  padding: 20px;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .tasks-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .tasks-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .page-title {
    font-size: 20px;
  }

  .page-desc {
    font-size: 13px;
  }

  .create-btn {
    width: 100%;
    height: 44px;
  }

  .filter-bar {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .filter-left {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .filter-right {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  .tasks-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .task-card {
    padding: 14px;
  }

  .card-header {
    margin-bottom: 12px;
  }

  .task-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .task-title {
    font-size: 14px;
    min-height: auto;
    -webkit-line-clamp: 3;
  }

  .task-meta {
    flex-wrap: wrap;
    gap: 10px;
  }

  .card-actions {
    flex-wrap: wrap;
  }

  .card-actions .action-btn {
    flex: 1 1 calc(50% - 4px);
    min-width: 0;
  }

  .empty-state {
    padding: 40px 20px;
  }
}

/* 小屏幕适配 */
@media (max-width: 480px) {
  .tasks-page {
    padding: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .filter-bar {
    padding: 10px;
  }

  .task-card {
    padding: 12px;
  }

  .card-actions .action-btn {
    flex: 1 1 100%;
    height: 38px;
  }
}

/* 抽屉移动端适配 */
@media (max-width: 768px) {
  :deep(.el-drawer) {
    width: 100% !important;
    max-width: 100vw !important;
  }
}
</style>
