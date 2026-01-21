<template>
    <div class="org-tree-page">
        <!-- 顶部工具栏 -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-left">
                    <h1 class="page-title">企业关系树</h1>
                    <p class="page-subtitle">Enterprise Relationship Map</p>
                </div>
                <div class="header-actions">
                    <el-input
                        v-model="searchKeyword"
                        placeholder="搜索组织架构..."
                        clearable
                        class="search-input"
                        :prefix-icon="Search"
                        @input="handleSearch"
                    />
                    <el-button :icon="Refresh" circle @click="loadTree" />
                </div>
            </div>
        </div>

        <!-- 主内容区域：左右分栏 -->
        <div class="main-content" v-loading="loading">
            <!-- 左侧：组织层级树 -->
            <div class="tree-panel">
                <div class="tree-columns">
                    <!-- 公司列 -->
                    <div class="tree-column">
                        <div class="column-header">
                            <span class="column-title">ORGANIZATION</span>
                        </div>
                        <div class="column-content">
                            <div
                                v-for="company in filteredTree"
                                :key="company.id"
                                :class="['org-card', { active: selectedNode?.id === company.id && selectedNode?.type === 'company' }]"
                                @click="selectNode(company)"
                            >
                                <div class="card-icon company-icon">
                                    <el-icon><OfficeBuilding /></el-icon>
                                </div>
                                <div class="card-content">
                                    <div class="card-title">{{ company.name }}</div>
                                    <div class="card-subtitle">Headquarters</div>
                                </div>
                                <div class="card-indicators">
                                    <span class="indicator-dot" v-if="company.stats"></span>
                                    <span class="card-arrow">→</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 部门列 -->
                    <div class="tree-column">
                        <div class="column-header">
                            <span class="column-title">DEPARTMENTS</span>
                        </div>
                        <div class="column-content">
                            <div
                                v-for="dept in visibleDepartments"
                                :key="dept.id"
                                :class="['org-card', { active: selectedDepartment?.id === dept.id }]"
                                @click="selectNode(dept)"
                            >
                                <div class="card-icon dept-icon">
                                    <el-icon><Folder /></el-icon>
                                </div>
                                <div class="card-content">
                                    <div class="card-title">{{ dept.name }}</div>
                                    <div class="card-subtitle">{{ dept.stats }}</div>
                                </div>
                                <div class="card-indicators">
                                    <span class="indicator-dot" v-if="dept.children && dept.children.length > 0"></span>
                                    <span class="card-arrow">→</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 员工列 -->
                    <div class="tree-column">
                        <div class="column-header">
                            <span class="column-title">EMPLOYEES</span>
                        </div>
                        <div class="column-content">
                            <div
                                v-for="emp in visibleEmployees"
                                :key="emp.id"
                                :class="['org-card', 'employee-card', { active: selectedNode?.id === emp.id && selectedNode?.type === 'emp' }]"
                                @click="selectNode(emp)"
                                @mouseenter="handleEmployeeHover(emp, $event)"
                                @mouseleave="handleNodeLeave"
                            >
                                <div class="card-icon emp-icon">
                                    <el-icon><User /></el-icon>
                                </div>
                                <div class="card-content">
                                    <div class="card-title">{{ emp.name }}</div>
                                    <div class="card-subtitle">{{ emp.position || '员工' }}</div>
                                </div>
                                <div class="card-indicators">
                                    <span class="card-arrow">→</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧：详情面板 -->
            <div class="detail-panel">
                <div v-if="selectedNode" class="detail-content">
                    <!-- 详情头部 -->
                    <div class="detail-header">
                        <div class="detail-avatar">
                            <span class="avatar-letter">{{ getNodeInitial(selectedNode) }}</span>
                        </div>
                        <div class="detail-title-section">
                            <h2 class="detail-title">{{ selectedNode.name }}</h2>
                            <div class="detail-subtitle">
                                <el-icon class="detail-icon">
                                    <component :is="getNodeIcon(selectedNode.type)" />
                                </el-icon>
                                <span>{{ getNodeTypeLabel(selectedNode.type) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 统计信息 -->
                    <div class="detail-stats" v-if="selectedNode.type === 'dept' || selectedNode.type === 'emp'">
                        <div class="stat-box">
                            <div class="stat-value">{{ getStatValue('total') }}</div>
                            <div class="stat-label">TOTAL</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value stat-done">{{ getStatValue('done') }}</div>
                            <div class="stat-label">DONE</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value stat-late">{{ getStatValue('late') }}</div>
                            <div class="stat-label">LATE</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value stat-rate">{{ getStatValue('rate') }}%</div>
                            <div class="stat-label">RATE</div>
                        </div>
                    </div>

                    <!-- 任务列表 -->
                    <div class="detail-tasks" v-if="selectedNodeTasks.length > 0">
                        <div class="tasks-header">
                            <span class="tasks-title">ASSIGNED TASKS</span>
                            <span class="tasks-count">({{ selectedNodeTasks.length }} items)</span>
                        </div>
                        <div class="tasks-list">
                            <div
                                v-for="task in selectedNodeTasks"
                                :key="task.id"
                                :class="['task-item', getTaskStatusClass(task.status, task.deadline)]"
                            >
                                <div class="task-name">{{ task.title }}</div>
                                <div class="task-meta">
                                    <el-tag :type="getTaskStatusType(task.status, task.deadline)" size="small" effect="dark">
                                        {{ getTaskStatusText(task.status, task.deadline) }}
                                    </el-tag>
                                    <span class="task-date">
                                        <el-icon class="date-icon"><Calendar /></el-icon>
                                        {{ formatDate(task.deadline) }}
                                    </span>
                                    <span class="task-progress">{{ task.progress || 0 }}% Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 空状态 -->
                    <div class="detail-empty" v-else>
                        <el-icon class="empty-icon"><Document /></el-icon>
                        <div class="empty-text">暂无任务信息</div>
                    </div>
                </div>

                <!-- 未选择状态 -->
                <div v-else class="detail-placeholder">
                    <el-icon class="placeholder-icon"><User /></el-icon>
                    <div class="placeholder-text">请选择组织节点查看详情</div>
                </div>
            </div>
        </div>

        <!-- 员工悬停卡片 -->
        <transition name="fade-scale">
            <div
                v-if="hoverCard.visible"
                class="employee-hover-card"
                :style="{ left: hoverCard.x + 'px', top: hoverCard.y + 'px' }"
                @mouseenter="keepCardVisible"
                @mouseleave="handleNodeLeave"
            >
                <div class="hover-card-header">
                    <el-avatar :size="48" :src="hoverCard.data.avatar">
                        {{ hoverCard.data.name?.[0] || 'U' }}
                    </el-avatar>
                    <div class="hover-card-info">
                        <div class="hover-card-name">{{ hoverCard.data.name }}</div>
                        <div class="hover-card-position">{{ hoverCard.data.position || '未设置' }}</div>
                    </div>
                </div>
                <div class="hover-card-stats" v-if="hoverCard.data.taskStats">
                    <div class="hover-stat">
                        <span class="hover-stat-value">{{ hoverCard.data.taskStats.total }}</span>
                        <span class="hover-stat-label">任务</span>
                    </div>
                    <div class="hover-stat">
                        <span class="hover-stat-value">{{ hoverCard.data.taskStats.completed }}</span>
                        <span class="hover-stat-label">完成</span>
                    </div>
                    <div class="hover-stat">
                        <span class="hover-stat-value">{{ hoverCard.data.taskStats.inProgress }}</span>
                        <span class="hover-stat-label">进行中</span>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, Refresh, OfficeBuilding, Folder, User, Calendar, Document } from '@element-plus/icons-vue';
import { getMyEmployee, listDepartments, listEmployees, getMyTaskNodes, listTasks } from '@/api';
import { ElMessage } from 'element-plus';

type Node = {
    id: string;
    name: string;
    label: string;
    tag?: string;
    type?: 'company' | 'dept' | 'emp';
    position?: string;
    stats?: string;
    employeeId?: string;
    department?: string;
    children?: Node[];
};

const tree = ref<Node[]>([]);
const loading = ref(false);
const searchKeyword = ref('');
const selectedNode = ref<Node | null>(null);
const selectedDepartment = ref<Node | null>(null); // 独立跟踪选中的部门
const selectedNodeTasks = ref<any[]>([]);
const departments = ref<{ id: string; name: string }[]>([]);
const employeesByDept = ref<Record<string, any[]>>({});
const allEmployees = ref<Record<string, any>>({});
const allEmployeesList = ref<any[]>([]);

const hoverCard = ref({
    visible: false,
    x: 0,
    y: 0,
    data: {} as any,
});

let hoverTimer: any = null;

// 过滤树
const filteredTree = computed(() => {
    if (!searchKeyword.value) return tree.value;
    const keyword = searchKeyword.value.toLowerCase();
    return tree.value.filter(node =>
        node.name?.toLowerCase().includes(keyword) ||
        node.label?.toLowerCase().includes(keyword)
    );
});

// 可见部门：如果选择了公司，显示其部门；否则显示所有部门
const visibleDepartments = computed(() => {
    if (!filteredTree.value.length) return [];
    
    if (selectedNode.value?.type === 'company') {
        return selectedNode.value.children || [];
    }
    
    // 未选择公司时，显示所有部门
    const allDepts: Node[] = [];
    filteredTree.value.forEach(company => {
        if (company.children) {
            allDepts.push(...company.children);
        }
    });
    return allDepts;
});

// 可见员工：如果选择了部门，显示该部门员工；否则显示所有员工
const visibleEmployees = computed(() => {
    // 如果有选中的部门，始终显示该部门的员工（即使后续点击了员工卡片）
    if (selectedDepartment.value) {
        return selectedDepartment.value.children || [];
    }
    
    // 未选择部门时，显示全部员工
    if (allEmployeesList.value.length > 0) {
        return allEmployeesList.value.map(emp => ({
            id: emp.id,
            name: emp.name,
            label: emp.name,
            type: 'emp' as const,
            position: emp.position,
            employeeId: emp.employeeId,
        }));
    }
    
    // 如果没有全部员工列表，从树中收集
    const allEmps: Node[] = [];
    filteredTree.value.forEach(company => {
        company.children?.forEach(dept => {
            if (dept.children) {
                allEmps.push(...dept.children);
            }
        });
    });
    return allEmps;
});

function getNodeInitial(node: Node): string {
    return node.name?.[0]?.toUpperCase() || '?';
}

function getNodeIcon(type?: string) {
    if (type === 'company') return OfficeBuilding;
    if (type === 'dept') return Folder;
    return User;
}

function getNodeTypeLabel(type?: string): string {
    if (type === 'company') return 'Company';
    if (type === 'dept') return 'Department';
    return 'Employee';
}

function getStatValue(key: string): number {
    if (!selectedNode.value) return 0;
    
    if (key === 'total') {
        return selectedNodeTasks.value.length;
    } else if (key === 'done') {
        return selectedNodeTasks.value.filter(t => t.status === 2 || t.progress >= 100).length;
    } else if (key === 'late') {
        const now = Date.now();
        return selectedNodeTasks.value.filter(t => {
            if (!t.deadline) return false;
            const deadline = new Date(t.deadline).getTime();
            return deadline < now && (t.status !== 2 && t.progress < 100);
        }).length;
    } else if (key === 'rate') {
        if (selectedNodeTasks.value.length === 0) return 0;
        const total = selectedNodeTasks.value.reduce((sum, t) => sum + (t.progress || 0), 0);
        return Math.round(total / selectedNodeTasks.value.length);
    }
    return 0;
}

function getTaskStatusClass(status: number, deadline?: string): string {
    if (status === 2) return 'task-done';
    if (deadline) {
        const now = Date.now();
        const deadlineTime = new Date(deadline).getTime();
        if (deadlineTime < now && status !== 2) return 'task-late';
    }
    return 'task-pending';
}

function getTaskStatusType(status: number, deadline?: string): string {
    if (status === 2) return 'success';
    if (deadline) {
        const now = Date.now();
        const deadlineTime = new Date(deadline).getTime();
        if (deadlineTime < now && status !== 2) return 'danger';
    }
    return 'info';
}

function getTaskStatusText(status: number, deadline?: string): string {
    if (status === 2) return 'DONE';
    if (deadline) {
        const now = Date.now();
        const deadlineTime = new Date(deadline).getTime();
        if (deadlineTime < now && status !== 2) return 'OVERDUE';
    }
    return 'PENDING';
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    } catch {
        return dateStr;
    }
}

