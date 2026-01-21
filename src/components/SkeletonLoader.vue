<template>
    <div class="skeleton-wrapper" :class="{ 'skeleton-animated': animated }">
        <!-- 卡片骨架屏 -->
        <template v-if="type === 'card'">
            <div class="skeleton-card" v-for="i in count" :key="i">
                <div class="skeleton-card-header">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-title-group">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-subtitle"></div>
                    </div>
                </div>
                <div class="skeleton-card-body">
                    <div class="skeleton-line" style="width: 100%"></div>
                    <div class="skeleton-line" style="width: 80%"></div>
                    <div class="skeleton-line" style="width: 60%"></div>
                </div>
                <div class="skeleton-card-footer">
                    <div class="skeleton-tag"></div>
                    <div class="skeleton-tag"></div>
                </div>
            </div>
        </template>

        <!-- 表格骨架屏 -->
        <template v-else-if="type === 'table'">
            <div class="skeleton-table">
                <div class="skeleton-table-header">
                    <div class="skeleton-cell" v-for="i in 5" :key="i"></div>
                </div>
                <div class="skeleton-table-row" v-for="i in rows" :key="i">
                    <div class="skeleton-cell" v-for="j in 5" :key="j"></div>
                </div>
            </div>
        </template>

        <!-- 列表骨架屏 -->
        <template v-else-if="type === 'list'">
            <div class="skeleton-list-item" v-for="i in count" :key="i">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line" style="width: 40%"></div>
                    <div class="skeleton-line" style="width: 70%"></div>
                </div>
            </div>
        </template>

        <!-- 统计卡片骨架屏 -->
        <template v-else-if="type === 'stats'">
            <div class="skeleton-stats-card" v-for="i in count" :key="i">
                <div class="skeleton-stats-icon"></div>
                <div class="skeleton-stats-content">
                    <div class="skeleton-stats-value"></div>
                    <div class="skeleton-stats-label"></div>
                </div>
            </div>
        </template>

        <!-- 默认文本骨架屏 -->
        <template v-else>
            <div class="skeleton-text" v-for="i in count" :key="i">
                <div class="skeleton-line" :style="{ width: getRandomWidth() }"></div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { defineProps, withDefaults } from 'vue';

interface Props {
    type?: 'card' | 'table' | 'list' | 'stats' | 'text';
    count?: number;
    rows?: number;
    animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    count: 3,
    rows: 5,
    animated: true,
});

const getRandomWidth = () => {
    const widths = ['100%', '90%', '80%', '70%', '60%'];
    return widths[Math.floor(Math.random() * widths.length)];
};
</script>

<style scoped>
.skeleton-wrapper {
    width: 100%;
}

/* 动画效果 */
.skeleton-animated .skeleton-line,
.skeleton-animated .skeleton-avatar,
.skeleton-animated .skeleton-title,
.skeleton-animated .skeleton-subtitle,
.skeleton-animated .skeleton-tag,
.skeleton-animated .skeleton-cell,
.skeleton-animated .skeleton-stats-icon,
.skeleton-animated .skeleton-stats-value,
.skeleton-animated .skeleton-stats-label {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* 基础元素 */
.skeleton-line {
    height: 14px;
    border-radius: 4px;
    background-color: #f0f0f0;
    margin-bottom: 10px;
}

.skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f0f0f0;
    flex-shrink: 0;
}

/* 卡片骨架屏 */
.skeleton-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.skeleton-card-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}

.skeleton-title-group {
    flex: 1;
    margin-left: 12px;
}

.skeleton-title {
    height: 18px;
    width: 60%;
    border-radius: 4px;
    background-color: #f0f0f0;
    margin-bottom: 8px;
}

.skeleton-subtitle {
    height: 14px;
    width: 40%;
    border-radius: 4px;
    background-color: #f0f0f0;
}

.skeleton-card-body {
    margin-bottom: 16px;
}

.skeleton-card-footer {
    display: flex;
    gap: 8px;
}

.skeleton-tag {
    width: 60px;
    height: 24px;
    border-radius: 4px;
    background-color: #f0f0f0;
}

/* 表格骨架屏 */
.skeleton-table {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
}

.skeleton-table-header {
    display: flex;
    background: #fafafa;
    padding: 16px;
    gap: 16px;
}

.skeleton-table-row {
    display: flex;
    padding: 16px;
    gap: 16px;
    border-bottom: 1px solid #f0f0f0;
}

.skeleton-cell {
    flex: 1;
    height: 20px;
    border-radius: 4px;
    background-color: #f0f0f0;
}

/* 列表骨架屏 */
.skeleton-list-item {
    display: flex;
    align-items: center;
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
}

.skeleton-content {
    flex: 1;
    margin-left: 12px;
}

/* 统计卡片骨架屏 */
.skeleton-stats-card {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.skeleton-stats-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background-color: #f0f0f0;
    margin-right: 16px;
}

.skeleton-stats-content {
    flex: 1;
}

.skeleton-stats-value {
    height: 28px;
    width: 80px;
    border-radius: 4px;
    background-color: #f0f0f0;
    margin-bottom: 8px;
}

.skeleton-stats-label {
    height: 14px;
    width: 60px;
    border-radius: 4px;
    background-color: #f0f0f0;
}

/* 文本骨架屏 */
.skeleton-text {
    margin-bottom: 12px;
}
</style>
