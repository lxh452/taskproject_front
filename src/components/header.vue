<template>
  <div class="header">
    <div class="header-left">
      <!-- 折叠按钮 - 简洁设计 -->
      <button class="collapse-btn" @click="collapseChage" aria-label="切换侧边栏">
        <svg v-if="!sidebar.collapse" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      
      <!-- 面包屑 - 增强版多级导航 -->
      <nav class="breadcrumb" aria-label="面包屑导航">
        <template v-for="(item, index) in breadcrumbs" :key="index">
          <router-link 
            v-if="index < breadcrumbs.length - 1" 
            :to="item.path" 
            class="breadcrumb-item"
          >
            <svg v-if="item.icon === 'home'" class="breadcrumb-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>{{ item.name }}</span>
          </router-link>
          <span v-else class="breadcrumb-item current">
            {{ item.name }}
          </span>
          <svg 
            v-if="index < breadcrumbs.length - 1" 
            class="breadcrumb-separator" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </template>
      </nav>
    </div>

    <div class="header-right">
      <!-- 我的清单 -->
      <el-popover
          placement="bottom-end"
          :width="360"
          trigger="click"
          :visible="checklistPopoverVisible"
          @update:visible="checklistPopoverVisible = $event"
          :show-arrow="false"
          :offset="8"
          popper-class="header-popover"
      >
        <template #reference>
          <button class="header-btn" :class="{ 'has-indicator': uncompletedChecklistCount > 0 }" aria-label="我的清单">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <span class="indicator warning" v-if="uncompletedChecklistCount > 0"></span>
          </button>
        </template>
        <div class="popover-content">
          <div class="popover-header">
            <span class="popover-title">我的清单</span>
            <el-radio-group v-model="checklistFilter" size="small" @change="fetchMyChecklist">
              <el-radio-button :value="-1">全部</el-radio-button>
              <el-radio-button :value="0">待完成</el-radio-button>
              <el-radio-button :value="1">已完成</el-radio-button>
            </el-radio-group>
          </div>
          <div class="popover-body" v-loading="checklistLoading">
            <div v-if="myChecklists.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <p>暂无清单项</p>
            </div>
            <div v-else class="checklist-list">
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
                <div class="checklist-content" @click="goToTaskNode(item)">
                  <div class="checklist-text">{{ item.content }}</div>
                  <div class="checklist-meta" v-if="item.taskTitle">
                    <span>{{ item.taskTitle }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="popover-footer">
            <button class="link-btn" @click="goToAllChecklists">查看全部</button>
          </div>
        </div>
      </el-popover>

      <!-- 通知 - 使用红点而非数字徽章 -->
      <el-popover
          placement="bottom-end"
          :width="360"
          trigger="click"
          :visible="notificationPopoverVisible"
          @update:visible="notificationPopoverVisible = $event"
          :show-arrow="false"
          :offset="8"
          popper-class="header-popover"
      >
        <template #reference>
          <button class="header-btn" :class="{ 'has-indicator': unreadCount > 0 }" aria-label="通知">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span class="indicator danger" v-if="unreadCount > 0"></span>
          </button>
        </template>
        <div class="popover-content">
          <div class="popover-header">
            <span class="popover-title">通知中心</span>
            <button class="link-btn small" @click="markAllRead" v-if="unreadCount > 0">全部已读</button>
          </div>
          <div class="popover-body" v-loading="notificationLoading">
            <div v-if="notifications.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <p>暂无通知</p>
            </div>
            <div v-else class="notification-list">
              <div
                  v-for="item in notifications"
                  :key="item.id"
                  class="notification-item"
                  :class="{ unread: item.isRead === 0 }"
                  @click="handleNotificationClick(item)"
              >
                <div class="notif-indicator" v-if="item.isRead === 0"></div>
                <div class="notif-content">
                  <div class="notif-title">{{ item.title }}</div>
                  <div class="notif-desc">{{ item.content }}</div>
                  <div class="notif-time">{{ formatTime(item.createTime) }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="popover-footer">
            <button class="link-btn" @click="goToNotifications">查看全部</button>
          </div>
        </div>
      </el-popover>

      <!-- 生成邀请码 -->
      <button class="header-btn" @click="showInviteDialog = true" v-if="canGenerateInvite" aria-label="生成邀请码">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z"/>
        </svg>
      </button>

      <!-- 主题切换 -->
      <button class="header-btn theme-btn" @click="toggleTheme" :aria-label="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
        <svg v-if="isDarkMode" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </button>

      <!-- 全屏 -->
      <button class="header-btn hide-mobile" @click="setFullScreen" aria-label="全屏">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
        </svg>
      </button>

      <!-- 用户头像下拉 -->
      <el-dropdown trigger="click" class="user-dropdown">
        <button class="user-btn">
          <el-avatar :size="32" class="user-avatar" :src="userAvatar">
            {{ !userAvatar ? username?.charAt(0) : '' }}
          </el-avatar>
          <span class="user-name hide-mobile">{{ username }}</span>
          <svg class="dropdown-arrow hide-mobile" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goToProfile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
              </svg>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleSignOut">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 生成邀请码弹窗 -->
    <el-dialog v-model="showInviteDialog" title="生成邀请码" width="400px" class="invite-dialog">
      <el-form :model="inviteForm" label-width="80px">
        <el-form-item label="有效期">
          <el-select v-model="inviteForm.expireDays" style="width: 100%">
            <el-option label="1 天" :value="1" />
            <el-option label="3 天" :value="3" />
            <el-option label="7 天" :value="7" />
            <el-option label="14 天" :value="14" />
            <el-option label="30 天" :value="30" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用次数">
          <el-input-number v-model="inviteForm.maxUses" :min="0" :max="100" style="width: 100%" />
          <div class="form-tip">0 表示不限制使用次数</div>
        </el-form-item>
      </el-form>
      <div v-if="generatedCode" class="invite-result">
        <div class="result-label">邀请码已生成</div>
        <div class="result-code">{{ generatedCode }}</div>
        <el-button type="primary" size="small" @click="copyInviteCode">复制邀请码</el-button>
      </div>
      <template #footer>
        <el-button @click="showInviteDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleGenerateCode" :loading="generating">
          {{ generatedCode ? '重新生成' : '生成' }}
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
import { useThemeStore } from '../store/theme';
import { getMyEmployee, listNotifications, getMyChecklist, updateChecklist, markNotificationRead, generateInviteCode, getPendingJoinApplications } from '@/api';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const sidebar = useSidebarStore();
const userStore = useUserStore();
const themeStore = useThemeStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');
const userAvatar = ref('');

// 主题切换
const isDarkMode = computed(() => themeStore.isDark);
const toggleTheme = () => themeStore.toggleDarkMode();

// 面包屑路径计算
const breadcrumbs = computed(() => {
  const paths: Array<{ name: string; path: string; icon?: string }> = [];
  
  // 始终添加首页
  paths.push({ name: '首页', path: '/', icon: 'home' });
  
  // 获取当前路由的标题
  const currentTitle = route.meta?.title as string;
  if (!currentTitle) return paths;
  
  // 根据路径构建面包屑
  const pathSegments = route.path.split('/').filter(Boolean);
  
  // 处理特殊的多级路径
  if (pathSegments.length > 1) {
    const firstSegment = pathSegments[0];
    
    // 任务相关
    if (firstSegment === 'tasks') {
      paths.push({ name: '任务管理', path: '/tasks' });
      if (pathSegments[1] === 'detail') {
        paths.push({ name: '任务详情', path: route.path });
      } else if (pathSegments[1] === 'create') {
        paths.push({ name: '创建任务', path: route.path });
      }
    }
    // 审批相关
    else if (firstSegment === 'handovers') {
      paths.push({ name: '审批管理', path: '/handovers' });
      if (pathSegments[1] === 'detail') {
        paths.push({ name: '审批详情', path: route.path });
      } else if (pathSegments[1] === 'create') {
        paths.push({ name: '发起审批', path: route.path });
      }
    }
    // 组织架构相关
    else if (firstSegment === 'organization') {
      paths.push({ name: '组织架构', path: '/organization/departments' });
      if (currentTitle !== '组织架构') {
        paths.push({ name: currentTitle, path: route.path });
      }
    }
    // 任务节点相关
    else if (firstSegment === 'task-nodes') {
      if (pathSegments[1] === 'detail') {
        paths.push({ name: '任务节点详情', path: route.path });
      } else if (pathSegments[1] === 'create') {
        paths.push({ name: '创建任务节点', path: route.path });
      }
    }
    // 文件预览
    else if (firstSegment === 'file' && pathSegments[1] === 'preview') {
      paths.push({ name: '文件预览', path: route.path });
    }
  } else {
    // 单级路径，直接添加当前页面
    if (currentTitle !== '首页') {
      paths.push({ name: currentTitle, path: route.path });
    }
  }
  
  return paths;
});

const currentRoute = computed(() => route.meta?.title as string || '');

// 通知相关
const unreadCount = ref(0);
const notifications = ref<any[]>([]);
const notificationLoading = ref(false);
const notificationPopoverVisible = ref(false);

// 清单相关
const uncompletedChecklistCount = ref(0);
const myChecklists = ref<any[]>([]);
const checklistLoading = ref(false);
const checklistPopoverVisible = ref(false);
const checklistFilter = ref(-1);

// 邀请码相关
const canGenerateInvite = ref(false);
const showInviteDialog = ref(false);
const generating = ref(false);
const generatedCode = ref('');
const inviteForm = reactive({ expireDays: 7, maxUses: 0 });

let pollingTimer: ReturnType<typeof setInterval> | null = null;

const collapseChage = () => sidebar.handleCollapse();

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
      notifRows = list.map((n: any) => ({ ...n, category: n.category || '', isRead: n.isRead ?? 0 }));
    }

    let pendingRows: any[] = [];
    if (pendingResp?.data?.code === 200) {
      const plist = pendingResp.data?.data?.list || [];
      pendingRows = plist.map((p: any) => ({
        id: p.id || `ja_${p.userId || ''}`,
        title: '新员工加入申请',
        content: `${p.companyName || '公司'} 的加入申请待审批`,
        type: 3, priority: 2, isRead: 0,
        createTime: p.createTime || '',
        relatedId: p.id || '', relatedType: 'join_application', category: 'join_application',
      }));
    }

    const merged = [...notifRows, ...pendingRows];
    const uniqMap: Record<string, any> = {};
    merged.forEach(n => {
      const key = n.relatedId ? `rid:${n.relatedType}:${n.relatedId}` : `id:${n.id}`;
      if (!uniqMap[key]) uniqMap[key] = n;
    });
    const mergedList = Object.values(uniqMap).sort((a: any, b: any) => 
      (new Date(b.createTime || 0).getTime()) - (new Date(a.createTime || 0).getTime())
    );

    notifications.value = mergedList;
    unreadCount.value = mergedList.filter((n: any) => (n.isRead ?? 0) === 0).length;
  } catch (error) {
    console.error('获取通知失败:', error);
  } finally {
    notificationLoading.value = false;
  }
};

