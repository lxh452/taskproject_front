<template>
    <div class="task-detail-page">
        <!-- 顶部英雄区域 -->
        <div class="hero-section" :style="heroGradient">
            <div class="hero-content">
                <el-button link @click="goBack" class="back-btn">
                            <el-icon><ArrowLeft /></el-icon>
                    <span>返回</span>
                        </el-button>
                <div class="hero-title">
                    <h1 class="task-title">{{ taskInfo?.taskTitle || '任务详情' }}</h1>
                    <div class="hero-meta">
                        <el-tag :type="priorityType" size="large" class="hero-tag" effect="dark">
                            <el-icon class="tag-icon"><WarningFilled v-if="taskInfo?.priority === 1" /><ArrowUp v-else-if="taskInfo?.priority === 2" /><Minus v-else-if="taskInfo?.priority === 3" /><ArrowDown v-else /></el-icon>
                            {{ priorityText }}
                        </el-tag>
                        <el-tag :type="statusType" size="large" class="hero-tag" effect="dark">
                            <el-icon class="tag-icon"><CircleCheck v-if="taskInfo?.status === 2" /><Loading v-else-if="taskInfo?.status === 1" /><Clock v-else /></el-icon>
                            {{ statusText }}
                        </el-tag>
                        <div class="progress-badge">
                            <el-progress 
                                :percentage="taskInfo?.progress || 0" 
                                :status="progressStatus"
                                :stroke-width="8"
                                :show-text="false"
                                class="hero-progress"
                            />
                            <span class="progress-text">{{ taskInfo?.progress || 0 }}%</span>
                    </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="taskInfo" class="content-wrapper">
            <!-- 关键信息卡片 -->
            <div class="key-info-grid">
                <div class="info-card" @mouseenter="showTooltip($event, '任务ID', taskInfo.id)" @mouseleave="hideTooltip">
                    <div class="info-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <el-icon><Document /></el-icon>
                    </div>
                    <div class="info-content">
                        <div class="info-label">任务ID</div>
                        <div class="info-value">{{ formatId(taskInfo.id) }}</div>
                    </div>
                </div>
                <div class="info-card" @mouseenter="showTooltip($event, '截止时间', formatTime(taskInfo.deadline))" @mouseleave="hideTooltip">
                    <div class="info-icon" style="background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);">
                        <el-icon><Calendar /></el-icon>
                    </div>
                    <div class="info-content">
                        <div class="info-label">截止时间</div>
                        <div class="info-value">{{ formatTime(taskInfo.deadline) || '-' }}</div>
                    </div>
                </div>
                <div class="info-card" @mouseenter="showTooltip($event, '预计工时', `${taskInfo.estimatedHours || 0} 小时`)" @mouseleave="hideTooltip">
                    <div class="info-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <el-icon><Timer /></el-icon>
                    </div>
                    <div class="info-content">
                        <div class="info-label">预计工时</div>
                        <div class="info-value">{{ taskInfo.estimatedHours || 0 }}h</div>
                    </div>
                </div>
                <div class="info-card" @mouseenter="showTooltip($event, '实际工时', `${taskInfo.actualHours || 0} 小时`)" @mouseleave="hideTooltip">
                    <div class="info-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                        <el-icon><Clock /></el-icon>
                    </div>
                    <div class="info-content">
                        <div class="info-label">实际工时</div>
                        <div class="info-value">{{ taskInfo.actualHours || 0 }}h</div>
                    </div>
                </div>
            </div>

            <!-- 详细信息区域 -->
            <div class="detail-grid">
                <!-- 左侧：描述和节点 -->
                <div class="detail-left">
                    <!-- 任务描述 -->
                    <el-card shadow="hover" class="detail-card description-card">
                    <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><Document /></el-icon>
                                <span>任务描述</span>
                            </div>
                    </template>
                        <div class="description-content">
                            {{ taskInfo.taskDescription || '暂无描述' }}
                        </div>
                </el-card>

                    <!-- 任务节点列表 -->
                    <el-card shadow="hover" class="detail-card nodes-card" v-if="taskInfo.nodes && taskInfo.nodes.length > 0">
                    <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><List /></el-icon>
                                <span>任务节点 ({{ taskInfo.nodes.length }})</span>
                                <el-button 
                                    type="primary" 
                                    size="small" 
                                    :icon="Connection"
                                    @click="handleAutoDispatch"
                                    :loading="dispatching"
                                    style="margin-left: auto;"
                                >
                                    自动派发
                                </el-button>
                            </div>
                    </template>
                        <div class="nodes-list">
                            <el-collapse v-model="expandedNodes" accordion>
                                <el-collapse-item 
                                    v-for="(node, index) in taskInfo.nodes" 
                                    :key="node.id || index"
                                    :name="node.id || index"
                                    class="node-collapse-item"
                                >
                                    <template #title>
                                        <div class="node-item-header">
                                            <div class="node-status-indicator" :class="`status-${node.status}`"></div>
                                            <div class="node-name">{{ node.nodeName }}</div>
                                            <el-tag :type="getNodeStatusType(node.status)" size="small" class="node-status-tag">
                                                {{ getNodeStatusText(node.status) }}
                                            </el-tag>
                                            <div class="node-progress-mini">
                                                <el-progress 
                                                    :percentage="node.progress || 0" 
                                                    :status="node.progress === 100 ? 'success' : undefined"
                                                    :stroke-width="6"
                                                    :show-text="false"
                                                    style="width: 80px;"
                                                />
                                                <span class="progress-text">{{ node.progress || 0 }}%</span>
                                            </div>
                                        </div>
                                    </template>
                                    <div class="node-detail-content">
                                        <div class="node-meta">
                                            <div class="node-meta-item">
                                                <el-icon><User /></el-icon>
                                                <span>负责人: {{ node.leaderName || formatId(node.leaderId) || '-' }}</span>
                                            </div>
                                            <div class="node-meta-item">
                                                <el-icon><Calendar /></el-icon>
                                                <span>截止: {{ formatTime(node.nodeDeadline) || '-' }}</span>
                                            </div>
                                        </div>
                                        <!-- 任务清单组件 -->
                                        <div class="node-checklist">
                                            <TaskChecklist 
                                                :task-node-id="node.id || node.taskNodeId"
                                                :current-employee-id="currentEmployeeId"
                                                :can-add="canEditNode(node)"
                                                @progress-change="(p) => onNodeProgressChange(node, p)"
                                            />
                                        </div>
                                    </div>
                                </el-collapse-item>
                            </el-collapse>
                        </div>
                    </el-card>
                </div>

                <!-- 右侧：流程图和日志 -->
                <div class="detail-right">
                    <!-- 子任务流转图 -->
                    <el-card shadow="hover" class="detail-card flow-card" v-if="taskInfo.nodes && taskInfo.nodes.length > 0">
                        <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><Connection /></el-icon>
                                <span>流转图</span>
                            </div>
                            </template>
                        <div class="flow-chart-container">
                            <div ref="flowChartRef" class="flow-chart" v-loading="flowChartLoading"></div>
                        </div>
                </el-card>

                <!-- 任务日志 -->
                    <el-card shadow="hover" class="detail-card logs-card" v-if="taskLogs && taskLogs.length > 0">
                    <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><Clock /></el-icon>
                                <span>任务日志 ({{ taskLogs.length }})</span>
                            </div>
                    </template>
                        <div class="logs-container">
                            <div 
                            v-for="log in paginatedLogs"
                            :key="log.id"
                                class="log-item"
                                @mouseenter="showLogTooltip($event, log)"
                                @mouseleave="hideTooltip"
                        >
                                <div class="log-dot"></div>
                                <div class="log-content-wrapper">
                                <div class="log-header">
                                        <el-tag :type="getLogTypeColor(log.logType)" size="small" class="log-type-tag">
                                            {{ log.logType }}
                                        </el-tag>
                                        <div class="log-operator">
                                            <el-avatar 
                                                :size="24" 
                                                :src="getOperatorAvatar(log.operatorId)" 
                                                class="log-avatar"
                                            >
                                                {{ getOperatorName(log.operatorId)?.[0] || 'U' }}
                                            </el-avatar>
                                            <span class="operator-name">{{ getOperatorName(log.operatorId) || formatId(log.operatorId) || '未知' }}</span>
                                </div>
                                        <div class="log-time">{{ formatTime(log.createTime) }}</div>
                                    </div>
                                    <div class="log-text">{{ log.logContent }}</div>
                                </div>
                            </div>
                        </div>
                    <div class="log-pagination">
                        <el-pagination
                            v-model:current-page="logPage"
                            v-model:page-size="logPageSize"
                            :page-sizes="[10, 20, 50, 100]"
                            :total="taskLogs.length"
                            layout="total, sizes, prev, pager, next, jumper"
                            @size-change="handleLogSizeChange"
                            @current-change="handleLogPageChange"
                        />
                    </div>
                </el-card>
                </div>
            </div>
        </div>

        <!-- 工具提示 -->
        <div v-if="tooltipVisible" class="tooltip" :style="tooltipStyle">
            <div class="tooltip-title">{{ tooltipTitle }}</div>
            <div class="tooltip-content">{{ tooltipContent }}</div>
        </div>

                <el-empty v-if="!loading && !taskInfo" description="任务不存在或已被删除" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
    ArrowLeft, Document, Calendar, Timer, Clock, User, Connection, List,
    WarningFilled, ArrowUp, Minus, ArrowDown, CircleCheck, Loading
} from '@element-plus/icons-vue';
import { getTask, updateTaskProgress, getMyEmployee, listEmployees, autoDispatchTask } from '@/api';
import TaskChecklist from '@/components/TaskChecklist.vue';
import { useUserStore } from '@/store/user';
import * as echarts from 'echarts';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const taskInfo = ref<any>(null);
const taskLogs = ref<any[]>([]);
const currentEmployeeId = ref<string>('');
const flowChartRef = ref<HTMLElement | null>(null);
const flowChartLoading = ref(false);
let flowChartInstance: echarts.ECharts | null = null;
const employeesMap = ref<Record<string, any>>({});
const userStore = useUserStore();
const dispatching = ref(false);
const expandedNodes = ref<(string | number)[]>([]);

