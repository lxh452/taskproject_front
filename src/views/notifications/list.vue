<template>
  <div class="notifications-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">通知中心</h1>
        <p class="page-desc">查看所有系统通知和消息</p>
      </div>
      <div class="header-right">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <el-button :icon="Bell" circle />
        </el-badge>
        <el-button type="primary" :icon="Refresh" @click="loadData" circle />
      </div>
    </div>

    <div class="content-card">
      <el-tabs v-model="activeTab" class="notification-tabs">
        <el-tab-pane :label="`全部 (${filteredNotifications.length})`" name="all">
          <div class="notifications-list">
            <div
                v-for="notification in filteredNotifications"
                :key="notification.id"
                class="notification-item"
                :class="{ 'unread': !notification.isRead, 'has-actions': isJoinApplication(notification) || isTaskNodeCompletionApproval(notification) }"
            >
              <div class="notif-icon" :class="getIconClass(notification.type)">
                <el-icon><component :is="getIcon(notification.type)" /></el-icon>
              </div>
              <div class="notif-content" @click="handleNotificationClick(notification)">
                <div class="notif-header">
                  <span class="notif-title">{{ notification.title }}</span>
                  <div class="notif-tags">
                    <el-tag :type="getPriorityType(notification.priority)" size="small" effect="plain">{{ notification.priorityText }}</el-tag>
                    <el-tag :type="getTypeType(notification.type)" size="small" effect="plain">{{ notification.typeText }}</el-tag>
                  </div>
                </div>
                <div class="notif-body" v-if="notification.content">{{ notification.content }}</div>
                <div class="notif-time">{{ formatTime(notification.createTime) }}</div>
              </div>
              <div class="notif-actions" v-if="(isJoinApplication(notification) || isTaskNodeCompletionApproval(notification)) && canApprove">
                <el-button type="success" size="small" @click.stop="handleApprove(notification, true)">通过</el-button>
                <el-button type="danger" size="small" @click.stop="handleApprove(notification, false)">拒绝</el-button>
              </div>
              <div class="unread-dot" v-if="!notification.isRead"></div>
            </div>
            <el-empty v-if="filteredNotifications.length === 0" description="暂无通知" />
          </div>
        </el-tab-pane>
        <el-tab-pane :label="`未读 (${unreadNotifications.length})`" name="unread">
          <div class="notifications-list">
            <div
                v-for="notification in unreadNotifications"
                :key="notification.id"
                class="notification-item unread"
                :class="{ 'has-actions': isJoinApplication(notification) }"
            >
              <div class="notif-icon" :class="getIconClass(notification.type)">
                <el-icon><component :is="getIcon(notification.type)" /></el-icon>
              </div>
              <div class="notif-content" @click="handleNotificationClick(notification)">
                <div class="notif-header">
                  <span class="notif-title">{{ notification.title }}</span>
                  <div class="notif-tags">
                    <el-tag :type="getPriorityType(notification.priority)" size="small" effect="plain">{{ notification.priorityText }}</el-tag>
                  </div>
                </div>
                <div class="notif-body" v-if="notification.content">{{ notification.content }}</div>
                <div class="notif-time">{{ formatTime(notification.createTime) }}</div>
              </div>
              <div class="notif-actions" v-if="(isJoinApplication(notification) || isTaskNodeCompletionApproval(notification)) && canApprove">
                <el-button type="success" size="small" @click.stop="handleApprove(notification, true)">通过</el-button>
                <el-button type="danger" size="small" @click.stop="handleApprove(notification, false)">拒绝</el-button>
              </div>
              <div class="unread-dot"></div>
            </div>
            <el-empty v-if="unreadNotifications.length === 0" description="暂无未读通知" />
          </div>
        </el-tab-pane>
        <el-tab-pane :label="`已读 (${readNotifications.length})`" name="read">
          <div class="notifications-list">
            <div
                v-for="notification in readNotifications"
                :key="notification.id"
                class="notification-item read"
                @click="viewNotification(notification)"
            >
              <div class="notif-icon" :class="getIconClass(notification.type)">
                <el-icon><component :is="getIcon(notification.type)" /></el-icon>
              </div>
              <div class="notif-content">
                <div class="notif-header">
                  <span class="notif-title">{{ notification.title }}</span>
                </div>
                <div class="notif-body" v-if="notification.content">{{ notification.content }}</div>
                <div class="notif-time">{{ formatTime(notification.createTime) }}</div>
              </div>
            </div>
            <el-empty v-if="readNotifications.length === 0" description="暂无已读通知" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <!-- 审批弹窗 -->
  <el-dialog
      v-model="approveDialogVisible"
      :title="''"
      width="500px"
      class="approve-dialog"
      :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header" :class="approveForm.approved ? 'approve' : 'reject'">
        <div class="header-icon">
          <el-icon v-if="approveForm.approved"><CircleCheckFilled /></el-icon>
          <el-icon v-else><CircleCloseFilled /></el-icon>
        </div>
        <div class="header-text">
          <h3 class="header-title">{{ approveForm.approved ? '通过加入申请' : '拒绝加入申请' }}</h3>
          <p class="header-desc">{{ approveForm.approved ? '为新员工分配部门和职位' : '请说明拒绝原因' }}</p>
        </div>
      </div>
    </template>

    <div class="dialog-body">
      <!-- 申请人信息卡片 -->
      <div class="applicant-card" v-if="approveTarget">
        <div class="applicant-avatar">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="applicant-info">
          <div class="applicant-name">{{ approveTarget.title?.replace('新员工加入申请', '').replace('新员工申请加入:', '').trim() || '申请人' }}</div>
          <div class="applicant-time">申请时间：{{ formatTime(approveTarget.createTime) }}</div>
        </div>
      </div>

      <!-- 通过申请时的表单 -->
      <template v-if="approveForm.approved">
        <div class="form-section">
          <div class="form-label required">
            <el-icon><OfficeBuilding /></el-icon>
            选择部门
          </div>
          <el-select
              v-model="approveForm.departmentId"
              placeholder="请选择部门"
              filterable
              size="large"
              class="full-width"
              @change="(val:string)=>{approveForm.positionId=''; loadPositions(val);}"
          >
            <el-option v-for="d in departmentOptions" :key="d.id" :label="d.name" :value="d.id">
              <div class="option-item">
                <el-icon><Folder /></el-icon>
                <span>{{ d.name }}</span>
              </div>
            </el-option>
          </el-select>
        </div>

        <div class="form-section">
          <div class="form-label">
            <el-icon><Avatar /></el-icon>
            选择职位
            <span class="label-hint">（可选）</span>
          </div>
          <el-select
              v-model="approveForm.positionId"
              placeholder="不选择则由系统分配默认职位"
              filterable
              clearable
              size="large"
              class="full-width"
              :disabled="!approveForm.departmentId"
          >
            <el-option v-for="p in positionOptions" :key="p.id" :label="p.name" :value="p.id">
              <div class="option-item">
                <el-icon><UserFilled /></el-icon>
                <span>{{ p.name }}</span>
              </div>
            </el-option>
          </el-select>
        </div>

        <div class="form-section">
          <div class="form-label">
            <el-icon><ChatLineSquare /></el-icon>
            欢迎留言
            <span class="label-hint">（可选）</span>
          </div>
          <el-input
              v-model="approveForm.note"
              type="textarea"
              :rows="3"
              placeholder="欢迎加入我们的团队！"
              class="note-input"
          />
        </div>
      </template>

      <!-- 拒绝申请时的表单 -->
      <template v-else>
        <div class="form-section">
          <div class="form-label required">
            <el-icon><ChatLineSquare /></el-icon>
            拒绝原因
          </div>
          <el-input
              v-model="approveForm.note"
              type="textarea"
              :rows="4"
              placeholder="请详细说明拒绝原因，便于申请人了解情况..."
              class="note-input reject-note"
          />
        </div>
      </template>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="approveDialogVisible = false" :disabled="approveLoading" size="large" class="cancel-btn">
          取消
        </el-button>
        <el-button
            :type="approveForm.approved ? 'success' : 'danger'"
            :loading="approveLoading"
            @click="submitApprove"
            size="large"
            class="submit-btn"
        >
          <el-icon v-if="!approveLoading">
            <CircleCheckFilled v-if="approveForm.approved" />
            <CircleCloseFilled v-else />
          </el-icon>
          {{ approveForm.approved ? '确认通过' : '确认拒绝' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Refresh, Document, Warning, InfoFilled, CircleCheckFilled, CircleCloseFilled, UserFilled, OfficeBuilding, Folder, Avatar, ChatLineSquare } from '@element-plus/icons-vue';
import { listNotifications, markNotificationRead, approveJoinApplication, getMyEmployee, getPendingJoinApplications, listDepartments, listPositions, approveTaskNodeCompletion } from '@/api';
import request from '@/utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const rows = ref<any[]>([]);
const loading = ref(false);
const activeTab = ref('all');
const canApprove = ref(false);
const myEmployee = ref<any>(null);
const approveDialogVisible = ref(false);
const approveTarget = ref<any>(null);
const approveLoading = ref(false);
const departmentOptions = ref<any[]>([]);
const positionOptions = ref<any[]>([]);
const approveForm = ref({
  approved: true,
  note: '',
  departmentId: '',
  positionId: '',
});

const filteredNotifications = computed(() => rows.value);
const unreadNotifications = computed(() => rows.value.filter(n => !n.isRead));
const readNotifications = computed(() => rows.value.filter(n => n.isRead));
const unreadCount = computed(() => unreadNotifications.value.length);

function getIcon(type: number) { return type === 1 ? 'Document' : type === 2 ? 'Warning' : 'InfoFilled'; }
function getIconClass(type: number) { return type === 1 ? 'type-task' : type === 2 ? 'type-warning' : 'type-info'; }
function getPriorityType(priority: number) { return priority === 1 ? 'danger' : priority === 2 ? 'warning' : 'info'; }
function getTypeType(type: number) { return type === 1 ? 'primary' : type === 2 ? 'warning' : 'info'; }

function isJoinApplication(notification: any) {
  return notification.relatedType === 'join_application' || notification.category === 'join_application';
}

function isTaskNodeCompletionApproval(notification: any) {
  return notification.category === 'task.node.completion.approval' ||
      notification.title?.includes('任务节点完成审批') ||
      notification.content?.includes('任务节点') && notification.content?.includes('完成审批');
}

function formatTime(time: string) {
  if (!time) return '-';
  let date: Date;
  if (!time.includes('Z') && !time.includes('+')) { date = new Date(time.replace(' ', 'T') + 'Z'); } else { date = new Date(time); }
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function handleNotificationClick(notification: any) {
  if (!notification.isRead) {
    try {
      const resp = await markNotificationRead({ notificationId: notification.id || notification.Id });
      if (resp.data.code === 200) { notification.isRead = true; } else { ElMessage.error(resp.data.msg || '标记已读失败'); return; }
    } catch (error: any) { console.error('标记已读失败:', error); return; }
  }

  // 如果是加入申请或任务节点完成审批，不跳转，直接显示审批按钮
  if (isJoinApplication(notification) || isTaskNodeCompletionApproval(notification)) {
    return;
  }

  const relatedId = notification.relatedId || notification.relatedID || notification.related_id;
  const relatedType = notification.relatedType || notification.related_type;
  if (relatedId) {
    if (relatedType === 'task' || relatedType === 'Task') router.push(`/tasks/detail/${relatedId}`);
    else if (relatedType === 'tasknode' || relatedType === 'taskNode' || relatedType === 'TaskNode') router.push(`/task-nodes/detail/${relatedId}`);
    else if (relatedType === 'handover' || relatedType === 'Handover') router.push(`/handovers`);
  }
}

// 查看已读通知详情
function viewNotification(notification: any) {
  const relatedId = notification.relatedId || notification.relatedID || notification.related_id;
  const relatedType = notification.relatedType || notification.related_type;
  if (relatedId) {
    if (relatedType === 'task' || relatedType === 'Task') router.push(`/tasks/detail/${relatedId}`);
    else if (relatedType === 'tasknode' || relatedType === 'taskNode' || relatedType === 'TaskNode') router.push(`/task-nodes/detail/${relatedId}`);
    else if (relatedType === 'handover' || relatedType === 'Handover') router.push(`/handovers`);
  }
}

async function handleApprove(notification: any, approved: boolean) {
  // 如果是任务节点完成审批，直接处理，不需要部门选择
  if (isTaskNodeCompletionApproval(notification)) {
    // 尝试从通知的relatedId获取审批ID，如果没有则从meta中获取
    let approvalId = notification.relatedId || notification.relatedID || notification.related_id;

    // 如果relatedId是节点ID，需要查询审批记录
    if (!approvalId || approvalId.startsWith('node_')) {
      // 从通知内容或meta中提取审批ID
      // 通知的RelatedID应该是审批ID，但如果是节点ID，需要查询最新的待审批记录
      const nodeId = approvalId || notification.nodeId || notification.nodeID;
      if (nodeId) {
        try {
          // 调用API获取节点详情，从中获取审批列表
          const nodeResp = await request({
            url: '/tasknode/get',
            method: 'post',
            data: { taskNodeId: nodeId }
          });
          if (nodeResp.data.code === 200) {
            const data = nodeResp.data.data || {};
            const approvals = data.approvals || [];
            // 找到最新的待审批记录（approvalType === 0）
            const pendingApproval = approvals.find((a: any) => a.approvalType === 0);
            if (pendingApproval) {
              approvalId = pendingApproval.approvalId;
            }
          }
        } catch (error) {
          console.error('获取审批记录失败:', error);
        }
      }
    }

    if (!approvalId) {
      ElMessage.error('无法找到审批记录，请刷新页面重试');
      return;
    }

    // 显示确认对话框，允许输入审批意见
    try {
      const { value: comment } = await ElMessageBox.prompt(
          approved ? '确定要通过此任务节点的完成审批吗？' : '确定要拒绝此任务节点的完成审批吗？',
          approved ? '审批通过' : '审批拒绝',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputType: 'textarea',
            inputPlaceholder: '请输入审批意见（可选）',
            inputValidator: () => true,
          }
      ).catch(() => ({ value: '' }));

      const resp = await approveTaskNodeCompletion({
        approvalId: approvalId,
        approved: approved ? 1 : 2,
        comment: comment || ''
      });
      if (resp.data.code === 200) {
        ElMessage.success(approved ? '审批通过' : '审批拒绝');
        await loadData();
      } else {
        ElMessage.error(resp.data.msg || '审批失败');
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('审批失败:', error);
        ElMessage.error('审批失败');
      }
    }
    return;
  }

  // 加入申请的审批逻辑
  const applicationId = notification.relatedId || notification.relatedID || notification.related_id;
  if (!applicationId) {
    ElMessage.error('申请ID不存在');
    return;
  }
  // 打开审批对话框
  approveTarget.value = notification;
  approveForm.value.approved = approved;
  approveForm.value.note = '';
  approveForm.value.departmentId = '';
  approveForm.value.positionId = '';
  // 预加载部门列表
  let companyId = notification.companyId || notification.companyID || notification.CompanyId || '';

  // 如果通知中没有 companyId，尝试从待审批申请列表中查找
  if (!companyId) {
    try {
      const pendingResp = await getPendingJoinApplications({ page: 1, pageSize: 200 });
      if (pendingResp?.data?.code === 200) {
        const plist = pendingResp.data?.data?.list || [];
        const app = plist.find((p: any) =>
            (p.id || p.ID || p.applicationId || p.ApplicationId) === applicationId
        );
        if (app) {
          companyId = app.companyId || app.CompanyId || app.companyID || '';
        }
      }
    } catch (error) {
      console.error('获取申请信息失败:', error);
    }
  }

  // 如果还是没有 companyId，尝试从当前员工信息中获取
  if (!companyId) {
    try {
      const me = await getMyEmployee();
      if (me?.data?.code === 200) {
        companyId = me.data.data?.companyId || me.data.data?.CompanyId || '';
      }
    } catch (error) {
      console.error('获取员工信息失败:', error);
    }
  }

  if (companyId) {
    await loadDepartments(companyId);
  } else {
    ElMessage.warning('无法获取公司信息，请刷新页面重试');
  }
  approveDialogVisible.value = true;
}

async function loadDepartments(companyId: string) {
  try {
    const resp = await listDepartments({ page: 1, pageSize: 200, companyId });
    if (resp.data.code === 200) {
      departmentOptions.value = (resp.data.data?.list || []).map((d: any) => ({
        id: d.id || d.Id,
        name: d.departmentName || d.DepartmentName,
      }));
    }
  } catch (error) {
    console.error('加载部门失败:', error);
  }
}

async function loadPositions(departmentId: string) {
  try {
    const resp = await listPositions({ page: 1, pageSize: 200, departmentId });
    if (resp.data.code === 200) {
      positionOptions.value = (resp.data.data?.list || []).map((p: any) => ({
        id: p.id || p.Id,
        name: p.positionName || p.PositionName,
      }));
    } else {
      positionOptions.value = [];
    }
  } catch (error) {
    console.error('加载职位失败:', error);
    positionOptions.value = [];
  }
}

async function submitApprove() {
  if (!approveTarget.value) return;
  const applicationId = approveTarget.value.relatedId || approveTarget.value.relatedID || approveTarget.value.related_id;
  if (!applicationId) {
    ElMessage.error('申请ID不存在');
    return;
  }
  if (approveForm.value.approved && !approveForm.value.departmentId) {
    ElMessage.warning('请选择部门');
    return;
  }
  approveLoading.value = true;
  try {
    const resp = await approveJoinApplication({
      applicationId,
      approved: approveForm.value.approved,
      note: approveForm.value.note || '',
      departmentId: approveForm.value.departmentId || undefined,
      positionId: approveForm.value.positionId || undefined,
    });
    if (resp.data.code === 200) {
      ElMessage.success(approveForm.value.approved ? '已通过申请' : '已拒绝申请');
      approveDialogVisible.value = false;
      loadData();
    } else {
      ElMessage.error(resp.data.msg || '操作失败');
    }
  } catch (error: any) {
    console.error('审批失败:', error);
    ElMessage.error(error.response?.data?.msg || '操作失败');
  } finally {
    approveLoading.value = false;
  }
}

async function checkApprovePermission() {
  try {
    const resp = await getMyEmployee();
    if (resp.data.code === 200) {
      myEmployee.value = resp.data.data || {};
      // 检查是否有审批权限：创始人、人事部门或管理岗
      const isFounder = myEmployee.value.isFounder === 1 || myEmployee.value.roleTags?.includes('创始人');
      const isHR = myEmployee.value.departmentCode === 'HR' || myEmployee.value.departmentName?.includes('人事');
      const isManager = myEmployee.value.isManagement === 1 || myEmployee.value.positionName?.includes('经理');
      canApprove.value = isFounder || isHR || isManager;
    }
  } catch (error) {
    console.error('获取员工信息失败:', error);
  }
}

async function loadData() {
  loading.value = true;
  try {
    const [notifResp, pendingResp] = await Promise.all([
      listNotifications({ page: 1, pageSize: 100, isRead: -1 }),
      getPendingJoinApplications({ page: 1, pageSize: 50 }).catch(() => ({ data: { code: -1 } }))
    ]);

    if (notifResp.data.code !== 200) { rows.value = []; return; }
    const list = notifResp.data?.data?.list || [];
    const typeMap: Record<number, string> = { 1: '任务', 2: '提醒', 3: '系统' };
    const priorityMap: Record<number, string> = { 1: '紧急', 2: '高', 3: '普通' };
    const notifRows = list.map((n: any) => ({
      id: n.id || n.Id,
      title: n.title || n.Title || '无标题',
      content: n.content || n.Content || '',
      type: n.type ?? n.Type ?? 3,
      priority: n.priority ?? n.Priority ?? 3,
      isRead: (n.isRead ?? n.IsRead ?? 0) === 1,
      createTime: n.createTime || n.CreateTime || '-',
      typeText: typeMap[n.type ?? n.Type ?? 3] || '系统',
      priorityText: priorityMap[n.priority ?? n.Priority ?? 3] || '普通',
      relatedId: n.relatedId || n.relatedID || n.related_id || '',
      relatedType: n.relatedType || n.related_type || '',
      category: n.category || n.Category || '',
    }));

    // 将 /join/pending 的待审批数据合并为通知行，避免漏审批
    let pendingRows: any[] = [];
    if (pendingResp?.data?.code === 200) {
      const plist = pendingResp.data?.data?.list || [];
      pendingRows = plist.map((p: any) => ({
        id: p.id || p.ID || p.applicationId || p.ApplicationId || `ja_${p.userId || ''}`,
        title: '新员工加入申请',
        content: `${p.companyName || '公司'} 的加入申请待审批`,
        type: 3,
        priority: 2,
        isRead: false,
        createTime: p.createTime || p.CreateTime || '-',
        typeText: '系统',
        priorityText: '高',
        relatedId: p.id || p.applicationId || '',
        relatedType: 'join_application',
        category: 'join_application',
        companyId: p.companyId || p.CompanyId || p.companyID || '', // 添加 companyId 字段
      }));
    }

    // 合并并按时间排序，去重同 relatedId
    const merged = [...notifRows, ...pendingRows];
    const uniqMap: Record<string, any> = {};
    merged.forEach(n => {
      const key = n.relatedId ? `rid:${n.relatedType}:${n.relatedId}` : `id:${n.id}`;
      if (!uniqMap[key]) {
        uniqMap[key] = n;
      }
    });
    rows.value = Object.values(uniqMap).sort((a: any, b: any) => {
      return (new Date(b.createTime || 0).getTime()) - (new Date(a.createTime || 0).getTime());
    });
  } catch (error: any) { console.error(error); rows.value = []; }
  finally { loading.value = false; }
}

onMounted(() => {
  checkApprovePermission();
  loadData();
});
</script>

<style scoped>
.notifications-page {
  padding: clamp(16px, 1.5vw, 24px);
  background: var(--bg-page);
  min-height: calc(100vh - clamp(56px, 8vh, 64px));
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5vw;
}
.page-title {
  font-size: clamp(20px, 1.5vw, 24px);
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 clamp(4px, 0.3vw, 8px);
}
.page-desc {
  font-size: clamp(13px, 0.95vw, 15px);
  color: var(--text-secondary);
  margin: 0;
}
.header-right { display: flex; gap: clamp(10px, 0.8vw, 12px); align-items: center; }

.content-card {
  background: var(--bg-card);
  border-radius: clamp(12px, 0.9vw, 14px);
  border: 1px solid var(--border-color);
  padding: clamp(16px, 1.3vw, 24px);
  width: 100%;
  box-sizing: border-box;
}

.notification-tabs :deep(.el-tabs__header) { margin-bottom: clamp(16px, 1.3vw, 20px); border-bottom: 1px solid var(--border-color); }
.notification-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.notification-tabs :deep(.el-tabs__item) { font-size: clamp(13px, 0.95vw, 15px); font-weight: 500; color: var(--text-secondary); padding: 0 clamp(16px, 1.3vw, 20px); height: clamp(40px, 2.8vh, 44px); line-height: clamp(40px, 2.8vh, 44px); }
.notification-tabs :deep(.el-tabs__item.is-active) { color: var(--color-danger); font-weight: 600; }
.notification-tabs :deep(.el-tabs__active-bar) { background: var(--color-danger); height: clamp(2px, 0.15vw, 3px); }

.notifications-list { display: flex; flex-direction: column; gap: clamp(10px, 0.8vw, 12px); }

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: clamp(12px, 1vw, 16px);
  padding: clamp(12px, 1vw, 16px);
  background: var(--bg-card);
  border-radius: clamp(10px, 0.8vw, 12px);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.notification-item:hover { border-color: var(--color-danger); box-shadow: var(--shadow-md); }
.notification-item.unread { background: var(--bg-hover); border-color: var(--color-primary-light); }
.notification-item.read { opacity: 0.7; }
.notification-item.has-actions { cursor: default; }
.notification-item.has-actions .notif-content { cursor: pointer; }

.notif-actions {
  display: flex;
  gap: clamp(6px, 0.5vw, 8px);
  flex-shrink: 0;
  margin-left: auto;
}

.notif-icon {
  width: clamp(36px, 2.8vw, 40px);
  height: clamp(36px, 2.8vw, 40px);
  border-radius: clamp(8px, 0.7vw, 10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(16px, 1.2vw, 18px);
  flex-shrink: 0;
}

.notif-icon.type-task { background: var(--bg-hover); color: var(--color-danger); }
.notif-icon.type-warning { background: var(--bg-hover); color: var(--color-warning); }
.notif-icon.type-info { background: var(--bg-hover); color: var(--text-secondary); }

.notif-content { flex: 1; min-width: 0; }
.notif-header { display: flex; justify-content: space-between; align-items: flex-start; gap: clamp(10px, 0.8vw, 12px); margin-bottom: clamp(4px, 0.4vw, 6px); }
.notif-title { font-size: clamp(13px, 0.95vw, 15px); font-weight: 600; color: var(--text-main); }
.notif-tags { display: flex; gap: clamp(4px, 0.4vw, 6px); flex-shrink: 0; }
.notif-body { font-size: clamp(12px, 0.9vw, 14px); color: var(--text-secondary); line-height: 1.5; margin-bottom: clamp(6px, 0.5vw, 8px); }
.notif-time { font-size: clamp(11px, 0.8vw, 13px); color: var(--text-muted); }

.unread-dot {
  position: absolute;
  right: clamp(12px, 1vw, 16px);
  top: 50%;
  transform: translateY(-50%);
  width: clamp(6px, 0.5vw, 8px);
  height: clamp(6px, 0.5vw, 8px);
  background: var(--color-danger);
  border-radius: 50%;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .notifications-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .content-card {
    padding: 16px;
  }

  .notification-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 13px;
  }

  .notification-item {
    padding: 14px;
    gap: 12px;
  }

  .notif-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .notif-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .notif-tags {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }

  .notification-tabs :deep(.el-tabs__item) {
    padding: 0 8px;
    font-size: 12px;
  }

  .notif-title {
    font-size: 13px;
  }

  .notif-body {
    font-size: 12px;
  }

  .notif-time {
    font-size: 11px;
  }
}

/* 审批弹窗样式 */
.approve-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}
.approve-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
}
.approve-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
  z-index: 10;
}
.approve-dialog :deep(.el-dialog__headerbtn .el-icon) {
  color: white;
}
.approve-dialog :deep(.el-dialog__body) {
  padding: 0;
}
.approve-dialog :deep(.el-dialog__footer) {
  padding: 0;
}

