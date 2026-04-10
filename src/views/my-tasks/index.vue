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
                  <div class="node-info">
                    <span class="node-title" @click.stop="openDrawer(node)">{{ node.NodeName || node.nodeName || '未命名节点' }}</span>
                    <span class="node-status" :class="'status-' + (node.NodeStatus ?? node.Status ?? node.status ?? 0)">
                      {{ (node.NodeStatus ?? node.Status ?? node.status) === 2 ? '已完成' : (node.NodeStatus ?? node.Status ?? node.status) === 1 ? '进行中' : '待处理' }}
                    </span>
                  </div>
                  <div class="node-meta">
                    <span v-if="node.LeaderName || node.leaderName">负责人: {{ node.LeaderName || node.leaderName }}</span>
                    <span v-if="node.ExecutorName || node.executorName">执行人: {{ node.ExecutorName || node.executorName }}</span>
                    <span v-if="node.EstimatedDays || node.estimatedDays">预计 {{ node.EstimatedDays || node.estimatedDays }} 天</span>
                  </div>
                  <el-dropdown trigger="click" @command="(cmd: string) => cmd === 'delete' ? handleDeleteNode(node, group.taskId) : openDrawer(node)" class="node-menu-dropdown">
                    <button class="node-menu-btn" @click.stop>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="view">查看详情</el-dropdown-item>
                        <el-dropdown-item command="delete">删除</el-dropdown-item>
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

    <!-- Task Node Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="currentTask?.nodeName || '任务节点详情'"
      size="650px"
      direction="rtl"
      class="task-node-drawer"
      :before-close="handleDrawerClose"
    >
      <div v-if="currentTask" class="drawer-content">
        <!-- Task Basic Info Card -->
        <div class="info-card">
          <div class="card-header">
            <el-icon :size="20" color="var(--color-primary)"><Document /></el-icon>
            <h3 class="card-title">基本信息</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">
                <el-icon><Document /></el-icon>
                所属任务
              </div>
              <el-button 
                link 
                type="primary" 
                class="task-link-btn"
                @click="goToTask(currentTask.taskId)"
              >
                {{ currentTask.taskTitle || '-' }}
                <el-icon><Right /></el-icon>
              </el-button>
            </div>
            <div class="info-item">
              <div class="info-label">
                <el-icon><OfficeBuilding /></el-icon>
                所属部门
              </div>
              <span class="info-value">
                <el-tag size="small" effect="plain">
                  {{ currentTask.departmentName || currentTask.department || '-' }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <div class="info-label">
                <el-icon><User /></el-icon>
                负责人
              </div>
              <span class="info-value">
                <el-avatar 
                  v-if="currentTask.leaderName" 
                  :size="24" 
                  style="margin-right: 6px; vertical-align: middle;"
                >
                  {{ currentTask.leaderName.charAt(0) }}
                </el-avatar>
                {{ currentTask.leaderName || currentTask.LeaderName || '-' }}
              </span>
            </div>
            <div class="info-item">
              <div class="info-label">
                <el-icon><Calendar /></el-icon>
                截止时间
              </div>
              <span class="info-value" :class="{ 'text-danger': isOverdue(currentTask.deadline) }">
                <el-icon><Warning /></el-icon>
                {{ currentTask.deadline ? new Date(currentTask.deadline).toLocaleDateString('zh-CN') : '-' }}
              </span>
            </div>
            <div class="info-item full-width">
              <div class="info-label">
                <el-icon><TrendCharts /></el-icon>
                进度
              </div>
              <div class="progress-wrapper">
                <el-progress 
                  :percentage="currentTask.progress || 0" 
                  :stroke-width="10"
                  :status="getProgressStatus(currentTask)"
                  :format="formatProgress"
                />
              </div>
            </div>
            <div class="info-item" v-if="currentTask.status !== undefined">
              <div class="info-label">
                <el-icon><CircleCheck /></el-icon>
                状态
              </div>
              <el-tag :type="getStatusType(currentTask.status)" size="small" effect="light">
                {{ getStatusText(currentTask.status) }}
              </el-tag>
            </div>
            <div class="info-item" v-if="currentTask.priority !== undefined">
              <div class="info-label">
                <el-icon><Flag /></el-icon>
                优先级
              </div>
              <el-tag :type="getPriorityType(currentTask.priority)" size="small" effect="light">
                {{ getPriorityText(currentTask.priority) }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- Checklist Section -->
        <div class="info-card">
          <div class="card-header">
            <el-icon :size="20" color="#10b981"><CircleCheck /></el-icon>
            <h3 class="card-title">检查清单</h3>
            <el-tag size="small" type="info" class="count-tag">
              {{ getCompletedCount(checklists) }}/{{ checklists.length }}
            </el-tag>
          </div>
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
                  size="large"
                />
                <div class="checklist-content-wrapper">
                  <span class="checklist-content">{{ item.content }}</span>
                  <span v-if="item.completeTime" class="checklist-time">
                    <el-icon><Clock /></el-icon>
                    {{ formatChecklistTime(item.completeTime) }}
                  </span>
                </div>
              </div>
            </div>
            <el-empty 
              v-else 
              description="暂无检查清单" 
              :image-size="100"
              class="empty-state"
            />
          </div>
        </div>

        <!-- Attachments Section -->
        <div class="info-card">
          <div class="card-header">
            <el-icon :size="20" color="#3b82f6"><Folder /></el-icon>
            <h3 class="card-title">附件</h3>
            <el-tag size="small" type="info" class="count-tag">
              {{ attachments.length }} 个文件
            </el-tag>
          </div>
          <div v-loading="attachmentLoading" class="attachment-container">
            <div v-if="attachments.length > 0" class="attachment-list">
              <div 
                v-for="file in attachments" 
                :key="file.fileId || file.id" 
                class="attachment-item"
              >
                <div class="attachment-icon" :class="getFileIconClass(file.fileType)">
                  <el-icon :size="28">
                    <component :is="getFileIcon(file.fileType)" />
                  </el-icon>
                </div>
                <div class="attachment-info">
                  <div class="attachment-name">{{ file.fileName || '未命名文件' }}</div>
                  <div class="attachment-meta">
                    <span>{{ file.fileSize ? formatFileSize(file.fileSize) : '-' }}</span>
                    <span v-if="file.uploadTime"> · {{ formatDate(file.uploadTime) }}</span>
                  </div>
                </div>
                <div class="attachment-actions">
                  <el-button 
                    circle
                    type="primary" 
                    :icon="View" 
                    size="small"
                    @click="previewAttachment(file)"
                    title="预览"
                  />
                  <el-button 
                    circle
                    type="success" 
                    :icon="Download" 
                    size="small"
                    @click="downloadAttachment(file)"
                    title="下载"
                  />
                </div>
              </div>
            </div>
            <el-empty 
              v-else 
              description="暂无附件" 
              :image-size="100"
              class="empty-state"
            />
          </div>
        </div>

        <!-- Comments Section -->
        <div class="info-card">
          <div class="card-header">
            <el-icon :size="20" color="#8b5cf6"><ChatDotRound /></el-icon>
            <h3 class="card-title">评论讨论</h3>
            <el-tag size="small" type="info" class="count-tag">
              {{ comments.length }} 条评论
            </el-tag>
          </div>
          <div v-loading="commentLoading" class="comment-container">
            <!-- Comment Input -->
            <div class="comment-input-box">
              <el-input
                v-model="newComment"
                type="textarea"
                :rows="3"
                placeholder="分享你的想法..."
                class="comment-input"
                maxlength="500"
                show-word-limit
              />
              <div class="comment-actions">
                <el-button type="primary" @click="submitComment" :icon="Promotion">
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
                <div class="comment-avatar">
                  <el-avatar :size="40">
                    {{ (comment.employeeName || '匿')[0] }}
                  </el-avatar>
                </div>
                <div class="comment-content-wrapper">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.employeeName || '匿名用户' }}</span>
                    <span class="comment-time">
                      <el-icon><Clock /></el-icon>
                      {{ formatCommentTime(comment.createTime) }}
                    </span>
                  </div>
                  <div class="comment-content">{{ comment.content }}</div>
                </div>
              </div>
            </div>
            <el-empty 
              v-else 
              description="暂无评论，快来抢沙发吧" 
              :image-size="100"
              class="empty-state"
            />
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Search, Refresh, User, Star, Calendar, OfficeBuilding, Document, Picture, Download, View, Loading,
  Right, TrendCharts, CircleCheck, Flag, Warning, Folder, ChatDotRound, Clock, Promotion
} from '@element-plus/icons-vue';
import { listMyTaskNodes, listTasks, listTaskNodesByTask, getChecklistList, updateChecklist, getTaskNodeAttachments, getTaskComments, createTaskComment, deleteTaskNode } from '@/api';
import { clearDebounceForUrl } from '@/utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getFileUrl } from '@/utils/fileUrl';

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