// 日志分页
const logPage = ref(1);
const logPageSize = ref(20);

// 工具提示
const tooltipVisible = ref(false);
const tooltipStyle = ref({ top: '0px', left: '0px' });
const tooltipTitle = ref('');
const tooltipContent = ref('');

// 英雄区域渐变背景
const heroGradient = computed(() => {
    const priority = taskInfo.value?.priority || 3;
    if (priority === 1) {
        return { background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 50%, #4facfe 100%)' };
    } else if (priority === 2) {
        return { background: 'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #30cfd0 100%)' };
    } else if (priority === 3) {
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' };
    } else {
        return { background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%)' };
    }
});

const priorityText = computed(() => {
    const p = taskInfo.value?.priority || 3;
    return p === 1 ? '紧急' : p === 2 ? '高' : p === 3 ? '中' : '低';
});

const priorityType = computed(() => {
    const p = taskInfo.value?.priority || 3;
    return p === 1 ? 'danger' : p === 2 ? 'warning' : p === 3 ? 'info' : '';
});

const statusText = computed(() => {
    const s = taskInfo.value?.status || 0;
    return s === 1 ? '进行中' : s === 2 ? '已完成' : s === 0 ? '待处理' : '未知';
});

const statusType = computed(() => {
    const s = taskInfo.value?.status || 0;
    return s === 2 ? 'success' : s === 1 ? 'warning' : 'info';
});

const progressStatus = computed(() => {
    const progress = taskInfo.value?.progress || 0;
    const deadline = taskInfo.value?.deadline;
    if (!deadline) return undefined;
    const left = Math.ceil((Date.parse(deadline) - Date.now()) / (24 * 3600 * 1000));
    return left < 0 && progress < 100 ? 'exception' : left <= 1 && progress < 100 ? 'warning' : undefined;
});

// 分页后的日志列表
const paginatedLogs = computed(() => {
    const start = (logPage.value - 1) * logPageSize.value;
    const end = start + logPageSize.value;
    return taskLogs.value.slice(start, end);
});

// 格式化ID，如果是ID格式则返回名字，否则返回原值
function formatId(id: string | number | undefined): string {
    if (!id) return '-';
    const idStr = String(id);
    // 检查是否是ID格式 (dev_xxx_001, emp_xxx_01等)
    if (/^(dev_|emp_|task_|node_)/i.test(idStr)) {
        // 尝试从员工映射中查找
        const emp = employeesMap.value[idStr];
        if (emp) {
            return emp.name;
        }
        // 如果找不到，返回ID的简化版本
        return idStr.replace(/^(dev_|emp_|task_|node_)/i, '').replace(/_/g, ' ');
    }
    // 如果不是ID格式，尝试查找员工
    const emp = employeesMap.value[idStr];
    if (emp) {
        return emp.name;
    }
    return idStr;
}

// 工具提示显示
function showTooltip(event: MouseEvent, title: string, content: string) {
    tooltipVisible.value = true;
    tooltipTitle.value = title;
    tooltipContent.value = content;
    tooltipStyle.value = {
        top: `${event.clientY + 10}px`,
        left: `${event.clientX + 10}px`
    };
}

function showNodeTooltip(event: MouseEvent, node: any) {
    const content = `
        节点ID: ${formatId(node.id)}\n
        负责人: ${node.leaderName || formatId(node.leaderId) || '-'}\n
        执行人: ${node.executorNames || '-'}\n
        类型: ${node.nodeType === 1 ? '任务节点' : node.nodeType === 2 ? '条件节点' : '审批节点'}\n
        详情: ${node.nodeDetail || '-'}
    `.trim();
    showTooltip(event, node.nodeName, content);
}

function showLogTooltip(event: MouseEvent, log: any) {
    const content = `
        日志ID: ${formatId(log.id)}\n
        操作者: ${getOperatorName(log.operatorId) || formatId(log.operatorId) || '未知'}\n
        操作时间: ${formatTime(log.createTime)}\n
        内容: ${log.logContent}
    `.trim();
    showTooltip(event, log.logType, content);
}

function hideTooltip() {
    tooltipVisible.value = false;
}

// 分页变化处理
function handleLogPageChange(page: number) {
    logPage.value = page;
}

function handleLogSizeChange(size: number) {
    logPageSize.value = size;
    logPage.value = 1;
}

function formatTime(time: string) {
    if (!time) return '-';
    try {
        const date = new Date(time);
        return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
        return time;
    }
}

function getNodeStatusText(status: number) {
    return status === 1 ? '进行中' : status === 2 ? '已完成' : status === 0 ? '待处理' : '未知';
}

function getNodeStatusType(status: number) {
    return status === 2 ? 'success' : status === 1 ? 'warning' : 'info';
}

function getLogTypeColor(logType: string) {
    if (logType.includes('创建')) return 'success';
    if (logType.includes('完成')) return 'success';
    if (logType.includes('更新')) return 'info';
    if (logType.includes('删除')) return 'danger';
    return '';
}

function getOperatorAvatar(operatorId: string | number): string {
    if (!operatorId) return '';
    const emp = employeesMap.value[String(operatorId)];
    return emp?.avatar || '';
}

function getOperatorName(operatorId: string | number): string {
    if (!operatorId) return '未知';
    const emp = employeesMap.value[String(operatorId)];
    return emp?.name || formatId(String(operatorId));
}

function goBack() {
    router.go(-1);
}

// 自动派发任务节点
async function handleAutoDispatch() {
    if (!taskInfo.value?.id) {
        ElMessage.warning('任务ID不存在');
        return;
    }

    try {
        await ElMessageBox.confirm(
            '确认要对所有未派发的任务节点执行自动派发吗？系统将根据规则自动分配执行人。',
            '确认自动派发',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'info',
            }
        );

        dispatching.value = true;
        const resp = await autoDispatchTask({ taskId: taskInfo.value.id });

        if (resp.data.code === 200) {
            const result = resp.data.data;
            const successCount = result.successCount || 0;
            const failCount = result.failCount || 0;
            const totalNodes = result.totalNodes || 0;

            if (successCount > 0) {
                ElMessage.success(`自动派发完成：成功 ${successCount} 个，失败 ${failCount} 个，共 ${totalNodes} 个节点`);
            } else if (failCount > 0) {
                ElMessage.warning(`自动派发完成：失败 ${failCount} 个节点`);
            } else {
                ElMessage.info('没有需要派发的节点');
            }

            // 重新加载任务详情
            await loadTaskDetail();
        } else {
            ElMessage.error(resp.data.msg || '自动派发失败');
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('自动派发失败:', error);
            ElMessage.error('自动派发失败: ' + (error.message || '未知错误'));
        }
    } finally {
        dispatching.value = false;
    }
}

