import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElNotification } from 'element-plus';

function buildApiBaseUrl(): string {
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envUrl) return envUrl;
    
    // 自动使用当前访问的域名/IP，避免跨域问题
    const proto = window.location.protocol;
    const host = window.location.hostname;
    
    // 本地开发环境需要指定端口
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://127.0.0.1:8888/api/v1';
    }
    
    // 生产环境通过 nginx 代理，不需要端口
    return `${proto}//${host}/api/v1`;
}

// CSRF Token管理
let csrfToken: string | null = null;

/**
 * 设置CSRF Token（登录成功后调用）
 */
export function setCsrfToken(token: string) {
    csrfToken = token;
    // 同时存储到sessionStorage，页面刷新后可恢复
    sessionStorage.setItem('csrfToken', token);
}

/**
 * 获取CSRF Token
 */
export function getCsrfToken(): string | null {
    if (!csrfToken) {
        csrfToken = sessionStorage.getItem('csrfToken');
    }
    return csrfToken;
}

/**
 * 清除CSRF Token（登出时调用）
 */
export function clearCsrfToken() {
    csrfToken = null;
    sessionStorage.removeItem('csrfToken');
}

// 防重复提示机制
const errorNotificationState = {
    isShowing401: false,
    isShowing403: false,
};

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
        
        // 添加CSRF Token（非GET/HEAD/OPTIONS请求）
        const method = (config.method || 'GET').toUpperCase();
        const currentCsrfToken = getCsrfToken();
        if (currentCsrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method) && !isAuthEndpoint) {
            (config.headers as any) = {
                ...(config.headers || {}),
                'X-CSRF-Token': currentCsrfToken,
            };
        }
        
        // 调试日志
        if (import.meta.env?.DEV) {
            console.log('发送请求:', {
                url: config.url,
                method: config.method,
                hasToken: !!token,
                hasCsrfToken: !!currentCsrfToken,
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
        // 检查响应头中是否有CSRF Token（登录成功后返回）
        const newCsrfToken = response.headers['x-csrf-token'];
        if (newCsrfToken) {
            setCsrfToken(newCsrfToken);
        }
        return response;
    },
    (error: AxiosError) => {
        const status = (error.response as any)?.status;
        const responseData = (error.response as any)?.data;
        
        // 处理 403 鉴权失败
        if (status === 403) {
            const errorMsg = responseData?.msg || responseData?.message || '权限不足，无法访问该资源';
            
            // 判断是否是账号被封禁或公司被禁用
            const isBanned = errorMsg.includes('封禁') || errorMsg.includes('banned');
            const isCompanyDisabled = errorMsg.includes('公司') && errorMsg.includes('禁用');
            
            // 防重复提示：如果已经在显示403提示，则跳过
            if (!errorNotificationState.isShowing403) {
                errorNotificationState.isShowing403 = true;
                
                let title = '权限不足';
                let notificationType: 'warning' | 'error' = 'warning';
                let shouldLogout = false;
                
                if (isBanned) {
                    title = '账号已被封禁';
                    notificationType = 'error';
                    shouldLogout = true;
                } else if (isCompanyDisabled) {
                    title = '公司已被禁用';
                    notificationType = 'error';
                    shouldLogout = true;
                }
                
                // 使用 ElNotification 显示提示
                ElNotification({
                    title: title,
                    message: errorMsg,
                    type: notificationType,
                    duration: shouldLogout ? 8000 : 5000,
                    position: 'top-right',
                    showClose: true,
                    onClose: () => {
                        // 提示关闭后重置状态
                        errorNotificationState.isShowing403 = false;
                    }
                });
                
                // 如果是封禁或公司禁用，清除登录状态并跳转到登录页
                if (shouldLogout) {
                    localStorage.removeItem('authToken');
                    sessionStorage.removeItem('authToken');
                    localStorage.removeItem('vuems_name');
                    clearCsrfToken();
                    
                    setTimeout(() => {
                        window.location.href = '/#/login';
                    }, 2000);
                }
            }
            
            console.warn('403 鉴权失败:', {
                url: error.config?.url,
                method: error.config?.method,
                message: errorMsg,
                isBanned,
                isCompanyDisabled,
                response: responseData
            });
            
            return Promise.reject(error);
        }
        
        // 处理 401 未授权
        if (status === 401) {
            const errorMsg = responseData?.msg || responseData?.message || '登录已过期，请重新登录';
            
            // 防重复提示：如果已经在显示401提示，则跳过
            if (!errorNotificationState.isShowing401) {
                errorNotificationState.isShowing401 = true;
                
                ElNotification({
                    title: '登录已过期',
                    message: errorMsg,
                    type: 'error',
                    duration: 5000,
                    position: 'top-right',
                    showClose: true,
                    onClose: () => {
                        // 提示关闭后重置状态
                        errorNotificationState.isShowing401 = false;
                    }
                });
                
                // 清除令牌并跳转登录
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                localStorage.removeItem('vuems_name');
                clearCsrfToken();
                
                // 延迟跳转，确保通知显示
                setTimeout(() => {
                    window.location.href = '/#/login';
                }, 1000);
            }
            
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