const fetchMyChecklist = async () => {
  try {
    checklistLoading.value = true;
    const resp = await getMyChecklist({ page: 1, pageSize: 10, isCompleted: checklistFilter.value });
    if (resp.data.code === 200) {
      const data = resp.data?.data || {};
      myChecklists.value = data.list || [];
      uncompletedChecklistCount.value = data.uncompletedCount || 0;
    }
  } catch (error) {
    console.error('获取我的清单失败:', error);
  } finally {
    checklistLoading.value = false;
  }
};

const toggleChecklistItem = async (item: any) => {
  try {
    const newStatus = item.isCompleted === 1 ? 0 : 1;
    const resp = await updateChecklist({ checklistId: item.id, isCompleted: newStatus });
    if (resp.data.code === 200) {
      item.isCompleted = newStatus;
      fetchMyChecklist();
      ElMessage.success(newStatus === 1 ? '已完成' : '已取消完成');
    } else {
      ElMessage.error(resp.data.msg || '操作失败');
    }
  } catch (error) {
    console.error('更新清单状态失败:', error);
    ElMessage.error('操作失败');
  }
};

const markAllRead = async () => {
  // 标记所有通知为已读
  for (const item of notifications.value) {
    if (item.isRead === 0) {
      try {
        await markNotificationRead({ notificationId: item.id });
        item.isRead = 1;
      } catch (e) { /* ignore */ }
    }
  }
  unreadCount.value = 0;
  ElMessage.success('已全部标记为已读');
};

