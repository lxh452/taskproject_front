import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { usePermissStore } from '../store/permiss';
import Home from '../views/home.vue';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/dashboard',
    },
    {
        path: '/',
        name: 'Home',
        component: Home,
        children: [
            {
                path: '/dashboard',
                name: 'dashboard',
                meta: {
                    title: '系统首页',
                    noAuth: true,
                },
                component: () => import(/* webpackChunkName: "dashboard" */ '../views/dashboard.vue'),
            },
            {
                path: '/flow-designer',
                name: 'flow-designer',
                meta: { title: '流程设计' },
                component: () => import('../views/flow/designer-vue.vue'),
            },
            {
                path: '/system-user',
                name: 'system-user',
                meta: {
                    title: '用户管理',
                    permiss: '11',
                },
                component: () => import(/* webpackChunkName: "system-user" */ '../views/system/user.vue'),
            },
            {
                path: '/system-role',
                name: 'system-role',
                meta: {
                    title: '角色管理',
                    permiss: '12',
                },
                component: () => import(/* webpackChunkName: "system-role" */ '../views/system/role.vue'),
            },
            {
                path: '/system-menu',
                name: 'system-menu',
                meta: {
                    title: '菜单管理',
                    permiss: '13',
                },
                component: () => import(/* webpackChunkName: "system-menu" */ '../views/system/menu.vue'),
            },
            {
                path: '/tasks',
                name: 'tasks',
                meta: { title: '任务管理' },
                component: () => import('../views/tasks/list.vue'),
            },
            {
                path: '/tasks/create',
                name: 'tasks-create',
                meta: { title: '创建任务' },
                component: () => import('../views/tasks/create.vue'),
            },
            {
                path: '/tasks/detail/:id',
                name: 'tasks-detail',
                meta: { title: '任务详情' },
                component: () => import('../views/tasks/detail.vue'),
            },
            {
                path: '/my-tasks',
                name: 'my-tasks',
                meta: { title: '我的任务' },
                component: () => import('../views/my-tasks/index.vue'),
            },
            {
                path: '/my-checklists',
                name: 'my-checklists',
                meta: { title: '我的清单' },
                component: () => import('../views/my-checklists/index.vue'),
            },
            {
                path: '/my-attachments',
                name: 'my-attachments',
                meta: { title: '我的附件' },
                component: () => import('../views/my-attachments/index.vue'),
            },
            {
                path: '/my-approvals',
                name: 'my-approvals',
                meta: { title: '待我审批' },
                component: () => import('../views/my-approvals/index.vue'),
            },
            {
                path: '/organization/invites',
                name: 'org-invites',
                meta: { title: '邀请码管理' },
                component: () => import('../views/org/invites.vue'),
            },
            {
                path: '/task-nodes/my',
                redirect: '/my-tasks',
            },
            {
                path: '/task-nodes/create',
                name: 'task-nodes-create',
                meta: { title: '创建任务节点' },
                component: () => import('../views/tasknodes/create.vue'),
            },
            {
                path: '/task-nodes/detail/:id',
                name: 'task-nodes-detail',
                meta: { title: '任务节点详情' },
                component: () => import('../views/tasknodes/detail.vue'),
            },
            {
                path: '/employees',
                name: 'employees',
                meta: { title: '员工管理' },
                component: () => import('../views/employees/list.vue'),
            },
            {
                path: '/handovers',
                name: 'handovers',
                meta: { title: '审批管理' },
                component: () => import('../views/handovers/list.vue'),
            },
            {
                path: '/handovers/create',
                name: 'handovers-create',
                meta: { title: '发起审批' },
                component: () => import('../views/handovers/create.vue'),
            },
            {
                path: '/handovers/detail/:id',
                name: 'handovers-detail',
                meta: { title: '审批详情' },
                component: () => import('../views/handovers/detail.vue'),
            },
            {
                path: '/organization/companies',
                redirect: '/organization/departments',
            },
            {
                path: '/organization/tree',
                redirect: '/dashboard',
            },
            {
                path: '/organization/departments',
                name: 'organization-departments',
                meta: { title: '部门管理' },
                component: () => import('../views/org/departments.vue'),
            },
            {
                path: '/organization/positions',
                name: 'organization-positions',
                meta: { title: '职位管理' },
                component: () => import('../views/org/positions/index.vue'),
            },
            {
                path: '/organization/roles',
                name: 'organization-roles',
                meta: { title: '角色管理' },
                component: () => import('../views/org/roles.vue'),
            },
            {
                path: '/organization/tree',
                name: 'organization-tree-old',
                redirect: '/dashboard',
            },
            {
                path: '/organization/join-applications',
                name: 'organization-join-applications',
                meta: { title: '加入申请' },
                component: () => import('../views/org/join-applications.vue'),
            },
            {
                path: '/notifications',
                name: 'notifications',
                meta: { title: '通知中心' },
                component: () => import('../views/notifications/list.vue'),
            },
            {
                path: '/reports',
                name: 'reports',
                meta: { title: '统计报表' },
                component: () => import('../views/reports/index.vue'),
            },
            {
                path: '/ucenter',
                name: 'ucenter',
                meta: {
                    title: '个人中心',
                },
                component: () => import(/* webpackChunkName: "ucenter" */ '../views/pages/ucenter.vue'),
            },
        ],
    },
    {
        path: '/login',
        meta: {
            title: '登录',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "login" */ '../views/pages/login.vue'),
    },
    {
        path: '/register',
        meta: {
            title: '注册',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "register" */ '../views/pages/register.vue'),
    },
    {
        path: '/join',
        meta: {
            title: '加入公司',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "join-via-invite" */ '../views/pages/JoinViaInvite.vue'),
    },
    {
        path: '/forgot-password',
        meta: {
            title: '忘记密码',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "forgot-password" */ '../views/pages/forgot-password.vue'),
    },
    {
        path: '/join-company',
        meta: {
            title: '加入或创建公司',
        },
        component: () => import(/* webpackChunkName: "join-company" */ '../views/pages/join-company.vue'),
    },
    {
        path: '/reset-pwd',
        meta: {
            title: '重置密码',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "reset-pwd" */ '../views/pages/reset-pwd.vue'),
    },
    {
        path: '/file/preview/:fileId',
        name: 'file-preview',
        meta: {
            title: '文件预览',
        },
        component: () => import('../views/file/preview.vue'),
    },
    {
        path: '/403',
        meta: {
            title: '没有权限',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "403" */ '../views/pages/403.vue'),
    },
    {
        path: '/404',
        meta: {
            title: '找不到页面',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "404" */ '../views/pages/404.vue'),
    },
    {
        path: '/500',
        meta: {
            title: '服务器错误',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "500" */ '../views/pages/500.vue'),
    },
    { path: '/:path(.*)', redirect: '/404' },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

