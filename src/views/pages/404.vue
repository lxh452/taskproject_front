<template>
    <div class="error-page">
        <div class="error-container">
            <!-- 404 插图 -->
            <div class="error-illustration">
                <svg viewBox="0 0 200 200" class="illustration-svg">
                    <!-- 背景圆圈 -->
                    <circle cx="100" cy="100" r="90" fill="var(--color-primary)" opacity="0.1" />
                    <circle cx="100" cy="100" r="70" fill="var(--color-primary)" opacity="0.15" />
                    
                    <!-- 404 数字 -->
                    <text x="100" y="110" text-anchor="middle" class="error-number">404</text>
                    
                    <!-- 搜索图标 -->
                    <g transform="translate(140, 140)">
                        <circle cx="0" cy="0" r="15" fill="none" stroke="var(--color-primary)" stroke-width="3" />
                        <line x1="12" y1="12" x2="22" y2="22" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" />
                    </g>
                </svg>
            </div>

            <!-- 错误信息 -->
            <div class="error-content">
                <h1 class="error-title">页面未找到</h1>
                <p class="error-description">
                    抱歉，您访问的页面不存在或已被移除
                </p>
                <p class="error-hint">
                    请检查URL是否正确，或返回首页继续浏览
                </p>
            </div>

            <!-- 操作按钮 -->
            <div class="error-actions">
                <el-button type="primary" size="large" @click="goHome" class="action-btn">
                    <el-icon><HomeFilled /></el-icon>
                    <span>返回首页</span>
                </el-button>
                <el-button size="large" @click="goBack" class="action-btn">
                    <el-icon><Back /></el-icon>
                    <span>返回上一页</span>
                </el-button>
            </div>

            <!-- 快捷链接 -->
            <div class="quick-links">
                <p class="quick-links-title">您可能想访问：</p>
                <div class="links-grid">
                    <router-link to="/dashboard" class="quick-link">
                        <el-icon><DataAnalysis /></el-icon>
                        <span>工作台</span>
                    </router-link>
                    <router-link to="/tasks/list" class="quick-link">
                        <el-icon><List /></el-icon>
                        <span>任务列表</span>
                    </router-link>
                    <router-link to="/my-tasks" class="quick-link">
                        <el-icon><User /></el-icon>
                        <span>我的任务</span>
                    </router-link>
                    <router-link to="/org/tree" class="quick-link">
                        <el-icon><OfficeBuilding /></el-icon>
                        <span>组织架构</span>
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" name="404">
import { useRouter } from 'vue-router';
import { HomeFilled, Back, DataAnalysis, List, User, OfficeBuilding } from '@element-plus/icons-vue';

const router = useRouter();

const goBack = () => {
    router.go(-1);
};

const goHome = () => {
    router.push('/');
};
</script>

<style scoped>
.error-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, 
        var(--color-primary-light) 0%, 
        var(--color-background) 50%,
        var(--color-primary-light) 100%);
    padding: var(--space-6);
    box-sizing: border-box;
}

.error-container {
    max-width: 600px;
    width: 100%;
    text-align: center;
    animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 插图 */
.error-illustration {
    margin-bottom: var(--space-8);
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-20px);
    }
}

.illustration-svg {
    width: 200px;
    height: 200px;
    filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.1));
}

.error-number {
    font-size: 48px;
    font-weight: 800;
    fill: var(--color-primary);
    font-family: system-ui, -apple-system, sans-serif;
}

/* 错误内容 */
.error-content {
    margin-bottom: var(--space-8);
}

.error-title {
    font-size: clamp(28px, 5vw, 36px);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-4) 0;
}

.error-description {
    font-size: clamp(16px, 3vw, 18px);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-3) 0;
    line-height: 1.6;
}

.error-hint {
    font-size: clamp(14px, 2.5vw, 16px);
    color: var(--color-text-tertiary);
    margin: 0;
    line-height: 1.5;
}

/* 操作按钮 */
.error-actions {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: var(--space-10);
}

.action-btn {
    min-width: 140px;
    height: var(--button-height-lg);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-base);
    font-weight: 500;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
}

.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

/* 快捷链接 */
.quick-links {
    background: var(--color-card-bg);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quick-links-title {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    margin: 0 0 var(--space-4) 0;
    font-weight: 500;
}

.links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-3);
}

.quick-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-background);
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
}

.quick-link:hover {
    background: var(--color-primary-light);
    color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quick-link .el-icon {
    font-size: 24px;
}

.quick-link span {
    font-size: var(--font-size-sm);
    font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .error-page {
        padding: var(--space-4);
    }

    .illustration-svg {
        width: 150px;
        height: 150px;
    }

    .error-actions {
        flex-direction: column;
        gap: var(--space-3);
    }

    .action-btn {
        width: 100%;
        min-width: unset;
    }

    .links-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 480px) {
    .illustration-svg {
        width: 120px;
        height: 120px;
    }

    .quick-links {
        padding: var(--space-4);
    }

    .links-grid {
        gap: var(--space-2);
    }

    .quick-link {
        padding: var(--space-3);
    }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
    .error-page {
        background: linear-gradient(135deg, 
            rgba(var(--color-primary-rgb), 0.1) 0%, 
            var(--color-background) 50%,
            rgba(var(--color-primary-rgb), 0.1) 100%);
    }
}
</style>
