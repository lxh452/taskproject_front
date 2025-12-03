<template>
    <div class="notifications-page">
        <el-card shadow="hover" class="main-card">
            <template #header>
                <div class="card-header">
                    <div class="card-header-left">
                        <div class="card-header-title">
                            <el-icon class="title-icon"><Bell /></el-icon>
                            <span>通知中心</span>
                        </div>
                    </div>
                    <div class="card-header-right">
                        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
                            <el-button :icon="Bell" circle />
                        </el-badge>
                        <el-button type="primary" :icon="Refresh" @click="loadData" circle />
                    </div>
                </div>
            </template>
            
            <div class="notifications-content">
                <el-tabs v-model="activeTab" class="notification-tabs">
                    <el-tab-pane :label="`全部 (${filteredNotifications.length})`" name="all">
                        <div class="notifications-list">
                            <div 
                                v-for="notification in filteredNotifications" 
                                :key="notification.id"
                                class="notification-item"
                                :class="{ 'unread': !notification.isRead, 'read': notification.isRead }"
                                @click="markAsRead(notification)"
                            >
                                <div class="notification-icon-wrapper">
                                    <el-icon class="notification-icon" :class="getNotificationIconClass(notification.type)">
                                        <component :is="getNotificationIcon(notification.type)" />
                                    </el-icon>
                                </div>
                                <div class="notification-content">
                                    <div class="notification-header">
                                        <div class="notification-title">{{ notification.title }}</div>
                                        <div class="notification-meta">
                                            <el-tag :type="getPriorityType(notification.priority)" size="small" class="priority-tag">
                                                {{ notification.priorityText }}
                                            </el-tag>
                                            <el-tag :type="getTypeType(notification.type)" size="small" class="type-tag">
                                                {{ notification.typeText }}
                                            </el-tag>
                                            <span class="notification-time">{{ formatTime(notification.createTime) }}</span>
                                        </div>
                                    </div>
                                    <div class="notification-body" v-if="notification.content">
                                        {{ notification.content }}
                                    </div>
                                </div>
                                <div class="notification-status">
                                    <el-badge v-if="!notification.isRead" :value="1" class="unread-badge" />
                                </div>
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
                                @click="markAsRead(notification)"
                            >
                                <div class="notification-icon-wrapper">
                                    <el-icon class="notification-icon" :class="getNotificationIconClass(notification.type)">
                                        <component :is="getNotificationIcon(notification.type)" />
                                    </el-icon>
                                </div>
                                <div class="notification-content">
                                    <div class="notification-header">
                                        <div class="notification-title">{{ notification.title }}</div>
                                        <div class="notification-meta">
                                            <el-tag :type="getPriorityType(notification.priority)" size="small" class="priority-tag">
                                                {{ notification.priorityText }}
                                            </el-tag>
                                            <el-tag :type="getTypeType(notification.type)" size="small" class="type-tag">
                                                {{ notification.typeText }}
                                            </el-tag>
                                            <span class="notification-time">{{ formatTime(notification.createTime) }}</span>
                                        </div>
                                    </div>
                                    <div class="notification-body" v-if="notification.content">
                                        {{ notification.content }}
                                    </div>
                                </div>
                                <div class="notification-status">
                                    <el-badge :value="1" class="unread-badge" />
                                </div>
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
                                @click="markAsRead(notification)"
                            >
                                <div class="notification-icon-wrapper">
                                    <el-icon class="notification-icon" :class="getNotificationIconClass(notification.type)">
                                        <component :is="getNotificationIcon(notification.type)" />
                                    </el-icon>
                                </div>
                                <div class="notification-content">
                                    <div class="notification-header">
                                        <div class="notification-title">{{ notification.title }}</div>
                                        <div class="notification-meta">
                                            <el-tag :type="getPriorityType(notification.priority)" size="small" class="priority-tag">
                                                {{ notification.priorityText }}
                                            </el-tag>
                                            <el-tag :type="getTypeType(notification.type)" size="small" class="type-tag">
                                                {{ notification.typeText }}
                                            </el-tag>
                                            <span class="notification-time">{{ formatTime(notification.createTime) }}</span>
                                        </div>
                                    </div>
                                    <div class="notification-body" v-if="notification.content">
                                        {{ notification.content }}
                                    </div>
                                </div>
                            </div>
                            <el-empty v-if="readNotifications.length === 0" description="暂无已读通知" />
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Refresh, Document, Warning, InfoFilled, CircleCheck } from '@element-plus/icons-vue';
import { listNotifications, markNotificationRead } from '@/api';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const rows = ref<any[]>([]);
const loading = ref(false);
const activeTab = ref('all');