// 判断是否可以编辑进度
function canEditProgress(node: any): boolean {
    if (!currentEmployeeId.value) return false;
    const leaderId = node.leaderId || node.leaderID || node.LeaderID;
    const executorId = node.executorId || node.executorID || node.ExecutorID;
    const executorIds = Array.isArray(node.executorIds) ? node.executorIds : [];
    return leaderId === currentEmployeeId.value || 
                    executorId === currentEmployeeId.value || 
                    executorIds.includes(currentEmployeeId.value);
}

// 判断是否是任务节点的执行人（用于清单组件创建权限）
function canEditNode(node: any): boolean {
    if (!currentEmployeeId.value) return false;
    const executorId = node.executorId || node.executorID || node.ExecutorID || '';
    const executorIds = Array.isArray(node.executorIds) ? node.executorIds : [];
    // 检查是否是执行人（executorId可能是逗号分隔的多个ID）
    const executorList = executorId.split(',').map((id: string) => id.trim()).filter(Boolean);
    return executorList.includes(currentEmployeeId.value) || 
           executorIds.includes(currentEmployeeId.value);
}

// 清单进度变化时更新节点进度
function onNodeProgressChange(node: any, progress: number) {
    node.progress = progress;
}

// 更新节点进度
async function updateNodeProgress(node: any, progress: number) {
    if (progress < 0 || progress > 100) {
        ElMessage.warning('进度值必须在0-100之间');
        return;
    }

    const nodeId = node.id || node.nodeId || node.taskNodeId;
    if (!nodeId) {
        ElMessage.error('节点ID不存在');
        return;
    }

    node.updating = true;
    try {
        const resp = await updateTaskProgress({
            taskNodeId: nodeId,
            progress: progress,
        });

        if (resp.data.code !== 200) {
            ElMessage.error(resp.data.msg || '更新进度失败');
            node.progress = node.originalProgress || 0;
            return;
        }

        ElMessage.success('进度更新成功');
        node.originalProgress = progress;
        if (progress >= 100) {
            setTimeout(() => {
                loadTaskDetail();
            }, 1000);
        }
    } catch (error: any) {
        console.error('更新进度失败:', error);
        ElMessage.error('更新进度失败: ' + (error.message || '未知错误'));
        node.progress = node.originalProgress || 0;
    } finally {
        node.updating = false;
    }
}