async function selectNode(node: Node) {
    selectedNode.value = node;
    selectedNodeTasks.value = [];
    
    // 如果选择的是部门，更新选中的部门
    if (node.type === 'dept') {
        selectedDepartment.value = node;
    } else if (node.type === 'company') {
        // 选择公司时，清除部门选择
        selectedDepartment.value = null;
    }
    // 选择员工时，不改变selectedDepartment，保持部门员工列表
    
    // 加载节点相关任务
    if (node.type === 'emp') {
        await loadEmployeeTasks(node.employeeId || node.id);
    } else if (node.type === 'dept') {
        await loadDepartmentTasks(node.id);
    }
}

async function loadEmployeeTasks(employeeId: string) {
    try {
        const resp = await listTasks({ page: 1, pageSize: 100, responsibleEmployeeIds: [employeeId] });
        if (resp.data?.code === 200) {
            const taskList = resp.data?.data?.list || [];
            selectedNodeTasks.value = taskList.map((t: any) => ({
                id: t.taskId || t.id,
                title: t.taskTitle || t.title || '未命名任务',
                status: t.taskStatus || t.status || 0,
                progress: t.progress || t.Progress || 0,
                deadline: t.deadline || t.endTime,
            }));
        }
    } catch (error: any) {
        console.error('加载员工任务失败:', error);
    }
}

