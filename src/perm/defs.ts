/**
 * 权限字典（与后端 permdefs.go 保持一致）
 */

// 权限码常量
export const PERM = {
  // 任务模块 (1-9)
  TASK_READ: 1,
  TASK_CREATE: 2,
  TASK_UPDATE: 3,
  TASK_DELETE: 4,
  TASK_APPROVE: 5,

  // 任务节点 (10-19)
  TASKNODE_READ: 10,
  TASKNODE_UPDATE: 11,
  TASKNODE_CREATE: 12,
  TASKNODE_DELETE: 13,

  // 交接 (20-29)
  HANDOVER_READ: 20,
  HANDOVER_CREATE: 21,
  HANDOVER_APPROVE: 22,
  HANDOVER_REJECT: 23,

  // 通知 (30-39)
  NOTIFICATION_READ: 30,
  NOTIFICATION_CREATE: 31,
  NOTIFICATION_DELETE: 32,

  // 组织 - 公司 (40-44)
  COMPANY_READ: 40,
  COMPANY_CREATE: 41,
  COMPANY_UPDATE: 42,
  COMPANY_DELETE: 43,

  // 组织 - 部门 (45-49)
  DEPARTMENT_READ: 45,
  DEPARTMENT_CREATE: 46,
  DEPARTMENT_UPDATE: 47,
  DEPARTMENT_DELETE: 48,

  // 组织 - 职位 (50-54)
  POSITION_READ: 50,
  POSITION_CREATE: 51,
  POSITION_UPDATE: 52,
  POSITION_DELETE: 53,

  // 角色 (60-65)
  ROLE_READ: 60,
  ROLE_CREATE: 61,
  ROLE_UPDATE: 62,
  ROLE_DELETE: 63,
  ROLE_ASSIGN: 64,
  ROLE_REVOKE: 65,

  // 员工 (70-74)
  EMPLOYEE_READ: 70,
  EMPLOYEE_CREATE: 71,
  EMPLOYEE_UPDATE: 72,
  EMPLOYEE_DELETE: 73,
  EMPLOYEE_LEAVE: 74,
} as const;

// 权限名称映射
export const PERM_NAMES: Record<number, string> = {
  [PERM.TASK_READ]: '任务查看',
  [PERM.TASK_CREATE]: '任务创建',
  [PERM.TASK_UPDATE]: '任务更新',
  [PERM.TASK_DELETE]: '任务删除',
  [PERM.TASK_APPROVE]: '任务审批',
  [PERM.TASKNODE_READ]: '任务节点查看',
  [PERM.TASKNODE_UPDATE]: '任务节点更新',
  [PERM.TASKNODE_CREATE]: '任务节点创建',
  [PERM.TASKNODE_DELETE]: '任务节点删除',
  [PERM.HANDOVER_READ]: '交接查看',
  [PERM.HANDOVER_CREATE]: '交接创建',
  [PERM.HANDOVER_APPROVE]: '交接审批',
  [PERM.HANDOVER_REJECT]: '交接拒绝',
  [PERM.NOTIFICATION_READ]: '通知查看',
  [PERM.NOTIFICATION_CREATE]: '通知创建',
  [PERM.NOTIFICATION_DELETE]: '通知删除',
  [PERM.COMPANY_READ]: '公司查看',
  [PERM.COMPANY_CREATE]: '公司创建',
  [PERM.COMPANY_UPDATE]: '公司更新',
  [PERM.COMPANY_DELETE]: '公司删除',
  [PERM.DEPARTMENT_READ]: '部门查看',
  [PERM.DEPARTMENT_CREATE]: '部门创建',
  [PERM.DEPARTMENT_UPDATE]: '部门更新',
  [PERM.DEPARTMENT_DELETE]: '部门删除',
  [PERM.POSITION_READ]: '职位查看',
  [PERM.POSITION_CREATE]: '职位创建',
  [PERM.POSITION_UPDATE]: '职位更新',
  [PERM.POSITION_DELETE]: '职位删除',
  [PERM.ROLE_READ]: '角色查看',
  [PERM.ROLE_CREATE]: '角色创建',
  [PERM.ROLE_UPDATE]: '角色更新',
  [PERM.ROLE_DELETE]: '角色删除',
  [PERM.ROLE_ASSIGN]: '角色分配',
  [PERM.ROLE_REVOKE]: '角色撤销',
  [PERM.EMPLOYEE_READ]: '员工查看',
  [PERM.EMPLOYEE_CREATE]: '员工创建',
  [PERM.EMPLOYEE_UPDATE]: '员工更新',
  [PERM.EMPLOYEE_DELETE]: '员工删除',
  [PERM.EMPLOYEE_LEAVE]: '员工离职',
};