async function loadTaskDetail() {
    const taskId = route.params.id as string;
    if (!taskId) {
        ElMessage.error('任务ID不能为空');
        router.go(-1);
        return;
    }

    loading.value = true;
    try {
        const resp = await getTask({ taskId });
        if (resp.data.code !== 200) {
            ElMessage.error(resp.data.msg || '获取任务详情失败');
            return;
        }

        const data = resp.data?.data || {};
        taskInfo.value = data;
        taskLogs.value = data.logs || [];
        logPage.value = 1;

        if (taskInfo.value.nodes) {
            taskInfo.value.nodes = taskInfo.value.nodes.map((node: any) => {
                const leaderId = node.leaderId || node.leaderID || node.LeaderID || '';
                const executorIds = Array.isArray(node.executorIds) ? node.executorIds : (node.executorId ? [node.executorId] : []);
                const leader = leaderId ? employeesMap.value[String(leaderId)] : null;
                const executors = executorIds.map((eid: any) => employeesMap.value[String(eid)]).filter(Boolean);
                
                return {
                ...node,
                    leaderId,
                executorId: node.executorId || node.executorID || node.ExecutorID || '',
                    executorIds,
                    leaderName: leader?.name || formatId(leaderId),
                    leaderAvatar: leader?.avatar || '',
                    executorNames: executors.length > 0 
                        ? executors.map((e: any) => e.name).join(', ') 
                        : executorIds.map((eid: any) => formatId(eid)).join(', '),
                    executorAvatars: executors.map((e: any) => ({ name: e.name, avatar: e.avatar })),
                progress: node.progress || 0,
                    originalProgress: node.progress || 0,
                    updating: false,
                };
            });
            
            nextTick(() => {
                renderFlowChart();
            });
        }
    } catch (error: any) {
        console.error('加载任务详情失败:', error);
        ElMessage.error('加载任务详情失败: ' + (error.message || '未知错误'));
    } finally {
        loading.value = false;
    }
}

