<template>
	<el-config-provider :locale="zhCn">
		<router-view v-slot="{ Component }">
			<transition name="page-fade" mode="out-in">
				<component :is="Component" />
			</transition>
		</router-view>
	</el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { useThemeStore } from './store/theme';

const theme = useThemeStore();
theme.initTheme();
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
</style>
