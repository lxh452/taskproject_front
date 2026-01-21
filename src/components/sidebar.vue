<template>
  <div class="sidebar" :class="{ 'is-collapse': sidebar.collapse }">
    <!-- Logo 区域 - 简洁设计 -->
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
      <button class="mobile-close-btn" @click="closeSidebar" aria-label="关闭菜单">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- 导航菜单 -->
    <div class="sidebar-menu-wrapper">
      <el-scrollbar>
        <nav class="sidebar-nav">
          <template v-for="item in menuData" :key="item.index">
            <template v-if="item.children">
              <div class="nav-group" v-permiss="item.id">
                <div class="nav-group-title" @click="toggleGroup(item.index)">
                  <div class="nav-item-content">
                    <span class="nav-icon">
                      <component :is="item.icon"></component>
                    </span>
                    <span class="nav-text" v-if="!sidebar.collapse">{{ item.title }}</span>
                  </div>
                  <svg v-if="!sidebar.collapse" class="nav-arrow" :class="{ 'is-open': openGroups.includes(item.index) }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                <transition name="slide">
                  <div class="nav-group-items" v-show="openGroups.includes(item.index) && !sidebar.collapse">
                    <router-link
                      v-for="subItem in item.children"
                      :key="subItem.index"
                      :to="subItem.index"
                      class="nav-item nav-item-sub"
                      :class="{ 'is-active': isActive(subItem.index) }"
                      v-permiss="subItem.id"
                      @click="handleMenuSelect"
                    >
                      <span class="nav-dot"></span>
                      <span class="nav-text">{{ subItem.title }}</span>
                    </router-link>
                  </div>
                </transition>
              </div>
            </template>
            <template v-else>
              <router-link
                :to="item.index"
                class="nav-item"
                :class="{ 'is-active': isActive(item.index) }"
                v-permiss="item.id"
                @click="handleMenuSelect"
              >
                <span class="nav-icon">
                  <component :is="item.icon"></component>
                </span>
                <span class="nav-text" v-if="!sidebar.collapse">{{ item.title }}</span>
              </router-link>
            </template>
          </template>
        </nav>
      </el-scrollbar>
    </div>

    <!-- 底部用户面板 - 简化设计 -->
    <div class="sidebar-footer">
      <div class="user-panel" @click="handleSignOut">
        <el-avatar :size="sidebar.collapse ? 32 : 36" class="user-avatar">
          {{ username?.charAt(0) }}
        </el-avatar>
        <transition name="fade">
          <div class="user-info" v-if="!sidebar.collapse">
            <div class="user-name">{{ username }}</div>
            <div class="user-action">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
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
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';
import { getMyEmployee } from '@/api';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const username = ref(userStore.username || localStorage.getItem('vuems_name') || '用户');
const sidebar = useSidebarStore();
const openGroups = ref<string[]>([]);

// 检查路由是否激活
const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/');
};

// 切换子菜单组
const toggleGroup = (index: string) => {
  if (sidebar.collapse) return;
  const idx = openGroups.value.indexOf(index);
  if (idx > -1) {
    openGroups.value.splice(idx, 1);
  } else {
    openGroups.value.push(index);
  }
};

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

// 初始化展开当前路由所在的菜单组
onMounted(async () => {
  // 展开当前路由所在的菜单组
  menuData.forEach(item => {
    if (item.children) {
      const hasActiveChild = item.children.some(child => isActive(child.index));
      if (hasActiveChild && !openGroups.value.includes(item.index)) {
        openGroups.value.push(item.index);
      }
    }
  });

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
/* ==================== Swiss Minimalism Sidebar ==================== */
.sidebar {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  height: 100%;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  transition: width var(--transition-base);
  z-index: 100;
  flex-shrink: 0;
}

.sidebar.is-collapse {
  width: var(--sidebar-collapsed-width);
}

/* Logo 区域 - 简洁 */
.sidebar-logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  overflow: hidden;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  letter-spacing: -0.3px;
}

/* 移动端关闭按钮 */
.mobile-close-btn {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.mobile-close-btn:hover {
  background: var(--bg-hover);
  color: var(--color-danger);
}

/* 菜单容器 */
.sidebar-menu-wrapper {
  flex: 1;
  overflow: hidden;
  padding: var(--space-3) var(--space-2);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* 导航项 - 简洁风格 */
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* 激活状态 - 左侧 3px 指示线 */
.nav-item.is-active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.nav-item.is-active::before {
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

/* 图标 - 单色 */
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: inherit;
  flex-shrink: 0;
}

.nav-icon :deep(svg),
.nav-icon :deep(.el-icon) {
  width: 20px;
  height: 20px;
}

.nav-text {
  font-size: var(--font-size-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 菜单组 */
.nav-group {
  display: flex;
  flex-direction: column;
}

.nav-group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-group-title:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-arrow {
  transition: transform var(--transition-fast);
  color: var(--text-muted);
}

.nav-arrow.is-open {
  transform: rotate(180deg);
}

/* 子菜单项 */
.nav-group-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-left: var(--space-4);
  margin-top: var(--space-1);
}

.nav-item-sub {
  height: 40px;
  padding-left: var(--space-6);
}

.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.nav-item-sub.is-active .nav-dot,
.nav-item-sub:hover .nav-dot {
  background: var(--color-primary);
  transform: scale(1.2);
}

/* 底部用户面板 */
.sidebar-footer {
  padding: var(--space-3);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.user-panel {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--bg-secondary);
}

.user-panel:hover {
  background: var(--bg-hover);
}

.user-avatar {
  background: var(--color-primary);
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
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-action {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: 2px;
}

.user-action:hover {
  color: var(--color-danger);
}

/* 折叠状态 */
.sidebar.is-collapse .sidebar-logo {
  justify-content: center;
  padding: 0;
}

.sidebar.is-collapse .logo-wrapper {
  justify-content: center;
}

.sidebar.is-collapse .nav-item,
.sidebar.is-collapse .nav-group-title {
  justify-content: center;
  padding: 0;
}

.sidebar.is-collapse .nav-icon {
  margin: 0;
}

.sidebar.is-collapse .user-panel {
  justify-content: center;
  padding: var(--space-2);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all var(--transition-base);
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
}

/* 滚动条 */
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

/* ==================== 响应式 - 移动端抽屉式 ==================== */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 280px !important;
    max-width: 85vw;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform var(--transition-slow);
    box-shadow: none;
  }

  .sidebar:not(.is-collapse) {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  }

  .sidebar.is-collapse {
    transform: translateX(-100%);
    width: 280px !important;
  }

  .mobile-close-btn {
    display: flex;
  }

  .nav-item {
    height: 48px;
  }

  .nav-group-title {
    height: 48px;
  }

  .nav-item-sub {
    height: 44px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .sidebar.is-collapse {
    width: 60px;
  }
}
</style>
