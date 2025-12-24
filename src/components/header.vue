<template>
  <div class="header-container">
    <div class="header-left">
      <div class="collapse-trigger" @click="collapseChage">
        <el-icon :size="20">
          <Fold v-if="!sidebar.collapse" />
          <Expand v-else />
        </el-icon>
      </div>
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">棣栭〉</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
      <!-- 鎼滅储 -->
      <div class="header-action search-action">
        <el-icon :size="18"><Search /></el-icon>
      </div>

      <!-- 鎴戠殑娓呭崟 -->
      <el-popover
          placement="bottom-end"
          :width="380"
          trigger="click"
          :visible="checklistPopoverVisible"
          @update:visible="checklistPopoverVisible = $event"
          :show-arrow="false"
          :offset="12"
          popper-class="vben-popover"
      >
        <template #reference>
          <div class="header-action checklist-action" :class="{ 'has-badge': uncompletedChecklistCount > 0, 'has-pending': uncompletedChecklistCount > 0 }">
            <el-badge :value="uncompletedChecklistCount" :hidden="uncompletedChecklistCount === 0" :max="99">
              <el-icon :size="18"><List /></el-icon>
            </el-badge>
          </div>
        </template>
        <div class="popover-container">
          <div class="popover-header">
            <div class="popover-title">
              <span class="title-text">鎴戠殑娓呭崟</span>
              <el-tag v-if="uncompletedChecklistCount > 0" type="warning" size="small" effect="dark" round>
                {{ uncompletedChecklistCount }}
              </el-tag>
            </div>
            <el-radio-group v-model="checklistFilter" size="small" @change="fetchMyChecklist">
              <el-radio-button :value="-1">鍏ㄩ儴</el-radio-button>
              <el-radio-button :value="0">寰呭畬鎴?/el-radio-button>
              <el-radio-button :value="1">宸插畬鎴?/el-radio-button>
            </el-radio-group>
          </div>
          <div class="popover-body" v-loading="checklistLoading">
            <template v-if="myChecklists.length === 0">
              <div class="empty-placeholder">
                <el-icon :size="48" color="#e2e8f0"><DocumentChecked /></el-icon>
                <p>鏆傛棤娓呭崟椤?/p>
              </div>
            </template>
            <template v-else>
              <div
                  v-for="item in myChecklists"
                  :key="item.id"
                  class="checklist-item"
                  :class="{ completed: item.isCompleted === 1 }"
              >
                <el-checkbox
                    :model-value="item.isCompleted === 1"
                    @change="toggleChecklistItem(item)"
                    size="small"
                />
                <div class="item-content">
                  <div class="item-text">{{ item.content }}</div>
                  <div class="item-meta" v-if="item.taskTitle || item.taskNodeName">
                    <div class="task-info" @click.stop="goToTaskNode(item)">
                      <el-icon class="meta-icon"><Document /></el-icon>
                      <span class="task-title">{{ item.taskTitle || '鏈煡浠诲姟' }}</span>
                    </div>
                    <div class="node-info" @click.stop="goToTaskNode(item)">
                      <el-icon class="meta-icon"><Connection /></el-icon>
                      <span class="node-name">{{ item.taskNodeName || '鏈煡鑺傜偣' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="popover-footer">
            <el-button link type="primary" @click="goToAllChecklists">鏌ョ湅鍏ㄩ儴</el-button>
          </div>
        </div>
      </el-popover>

      <!-- 閫氱煡 -->
      <el-popover
          placement="bottom-end"
          :width="380"
          trigger="click"
          :visible="notificationPopoverVisible"
          @update:visible="notificationPopoverVisible = $event"
          :show-arrow="false"
          :offset="12"
          popper-class="vben-popover"
      >
        <template #reference>
          <div class="header-action notification-action" :class="{ 'has-badge': unreadCount > 0, 'has-unread': unreadCount > 0 }">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
              <el-icon :size="18"><Bell /></el-icon>
            </el-badge>
          </div>
        </template>
        <div class="popover-container">
          <div class="popover-header">
            <div class="popover-title">
              <span class="title-text">閫氱煡涓績</span>
              <el-tag v-if="unreadCount > 0" type="danger" size="small" effect="dark" round>
                {{ unreadCount }}
              </el-tag>
            </div>
          </div>
          <div class="popover-body" v-loading="notificationLoading">
            <template v-if="notifications.length === 0">
              <div class="empty-placeholder">
                <el-icon :size="48" color="#e2e8f0"><Bell /></el-icon>
                <p>鏆傛棤閫氱煡</p>
              </div>
            </template>
            <template v-else>
              <div
                  v-for="item in notifications"
                  :key="item.id"
                  class="notification-item"
                  :class="{ unread: item.isRead === 0 }"
                  @click="handleNotificationClick(item)"
              >
                <div class="notif-icon" :class="getNotifClass(item.type)">
                  <el-icon><InfoFilled /></el-icon>
                </div>
                <div class="notif-content">
                  <div class="notif-title">{{ item.title }}</div>
                  <div class="notif-desc">{{ item.content }}</div>
                  <div class="notif-time">{{ formatTime(item.createTime) }}</div>
                </div>
                <div class="unread-indicator" v-if="item.isRead === 0"></div>
              </div>
            </template>
          </div>
          <div class="popover-footer">
            <el-button link type="primary" @click="goToNotifications">鏌ョ湅鍏ㄩ儴</el-button>
          </div>
        </div>
      </el-popover>

      <!-- 鐢熸垚閭€璇风爜 -->
      <el-tooltip content="鐢熸垚閭€璇风爜" placement="bottom" v-if="canGenerateInvite">
        <div class="header-action invite-action" @click="showInviteDialog = true">
          <el-icon :size="18"><Ticket /></el-icon>
        </div>
      </el-tooltip>

      <!-- 涓婚鍒囨崲 -->
      <el-tooltip :content="isDarkMode ? '鍒囨崲鍒版祬鑹叉ā寮? : '鍒囨崲鍒版繁鑹叉ā寮?" placement="bottom">
        <div class="header-action theme-toggle" @click="toggleTheme">
          <el-icon :size="18"><Sunny v-if="isDarkMode" /><Moon v-else /></el-icon>
        </div>
      </el-tooltip>

      <!-- 鍏ㄥ睆 -->
      <div class="header-action" @click="setFullScreen">
        <el-icon :size="18"><FullScreen /></el-icon>
      </div>

      <!-- 鐢ㄦ埛澶村儚 -->
      <el-dropdown trigger="click" class="user-dropdown">
        <div class="user-trigger">
          <el-avatar :size="32" class="user-avatar">{{ username?.charAt(0) }}</el-avatar>
          <span class="user-name">{{ username }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goToProfile">
              <el-icon><User /></el-icon>
              <span>涓汉涓績</span>
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleSignOut">
              <el-icon><SwitchButton /></el-icon>
              <span>閫€鍑虹櫥褰?/span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 鐢熸垚閭€璇风爜寮圭獥 -->
    <el-dialog v-model="showInviteDialog" title="鐢熸垚閭€璇风爜" width="420px">
      <el-form :model="inviteForm" label-width="100px">
        <el-form-item label="鏈夋晥鏈?>
          <el-select v-model="inviteForm.expireDays" style="width: 100%">
            <el-option label="1 澶? :value="1" />
            <el-option label="3 澶? :value="3" />
            <el-option label="7 澶? :value="7" />
            <el-option label="14 澶? :value="14" />
            <el-option label="30 澶? :value="30" />
          </el-select>
        </el-form-item>
        <el-form-item label="浣跨敤娆℃暟">
          <el-input-number v-model="inviteForm.maxUses" :min="0" :max="100" style="width: 100%">
          </el-input-number>
          <div class="form-tip">0 琛ㄧず涓嶉檺鍒朵娇鐢ㄦ鏁?/div>
        </el-form-item>
      </el-form>

      <!-- 鐢熸垚缁撴灉 -->
      <div v-if="generatedCode" class="invite-result">
        <div class="result-label">閭€璇风爜宸茬敓鎴?/div>
        <div class="result-code">{{ generatedCode }}</div>
        <el-button type="primary" size="small" @click="copyInviteCode">
          <el-icon><DocumentCopy /></el-icon>
          澶嶅埗閭€璇风爜
        </el-button>
      </div>

      <template #footer>
        <el-button @click="showInviteDialog = false">鍏抽棴</el-button>
        <el-button type="primary" @click="handleGenerateCode" :loading="generating">
          {{ generatedCode ? '閲嶆柊鐢熸垚' : '鐢熸垚' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSidebarStore } from '../store/sidebar';
import { useUserStore } from '../store/user';
import {
  Fold, Expand, Search, Bell, List, FullScreen,
  ArrowDown, User, SwitchButton, InfoFilled, DocumentChecked,
  Sunny, Moon, Ticket, DocumentCopy, Document, Connection
} from '@element-plus/icons-vue';
import { getMyEmployee, listNotifications, getMyChecklist, updateChecklist, markNotificationRead, generateInviteCode, getPendingJoinApplications } from '@/api';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const sidebar = useSidebarStore();
const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '鐢ㄦ埛');

// 涓婚鍒囨崲
const isDarkMode = ref(false);

function initTheme() {
  const saved = localStorage.getItem('app-theme');
  isDarkMode.value = saved === 'dark';
  applyTheme();
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('app-theme', isDarkMode.value ? 'dark' : 'light');
  applyTheme();
}

function applyTheme() {
  const root = document.documentElement;
  if (isDarkMode.value) {
    root.classList.add('dark-mode');
  } else {
    root.classList.remove('dark-mode');
  }
}

const currentRoute = computed(() => {
  return route.meta?.title as string || '';
});

// 閫氱煡鐩稿叧
const unreadCount = ref(0);
const notifications = ref<any[]>([]);
const notificationLoading = ref(false);
const notificationPopoverVisible = ref(false);

// 娓呭崟鐩稿叧
const uncompletedChecklistCount = ref(0);
const myChecklists = ref<any[]>([]);
const checklistLoading = ref(false);
const checklistPopoverVisible = ref(false);
const checklistFilter = ref(-1);

// 閭€璇风爜鐩稿叧
const canGenerateInvite = ref(false);
const showInviteDialog = ref(false);
const generating = ref(false);
const generatedCode = ref('');
const inviteForm = reactive({
  expireDays: 7,
  maxUses: 0
});

let pollingTimer: ReturnType<typeof setInterval> | null = null;

const collapseChage = () => {
  sidebar.handleCollapse();
};

const fetchNotifications = async () => {
  try {
    notificationLoading.value = true;
    const [notifResp, pendingResp] = await Promise.all([
      listNotifications({ page: 1, pageSize: 20, isRead: 0 }),
      getPendingJoinApplications({ page: 1, pageSize: 20 }).catch(() => ({ data: { code: -1 } })),
    ]);

    let notifRows: any[] = [];
    if (notifResp.data.code === 200) {
      const list = notifResp.data?.data?.list || [];
      notifRows = list.map((n: any) => ({
        ...n,
        category: n.category || n.Category || '',
        isRead: n.isRead ?? n.IsRead ?? 0,
      }));
    }

    let pendingRows: any[] = [];
    if (pendingResp?.data?.code === 200) {
      const plist = pendingResp.data?.data?.list || [];
      pendingRows = plist.map((p: any) => ({
        id: p.id || p.ID || p.applicationId || p.ApplicationId || `ja_${p.userId || ''}`,
        title: '鏂板憳宸ュ姞鍏ョ敵璇?,
        content: `${p.companyName || '鍏徃'} 鐨勫姞鍏ョ敵璇峰緟瀹℃壒`,
        type: 3,
        priority: 2,
        isRead: 0,
        createTime: p.createTime || p.CreateTime || '',
        relatedId: p.id || p.applicationId || '',
        relatedType: 'join_application',
        category: 'join_application',
      }));
    }

    const merged = [...notifRows, ...pendingRows];
    const uniqMap: Record<string, any> = {};
    merged.forEach(n => {
      const key = n.relatedId ? `rid:${n.relatedType}:${n.relatedId}` : `id:${n.id}`;
      if (!uniqMap[key]) uniqMap[key] = n;
    });
    const mergedList = Object.values(uniqMap).sort((a: any, b: any) => {
      return (new Date(b.createTime || 0).getTime()) - (new Date(a.createTime || 0).getTime());
    });

    notifications.value = mergedList;
    unreadCount.value = mergedList.filter((n: any) => (n.isRead ?? 0) === 0).length;
  } catch (error) {
    console.error('鑾峰彇閫氱煡澶辫触:', error);
  } finally {
    notificationLoading.value = false;
  }
};

const fetchMyChecklist = async () => {
  try {
    checklistLoading.value = true;
    const resp = await getMyChecklist({
      page: 1,
      pageSize: 10,
      isCompleted: checklistFilter.value
    });
    if (resp.data.code === 200) {
      const data = resp.data?.data || {};
      myChecklists.value = data.list || [];
      uncompletedChecklistCount.value = data.uncompletedCount || 0;
    }
  } catch (error) {
    console.error('鑾峰彇鎴戠殑娓呭崟澶辫触:', error);
  } finally {
    checklistLoading.value = false;
  }
};

const toggleChecklistItem = async (item: any) => {
  try {
    const newStatus = item.isCompleted === 1 ? 0 : 1;
    const resp = await updateChecklist({
      checklistId: item.id,
      isCompleted: newStatus
    });
    if (resp.data.code === 200) {
      item.isCompleted = newStatus;
      fetchMyChecklist();
      ElMessage.success(newStatus === 1 ? '宸插畬鎴? : '宸插彇娑堝畬鎴?);
    } else {
      ElMessage.error(resp.data.msg || '鎿嶄綔澶辫触');
    }
  } catch (error) {
    console.error('鏇存柊娓呭崟鐘舵€佸け璐?', error);
    ElMessage.error('鎿嶄綔澶辫触');
  }
};

const handleNotificationClick = async (item: any) => {
  if (item.isRead === 0 || item.isRead === '0') {
    try {
      const resp = await markNotificationRead({ notificationId: item.id || item.notificationId });
      if (resp.data.code === 200) {
        item.isRead = 1;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (error: any) {
      console.error('鏍囪宸茶澶辫触:', error);
    }
  }

  notificationPopoverVisible.value = false;

  const relatedId = item.relatedId || item.relatedID || item.related_id;
  const relatedType = item.relatedType || item.related_type;
  const category = item.category || item.Category || '';

  // 濡傛灉鏄姞鍏ョ敵璇凤紝璺宠浆鍒伴€氱煡涓績杩涜瀹℃壒
  if (relatedType === 'join_application' || category === 'join_application') {
    notificationPopoverVisible.value = false;
    router.push('/notifications');
    return;
  }

  if (relatedId) {
    if (relatedType === 'task' || relatedType === 'Task') {
      router.push(`/tasks/detail/${relatedId}`);
    } else if (relatedType === 'tasknode' || relatedType === 'taskNode' || relatedType === 'TaskNode') {
      router.push(`/task-nodes/detail/${relatedId}`);
    } else if (relatedType === 'handover' || relatedType === 'Handover') {
      router.push(`/handovers`);
    } else {
      router.push('/notifications');
    }
  } else {
    router.push('/notifications');
  }
};

const goToNotifications = () => {
  notificationPopoverVisible.value = false;
  router.push('/notifications');
};

const goToTaskNode = (item: any) => {
  checklistPopoverVisible.value = false;
  if (item.taskNodeId) {
    router.push(`/task-nodes/detail/${item.taskNodeId}?taskId=${item.taskId || ''}`);
  } else if (item.taskId) {
    router.push(`/tasks/detail/${item.taskId}`);
  }
};

const goToAllChecklists = () => {
  checklistPopoverVisible.value = false;
  router.push('/task/my');
};

const goToProfile = () => {
  router.push('/ucenter');
};

const getNotifClass = (type: number) => {
  if (type === 1) return 'type-task';
  if (type === 2) return 'type-warning';
  return 'type-info';
};

const formatTime = (time: string) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '鍒氬垰';
  if (minutes < 60) return `${minutes}鍒嗛挓鍓峘;
  if (hours < 24) return `${hours}灏忔椂鍓峘;
  if (days < 7) return `${days}澶╁墠`;
  return time.split('T')[0];
};

const startPolling = () => {
  pollingTimer = setInterval(() => {
    fetchNotifications();
    fetchMyChecklist();
  }, 30000);
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

const setFullScreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.body.requestFullscreen.call(document.body);
  }
};

function handleSignOut() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('vuems_name');
  userStore.clearUserInfo();
  ElMessage.success('閫€鍑烘垚鍔?);
  router.push('/login');
}

const handleGenerateCode = async () => {
  generating.value = true;
  try {
    const res = await generateInviteCode({
      expireDays: inviteForm.expireDays,
      maxUses: inviteForm.maxUses
    });
    if (res.data.code === 200) {
      generatedCode.value = res.data.data?.inviteCode || '';
      ElMessage.success('閭€璇风爜鐢熸垚鎴愬姛');
    } else {
      ElMessage.error(res.data.msg || '鐢熸垚澶辫触');
    }
  } catch (error: any) {
    console.error('鐢熸垚閭€璇风爜澶辫触:', error);
    ElMessage.error(error.response?.data?.msg || '鐢熸垚澶辫触');
  } finally {
    generating.value = false;
  }
};

const copyInviteCode = async () => {
  if (!generatedCode.value) {
    ElMessage.warning('娌℃湁鍙鍒剁殑閭€璇风爜');
    return;
  }

  try {
    // 浼樺厛浣跨敤 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(generatedCode.value);
      ElMessage.success('閭€璇风爜宸插鍒跺埌鍓创鏉?);
    } else {
      // 闄嶇骇鏂规锛氫娇鐢?execCommand
      const textArea = document.createElement('textarea');
      textArea.value = generatedCode.value;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        ElMessage.success('閭€璇风爜宸插鍒跺埌鍓创鏉?);
      } else {
        ElMessage.error('澶嶅埗澶辫触锛岃鎵嬪姩澶嶅埗');
      }
    }
  } catch (err) {
    console.error('澶嶅埗澶辫触:', err);
    // 鏈€鍚庣殑闄嶇骇鏂规
    const textArea = document.createElement('textarea');
    textArea.value = generatedCode.value;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      ElMessage.success('閭€璇风爜宸插鍒跺埌鍓创鏉?);
    } catch {
      ElMessage.error('澶嶅埗澶辫触锛岃鎵嬪姩澶嶅埗閭€璇风爜: ' + generatedCode.value);
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

const checkInvitePermission = async () => {
  try {
    const resp = await getMyEmployee();
    if (resp.data.code === 200) {
      const emp = resp.data.data || {};
      // 妫€鏌ユ槸鍚︽湁鐢熸垚閭€璇风爜鏉冮檺锛氬垱濮嬩汉銆佷汉浜嬮儴闂ㄦ垨绠＄悊宀?
      const isFounder = emp.isFounder === 1 || emp.roleTags?.includes('鍒涘浜?);
      const isHR = emp.departmentCode === 'HR' || emp.departmentName?.includes('浜轰簨');
      const isManager = emp.isManagement === 1 || emp.positionName?.includes('缁忕悊');
      canGenerateInvite.value = isFounder || isHR || isManager;
    }
  } catch (error) {
    console.error('妫€鏌ラ個璇风爜鏉冮檺澶辫触:', error);
  }
};

onMounted(async () => {
  // 鍒濆鍖栦富棰?
  initTheme();

  try {
    const empRes = await getMyEmployee();
    const emp = empRes?.data?.data || {};
    username.value = emp.realName || emp.name || username.value;
  } catch (error: any) {
    console.error('鑾峰彇鐢ㄦ埛淇℃伅澶辫触:', error);
  }

  checkInvitePermission();
  fetchNotifications();
  fetchMyChecklist();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: clamp(56px, 8vh, 64px);
  padding: 0 clamp(16px, 1.3vw, 24px);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.3s, border-color 0.3s;
}

.header-left {
  display: flex;
  align-items: center;
  gap: clamp(12px, 1vw, 16px);
}

.collapse-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(32px, 2.5vw, 40px);
  height: clamp(32px, 2.5vw, 40px);
  border-radius: clamp(6px, 0.6vw, 10px);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.collapse-trigger:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

.breadcrumb {
  font-size: clamp(13px, 0.95vw, 15px);
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  color: var(--text-secondary);
}

.breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--text-main);
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: clamp(3px, 0.3vw, 4px);
}

.header-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(32px, 2.5vw, 40px);
  height: clamp(32px, 2.5vw, 40px);
  border-radius: clamp(6px, 0.6vw, 10px);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.header-action:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

.header-action.has-badge {
  color: #dc2626;
}

.header-action.checklist-action {
  position: relative;
}

.header-action.checklist-action.has-pending {
  color: #f59e0b;
  animation: pulse-checklist 2s ease-in-out infinite;
}

.header-action.checklist-action.has-pending:hover {
  background: #fef3c7;
  color: #d97706;
}

.header-action.notification-action {
  position: relative;
}

.header-action.notification-action.has-unread {
  color: #dc2626;
  animation: pulse-notification 2s ease-in-out infinite;
}

.header-action.notification-action.has-unread:hover {
  background: #fee2e2;
  color: #b91c1c;
}

@keyframes pulse-checklist {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes pulse-notification {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.header-action.theme-toggle {
  color: #f59e0b;
}

.header-action.theme-toggle:hover {
  background: #fef3c7;
  color: #d97706;
}

.header-action.invite-action {
  color: #10b981;
}

.header-action.invite-action:hover {
  background: #d1fae5;
  color: #059669;
}

.header-action :deep(.el-badge__content) {
  height: clamp(14px, 1.1vw, 16px);
  line-height: clamp(14px, 1.1vw, 16px);
  padding: 0 clamp(4px, 0.35vw, 5px);
  font-size: clamp(9px, 0.7vw, 11px);
  border: none;
}

.search-action {
  width: auto;
  padding: 0 clamp(10px, 0.8vw, 12px);
  gap: clamp(4px, 0.4vw, 6px);
}

/* User Dropdown */
.user-dropdown {
  margin-left: clamp(6px, 0.5vw, 8px);
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: clamp(6px, 0.5vw, 8px);
  padding: clamp(3px, 0.3vw, 4px) clamp(6px, 0.5vw, 8px) clamp(3px, 0.3vw, 4px) clamp(3px, 0.3vw, 4px);
  border-radius: clamp(6px, 0.5vw, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-trigger:hover {
  background: var(--bg-hover);
}

.user-avatar {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: #fff;
  font-weight: 600;
  font-size: clamp(12px, 0.9vw, 14px);
  width: clamp(28px, 2.2vw, 36px) !important;
  height: clamp(28px, 2.2vw, 36px) !important;
}

.user-name {
  font-size: clamp(13px, 0.95vw, 15px);
  font-weight: 500;
  color: var(--text-main);
  max-width: clamp(80px, 7vw, 120px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  color: var(--text-muted);
  font-size: clamp(11px, 0.8vw, 13px);
}

/* Popover Styles */
.popover-container {
  margin: -12px;
  max-width: 380px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.popover-header {
  padding: clamp(12px, 1vw, 16px);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 0.8vw, 12px);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 51, 234, 0.03) 100%);
}

.popover-title {
  display: flex;
  align-items: center;
  gap: clamp(6px, 0.5vw, 8px);
}

.title-text {
  font-size: clamp(14px, 1vw, 16px);
  font-weight: 600;
  color: var(--text-main);
}

.popover-body {
  max-height: clamp(320px, 28vh, 400px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: clamp(4px, 0.3vw, 6px) 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.popover-body::-webkit-scrollbar {
  width: 6px;
}

.popover-body::-webkit-scrollbar-track {
  background: var(--bg-hover);
  border-radius: 3px;
}

.popover-body::-webkit-scrollbar-thumb {
  background: var(--text-muted);
  border-radius: 3px;
}

.popover-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.popover-footer {
  padding: clamp(10px, 0.8vw, 12px) clamp(12px, 1vw, 16px);
  border-top: 1px solid var(--border-color);
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.empty-placeholder {
  padding: clamp(32px, 2.5vw, 40px) clamp(16px, 1.3vw, 20px);
  text-align: center;
}

.empty-placeholder p {
  margin-top: clamp(10px, 0.8vw, 12px);
  color: var(--text-muted);
  font-size: clamp(13px, 0.95vw, 15px);
}

/* Checklist Item */
.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: clamp(10px, 0.8vw, 12px);
  padding: clamp(12px, 1vw, 14px) clamp(12px, 1vw, 16px);
  transition: all 0.2s;
  cursor: default;
  border-left: 3px solid transparent;
  border-radius: clamp(4px, 0.3vw, 6px);
  margin: clamp(2px, 0.2vw, 3px) 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.checklist-item:hover {
  background: var(--bg-hover);
  border-left-color: var(--color-primary);
  transform: translateX(2px);
}

.checklist-item.completed {
  opacity: 0.65;
  border-left-color: #10b981;
}

.checklist-item.completed:hover {
  border-left-color: #059669;
}

.item-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.item-text {
  font-size: clamp(13px, 0.95vw, 15px);
  color: var(--text-main);
  line-height: 1.6;
  font-weight: 500;
  margin-bottom: clamp(2px, 0.2vw, 3px);
  word-break: break-word;
  overflow-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.checklist-item.completed .item-text {
  text-decoration: line-through;
  color: var(--text-muted);
  font-weight: 400;
}

.item-link {
  font-size: clamp(11px, 0.8vw, 13px);
  color: var(--text-muted);
  margin-top: clamp(3px, 0.3vw, 4px);
  cursor: pointer;
  transition: color 0.2s;
}

.item-link:hover {
  color: var(--color-primary);
}

.item-meta {
  margin-top: clamp(6px, 0.5vw, 8px);
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 0.3vw, 5px);
  overflow: hidden;
}

.task-info,
.node-info {
  display: flex;
  align-items: center;
  gap: clamp(4px, 0.3vw, 6px);
  font-size: clamp(11px, 0.8vw, 12px);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  padding: clamp(2px, 0.2vw, 3px) 0;
  min-width: 0;
  overflow: hidden;
}

.task-info:hover,
.node-info:hover {
  color: var(--color-primary);
}

.task-info:hover .meta-icon,
.node-info:hover .meta-icon {
  color: var(--color-primary);
  transform: scale(1.1);
}

.meta-icon {
  font-size: clamp(12px, 0.9vw, 14px);
  color: var(--text-muted);
  transition: all 0.2s;
  flex-shrink: 0;
}

.task-title,
.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  word-break: break-all;
}

.task-title {
  font-weight: 500;
  color: var(--text-secondary);
}

.node-name {
  color: var(--text-muted);
}

/* Notification Item */
.notification-item {
  display: flex;
  gap: clamp(10px, 0.8vw, 12px);
  padding: clamp(12px, 1vw, 14px) clamp(12px, 1vw, 16px);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border-left: 3px solid transparent;
  border-radius: clamp(4px, 0.3vw, 6px);
  margin: clamp(2px, 0.2vw, 3px) 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.notification-item:hover {
  background: var(--bg-hover);
  border-left-color: var(--color-primary);
  transform: translateX(2px);
}

.notification-item.unread {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%);
  border-left-color: #3b82f6;
}

.notif-icon {
  width: clamp(36px, 2.8vw, 40px);
  height: clamp(36px, 2.8vw, 40px);
  border-radius: clamp(8px, 0.6vw, 10px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.notification-item:hover .notif-icon {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.notif-icon.type-task {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.notif-icon.type-warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.notif-icon.type-info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
}

.notif-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.notif-title {
  font-size: clamp(13px, 0.95vw, 15px);
  font-weight: 600;
  margin-bottom: clamp(3px, 0.3vw, 4px);
  color: var(--text-main);
  word-break: break-word;
  overflow-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.notif-desc {
  font-size: clamp(11px, 0.8vw, 13px);
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-time {
  font-size: clamp(10px, 0.75vw, 12px);
  color: var(--text-muted);
  margin-top: clamp(3px, 0.3vw, 4px);
}

.unread-indicator {
  position: absolute;
  right: clamp(12px, 1vw, 16px);
  top: 50%;
  transform: translateY(-50%);
  width: clamp(6px, 0.5vw, 8px);
  height: clamp(6px, 0.5vw, 8px);
  background: var(--color-danger);
  border-radius: 50%;
}

/* 鍝嶅簲寮忓竷灞€ */
@media (max-width: 768px) {
  .header-container {
    padding: 0 16px;
    height: 56px;
  }

  .header-left {
    gap: 12px;
  }

  .breadcrumb {
    display: none;
  }

  .header-right {
    gap: 2px;
  }

  .header-action {
    width: 32px;
    height: 32px;
  }

  .user-trigger {
    padding: 2px 4px;
  }

  .user-name {
    display: none;
  }

  .dropdown-icon {
    display: none;
  }

  .popover-container {
    margin: -8px;
  }

  .popover-header {
    padding: 12px;
  }

  .popover-body {
    max-height: 300px;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 12px;
  }

  .collapse-trigger {
    width: 32px;
    height: 32px;
  }

  .header-action {
    width: 28px;
    height: 28px;
  }

  .header-action :deep(.el-icon) {
    font-size: 16px;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
</style>

<style>
/* Global Popover Style */
.vben-popover {
  border-radius: 12px !important;
  box-shadow: var(--shadow-lg) !important;
  border: 1px solid var(--border-color) !important;
  padding: 0 !important;
  background: var(--bg-card) !important;
  max-width: 380px !important;
  width: 380px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

.vben-popover * {
  box-sizing: border-box;
}

.vben-popover .popover-header :deep(.el-radio-group) {
  width: 100% !important;
  display: flex !important;
  box-sizing: border-box !important;
}

.vben-popover .popover-header :deep(.el-radio-button) {
  flex: 1 !important;
  box-sizing: border-box !important;
  min-width: 0 !important;
}

.vben-popover .popover-header :deep(.el-radio-button__inner) {
  width: 100% !important;
  box-sizing: border-box !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  padding: 0 clamp(8px, 0.6vw, 12px) !important;
}

/* 绉婚櫎纭紪鐮佺殑 dark-mode 鏍峰紡锛屽畬鍏ㄤ緷璧?CSS 鍙橀噺 */

/* 閭€璇风爜寮圭獥鏍峰紡 */
.form-tip {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.invite-result {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #6ee7b7;
  border-radius: 12px;
  text-align: center;
}

.result-label {
  font-size: 12px;
  color: #047857;
  margin-bottom: 8px;
}

.result-code {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 4px;
  color: #065f46;
  margin-bottom: 12px;
}
</style>
