<template>
    <div class="tabs-container" v-if="tabs.list.length > 0">
        <el-tabs 
            v-model="activePath" 
            class="tabs" 
            type="card" 
            closable 
            @tab-click="clickTabls" 
            @tab-remove="closeTabs"
        >
            <el-tab-pane
                v-for="item in tabs.list"
                :key="item.path"
                :label="item.title"
                :name="item.path"
            ></el-tab-pane>
        </el-tabs>
        <div class="Tabs-close-box">
            <el-dropdown @command="handleTags">
                <el-button size="small" type="primary" plain>
                    标签选项
                    <el-icon class="el-icon--right">
                        <ArrowDown />
                    </el-icon>
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu size="small">
                        <el-dropdown-item command="other">关闭其他</el-dropdown-item>
                        <el-dropdown-item command="current">关闭当前</el-dropdown-item>
                        <el-dropdown-item command="all">关闭所有</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useTabsStore } from '../store/tabs';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { ArrowDown } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const activePath = ref(route.fullPath);
const tabs = useTabsStore();

// 设置标签
const setTags = (routeItem: any) => {
    if (!routeItem || !routeItem.meta || !routeItem.meta.title) return;
    
    const isExist = tabs.list.some((item) => {
        return item.path === routeItem.fullPath;
    });
    
    if (!isExist) {
        tabs.setTabsItem({
            name: routeItem.name,
            title: routeItem.meta.title,
            path: routeItem.fullPath,
        });
    }
};

// 初始化
if (route.meta && route.meta.title) {
setTags(route);
}

onBeforeRouteUpdate((to) => {
    nextTick(() => {
    setTags(to);
        activePath.value = to.fullPath;
    });
});

// 关闭全部标签
const closeAll = () => {
    tabs.clearTabs();
    router.push('/dashboard');
};

// 关闭其他标签
const closeOther = () => {
    const curItem = tabs.list.filter((item) => {
        return item.path === route.fullPath;
    });
    tabs.closeTabsOther(curItem);
};

const handleTags = (command: string) => {
    switch (command) {
        case 'current':
            tabs.closeCurrentTag({
                $router: router,
                $route: route,
            });
            break;
        case 'all':
            closeAll();
            break;
        case 'other':
            closeOther();
            break;
    }
};

const clickTabls = (item: any) => {
    if (item && item.props && item.props.name) {
    router.push(item.props.name);
    }
};

const closeTabs = (path: string) => {
    const index = tabs.list.findIndex((item) => item.path === path);
    if (index === -1) return;
    
    tabs.delTabsItem(index);
    
    // 如果关闭后还有标签，跳转到下一个或上一个
    if (tabs.list.length > 0) {
        const nextItem = tabs.list[index] || tabs.list[index - 1];
        if (nextItem) {
            router.push(nextItem.path);
        }
    } else {
        // 如果没有标签了，跳转到首页
        router.push('/dashboard');
    }
};

watch(
    () => route.fullPath,
    (newVal) => {
        activePath.value = newVal;
    },
    { immediate: true }
);
</script>

<style scoped>
.tabs-container {
    position: relative;
    overflow: hidden;
    background: var(--bg-card);
    padding: 4px 120px 0 0;
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.tabs {
    .el-tabs__header {
        margin-bottom: 0;
    }

    .el-tabs__nav {
        height: 36px;
    }

    .el-tabs__nav-next,
    .el-tabs__nav-prev {
        line-height: 36px;
    }

    &.el-tabs {
        --el-tabs-header-height: 36px;
    }

    :deep(.el-tabs__item) {
        border-radius: 8px 8px 0 0;
        margin-right: 4px;
        transition: all 0.3s ease;
        border: 1px solid transparent;
        color: var(--text-secondary);
    }

    :deep(.el-tabs__item:hover) {
        background: var(--bg-hover);
        color: var(--text-main);
    }

    :deep(.el-tabs__item.is-active) {
        background: linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-card) 100%);
        border-color: var(--border-color);
        border-bottom-color: var(--bg-card);
        font-weight: 600;
        color: var(--el-color-primary);
    }
}

.Tabs-close-box {
    position: absolute;
    right: 0;
    top: 0;
    box-sizing: border-box;
    padding-top: 4px;
    text-align: center;
    width: 110px;
    height: 40px;
    background: linear-gradient(90deg, transparent 0%, var(--bg-card) 20%);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
}

.Tabs-close-box :deep(.el-button) {
    border-radius: 6px;
    font-size: 12px;
    padding: 6px 12px;
}
/* ... 响应式布局保持不变 ... */

/* 响应式布局 */
@media (max-width: 1200px) {
    .tabs-container {
        padding-right: 100px;
    }
    
    .Tabs-close-box {
        width: 90px;
    }
}

@media (max-width: 768px) {
    .tabs-container {
        padding: 4px 80px 0 0;
    }
    
    .tabs :deep(.el-tabs__nav) {
        height: 32px;
    }
    
    .tabs :deep(.el-tabs__item) {
        font-size: 12px;
        padding: 0 12px;
        height: 32px;
        line-height: 32px;
    }
    
    .tabs :deep(.el-tabs__nav-next),
    .tabs :deep(.el-tabs__nav-prev) {
        line-height: 32px;
    }
    
    .tabs.el-tabs {
        --el-tabs-header-height: 32px;
    }
    
    .Tabs-close-box {
        width: 70px;
        height: 36px;
    }
    
    .Tabs-close-box :deep(.el-button) {
        font-size: 11px;
        padding: 4px 8px;
    }
}

@media (max-width: 480px) {
    .tabs-container {
        padding: 4px 60px 0 0;
    }
    
    .tabs :deep(.el-tabs__item) {
        font-size: 11px;
        padding: 0 8px;
        min-width: 60px;
    }
    
    .tabs :deep(.el-tabs__item .el-icon-close) {
        margin-left: 4px;
        font-size: 12px;
    }
    
    .Tabs-close-box {
        width: 50px;
        padding-top: 2px;
    }
    
    .Tabs-close-box :deep(.el-button) {
        font-size: 10px;
        padding: 3px 6px;
    }
    
    .Tabs-close-box :deep(.el-button span) {
        display: none;
    }
    
    .Tabs-close-box :deep(.el-icon--right) {
        margin-left: 0;
    }
}

/* ==================== 深色模式 ==================== */
/* 移除具体的 .dark-mode 样式，完全依赖 CSS 变量 */
</style>
