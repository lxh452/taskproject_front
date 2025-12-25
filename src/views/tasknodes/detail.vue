<template>
    <div class="tasknode-detail-page">
        <!-- 顶部导航 -->
        <div class="page-header">
            <el-button link @click="goBack" class="back-btn">
                <el-icon><ArrowLeft /></el-icon>
                <span>返回</span>
            </el-button>
            <div class="breadcrumb">
                <span>任务节点</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="current">{{ nodeInfo?.nodeName || '详情' }}</span>
            </div>
        </div>

        <div v-loading="loading" class="content-wrapper">
            <template v-if="nodeInfo">
                <!-- 节点基本信息卡片 -->
                <el-card class="info-card" shadow="hover">
                    <div class="node-header">
                        <div class="node-title-section">
                            <div class="status-indicator" :class="`status-${nodeInfo.status}`"></div>
                            <h1 class="node-title">{{ nodeInfo.nodeName }}</h1>
                            <el-tag :type="getStatusType(nodeInfo.status)" size="large">
                                {{ getStatusText(nodeInfo.status) }}
                            </el-tag>
                        </div>
                        <div class="node-actions">
                            <el-button 
                                v-if="canSubmitApproval" 
                                type="success" 
                                @click="submitApproval"
                            >
                                提交审批
                            </el-button>
                            <el-button 
                                v-if="canEdit" 
                                type="primary" 
                                :icon="Edit"
                                @click="editNode"
                            >
                                编辑节点
                            </el-button>
                        </div>
                    </div>

                    <!-- 进度条 -->
                    <div class="progress-section">
                        <div class="progress-label">
                            <span>完成进度</span>
                            <span class="progress-value">{{ nodeInfo.progress || 0 }}%</span>
                        </div>
                        <el-progress 
                            :percentage="nodeInfo.progress || 0" 
                            :status="nodeInfo.progress === 100 ? 'success' : undefined"
                            :stroke-width="12"
                            :show-text="false"
                        />
                        <div class="progress-hint">
                            进度根据清单完成情况自动计算
                        </div>
                    </div>

                    <!-- 详细信息网格 -->
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-icon"><el-icon><User /></el-icon></div>
                            <div class="info-content">
                                <div class="info-label">负责人</div>
                                <div class="info-value">{{ nodeInfo.leaderName || '-' }}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon"><el-icon><UserFilled /></el-icon></div>
                            <div class="info-content">
                                <div class="info-label">执行人</div>
                                <div class="info-value">{{ nodeInfo.executorNames || '-' }}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon"><el-icon><Calendar /></el-icon></div>
                            <div class="info-content">
                                <div class="info-label">开始时间</div>
                                <div class="info-value">{{ formatDate(nodeInfo.nodeStartTime) }}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon deadline-icon"><el-icon><Clock /></el-icon></div>
                            <div class="info-content">
                                <div class="info-label">截止时间</div>
                                <div class="info-value" :class="{ 'overdue': isOverdue }">
                                    {{ formatDate(nodeInfo.nodeDeadline) }}
                                    <el-tag v-if="isOverdue" type="danger" size="small">已逾期</el-tag>
                                </div>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon"><el-icon><OfficeBuilding /></el-icon></div>
                            <div class="info-content">
                                <div class="info-label">所属部门</div>
                                <div class="info-value">{{ nodeInfo.departmentName || '-' }}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon"><el-icon><Timer /></el-icon></div>
                            <div class="info-content">
                                <div class="info-label">预计天数</div>
                                <div class="info-value">{{ nodeInfo.estimatedDays || 0 }} 天</div>
                            </div>
                        </div>
                    </div>

                    <!-- 节点详情 -->
                    <div class="node-detail" v-if="nodeInfo.nodeDetail">
                        <div class="detail-title">
                            <el-icon><Document /></el-icon>
                            <span>节点详情</span>
                        </div>
                        <div class="detail-content">
                            {{ nodeInfo.nodeDetail }}
                        </div>
                    </div>
                </el-card>

                <!-- 任务清单卡片 -->
                <el-card class="checklist-card" shadow="hover">
                    <TaskChecklist 
                        :task-node-id="nodeId"
                        :current-employee-id="currentEmployeeId"
                        :can-add="canEdit"
                        :node-status="nodeInfo?.status"
                        :node-progress="nodeInfo?.progress"
                        @progress-change="onProgressChange"
                        @approval-submitted="handleApprovalSubmitted"
                        ref="checklistRef"
                    />
                </el-card>

                <!-- 关联任务卡片 -->
                <el-card class="task-card" shadow="hover" v-if="nodeInfo.taskId">
                    <template #header>
                        <div class="card-header">
                            <el-icon><Connection /></el-icon>
                            <span>关联任务</span>
                        </div>
                    </template>
                    <div class="task-link-content">
                        <el-button 
                            type="primary" 
                            link 
                            @click="goToTask"
                        >
                            {{ taskInfo?.taskTitle || '查看任务详情' }}
                            <el-icon class="link-icon"><ArrowRight /></el-icon>
                        </el-button>
                    </div>
                </el-card>
            </template>

            <el-empty v-else-if="!loading" description="节点不存在或已被删除" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
    ArrowLeft, ArrowRight, Edit, User, UserFilled, Calendar, 
    Clock, OfficeBuilding, Timer, Document, Connection 
} from '@element-plus/icons-vue';
import TaskChecklist from '@/components/TaskChecklist.vue';
import { getMyEmployee, listTaskNodesByTask, getTask, submitTaskNodeCompletionApproval } from '@/api';
import request from '@/utils/request';
import { ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const nodeId = computed(() => route.params.id as string);
const nodeInfo = ref<any>(null);
const taskInfo = ref<any>(null);
const currentEmployeeId = ref('');
const checklistRef = ref<any>(null);

// 计算属性
const canEdit = computed(() => {
    if (!nodeInfo.value || !currentEmployeeId.value) return false;
    const leaderId = nodeInfo.value.leaderId || '';
    const executorId = nodeInfo.value.executorId || '';
    const executorIds = nodeInfo.value.executorIds || [];
    return leaderId === currentEmployeeId.value || 
           executorId === currentEmployeeId.value ||
           executorIds.includes(currentEmployeeId.value);
});

const isOverdue = computed(() => {
    if (!nodeInfo.value?.nodeDeadline) return false;
    return new Date(nodeInfo.value.nodeDeadline) < new Date() && nodeInfo.value.status !== 2;
});

// 是否可以提交审批：节点状态为进行中（1），进度100%，且当前用户是执行人
const canSubmitApproval = computed(() => {
    if (!nodeInfo.value || !currentEmployeeId.value) return false;
    const executorId = nodeInfo.value.executorId || '';
    const executorIds = nodeInfo.value.executorIds || [];
    const isExecutor = executorId === currentEmployeeId.value || executorIds.includes(currentEmployeeId.value);
    return nodeInfo.value.status === 1 && 
           (nodeInfo.value.progress || 0) >= 100 && 
           isExecutor;
});

// 方法
function getStatusType(status: number) {
    const statusTypeMap: Record<number, string> = {
        0: 'info',
        1: 'warning',
        2: 'success',
        3: 'danger'
    };
    return statusTypeMap[status] || 'info';
}

function getStatusText(status: number) {
    const statusMap: Record<number, string> = {
        0: '待处理',
        1: '进行中',
        2: '已完成',
        3: '已逾期'
    };
    return statusMap[status] || '未知';
}

function formatDate(date: string) {
    if (!date) return '-';
    try {
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return date;
    }
}

function goBack() {
    router.go(-1);
}

function goToTask() {
    if (nodeInfo.value?.taskId) {
        router.push(`/tasks/detail/${nodeInfo.value.taskId}`);
    }
}

function editNode() {
    // 可以实现编辑节点的逻辑
    ElMessage.info('编辑功能开发中...');
}

function onProgressChange(progress: number) {
    if (nodeInfo.value) {
        nodeInfo.value.progress = progress;
    }
}

function handleApprovalSubmitted() {
    // 审批提交后重新加载节点信息
    loadNodeDetail();
}

async function submitApproval() {
    if (!nodeInfo.value) return;
    
    try {
        await ElMessageBox.confirm(
            '确定要提交任务节点完成审批吗？提交后需要等待项目负责人审批。',
            '确认提交审批',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info'
            }
        );

        const resp = await submitTaskNodeCompletionApproval({ nodeId: nodeId.value });
        if (resp.data.code === 200) {
            ElMessage.success('提交审批成功，等待项目负责人审批');
            await loadNodeDetail(); // 重新加载节点信息
        } else {
            ElMessage.error(resp.data.msg || '提交审批失败');
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('提交审批失败:', error);
            ElMessage.error('提交审批失败');
        }
    }
}

