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
                <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
            </el-breadcrumb>
        </div>

        <div class="header-right">
            <!-- 搜索 -->
            <div class="header-action search-action">
                <el-icon :size="18"><Search /></el-icon>
            </div>

            <!-- 我的清单 -->
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
                    <div class="header-action" :class="{ 'has-badge': uncompletedChecklistCount > 0 }">
                        <el-badge :value="uncompletedChecklistCount" :hidden="uncompletedChecklistCount === 0" :max="99">
                            <el-icon :size="18"><List /></el-icon>
                        </el-badge>
                    </div>
                </template>
                <div class="popover-container">
                    <div class="popover-header">
                        <div class="popover-title">
                            <span class="title-text">我的清单</span>
                            <el-tag v-if="uncompletedChecklistCount > 0" type="warning" size="small" effect="dark" round>
                                {{ uncompletedChecklistCount }}
                            </el-tag>
                        </div>
                        <el-radio-group v-model="checklistFilter" size="small" @change="fetchMyChecklist">
                            <el-radio-button :value="-1">全部</el-radio-button>
                            <el-radio-button :value="0">待完成</el-radio-button>
                            <el-radio-button :value="1">已完成</el-radio-button>
                        </el-radio-group>
                    </div>
                    <div class="popover-body" v-loading="checklistLoading">
                        <template v-if="myChecklists.length === 0">
                            <div class="empty-placeholder">
                                <el-icon :size="48" color="#e2e8f0"><DocumentChecked /></el-icon>
                                <p>暂无清单项</p>
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
                                    <div class="item-link" @click="goToTaskNode(item)">
                                        {{ item.taskTitle }} · {{ item.taskNodeName }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    <div class="popover-footer">
                        <el-button link type="primary" @click="goToAllChecklists">查看全部</el-button>
                    </div>
                </div>
            </el-popover>

            <!-- 通知 -->
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
                    <div class="header-action" :class="{ 'has-badge': unreadCount > 0 }">
                        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
                            <el-icon :size="18"><Bell /></el-icon>
                        </el-badge>
                    </div>
                </template>
                <div class="popover-container">
                    <div class="popover-header">
                        <div class="popover-title">
                            <span class="title-text">通知中心</span>
                            <el-tag v-if="unreadCount > 0" type="danger" size="small" effect="dark" round>
                                {{ unreadCount }}
                            </el-tag>
                        </div>
                    </div>
                    <div class="popover-body" v-loading="notificationLoading">
                        <template v-if="notifications.length === 0">
                            <div class="empty-placeholder">
                                <el-icon :size="48" color="#e2e8f0"><Bell /></el-icon>
                                <p>暂无通知</p>
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
                        <el-button link type="primary" @click="goToNotifications">查看全部</el-button>
                    </div>
                </div>
            </el-popover>

            <!-- 生成邀请码 -->
            <el-tooltip content="生成邀请码" placement="bottom" v-if="canGenerateInvite">
                <div class="header-action invite-action" @click="showInviteDialog = true">
                    <el-icon :size="18"><Ticket /></el-icon>
                </div>
            </el-tooltip>

            <!-- 主题切换 -->
            <el-tooltip :content="isDarkMode ? '切换到浅色模式' : '切换到深色模式'" placement="bottom">
                <div class="header-action theme-toggle" @click="toggleTheme">
                    <el-icon :size="18"><Sunny v-if="isDarkMode" /><Moon v-else /></el-icon>
                </div>
            </el-tooltip>

            <!-- 全屏 -->
            <div class="header-action" @click="setFullScreen">
                <el-icon :size="18"><FullScreen /></el-icon>
            </div>

            <!-- 用户头像 -->
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
                            <span>个人中心</span>
                        </el-dropdown-item>
                        <el-dropdown-item divided @click="handleSignOut">
                            <el-icon><SwitchButton /></el-icon>
                            <span>退出登录</span>
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <!-- 生成邀请码弹窗 -->
        <el-dialog v-model="showInviteDialog" title="生成邀请码" width="420px">
            <el-form :model="inviteForm" label-width="100px">
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
                    <el-input-number v-model="inviteForm.maxUses" :min="0" :max="100" style="width: 100%">
                    </el-input-number>
                    <div class="form-tip">0 表示不限制使用次数</div>
                </el-form-item>
            </el-form>
            
            <!-- 生成结果 -->
            <div v-if="generatedCode" class="invite-result">
                <div class="result-label">邀请码已生成</div>
                <div class="result-code">{{ generatedCode }}</div>
                <el-button type="primary" size="small" @click="copyInviteCode">
                    <el-icon><DocumentCopy /></el-icon>
                    复制邀请码
                </el-button>
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
import { 
    Fold, Expand, Search, Bell, List, FullScreen, 
    ArrowDown, User, SwitchButton, InfoFilled, DocumentChecked,
    Sunny, Moon, Ticket, DocumentCopy
} from '@element-plus/icons-vue';
import { getMyEmployee, listNotifications, getMyChecklist, updateChecklist, markNotificationRead, generateInviteCode, getPendingJoinApplications } from '@/api';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const sidebar = useSidebarStore();
const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');

// 主题切换
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
                title: '新员工加入申请',
                content: `${p.companyName || '公司'} 的加入申请待审批`,
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
        console.error('获取通知失败:', error);
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
        console.error('获取我的清单失败:', error);
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
            ElMessage.success(newStatus === 1 ? '已完成' : '已取消完成');
        } else {
            ElMessage.error(resp.data.msg || '操作失败');
        }
    } catch (error) {
        console.error('更新清单状态失败:', error);
        ElMessage.error('操作失败');
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
            console.error('标记已读失败:', error);
        }
    }
    
    notificationPopoverVisible.value = false;
    
    const relatedId = item.relatedId || item.relatedID || item.related_id;
    const relatedType = item.relatedType || item.related_type;
    const category = item.category || item.Category || '';
    
    // 如果是加入申请，跳转到通知中心进行审批
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
    if (item.taskId) {
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

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
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
    ElMessage.success('退出成功');
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
    if (!generatedCode.value) {
        ElMessage.warning('没有可复制的邀请码');
        return;
    }
    
    try {
        // 优先使用 Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(generatedCode.value);
            ElMessage.success('邀请码已复制到剪贴板');
        } else {
            // 降级方案：使用 execCommand
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
                ElMessage.success('邀请码已复制到剪贴板');
            } else {
                ElMessage.error('复制失败，请手动复制');
            }
        }
    } catch (err) {
        console.error('复制失败:', err);
        // 最后的降级方案
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
            ElMessage.success('邀请码已复制到剪贴板');
        } catch {
            ElMessage.error('复制失败，请手动复制邀请码: ' + generatedCode.value);
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
            // 检查是否有生成邀请码权限：创始人、人事部门或管理岗
            const isFounder = emp.isFounder === 1 || emp.roleTags?.includes('创始人');
            const isHR = emp.departmentCode === 'HR' || emp.departmentName?.includes('人事');
            const isManager = emp.isManagement === 1 || emp.positionName?.includes('经理');
            canGenerateInvite.value = isFounder || isHR || isManager;
        }
    } catch (error) {
        console.error('检查邀请码权限失败:', error);
    }
};

