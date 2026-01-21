/**
 * 统一错误处理工具
 */

import { ElMessage } from 'element-plus';

// 错误类型
export type ErrorType = 'network' | 'auth' | 'validation' | 'server' | 'unknown';

// 错误配置
export interface ErrorConfig {
  type: ErrorType;
  message: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

// 错误消息映射
const errorMessageMap: Record<string, string> = {
  // 登录相关
  'login_failed': '用户名或密码错误',
  'user_not_found': '用户不存在',
  'incorrect_password': '密码错误',
  'user_banned': '账户已被封禁，请联系管理员',
  'user_disabled': '账户已被禁用',
  'login_too_many_attempts': '登录失败次数过多，账户已锁定',
  'account_locked': '账户已锁定，请稍后再试',
  
  // 邀请码相关
  'invite_code_invalid': '邀请码无效或格式错误',
  'invite_code_expired': '邀请码已过期',
  'invite_code_used': '邀请码已被使用',
  'invite_code_not_found': '邀请码不存在',
  'invite_code_format_error': '邀请码格式错误',
  
  // 员工相关
  'employee_not_found': '未找到员工信息',
  'employee_already_exists': '员工已存在',
  'employee_not_approved': '员工申请未通过审批',
  
  // 公司相关
  'company_not_found': '公司不存在',
  'company_disabled': '公司已被禁用',
  'already_in_company': '您已加入公司',
  
  // 注册相关
  'username_exists': '用户名已存在',
  'email_exists': '邮箱已被注册',
  'verification_code_invalid': '验证码无效或已过期',
  'verification_code_error': '验证码错误',
  
  // 网络相关
  'network_error': '网络连接失败，请检查网络后重试',
  'timeout': '请求超时，请稍后重试',
  'server_error': '服务器错误，请稍后重试',
  
  // 权限相关
  'permission_denied': '权限不足',
  'unauthorized': '未授权，请先登录',
  'token_expired': '登录已过期，请重新登录',
};

/**
 * 获取友好的错误消息
 * @param errorCode 错误代码
 * @param defaultMessage 默认消息
 * @returns 友好的错误消息
 */
export function getFriendlyErrorMessage(errorCode: string, defaultMessage?: string): string {
  return errorMessageMap[errorCode] || defaultMessage || '操作失败，请稍后重试';
}

/**
 * 处理API错误
 * @param error 错误对象
 * @param showMessage 是否显示错误消息
 * @returns 错误配置
 */
export function handleApiError(error: any, showMessage: boolean = true): ErrorConfig {
  let errorConfig: ErrorConfig;
  
  // 网络错误
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
    errorConfig = {
      type: 'network',
      message: getFriendlyErrorMessage('network_error'),
      showRetry: true,
    };
  }
  // 超时错误
  else if (error.code === 'ECONNABORTED') {
    errorConfig = {
      type: 'network',
      message: getFriendlyErrorMessage('timeout'),
      showRetry: true,
    };
  }
  // 后端返回的错误
  else if (error.response) {
    const { status, data } = error.response;
    
    // 401 未授权
    if (status === 401) {
      errorConfig = {
        type: 'auth',
        message: getFriendlyErrorMessage('unauthorized'),
        showRetry: false,
      };
    }
    // 403 权限不足
    else if (status === 403) {
      errorConfig = {
        type: 'auth',
        message: getFriendlyErrorMessage('permission_denied'),
        showRetry: false,
      };
    }
    // 500 服务器错误
    else if (status >= 500) {
      errorConfig = {
        type: 'server',
        message: getFriendlyErrorMessage('server_error'),
        showRetry: true,
      };
    }
    // 其他错误
    else {
      const errorCode = data?.msg || data?.message || '';
      errorConfig = {
        type: 'validation',
        message: getFriendlyErrorMessage(errorCode, data?.msg || data?.message),
        showRetry: false,
      };
    }
  }
  // 未知错误
  else {
    errorConfig = {
      type: 'unknown',
      message: error.message || '未知错误',
      showRetry: false,
    };
  }
  
  // 显示错误消息
  if (showMessage) {
    showErrorMessage(errorConfig);
  }
  
  return errorConfig;
}

/**
 * 显示错误消息
 * @param config 错误配置
 */
export function showErrorMessage(config: ErrorConfig): void {
  const { type, message, showRetry, onRetry } = config;
  
  // 根据错误类型选择图标
  const iconMap: Record<ErrorType, string> = {
    network: 'warning',
    auth: 'warning',
    validation: 'error',
    server: 'error',
    unknown: 'error',
  };
  
  // 显示消息
  const messageInstance = ElMessage({
    message,
    type: iconMap[type] as any,
    duration: showRetry ? 0 : 5000, // 有重试按钮时不自动关闭
    showClose: true,
    dangerouslyUseHTMLString: showRetry,
  });
  
  // 如果需要显示重试按钮
  if (showRetry && onRetry) {
    // 注意：Element Plus 的 ElMessage 不直接支持按钮
    // 这里只是示例，实际使用时可能需要使用 ElNotification 或自定义组件
    console.log('重试功能需要使用 ElNotification 或自定义组件实现');
  }
}

/**
 * 处理表单验证错误
 * @param errors 验证错误对象
 * @returns 格式化的错误消息
 */
export function handleValidationErrors(errors: Record<string, string[]>): string {
  const messages: string[] = [];
  
  for (const field in errors) {
    const fieldErrors = errors[field];
    if (fieldErrors && fieldErrors.length > 0) {
      messages.push(...fieldErrors);
    }
  }
  
  return messages.join('; ');
}

/**
 * 创建带重试功能的错误处理器
 * @param retryFn 重试函数
 * @returns 错误处理函数
 */
export function createRetryableErrorHandler(retryFn: () => void) {
  return (error: any) => {
    const errorConfig = handleApiError(error, false);
    errorConfig.onRetry = retryFn;
    showErrorMessage(errorConfig);
  };
}
