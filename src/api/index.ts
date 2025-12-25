import request from '../utils/request';

// ===== Backend APIs =====
export const apiLogin = (data: { username: string; password: string; }) =>
    request({ url: '/auth/login', method: 'post', data });

export const apiRegister = (data: { username: string; password: string; email: string; realName: string; verificationCode?: string }) =>
    request({ url: '/auth/register', method: 'post', data });

// 发送验证码
export const sendVerificationCode = (data: { email: string; type: string }) =>
    request({ url: '/auth/send-code', method: 'post', data });

// 重置密码
export const resetPassword = (data: { email: string; verificationCode: string; newPassword: string }) =>
    request({ url: '/auth/reset-password', method: 'post', data });

// Mock helpers for legacy views
export const fetchData = () =>
    request({ url: './mock/table.json', method: 'get' });

export const fetchUserData = () =>
    request({ url: './mock/user.json', method: 'get' });

export const fetchRoleData = () =>
    request({ url: './mock/role.json', method: 'get' });

// Task and TaskNode
export const getMyTaskNodes = (data?: any) => {
    const params = data || { page: 1, pageSize: 100 };
    // GET 请求使用 query 参数
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.pageSize) query.append('pageSize', String(params.pageSize));
    const queryString = query.toString();
    return request({ 
        url: `/tasknode/get/user${queryString ? '?' + queryString : ''}`, 
        method: 'get' 
    });
};

export const listTasks = (data: any) =>
    request({ url: '/task/list', method: 'post', data });

export const getTask = (data: { taskId: string }) =>
    request({ url: '/task/get', method: 'post', data });

export const updateTaskProgress = (data: any) =>
    request({ url: '/task/progress', method: 'put', data });

// 更新任务信息
export const updateTask = (data: any) =>
    request({ url: '/task/update', method: 'put', data });

// Handover
export const getHandoverList = (data?: any) =>
    request({ url: '/handover/list', method: 'post', data: data || { page: 1, pageSize: 10 } });

// Alias for compatibility
export const listHandovers = (data?: any) =>
    getHandoverList(data);

export const getHandover = (data: { handoverId: string }) =>
    request({ url: '/handover/get', method: 'post', data });

export const createHandover = (data: { taskId: string; fromEmployeeId: string; toEmployeeId: string; handoverReason: string; handoverNote?: string }) =>
    request({ url: '/handover/create', method: 'post', data });

export const approveHandover = (data: { handoverId: string; approved: number; comment?: string; toEmployeeId?: string }) =>
    request({ url: '/handover/approve', method: 'post', data });

export const confirmHandover = (data: { handoverId: string }) =>
    request({ url: '/handover/confirm', method: 'post', data });

export const rejectHandover = (data: { handoverId: string; comment?: string }) =>
    request({ url: '/handover/reject', method: 'post', data });

// 获取当前用户可交接的任务列表
export const getHandoverableTasks = (data?: { page?: number; pageSize?: number }) =>
    request({ url: '/handover/tasks', method: 'get', params: data || { page: 1, pageSize: 100 } });

// Employees / Orgs
export const getMyEmployee = () =>
    request({ url: '/employee/me', method: 'get' });

export const listEmployees = (data: any) =>
    request({ url: '/employee/list', method: 'post', data });
export const updateEmployee = (data: any) =>
    request({ url: '/employee/update', method: 'put', data });

export const listCompanies = (data: any) =>
    request({ url: '/company/list', method: 'post', data });

export const createCompany = (data: any) =>
    request({ url: '/company/create', method: 'post', data });

export const joinCompany = (data: { companyId: string }) =>
    request({ url: '/employee/join', method: 'post', data });

// 邀请码相关 API
export const generateInviteCode = (data?: { expireDays?: number; maxUses?: number }) =>
    request({ url: '/company/invite/generate', method: 'post', data: data || {} });

export const parseInviteCode = (data: { inviteCode: string }) =>
    request({ url: '/company/invite/parse', method: 'post', data });

export const applyJoinCompany = (data: { inviteCode: string; applyReason?: string }) =>
    request({ url: '/employee/join/apply', method: 'post', data });