const filteredNotifications = computed(() => {
    return rows.value;
});

const unreadNotifications = computed(() => {
    return rows.value.filter(n => !n.isRead);
});

const readNotifications = computed(() => {
    return rows.value.filter(n => n.isRead);
});

const unreadCount = computed(() => {
    return unreadNotifications.value.length;
});

function getNotificationIcon(type: number) {
    if (type === 1) return 'Document';
    if (type === 2) return 'Warning';
    return 'InfoFilled';
}

function getNotificationIconClass(type: number): string {
    if (type === 1) return 'icon-task';
    if (type === 2) return 'icon-reminder';
    return 'icon-system';
}

function getPriorityType(priority: number): string {
    if (priority === 1) return 'danger';
    if (priority === 2) return 'warning';
    return 'info';
}

function getTypeType(type: number): string {
    if (type === 1) return 'primary';
    if (type === 2) return 'warning';
    return 'info';
}

function formatTime(time: string): string {
    if (!time) return '-';
    // 服务器返回的是 UTC 时间，格式如 "2025-11-27 09:39:07"
    // 将其解析为 UTC 时间，然后转换为本地时间显示
    let date: Date;
    if (!time.includes('Z') && !time.includes('+')) {
        // 没有时区标记，视为 UTC 时间
        const utcString = time.replace(' ', 'T') + 'Z';
        date = new Date(utcString);
    } else {
        date = new Date(time);
    }
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    // 使用本地时间格式化显示
    return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// 点击通知处理
async function markAsRead(notification: any) {
    // 1. 如果是未读通知，先标记为已读
    if (!notification.isRead) {
        try {
            const resp = await markNotificationRead({ 
                notificationId: notification.id || notification.Id 
            });
            if (resp.data.code === 200) {
                notification.isRead = true;
                // 不显示成功消息，直接跳转
            } else {
                ElMessage.error(resp.data.msg || '标记已读失败');
                return; // 如果标记失败，不跳转
            }
        } catch (error: any) {
            console.error('标记已读失败:', error);
            ElMessage.error('标记已读失败: ' + (error.message || '未知错误'));
            return; // 如果标记失败，不跳转
        }
    }
    
    // 2. 根据通知类型跳转（处理字段名大小写问题）
    const relatedId = notification.relatedId || notification.relatedID || notification.related_id;
    const relatedType = notification.relatedType || notification.related_type;
    
    if (relatedId) {
        if (relatedType === 'task' || relatedType === 'Task') {
            router.push(`/tasks/detail/${relatedId}`);
        } else if (relatedType === 'tasknode' || relatedType === 'taskNode' || relatedType === 'TaskNode') {
            // 如果是任务节点，跳转到任务节点详情
            router.push(`/task-nodes/detail/${relatedId}`);
        } else if (relatedType === 'handover' || relatedType === 'Handover') {
            router.push(`/handovers`);
        } else {
            // 其他类型，不跳转
            console.log('未知的通知类型:', relatedType);
        }
    } else {
        // 没有关联ID，不跳转
        console.log('通知没有关联的业务ID');
    }
}

onMounted(async () => {
    loading.value = true;
    try {
        // 不传 employeeId，让后端通过 JWT 自动获取当前用户的员工工号
        const resp = await listNotifications({ page: 1, pageSize: 100 });
        if (resp.data.code !== 200) {
            console.error('API返回错误:', resp.data.msg);
            rows.value = [];
            return;
        }
        const responseData = resp.data?.data || resp.data || {};
        const list = responseData.list || [];
        rows.value = list.map((n: any) => {
            const typeMap: Record<number, string> = {
                1: '任务',
                2: '提醒',
                3: '系统'
            };
            const priorityMap: Record<number, string> = {
                1: '紧急',
                2: '高',
                3: '普通'
            };
            return {
                id: n.id || n.Id,
                title: n.title || n.Title || '无标题',
                content: n.content || n.Content || '',
                type: n.type ?? n.Type ?? 3,
                priority: n.priority ?? n.Priority ?? 3,
                isRead: (n.isRead ?? n.IsRead ?? 0) === 1,
                createTime: n.createTime || n.CreateTime || '-',
                typeText: typeMap[n.type ?? n.Type ?? 3] || '系统',
                priorityText: priorityMap[n.priority ?? n.Priority ?? 3] || '普通',
                // 保存关联信息用于跳转
                relatedId: n.relatedId || n.relatedID || n.related_id || '',
                relatedType: n.relatedType || n.related_type || '',
            };
        });
    } catch (error: any) {
        console.error('加载通知列表失败:', error);
        rows.value = [];
    } finally {
        loading.value = false;
    }
});

function loadData() {
    onMounted();
}
</script>

<style scoped>
.notifications-page {
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8ecf1 100%);
    min-height: calc(100vh - 100px);
}