const handleNotificationClick = async (item: any) => {
  if (item.isRead === 0) {
    try {
      const resp = await markNotificationRead({ notificationId: item.id });
      if (resp.data.code === 200) {
        item.isRead = 1;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (error) { console.error('标记已读失败:', error); }
  }

  notificationPopoverVisible.value = false;
  const relatedId = item.relatedId || item.relatedID;
  const relatedType = item.relatedType || item.related_type;
  const category = item.category || '';

  if (relatedType === 'join_application' || category === 'join_application') {
    router.push('/notifications');
    return;
  }

  if (relatedId) {
    if (relatedType === 'task' || relatedType === 'Task') {
      router.push(`/tasks/detail/${relatedId}`);
    } else if (relatedType === 'tasknode' || relatedType === 'taskNode') {
      navigateToTaskNode(relatedId);
    } else if (relatedType === 'handover' || relatedType === 'Handover') {
      router.push(`/handovers`);
    } else {
      router.push('/notifications');
    }
  } else {
    router.push('/notifications');
  }
};

async function navigateToTaskNode(taskNodeId: string) {
  try {
    const resp = await request({ url: '/tasknode/get', method: 'post', data: { taskNodeId } });
    if (resp.data.code === 200 && resp.data.data) {
      const taskNode = resp.data.data.taskNode || resp.data.data;
      const taskId = taskNode.taskId || taskNode.TaskId;
      if (taskId) { router.push(`/tasks/detail/${taskId}`); return; }
    }
    ElMessage.warning('无法获取任务节点信息');
  } catch (error) {
    console.error('获取任务节点失败:', error);
    ElMessage.error('获取任务节点信息失败');
  }
}

const goToNotifications = () => { notificationPopoverVisible.value = false; router.push('/notifications'); };
const goToTaskNode = (item: any) => {
  checklistPopoverVisible.value = false;
  if (item.taskNodeId) navigateToTaskNode(item.taskNodeId);
  else if (item.taskId) router.push(`/tasks/detail/${item.taskId}`);
};
const goToAllChecklists = () => { 
  checklistPopoverVisible.value = false; 
  router.push('/my-checklists'); 
};
const goToProfile = () => router.push('/ucenter');

const formatTime = (time: string) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return time.split('T')[0];
};

const startPolling = () => { pollingTimer = setInterval(() => { fetchNotifications(); fetchMyChecklist(); }, 30000); };
const stopPolling = () => { if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null; } };

