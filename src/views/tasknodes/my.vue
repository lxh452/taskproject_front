<template>
    <div class="tasknodes-page">
        <div class="toolbar">
            <div class="toolbar-left">
                <el-input 
                    v-model="query.keyword" 
                    placeholder="搜索节点名称" 
                    clearable 
                    class="search-input"
                    :prefix-icon="Search"
                />
                <el-input 
                    v-model="query.department" 
                    placeholder="部门名称" 
                    clearable 
                    class="filter-input"
                />
                <el-select v-model="query.status" placeholder="状态" clearable class="filter-select">
                    <el-option label="待处理" :value="0">
                        <span class="status-dot info"></span>待处理
                    </el-option>
                    <el-option label="进行中" :value="1">
                        <span class="status-dot warning"></span>进行中
                    </el-option>
                    <el-option label="已完成" :value="2">
                        <span class="status-dot success"></span>已完成
                    </el-option>
                </el-select>
                <el-date-picker 
                    v-model="query.deadlineRange" 
                    type="daterange" 
                    value-format="YYYY-MM-DD"
                    range-separator="-"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    class="date-picker"
                />
            </div>
            <div class="toolbar-right">
                <el-button type="primary" :icon="Search" @click="applyFilter">搜索</el-button>
                <el-button @click="resetFilter" :icon="Refresh">重置</el-button>
            </div>
        </div>
        
        <div class="table-container">
            <el-table 
                :data="filteredRows" 
                style="width: 100%" 
                v-loading="loading"
                class="tasknodes-table"
                :header-cell-style="{ background: '#f9fafb', color: '#6b7280', fontWeight: '600' }"
            >
                <el-table-column prop="nodeName" label="节点名称" min-width="220">
                    <template #default="{ row }">
                        <div class="node-name-cell">
                            <div class="node-icon">
                                <el-icon><List /></el-icon>
                            </div>
                            <span class="node-name">{{ row.nodeName }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="taskTitle" label="所属任务" min-width="200">
                    <template #default="{ row }">
                        <el-button 
                            link 
                            type="primary" 
                            @click="goToTask(row.taskId)"
                            class="task-link"
                        >
                            {{ row.taskTitle || '-' }}
                        </el-button>
                    </template>
                </el-table-column>
                <el-table-column prop="department" label="部门" width="160">
                    <template #default="{ row }">
                        <span class="info-text">{{ row.department || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="deadline" label="截止时间" width="180">
                    <template #default="{ row }">
                        <div class="deadline-cell">
                            <el-icon><Calendar /></el-icon>
                            <span>{{ row.deadline || '-' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="进度" width="240" align="center">
                    <template #default="{ row }">
                        <el-progress 
                            :percentage="row.progress" 
                            :status="row.progressStatus"
                            :stroke-width="8"
                            :format="(percentage) => `${percentage}%`"
                        />
                    </template>
                </el-table-column>
                <el-table-column prop="statusText" label="状态" width="120" align="center">
                    <template #default="{ row }">
                        <div class="status-badge" :class="getStatusClass(row.status)">
                            {{ row.statusText }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="right" fixed="right">
                    <template #default="{ row }">
                        <el-button 
                            link 
                            type="primary" 
                            @click="goToTaskDetail(row.taskId)"
                        >
                            查看详情
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Search, Refresh, List, Calendar } from '@element-plus/icons-vue';
import { listMyTaskNodes, listTasks } from '@/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const rows = ref<any[]>([]);
const loading = ref(false);
const query = ref<any>({ keyword: '', department: '', status: null, deadlineRange: null });
const taskMap = ref<Record<string, any>>({});

const filteredRows = computed(() => {
    const { keyword, department, status, deadlineRange } = query.value;
    return rows.value.filter((r) => {
        const byKw = !keyword || r.nodeName.toLowerCase().includes(keyword.toLowerCase());
        const byDept = !department || r.department.toLowerCase().includes(department.toLowerCase());
        const bySt = (status === '' || status === null || status === undefined) || r.status === status;
        const byDl = !deadlineRange || deadlineRange.length !== 2
            ? true
            : (r.deadline >= `${deadlineRange[0]} 00:00:00` && r.deadline <= `${deadlineRange[1]} 23:59:59`);
        return byKw && byDept && bySt && byDl;
    });
});

const applyFilter = () => { /* computed实时生效 */ };
const resetFilter = () => { 
    query.value = { keyword: '', department: '', status: null, deadlineRange: null }; 
};

function getStatusClass(status: number) {
    if (status === 2) return 'success';
    if (status === 1) return 'warning';
    return 'info';
}

async function loadTasks() {
    try {
        const resp = await listTasks({ page: 1, pageSize: 1000 });
        if (resp.data?.code === 200) {
            const list = resp.data?.data?.list || [];
            list.forEach((t: any) => {
                const taskId = t.taskId || t.id;
                if (taskId) {
                    taskMap.value[String(taskId)] = {
                        id: taskId,
                        title: t.taskTitle || t.title || '未命名任务',
                    };
                }
            });
        }
    } catch (error: any) {
        console.error('加载任务列表失败:', error);
    }
}

function goToTask(taskId: string) {
    if (taskId) {
        router.push(`/tasks/detail/${taskId}`);
    }
}

function goToTaskDetail(taskId: string) {
    goToTask(taskId);
}

onMounted(async () => {
    loading.value = true;
    try {
        await loadTasks();
        const resp = await listMyTaskNodes({ page: 1, pageSize: 1000 });
        if (resp.data.code !== 200) {
            console.error('API返回错误:', resp.data.msg);
            rows.value = [];
            return;
        }
        const responseData = resp.data?.data || resp.data || {};
        
        const leaderTasks = responseData.leader_task || [];
        
        const validNodes = leaderTasks.filter((n: any) => {
            const nodeId = n.id || n.taskNodeId;
            const nodeName = n.nodeName || n.taskNodeName || n.NodeName;
            return nodeId && nodeName && nodeName.trim() !== '';
        });
        
        const now = Date.now();
        rows.value = validNodes.map((n: any) => {
            const deadline = n.nodeDeadline || n.endTime;
            const left = deadline ? Math.ceil((Date.parse(deadline) - now) / (24 * 3600 * 1000)) : 0;
            const progress = n.progress ?? 0;
            const status = n.status ?? n.nodeStatus ?? 0;
            const taskId = n.taskId || n.TaskId || '';
            const task = taskMap.value[String(taskId)] || {};
            
            return {
                id: n.id || n.taskNodeId,
                nodeName: n.nodeName || n.taskNodeName || n.NodeName,
                taskId,
                taskTitle: task.title || '-',
                department: n.departmentName || n.departmentId || '-',
                deadline: deadline ? new Date(deadline).toLocaleDateString('zh-CN') : '-',
                progress,
                status,
                statusText: status === 1 ? '进行中' : status === 2 ? '已完成' : status === 0 ? '待处理' : '未知',
                progressStatus: left < 0 && progress < 100 ? 'exception' : left <= 1 && progress < 100 ? 'warning' : undefined,
            };
        });
    } catch (error: any) {
        console.error('加载我创建的节点数据失败:', error);
        rows.value = [];
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.tasknodes-page {
    padding: 24px;
    background: #f9fafb;
    min-height: calc(100vh - 64px);
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: #ffffff;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    flex-wrap: wrap;
    gap: 16px;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.search-input { width: 240px; }
.filter-input { width: 160px; }
.filter-select { width: 140px; }
.date-picker { width: 260px; }

.table-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 4px;
}

.tasknodes-table {
    --el-table-border-color: #f3f4f6;
    --el-table-header-bg-color: #f9fafb;
}

.node-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.node-icon {
    width: 32px;
    height: 32px;
    background: #eff6ff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    font-size: 16px;
    flex-shrink: 0;
}

.node-name {
    font-weight: 600;
    font-size: 14px;
    color: #1f2937;
}

.task-link {
    font-weight: 500;
    font-size: 14px;
}

.info-text {
    color: #4b5563;
    font-size: 14px;
}

.deadline-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;
    font-size: 13px;
}

.status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.status-badge.success { background: #ecfdf5; color: #10b981; }
.status-badge.warning { background: #fffbeb; color: #f59e0b; }
.status-badge.info { background: #f3f4f6; color: #6b7280; }

.status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}
.status-dot.success { background: #10b981; }
.status-dot.warning { background: #f59e0b; }
.status-dot.info { background: #6b7280; }
</style>