export const approveJoinApplication = (data: { applicationId: string; approved: boolean; note?: string; departmentId?: string; positionId?: string }) =>
    request({ url: '/employee/join/approve', method: 'post', data });

export const getPendingJoinApplications = (data?: { page?: number; pageSize?: number }) =>
    request({ url: '/employee/join/pending', method: 'post', data: data || { page: 1, pageSize: 20 } });

export const listDepartments = (data: any) =>
    request({ url: '/department/list', method: 'post', data });

export const createDepartment = (data: any) =>
    request({ url: '/department/create', method: 'post', data });

export const updateDepartment = (data: any) =>
    request({ url: '/department/update', method: 'put', data });

export const listPositions = (data: any) =>
    request({ url: '/position/list', method: 'post', data });

export const createPosition = (data: any) =>
    request({ url: '/position/create', method: 'post', data });

export const updatePosition = (data: any) =>
    request({ url: '/position/update', method: 'put', data });

export const deletePosition = (data: any) =>
    request({ url: '/position/delete', method: 'post', data });

// Notifications
export const listNotifications = (data: any) =>
    request({ url: '/notification/list', method: 'post', data });

// Roles
export const roleList = (data: any) =>
    request({ url: '/role/list', method: 'post', data });
export const createRole = (data: any) =>
    request({ url: '/role/create', method: 'post', data });
export const updateRole = (data: any) =>
    request({ url: '/role/update', method: 'put', data });
export const deleteRole = (data: any) =>
    request({ url: '/role/delete', method: 'post', data });
export const assignRole = (data: any) =>
    request({ url: '/role/assign', method: 'post', data });
export const revokeRole = (data: any) =>
    request({ url: '/role/revoke', method: 'post', data });
export const employeeRoles = (data: any) =>
    request({ url: '/role/employeeRoles', method: 'post', data });
export const listRolesByPosition = (positionId: string) =>
    request({ url: `/position/${positionId}/roles`, method: 'get' });
export const positionRoles = (data: any) =>
    request({ url: '/role/positionRoles', method: 'post', data });

// Create Task
export const createTask = (data: any) =>
    request({ url: '/task/create', method: 'post', data });

// Aliases for compatibility with views
export const listMyTaskNodes = (data?: any) => {
    const params = data || { page: 1, pageSize: 100 };
    // GET 请求使用 query 参数
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.pageSize) query.append('pageSize', String(params.pageSize));
    const queryString = query.toString();
    return request({ 
        url: `/tasknode/get/user${queryString ? '?' + queryString : ''}`, 
        method: 'get' 
    });
};

// TaskNode create/update/list by task
export const createTaskNode = (data: any) =>
    request({ url: '/tasknode/create', method: 'post', data });

export const updateTaskNode = (data: any) =>
    request({ url: '/tasknode/update', method: 'put', data });

export const updatePrerequisiteNodes = (data: { nodeId: string; prerequisiteNodes: string }) =>
    request({ url: '/tasknode/update/prerequisites', method: 'put', data });

export const listTaskNodesByTask = (data: any) =>
    request({ url: '/tasknode/list', method: 'post', data });

// Employee Leave
export const employeeLeave = (data: { employeeId: string; leaveReason: string; leaveDate?: string }) =>
    request({ url: '/employee/leave', method: 'post', data });

export const confirmLeaveApproval = (data: { approvalId: string; approved: boolean; note?: string }) =>
    request({ url: '/employee/leave/approve', method: 'post', data });

// Task Auto Dispatch
export const autoDispatchTask = (data: { taskId: string }) =>
    request({ url: '/task/dispatch', method: 'post', data });

// ===== Checklist API (任务清单) =====
// 创建任务清单
export const createChecklist = (data: { taskNodeId: string; content: string; sortOrder?: number }) =>
    request({ url: '/checklist/create', method: 'post', data });

// 更新任务清单
export const updateChecklist = (data: { checklistId: string; content?: string; isCompleted?: number; sortOrder?: number }) =>
    request({ url: '/checklist/update', method: 'put', data });

// 删除任务清单
export const deleteChecklist = (data: { checklistId: string }) =>
    request({ url: '/checklist/delete', method: 'post', data });