async function loadEmployees() {
    try {
        const companyId = userStore.companyId || '';
        if (!companyId) {
        const empRes = await getMyEmployee();
            const emp = empRes?.data?.data || {};
            const cid = emp.companyId || emp.CompanyId || '';
            if (cid) {
                const resp = await listEmployees({ page: 1, pageSize: 200, companyId: cid });
                if (resp.data?.code === 200) {
                    const list = resp.data?.data?.list || [];
                    list.forEach((e: any) => {
                        const empId = e.id || e.employeeId || e.EmployeeId;
                        if (empId) {
                            employeesMap.value[String(empId)] = {
                                id: empId,
                                name: e.realName || e.name || e.RealName || '未知',
                                avatar: e.avatar || '',
                            };
                        }
                    });
                }
            }
        } else {
            const resp = await listEmployees({ page: 1, pageSize: 200, companyId });
            if (resp.data?.code === 200) {
                const list = resp.data?.data?.list || [];
                list.forEach((e: any) => {
                    const empId = e.id || e.employeeId || e.EmployeeId;
                    if (empId) {
                        employeesMap.value[String(empId)] = {
                            id: empId,
                            name: e.realName || e.name || e.RealName || '未知',
                            avatar: e.avatar || '',
                        };
                    }
                });
            }
        }
    } catch (error: any) {
        console.error('加载员工列表失败:', error);
    }
}