async function loadCurrentEmployee() {
    try {
        const resp = await getMyEmployee();
        if (resp.data.code === 200) {
            const emp = resp.data.data || {};
            currentEmployeeId.value = emp.id || emp.employeeId || '';
        }
    } catch (error: any) {
        console.error('获取当前员工信息失败:', error);
    }
}

async function loadNodeDetail() {
    if (!nodeId.value) {
        ElMessage.error('节点ID不能为空');
        router.go(-1);
        return;
    }

    loading.value = true;
    try {
        // 使用新的API获取节点详情（包含审批列表）
        const resp = await request({ 
            url: '/tasknode/get', 
            method: 'post', 
            data: { taskNodeId: nodeId.value } 
        });
        
        if (resp.data.code === 200) {
            const data = resp.data.data || {};
            const taskNode = data.taskNode || data;
            const taskId = taskNode.taskId || taskNode.TaskId || '';
            
            // 如果有taskId，直接跳转到任务详情页面
            if (taskId) {
                router.replace(`/tasks/detail/${taskId}`);
                return;
            }
            
            // 如果没有taskId，显示错误信息
            ElMessage.warning('无法获取任务节点所属的任务信息');
            router.go(-1);
        } else {
            ElMessage.error(resp.data.msg || '加载节点详情失败');
            router.go(-1);
        }
    } catch (error: any) {
        console.error('加载节点详情失败:', error);
        ElMessage.error('加载节点详情失败');
        router.go(-1);
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await loadCurrentEmployee();
    await loadNodeDetail();
});
</script>

