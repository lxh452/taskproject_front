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
                                <div class="card-icon">🏢</div>
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
                                <div class="card-icon">📁</div>
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
                                <div class="card-icon">👤</div>
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
                                <span class="detail-icon">{{ getNodeIcon(selectedNode.type) }}</span>
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
                                        <span class="date-icon">📅</span>
                                        {{ formatDate(task.deadline) }}
                                    </span>
                                    <span class="task-progress">{{ task.progress || 0 }}% Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 空状态 -->
                    <div class="detail-empty" v-else>
                        <div class="empty-icon">📋</div>
                        <div class="empty-text">暂无任务信息</div>
                    </div>
                </div>

                <!-- 未选择状态 -->
                <div v-else class="detail-placeholder">
                    <div class="placeholder-icon">👆</div>
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
import { Search, Refresh } from '@element-plus/icons-vue';
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

function getNodeIcon(type?: string): string {
    if (type === 'company') return '🏢';
    if (type === 'dept') return '📁';
    return '👤';
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
.org-tree-page {
    padding: 24px;
    min-height: calc(100vh - 100px);
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* 页面头部 */
.page-header {
    margin-bottom: 24px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-left {
    flex: 1;
}

.page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 4px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.page-subtitle {
    font-size: 14px;
    color: #6b7280;
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
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
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
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.tree-columns {
    display: flex;
    gap: 20px;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
}

.tree-column {
    flex: 1;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e5e7eb;
    padding-right: 20px;
}

.tree-column:last-child {
    border-right: none;
    padding-right: 0;
}

.column-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e5e7eb;
}

.column-title {
    font-size: 12px;
    font-weight: 700;
    color: #6b7280;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.column-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
}

.column-content::-webkit-scrollbar {
    width: 6px;
}

.column-content::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* 组织卡片 */
.org-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    margin-bottom: 12px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.org-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
    transition: left 0.5s ease;
}

.org-card:hover::before {
    left: 100%;
}

.org-card:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    border-color: rgba(102, 126, 234, 0.3);
}

.org-card.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    color: white;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.org-card.active .card-title,
.org-card.active .card-subtitle {
    color: white;
}

.org-card.active .card-icon {
    background: rgba(255, 255, 255, 0.2);
}

.card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 10px;
    flex-shrink: 0;
    transition: all 0.3s ease;
}

.org-card:hover .card-icon {
    transform: scale(1.1) rotate(5deg);
}

.card-content {
    flex: 1;
    min-width: 0;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-subtitle {
    font-size: 13px;
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-indicators {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.indicator-dot {
    width: 8px;
    height: 8px;
    background: #f59e0b;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
}

.card-arrow {
    font-size: 16px;
    color: #9ca3af;
    font-weight: 300;
}

.org-card.active .card-arrow {
    color: white;
}

.employee-card {
    border-left: 3px solid #f5576c;
}

/* 右侧详情面板 */
.detail-panel {
    width: 400px;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    padding: 24px;
    overflow-y: auto;
    color: white;
}

.detail-panel::-webkit-scrollbar {
    width: 6px;
}

.detail-panel::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
}

.detail-panel::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
}

.detail-content {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
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
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-avatar {
    width: 64px;
    height: 64px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
}

.detail-title-section {
    flex: 1;
    min-width: 0;
}

.detail-title {
    font-size: 22px;
    font-weight: 700;
    color: white;
    margin: 0 0 8px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.detail-subtitle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
}

.detail-icon {
    font-size: 16px;
}

.detail-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
}

.stat-box {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    backdrop-filter: blur(10px);
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
}

.stat-done {
    color: #22c55e;
}

.stat-late {
    color: #ef4444;
}

.stat-rate {
    color: #3b82f6;
}

.stat-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.detail-tasks {
    margin-top: 24px;
}

.tasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tasks-title {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.tasks-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
}

.tasks-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.task-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s ease;
}

.task-item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(4px);
}

.task-name {
    font-size: 15px;
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
    gap: 4px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
}

.date-icon {
    font-size: 14px;
}

.task-progress {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-left: auto;
}

.detail-empty,
.detail-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    text-align: center;
}

.empty-icon,
.placeholder-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

.empty-text,
.placeholder-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
}

/* 员工悬停卡片 */
.employee-hover-card {
    position: fixed;
    width: 280px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    overflow: hidden;
}

.hover-card-header {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    opacity: 0.9;
}

.hover-card-stats {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
}

.hover-stat {
    flex: 1;
    text-align: center;
}

.hover-stat-value {
    display: block;
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 4px;
}

.hover-stat-label {
    font-size: 11px;
    color: #6b7280;
}

/* 过渡动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
}

.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
}
</style>