// 防止快速重复导航
let isNavigating = false;
let navigationTimer: ReturnType<typeof setTimeout> | null = null;

router.beforeEach((to, from, next) => {
    // 防止快速重复导航
    if (isNavigating) {
        console.warn('导航进行中，请勿频繁点击');
        return;
    }
    
    isNavigating = true;
    if (navigationTimer) {
        clearTimeout(navigationTimer);
    }
    navigationTimer = setTimeout(() => {
        isNavigating = false;
    }, 500);
    
    NProgress.start();
    const token = localStorage.getItem('authToken');
    const permiss = usePermissStore();

    // 检查是否有token（优先检查token）
    if (!token && to.meta.noAuth !== true) {
        // 清除可能残留的数据
        localStorage.removeItem('authToken');
        localStorage.removeItem('vuems_name');
        localStorage.removeItem('user_permissions');
        next('/login');
        return;
    }
    
    // 如果有token但没有权限数据，尝试恢复权限
    if (token && permiss.key.length === 0) {
        const savedPermissions = localStorage.getItem('user_permissions');
        if (savedPermissions) {
            try {
                permiss.handleSet(JSON.parse(savedPermissions));
            } catch (e) {
                console.error('恢复权限失败:', e);
            }
        }
    }
    
    if (typeof to.meta.permiss == 'string' && !permiss.key.includes(to.meta.permiss)) {
        // 如果没有权限，则进入403
        next('/403');
    } else {
        next();
    }
});

router.afterEach(() => {
    NProgress.done();
});

export default router;