.main-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
}

.main-card :deep(.el-card__header) {
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border-bottom: 2px solid #e5e7eb;
    padding: 20px 24px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header-left {
    display: flex;
    align-items: center;
    flex: 1;
}

.card-header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: -0.02em;
}

.title-icon {
    font-size: 24px;
    color: #2563eb;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);
    padding: 8px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-header-right {
    display: flex;
    gap: 12px;
    align-items: center;
}

.notification-badge {
    margin-right: 8px;
}

.notifications-content {
    padding: 24px;
}

.notification-tabs :deep(.el-tabs__header) {
    margin-bottom: 24px;
    border-bottom: 2px solid #e5e7eb;
}

.notification-tabs :deep(.el-tabs__nav-wrap::after) {
    display: none;
}

.notification-tabs :deep(.el-tabs__item) {
    font-size: 15px;
    font-weight: 600;
    color: #6b7280;
    padding: 0 24px;
    height: 48px;
    line-height: 48px;
    transition: all 0.3s ease;
}

.notification-tabs :deep(.el-tabs__item.is-active) {
    color: #667eea;
}

.notification-tabs :deep(.el-tabs__active-bar) {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    height: 3px;
}

.notifications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
}

.notification-item:hover {
    border-color: #667eea;
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.notification-item.unread {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-color: #667eea;
    border-left: 4px solid #667eea;
}

.notification-item.read {
    opacity: 0.8;
}

.notification-icon-wrapper {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border: 2px solid #e5e7eb;
}

.notification-icon {
    font-size: 24px;
}

.notification-icon.icon-task {
    color: #667eea;
}

.notification-icon.icon-reminder {
    color: #f59e0b;
}

.notification-icon.icon-system {
    color: #6b7280;
}

.notification-content {
    flex: 1;
    min-width: 0;
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 8px;
}

.notification-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    letter-spacing: -0.01em;
    flex: 1;
}

.notification-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.priority-tag,
.type-tag {
    font-weight: 500;
    border-radius: 6px;
}

.notification-time {
    font-size: 12px;
    color: #9ca3af;
    white-space: nowrap;
}

.notification-body {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.6;
    margin-top: 8px;
}

.notification-status {
    flex-shrink: 0;
}

.unread-badge :deep(.el-badge__content) {
    background: #ef4444;
    border: 2px solid #fff;
}
</style>
