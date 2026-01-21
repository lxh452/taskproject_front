<template>
  <div class="my-tasks-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">我的任务</h1>
      <p class="page-subtitle">查看和管理分配给我的所有任务节点</p>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="task-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="执行中" name="executor">
        <template #label>
          <span class="tab-label">
            <el-icon><User /></el-icon>
            执行中
            <el-badge v-if="executorTasks.length > 0" :value="executorTasks.length" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="负责中" name="leader">
        <template #label>
          <span class="tab-label">
            <el-icon><Star /></el-icon>
            负责中
            <el-badge v-if="leaderTasks.length > 0" :value="leaderTasks.length" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- Filters -->
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

    <!-- Task List -->
    <div class="task-list" v-loading="loading">
      <div 
        v-for="task in filteredTasks" 
        :key="task.id" 
        class="task-card"
        @click="openDrawer(task)"
      >
        <div class="task-card-header">
          <div class="task-info">
            <h3 class="task-name">{{ task.nodeName }}</h3>
            <p class="task-subtitle">{{ task.taskTitle }}</p>
          </div>
          <div class="task-header-actions">
            <div class="task-status" :class="getStatusClass(task.status)">
              {{ task.statusText }}
            </div>
            <el-button 
              type="primary" 
              size="small" 
              :icon="View"
              @click.stop="goToTask(task.taskId)"
              class="view-details-btn"
            >
              查看详情
            </el-button>
          </div>
        </div>
        
        <div class="task-card-body">
          <div class="task-meta">
            <div class="meta-item">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ task.department || '-' }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ task.deadline || '-' }}</span>
            </div>
          </div>
          
          <div class="task-progress">
            <el-progress 
              :percentage="task.progress" 
              :status="task.progressStatus"
              :stroke-width="6"
            />
          </div>
        </div>
      </div>

      <el-empty v-if="filteredTasks.length === 0 && !loading" description="暂无任务节点" />
    </div>

    <!-- Task Node Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="currentTask?.nodeName"
      size="60%"
      direction="rtl"
      class="task-drawer"
    >
      <div v-if="currentTask" class="drawer-content">
        <!-- Task Basic Info -->
        <div class="info-section">
          <h3 class="section-title">基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">所属任务</span>
              <el-button link type="primary" @click="goToTask(currentTask.taskId)">
                {{ currentTask.taskTitle }}
              </el-button>
            </div>
            <div class="info-item">
              <span class="info-label">部门</span>
              <span class="info-value">{{ currentTask.department || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">截止时间</span>
              <span class="info-value">{{ currentTask.deadline || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">进度</span>
              <el-progress :percentage="currentTask.progress" :stroke-width="8" />
            </div>
          </div>
        </div>

        <!-- Checklist Section -->
        <div class="info-section">
          <h3 class="section-title">清单列表</h3>
          <div v-loading="checklistLoading" class="checklist-container">
            <div v-if="checklists.length > 0" class="checklist-list">
              <div 
                v-for="item in checklists" 
                :key="item.id" 
                class="checklist-item"
                :class="{ 'completed': item.isCompleted === 1 }"
              >
                <el-checkbox 
                  :model-value="item.isCompleted === 1"
                  @change="toggleChecklistComplete(item)"
                  class="checklist-checkbox"
                />
                <span class="checklist-content">{{ item.content }}</span>
                <span v-if="item.completeTime" class="checklist-time">
                  {{ new Date(item.completeTime).toLocaleString('zh-CN') }}
                </span>
              </div>
            </div>
            <el-empty v-else description="暂无清单" :image-size="80" />
          </div>
        </div>

        <!-- Attachments Section -->
        <div class="info-section">
          <h3 class="section-title">附件</h3>
          <div v-loading="attachmentLoading" class="attachment-container">
            <div v-if="attachments.length > 0" class="attachment-list">
              <div 
                v-for="file in attachments" 
                :key="file.fileId" 
                class="attachment-item"
              >
                <div class="attachment-icon">
                  <el-icon :size="24">
                    <component :is="getFileIcon(file.fileType)" />
                  </el-icon>
                </div>
                <div class="attachment-info">
                  <div class="attachment-name">{{ file.fileName }}</div>
                  <div class="attachment-meta">
                    {{ file.fileSize ? Math.round(file.fileSize / 1024) + ' KB' : '-' }}
                  </div>
                </div>
                <div class="attachment-actions">
                  <el-button 
                    link 
                    type="primary" 
                    :icon="View" 
                    size="small"
                    @click="previewAttachment(file)"
                  >
                    预览
                  </el-button>
                  <el-button 
                    link 
                    type="primary" 
                    :icon="Download" 
                    size="small"
                    @click="downloadAttachment(file)"
                  >
                    下载
                  </el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无附件" :image-size="80" />
          </div>
        </div>

        <!-- Comments Section -->
        <div class="info-section">
          <h3 class="section-title">评论讨论</h3>
          <div v-loading="commentLoading" class="comment-container">
            <!-- Comment Input -->
            <div class="comment-input-box">
              <el-input
                v-model="newComment"
                type="textarea"
                :rows="3"
                placeholder="输入评论内容..."
                class="comment-input"
              />
              <div class="comment-actions">
                <el-button type="primary" @click="submitComment">
                  发表评论
                </el-button>
              </div>
            </div>

            <!-- Comment List -->
            <div v-if="comments.length > 0" class="comment-list">
              <div 
                v-for="comment in comments" 
                :key="comment.commentId || comment._id" 
                class="comment-item"
              >
                <div class="comment-header">
                  <span class="comment-author">{{ comment.employeeName || '匿名用户' }}</span>
                  <span class="comment-time">{{ formatCommentTime(comment.createTime) }}</span>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
              </div>
            </div>
            <el-empty v-else description="暂无评论" :image-size="80" />
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, User, Star, Calendar, OfficeBuilding, Document, Picture, Download, View } from '@element-plus/icons-vue';
import { listMyTaskNodes, listTasks, getChecklistList, updateChecklist, getTaskNodeAttachments, getTaskComments, createTaskComment } from '@/api';
import { ElMessage } from 'element-plus';

const router = useRouter();

// State
const activeTab = ref('executor');
const loading = ref(false);
const drawerVisible = ref(false);
const executorTasks = ref<any[]>([]);
const leaderTasks = ref<any[]>([]);
const currentTask = ref<any>(null);
const taskMap = ref<Record<string, any>>({});
const checklists = ref<any[]>([]);
const checklistLoading = ref(false);
const attachments = ref<any[]>([]);
const attachmentLoading = ref(false);
const comments = ref<any[]>([]);
const commentLoading = ref(false);
const newComment = ref('');

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

function openDrawer(task: any) {
  currentTask.value = task;
  drawerVisible.value = true;
  loadChecklists(task.id);
  loadAttachments(task.id);
  loadComments(task.taskId, task.id);
}

async function loadChecklists(taskNodeId: string) {
  checklistLoading.value = true;
  try {
    const resp = await getChecklistList({ taskNodeId });
    if (resp.data?.code === 200) {
      checklists.value = resp.data?.data?.list || [];
    } else {
      checklists.value = [];
    }
  } catch (error) {
    console.error('加载清单失败:', error);
    checklists.value = [];
  } finally {
    checklistLoading.value = false;
  }
}

async function toggleChecklistComplete(checklist: any) {
  try {
    const newStatus = checklist.isCompleted === 1 ? 0 : 1;
    const resp = await updateChecklist({
      checklistId: checklist.id,
      isCompleted: newStatus,
    });

    if (resp.data.code === 200) {
      checklist.isCompleted = newStatus;
      checklist.completeTime = newStatus === 1 ? new Date().toISOString() : null;
      ElMessage.success(newStatus === 1 ? '已完成' : '已取消完成');
      
      // Update progress in current task
      if (currentTask.value) {
        const total = checklists.value.length;
        const completed = checklists.value.filter(c => c.isCompleted === 1).length;
        currentTask.value.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      }
    } else {
      ElMessage.error(resp.data.msg || '操作失败');
    }
  } catch (error) {
    console.error('更新清单失败:', error);
    ElMessage.error('网络错误，请稍后重试');
  }
}

async function loadAttachments(taskNodeId: string) {
  attachmentLoading.value = true;
  try {
    const resp = await getTaskNodeAttachments({ taskNodeId });
    if (resp.data?.code === 200) {
      attachments.value = resp.data?.data?.list || resp.data?.data || [];
    } else {
      attachments.value = [];
    }
  } catch (error) {
    console.error('加载附件失败:', error);
    attachments.value = [];
  } finally {
    attachmentLoading.value = false;
  }
}

function getFileIcon(fileType: string) {
  if (!fileType) return Document;
  const type = fileType.toLowerCase();
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) {
    return Picture;
  }
  return Document;
}

function isImage(fileType: string): boolean {
  if (!fileType) return false;
  const type = fileType.toLowerCase();
  return type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('gif');
}

function previewAttachment(file: any) {
  if (file.fileUrl) {
    window.open(file.fileUrl, '_blank');
  }
}

function downloadAttachment(file: any) {
  if (!file.fileUrl) return;
  const link = document.createElement('a');
  link.href = file.fileUrl;
  link.download = file.fileName || 'download';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function loadComments(taskId: string, taskNodeId: string) {
  commentLoading.value = true;
  try {
    const resp = await getTaskComments({ taskId, taskNodeId, page: 1, pageSize: 100 });
    if (resp.data?.code === 200) {
      comments.value = resp.data?.data?.list || resp.data?.data || [];
    } else {
      comments.value = [];
    }
  } catch (error) {
    console.error('加载评论失败:', error);
    comments.value = [];
  } finally {
    commentLoading.value = false;
  }
}

async function submitComment() {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }

  if (!currentTask.value) return;

  try {
    const resp = await createTaskComment({
      taskId: currentTask.value.taskId,
      taskNodeId: currentTask.value.id,
      content: newComment.value,
    });

    if (resp.data.code === 200) {
      ElMessage.success('评论成功');
      newComment.value = '';
      loadComments(currentTask.value.taskId, currentTask.value.id);
    } else {
      ElMessage.error(resp.data.msg || '评论失败');
    }
  } catch (error) {
    console.error('提交评论失败:', error);
    ElMessage.error('网络错误，请稍后重试');
  }
}

function formatCommentTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

function goToTask(taskId: string) {
  if (taskId) {
    router.push(`/tasks/detail/${taskId}`);
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
          const task = taskMap.value[String(taskId)] || {};

          return {
            id: n.id || n.taskNodeId,
            nodeName: n.nodeName || n.taskNodeName || n.NodeName,
            taskId,
            taskTitle: task.title || '-',
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
  } catch (error: any) {
    console.error('加载任务节点失败:', error);
    ElMessage.error('网络错误，请稍后重试');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
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
  white-space: nowrap;
}

.task-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-status {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.status-success {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.status-info {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.task-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.task-meta {
  display: flex;
  gap: var(--space-4);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.task-progress {
  margin-top: var(--space-2);
}

/* Drawer */
.task-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: var(--space-5);
  border-bottom: 1px solid var(--border-color);
}

.task-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.drawer-content {
  padding: var(--space-5);
}

.info-section {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-4) 0;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-color);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.info-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

/* Checklist */
.checklist-container {
  min-height: 100px;
}

.checklist-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.checklist-item:hover {
  background: var(--bg-hover);
}

.checklist-item.completed .checklist-content {
  color: var(--text-muted);
  text-decoration: line-through;
}

.checklist-checkbox {
  flex-shrink: 0;
}

.checklist-content {
  flex: 1;
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.checklist-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  flex-shrink: 0;
}

/* Attachments */
.attachment-container {
  min-height: 100px;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.attachment-item:hover {
  background: var(--bg-hover);
}

.attachment-icon {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-meta {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: var(--space-1);
}

.attachment-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

/* Comments */
.comment-container {
  min-height: 200px;
}

.comment-input-box {
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.comment-input {
  margin-bottom: var(--space-3);
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.comment-item {
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.comment-author {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.comment-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.comment-content {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .my-tasks-page {
    padding: var(--space-4);
  }

  .task-list {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-direction: column;
  }

  .filter-input {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .task-drawer {
    width: 100% !important;
  }

  .task-header-actions {
    flex-direction: row;
    align-items: center;
  }

  .view-details-btn {
    font-size: var(--font-size-xs);
    padding: 4px 8px;
  }
}
</style>
