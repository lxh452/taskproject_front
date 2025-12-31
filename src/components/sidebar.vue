<template>
  <div class="sidebar-container" :class="{ 'is-collapse': sidebar.collapse }">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <div class="logo-wrapper">
        <div class="logo-icon">
          <img src="@/assets/img/logo.jpg" alt="Logo" class="logo-img" />
        </div>
        <transition name="fade">
          <span class="logo-text" v-if="!sidebar.collapse">Task Helper</span>
        </transition>
      </div>
      <!-- 移动端关闭按钮 -->
      <div class="mobile-close-btn" @click="closeSidebar">
        <el-icon><Close /></el-icon>
      </div>
    </div>

    <!-- 移动端提示 -->
    <div class="mobile-tip">
      <p>点击菜单项导航</p>
      <p>点击右上角 × 关闭菜单</p>
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
            text-color="#64748b"
            active-text-color="#3B82F6"
            router
            @select="handleMenuSelect"
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
        <transition name="fade">
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
import { SwitchButton, Close } from '@element-plus/icons-vue';
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

// 检测是否为移动端
const isMobile = () => window.innerWidth <= 768;

// 移动端点击菜单项后自动收起侧边栏
const handleMenuSelect = () => {
  if (isMobile() && !sidebar.collapse) {
    sidebar.setCollapse(true);
  }
};

// 移动端关闭侧边栏
const closeSidebar = () => {
  sidebar.setCollapse(true);
};

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
.sidebar-container {
  display: flex;
  flex-direction: column;
  width: clamp(200px, 14vw, 240px);
  height: 100%;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s;
  z-index: 100;
  flex-shrink: 0;
}

.sidebar-container.is-collapse {
  width: clamp(56px, 4vw, 64px);
}