const setFullScreen = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.body.requestFullscreen.call(document.body);
};

function handleSignOut() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('vuems_name');
  userStore.clearUserInfo();
  ElMessage.success('退出成功');
  router.push('/login');
}

const handleGenerateCode = async () => {
  generating.value = true;
  try {
    const res = await generateInviteCode({ expireDays: inviteForm.expireDays, maxUses: inviteForm.maxUses });
    if (res.data.code === 200) {
      generatedCode.value = res.data.data?.inviteCode || '';
      ElMessage.success('邀请码生成成功');
    } else {
      ElMessage.error(res.data.msg || '生成失败');
    }
  } catch (error: any) {
    console.error('生成邀请码失败:', error);
    ElMessage.error(error.response?.data?.msg || '生成失败');
  } finally {
    generating.value = false;
  }
};

const copyInviteCode = async () => {
  if (!generatedCode.value) { ElMessage.warning('没有可复制的邀请码'); return; }
  try {
    await navigator.clipboard.writeText(generatedCode.value);
    ElMessage.success('邀请码已复制到剪贴板');
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = generatedCode.value;
    textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    ElMessage.success('邀请码已复制到剪贴板');
  }
};

const checkInvitePermission = async () => {
  try {
    const resp = await getMyEmployee();
    if (resp.data.code === 200) {
      const emp = resp.data.data || {};
      const isFounder = emp.isFounder === 1 || emp.roleTags?.includes('创始人');
      const isHR = emp.departmentCode === 'HR' || emp.departmentName?.includes('人事');
      const isManager = emp.isManagement === 1 || emp.positionName?.includes('经理');
      canGenerateInvite.value = isFounder || isHR || isManager;
    }
  } catch (error) { console.error('检查邀请码权限失败:', error); }
};

onMounted(async () => {
  try {
    const empRes = await getMyEmployee();
    const emp = empRes?.data?.data || {};
    username.value = emp.realName || emp.name || username.value;
    userAvatar.value = emp.avatar || '';
  } catch (error) { console.error('获取用户信息失败:', error); }

  checkInvitePermission();
  fetchNotifications();
  fetchMyChecklist();
  startPolling();
});

onUnmounted(() => stopPolling());
</script>


<style scoped>
/* ==================== Swiss Minimalism Header ==================== */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--header-height);
  padding: 0 var(--space-6);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--transition-base), border-color var(--transition-base);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* 折叠按钮 - 简洁 */
