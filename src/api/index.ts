import request from '../utils/request';

// ===== Backend APIs =====
export const apiLogin = (data: { username: string; password: string; }) =>
    request({ url: '/auth/login', method: 'post', data });

export const apiRegister = (data: { username: string; password: string; email: string; realName: string }) =>
    request({ url: '/auth/register', method: 'post', data });

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

export const listDepartments = (data: any) =>
    request({ url: '/department/list', method: 'post', data });

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

// 标记通知为已读
export const markNotificationRead = (data: { notificationId: string }) =>
    request({ url: '/notification/read', method: 'put', data });
