<template>
    <div class="header">
        <div class="header-left">
            <div class="collapse-btn" @click="collapseChage">
                <el-icon v-if="!sidebar.collapse"><Fold /></el-icon>
                <el-icon v-else><Expand /></el-icon>
            </div>
        </div>
        <div class="header-right">
            <div class="header-actions">
                <!-- 我的清单 -->
                <el-popover
                    placement="bottom-end"
                    :width="380"
                    trigger="click"
                    :visible="checklistPopoverVisible"
                    @update:visible="checklistPopoverVisible = $event"
                    :show-arrow="false"
                    :offset="8"
                    popper-class="header-popover"
                >
                    <template #reference>
                        <div class="action-btn checklist-btn" title="我的清单">
                            <el-badge :value="uncompletedChecklistCount" :hidden="uncompletedChecklistCount === 0" :max="99">
                                <el-icon><List /></el-icon>
                            </el-badge>
                        </div>
                    </template>
                    <div class="popover-panel">
                        <div class="popover-header">
                            <div class="header-left-part">
                                <span class="popover-icon">📋</span>
                                <span class="popover-title">我的清单</span>
                            </div>
                            <el-tag size="small" type="warning" v-if="uncompletedChecklistCount > 0" class="count-tag">
                                {{ uncompletedChecklistCount }} 待完成
                            </el-tag>
                        </div>
                        <div class="popover-filter">
                            <el-radio-group v-model="checklistFilter" size="small" @change="fetchMyChecklist">
                                <el-radio-button :value="-1">全部</el-radio-button>
                                <el-radio-button :value="0">待完成</el-radio-button>
                                <el-radio-button :value="1">已完成</el-radio-button>
                            </el-radio-group>
                        </div>
                        <div class="popover-body" v-loading="checklistLoading">
                            <div v-if="myChecklists.length === 0" class="empty-state">
                                <div class="empty-icon">📝</div>
                                <div class="empty-text">暂无清单项</div>
                                <div class="empty-hint">完成任务节点的清单项会在这里显示</div>
                            </div>
                            <div v-else class="list-container">
                                <div 
                                    v-for="item in myChecklists" 
                                    :key="item.id" 
                                    class="list-item"
                                    :class="{ completed: item.isCompleted === 1 }"
                                >
                                    <el-checkbox 
                                        :model-value="item.isCompleted === 1"
                                        @change="toggleChecklistItem(item)"
                                        size="small"
                                        class="item-checkbox"
                                    />
                                    <div class="item-content">
                                        <div class="item-text" :class="{ 'text-completed': item.isCompleted === 1 }">
                                            {{ item.content }}
                                        </div>
                                        <div class="item-meta" @click="goToTaskNode(item)">
                                            <el-icon :size="12"><Link /></el-icon>
                                            <span>{{ item.taskTitle || '任务' }} · {{ item.taskNodeName || '节点' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="popover-footer">
                            <el-button link type="primary" size="small" @click="goToAllChecklists">
                                查看全部清单
                                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                            </el-button>
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
                    :offset="8"
                    popper-class="header-popover"
                >
                    <template #reference>
                        <div class="action-btn notification-btn" title="通知">
                            <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
                                <el-icon><Bell /></el-icon>
                            </el-badge>
                        </div>
                    </template>
                    <div class="popover-panel">
                        <div class="popover-header">
                            <div class="header-left-part">
                                <span class="popover-icon">🔔</span>
                                <span class="popover-title">通知中心</span>
                            </div>
                            <el-tag size="small" type="danger" v-if="unreadCount > 0" class="count-tag">
                                {{ unreadCount }} 未读
                            </el-tag>
                        </div>
                        <div class="popover-body" v-loading="notificationLoading">
                            <div v-if="notifications.length === 0" class="empty-state">
                                <div class="empty-icon">📭</div>
                                <div class="empty-text">暂无通知</div>
                                <div class="empty-hint">新的通知会在这里显示</div>
                            </div>
                            <div v-else class="list-container">
                                <div 
                                    v-for="item in notifications" 
                                    :key="item.id" 
                                    class="notification-item"
                                    :class="{ unread: item.isRead === 0 }"
                                    @click="handleNotificationClick(item)"
                                >
                                    <div class="notification-icon" :style="{ background: getNotificationBg(item.type) }">
                                        <el-icon :color="getNotificationColor(item.type)"><InfoFilled /></el-icon>
                                    </div>
                                    <div class="notification-content">
                                        <div class="notification-title">{{ item.title }}</div>
                                        <div class="notification-desc">{{ item.content }}</div>
                                        <div class="notification-time">{{ formatTime(item.createTime) }}</div>
                                    </div>
                                    <div class="unread-dot" v-if="item.isRead === 0"></div>
                                </div>
                            </div>
                        </div>
                        <div class="popover-footer">
                            <el-button link type="primary" size="small" @click="goToNotifications">
                                查看全部通知
                                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                            </el-button>
                        </div>
                    </div>
                </el-popover>

                <div class="action-btn" @click="handleRefresh" title="刷新">
                    <el-icon><Refresh /></el-icon>
                </div>
                <div class="action-btn" @click="setFullScreen" title="全屏">
                    <el-icon><FullScreen /></el-icon>
                </div>
                <div class="user-profile">
                    <el-avatar class="user-avatar" :size="32" :src="imgurl" />
                    <div class="user-info" v-if="showUserInfo">
                        <div class="user-name">{{ username }}</div>
                        <div class="user-role">{{ userRole }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSidebarStore } from '../store/sidebar';
import { useUserStore } from '../store/user';
import { Fold, Expand, Refresh, FullScreen, Bell, List, InfoFilled, Link, ArrowRight } from '@element-plus/icons-vue';
import imgurl from '../assets/img/img.jpg';
import { getMyEmployee, listNotifications, getMyChecklist, updateChecklist, markNotificationRead } from '@/api';
import { ElMessage } from 'element-plus';

const router = useRouter();
const sidebar = useSidebarStore();
const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');
const userRole = ref('Project Manager');
const showUserInfo = ref(false);

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
const checklistFilter = ref(0); // 默认显示未完成

// 轮询定时器
let pollingTimer: ReturnType<typeof setInterval> | null = null;

// 侧边栏折叠
const collapseChage = () => {
    sidebar.handleCollapse();
};

// 获取未读通知数量和列表
const fetchNotifications = async () => {
    try {
        notificationLoading.value = true;
        const resp = await listNotifications({ page: 1, pageSize: 10, isRead: 0 });
        if (resp.data.code === 200) {
            const list = resp.data?.data?.list || [];
            notifications.value = list;
            unreadCount.value = list.length;
        }
    } catch (error) {
        console.error('获取通知失败:', error);
    } finally {
        notificationLoading.value = false;
    }
};

// 获取我的清单
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

// 切换清单完成状态
const toggleChecklistItem = async (item: any) => {
    try {
        const newStatus = item.isCompleted === 1 ? 0 : 1;
        const resp = await updateChecklist({
            checklistId: item.id,
            isCompleted: newStatus
        });
        if (resp.data.code === 200) {
            item.isCompleted = newStatus;
            // 重新获取列表更新计数
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

// 点击通知
const handleNotificationClick = async (item: any) => {
    // 标记为已读
    if (item.isRead === 0 || item.isRead === '0') {
        try {
            const resp = await markNotificationRead({ notificationId: item.id || item.notificationId });
            if (resp.data.code === 200) {
                item.isRead = 1;
                unreadCount.value = Math.max(0, unreadCount.value - 1);
            } else {
                console.error('标记已读失败:', resp.data.msg);
            }
        } catch (error: any) {
            console.error('标记已读失败:', error);
            ElMessage.error('标记已读失败: ' + (error.message || '未知错误'));
        }
    }
    
    notificationPopoverVisible.value = false;
    
    // 根据通知类型跳转（处理字段名大小写问题）
    const relatedId = item.relatedId || item.relatedID || item.related_id;
    const relatedType = item.relatedType || item.related_type;
    
    if (relatedId) {
        if (relatedType === 'task' || relatedType === 'Task') {
            router.push(`/tasks/detail/${relatedId}`);
        } else if (relatedType === 'tasknode' || relatedType === 'taskNode' || relatedType === 'TaskNode') {
            // 如果是任务节点，需要先获取任务ID
            router.push(`/task-nodes/detail/${relatedId}`);
        } else if (relatedType === 'handover' || relatedType === 'Handover') {
            router.push(`/handovers`);
        } else {
            // 其他类型，跳转到通知列表
            router.push('/notifications');
        }
    } else {
        router.push('/notifications');
    }
};

// 跳转到通知页面
const goToNotifications = () => {
    notificationPopoverVisible.value = false;
    router.push('/notifications');
};

// 跳转到任务节点
const goToTaskNode = (item: any) => {
    checklistPopoverVisible.value = false;
    if (item.taskId) {
        router.push(`/tasks/detail/${item.taskId}`);
    }
};

// 查看全部清单（跳转到我的任务节点页面）
const goToAllChecklists = () => {
    checklistPopoverVisible.value = false;
    router.push('/task/my');
};

// 获取通知颜色
const getNotificationColor = (type: number) => {
    const colors: Record<number, string> = {
        1: '#409eff', // 普通通知
        2: '#67c23a', // 任务通知
        3: '#e6a23c', // 提醒
        4: '#f56c6c', // 紧急
    };
    return colors[type] || '#909399';
};

// 获取通知背景色
const getNotificationBg = (type: number) => {
    const colors: Record<number, string> = {
        1: '#ecf5ff',
        2: '#f0f9eb',
        3: '#fdf6ec',
        4: '#fef0f0',
    };
    return colors[type] || '#f4f4f5';
};

// 格式化时间
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

// 轮询刷新
const startPolling = () => {
    // 每30秒轮询一次
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

onMounted(async () => {
    try {
        const empRes = await getMyEmployee();
        const emp = empRes?.data?.data || {};
        username.value = emp.realName || emp.name || username.value;
        userRole.value = emp.positionName || emp.position || 'Project Manager';
        showUserInfo.value = true;
    } catch (error: any) {
        console.error('获取用户信息失败:', error);
    }
    
    // 获取通知和清单
    fetchNotifications();
    fetchMyChecklist();
    
    // 启动轮询
    startPolling();
});

onUnmounted(() => {
    stopPolling();
});

function handleRefresh() {
    window.location.reload();
}

const setFullScreen = () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.body.requestFullscreen.call(document.body);
    }
};
</script>
<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    height: 64px;
    background: #ffffff;
    border-bottom: 1px solid var(--border-color);
    padding: 0 24px;
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
}

.collapse-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 0 10px;
    cursor: pointer;
    opacity: 0.7;
    font-size: 22px;
    color: #1f2937;
    transition: opacity 0.2s;
    margin-left: -10px;
}

.collapse-btn:hover {
    opacity: 1;
    color: var(--color-primary);
}

.header-right {
    display: flex;
    align-items: center;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 18px;
}

.action-btn:hover {
    background: #f3f4f6;
    color: var(--color-primary);
}

.notification-btn :deep(.el-badge__content) {
    background: #ef4444;
    border: none;
    font-size: 10px;
    height: 16px;
    line-height: 16px;
    padding: 0 5px;
}

.checklist-btn :deep(.el-badge__content) {
    background: #f59e0b;
    border: none;
    font-size: 10px;
    height: 16px;
    line-height: 16px;
    padding: 0 5px;
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 16px;
    padding-left: 16px;
    border-left: 1px solid var(--border-color);
}

.user-avatar {
    border: 1px solid var(--border-color);
    flex-shrink: 0;
}

.user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.user-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.2;
}

.user-role {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.2;
}

/* Popover 面板样式 */
.popover-panel {
    margin: -12px;
    border-radius: 12px;
    overflow: hidden;
}

.popover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e5e7eb;
}