/* Logo */
.sidebar-logo {
  height: clamp(56px, 8vh, 64px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(12px, 1vw, 16px);
  border-bottom: 1px solid var(--border-color);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: clamp(8px, 0.7vw, 10px);
  overflow: hidden;
}

/* 移动端关闭按钮 - 默认隐藏 */
.mobile-close-btn {
  display: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-hover);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.mobile-close-btn:hover {
  background: var(--color-danger-light, #fef2f2);
  color: var(--color-danger, #ef4444);
}

/* 移动端提示 - 默认隐藏 */
.mobile-tip {
  display: none;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%);
  border-bottom: 1px solid var(--border-color);
}

.mobile-tip p {
  margin: 0;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
}

.logo-icon {
  width: clamp(28px, 2.2vw, 36px);
  height: clamp(28px, 2.2vw, 36px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: clamp(6px, 0.6vw, 10px);
  flex-shrink: 0;
  overflow: hidden;
}

.logo-icon .logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.logo-icon svg {
  width: 60%;
  height: 60%;
}

.logo-text {
  font-size: clamp(16px, 1.2vw, 20px);
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.5px;
  white-space: nowrap;
}

/* Menu Wrapper */
.sidebar-menu-wrapper {
  flex: 1;
  overflow: hidden;
  padding: clamp(8px, 1vh, 12px) clamp(6px, 0.6vw, 10px);
}

.sidebar-menu {
  border-right: none !important;
  background: transparent !important;
}

/* Menu Items */
.menu-item,
.menu-submenu :deep(.el-sub-menu__title) {
  height: clamp(40px, 5vh, 48px) !important;
  line-height: clamp(40px, 5vh, 48px) !important;
  margin: clamp(2px, 0.4vh, 6px) 0;
  border-radius: clamp(6px, 0.6vw, 10px);
  transition: all 0.2s ease;
  color: var(--text-secondary) !important;
}

.menu-item:hover,
.menu-submenu :deep(.el-sub-menu__title:hover) {
  background: var(--bg-hover) !important;
  color: var(--text-main) !important;
}

.menu-item.is-active {
  background: var(--color-primary-light) !important;
  color: var(--color-primary) !important;
  font-weight: 600;
}

.menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: clamp(2px, 0.2vw, 3px);
  height: clamp(16px, 1.3vw, 20px);
  background: var(--color-primary);
  border-radius: 0 clamp(2px, 0.2vw, 3px) clamp(2px, 0.2vw, 3px) 0;
}

.menu-icon {
  font-size: clamp(16px, 1.2vw, 20px) !important;
  width: clamp(16px, 1.2vw, 20px);
  margin-right: clamp(8px, 0.7vw, 12px);
  color: var(--text-muted);
  transition: color 0.2s;
}

.menu-item.is-active .menu-icon,
.menu-item:hover .menu-icon {
  color: var(--color-primary);
}

.menu-title {
  font-size: clamp(13px, 0.95vw, 15px);
  font-weight: 500;
}

/* Sub Menu */
.menu-item-sub {
  height: clamp(36px, 2.5vh, 44px) !important;
  line-height: clamp(36px, 2.5vh, 44px) !important;
  margin: clamp(1px, 0.2vh, 4px) 0;
  padding-left: clamp(40px, 3vw, 52px) !important;
  border-radius: clamp(6px, 0.5vw, 10px);
  color: var(--text-secondary) !important;
}

.menu-item-sub:hover {
  background: var(--bg-hover) !important;
  color: var(--text-main) !important;
}

.menu-item-sub.is-active {
  background: var(--color-primary-light) !important;
  color: var(--color-primary) !important;
}

.sub-menu-dot {
  width: clamp(5px, 0.4vw, 6px);
  height: clamp(5px, 0.4vw, 6px);
  border-radius: 50%;
  background: var(--text-muted);
  margin-right: clamp(8px, 0.7vw, 10px);
  transition: all 0.2s;
}

.menu-item-sub.is-active .sub-menu-dot,
.menu-item-sub:hover .sub-menu-dot {
  background: var(--color-primary);
  transform: scale(1.2);
}

.sub-menu-title {
  font-size: clamp(12px, 0.85vw, 14px);
}

/* Footer */
.sidebar-footer {
  padding: clamp(8px, 1vh, 12px) clamp(8px, 0.8vw, 12px);
  border-top: 1px solid var(--border-color);
}

.user-panel {
  display: flex;
  align-items: center;
  gap: clamp(8px, 0.8vw, 12px);
  padding: clamp(8px, 1vh, 12px) clamp(8px, 0.8vw, 12px);
  border-radius: clamp(8px, 0.7vw, 12px);
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-hover);
}

.user-panel:hover {
  background: var(--color-primary-light);
}

.user-avatar {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: #fff;
  font-weight: 600;
  font-size: clamp(12px, 0.9vw, 14px);
  flex-shrink: 0;
  width: clamp(28px, 2.2vw, 36px) !important;
  height: clamp(28px, 2.2vw, 36px) !important;
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-name {
  font-size: clamp(12px, 0.85vw, 14px);
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-action {
  display: flex;
  align-items: center;
  gap: clamp(3px, 0.3vw, 6px);
  font-size: clamp(11px, 0.75vw, 13px);
  color: var(--text-muted);
  margin-top: clamp(1px, 0.2vh, 4px);
}

.user-action:hover {
  color: var(--color-danger);
}

/* Collapse State */
.sidebar-container.is-collapse .sidebar-logo {
  justify-content: center;
  padding: 0;
}

.sidebar-container.is-collapse .user-panel {
  justify-content: center;
  padding: clamp(8px, 0.7vw, 10px);
}

.sidebar-container.is-collapse .menu-item,
.sidebar-container.is-collapse .menu-submenu :deep(.el-sub-menu__title) {
  padding: 0 !important;
  justify-content: center;
}

.sidebar-container.is-collapse .menu-icon {
  margin-right: 0;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbar */
:deep(.el-scrollbar__bar.is-vertical) {
  width: clamp(3px, 0.3vw, 4px);
}

:deep(.el-scrollbar__thumb) {
  background: var(--border-color);
  border-radius: 4px;
}

:deep(.el-scrollbar__thumb:hover) {
  background: var(--text-muted);
}

/* 响应式布局 - 移动端抽屉式 */
@media (max-width: 768px) {
  .sidebar-container {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 280px !important;
    max-width: 85vw;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
  }

  /* 移动端：collapse=false 时显示侧边栏 */
  .sidebar-container:not(.is-collapse) {
    transform: translateX(0);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  }

  /* 移动端：collapse=true 时隐藏侧边栏 */
  .sidebar-container.is-collapse {
    transform: translateX(-100%);
    width: 280px !important;
  }

  /* 移动端显示关闭按钮 */
  .mobile-close-btn {
    display: flex;
  }

  /* 移动端显示提示 */
  .mobile-tip {
    display: block;
  }

  .sidebar-logo {
    height: 56px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    font-size: 18px;
  }

  .menu-item,
  .menu-submenu :deep(.el-sub-menu__title) {
    height: 48px !important;
    line-height: 48px !important;
  }

  .menu-icon {
    font-size: 18px !important;
    width: 18px;
  }

  .menu-title {
    font-size: 14px;
  }

  .user-panel {
    padding: 12px;
  }

  .user-avatar {
    width: 36px !important;
    height: 36px !important;
  }

  .user-name {
    font-size: 14px;
  }

  .user-action {
    font-size: 12px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar-container {
    width: 200px;
  }

  .sidebar-container.is-collapse {
    width: 60px;
  }

  .logo-text {
    font-size: 16px;
  }

  .menu-title {
    font-size: 13px;
  }
}
</style>

