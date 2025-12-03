<template>
    <div class="page-wrap">
        <el-card shadow="hover">
            <template #header>
                <div class="card-header">
                    <div class="card-header-title">统计报表（Mock）</div>
                    <div class="card-header-desc">示意位：后续接入任务完成率、部门分布等</div>
                </div>
            </template>
            <el-empty description="报表组件占位" />
        </el-card>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.page-wrap { padding: 8px; }
.card-header-title { font-weight: 600; }
.card-header-desc { color: #909399; font-size: 12px; }
</style>



