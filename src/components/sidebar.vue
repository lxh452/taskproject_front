<template>
    <div class="sidebar-container" :class="{ 'is-collapse': sidebar.collapse }">
        <!-- Logo 区域 -->
        <div class="sidebar-logo">
            <div class="logo-wrapper">
                <div class="logo-icon">
                    <img src="@/assets/img/logo.jpg" alt="Logo" class="logo-img" />
                </div>
                <transition name="sidebar-fade">
                    <span class="logo-text" v-if="!sidebar.collapse">Task Pro</span>
                </transition>
            </div>
        </div>

        <!-- 导航菜单 -->
        <div class="sidebar-menu-wrapper">
            <el-scrollbar>
                <el-menu
                    class="sidebar-menu"
                    :default-active="onRoutes"
                    :collapse="sidebar.collapse"
                    :collapse-transition="false"
                    background-color="transparent"
                    text-color="var(--text-secondary)"
                    active-text-color="var(--color-primary)"
                    router
                >
                    <template v-for="item in menuData" :key="item.index">
                        <template v-if="item.children">
                            <el-sub-menu :index="item.index" v-permiss="item.id" class="menu-submenu">
                                <template #title>
                                    <el-icon class="menu-icon">
                                        <component :is="item.icon"></component>
                                    </el-icon>
                                    <span class="menu-title">{{ item.title }}</span>
                                </template>
                                <template v-for="subItem in item.children" :key="subItem.index">
                                    <el-menu-item :index="subItem.index" v-permiss="subItem.id" class="menu-item-sub">
                                        <span class="sub-menu-dot"></span>
                                        <span class="sub-menu-title">{{ subItem.title }}</span>
                                    </el-menu-item>
                                </template>
                            </el-sub-menu>
                        </template>
                        <template v-else>
                            <el-menu-item :index="item.index" v-permiss="item.id" class="menu-item">
                                <el-icon class="menu-icon">
                                    <component :is="item.icon"></component>
                                </el-icon>
                                <template #title>
                                    <span class="menu-title">{{ item.title }}</span>
                                </template>
                            </el-menu-item>
                        </template>
                    </template>
                </el-menu>
            </el-scrollbar>
        </div>

        <!-- 底部用户信息 -->
        <div class="sidebar-footer">
            <div class="user-panel" @click="handleSignOut">
                <el-avatar :size="sidebar.collapse ? 32 : 36" class="user-avatar">
                    {{ username?.charAt(0) }}
                </el-avatar>
                <transition name="sidebar-fade">
                    <div class="user-info" v-if="!sidebar.collapse">
                        <div class="user-name">{{ username }}</div>
                        <div class="user-action">
                            <el-icon><SwitchButton /></el-icon>
                            <span>退出登录</span>
                        </div>
                    </div>
                </transition>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useSidebarStore } from '../store/sidebar';
import { useRoute, useRouter } from 'vue-router';
import { menuData } from '@/components/menu';
import { SwitchButton } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';
import { getMyEmployee } from '@/api';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');

const onRoutes = computed(() => {
    return route.path;
});

const sidebar = useSidebarStore();

onMounted(async () => {
    try {
        const empRes = await getMyEmployee();
        const emp = empRes?.data?.data || {};
        username.value = emp.realName || emp.name || username.value;
    } catch (e) {
        console.error(e);
    }
});

function handleSignOut() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('vuems_name');
    userStore.clearUserInfo();
    ElMessage.success('退出成功');
    router.push('/login');
}
</script>

<style scoped>
/* ==================== Sidebar Container ==================== */
.sidebar-container {
    display: flex;
    flex-direction: column;
    width: var(--sidebar-width);
    height: 100%;
    background: var(--bg-card);
    border-right: 1px solid var(--border-color);
    transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1), 
                background-color var(--transition-slow);
    z-index: 100;
    flex-shrink: 0;
}

.sidebar-container.is-collapse {
    width: var(--sidebar-collapsed-width);
}

/* ==================== Logo Section ==================== */
.sidebar-logo {
    height: var(--header-height);
    display: flex;
    align-items: center;
    padding: 0 var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
    transition: padding 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    overflow: hidden;
}

.logo-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border-radius: var(--radius-md);
    flex-shrink: 0;
    overflow: hidden;
}

.logo-icon .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.logo-text {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    letter-spacing: -0.5px;
    white-space: nowrap;
}

/* ==================== Menu Wrapper ==================== */
.sidebar-menu-wrapper {
    flex: 1;
    overflow: hidden;
    padding: var(--spacing-md) var(--spacing-sm);
}

.sidebar-menu {
    border-right: none !important;
    background: transparent !important;
}