.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* 面包屑 - 增强版设计 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  border: 1px solid transparent;
}

.breadcrumb:hover {
  border-color: var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  text-decoration: none;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  font-weight: var(--font-weight-medium);
  position: relative;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 面包屑项悬停效果 */
.breadcrumb-item:not(.current) {
  cursor: pointer;
}

.breadcrumb-item:not(.current):hover {
  color: var(--color-primary);
  background: var(--bg-hover);
  transform: translateX(2px);
}

.breadcrumb-item:not(.current):active {
  transform: translateX(1px) scale(0.98);
}

/* 图标动画 */
.breadcrumb-item:not(.current):hover .breadcrumb-icon {
  transform: translateY(-1px) scale(1.05);
}

/* 当前页面样式 */
.breadcrumb-item.current {
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
  cursor: default;
  background: var(--bg-hover);
  position: relative;
}

/* 当前页面下划线效果 */
.breadcrumb-item.current::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: var(--space-2);
  right: var(--space-2);
  height: 2px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  opacity: 0.6;
}

/* 面包屑图标 */
.breadcrumb-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

/* 分隔符 */
.breadcrumb-separator {
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0.4;
  transition: opacity var(--transition-fast);
}

.breadcrumb:hover .breadcrumb-separator {
  opacity: 0.6;
}

/* 面包屑加载动画 */
@keyframes breadcrumbFadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.breadcrumb-item {
  animation: breadcrumbFadeIn 0.3s ease-out;
}

/* 为每个面包屑项添加延迟动画 */
.breadcrumb-item:nth-child(1) {
  animation-delay: 0s;
}

.breadcrumb-item:nth-child(3) {
  animation-delay: 0.05s;
}

.breadcrumb-item:nth-child(5) {
  animation-delay: 0.1s;
}

.breadcrumb-item:nth-child(7) {
  animation-delay: 0.15s;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* Header 按钮 - 统一简洁风格 */
.header-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* 红点指示器 - 替代数字徽章 */
.indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--bg-card);
}

.indicator.danger {
  background: var(--color-danger);
}

.indicator.warning {
  background: var(--color-warning);
}

/* 主题切换按钮 */
.theme-btn {
  color: var(--color-warning);
}

.theme-btn:hover {
  background: var(--color-warning-light);
}

/* 用户下拉 */
.user-dropdown {
  margin-left: var(--space-2);
}

.user-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.user-btn:hover {
  background: var(--bg-hover);
}

.user-avatar {
  background: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  color: var(--text-muted);
}

/* ==================== Popover 样式 - 简洁版 ==================== */
.popover-content {
  margin: -12px;
  background: var(--bg-card);
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
}

.popover-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.popover-body {
  max-height: 400px;
  overflow-y: auto;
  background: var(--bg-card);
}

.popover-body::-webkit-scrollbar {
  width: 6px;
}

.popover-body::-webkit-scrollbar-track {
  background: transparent;
}

.popover-body::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--radius-full);
}

.popover-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

.popover-footer {
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--border-color);
  text-align: center;
  background: var(--bg-card);
}

.link-btn {
  background: var(--color-primary) !important;
  border: none !important;
  color: #FFFFFF !important;
  font-size: var(--font-size-sm) !important;
  font-weight: var(--font-weight-bold) !important;
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: var(--space-3) var(--space-6) !important;
  border-radius: var(--radius-md);
  width: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
}

.link-btn:hover {
  background: var(--color-primary-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.4);
}

.link-btn.small {
  font-size: var(--font-size-xs) !important;
  padding: var(--space-2) var(--space-4) !important;
  width: auto;
  font-weight: var(--font-weight-semibold) !important;
}

/* 空状态 - 简洁版 */
.empty-state {
  padding: var(--space-10) var(--space-6);
  text-align: center;
  color: var(--text-muted);
}

.empty-state svg {
  color: var(--text-muted);
  margin-bottom: var(--space-3);
  opacity: 0.3;
}

.empty-state p {
  font-size: var(--font-size-sm);
  margin: 0;
  color: var(--text-secondary);
}

/* 清单列表 - 简洁版 */
.checklist-list {
  padding: var(--space-2) 0;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.checklist-item:hover {
  background: var(--bg-hover);
}

.checklist-item.completed {
  opacity: 0.5;
}

.checklist-content {
  flex: 1;
  min-width: 0;
}

.checklist-text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.6;
  font-weight: var(--font-weight-medium);
}

