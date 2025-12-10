import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElNotification } from 'element-plus';

function buildApiBaseUrl(): string {
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envUrl) return envUrl;
    try {
        const proto = window.location.protocol || 'http:';
        const hn = window.location.hostname || 'localhost';
        const host = hn.includes(':') ? `[${hn}]` : hn; // IPv6 支持
        return `${proto}//${host}/api/v1`;
    } catch {
        return 'http://127.0.0.1:8888/api/v1';
    }
}

const service: AxiosInstance = axios.create({
    baseURL: buildApiBaseUrl(),
    timeout: 10000
});

service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const url = (config.url || '').toString();
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
        
        // 所有非认证接口都需要token（包括GET请求）
        if (token && !isAuthEndpoint) {
            (config.headers as any) = {
                ...(config.headers || {}),
                Authorization: `Bearer ${token}`,
            };
        }
        
        // 调试日志
        if (process.env.NODE_ENV === 'development') {
            console.log('发送请求:', {
                url: config.url,
                method: config.method,
                hasToken: !!token,
                isAuthEndpoint,
                baseURL: config.baseURL
            });
        }
        
        return config;
    },
    (error: AxiosError) => {
        console.error('请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

service.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError) => {
        const status = (error.response as any)?.status;
        const responseData = (error.response as any)?.data;
        
        // 处理 403 鉴权失败
        if (status === 403) {
            const errorMsg = responseData?.msg || responseData?.message || '权限不足，无法访问该资源';
            
            // 使用 ElNotification 显示更醒目的提示
            ElNotification({
                title: '权限不足',
                message: errorMsg,
                type: 'warning',
                duration: 5000,
                position: 'top-right',
                showClose: true,
            });
            
            // 同时使用 ElMessage 作为补充提示
            ElMessage.warning({
                message: errorMsg,
                duration: 3000,
                showClose: true,
            });
            
            console.warn('403 鉴权失败:', {
                url: error.config?.url,
                method: error.config?.method,
                message: errorMsg,
                response: responseData
            });
            
            // 可以选择跳转到 403 页面
            // 注意：这里不直接跳转，让业务代码决定如何处理
            return Promise.reject(error);
        }
        
        // 处理 401 未授权
        if (status === 401) {
            const errorMsg = responseData?.msg || responseData?.message || '登录已过期，请重新登录';
            
            ElNotification({
                title: '登录已过期',
                message: errorMsg,
                type: 'error',
                duration: 5000,
                position: 'top-right',
                showClose: true,
            });
            
            // 清除令牌并跳转登录
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('vuems_name');
            
            // 延迟跳转，确保通知显示
            setTimeout(() => {
                window.location.href = '/#/login';
            }, 1000);
            
            return Promise.reject(error);
        }
        
        // 详细的网络错误日志
        if (error.code === 'ERR_NETWORK') {
            console.error('网络错误:', {
                message: error.message,
                code: error.code,
                config: {
                    url: error.config?.url,
                    baseURL: error.config?.baseURL,
                    method: error.config?.method,
                }
            });
            console.error('请检查：');
            console.error('1. 后端服务是否正在运行？');
            console.error('2. 后端地址是否正确？', error.config?.baseURL);
            console.error('3. CORS配置是否正确？');
            
            ElMessage.error({
                message: '网络连接失败，请检查网络或联系管理员',
                duration: 5000,
                showClose: true,
            });
        }
        
        // 其他错误状态码的处理
        if (status && status >= 500) {
            const errorMsg = responseData?.msg || responseData?.message || '服务器错误，请稍后重试';
            ElMessage.error({
                message: errorMsg,
                duration: 5000,
                showClose: true,
            });
        }
        
        console.error('请求错误:', error);
        return Promise.reject(error);
    }
);

export default service;