/* ==================== Menu Items - 44px height, 10px border-radius ==================== */
.menu-item,
.menu-submenu :deep(.el-sub-menu__title) {
    height: var(--menu-item-height) !important;
    line-height: var(--menu-item-height) !important;
    margin: var(--spacing-xs) 0;
    border-radius: 10px;
    transition: all var(--transition-base);
    color: var(--text-secondary) !important;
    position: relative;
}

/* Hover Effect */
.menu-item:hover,
.menu-submenu :deep(.el-sub-menu__title:hover) {
    background: var(--bg-hover) !important;
    color: var(--text-primary) !important;
}

.menu-item:hover .menu-icon,
.menu-submenu :deep(.el-sub-menu__title:hover) .menu-icon {
    color: var(--color-primary);
}

/* Active State with Left Border Indicator */
.menu-item.is-active {
    background: var(--color-primary-light) !important;
    color: var(--color-primary) !important;
    font-weight: var(--font-weight-semibold);
}

.menu-item.is-active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: var(--color-primary);
    border-radius: 0 3px 3px 0;
}

.menu-item.is-active .menu-icon {
    color: var(--color-primary);
}

/* Menu Icon - 20px size */
.menu-icon {
    font-size: 20px !important;
    width: 20px;
    margin-right: var(--spacing-md);
    color: var(--text-muted);
    transition: color var(--transition-base);
}

.menu-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ==================== Sub Menu Items ==================== */
.menu-item-sub {
    height: 40px !important;
    line-height: 40px !important;
    margin: 2px 0;
    padding-left: 48px !important;
    border-radius: 10px;
    color: var(--text-secondary) !important;
    transition: all var(--transition-base);
}

.menu-item-sub:hover {
    background: var(--bg-hover) !important;
    color: var(--text-primary) !important;
}

.menu-item-sub.is-active {
    background: var(--color-primary-light) !important;
    color: var(--color-primary) !important;
}

.sub-menu-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-muted);
    margin-right: var(--spacing-sm);
    transition: all var(--transition-base);
}

.menu-item-sub.is-active .sub-menu-dot,
.menu-item-sub:hover .sub-menu-dot {
    background: var(--color-primary);
    transform: scale(1.2);
}

.sub-menu-title {
    font-size: var(--font-size-sm);
}

/* ==================== Footer / User Panel ==================== */
.sidebar-footer {
    padding: var(--spacing-md);
    border-top: 1px solid var(--border-color);
}

.user-panel {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-base);
    background: var(--bg-hover);
}

.user-panel:hover {
    background: var(--color-primary-light);
}

.user-panel:hover .user-action {
    color: var(--color-danger);
}

.user-avatar {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    color: #fff;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    flex-shrink: 0;
}

.user-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.user-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-action {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-top: 2px;
    transition: color var(--transition-base);
}

/* ==================== Collapse State ==================== */
.sidebar-container.is-collapse .sidebar-logo {
    justify-content: center;
    padding: 0;
}

.sidebar-container.is-collapse .logo-wrapper {
    justify-content: center;
}

.sidebar-container.is-collapse .user-panel {
    justify-content: center;
    padding: var(--spacing-sm);
}

.sidebar-container.is-collapse .menu-item,
.sidebar-container.is-collapse .menu-submenu :deep(.el-sub-menu__title) {
    padding: 0 !important;
    justify-content: center;
}

.sidebar-container.is-collapse .menu-icon {
    margin-right: 0;
}

/* Hide text labels when collapsed */
.sidebar-container.is-collapse .menu-title,
.sidebar-container.is-collapse .logo-text,
.sidebar-container.is-collapse .user-info {
    display: none;
}

/* Center icon when collapsed */
.sidebar-container.is-collapse .menu-item .el-icon,
.sidebar-container.is-collapse .menu-submenu :deep(.el-sub-menu__title) .el-icon {
    margin: 0 auto;
}

/* ==================== Transitions ==================== */
.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
    transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
    opacity: 0;
}

/* ==================== Scrollbar ==================== */
:deep(.el-scrollbar__bar.is-vertical) {
    width: 4px;
}

:deep(.el-scrollbar__thumb) {
    background: var(--border-color);
    border-radius: 4px;
}

:deep(.el-scrollbar__thumb:hover) {
    background: var(--text-muted);
}

/* ==================== Responsive - Mobile Drawer Mode ==================== */
@media (max-width: 768px) {
    .sidebar-container {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        width: 280px;
        max-width: 80vw;
        z-index: 1001;
        transform: translateX(-100%);
        transition: transform var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shadow-lg);
    }
    
    .sidebar-container:not(.is-collapse) {
        transform: translateX(0);
    }
    
    .sidebar-container.is-collapse {
        transform: translateX(-100%);
        width: 280px;
    }
}
</style>
