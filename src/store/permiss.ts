import { defineStore } from 'pinia';

interface ObjectList {
    [key: string]: string[];
}

export const usePermissStore = defineStore('permiss', {
    state: () => {
        const defaultList: ObjectList = {
            admin: [
                '0',
                'org_tree_global',
                '1',
                '11',
                '12',
                '13',
                '2',
                '21',
                '22',
                '23',
                '24',
                '25',
                '26',
                '27',
                '28',
                '29',
                '291',
                '292',
                '3',
                '31',
                '32',
                '33',
                '34',
                '4',
                '41',
                '42',
                '5',
                '7',
                // my work module - NEW
                'my_work', 'my_tasks', 'my_checklists', 'my_attachments', 'my_approvals',
                // task module
                'task', 'task_overview', 'task_kanban', 'task_list_page', 'task_gantt', 'task_timeline', 'task_upcoming',
                // tasknodes module (independent menu)
                'tasknodes','tasknodes_my','flow_designer','tasknodes_create','tasknodes_designer',
                // team module
                'team', 'handover', 'handover_list',
                'employee', 'employee_list', 'my_nodes',
                // org module
                'org', 'company', 'department', 'position', 'role', 'invites', 'join_apps', 'join_applications',
                // reports module - NEW
                'reports',
                // notification module
                'notify', 'settings',
                // user center - NEW
                'ucenter'
            ],
            user: ['0', 'org_tree_global', 'my_work', 'my_tasks', 'my_checklists', 'my_attachments', 'my_approvals', 'task', 'task_overview', 'task_kanban', 'task_list_page', 'task_gantt', 'task_timeline', 'task_upcoming', 'reports', 'notify', 'ucenter'],
        };
        // 初始化时使用默认权限，避免刷新时菜单变化
        // 权限会在登录后通过 applyPermissions 更新
        const username = localStorage.getItem('vuems_name');
        const savedPermissions = localStorage.getItem('user_permissions');
        
        let initialKey: string[];
        if (savedPermissions) {
            try {
                initialKey = JSON.parse(savedPermissions);
            } catch {
                initialKey = (username == 'admin' ? defaultList.admin : defaultList.user) as string[];
            }
        } else {
            initialKey = (username == 'admin' ? defaultList.admin : defaultList.user) as string[];
        }
        
        return {
            key: initialKey,
            defaultList,
        };
    },
    actions: {
        handleSet(val: string[]) {
            this.key = val;
            // 保存权限到 localStorage，避免刷新时丢失
            localStorage.setItem('user_permissions', JSON.stringify(val));
        },
        // 从后端权限映射到前端菜单/功能点key（支持 string 与 number）
        // 后端权限码定义：
        // 任务: 1-5, 任务节点: 10-13, 交接: 20-23, 通知: 30-32
        // 公司: 40-43, 部门: 45-48, 职位: 50-53, 角色: 60-65, 员工: 70-74
        applyPermissions(perms: (string|number)[]) {
            if (!perms || perms.length === 0) {
                console.warn('applyPermissions: 权限列表为空');
                return;
            }

            const result = new Set<string>(['0','org_tree_global','reports','ucenter']);

            const grantByCode = (code: number) => {
                // 任务模块 (1-5)
                if (code >= 1 && code <= 5) {
                    result.add('task'); 
                    result.add('task_overview');
                    result.add('task_list_page'); 
                    result.add('task_kanban');
                    result.add('task_gantt'); 
                    result.add('task_timeline'); 
                    result.add('task_upcoming');
                }
                // 任务节点模块 (10-13) - 映射到"我的工作"
                if (code >= 10 && code <= 13) {
                    result.add('my_work');
                    result.add('my_tasks');
                    result.add('my_checklists');
                    result.add('my_attachments');
                    result.add('tasknodes'); 
                    result.add('tasknodes_my'); 
                    result.add('tasknodes_create'); 
                    result.add('tasknodes_designer');
                    result.add('flow_designer');
                }
                // 交接模块 (20-23) - 映射到"待我审批"和"团队管理"
                if (code >= 20 && code <= 23) {
                    result.add('my_work');
                    result.add('my_approvals');
                    result.add('team');
                    result.add('handover'); 
                    result.add('handover_list'); 
                }
                // 通知模块 (30-32)
                if (code >= 30 && code <= 32) { 
                    result.add('notify'); 
                }
                // 公司模块 (40-43)
                if (code >= 40 && code <= 43) { 
                    result.add('org'); 
                    result.add('company'); 
                }
                // 部门模块 (45-48)
                if (code >= 45 && code <= 48) { 
                    result.add('org'); 
                    result.add('department'); 
                }
                // 职位模块 (50-53)
                if (code >= 50 && code <= 53) { 
                    result.add('org'); 
                    result.add('position'); 
                }
                // 角色模块 (60-65)
                if (code >= 60 && code <= 65) { 
                    result.add('org'); 
                    result.add('role'); 
                }
                // 员工模块 (70-74) - 包含邀请码和加入申请
                if (code >= 70 && code <= 74) {
                    result.add('team');
                    result.add('employee'); 
                    result.add('employee_list'); 
                    result.add('my_nodes');
                    result.add('org');
                    result.add('invites');
                    result.add('join_apps');
                    result.add('join_applications');
                }
            };

            const grantByText = (p: string) => {
                if (p === 'task:*') { 
                    ['task','task_overview','task_list_page','task_kanban','task_gantt','task_timeline','task_upcoming'].forEach(x=>result.add(x)); 
                }
                if (p === 'task:read') { 
                    ['task','task_overview','task_list_page','task_kanban','task_gantt','task_timeline'].forEach(x=>result.add(x)); 
                }
                if (p.startsWith('tasknode')) {
                    ['my_work','my_tasks','my_checklists','my_attachments','tasknodes','tasknodes_my','tasknodes_create','tasknodes_designer','flow_designer'].forEach(x=>result.add(x)); 
                }
                if (p.startsWith('handover')) {
                    ['my_work','my_approvals','team','handover','handover_list'].forEach(x=>result.add(x)); 
                }
                if (p.startsWith('notification')) { 
                    result.add('notify'); 
                }
                if (p.startsWith('org:') || p === 'org:*') {
                    ['org','company','department','position','role','invites','join_apps','join_applications'].forEach(x=>result.add(x)); 
                }
                if (p.startsWith('report')) {
                    result.add('reports');
                }
                if (p === 'ucenter' || p === 'user:profile') {
                    result.add('ucenter');
                }
            };

            // 如果权限数量很多，可能是超管，直接给全部权限
            if (perms && perms.length >= 30) { 
                this.key = this.defaultList['admin'];
                localStorage.setItem('user_permissions', JSON.stringify(this.key));
                console.log('检测到超管权限，应用全部权限');
                return;
            }
            
            // 处理每个权限
            perms.forEach(p => {
                if (typeof p === 'number') {
                    grantByCode(p);
                } else {
                    // 尝试将字符串转换为数字
                    const num = parseInt(String(p), 10);
                    if (!isNaN(num)) {
                        grantByCode(num);
                    } else {
                        grantByText(String(p));
                    }
                }
            });
            
            this.key = Array.from(result);
            localStorage.setItem('user_permissions', JSON.stringify(this.key));
            console.log('应用权限完成，菜单权限:', this.key);
        }
    },
});