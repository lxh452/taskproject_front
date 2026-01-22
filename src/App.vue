<template>
	<el-config-provider :locale="zhCn">
		<router-view v-slot="{ Component }">
			<transition name="page-fade" mode="out-in">
				<component :is="Component" v-if="!hasError" @vue:error="handleError" />
			</transition>
		</router-view>
		
		<!-- 全局错误提示 -->
		<div v-if="hasError" class="global-error-container">
			<div class="error-content">
				<el-icon class="error-icon" :size="64"><CircleClose /></el-icon>
				<h2>页面加载出错</h2>
				<p>{{ errorMessage }}</p>
				<el-button type="primary" @click="reloadPage">刷新页面</el-button>
			</div>
		</div>
	</el-config-provider>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { ElConfigProvider } from 'element-plus';
import { CircleClose } from '@element-plus/icons-vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { useThemeStore } from './store/theme';

const theme = useThemeStore();
theme.initTheme();

// 全局错误处理
const hasError = ref(false);
const errorMessage = ref('');

function handleError(err: any) {
	console.error('全局错误捕获:', err);
	hasError.value = true;
	errorMessage.value = err?.message || '未知错误';
}

function reloadPage() {
	hasError.value = false;
	errorMessage.value = '';
	window.location.reload();
}

// Vue 3 错误捕获
onErrorCaptured((err: any) => {
	console.error('组件错误捕获:', err);
	handleError(err);
	return false; // 阻止错误继续传播
});

// 全局未捕获错误
window.addEventListener('error', (event) => {
	console.error('全局未捕获错误:', event.error);
	handleError(event.error);
});

// 全局未捕获Promise错误
window.addEventListener('unhandledrejection', (event) => {
	console.error('未捕获的Promise错误:', event.reason);
	handleError(event.reason);
});
</script>
<style>
@import './assets/css/main.css';
@import './assets/css/pages.css';
@import './assets/css/typography.css';

/* 页面切换过渡动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 主题切换过渡 */
html.theme-transitioning,
html.theme-transitioning * {
  transition: background-color 0.3s ease, 
              color 0.3s ease, 
              border-color 0.3s ease,
              box-shadow 0.3s ease !important;
}

/* 全局错误容器 */
.global-error-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  z-index: 9999;
}

.error-content {
  text-align: center;
  padding: var(--space-8);
}

.error-icon {
  color: var(--color-danger);
  margin-bottom: var(--space-4);
}

.error-content h2 {
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  margin: var(--space-4) 0;
}

.error-content p {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}
</style>