<style scoped>
.tasknode-detail-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
    padding-bottom: 40px;
}

.page-header {
    background: #ffffff;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 100;
}

.back-btn {
    color: #6b7280;
    font-size: 14px;
    transition: all 0.2s ease;
}

.back-btn:hover {
    color: #6366f1;
    transform: translateX(-2px);
}

.breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #9ca3af;
}

.breadcrumb .current {
    color: #1f2937;
    font-weight: 500;
}

.content-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* 信息卡片 */
.info-card {
    border-radius: 16px;
    border: none;
    overflow: hidden;
}

.info-card :deep(.el-card__body) {
    padding: 24px;
}

.node-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.node-title-section {
    display: flex;
    align-items: center;
    gap: 12px;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.status-indicator.status-0 {
    background: #6b7280;
    box-shadow: 0 0 8px rgba(107, 114, 128, 0.5);
}

.status-indicator.status-1 {
    background: #f59e0b;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
    animation: pulse 2s ease-in-out infinite;
}

.status-indicator.status-2 {
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.status-indicator.status-3 {
    background: #ef4444;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.node-title {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
}

/* 进度区域 */
.progress-section {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
}

.progress-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: #6b7280;
}

.progress-value {
    font-size: 18px;
    font-weight: 700;
    color: #6366f1;
}

.progress-hint {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 8px;
    text-align: center;
}

/* 信息网格 */
.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.info-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 10px;
    transition: all 0.2s ease;
}

.info-item:hover {
    background: #f1f5f9;
    transform: translateY(-2px);
}

.info-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    flex-shrink: 0;
}

.info-icon.deadline-icon {
    background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
}

.info-content {
    flex: 1;
    min-width: 0;
}

.info-label {
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 4px;
}

.info-value {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    word-break: break-word;
}

.info-value.overdue {
    color: #ef4444;
}

/* 节点详情 */
.node-detail {
    border-top: 1px solid #e5e7eb;
    padding-top: 20px;
}

.detail-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
}

.detail-content {
    font-size: 14px;
    line-height: 1.8;
    color: #4b5563;
    background: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid #6366f1;
}

/* 清单卡片 */
.checklist-card {
    border-radius: 16px;
    border: none;
}

.checklist-card :deep(.el-card__body) {
    padding: 0;
}

/* 任务卡片 */
.task-card {
    border-radius: 16px;
    border: none;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
}

.task-link-content {
    padding: 8px 0;
}

.link-icon {
    margin-left: 4px;
    transition: transform 0.2s ease;
}

.task-link-content .el-button:hover .link-icon {
    transform: translateX(4px);
}

/* 响应式 */
@media (max-width: 768px) {
    .content-wrapper {
        padding: 16px;
    }
    
    .node-header {
        flex-direction: column;
        gap: 16px;
    }
    
    .node-title {
        font-size: 20px;
    }
    
    .info-grid {
        grid-template-columns: 1fr;
    }
}
</style>

