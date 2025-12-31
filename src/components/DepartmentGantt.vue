<template>
    <div class="department-gantt">
        <div class="gantt-header">
            <div class="gantt-controls">
                <el-radio-group v-model="viewMode" size="small">
                    <el-radio-button value="month">月视图</el-radio-button>
                    <el-radio-button value="day">日视图</el-radio-button>
                </el-radio-group>
                <el-select v-model="filterRole" placeholder="角色筛选" clearable size="small" class="role-filter">
                    <el-option label="全部" value="" />
                    <el-option label="负责人" value="leader" />
                    <el-option label="执行人" value="executor" />
                </el-select>
            </div>
            <div class="gantt-nav">
                <el-button :icon="ArrowLeft" size="small" @click="prevPeriod" />
                <span class="current-period">{{ currentPeriodLabel }}</span>
                <el-button :icon="ArrowRight" size="small" @click="nextPeriod" />
            </div>
        </div>

        <div class="gantt-container" v-loading="loading">
            <div class="gantt-timeline">
                <div class="timeline-header">
                    <div class="employee-column">成员</div>
                    <div class="timeline-dates">
                        <div 
                            v-for="date in timelineDates" 
                            :key="date.key" 
                            class="date-cell"
                            :class="{ today: date.isToday, weekend: date.isWeekend }"
                        >
                            <span class="date-label">{{ date.label }}</span>
                        </div>
                    </div>
                </div>
                
                <div class="timeline-body">
                    <div 
                        v-for="employee in filteredEmployees" 
                        :key="employee.id" 
                        class="employee-row"
                    >
                        <div class="employee-info">
                            <el-avatar :size="28" class="employee-avatar">
                                {{ employee.name?.charAt(0) || '?' }}
                            </el-avatar>
                            <span class="employee-name">{{ employee.name }}</span>
                        </div>
                        <div class="employee-tasks">
                            <div 
                                v-for="task in employee.tasks" 
                                :key="task.id"
                                class="task-bar"
                                :style="getTaskStyle(task)"
                                :class="getTaskClass(task)"
                                @click="viewTask(task)"
                            >
                                <span class="task-label">{{ task.name }}</span>
                            </div>
                        </div>
                    </div>
                    <el-empty v-if="filteredEmployees.length === 0" description="暂无任务数据" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { getMyTaskNodes } from '@/api';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const props = defineProps({
    departmentId: { type: String, default: '' }
});

const router = useRouter();
const loading = ref(false);
const viewMode = ref<'month' | 'day'>('month');
const filterRole = ref('');
const currentDate = ref(new Date());
const employees = ref<any[]>([]);

// 时间线日期
const timelineDates = computed(() => {
    const dates: any[] = [];
    const start = new Date(currentDate.value);
    
    if (viewMode.value === 'month') {
        start.setDate(1);
        const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        for (let i = 0; i < daysInMonth; i++) {
            const d = new Date(start);
            d.setDate(i + 1);
            dates.push({
                key: d.toISOString().split('T')[0],
                label: `${i + 1}`,
                date: d,
                isToday: isSameDay(d, new Date()),
                isWeekend: d.getDay() === 0 || d.getDay() === 6
            });
        }
    } else {
        // 日视图显示前�?�?
        start.setDate(start.getDate() - 7);
        for (let i = 0; i < 15; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push({
                key: d.toISOString().split('T')[0],
                label: `${d.getMonth() + 1}/${d.getDate()}`,
                date: d,
                isToday: isSameDay(d, new Date()),
                isWeekend: d.getDay() === 0 || d.getDay() === 6
            });
        }
    }
    return dates;
});

const currentPeriodLabel = computed(() => {
    const d = currentDate.value;
    if (viewMode.value === 'month') {
        return `${d.getFullYear()}年${d.getMonth() + 1}月`;
    }
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
});

const filteredEmployees = computed(() => {
    if (!filterRole.value) return employees.value;
    return employees.value.filter(e => e.role === filterRole.value || e.tasks.some((t: any) => t.role === filterRole.value));
});

function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
}

function prevPeriod() {
    const d = new Date(currentDate.value);
    if (viewMode.value === 'month') {
        d.setMonth(d.getMonth() - 1);
    } else {
        d.setDate(d.getDate() - 7);
    }
    currentDate.value = d;
}

function nextPeriod() {
    const d = new Date(currentDate.value);
    if (viewMode.value === 'month') {
        d.setMonth(d.getMonth() + 1);
    } else {
        d.setDate(d.getDate() + 7);
    }
    currentDate.value = d;
}

