<template>
    <div class="sidebar" :class="{ 'is-collapse': sidebar.collapse }">
        <!-- Logo 区域 -->
        <div class="sidebar-logo">
            <div class="logo-icon">
                <el-icon><Briefcase /></el-icon>
            </div>
            <span class="logo-text" v-if="!sidebar.collapse">任务系统</span>
        </div>

        <!-- 导航菜单 -->
        <el-menu
            class="sidebar-el-menu"
            :default-active="onRoutes"
            :collapse="sidebar.collapse"
            background-color="#ffffff"
            text-color="#4b5563"
            active-text-color="#4f46e5"
            router
        >
            <template v-for="item in menuData" :key="item.index">
                <template v-if="item.children">
                    <el-sub-menu :index="item.index" v-permiss="item.id">
                        <template #title>
                            <el-icon class="menu-icon">
                                <component :is="item.icon"></component>
                            </el-icon>
                            <span class="menu-title">{{ item.title }}</span>
                        </template>
                        <template v-for="subItem in item.children" :key="subItem.index">
                            <el-menu-item :index="subItem.index" v-permiss="subItem.id">
                                <span class="sub-menu-title">{{ subItem.title }}</span>
                            </el-menu-item>
                        </template>
                    </el-sub-menu>
                </template>
                <template v-else>
                    <el-menu-item :index="item.index" v-permiss="item.id">
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

        <!-- 底部操作区 -->
        <div class="sidebar-footer">
            <el-menu
                class="footer-menu"
                background-color="transparent"
                text-color="#6b7280"
                router
            >
                <el-menu-item index="/theme">
                    <el-icon class="menu-icon"><Setting /></el-icon>
                    <template #title>
                        <span class="menu-title">Settings</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="signout" class="signout-item" @click="handleSignOut">
                    <el-icon class="menu-icon"><Right /></el-icon>
                    <template #title>
                        <span class="menu-title">Sign Out</span>
                    </template>
                </el-menu-item>
            </el-menu>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSidebarStore } from '../store/sidebar';
import { useRoute, useRouter } from 'vue-router';
import { menuData } from '@/components/menu';
import { Briefcase, Setting, Right } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const onRoutes = computed(() => {
    return route.path;
});

const sidebar = useSidebarStore();

function handleSignOut() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('vuems_name');
    userStore.clearUserInfo();
    ElMessage.success('退出成功');
    router.push('/login');
}
</script>

<style scoped>
.sidebar {
    display: flex;
    flex-direction: column;
    width: 240px;
    height: 100%;
    background: #ffffff;
    border-right: 1px solid var(--border-color);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
    flex-shrink: 0; /* Prevent shrinking */
}

.sidebar.is-collapse {
    width: 64px;
}

.sidebar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    border-bottom: 1px solid var(--border-color);
    height: 64px;
    box-sizing: border-box;
    background-color: #ffffff;
    /* Add a subtle brand touch */
    color: var(--color-primary);
}

.logo-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    border-radius: 8px;
    color: #ffffff;
    font-size: 18px;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
}

.logo-text {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
}

.sidebar-el-menu {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    border-right: none;
    padding: 12px;
}

/* Custom Scrollbar */
.sidebar-el-menu::-webkit-scrollbar {
    width: 4px;
}
.sidebar-el-menu::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 2px;
}

.menu-icon {
    font-size: 18px;
    color: #9ca3af;
    transition: all 0.2s ease;
}

.menu-title {
    font-weight: 500;
    font-size: 14px;
    margin-left: 8px;
}

/* Menu Items */
:deep(.el-menu-item), :deep(.el-sub-menu__title) {
    height: 44px;
    line-height: 44px;
    border-radius: 8px;
    margin-bottom: 4px;
    color: #4b5563 !important;
}

:deep(.el-menu-item:hover), :deep(.el-sub-menu__title:hover) {
    background-color: #f3f4f6 !important;
    color: #1f2937 !important;
}

:deep(.el-menu-item.is-active) {
    background-color: #eef2ff !important;
    color: #4f46e5 !important;
    font-weight: 600;
}

:deep(.el-menu-item.is-active .menu-icon) {
    color: #4f46e5;
}

/* Submenu */
:deep(.el-sub-menu .el-menu-item) {
    padding-left: 48px !important;
    height: 40px;
    line-height: 40px;
}

/* Footer */
.sidebar-footer {
    border-top: 1px solid var(--border-color);
    padding: 12px;
    background-color: #ffffff;
}

.footer-menu {
    border: none;
}

.signout-item :deep(.el-menu-item) {
    color: #ef4444 !important;
}

.signout-item :deep(.el-menu-item:hover) {
    background-color: #fef2f2 !important;
}

.signout-item :deep(.menu-icon) {
    color: #ef4444;
}

/* Collapse adjustments */
.sidebar.is-collapse .sidebar-logo {
    justify-content: center;
    padding: 0;
}
.sidebar.is-collapse .logo-text {
    display: none;
}
:deep(.el-menu--collapse .el-menu-item),
:deep(.el-menu--collapse .el-sub-menu__title) {
    padding: 0 !important;
    justify-content: center;
}
:deep(.el-menu--collapse .menu-icon) {
    margin: 0;
}
</style>