// 渲染子任务流转图
function renderFlowChart() {
    if (!flowChartRef.value || !taskInfo.value?.nodes || taskInfo.value.nodes.length === 0) {
        return;
    }

    flowChartLoading.value = true;
    
    try {
        if (flowChartInstance) {
            flowChartInstance.dispose();
        }

        flowChartInstance = echarts.init(flowChartRef.value);

        const nodes: any[] = [];
        const edges: any[] = [];
        const nodeMap = new Map<string, any>();

        nodes.push({
            id: 'start',
            name: '开始',
            symbolSize: 60,
            itemStyle: { color: '#667eea' },
            label: { fontSize: 14, fontWeight: 'bold' }
        });

        taskInfo.value.nodes.forEach((node: any, index: number) => {
            const nodeId = node.id || node.taskNodeId || `node_${index}`;
            const status = node.status || 0;
            const progress = node.progress || 0;
            
            let color = '#9ca3af';
            if (status === 2) color = '#22c55e';
            else if (status === 1) color = '#eab308';
            else if (status === 0) color = '#3b82f6';

            const leader = node.leaderId ? employeesMap.value[String(node.leaderId)] : null;
            const leaderName = leader?.name || formatId(node.leaderId) || '-';
            
            nodes.push({
                id: nodeId,
                name: node.nodeName || '未命名节点',
                symbolSize: 100,
                itemStyle: { 
                    color: color,
                    borderColor: '#fff',
                    borderWidth: 3
                },
                label: { 
                    fontSize: 12, 
                    fontWeight: '600',
                    formatter: (params: any) => {
                        const name = params.name;
                        const maxLen = 10;
                        return name.length > maxLen ? name.substring(0, maxLen) + '...' : name;
                    },
                    position: 'inside',
                    color: '#1f2937'
                },
                nodeData: {
                    status,
                    progress,
                    leader: leaderName,
                    leaderId: node.leaderId,
                    executor: node.executorNames,
                    deadline: node.nodeDeadline
                }
            });

            nodeMap.set(nodeId, node);
        });

        nodes.push({
            id: 'end',
            name: '结束',
            symbolSize: 60,
            itemStyle: { color: '#f5576c' },
            label: { fontSize: 14, fontWeight: 'bold' }
        });

        taskInfo.value.nodes.forEach((node: any, index: number) => {
            const nodeId = node.id || node.taskNodeId || `node_${index}`;
            const prerequisiteNodes = node.prerequisiteNodes || node.exNodeIds || '';
            
            if (prerequisiteNodes && prerequisiteNodes !== '' && prerequisiteNodes !== 'null') {
                const prereqIds = prerequisiteNodes.split(',').map((id: string) => id.trim()).filter(Boolean);
                prereqIds.forEach((prereqId: string) => {
                    const sourceId = prereqId === 'start' ? 'start' : prereqId;
                    if (nodeMap.has(sourceId) || sourceId === 'start') {
                        edges.push({
                            source: sourceId,
                            target: nodeId,
                            lineStyle: {
                                color: '#6366f1',
                                width: 2,
                                curveness: 0.2
                            }
                        });
                    }
                });
            } else {
                edges.push({
                    source: 'start',
                    target: nodeId,
                    lineStyle: {
                        color: '#6366f1',
                        width: 2,
                        curveness: 0.2
                    }
                });
            }
        });

        const hasOutgoing = new Set(edges.map(e => e.source));
        taskInfo.value.nodes.forEach((node: any, index: number) => {
            const nodeId = node.id || node.taskNodeId || `node_${index}`;
            if (!hasOutgoing.has(nodeId)) {
                edges.push({
                    source: nodeId,
                    target: 'end',
                    lineStyle: {
                        color: '#6366f1',
                        width: 2,
                        curveness: 0.2
                    }
                });
            }
        });

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(31, 41, 55, 0.95)',
                borderColor: '#667eea',
                borderWidth: 1,
                textStyle: {
                    color: '#f9fafb',
                    fontSize: 13
                },
                padding: [12, 16],
                formatter: (params: any) => {
                    if (params.dataType === 'node') {
                        const nodeData = params.data.nodeData;
                        if (nodeData) {
                            const statusColor = nodeData.status === 2 ? '#22c55e' : 
                                              nodeData.status === 1 ? '#eab308' : 
                                              nodeData.status === 0 ? '#3b82f6' : '#9ca3af';
                            return `
                                <div style="padding: 4px 0;">
                                    <div style="font-weight: 700; font-size: 15px; margin-bottom: 10px; color: #ffffff;">
                                        ${params.data.name}
                                    </div>
                                    <div style="font-size: 12px; line-height: 1.8; color: #e5e7eb;">
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></span>
                                            <span>状态: <strong style="color: ${statusColor};">${getNodeStatusText(nodeData.status)}</strong></span>
                                        </div>
                                        <div style="margin-bottom: 6px;">📊 进度: <strong>${nodeData.progress}%</strong></div>
                                        <div style="margin-bottom: 6px;">👤 负责人: <strong>${nodeData.leader || '-'}</strong></div>
                                        <div style="margin-bottom: 6px;">👥 执行人: ${nodeData.executor || '-'}</div>
                                        <div>📅 截止: ${nodeData.deadline || '-'}</div>
                                    </div>
                                </div>
                            `;
                        }
                        return params.data.name;
                    }
                    return `<div style="color: #e5e7eb;">${params.data.source} → ${params.data.target}</div>`;
                }
            },
            series: [{
                type: 'graph',
                layout: 'force',
                data: nodes,
                links: edges,
                roam: true,
                draggable: true,
                symbolSize: (value: number, params: any) => {
                    if (params.data.id === 'start' || params.data.id === 'end') {
                        return 70;
                    }
                    return 110;
                },
                label: {
                    show: true,
                    position: 'inside',
                    fontSize: 13,
                    fontWeight: '600',
                    color: '#1f2937'
                },
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 3
                },
                symbol: 'circle',
                lineStyle: {
                    color: '#6366f1',
                    width: 2.5,
                    curveness: 0.3,
                    opacity: 0.8
                },
                emphasis: {
                    focus: 'adjacency',
                    scale: true,
                    lineStyle: {
                        width: 4,
                        color: '#2563eb'
                    },
                    itemStyle: {
                        shadowBlur: 15,
                        shadowColor: 'rgba(37, 99, 235, 0.4)',
                        borderWidth: 3
                    }
                },
                force: {
                    repulsion: 2500,
                    gravity: 0.15,
                    edgeLength: 180,
                    layoutAnimation: true,
                    friction: 0.8
                },
                animation: true,
                animationDuration: 1000,
                animationEasing: 'cubicOut'
            }]
        };

        flowChartInstance.setOption(option);

        window.addEventListener('resize', () => {
            flowChartInstance?.resize();
        });

    } catch (error: any) {
        console.error('渲染流转图失败:', error);
        ElMessage.error('渲染流转图失败');
    } finally {
        flowChartLoading.value = false;
    }
}

