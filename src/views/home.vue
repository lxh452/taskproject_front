<template>
    <div class="wrapper" :class="{ 'sidebar-open': !sidebar.collapse && isMobile }">
        <div 
            v-if="isMobile && !sidebar.collapse" 
            class="sidebar-overlay" 
            @click="sidebar.handleCollapse()"
        ></div>
        <v-sidebar />
        <div class="content-box" :class="{ 'content-collapse': sidebar.collapse }">
            <v-header />
            <v-tabs></v-tabs>
            <div class="content">
                <router-view v-slot="{ Component }">
                    <transition name="move" mode="out-in">
                        <keep-alive :include="tabs.nameList">
                            <component :is="Component"></component>
                        </keep-alive>
                    </transition>
                </router-view>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useSidebarStore } from '@/store/sidebar';
import { useTabsStore } from '@/store/tabs';
import vHeader from '@/components/header.vue';
import vSidebar from '@/components/sidebar.vue';
import vTabs from '@/components/tabs.vue';

const sidebar = useSidebarStore();
const tabs = useTabsStore();

const isMobile = ref(false);

const checkMobile = () => {
    const wasMobile = isMobile.value;
    isMobile.value = window.innerWidth <= 768;
    
    // 从桌面切换到移动端时，自动收起侧边栏
    if (!wasMobile && isMobile.value && !sidebar.collapse) {
        sidebar.setCollapse(true);
    }
    // 从移动端切换到桌面时，自动展开侧边栏
    if (wasMobile && !isMobile.value && sidebar.collapse) {
        sidebar.setCollapse(false);
    }
};

// 移动端侧边栏打开时禁止body滚动
watch(
    () => sidebar.collapse,
    (collapsed) => {
        if (isMobile.value) {
            if (!collapsed) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    }
);

onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
    // 清理body样式
    document.body.style.overflow = '';
});
</script>

<style scoped>
.wrapper {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    position: relative;
    background: var(--bg-page);
}

.content-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: var(--bg-page);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 0; /* 防止flex子元素溢出 */
}

.content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: clamp(16px, 1.5vw, 24px);
    box-sizing: border-box;
    width: 100%;
    background: var(--bg-page);
}

/* Custom Scrollbar for Content */
.content::-webkit-scrollbar {
    width: 0.4vw;
    min-width: 4px;
}

.content::-webkit-scrollbar-track {
    background: transparent;
}

.content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

.content::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* 移动端侧边栏遮罩 */
.sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    animation: fadeIn 0.3s ease;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* 响应式布局 - 移动端使用固定值 */
@media (max-width: 768px) {
    .wrapper {
        position: relative;
    }
    
    .content-box {
        width: 100%;
        margin-left: 0;
    }
    
    .content {
        padding: 4vw;
    }
}

/* ==================== 深色模式 ==================== */
/* 滚动条适配 */
:global(html.dark-mode) .content::-webkit-scrollbar-thumb {
    background: #334155;
}

:global(html.dark-mode) .content::-webkit-scrollbar-thumb:hover {
    background: #475569;
}

:global(html.dark-mode) .sidebar-overlay {
    background: rgba(0, 0, 0, 0.7);
}
</style>