async function loadDepartmentTasks(deptId: string) {
    try {
        // 获取部门下所有员工的任务
        const deptEmployees = employeesByDept.value[deptId] || [];
        const allTasks: any[] = [];
        
        for (const emp of deptEmployees) {
            const resp = await listTasks({ page: 1, pageSize: 100, responsibleEmployeeIds: [emp.id] });
            if (resp.data?.code === 200) {
                const taskList = resp.data?.data?.list || [];
                allTasks.push(...taskList);
            }
        }
        
        // 去重
        const taskMap = new Map();
        allTasks.forEach(t => {
            const taskId = t.taskId || t.id;
            if (!taskMap.has(taskId)) {
                taskMap.set(taskId, {
                    id: taskId,
                    title: t.taskTitle || t.title || '未命名任务',
                    status: t.taskStatus || t.status || 0,
                    progress: t.progress || t.Progress || 0,
                    deadline: t.deadline || t.endTime,
                });
            }
        });
        
        selectedNodeTasks.value = Array.from(taskMap.values());
    } catch (error: any) {
        console.error('加载部门任务失败:', error);
    }
}

function handleSearch() {
    // 搜索时清除选择
    if (searchKeyword.value) {
        selectedNode.value = null;
        selectedNodeTasks.value = [];
    }
}