function getTaskStyle(task: any) {
    const dates = timelineDates.value;
    if (dates.length === 0) return {};
    
    const startDate = new Date(task.startTime || task.nodeStartTime || new Date());
    const endDate = new Date(task.endTime || task.nodeEndTime || startDate);
    
    const firstDate = dates[0].date;
    const lastDate = dates[dates.length - 1].date;
    const totalDays = dates.length;
    
    // 计算任务在时间线上的位置
    const startDiff = Math.max(0, Math.floor((startDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    const endDiff = Math.min(totalDays - 1, Math.floor((endDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const left = (startDiff / totalDays) * 100;
    const width = Math.max(3, ((endDiff - startDiff + 1) / totalDays) * 100);
    
    return {
        left: `${left}%`,
        width: `${width}%`
    };
}

function getTaskClass(task: any) {
    const status = task.status ?? task.nodeStatus ?? 0;
    return {
        pending: status === 0,
        'in-progress': status === 1,
        completed: status === 2
    };
}

function viewTask(task: any) {
    const nodeId = task.id || task.taskNodeId || task.nodeId;
    if (nodeId) {
        // 跳转到任务节点所属的任务详情
        navigateToTaskNode(nodeId);
    }
}

// 跳转到任务节点所属的任务详情
async function navigateToTaskNode(taskNodeId: string) {
    try {
        const resp = await request({ url: '/tasknode/get', method: 'post', data: { taskNodeId } });
        if (resp.data.code === 200 && resp.data.data) {
            const data = resp.data.data;
            const taskNode = data.taskNode || data;
            const taskId = taskNode.taskId || taskNode.TaskId || taskNode.taskID;
            if (taskId) {
                router.push(`/tasks/detail/${taskId}`);
                return;
            }
        }
        ElMessage.warning('无法获取任务节点信息');
    } catch (error) {
        console.error('获取任务节点失败:', error);
        ElMessage.error('获取任务节点信息失败');
    }
}

async function loadTasks() {
    loading.value = true;
    try {
        const resp = await getMyTaskNodes({ page: 1, pageSize: 200 });
        if (resp.data?.code === 200) {
            const data = resp.data?.data || {};
            const executorTasks = data.executor_task || data.executorTask || [];
            const leaderTasks = data.leader_task || data.leaderTask || [];
            
            // 按员工分组
            const employeeMap = new Map<string, any>();
            
            const processTasks = (tasks: any[], role: string) => {
                tasks.forEach((t: any) => {
                    const empId = role === 'leader' ? t.leaderId : t.executorId;
                    // 使用后端返回的姓名字段
                    const empName = role === 'leader' ? t.leaderName : t.executorName;
                    
                    if (!empId) return;
                    
                    if (!employeeMap.has(empId)) {
                        employeeMap.set(empId, {
                            id: empId,
                            name: empName || `用户${String(empId).slice(-4)}`, // 如果没有名字，显示用户ID后4位
                            role,
                            tasks: []
                        });
                    } else if (empName && employeeMap.get(empId).name.startsWith('用户')) {
                        // 如果之前没有名字但现在有了，更新名字
                        employeeMap.get(empId).name = empName;
                    }
                    
                    employeeMap.get(empId).tasks.push({
                        id: t.id || t.taskNodeId || t.nodeId,
                        name: t.nodeName || t.name || t.taskNodeName || '未命名',
                        status: t.nodeStatus ?? t.status ?? 0,
                        startTime: t.nodeStartTime || t.startTime,
                        endTime: t.nodeEndTime || t.endTime || t.nodeDeadline,
                        role
                    });
                });
            };
            
            processTasks(leaderTasks, 'leader');
            processTasks(executorTasks, 'executor');
            
            employees.value = Array.from(employeeMap.values());
        }
    } catch (error) {
        console.error('加载任务失败:', error);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadTasks();
});
</script>

<style scoped>
.department-gantt {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.gantt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.gantt-controls {
    display: flex;
    gap: 12px;
}

.role-filter {
    width: 120px;
}

.gantt-nav {
    display: flex;
    align-items: center;
    gap: 12px;
}

.current-period {
    font-weight: 600;
    color: #1f2937;
    min-width: 120px;
    text-align: center;
}

.gantt-container {
    flex: 1;
    overflow: auto;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.gantt-timeline {
    min-width: 800px;
}

.timeline-header {
    display: flex;
    border-bottom: 2px solid #e5e7eb;
    background: #f9fafb;
    position: sticky;
    top: 0;
    z-index: 10;
}

.employee-column {
    width: 160px;
    min-width: 160px;
    padding: 12px 16px;
    font-weight: 600;
    color: #6b7280;
    border-right: 1px solid #e5e7eb;
}

.timeline-dates {
    flex: 1;
    display: flex;
}

.date-cell {
    flex: 1;
    min-width: 30px;
    padding: 8px 4px;
    text-align: center;
    border-right: 1px solid #f3f4f6;
}

.date-cell.today {
    background: #e0e7ff;
}

.date-cell.weekend {
    background: #fef3c7;
}

.date-label {
    font-size: 11px;
    color: #6b7280;
}

.timeline-body {
    min-height: 200px;
}

.employee-row {
    display: flex;
    border-bottom: 1px solid #f3f4f6;
    min-height: 50px;
}

.employee-info {
    width: 160px;
    min-width: 160px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-right: 1px solid #e5e7eb;
    background: #fafafa;
}

.employee-avatar {
    background: #3B82F6;
    color: #fff;
    font-size: 12px;
}

.employee-name {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.employee-tasks {
    flex: 1;
    position: relative;
    padding: 8px 0;
}

.task-bar {
    position: absolute;
    height: 28px;
    border-radius: 6px;
    padding: 0 8px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    top: 50%;
    transform: translateY(-50%);
}

.task-bar:hover {
    filter: brightness(0.95);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.task-bar.pending {
    background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%);
    color: #2563EB;
}

.task-bar.in-progress {
    background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
    color: #92400e;
}

.task-bar.completed {
    background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%);
    color: #065f46;
}

.task-label {
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (max-width: 768px) {
    .gantt-header {
        flex-direction: column;
        gap: 12px;
    }
    
    .employee-column,
    .employee-info {
        width: 100px;
        min-width: 100px;
    }
}
</style>
