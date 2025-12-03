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
import VChart from 'vue-echarts';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.component('VChart', VChart);

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
    if (binding.value && !permiss.key.includes(String(binding.value))) {
        el.style.display = 'none';
    } else {
        el.style.display = '';
    }
}

app.mount('#app');