async function handleEmployeeHover(emp: Node, event: MouseEvent) {
    if (hoverTimer) clearTimeout(hoverTimer);
    
    hoverTimer = setTimeout(async () => {
        const employeeId = emp.employeeId || emp.id;
        const employee = allEmployees.value[employeeId];
        if (!employee) return;
        
        let taskStats = { total: 0, completed: 0, inProgress: 0 };
        
        try {
            const resp = await listTasks({ page: 1, pageSize: 100, responsibleEmployeeIds: [employeeId] });
            if (resp.data?.code === 200) {
                const taskList = resp.data?.data?.list || [];
                taskStats.total = taskList.length;
                taskStats.completed = taskList.filter((t: any) => t.status === 2 || t.progress >= 100).length;
                taskStats.inProgress = taskList.filter((t: any) => t.status === 1 && t.progress < 100).length;
            }
        } catch (error: any) {
            console.error('加载员工信息失败:', error);
        }
        
        hoverCard.value = {
            visible: true,
            x: event.clientX + 15,
            y: event.clientY + 15,
            data: {
                name: employee.name,
                position: employee.position,
                avatar: employee.avatar || '',
                taskStats,
            },
        };
    }, 300);
}

function keepCardVisible() {
    if (hoverTimer) clearTimeout(hoverTimer);
}