.dialog-header {
  padding: 28px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.dialog-header.approve {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}
.dialog-header.reject {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
.header-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  backdrop-filter: blur(4px);
}
.header-text {
  flex: 1;
}
.header-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
}
.header-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.dialog-body {
  padding: 24px;
}

.applicant-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}
.applicant-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}
.applicant-info {
  flex: 1;
}
.applicant-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}
.applicant-time {
  font-size: 13px;
  color: var(--text-secondary);
}

.form-section {
  margin-bottom: 20px;
}
.form-section:last-child {
  margin-bottom: 0;
}
.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 10px;
}
.form-label .el-icon {
  color: #dc2626;
  font-size: 16px;
}
.form-label.required::after {
  content: '*';
  color: #dc2626;
  margin-left: 2px;
}
.label-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
}

.full-width {
  width: 100%;
}
.full-width :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px var(--border-color) inset;
}
.full-width :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #dc2626 inset;
}
.full-width :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #dc2626 inset, 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.option-item .el-icon {
  color: var(--text-secondary);
  font-size: 14px;
}

.note-input :deep(.el-textarea__inner) {
  border-radius: 10px;
  padding: 14px;
  font-size: 14px;
  line-height: 1.6;
}
.note-input :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #dc2626, 0 0 0 3px rgba(220, 38, 38, 0.1);
}
.reject-note :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #ef4444, 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  background: #f8fafc;
  border-top: 1px solid var(--border-color);
}
.cancel-btn {
  min-width: 88px;
  border-radius: 10px;
}
.submit-btn {
  min-width: 120px;
  border-radius: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.submit-btn .el-icon {
  font-size: 16px;
}
</style>
