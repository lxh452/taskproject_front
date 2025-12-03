<template>
    <div class="task-overview-page">
        <!-- 顶部操作栏 -->
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="view-switcher">
                    <div 
                        class="view-btn" 
                        :class="{ active: activeView === 'my-timeline' }"
                        @click="activeView = 'my-timeline'"
                    >
                        个人任务
                    </div>
                    <div 
                        class="view-btn" 
                        :class="{ active: activeView === 'team-timeline' }"
                        @click="handleViewChange('team-timeline')"
                    >
                        团队任务
                    </div>
                    <div 
                        class="view-btn" 
                        :class="{ active: activeView === 'upcoming' }"
                        @click="activeView = 'upcoming'"
                    >
                        即将到期
                    </div>
                </div>
            </div>
            <div class="toolbar-right">
                <el-button :icon="Refresh" circle plain @click="loadData" />
                <el-button :icon="FullScreen" circle plain @click="toggleFullscreen" />
            </div>
        </div>

        <div class="content-area">
            <!-- 个人任务视图 -->
            <div v-show="activeView === 'my-timeline'" class="timeline-view">
                <div class="task-list-panel">
                    <div class="panel-header">任务列表</div>
                    <div class="task-list-content">
                        <div 
                            v-for="task in myTasks" 
                            :key="task.id"
                            class="task-item"
                            :class="[
                                task.type === 'task' ? 'type-task' : 'type-node',
                                { active: selectedTask?.id === task.id }
                            ]"
                            @click="selectTask(task)"
                        >
                            <div class="task-item-body">
                                <div class="task-name">{{ task.name }}</div>
                                <div class="task-meta">
                                    <span class="meta-tag" :class="getPriorityClass(task.priority)">{{ getPriorityText(task.priority) }}</span>
                                    <span class="meta-date">{{ formatDate(task.endTime) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="gantt-panel">
                    <div class="gantt-header">
                        <div class="date-nav">
                            <el-button :icon="ArrowLeft" circle size="small" @click="prevWeek" />
                            <span class="date-range">{{ dateRangeText }}</span>
                            <el-button :icon="ArrowRight" circle size="small" @click="nextWeek" />
                        </div>
                    </div>
                    <div class="gantt-content">
                        <div class="gantt-header-row">
                            <div v-for="date in dateRange" :key="date.toString()" class="gantt-date-cell" :class="{ today: isToday(date) }">
                                <div class="day-num">{{ getDay(date) }}</div>
                                <div class="day-text">{{ getWeekDay(date) }}</div>
                            </div>
                        </div>
                        <div class="gantt-body">
                            <div v-for="task in myTasks" :key="task.id" class="gantt-row">
                                <div 
                                    class="gantt-bar"
                                    :class="getPriorityClass(task.priority)"
                                    :style="getTaskBarStyle(task)"
                                    :title="task.name"
                                >
                                    <div class="bar-progress" :style="{ width: (task.progress || 0) + '%' }"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 团队任务视图 -->
            <div v-show="activeView === 'team-timeline'" class="team-view">
                <div class="team-toolbar">
                    <el-select 
                        v-model="selectedEmployeeId" 
                        placeholder="选择成员" 
                        filterable
                        class="member-select"
                        @change="loadEmployeeTasks"
                    >
                        <el-option
                            v-for="emp in employees"
                            :key="emp.id"
                            :label="emp.name"
                            :value="emp.id"
                        >
                            <div class="member-option">
                                <el-avatar :size="24" class="member-avatar">{{ emp.name?.charAt(0) }}</el-avatar>
                                <span>{{ emp.name }}</span>
                            </div>
                        </el-option>
                    </el-select>
                </div>

                <div v-if="selectedEmployeeId && employeeTasks.length > 0" class="member-timeline">
                    <div class="member-header">
                        <el-avatar :size="48" class="header-avatar">{{ selectedEmployee?.name?.charAt(0) }}</el-avatar>
                        <div class="header-info">
                            <div class="header-name">{{ selectedEmployee?.name }}</div>
                            <div class="header-meta">{{ employeeTasks.length }} 个进行中任务</div>
                        </div>
                    </div>
                    <div class="task-cards-grid">
                        <div v-for="task in employeeTasks" :key="task.id" class="task-card">
                            <div class="card-top">
                                <span class="priority-dot" :class="getPriorityClass(task.priority)"></span>
                                <span class="task-status">{{ task.progress }}%</span>
                            </div>
                            <div class="card-title">{{ task.name }}</div>
                            <div class="card-bottom">
                                <el-icon><Calendar /></el-icon>
                                <span>{{ formatDate(task.endTime) }}</span>
                            </div>
                            <div class="card-progress-bg">
                                <div class="card-progress-fill" :style="{ width: (task.progress || 0) + '%' }"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <el-empty :description="selectedEmployeeId ? '该成员暂无任务' : '请选择成员查看任务'" />
                </div>
            </div>

            <!-- 即将到期视图 -->
            <div v-show="activeView === 'upcoming'" class="upcoming-view">
                <div class="upcoming-grid">
                    <div v-for="task in upcomingTasks" :key="task.id" class="upcoming-card">
                        <div class="upcoming-header">
                            <div class="upcoming-days" :class="getDaysLeftClass(task.leftDays)">
                                {{ getDaysLeftText(task.leftDays) }}
                            </div>
                            <el-tag size="small" :type="getPriorityType(task.priority)">{{ getPriorityText(task.priority) }}</el-tag>
                        </div>
                        <div class="upcoming-content">
                            <div class="upcoming-title">{{ task.name }}</div>
                            <div class="upcoming-meta">
                                <el-avatar :size="20" class="meta-avatar">{{ getTaskAssigneeName(task)?.charAt(0) }}</el-avatar>
                                <span class="meta-name">{{ getTaskAssigneeName(task) }}</span>
                            </div>
                        </div>
                        <div class="upcoming-footer">
                            <span class="upcoming-date">{{ formatDate(task.endTime) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
    Refresh, FullScreen, ArrowLeft, ArrowRight, Calendar
} from '@element-plus/icons-vue';
import { getMyTaskNodes, listTasks, listEmployees, getMyEmployee } from '@/api';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

const activeView = ref('my-timeline');
const selectedTask = ref<any>(null);
const myTasks = ref<any[]>([]);
const employeesMap = ref<Record<string, any>>({});
const employees = ref<any[]>([]);
const selectedEmployeeId = ref<string>('');
const employeeTasks = ref<any[]>([]);
const upcomingTasks = ref<any[]>([]);
const currentDate = ref(new Date());
const dateRange = ref<Date[]>([]);

const selectedEmployee = computed(() => {
    if (!selectedEmployeeId.value) return null;
    return employees.value.find(emp => emp.id === selectedEmployeeId.value);
});

const dateRangeText = computed(() => {
    if (dateRange.value.length === 0) return '';
    const start = dateRange.value[0];
    const end = dateRange.value[dateRange.value.length - 1];
    return `${formatDateOnly(start)} - ${formatDateOnly(end)}`;
});

function formatDate(date: string | Date | undefined): string {
    if (!date) return '-';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    } catch {
        return String(date);
    }
}

function formatDateOnly(date: Date): string {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function getDay(date: Date): string {
    return String(date.getDate());
}

function getWeekDay(date: Date): string {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
}

function isToday(date: Date): boolean {
    return date.toDateString() === new Date().toDateString();
}

function getPriorityText(priority: number): string {
    return ['低', '紧急', '高', '中', '低'][priority] || '中';
}

function getPriorityType(priority: number): string {
    return ['', 'danger', 'warning', 'primary', 'success'][priority] || 'info';
}

function getPriorityClass(priority: number): string {
    return ['', 'critical', 'high', 'medium', 'low'][priority] || 'medium';
}

function getTaskAssigneeName(task: any): string {
    const assigneeId = task.assigneeId || task.leaderId || task.responsibleId;
    if (!assigneeId) return '未分配';
    const emp = employeesMap.value[String(assigneeId)];
    return emp?.name || assigneeId;
}

function getTaskBarStyle(task: any): any {
    if (!task.startTime || !task.endTime) return {};
    const start = new Date(task.startTime).getTime();
    const end = new Date(task.endTime).getTime();
    const rangeStart = dateRange.value[0]?.getTime() || start;
    const rangeEnd = dateRange.value[dateRange.value.length - 1]?.getTime() || end;
    const rangeDuration = rangeEnd - rangeStart + 24 * 3600 * 1000; // Include last day
    
    const leftPercent = Math.max(0, ((start - rangeStart) / rangeDuration) * 100);
    const widthPercent = Math.min(100 - leftPercent, ((end - start) / rangeDuration) * 100);
                
    return {
        left: `${leftPercent}%`,
        width: `${Math.max(widthPercent, 1)}%` // Min 1% width
    };
}

function getDaysLeftClass(days: number): string {
    if (days < 0) return 'overdue';
    if (days <= 2) return 'urgent';
    return 'normal';
}

function getDaysLeftText(days: number): string {
    if (days < 0) return `逾期 ${Math.abs(days)} 天`;
    if (days === 0) return '今天到期';
    return `剩余 ${days} 天`;
}

function selectTask(task: any) {
    selectedTask.value = task;
}

function handleViewChange(view: string) {
    activeView.value = view;
    if (view === 'team-timeline' && employees.value.length === 0) {
        loadEmployees();
    }
}

function prevWeek() {
    currentDate.value = new Date(currentDate.value.getTime() - 7 * 24 * 3600 * 1000);
    updateDateRange();
}

function nextWeek() {
    currentDate.value = new Date(currentDate.value.getTime() + 7 * 24 * 3600 * 1000);
    updateDateRange();
}

function updateDateRange() {
    const dates: Date[] = [];
    const start = new Date(currentDate.value);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    
    for (let i = 0; i < 14; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
    }
    dateRange.value = dates;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

async function loadMyTasks() {
    try {
        const allItems: any[] = [];
        
        // Load Nodes
        const res = await getMyTaskNodes({ page: 1, pageSize: 1000 });
        if (res.data.code === 200) {
            const data = res.data?.data || {};
            const nodes = [...(data.executor_task || []), ...(data.leader_task || [])];
            const nodeMap = new Map();
            
            nodes.forEach((it: any) => {
                const id = it.id || it.taskNodeId;
                if (!id || nodeMap.has(id)) return;
                nodeMap.set(id, {
                    id,
                    type: 'taskNode',
                    name: it.nodeName || it.taskNodeName,
                    startTime: it.createTime || it.startTime,
                    endTime: it.nodeDeadline || it.endTime || it.deadline,
                    priority: it.priority || it.nodeType || 3,
                    progress: it.progress || 0,
                    assigneeId: it.leaderId || (it.executorIds?.[0]) || '',
                });
            });
            allItems.push(...nodeMap.values());
        }
        
        // Load Tasks
        const taskResp = await listTasks({ page: 1, pageSize: 100 });
        if (taskResp.data?.code === 200) {
            const tasks = taskResp.data?.data?.list || [];
            const userId = userStore.userId || userStore.id || '';
            
            tasks.forEach((t: any) => {
                const responsibles = (t.responsibleEmployeeIds || '').split(',').filter(Boolean);
                if (responsibles.includes(userId)) {
                    allItems.push({
                        id: t.id || t.taskId,
                        type: 'task',
                        name: t.taskTitle || t.title,
                        startTime: t.taskStartTime || t.startTime,
                        endTime: t.taskDeadline || t.deadline,
                        priority: t.taskPriority || t.priority || 3,
                        progress: t.progress || 0,
                        assigneeId: responsibles[0],
                    });
                }
            });
        }

        myTasks.value = allItems;
        updateUpcomingTasks(allItems);
    } catch (error) {
        console.error('Load tasks failed', error);
    }
}

async function loadEmployees() {
    try {
        const companyId = userStore.companyId || (await getMyEmployee())?.data?.data?.companyId;
        if (!companyId) return;

        const resp = await listEmployees({ page: 1, pageSize: 1000, companyId });
        if (resp.data?.code === 200) {
            const list = resp.data?.data?.list || [];
            employees.value = list.map((e: any) => ({
                id: e.id || e.employeeId,
                name: e.realName || e.name || '未知',
                avatar: e.avatar || '',
            }));
            
            list.forEach((e: any) => {
                if (e.id) employeesMap.value[String(e.id)] = { name: e.realName || e.name };
            });
        }
    } catch (error) {
        console.error('Load employees failed', error);
    }
}

async function loadEmployeeTasks() {
    if (!selectedEmployeeId.value) {
        employeeTasks.value = [];
        return;
    }
    try {
        const resp = await listTasks({ page: 1, pageSize: 100 });
        if (resp.data?.code === 200) {
            const list = resp.data?.data?.list || [];
            const empId = String(selectedEmployeeId.value);
            
            employeeTasks.value = list
                .filter((t: any) => {
                    const responsibles = (t.responsibleEmployeeIds || '').split(',').filter(Boolean);
                    return responsibles.includes(empId);
                })
                .map((t: any) => ({
                    id: t.taskId || t.id,
                    name: t.taskTitle || t.title,
                    startTime: t.taskStartTime,
                    endTime: t.taskDeadline,
                    priority: t.taskPriority || 3,
                    progress: t.progress || 0,
                    assigneeId: empId
                }));
        }
    } catch (error) {
        ElMessage.error('加载员工任务失败');
    }
}

function updateUpcomingTasks(tasks: any[]) {
    const now = Date.now();
    const sevenDays = 7 * 24 * 3600 * 1000;

    upcomingTasks.value = tasks
        .filter((t: any) => {
            if (!t.endTime) return false;
            const end = new Date(t.endTime).getTime();
            const left = end - now;
            return left <= sevenDays && left >= -3 * 24 * 3600 * 1000;
        })
        .map((t: any) => ({
            ...t,
            leftDays: Math.ceil((new Date(t.endTime).getTime() - now) / (24 * 3600 * 1000))
        }))
        .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());
}

async function loadData() {
    await Promise.all([loadMyTasks(), loadEmployees()]);
    updateDateRange();
}

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.task-overview-page {
    padding: 24px;
    background: #f9fafb;
    min-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.view-switcher {
    background: #ffffff;
    padding: 4px;
    border-radius: 8px;
    display: flex;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.view-btn {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
}

.view-btn.active {
    background: #f3f4f6;
    color: #1f2937;
}

.content-area {
    flex: 1;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    overflow: hidden;
    position: relative;
}

/* Timeline View */
.timeline-view {
    display: flex;
    height: 100%;
}

.task-list-panel {
    width: 280px;
    border-right: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    background: #ffffff;
}

.panel-header {
    padding: 16px 20px;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #f3f4f6;
}

.task-list-content {
    flex: 1;
    overflow-y: auto;
}

.task-item {
    padding: 12px 20px;
    border-bottom: 1px solid #f9fafb;
    cursor: pointer;
    transition: background 0.2s;
}

.task-item:hover, .task-item.active {
    background: #f9fafb;
}

.task-item.type-task { border-left: 3px solid #3b82f6; }
.task-item.type-node { border-left: 3px solid #10b981; }

.task-name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.task-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #9ca3af;
}

.meta-tag.critical { color: #ef4444; }
.meta-tag.high { color: #f59e0b; }
.meta-tag.medium { color: #3b82f6; }
.meta-tag.low { color: #10b981; }

/* Gantt Panel */
.gantt-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.gantt-header {
    padding: 12px 20px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    justify-content: center;
}

.date-nav {
    display: flex;
    align-items: center;
    gap: 16px;
}

.date-range {
    font-weight: 600;
    color: #374151;
    font-variant-numeric: tabular-nums;
}

.gantt-content {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
}

.gantt-header-row {
    display: flex;
    border-bottom: 1px solid #f3f4f6;
    background: #fafbfc;
    position: sticky;
    top: 0;
    z-index: 10;
}

.gantt-date-cell {
    flex: 1;
    min-width: 60px;
    text-align: center;
    padding: 8px 0;
    border-right: 1px solid #f3f4f6;
}

.gantt-date-cell.today {
    background: #eff6ff;
    color: #3b82f6;
}

.day-num {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
}

.day-text {
    font-size: 12px;
    color: #9ca3af;
}

.gantt-body {
    flex: 1;
}

.gantt-row {
    height: 66px; /* Match task-item height approx */
    border-bottom: 1px solid #f9fafb;
    position: relative;
    background: #ffffff;
}

.gantt-bar {
    position: absolute;
    top: 18px;
    height: 30px;
    border-radius: 6px;
    background: #e5e7eb;
    overflow: hidden;
    min-width: 4px;
}

.gantt-bar.critical { background: #fee2e2; border: 1px solid #ef4444; }
.gantt-bar.high { background: #fef3c7; border: 1px solid #f59e0b; }
.gantt-bar.medium { background: #eff6ff; border: 1px solid #3b82f6; }
.gantt-bar.low { background: #dcfce7; border: 1px solid #10b981; }

.bar-progress {
    height: 100%;
    background: rgba(0,0,0,0.1);
}

/* Team View */
.team-view {
    padding: 24px;
    height: 100%;
    overflow-y: auto;
}

.team-toolbar {
    margin-bottom: 24px;
}

.member-select { width: 240px; }

.member-option {
    display: flex;
    align-items: center;
    gap: 8px;
}

.member-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #f3f4f6;
}

.header-avatar {
    background: #eff6ff;
    color: #3b82f6;
    font-size: 20px;
    font-weight: 600;
}

.header-name {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
}

.header-meta {
    font-size: 13px;
    color: #6b7280;
}

.task-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

.task-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    position: relative;
    overflow: hidden;
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.priority-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}
.priority-dot.critical { background: #ef4444; }
.priority-dot.high { background: #f59e0b; }
.priority-dot.medium { background: #3b82f6; }
.priority-dot.low { background: #10b981; }

.task-status {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
}

.card-title {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 16px;
    line-height: 1.4;
}

.card-bottom {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #9ca3af;
}

.card-progress-bg {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #f3f4f6;
}

.card-progress-fill {
    height: 100%;
    background: #3b82f6;
}

/* Upcoming View */
.upcoming-view {
    padding: 24px;
    overflow-y: auto;
    height: 100%;
}

.upcoming-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.upcoming-card {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    padding: 20px;
}

.upcoming-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.upcoming-days {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
}

.upcoming-days.urgent { background: #fee2e2; color: #ef4444; }
.upcoming-days.normal { background: #eff6ff; color: #3b82f6; }
.upcoming-days.overdue { background: #1f2937; color: #fff; }

.upcoming-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
}

.upcoming-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
}

.meta-avatar {
    background: #f3f4f6;
    color: #6b7280;
    font-size: 10px;
}

.meta-name {
    font-size: 12px;
    color: #6b7280;
}

.upcoming-footer {
    padding-top: 16px;
    border-top: 1px solid #f9fafb;
    font-size: 12px;
    color: #9ca3af;
    text-align: right;
}

.empty-state {
    padding: 60px;
    display: flex;
    justify-content: center;
}
</style>