function handleNodeLeave() {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
        hoverCard.value.visible = false;
    }, 200);
}

async function loadTree() {
    loading.value = true;
    try {
        const me = await getMyEmployee();
        const emp = me?.data?.data || {};
        const companyId = emp.companyId || emp.CompanyId || '';
        const companyName = emp.companyName || emp.CompanyName || '所属公司';
        
        if (!companyId) {
            ElMessage.warning('当前员工未绑定公司');
            tree.value = [];
            return;
        }
        
        const [dRes, eRes] = await Promise.all([
            listDepartments({ page: 1, pageSize: 100, companyId }),
            listEmployees({ page: 1, pageSize: 100, companyId }),
        ]);
        
        const deptList = (dRes.data?.data?.list || []).map((d: any) => ({
            id: d.id || d.Id,
            name: d.departmentName || d.DepartmentName,
        }));
        departments.value = deptList;
        
        const empList = (eRes.data?.data?.list || []).map((e: any) => {
            const empId = e.id || e.employeeId || e.EmployeeId;
            const empData = {
                id: empId,
                name: e.realName || e.name || '未知',
                departmentId: e.departmentId || e.DepartmentId,
                position: e.positionName || e.PositionName,
                isMgmt: (e.isManagement ?? e.IsManagement) === 1 || String(e.positionName || e.PositionName || '').includes('经理'),
                avatar: e.avatar || '',
                employeeId: empId,
                departmentName: deptList.find(d => d.id === e.departmentId || d.id === e.DepartmentId)?.name || '',
            };
            allEmployees.value[empId] = empData;
            return empData;
        });
        
        // 保存全部员工列表
        allEmployeesList.value = empList;
        
        const map: Record<string, any[]> = {};
        empList.forEach((e) => {
            const key = String(e.departmentId || '');
            if (!map[key]) map[key] = [];
            map[key].push(e);
        });
        
        Object.keys(map).forEach((k) => {
            map[k].sort((a, b) => Number(!!b.isMgmt) - Number(!!a.isMgmt));
        });
        employeesByDept.value = map;
        
        const deptNodes = deptList.map((d) => {
            const employees = (employeesByDept.value[String(d.id)] || []);
            return {
                id: d.id,
                name: d.name,
                label: d.name,
                tag: '部门',
                type: 'dept' as const,
                stats: `${employees.length} 人`,
                children: employees.map((e) => ({
                    id: e.id,
                    name: e.name,
                    label: e.name,
                    tag: e.isMgmt ? '部门管理人' : '员工',
                    type: 'emp' as const,
                    position: e.position,
                    deptId: d.id,
                    employeeId: e.employeeId,
                })),
            };
        });
        
        tree.value = [{
            id: companyId,
            name: companyName,
            label: companyName,
            tag: '公司',
            type: 'company' as const,
            stats: `${deptList.length} 个部门，${empList.length} 人`,
            children: deptNodes,
        }];
    } catch (error: any) {
        console.error('加载组织架构失败:', error);
        ElMessage.error('加载组织架构失败');
        tree.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadTree();
});
</script>

<style scoped>
/* 使用全局主题色变量 */
.org-tree-page {
    --page-primary: var(--color-primary, #4A90D9);
    --page-primary-rgb: var(--color-primary-rgb, 74, 144, 217);
    --page-primary-light: var(--color-primary-light, #E8F4FD);
    
    padding: 28px;
    min-height: calc(100vh - 100px);
    background: var(--bg-page);
}

/* 页面头部 */
.page-header {
    margin-bottom: 28px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.8);
}

.header-left {
    flex: 1;
}

.page-title {
    font-size: 26px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
}

.page-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
    font-weight: 500;
}

