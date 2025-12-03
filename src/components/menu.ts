import { Menus } from '@/types/menu';

export const menuData: Menus[] = [
    {
        id: '0',
        title: '概览',
        index: '/dashboard',
        icon: 'Odometer',
    },
    {
        id: 'task',
        title: '任务管理',
        index: 'task',
        icon: 'Collection',
        children: [
            { id: 'task_overview', pid: 'task', index: '/tasks-overview', title: '任务概览' },
            { id: 'task_kanban', pid: 'task', index: '/tasks-kanban', title: '看板视图' },
            { id: 'task_list_page', pid: 'task', index: '/tasks', title: '任务列表' },
        ],
    },
    {
        id: 'tasknodes',
        title: '任务节点',
        index: 'tasknodes',
        icon: 'Rank',
        children: [
            { id: 'tasknodes_my', pid: 'tasknodes', index: '/task-nodes/my', title: '我创建的节点' },
            { id: 'flow_designer', pid: 'tasknodes', index: '/flow-designer', title: '流程设计器' },
        ],
    },
    {
        id: 'employee',
        title: '员工管理',
        index: 'employee',
        icon: 'User',
        children: [
            { id: 'employee_list', pid: 'employee', index: '/employees', title: '员工列表' },
            { id: 'my_nodes', pid: 'employee', index: '/task-nodes/my', title: '我的任务节点' }
        ],
    },
    {
        id: 'handover',
        title: '交接管理',
        index: 'handover',
        icon: 'Switch',
        children: [
            { id: 'handover_list', pid: 'handover', index: '/handovers', title: '交接列表' }
        ],
    },
    {
        id: 'org',
        icon: 'OfficeBuilding',
        index: 'org',
        title: '组织管理',
        children: [
            { id: 'company', pid: 'org', index: '/organization/companies', title: '公司管理' },
            { id: 'department', pid: 'org', index: '/organization/departments', title: '部门管理' },
            { id: 'position', pid: 'org', index: '/organization/positions', title: '职位管理' },
            { id: 'role', pid: 'org', index: '/organization/roles', title: '角色管理' },
        ],
    },
    {
        id: 'org_tree_global',
        title: '企业关系树',
        index: '/organization/tree',
        icon: 'Connection',
    },
    {
        id: 'notify',
        icon: 'Bell',
        index: '/notifications',
        title: '通知中心',
    },
];