.header-left-part {
    display: flex;
    align-items: center;
    gap: 10px;
}

.popover-icon {
    font-size: 20px;
}

.popover-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
}

.count-tag {
    border-radius: 12px;
    font-weight: 500;
}

.popover-filter {
    padding: 12px 20px;
    background: #fafbfc;
    border-bottom: 1px solid #f0f0f0;
}

.popover-filter :deep(.el-radio-group) {
    width: 100%;
}

.popover-filter :deep(.el-radio-button) {
    flex: 1;
}

.popover-filter :deep(.el-radio-button__inner) {
    width: 100%;
    border-radius: 6px !important;
    border: none !important;
    background: transparent;
}

.popover-filter :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: #6366f1;
    color: white;
    box-shadow: none;
}

.popover-body {
    max-height: 340px;
    overflow-y: auto;
    background: #ffffff;
}

.popover-body::-webkit-scrollbar {
    width: 4px;
}

.popover-body::-webkit-scrollbar-track {
    background: transparent;
}

.popover-body::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 2px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
}

.empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
}

.empty-text {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 4px;
}

.empty-hint {
    font-size: 12px;
    color: #9ca3af;
}

.list-container {
    padding: 8px 0;
}

/* 清单项样式 */
.list-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 20px;
    cursor: default;
    transition: background 0.2s;
}