.header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
}

.search-input {
    width: 300px;
}

.search-input :deep(.el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.06);
    padding: 4px 16px;
    transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-input :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 4px 16px rgba(var(--page-primary-rgb), 0.15);
    border-color: rgba(var(--page-primary-rgb), 0.3);
}

/* 主内容区域 */
.main-content {
    display: flex;
    gap: 24px;
    height: calc(100vh - 200px);
}

/* 左侧树形面板 */
.tree-panel {
    flex: 1;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.8);
    padding: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.tree-columns {
    display: flex;
    gap: 24px;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
}

.tree-column {
    flex: 1;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(0, 0, 0, 0.06);
    padding-right: 24px;
}

.tree-column:last-child {
    border-right: none;
    padding-right: 0;
}

.column-header {
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 2px solid rgba(var(--page-primary-rgb), 0.1);
}

.column-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--page-primary);
    letter-spacing: 1.5px;
    text-transform: uppercase;
}

.column-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
}

.column-content::-webkit-scrollbar {
    width: 5px;
}

.column-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.02);
    border-radius: 10px;
}

.column-content::-webkit-scrollbar-thumb {
    background: rgba(var(--page-primary-rgb), 0.2);
    border-radius: 10px;
}

.column-content::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--page-primary-rgb), 0.4);
}

/* 组织卡片 */
.org-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    margin-bottom: 12px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.04);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    position: relative;
    overflow: hidden;
}

.org-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-primary-light);
    opacity: 0;
    transition: opacity 0.2s ease;
}

.org-card:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 8px 24px rgba(var(--page-primary-rgb), 0.12);
    border-color: rgba(var(--page-primary-rgb), 0.2);
}

.org-card:hover::before {
    opacity: 1;
}

.org-card.active {
    background: var(--color-primary);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 16px rgba(var(--page-primary-rgb), 0.25);
    transform: translateY(-2px);
}

.org-card.active::before {
    display: none;
}

.org-card.active .card-title,
.org-card.active .card-subtitle {
    color: white;
}

.org-card.active .card-icon {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.card-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: var(--color-primary-light);
    color: var(--page-primary);
    border-radius: 12px;
    flex-shrink: 0;
    transition: all 0.2s ease;
    position: relative;
    z-index: 1;
}

.card-icon.company-icon {
    background: #7C3AED;
    color: white;
}

.card-icon.dept-icon {
    background: #EC4899;
    color: white;
}

.card-icon.emp-icon {
    background: #0284C7;
    color: white;
}

.org-card:hover .card-icon {
    transform: scale(1.08) rotate(3deg);
}

.card-content {
    flex: 1;
    min-width: 0;
    position: relative;
    z-index: 1;
}

.card-title {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s ease;
}

.card-subtitle {
    font-size: 12px;
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s ease;
}

.card-indicators {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
}

.indicator-dot {
    width: 8px;
    height: 8px;
    background: var(--color-warning);
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(217, 119, 6, 0.3);
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
}

.card-arrow {
    font-size: 16px;
    color: #94a3b8;
    transition: all 0.3s ease;
}

.org-card:hover .card-arrow {
    transform: translateX(4px);
    color: var(--page-primary);
}

.org-card.active .card-arrow {
    color: white;
}

.employee-card {
    border-left: 3px solid #f43f5e;
}

.employee-card:hover {
    border-left-color: #f43f5e;
}

/* 右侧详情面板 */
.detail-panel {
    width: 400px;
    background: var(--bg-card);
    border-radius: 24px;
    box-shadow: var(--shadow-lg);
    padding: 28px;
    overflow-y: auto;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.detail-panel::-webkit-scrollbar {
    width: 5px;
}

.detail-panel::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}

.detail-panel::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 10px;
}

.detail-panel::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
}

