/**
 * 公司相关类型定义
 */

// 员工状态
export interface EmployeeStatus {
  id: string;
  userId: string;
  companyId: string;
  status: number;  // 1: 正常, 2: 待审批, 3: 已拒绝
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
}

// 邀请码信息
export interface InviteCodeInfo {
  inviteCode: string;
  companyId: string;
  companyName: string;
  companyType: string;
  companyBusiness: string;
  expiresAt: string;
  isValid: boolean;
  maxUses: number;
  usedCount: number;
}

// 加入公司申请
export interface JoinCompanyApplication {
  applicationId: string;
  companyId: string;
  companyName: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  submitTime: string;
  rejectReason?: string;
}

// 轮询状态
export interface PollingStatus {
  isPolling: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  elapsedTime: number;  // 已轮询时长(毫秒)
  message?: string;
}