.checklist-item.completed .checklist-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.checklist-meta {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: var(--space-1);
}

/* 通知列表 - 简洁版 */
.notification-list {
  padding: var(--space-2) 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.notification-item:hover {
  background: var(--bg-hover);
}

.notification-item.unread {
  background: var(--bg-hover);
}

/* 蓝点指示未读 - 简洁版 */
.notif-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
  margin-top: 6px;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
  line-height: 1.4;
}

.notif-desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: var(--space-1);
}

.notif-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* 邀请码结果 */
.form-tip {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: var(--space-1);
}

.invite-result {
  margin-top: var(--space-5);
  padding: var(--space-5);
  background: var(--color-success-light);
  border-radius: var(--radius-lg);
  text-align: center;
}

.result-label {
  font-size: var(--font-size-xs);
  color: var(--color-success);
  margin-bottom: var(--space-2);
}

.result-code {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-mono);
  letter-spacing: 4px;
  color: var(--color-success-dark);
  margin-bottom: var(--space-3);
}

/* 隐藏移动端 */
.hide-mobile {
  display: flex;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .header {
    padding: 0 var(--space-3);
  }

  .breadcrumb {
    display: none;
  }

  .header-btn {
    width: 36px;
    height: 36px;
  }

  .collapse-btn {
    width: 36px;
    height: 36px;
  }

  .hide-mobile {
    display: none !important;
  }

  .user-btn {
    padding: var(--space-1);
  }

  .user-avatar {
    width: 28px !important;
    height: 28px !important;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 var(--space-2);
  }

  .header-btn {
    width: 32px;
    height: 32px;
  }

  .theme-btn {
    display: none;
  }
}

/* 平板设备 - 显示简化版面包屑 */
@media (min-width: 769px) and (max-width: 1024px) {
  .breadcrumb {
    padding: var(--space-1) var(--space-3);
    max-width: 400px;
  }
  
  .breadcrumb-item {
    max-width: 120px;
  }
  
  .breadcrumb-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 大屏幕优化 */
@media (min-width: 1440px) {
  .breadcrumb {
    padding: var(--space-2) var(--space-5);
  }
  
  .breadcrumb-item {
    max-width: 300px;
    padding: var(--space-2) var(--space-3);
  }
}

/* 深色模式面包屑优化 */
html.dark-mode .breadcrumb {
  background: var(--bg-tertiary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

html.dark-mode .breadcrumb:hover {
  border-color: var(--border-dark);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

html.dark-mode .breadcrumb-item:not(.current):hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

html.dark-mode .breadcrumb-item.current {
  background: var(--bg-hover);
}

html.dark-mode .breadcrumb-item.current::after {
  background: var(--color-primary);
  opacity: 0.8;
}

/* 打印样式 */
@media print {
  .breadcrumb {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }
  
  .breadcrumb-item:not(.current):hover {
    background: transparent;
    transform: none;
  }
  
  .breadcrumb-separator {
    opacity: 1;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .breadcrumb {
    border: 2px solid var(--border-dark);
  }
  
  .breadcrumb-item.current::after {
    height: 3px;
    opacity: 1;
  }
  
  .breadcrumb-separator {
    opacity: 1;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .breadcrumb-item {
    animation: none;
  }
  
  .breadcrumb-item:not(.current):hover {
    transform: none;
  }
  
  .breadcrumb-item:not(.current):hover .breadcrumb-icon {
    transform: none;
  }
}
</style>

<style>
/* Global Popover Style - 改进版 */
.header-popover {
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid var(--border-color) !important;
  padding: 0 !important;
  background: var(--bg-card) !important;
  overflow: hidden;
}

.header-popover .el-radio-group {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 2px;
}

.header-popover .el-radio-button__inner {
  border: none !important;
  background: transparent !important;
  color: var(--text-secondary) !important;
  font-size: var(--font-size-xs) !important;
  padding: 4px 12px !important;
  border-radius: var(--radius-sm) !important;
  transition: all var(--transition-fast) !important;
}

.header-popover .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: var(--bg-card) !important;
  color: var(--color-primary) !important;
  font-weight: var(--font-weight-semibold) !important;
  box-shadow: var(--shadow-sm) !important;
}
</style>
