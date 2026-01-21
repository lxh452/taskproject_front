import { Menus } from '@/types/menu';

export const menuData: Menus[] = [
    {
        id: '0',
        title: '工作台',
        index: '/dashboard',
        icon: 'Odometer',
    },
    {
        id: 'my_work',
        title: '我的工作',
        index: 'my_work',
        icon: 'User',
        children: [
            { id: 'my_tasks', pid: 'my_work', index: '/my-tasks', title: '我的任务' },
            { id: 'my_checklists', pid: 'my_work', index: '/my-checklists', title: '我的清单' },
            { id: 'my_attachments', pid: 'my_work', index: '/my-attachments', title: '我的附件' },
            { id: 'my_approvals', pid: 'my_work', index: '/my-approvals', title: '待我审批' },
        ],
    },
    {
        id: 'task',
        title: '任务管理',
        index: 'task',
        icon: 'Collection',
        children: [
            { id: 'task_list_page', pid: 'task', index: '/tasks', title: '全部任务' },
            { id: 'flow_designer', pid: 'task', index: '/flow-designer', title: '流程设计' },
        ],
    },
    {
        id: 'team',
        title: '团队管理',
        index: 'team',
        icon: 'UserFilled',
        children: [
            { id: 'employee_list', pid: 'team', index: '/employees', title: '员工列表' },
            { id: 'handover_list', pid: 'team', index: '/handovers', title: '审批记录' },
        ],
    },
    {
        id: 'org',
        icon: 'OfficeBuilding',
        index: 'org',
        title: '组织架构',
        children: [
            { id: 'department', pid: 'org', index: '/organization/departments', title: '部门管理' },
            { id: 'position', pid: 'org', index: '/organization/positions', title: '职位管理' },
            { id: 'role', pid: 'org', index: '/organization/roles', title: '角色管理' },
            { id: 'invites', pid: 'org', index: '/organization/invites', title: '邀请码管理' },
            { id: 'join_apps', pid: 'org', index: '/organization/join-applications', title: '加入申请' },
        ],
    },
    {
        id: 'reports',
        icon: 'DataAnalysis',
        index: '/reports',
        title: '统计报表',
    },
    {
        id: 'notify',
        icon: 'Bell',
        index: '/notifications',
        title: '通知中心',
    },
    {
        id: 'ucenter',
        icon: 'Setting',
        index: '/ucenter',
        title: '个人中心',
    },
];