.list-item:hover {
    background: #f9fafb;
}

.list-item.completed {
    opacity: 0.6;
}

.item-checkbox {
    flex-shrink: 0;
    margin-top: 2px;
}

.item-content {
    flex: 1;
    min-width: 0;
}

.item-text {
    font-size: 13px;
    color: #374151;
    line-height: 1.5;
    word-break: break-word;
}

.item-text.text-completed {
    text-decoration: line-through;
    color: #9ca3af;
}

.item-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    font-size: 11px;
    color: #9ca3af;
    cursor: pointer;
    transition: color 0.2s;
}

.item-meta:hover {
    color: #6366f1;
}

/* 通知项样式 */
.notification-item {
    display: flex;
    gap: 12px;
    padding: 12px 20px;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
}

.notification-item:hover {
    background: #f9fafb;
}

.notification-item.unread {
    background: #fefce8;
}

.notification-item.unread:hover {
    background: #fef9c3;
}

.notification-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.notification-content {
    flex: 1;
    min-width: 0;
}

.notification-title {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.notification-desc {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
}

.notification-time {
    font-size: 11px;
    color: #9ca3af;
}

.unread-dot {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
}

.popover-footer {
    padding: 12px 20px;
    border-top: 1px solid #f0f0f0;
    text-align: center;
    background: #fafbfc;
}

.popover-footer .el-button {
    font-size: 13px;
}
</style>

<style>
/* 全局样式 - 弹窗样式 */
.header-popover {
    border-radius: 12px !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12) !important;
    border: 1px solid #e5e7eb !important;
    padding: 0 !important;
}

.header-popover .el-popover__title {
    display: none;
}
</style>