.detail-content {
    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(16px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.detail-header {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-avatar {
    width: 64px;
    height: 64px;
    background: var(--color-primary);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(var(--page-primary-rgb), 0.2);
}

.detail-title-section {
    flex: 1;
    min-width: 0;
}

.detail-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin: 0 0 6px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.detail-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
}

.detail-icon {
    font-size: 16px;
}

.detail-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-bottom: 28px;
}

.stat-box {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 18px;
    text-align: center;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.stat-box:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
}

.stat-done {
    color: #4ade80;
}

.stat-late {
    color: #f87171;
}

.stat-rate {
    color: #60a5fa;
}

.stat-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
}

.detail-tasks {
    margin-top: 24px;
}

.tasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tasks-title {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 1.5px;
}

.tasks-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
}

.tasks-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.task-item {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(6px);
    border-color: rgba(var(--page-primary-rgb), 0.3);
}

.task-name {
    font-size: 14px;
    font-weight: 600;
    color: white;
    margin-bottom: 12px;
}

.task-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
}

.task-date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
}

.date-icon {
    font-size: 14px;
}

.task-progress {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    margin-left: auto;
}

.detail-empty,
.detail-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 280px;
    text-align: center;
}

.empty-icon,
.placeholder-icon {
    font-size: 48px;
    margin-bottom: 18px;
    opacity: 0.4;
}

.empty-text,
.placeholder-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
}