// 文本权限到数字的映射（兼容后端）
export const TEXT_TO_CODE: Record<string, number> = {
  'task:read': PERM.TASK_READ,
  'task:create': PERM.TASK_CREATE,
  'task:update': PERM.TASK_UPDATE,
  'task:delete': PERM.TASK_DELETE,
  'task:approve': PERM.TASK_APPROVE,
  'tasknode:read': PERM.TASKNODE_READ,
  'tasknode:update': PERM.TASKNODE_UPDATE,
  'tasknode:create': PERM.TASKNODE_CREATE,
  'tasknode:delete': PERM.TASKNODE_DELETE,
  'handover:read': PERM.HANDOVER_READ,
  'handover:create': PERM.HANDOVER_CREATE,
  'handover:approve': PERM.HANDOVER_APPROVE,
  'handover:reject': PERM.HANDOVER_REJECT,
  'notification:read': PERM.NOTIFICATION_READ,
  'notification:create': PERM.NOTIFICATION_CREATE,
  'notification:delete': PERM.NOTIFICATION_DELETE,
  'company:read': PERM.COMPANY_READ,
  'company:create': PERM.COMPANY_CREATE,
  'company:update': PERM.COMPANY_UPDATE,
  'company:delete': PERM.COMPANY_DELETE,
  'department:read': PERM.DEPARTMENT_READ,
  'department:create': PERM.DEPARTMENT_CREATE,
  'department:update': PERM.DEPARTMENT_UPDATE,
  'department:delete': PERM.DEPARTMENT_DELETE,
  'position:read': PERM.POSITION_READ,
  'position:create': PERM.POSITION_CREATE,
  'position:update': PERM.POSITION_UPDATE,
  'position:delete': PERM.POSITION_DELETE,
  'role:read': PERM.ROLE_READ,
  'role:create': PERM.ROLE_CREATE,
  'role:update': PERM.ROLE_UPDATE,
  'role:delete': PERM.ROLE_DELETE,
  'role:assign': PERM.ROLE_ASSIGN,
  'role:revoke': PERM.ROLE_REVOKE,
  'employee:read': PERM.EMPLOYEE_READ,
  'employee:create': PERM.EMPLOYEE_CREATE,
  'employee:update': PERM.EMPLOYEE_UPDATE,
  'employee:delete': PERM.EMPLOYEE_DELETE,
  'employee:leave': PERM.EMPLOYEE_LEAVE,
};

