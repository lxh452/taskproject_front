/**
 * 密码强度计算和邀请码验证工具函数
 */

// 密码强度类型
export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

// 密码强度结果
export interface PasswordStrengthResult {
  strength: PasswordStrengthLevel;
  score: number;
  checks: {
    hasNumber: boolean;
    hasLetter: boolean;
    hasMixedCase: boolean;
    hasSpecialChar: boolean;
    hasMinLength: boolean;
  };
}

// 邀请码验证结果
export interface InviteCodeValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 计算密码强度
 * @param password 密码字符串
 * @returns 密码强度结果
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  
  // 长度检查
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  
  // 字符类型检查
  const hasNumber = /\d/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (hasNumber) score += 20;
  if (hasLowerCase) score += 15;
  if (hasUpperCase) score += 15;
  if (hasSpecialChar) score += 20;

  // 确定强度等级
  let strength: PasswordStrengthLevel;
  if (score < 50) {
    strength = 'weak';
  } else if (score < 80) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }
  
  return {
    strength,
    score,
    checks: {
      hasNumber,
      hasLetter: hasLowerCase || hasUpperCase,
      hasMixedCase: hasLowerCase && hasUpperCase,
      hasSpecialChar,
      hasMinLength: password.length >= 8,
    },
  };
}

/**
 * 验证邀请码格式
 * @param code 邀请码
 * @returns 验证结果
 */
export function validateInviteCode(code: string): InviteCodeValidationResult {
  // 长度检查
  if (code.length < 8 || code.length > 12) {
    return { valid: false, error: '邀请码长度应为8-12位' };
  }
  
  // 字符集检查 (A-Z不含O, 2-9不含0和1)
  if (!/^[A-Z2-9]+$/.test(code)) {
    return { valid: false, error: '邀请码只能包含大写字母和数字' };
  }
  
  // 易混淆字符检查
  if (/[O01I]/.test(code)) {
    return { valid: false, error: '邀请码包含无效字符' };
  }
  
  return { valid: true };
}

/**
 * 清理邀请码输入
 * @param code 原始输入
 * @returns 清理后的邀请码
 */
export function sanitizeInviteCode(code: string): string {
  // 转换为大写
  let sanitized = code.toUpperCase();
  
  // 移除空格
  sanitized = sanitized.replace(/\s/g, '');
  
  // 移除特殊字符,只保留字母和数字
  sanitized = sanitized.replace(/[^A-Z0-9]/g, '');
  
  return sanitized;
}

/**
 * 从URL中提取邀请码
 * @param url 完整URL或查询字符串
 * @returns 邀请码或null
 */
export function extractInviteCodeFromURL(url: string): string | null {
  try {
    // 尝试解析为URL
    const urlObj = new URL(url);
    const inviteCode = urlObj.searchParams.get('inviteCode');
    if (inviteCode) {
      return sanitizeInviteCode(inviteCode);
    }
  } catch {
    // 不是有效的URL,尝试从当前页面URL提取
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('inviteCode');
    if (inviteCode) {
      return sanitizeInviteCode(inviteCode);
    }
  }
  
  return null;
}

/**
 * 从二维码数据中提取邀请码
 * @param qrData 二维码扫描结果
 * @returns 邀请码或null
 */
export function extractInviteCodeFromQR(qrData: string): string | null {
  // 情况1: 纯邀请码
  const sanitized = sanitizeInviteCode(qrData);
  if (/^[A-Z2-9]{8,12}$/.test(sanitized)) {
    return sanitized;
  }
  
  // 情况2: URL格式
  try {
    const url = new URL(qrData);
    const inviteCode = url.searchParams.get('inviteCode');
    if (inviteCode) {
      const sanitizedCode = sanitizeInviteCode(inviteCode);
      if (/^[A-Z2-9]{8,12}$/.test(sanitizedCode)) {
        return sanitizedCode;
      }
    }
  } catch {
    // 不是有效的URL
  }
  
  // 情况3: 尝试从字符串中提取邀请码模式
  const match = qrData.match(/[A-Z2-9]{8,12}/);
  if (match) {
    return match[0];
  }
  
  return null;
}