/* 员工悬停卡片 */
.employee-hover-card {
    position: fixed;
    width: 280px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.8);
    animation: cardAppear 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes cardAppear {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(-8px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.hover-card-header {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 18px;
    background: var(--color-primary);
    color: white;
}

.hover-card-info {
    flex: 1;
    min-width: 0;
}

.hover-card-name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
}

.hover-card-position {
    font-size: 13px;
    opacity: 0.85;
}

.hover-card-stats {
    display: flex;
    gap: 8px;
    padding: 16px;
    background: #f8fafc;
}

.hover-stat {
    flex: 1;
    text-align: center;
    padding: 10px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.hover-stat-value {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 4px;
}

.hover-stat-label {
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* 过渡动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
}

/* ========== 移动端适配 ========== */

/* 平板适配 (768px - 1024px) */
@media (max-width: 1024px) {
    .org-tree-page {
        padding: 20px;
    }

    .header-content {
        flex-direction: column;
        gap: 16px;
        padding: 20px;
    }

    .header-left {
        text-align: center;
    }

    .header-actions {
        width: 100%;
        justify-content: center;
    }

    .search-input {
        width: 100%;
        max-width: 400px;
    }

    .main-content {
        flex-direction: column;
        height: auto;
    }

    .tree-panel {
        padding: 16px;
    }

    .tree-columns {
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .tree-column {
        min-width: 100%;
        border-right: none;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        padding-right: 0;
        padding-bottom: 16px;
    }

    .tree-column:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }

    .column-content {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 8px;
    }

    .org-card {
        min-width: 200px;
        flex: 0 0 auto;
    }

    .detail-panel {
        width: 100%;
        max-height: 500px;
        padding: 20px;
    }
}

/* 手机适配 (< 768px) */
@media (max-width: 768px) {
    .org-tree-page {
        padding: 12px;
        min-height: auto;
    }

    .page-header {
        margin-bottom: 16px;
    }

    .header-content {
        padding: 16px;
        border-radius: 16px;
    }

    .page-title {
        font-size: 20px;
    }

    .page-subtitle {
        font-size: 12px;
    }

    .header-actions {
        flex-direction: column;
        gap: 10px;
    }

    .search-input {
        width: 100%;
    }

    .main-content {
        gap: 16px;
    }

    .tree-panel {
        padding: 12px;
        border-radius: 16px;
    }

    .tree-columns {
        gap: 12px;
    }

    .column-header {
        margin-bottom: 12px;
        padding-bottom: 10px;
    }

    .column-title {
        font-size: 10px;
    }

    .column-content {
        flex-direction: row;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 8px;
        padding-right: 0;
        -webkit-overflow-scrolling: touch;
    }

    .org-card {
        min-width: 160px;
        padding: 12px;
        margin-bottom: 0;
        border-radius: 12px;
    }

    .card-icon {
        width: 36px;
        height: 36px;
        font-size: 16px;
        border-radius: 10px;
    }

    .card-title {
        font-size: 13px;
    }

    .card-subtitle {
        font-size: 11px;
    }

    .card-arrow {
        font-size: 14px;
    }

    .detail-panel {
        padding: 16px;
        border-radius: 16px;
        max-height: none;
    }

    .detail-header {
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 16px;
    }

    .detail-avatar {
        width: 52px;
        height: 52px;
        font-size: 22px;
        border-radius: 14px;
    }

    .detail-title {
        font-size: 18px;
    }

    .detail-subtitle {
        font-size: 12px;
    }

    .detail-stats {
        gap: 10px;
        margin-bottom: 20px;
    }

    .stat-box {
        padding: 14px;
        border-radius: 12px;
    }

    .stat-value {
        font-size: 22px;
    }

    .stat-label {
        font-size: 10px;
    }

    .tasks-header {
        margin-bottom: 14px;
        padding-bottom: 10px;
    }

    .tasks-title {
        font-size: 11px;
    }

    .tasks-list {
        gap: 10px;
    }

    .task-item {
        padding: 12px;
        border-radius: 12px;
    }

    .task-name {
        font-size: 13px;
        margin-bottom: 10px;
    }

    .task-meta {
        gap: 8px;
    }

    .task-date {
        font-size: 11px;
    }

    .task-progress {
        font-size: 11px;
    }

    /* 隐藏悬停卡片在手机上 */
    .employee-hover-card {
        display: none;
    }
}

/* 超小屏幕适配 (< 480px) */
@media (max-width: 480px) {
    .org-tree-page {
        padding: 8px;
    }

    .header-content {
        padding: 12px;
    }

    .page-title {
        font-size: 18px;
    }

    .page-subtitle {
        font-size: 11px;
    }

    .tree-panel {
        padding: 10px;
    }

    .column-header {
        margin-bottom: 10px;
        padding-bottom: 8px;
    }

    .org-card {
        min-width: 140px;
        padding: 10px;
        gap: 10px;
    }

    .card-icon {
        width: 32px;
        height: 32px;
        font-size: 14px;
        border-radius: 8px;
    }

    .card-title {
        font-size: 12px;
    }

    .card-subtitle {
        font-size: 10px;
    }

    .detail-panel {
        padding: 12px;
    }

    .detail-header {
        gap: 10px;
        margin-bottom: 16px;
        padding-bottom: 12px;
    }

    .detail-avatar {
        width: 44px;
        height: 44px;
        font-size: 18px;
        border-radius: 12px;
    }

    .detail-title {
        font-size: 16px;
    }

    .detail-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .stat-box {
        padding: 10px;
    }

    .stat-value {
        font-size: 18px;
    }

    .stat-label {
        font-size: 9px;
    }

    .task-item {
        padding: 10px;
    }

    .task-name {
        font-size: 12px;
    }

    .empty-icon,
    .placeholder-icon {
        font-size: 36px;
    }

    .empty-text,
    .placeholder-text {
        font-size: 13px;
    }
}

/* 横屏手机适配 */
@media (max-width: 768px) and (orientation: landscape) {
    .main-content {
        flex-direction: row;
        height: calc(100vh - 140px);
    }

    .tree-panel {
        flex: 1;
        max-width: 60%;
    }

    .tree-columns {
        flex-direction: row;
        overflow-x: auto;
    }

    .tree-column {
        min-width: 180px;
        border-right: 1px solid rgba(0, 0, 0, 0.06);
        border-bottom: none;
        padding-right: 12px;
        padding-bottom: 0;
    }

    .column-content {
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .org-card {
        min-width: auto;
        width: 100%;
    }

    .detail-panel {
        width: 40%;
        max-height: none;
    }
}
</style>