// 获取任务清单详情
export const getChecklist = (data: { checklistId: string }) =>
    request({ url: '/checklist/get', method: 'post', data });

// 获取任务节点下的所有清单
export const getChecklistList = (data: { taskNodeId: string; page?: number; pageSize?: number }) =>
    request({ url: '/checklist/list', method: 'post', data });

// 批量完成/取消完成清单
export const batchCompleteChecklist = (data: { checklistIds: string[]; isCompleted: number }) =>
    request({ url: '/checklist/batch/complete', method: 'post', data });

// 获取我的清单列表
export const getMyChecklist = (data?: { page?: number; pageSize?: number; isCompleted?: number }) =>
    request({ url: '/checklist/my', method: 'post', data: data || { page: 1, pageSize: 50 } });

// 提交任务节点完成审批
export const submitTaskNodeCompletionApproval = (data: { nodeId: string }) =>
    request({ url: '/checklist/submit/approval', method: 'post', data });

// 审批任务节点完成
export const approveTaskNodeCompletion = (data: { approvalId: string; approved: number; comment?: string }) =>
    request({ url: '/checklist/approve/completion', method: 'post', data });

// 标记通知为已读
export const markNotificationRead = (data: { notificationId: string }) =>
    request({ url: '/notification/read', method: 'put', data });

// ===== 附件管理 API =====
// 上传文件
export const uploadFile = (formData: FormData) =>
    request({ url: '/upload/file', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } });

// 上传头像
export const uploadAvatar = (formData: FormData) =>
    request({ url: '/upload/avatar', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } });

// 获取任务附件列表
export const getTaskAttachments = (data: { taskId: string }) =>
    request({ url: '/upload/task/attachments', method: 'post', data });

// 获取任务节点附件列表
export const getTaskNodeAttachments = (data: { taskNodeId: string }) =>
    request({ url: '/upload/tasknode/attachments', method: 'post', data });

// 删除附件
export const deleteAttachment = (data: { fileId: string }) =>
    request({ url: '/upload/delete', method: 'post', data });

// ===== 任务评论 API (MongoDB) =====
// 创建任务评论
export const createTaskComment = (data: { 
    taskId: string; 
    taskNodeId?: string; 
    content: string; 
    contentHtml?: string;
    atEmployeeIds?: string[];
    parentId?: string;
    attachmentIds?: string[];
}) => request({ url: '/task/comment/create', method: 'post', data });

// 获取任务评论列表
export const getTaskComments = (data: { taskId?: string; taskNodeId?: string; page?: number; pageSize?: number }) =>
    request({ url: '/task/comment/list', method: 'post', data });

// 点赞/取消点赞评论
export const likeTaskComment = (data: { commentId: string; isLike: number }) =>
    request({ url: '/task/comment/like', method: 'post', data });

// 删除任务评论
export const deleteTaskComment = (data: { commentId: string }) =>
    request({ url: '/task/comment/delete', method: 'post', data });

// ===== 附件评论标注 API (MongoDB) =====
// 创建附件评论
export const createAttachmentComment = (data: {
    fileId: string;
    taskId?: string;
    taskNodeId?: string;
    content: string;
    atEmployeeIds?: string[];
    annotationType?: string;
    annotationData?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        color?: string;
        text?: string;
        lineNumber?: number;
    };
    pageNumber?: number;
    parentId?: string;
}) => request({ url: '/upload/comment/create', method: 'post', data });

// 获取附件评论列表
export const getAttachmentComments = (data: { fileId: string; page?: number; pageSize?: number }) =>
    request({ url: '/upload/comment/list', method: 'post', data });

// 标记附件评论已解决
export const resolveAttachmentComment = (data: { commentId: string }) =>
    request({ url: '/upload/comment/resolve', method: 'post', data });

// 删除附件评论
export const deleteAttachmentComment = (data: { commentId: string }) =>
    request({ url: '/upload/comment/delete', method: 'post', data });


// 获取任务节点详情
export const getTaskNode = (data: { taskNodeId: string }) =>
    request({ url: '/tasknode/get', method: 'post', data });
