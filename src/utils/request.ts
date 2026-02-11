import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElNotification } from 'element-plus';

function buildApiBaseUrl(): string {
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envUrl) return envUrl;

    // 开发环境使用相对路径，走 Vite 代理，避免跨域
    if ((import.meta as any).env?.DEV) {
        return '/api/v1';
    }

    // 生产环境通过 nginx 代理，不需要端口
    const proto = window.location.protocol;
    const host = window.location.hostname;
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

// 请求去重机制 - 存储 AbortController
const pendingRequests = new Map<string, AbortController>();
// 请求防抖：记录上次请求时间，避免短时间内重复请求
const requestTimestamps = new Map<string, number>();
const DEBOUNCE_INTERVAL = 1000; // 1000ms 内的重复请求将被忽略（增加到1秒）

/**
 * 生成请求唯一标识
 * 注意：GET 请求不参与去重，因为它们通常是幂等的
 */
function generateRequestKey(config: InternalAxiosRequestConfig): string {
    const { method, url, params, data } = config;
    // GET 请求返回空字符串，不参与去重
    if ((method || 'GET').toUpperCase() === 'GET') {
        return '';
    }
    // 标记了 skipDedupe 的请求不参与去重（用于只读 POST 接口）
    if ((config as any).skipDedupe) {
        return '';
    }
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
}

/**
 * 添加请求到待处理队列
 * 返回 true 表示请求可以继续发送，false 表示请求应该被忽略（防抖）
 */
function addPendingRequest(config: InternalAxiosRequestConfig): boolean {
    const requestKey = generateRequestKey(config);

    // 空字符串表示不需要去重（GET 请求）
    if (!requestKey) {
        return true;
    }

    const now = Date.now();
    const lastRequestTime = requestTimestamps.get(requestKey);

    // 防抖检查：如果距离上次请求时间太近，则忽略本次请求
    if (lastRequestTime && (now - lastRequestTime) < DEBOUNCE_INTERVAL) {
        console.warn('请求过于频繁，已忽略:', requestKey);
        return false;
    }

    // 如果已有相同请求在进行中，取消旧请求（新请求优先）
    if (pendingRequests.has(requestKey)) {
        const controller = pendingRequests.get(requestKey);
        controller?.abort();
        console.warn('取消重复请求:', requestKey);
        // 清除时间戳，允许立即重试被替换的请求
        requestTimestamps.delete(requestKey);
    }

    // 记录本次请求时间
    requestTimestamps.set(requestKey, now);

    // 创建新的 AbortController
    const controller = new AbortController();
    config.signal = controller.signal;
    pendingRequests.set(requestKey, controller);

    return true;
}

/**
 * 从待处理队列移除请求
 */
function removePendingRequest(config: InternalAxiosRequestConfig): void {
    const requestKey = generateRequestKey(config);
    if (requestKey) {
        pendingRequests.delete(requestKey);
    }
}

/**
 * 清除指定 URL 模式的防抖记录（用于页面切换后重新加载）
 * @param urlPattern URL 匹配模式，例如 '/task/get'
 */
export function clearDebounceForUrl(urlPattern: string): void {
    for (const [key, timestamp] of requestTimestamps.entries()) {
        if (key.includes(urlPattern)) {
            requestTimestamps.delete(key);
            pendingRequests.delete(key);
            console.log(`[防抖] 清除 ${urlPattern} 的防抖记录`);
        }
    }
}

const service: AxiosInstance = axios.create({
    baseURL: buildApiBaseUrl(),
    timeout: 10000
});

service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 添加请求去重，如果返回 false 表示请求过于频繁，取消本次请求
        if (!addPendingRequest(config)) {
            // 创建一个可识别的错误，让调用方知道这是被防抖取消的请求
            const debounceError = new Error('请求被防抖拦截（重复请求）');
            (debounceError as any).isDebounce = true;
            (debounceError as any).config = config;
            return Promise.reject(debounceError);
        }

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
        // 移除已完成的请求
        removePendingRequest(response.config as InternalAxiosRequestConfig);

        // 检查响应头中是否有CSRF Token（登录成功后返回）
        const newCsrfToken = response.headers['x-csrf-token'];
        if (newCsrfToken) {
            setCsrfToken(newCsrfToken);
        }
        return response;
    },
    (error: AxiosError) => {
        // 移除失败的请求
        if (error.config) {
            removePendingRequest(error.config as InternalAxiosRequestConfig);
        }

        // 如果是防抖取消的请求，静默处理（不显示错误提示）
        if ((error as any).isDebounce) {
            console.log('请求被防抖拦截:', error.message);
            return Promise.reject(error);
        }

        // 如果是请求被取消，直接返回
        if (axios.isCancel(error)) {
            console.log('请求已取消:', error.message);
            return Promise.reject(error);
        }

        // 如果是 AbortController 取消的请求，静默处理
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
            console.log('请求被中止:', error.message);
            return Promise.reject(error);
        }
        
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