onMounted(async () => {
    try {
        const empRes = await getMyEmployee();
        const emp = empRes?.data?.data || empRes?.data?.employee || {};
        currentEmployeeId.value = emp.id || emp.employeeId || emp.Id || emp.EmployeeId || '';
    } catch (error: any) {
        console.error('获取当前用户信息失败:', error);
    }
    
    await loadEmployees();
    loadTaskDetail();
});

watch(() => taskInfo.value?.nodes, () => {
    nextTick(() => {
        renderFlowChart();
    });
}, { deep: true });
</script>

<style scoped>
.task-detail-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8ecf1 100%);
}

/* 英雄区域 */
.hero-section {
    position: relative;
    padding: 40px 24px;
    color: white;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.hero-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
}

.hero-content {
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
}

.back-btn {
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 14px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

.back-btn:hover {
    color: white !important;
    transform: translateX(-4px);
}

.hero-title {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.task-title {
    font-size: 36px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    line-height: 1.2;
}

.hero-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.hero-tag {
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.2) !important;
}

.tag-icon {
    font-size: 16px;
}

.progress-badge {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 16px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
}

.hero-progress {
    width: 120px;
}

.progress-text {
    font-weight: 700;
    font-size: 16px;
    min-width: 50px;
}

/* 内容区域 */
.content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
}

/* 关键信息网格 */
.key-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

.info-card {
    background: white;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    border: 2px solid transparent;
}

.info-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
}

.info-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.info-content {
    flex: 1;
    min-width: 0;
}

.info-label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
    margin-bottom: 6px;
}

.info-value {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: -0.01em;
    word-break: break-word;
}

/* 详细信息网格 */
.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
}

@media (max-width: 1200px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }
}

.detail-left,
.detail-right {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.detail-card {
    border-radius: 16px;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    overflow: hidden;
}

.detail-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.detail-card :deep(.el-card__header) {
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border-bottom: 2px solid #e5e7eb;
    padding: 20px 24px;
}

.card-header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    width: 100%;
}

.title-icon {
    font-size: 20px;
    color: #2563eb;
}

