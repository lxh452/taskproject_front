<template>
    <div class="error-page">
        <div class="error-box">
            <div class="error-icon">
                <el-icon :size="80" color="var(--el-color-danger)"><WarningFilled /></el-icon>
            </div>
            <div class="error-code">500</div>
            <div class="error-desc">服务器开小差了，请稍后再试</div>
            <div class="error-detail" v-if="errorMessage">
                <el-collapse>
                    <el-collapse-item title="错误详情" name="1">
                        <pre class="error-stack">{{ errorMessage }}</pre>
                    </el-collapse-item>
                </el-collapse>
            </div>
            <div class="error-handle">
                <el-button type="primary" size="large" @click="retry">
                    <el-icon><Refresh /></el-icon>
                    重试
                </el-button>
                <router-link to="/">
                    <el-button size="large">返回首页</el-button>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" name="500">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { WarningFilled, Refresh } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

const errorMessage = ref(route.query.error as string || '');

const retry = () => {
    const from = route.query.from as string;
    if (from) {
        router.push(from);
    } else {
        router.go(-1);
    }
};
</script>

<style scoped>
.error-page {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    box-sizing: border-box;
}

.error-box {
    width: 450px;
    background-color: #fff;
    padding: 60px 50px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.error-icon {
    text-align: center;
    margin-bottom: 20px;
}

.error-code {
    line-height: 1;
    font-size: 80px;
    font-weight: bold;
    color: var(--el-color-danger);
    margin-bottom: 16px;
    text-align: center;
}

.error-desc {
    font-size: 18px;
    color: #666;
    text-align: center;
    margin-bottom: 20px;
}

.error-detail {
    margin-bottom: 30px;
}

.error-stack {
    font-size: 12px;
    color: #999;
    background: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    max-height: 150px;
    white-space: pre-wrap;
    word-break: break-all;
}

.error-handle {
    display: flex;
    justify-content: center;
    gap: 20px;
}
</style>