// 权限树结构（用于角色管理页面的权限选择器）
export const PERM_TREE = [
  {
    label: '任务管理',
    value: 'task',
    children: [
      { label: '查看', value: PERM.TASK_READ },
      { label: '创建', value: PERM.TASK_CREATE },
      { label: '更新', value: PERM.TASK_UPDATE },
      { label: '删除', value: PERM.TASK_DELETE },
      { label: '审批', value: PERM.TASK_APPROVE },
    ],
  },
  {
    label: '任务节点',
    value: 'tasknode',
    children: [
      { label: '查看', value: PERM.TASKNODE_READ },
      { label: '更新', value: PERM.TASKNODE_UPDATE },
      { label: '创建', value: PERM.TASKNODE_CREATE },
      { label: '删除', value: PERM.TASKNODE_DELETE },
    ],
  },
  {
    label: '交接管理',
    value: 'handover',
    children: [
      { label: '查看', value: PERM.HANDOVER_READ },
      { label: '创建', value: PERM.HANDOVER_CREATE },
      { label: '审批', value: PERM.HANDOVER_APPROVE },
      { label: '拒绝', value: PERM.HANDOVER_REJECT },
    ],
  },
  {
    label: '通知管理',
    value: 'notification',
    children: [
      { label: '查看', value: PERM.NOTIFICATION_READ },
      { label: '创建', value: PERM.NOTIFICATION_CREATE },
      { label: '删除', value: PERM.NOTIFICATION_DELETE },
    ],
  },
  {
    label: '公司管理',
    value: 'company',
    children: [
      { label: '查看', value: PERM.COMPANY_READ },
      { label: '创建', value: PERM.COMPANY_CREATE },
      { label: '更新', value: PERM.COMPANY_UPDATE },
      { label: '删除', value: PERM.COMPANY_DELETE },
    ],
  },
  {
    label: '部门管理',
    value: 'department',
    children: [
      { label: '查看', value: PERM.DEPARTMENT_READ },
      { label: '创建', value: PERM.DEPARTMENT_CREATE },
      { label: '更新', value: PERM.DEPARTMENT_UPDATE },
      { label: '删除', value: PERM.DEPARTMENT_DELETE },
    ],
  },
  {
    label: '职位管理',
    value: 'position',
    children: [
      { label: '查看', value: PERM.POSITION_READ },
      { label: '创建', value: PERM.POSITION_CREATE },
      { label: '更新', value: PERM.POSITION_UPDATE },
      { label: '删除', value: PERM.POSITION_DELETE },
    ],
  },
  {
    label: '角色管理',
    value: 'role',
    children: [
      { label: '查看', value: PERM.ROLE_READ },
      { label: '创建', value: PERM.ROLE_CREATE },
      { label: '更新', value: PERM.ROLE_UPDATE },
      { label: '删除', value: PERM.ROLE_DELETE },
      { label: '分配', value: PERM.ROLE_ASSIGN },
      { label: '撤销', value: PERM.ROLE_REVOKE },
    ],
  },
  {
    label: '员工管理',
    value: 'employee',
    children: [
      { label: '查看', value: PERM.EMPLOYEE_READ },
      { label: '创建', value: PERM.EMPLOYEE_CREATE },
      { label: '更新', value: PERM.EMPLOYEE_UPDATE },
      { label: '删除', value: PERM.EMPLOYEE_DELETE },
      { label: '离职', value: PERM.EMPLOYEE_LEAVE },
    ],
  },
];

// 检查权限（支持数字码或文本格式）
export function hasPermission(userPerms: (string | number)[], required: number | string): boolean {
  if (!userPerms || userPerms.length === 0) return false;
  
  // 全局通配
  if (userPerms.includes('*') || userPerms.includes('*:*') || userPerms.includes('*:') || 
      userPerms.includes('all') || userPerms.includes('admin:*') || userPerms.includes('super:*')) {
    return true;
  }

  // 数字权限直接匹配
  if (typeof required === 'number') {
    if (userPerms.includes(required)) return true;
  }

  // 文本权限映射后匹配
  if (typeof required === 'string') {
    const code = TEXT_TO_CODE[required.toLowerCase()];
    if (code && userPerms.includes(code)) return true;
    if (userPerms.includes(required)) return true;
  }

  // 模块通配（简化版，前端主要用于 UI 显示控制）
  const reqModule = typeof required === 'string' ? required.split(':')[0] : '';
  for (const p of userPerms) {
    if (typeof p === 'string' && p.endsWith(':*') && p.startsWith(reqModule + ':')) {
      return true;
    }
  }

  return false;
}