function openDrawer(task: any) {
  currentTask.value = task;
  drawerVisible.value = true;
  loadChecklists(task.id);
  loadAttachments(task.id);
  loadComments(task.taskId, task.id);
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
  if (!file.fileId) return;
  router.push({
    path: `/file/preview/${file.fileId}`,
    query: {
      taskId: currentTask.value?.taskId || '',
      nodeId: currentTask.value?.id || '',
      fileName: file.fileName
    }
  });
}

async function downloadAttachment(file: any) {
  if (!file.fileId && !file.fileUrl) return;
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      ElMessage.warning('请先登录');
      return;
    }
    const url = getFileUrl(file.fileUrl, file.fileId);
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      ElMessage.error('下载文件失败');
      return;
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = file.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  } catch (error) {
    console.error('下载文件失败:', error);
    ElMessage.error('下载文件失败');
  }
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

// ========== 新增的辅助函数 ==========
function handleDrawerClose(done: () => void) {
  drawerVisible.value = false;
  currentTask.value = null;
  checklists.value = [];
  attachments.value = [];
  comments.value = [];
  done();
}

function isOverdue(deadline: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function getProgressStatus(task: any): '' | 'success' | 'exception' | 'warning' {
  if (!task) return '';
  const progress = task.progress || 0;
  if (progress >= 100) return 'success';
  if (isOverdue(task.deadline)) return 'exception';
  const deadline = task.deadline ? new Date(task.deadline) : null;
  if (deadline) {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const daysLeft = diff / (1000 * 60 * 60 * 24);
    if (daysLeft <= 1) return 'warning';
  }
  return '';
}

function formatProgress(percentage: number): string {
  return `${percentage}%`;
}

function getStatusType(status: number): 'success' | 'warning' | 'info' | 'danger' {
  switch (status) {
    case 2: return 'success';
    case 1: return 'warning';
    case 0: return 'info';
    default: return 'info';
  }
}

function getStatusText(status: number): string {
  switch (status) {
    case 2: return '已完成';
    case 1: return '进行中';
    case 0: return '待处理';
    default: return '未知';
  }
}

function getPriorityType(priority: number): 'danger' | 'warning' | 'info' {
  switch (priority) {
    case 3: return 'danger';
    case 2: return 'warning';
    case 1: return 'info';
    default: return 'info';
  }
}

function getPriorityText(priority: number): string {
  switch (priority) {
    case 3: return '紧急';
    case 2: return '重要';
    case 1: return '普通';
    default: return '未知';
  }
}

function getCompletedCount(list: any[]): number {
  return list.filter(item => item.isCompleted === 1).length;
}

function formatChecklistTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return '刚刚完成';
  if (hours < 24) return `${hours}小时前完成`;
  if (days < 7) return `${days}天前完成`;
  return date.toLocaleDateString('zh-CN');
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '-';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

function getFileIconClass(fileType: string): string {
  if (!fileType) return 'file-icon-default';
  const type = fileType.toLowerCase();
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) {
    return 'file-icon-image';
  }
  if (type.includes('pdf')) {
    return 'file-icon-pdf';
  }
  if (type.includes('word') || type.includes('document')) {
    return 'file-icon-word';
  }
  if (type.includes('excel') || type.includes('sheet')) {
    return 'file-icon-excel';
  }
  return 'file-icon-default';
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