onMounted(async () => {
    // 初始化主题
    initTheme();
    
    try {
        const empRes = await getMyEmployee();
        const emp = empRes?.data?.data || {};
        username.value = emp.realName || emp.name || username.value;
    } catch (error: any) {
        console.error('获取用户信息失败:', error);
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
}

.popover-header {
    padding: clamp(12px, 1vw, 16px);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 0.8vw, 12px);
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
    max-height: clamp(300px, 25vh, 360px);
    overflow-y: auto;
}

.popover-footer {
    padding: clamp(10px, 0.8vw, 12px) clamp(12px, 1vw, 16px);
    border-top: 1px solid var(--border-color);
    text-align: center;
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
    padding: clamp(10px, 0.8vw, 12px) clamp(12px, 1vw, 16px);
    transition: background 0.2s;
    cursor: default;
}

.checklist-item:hover {
    background: var(--bg-hover);
}

.checklist-item.completed {
    opacity: 0.6;
}

.item-content {
    flex: 1;
    min-width: 0;
}

.item-text {
    font-size: clamp(12px, 0.9vw, 14px);
    color: var(--text-main);
    line-height: 1.5;
}

.checklist-item.completed .item-text {
    text-decoration: line-through;
    color: var(--text-muted);
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

/* Notification Item */
.notification-item {
    display: flex;
    gap: clamp(10px, 0.8vw, 12px);
    padding: clamp(10px, 0.8vw, 12px) clamp(12px, 1vw, 16px);
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
}

.notification-item:hover {
    background: var(--bg-hover);
}

.notification-item.unread {
    background: var(--color-primary-light);
}

.notif-icon {
    width: clamp(32px, 2.5vw, 36px);
    height: clamp(32px, 2.5vw, 36px);
    border-radius: clamp(6px, 0.5vw, 8px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.notif-icon.type-task {
    background: var(--bg-hover);
    color: var(--color-danger);
}

.notif-icon.type-warning {
    background: var(--bg-hover);
    color: var(--color-warning);
}

.notif-icon.type-info {
    background: var(--bg-hover);
    color: var(--text-secondary);
}

.notif-content {
    flex: 1;
    min-width: 0;
}

.notif-title {
    font-size: clamp(12px, 0.9vw, 14px);
    font-weight: 500;
    color: var(--text-main);
    margin-bottom: clamp(3px, 0.3vw, 4px);
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

/* 响应式布局 */
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
}

/* 移除硬编码的 dark-mode 样式，完全依赖 CSS 变量 */

/* 邀请码弹窗样式 */
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
