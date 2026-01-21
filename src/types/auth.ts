/**
 * 认证相关类型定义
 */

// 登录响应(扩展)
export interface LoginResponse {
  token: string;
  userID: string;
  username: string;
  realName: string;
  hasJoinedCompany: boolean;
  // 新增安全字段
  remainingAttempts?: number;  // 剩余尝试次数
  lockTimeMinutes?: number;    // 锁定剩余时间(分钟)
  isLocked?: boolean;          // 是否被锁定
}

// 密码强度
export interface PasswordStrength {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  checks: {
    hasNumber: boolean;
    hasLetter: boolean;
    hasMixedCase: boolean;
    hasSpecialChar: boolean;
    hasMinLength: boolean;
  };
  suggestions?: string[];
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  rememberDuration?: number;  // 记住密码时长(天)
}

// 注册请求
export interface RegisterRequest {
  username: string;
  password: string;
  realName: string;
  email?: string;
  inviteCode?: string;  // 可选的邀请码
}
