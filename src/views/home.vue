<template>
    <div class="wrapper">
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
import { useSidebarStore } from '@/store/sidebar';
import { useTabsStore } from '@/store/tabs';
import vHeader from '@/components/header.vue';
import vSidebar from '@/components/sidebar.vue';
import vTabs from '@/components/tabs.vue';

const sidebar = useSidebarStore();
const tabs = useTabsStore();
</script>

<style scoped>
.wrapper {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
}

.content-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: #f0f2f5;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Header/Tabs are now stacked in the flex column */

.content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
}

/* Custom Scrollbar for Content */
.content::-webkit-scrollbar {
    width: 6px;
}

.content::-webkit-scrollbar-track {
    background: transparent;
}

.content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

.content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