/* 描述卡片 */
.description-content {
    font-size: 15px;
    line-height: 1.8;
    color: #4b5563;
    padding: 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-radius: 12px;
    border-left: 4px solid #667eea;
}

/* 节点列表 */
.nodes-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.node-item {
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border-radius: 12px;
    padding: 20px;
    border: 2px solid #e5e7eb;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}

.node-item:hover {
    border-color: #667eea;
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.15);
    transform: translateX(4px);
}

.node-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.node-status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.node-status-indicator.status-0 {
    background: #3b82f6;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}

.node-status-indicator.status-1 {
    background: #eab308;
    box-shadow: 0 0 8px rgba(234, 179, 8, 0.5);
    animation: pulse 2s ease-in-out infinite;
}

.node-status-indicator.status-2 {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.node-name {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.node-status-tag {
    font-weight: 500;
}

.node-meta {
    display: flex;
    gap: 20px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #6b7280;
}

.node-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.node-progress {
    margin-top: 8px;
}

/* 节点折叠面板样式 */
.node-collapse-item {
    margin-bottom: 12px;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #e5e7eb;
    transition: all 0.3s ease;
}

.node-collapse-item:hover {
    border-color: #c7d2fe;
}

.node-collapse-item :deep(.el-collapse-item__header) {
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    padding: 16px 20px;
    height: auto;
    line-height: 1.5;
    border-bottom: none;
}

.node-collapse-item :deep(.el-collapse-item__content) {
    padding: 0;
    background: #f9fafb;
}

.node-collapse-item :deep(.el-collapse-item__wrap) {
    border-top: 1px solid #e5e7eb;
}

.node-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding-right: 16px;
}

.node-progress-mini {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
}

.node-progress-mini .progress-text {
    font-size: 12px;
    font-weight: 600;
    color: #6366f1;
    min-width: 36px;
}

.node-detail-content {
    padding: 16px 20px;
}

.node-detail-content .node-meta {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px dashed #e5e7eb;
}

.node-checklist {
    margin-top: 8px;
}

/* 流程图 */
.flow-chart-container {
    width: 100%;
    min-height: 500px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #ffffff 100%);
    border-radius: 12px;
    padding: 20px;
    border: 2px solid #e5e7eb;
}

.flow-chart {
    width: 100%;
    height: 500px;
    border-radius: 8px;
}

/* 日志 */
.logs-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 600px;
    overflow-y: auto;
    padding-right: 8px;
}

.logs-container::-webkit-scrollbar {
    width: 6px;
}

.logs-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.logs-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.log-item {
    display: flex;
    gap: 16px;
    position: relative;
    transition: all 0.3s ease;
    cursor: pointer;
}

.log-item:hover {
    transform: translateX(4px);
}

.log-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    flex-shrink: 0;
    margin-top: 6px;
    box-shadow: 0 0 8px rgba(102, 126, 234, 0.5);
    position: relative;
}

.log-dot::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(102, 126, 234, 0.2);
    animation: ripple 2s ease-in-out infinite;
}

@keyframes ripple {
    0% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 1;
    }
    100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
    }
}

.log-content-wrapper {
    flex: 1;
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border-radius: 12px;
    padding: 16px;
    border: 2px solid #e5e7eb;
    transition: all 0.3s ease;
}

.log-item:hover .log-content-wrapper {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.log-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.log-type-tag {
    font-weight: 500;
}

.log-operator {
    display: flex;
    align-items: center;
    gap: 8px;
}

.log-avatar {
    border: 2px solid #e5e7eb;
}

.operator-name {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
}

.log-time {
    font-size: 12px;
    color: #9ca3af;
    margin-left: auto;
}

.log-text {
    font-size: 14px;
    line-height: 1.6;
    color: #4b5563;
}

.log-pagination {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
    display: flex;
    justify-content: center;
}

/* 工具提示 */
.tooltip {
    position: fixed;
    background: linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    pointer-events: none;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 300px;
    white-space: pre-line;
    animation: tooltipFadeIn 0.2s ease;
}

@keyframes tooltipFadeIn {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.tooltip-title {
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 6px;
    color: #f9fafb;
}

.tooltip-content {
    font-size: 12px;
    line-height: 1.6;
    color: #e5e7eb;
}

/* 响应式 */
@media (max-width: 768px) {
    .task-title {
        font-size: 24px;
    }
    
    .key-info-grid {
        grid-template-columns: 1fr;
    }
    
    .detail-grid {
        grid-template-columns: 1fr;
    }
    
    .hero-meta {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
