import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import { usePermissStore } from './store/permiss';
import 'element-plus/dist/index.css';
import './assets/css/icon.css';
import './assets/css/tables.css';
import './assets/css/page-headers.css';
import './assets/css/button-fix.css';
import './assets/css/dialog-theme.css';
import './assets/css/my-work-theme.css';
import VChart from 'vue-echarts';
import { ElNotification } from 'element-plus';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.component('VChart', VChart);

// 全局错误处理
app.config.errorHandler = (err: any, vm, info) => {
    console.error('全局错误捕获:', err);
    console.error('错误信息:', info);
    
    // 显示错误通知
    ElNotification({
        title: '应用错误',
        message: err?.message || '发生了未知错误，请刷新页面重试',
        type: 'error',
        duration: 5000,
        position: 'top-right',
    });
    
    // 上报错误到监控系统（预留接口）
    // reportError({ error: err, info, url: window.location.href });
};

// 捕获未处理的Promise错误
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason);
    
    // 避免重复提示网络错误（已在request.ts中处理）
    if (event.reason?.code === 'ERR_NETWORK') {
        return;
    }
    
    ElNotification({
        title: '异步错误',
        message: event.reason?.message || '发生了异步错误',
        type: 'warning',
        duration: 4000,
        position: 'top-right',
    });
});

// 捕获资源加载错误
window.addEventListener('error', (event) => {
    if (event.target && (event.target as HTMLElement).tagName) {
        const target = event.target as HTMLElement;
        console.error('资源加载失败:', target.tagName, (target as any).src || (target as any).href);
    }
}, true);

// 注册elementplus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}
// 自定义权限指令
const permiss = usePermissStore();
app.directive('permiss', {
    mounted(el, binding) {
        checkPermission(el, binding, permiss);
    },
    updated(el, binding) {
        checkPermission(el, binding, permiss);
    },
});

function checkPermission(el: HTMLElement, binding: any, permiss: any) {
    const keys = permiss.key || [];
    if (binding.value && !keys.includes(String(binding.value))) {
        el.style.display = 'none';
    } else {
        el.style.display = '';
    }
}

app.mount('#app');
