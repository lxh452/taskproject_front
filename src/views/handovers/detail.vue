<template>
    <div class="handover-detail-page">
        <!-- 页面标题 -->
        <div class="page-header">
            <div class="header-left">
                <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
                <h1>审批详情</h1>
                <el-tag :type="statusInfo.type" size="large" class="status-tag">{{ statusInfo.text }}</el-tag>
            </div>
        </div>

        <div class="content-wrapper" v-loading="loading">
            <!-- 主要信息卡片 -->
            <div class="main-card">
                <!-- 交接双方 -->
                <div class="parties-section">
                    <div class="party from-party">
                        <div class="party-label">交出人</div>
                        <div class="party-info">
                            <el-avatar :size="56" class="party-avatar from">{{ handover.fromEmployeeName?.charAt(0) }}</el-avatar>
                            <div class="party-details">
                                <span class="party-name">{{ handover.fromEmployeeName || '-' }}</span>
                                <span class="party-dept">{{ handover.fromDepartmentName || '' }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="arrow-section">
                        <div class="arrow-line"></div>
                        <el-icon class="arrow-icon"><Right /></el-icon>
                        <div class="arrow-line"></div>
                    </div>
                    <div class="party to-party">
                        <div class="party-label">{{ isLeaveRequest ? '审批人' : '接收人' }}</div>
                        <div class="party-info">
                            <el-avatar :size="56" class="party-avatar to">
                                {{ isLeaveRequest ? '审' : (handover.toEmployeeName?.charAt(0) || '-') }}
                            </el-avatar>
                            <div class="party-details">
                                <span class="party-name">{{ isLeaveRequest ? (handover.approverName || '待指定审批人') : (handover.toEmployeeName || '-') }}</span>
                                <span class="party-dept">{{ isLeaveRequest ? '' : (handover.toDepartmentName || '') }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 审批流程进度 -->
                <div class="approval-progress">
                    <div class="progress-title">审批流程</div>
                    <el-steps :active="currentStep" align-center finish-status="success">
                        <el-step title="发起申请" :description="handover.createTime || ''">
                            <template #icon>
                                <el-icon><Edit /></el-icon>
                            </template>
                        </el-step>
                        <el-step :title="isLeaveRequest ? '员工确认' : '接收人确认'" :description="getStepDesc(1)">
                            <template #icon>
                                <el-icon><User /></el-icon>
                            </template>
                        </el-step>
                        <el-step title="上级审批" :description="getStepDesc(2)">
                            <template #icon>
                                <el-icon><UserFilled /></el-icon>
                            </template>
                        </el-step>
                        <el-step title="完成" :description="handover.status === 2 ? '交接生效' : ''">
                            <template #icon>
                                <el-icon><CircleCheckFilled /></el-icon>
                            </template>
                        </el-step>
                    </el-steps>
                </div>

                <!-- 任务信息 / 离职信息 -->
                <div class="info-section" v-if="!isLeaveRequest">
                    <div class="section-title">
                        <el-icon><Document /></el-icon>
                        <span>任务信息</span>
                    </div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">任务名称</span>
                            <span class="info-value task-title">{{ handover.taskTitle || '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">任务ID</span>
                            <span class="info-value mono">{{ handover.taskId || '-' }}</span>
                        </div>
                    </div>
                </div>
                <div class="info-section" v-else>
                    <div class="section-title">
                        <el-icon><User /></el-icon>
                        <span>离职信息</span>
                    </div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">申请类型</span>
                            <span class="info-value task-title">{{ handover.taskTitle || '离职审批' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">申请人</span>
                            <span class="info-value mono">{{ handover.fromEmployeeName || '-' }}</span>
                        </div>
                    </div>
                </div>

                <!-- 涉及的任务（离职交接时显示） -->
                <div class="info-section" v-if="isLeaveRequest && handover.involvedTasks && handover.involvedTasks.length > 0">
                    <div class="section-title">
                        <el-icon><Document /></el-icon>
                        <span>涉及的任务 ({{ handover.involvedTasks.length }})</span>
                    </div>
                    <div class="involved-list">
                        <div 
                            v-for="task in handover.involvedTasks" 
                            :key="task.taskId" 
                            class="involved-item"
                            @click="goToTask(task.taskId)"
                        >
                            <div class="involved-main">
                                <span class="involved-name">{{ task.taskTitle }}</span>
                                <el-tag size="small" :type="getTaskStatusType(task.status)">
                                    {{ getTaskStatusText(task.status) }}
                                </el-tag>
                            </div>
                            <div class="involved-meta">
                                <span class="involved-role">{{ task.role }}</span>
                                <span class="involved-deadline">截止: {{ task.deadline }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 涉及的任务节点（离职交接时显示） -->
                <div class="info-section" v-if="isLeaveRequest && handover.involvedNodes && handover.involvedNodes.length > 0">
                    <div class="section-title">
                        <el-icon><List /></el-icon>
                        <span>涉及的任务节点 ({{ handover.involvedNodes.length }})</span>
                    </div>
                    <div class="involved-list">
                        <div 
                            v-for="node in handover.involvedNodes" 
                            :key="node.nodeId" 
                            class="involved-item"
                            @click="goToTask(node.taskId)"
                        >
                            <div class="involved-main">
                                <span class="involved-name">{{ node.nodeName }}</span>
                                <el-tag size="small" :type="getNodeStatusType(node.status)">
                                    {{ getNodeStatusText(node.status) }}
                                </el-tag>
                            </div>
                            <div class="involved-meta">
                                <span class="involved-task">任务: {{ node.taskTitle }}</span>
                                <span class="involved-role">{{ node.role }}</span>
                            </div>
                            <div class="involved-progress">
                                <el-progress 
                                    :percentage="node.progress || 0" 
                                    :stroke-width="6"
                                    :show-text="true"
                                    style="width: 120px;"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 交接信息 -->
                <div class="info-section">
                    <div class="section-title">
                        <el-icon><InfoFilled /></el-icon>
                        <span>交接信息</span>
                    </div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">交接ID</span>
                            <span class="info-value mono">{{ handover.handoverId || '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">申请时间</span>
                            <span class="info-value">{{ handover.createTime || '-' }}</span>
                        </div>
                        <div class="info-item" v-if="handover.approverName">
                            <span class="info-label">审批人</span>
                            <span class="info-value">{{ handover.approverName }}</span>
                        </div>
                    </div>
                    <div class="info-block">
                        <span class="info-label">交接原因</span>
                        <div class="info-content">{{ handover.handoverReason || '-' }}</div>
                    </div>
                    <div class="info-block" v-if="handover.handoverNote">
                        <span class="info-label">备注说明</span>
                        <div class="info-content">{{ handover.handoverNote }}</div>
                    </div>
                </div>

                <!-- 审批结果（如果已审批完成或拒绝） -->
                <div class="info-section" v-if="handover.status === 2 || handover.status === 3">
                    <div class="section-title">
                        <el-icon><CircleCheck /></el-icon>
                        <span>审批结果</span>
                    </div>
                    <div class="approval-result" :class="handover.status === 2 ? 'approved' : 'rejected'">
                        <el-icon class="result-icon">
                            <CircleCheckFilled v-if="handover.status === 2" />
                            <CircleCloseFilled v-else />
                        </el-icon>
                        <div class="result-text">
                            <span class="result-title">{{ handover.status === 2 ? '已通过' : '已拒绝' }}</span>
                            <span class="result-time" v-if="handover.approveTime">{{ handover.approveTime }}</span>
                        </div>
                    </div>
                    <div class="info-block" v-if="handover.rejectReason">
                        <span class="info-label">拒绝原因</span>
                        <div class="info-content reject-reason">{{ handover.rejectReason }}</div>
                    </div>
                </div>
            </div>

            <!-- 接收人操作区域（状态0 - 待接收人确认）或离职确认 -->
            <div class="actions-card receiver-actions" v-if="showReceiverActions">
                <div class="actions-title">
                    <el-icon><User /></el-icon>
                    {{ isLeaveRequest ? '确认离职' : '接收人确认' }}
                </div>
                <div class="actions-hint">
                    {{ isLeaveRequest ? '请确认您的离职申请' : '您是此交接的接收人，请确认是否接收此任务' }}
                </div>
                
                <!-- 拒绝原因输入 -->
                <div class="reject-input" v-if="showRejectInput">
                    <el-input 
                        v-model="rejectReason" 
                        type="textarea" 
                        :rows="3" 
                        placeholder="请输入拒绝原因"
                    />
                </div>

                <div class="actions-buttons">
                    <el-button 
                        v-if="!showRejectInput"
                        type="danger" 
                        plain 
                        size="large"
                        @click="showRejectInput = true"
                    >
                        <el-icon><Close /></el-icon>
                        拒绝接收
                    </el-button>
                    <el-button 
                        v-if="showRejectInput"
                        @click="showRejectInput = false; rejectReason = ''"
                    >
                        取消
                    </el-button>
                    <el-button 
                        v-if="showRejectInput"
                        type="danger" 
                        :loading="rejecting"
                        @click="handleReceiverReject"
                    >
                        确认拒绝
                    </el-button>
                    <el-button 
                        v-if="!showRejectInput"
                        type="primary" 
                        size="large"
                        :loading="confirming"
                        @click="handleReceiverConfirm"
                    >
                        <el-icon><Check /></el-icon>
                        同意接收
                    </el-button>
                </div>
            </div>

            <!-- 上级审批操作区域（状态1 - 待上级审批） -->
            <div class="actions-card approver-actions" v-if="showApproverActions">
                <div class="actions-title">
                    <el-icon><UserFilled /></el-icon>
                    {{ isLeaveRequest ? '离职审批' : '上级审批' }}
                </div>
                <div class="actions-hint">
                    {{ isLeaveRequest ? '请指定交接人并审批此离职申请' : '您是此交接的审批人，接收人已同意接收，请进行最终审批' }}
                </div>
                
                <!-- 指定交接人（离职申请或ToEmployeeId为空时显示） -->
                <div v-if="isLeaveRequest || !handover.toEmployeeId" class="handover-employee-select">
                    <div class="select-label">
                        <el-icon><User /></el-icon>
                        <span>{{ isLeaveRequest ? '指定交接人' : '指定/修改交接人' }}</span>
                        <el-tag v-if="isLeaveRequest" type="warning" size="small" style="margin-left: 8px;">必填</el-tag>
                    </div>
                    <el-select
                        v-model="selectedToEmployeeId"
                        placeholder="请选择交接人"
                        filterable
                        clearable
                        style="width: 100%"
                        :loading="employeesLoading"
                    >
                        <el-option
                            v-for="emp in availableEmployees"
                            :key="emp.id"
                            :label="emp.name"
                            :value="emp.id"
                        >
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span>{{ emp.name }}</span>
                                    <el-tag v-if="emp.department" size="small" type="info">{{ emp.department }}</el-tag>
                                </div>
                                <el-tag v-if="emp.taskCount !== undefined" size="small" type="warning">
                                    任务: {{ emp.taskCount }}
                                </el-tag>
                            </div>
                        </el-option>
                    </el-select>
                </div>

                <!-- 审批意见输入 -->
                <div class="comment-input">
                    <el-input 
                        v-model="approvalComment" 
                        type="textarea" 
                        :rows="3" 
                        :placeholder="isLeaveRequest ? '请输入审批意见（可选）' : '请输入审批意见（可选）'"
                    />
                </div>

                <div class="actions-buttons">
                    <el-button 
                        type="danger" 
                        plain 
                        size="large"
                        :loading="rejecting"
                        @click="handleApproverReject"
                    >
                        <el-icon><Close /></el-icon>
                        拒绝
                    </el-button>
                    <el-button 
                        type="primary" 
                        size="large"
                        :loading="approving"
                        @click="handleApproverApprove"
                    >
                        <el-icon><Check /></el-icon>
                        批准通过
                    </el-button>
                </div>
            </div>

            <!-- 等待提示 -->
            <div class="waiting-card" v-if="showWaitingInfo">
                <el-icon class="waiting-icon"><Clock /></el-icon>
                <div class="waiting-text">
                    <span class="waiting-title">{{ waitingTitle }}</span>
                    <span class="waiting-desc">{{ waitingDesc }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
    ArrowLeft, Right, Document, InfoFilled, 
    CircleCheck, CircleCheckFilled, CircleCloseFilled,
    Check, Close, Edit, User, UserFilled, Clock, List
} from '@element-plus/icons-vue';
import { getHandover, approveHandover, confirmHandover, rejectHandover, getMyEmployee, listEmployees } from '@/api';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const approving = ref(false);
const confirming = ref(false);
const rejecting = ref(false);
const showRejectInput = ref(false);
const rejectReason = ref('');
const approvalComment = ref('');

const handover = ref<any>({});
const currentEmployeeId = ref('');
const userStore = useUserStore();

// 交接人选择相关
const selectedToEmployeeId = ref('');
const availableEmployees = ref<any[]>([]);
const employeesLoading = ref(false);

// 状态映射
// 0 = 待接收人确认
// 1 = 待上级审批
// 2 = 已通过
// 3 = 已拒绝
const statusInfo = computed(() => {
    const statusMap: Record<number, { text: string; type: 'warning' | 'success' | 'danger' | 'info' }> = {
        0: { text: '待接收人确认', type: 'warning' },
        1: { text: '待上级审批', type: 'info' },
        2: { text: '已通过', type: 'success' },
        3: { text: '已拒绝', type: 'danger' }
    };
    return statusMap[handover.value.status] || { text: '未知', type: 'info' };
});

// 当前步骤
const currentStep = computed(() => {
    switch (handover.value.status) {
        case 0: return 1; // 待接收人确认
        case 1: return 2; // 待上级审批
        case 2: return 4; // 已通过
        case 3: return -1; // 已拒绝（特殊处理）
        default: return 0;
    }
});

// 获取步骤描述
const getStepDesc = (step: number) => {
    if (handover.value.status === 3) {
        // 被拒绝时显示拒绝信息
        return '已拒绝';
    }
    if (step === 1) {
        if (handover.value.status >= 1) return '已确认';
        return '等待中';
    }
    if (step === 2) {
        if (handover.value.status >= 2) return '已审批';
        if (handover.value.status === 1) return '等待中';
        return '';
    }
    return '';
};

// 判断是否是离职申请
const isLeaveRequest = computed(() => {
    return !handover.value.taskId || handover.value.taskTitle === '离职审批';
});

// 是否显示接收人操作（状态0且当前用户是接收人，或离职申请且是发起人）
const showReceiverActions = computed(() => {
    if (isLeaveRequest.value) {
        // 离职申请：状态0且是发起人，可以确认离职
        return handover.value.status === 0 && handover.value.fromEmployeeId === currentEmployeeId.value;
    }
    return handover.value.status === 0 && handover.value.toEmployeeId === currentEmployeeId.value;
});

// 是否显示审批人操作（状态1且当前用户是审批人）
const showApproverActions = computed(() => {
    return handover.value.status === 1 && handover.value.approverId === currentEmployeeId.value;
});

// 监听审批操作显示，自动加载员工列表
watch(showApproverActions, (canApprove) => {
    if (canApprove && (isLeaveRequest.value || !handover.value.toEmployeeId)) {
        loadAvailableEmployees();
    }
});

// 是否显示等待提示
const showWaitingInfo = computed(() => {
    if (isLeaveRequest.value) {
        // 离职申请的特殊处理
        if (handover.value.status === 0) {
            // 待员工确认，如果不是发起人，显示等待
            return handover.value.fromEmployeeId !== currentEmployeeId.value;
        }
        if (handover.value.status === 1) {
            // 待上级审批，如果不是审批人，显示等待
            return handover.value.approverId !== currentEmployeeId.value;
        }
        return false;
    }
    // 普通交接的逻辑
    if (handover.value.status === 0) {
        // 待接收人确认，发起人看到等待
        return handover.value.fromEmployeeId === currentEmployeeId.value;
    }
    if (handover.value.status === 1) {
        // 待上级审批，发起人和接收人看到等待
        return (handover.value.fromEmployeeId === currentEmployeeId.value || 
                handover.value.toEmployeeId === currentEmployeeId.value) &&
               handover.value.approverId !== currentEmployeeId.value;
    }
    return false;
});

const waitingTitle = computed(() => {
    if (isLeaveRequest.value) {
        if (handover.value.status === 0) return '等待员工确认';
        if (handover.value.status === 1) return '等待上级审批';
    } else {
        if (handover.value.status === 0) return '等待接收人确认';
        if (handover.value.status === 1) return '等待上级审批';
    }
    return '';
});

const waitingDesc = computed(() => {
    if (isLeaveRequest.value) {
        if (handover.value.status === 0) {
            return `员工 ${handover.value.fromEmployeeName} 尚未确认离职申请`;
        }
        if (handover.value.status === 1) {
            return `审批人 ${handover.value.approverName || '上级'} 正在审批中`;
        }
    } else {
        if (handover.value.status === 0) {
            return `接收人 ${handover.value.toEmployeeName || '-'} 尚未确认是否接收此任务`;
        }
        if (handover.value.status === 1) {
            return `审批人 ${handover.value.approverName || '上级'} 正在审批中`;
        }
    }
    return '';
});

const goBack = () => {
    router.push('/handovers');
};

// 跳转到任务详情
const goToTask = (taskId: string) => {
    if (taskId) {
        router.push(`/tasks/detail/${taskId}`);
    }
};

// 获取任务状态类型
const getTaskStatusType = (status: number) => {
    const map: Record<number, string> = {
        0: 'info',
        1: 'warning',
        2: 'success',
        3: 'danger'
    };
    return map[status] || 'info';
};

// 获取任务状态文本
const getTaskStatusText = (status: number) => {
    const map: Record<number, string> = {
        0: '未开始',
        1: '进行中',
        2: '已完成',
        3: '已逾期'
    };
    return map[status] || '未知';
};

// 获取节点状态类型
const getNodeStatusType = (status: number) => {
    const map: Record<number, string> = {
        0: 'info',
        1: 'warning',
        2: 'success',
        3: 'danger'
    };
    return map[status] || 'info';
};

// 获取节点状态文本
const getNodeStatusText = (status: number) => {
    const map: Record<number, string> = {
        0: '未开始',
        1: '进行中',
        2: '已完成',
        3: '已逾期'
    };
    return map[status] || '未知';
};

// 接收人同意接收
const handleReceiverConfirm = async () => {
    try {
        await ElMessageBox.confirm(
            '确定同意接收此任务吗？同意后将等待上级审批。',
            '确认接收',
            { type: 'info', confirmButtonText: '确定同意', cancelButtonText: '取消' }
        );
    } catch {
        return;
    }

    confirming.value = true;
    try {
        const resp = await confirmHandover({
            handoverId: handover.value.handoverId
        });

        if (resp.data.code === 200) {
            ElMessage.success('已确认接收，等待上级审批');
            loadData();
        } else {
            ElMessage.error(resp.data.msg || '操作失败');
        }
    } catch (error) {
        console.error('确认失败:', error);
        ElMessage.error('操作失败');
    } finally {
        confirming.value = false;
    }
};

// 接收人拒绝接收
const handleReceiverReject = async () => {
    if (!rejectReason.value.trim()) {
        ElMessage.warning('请输入拒绝原因');
        return;
    }

    rejecting.value = true;
    try {
        const resp = await rejectHandover({
            handoverId: handover.value.handoverId,
            comment: rejectReason.value
        });

        if (resp.data.code === 200) {
            ElMessage.success('已拒绝接收');
            showRejectInput.value = false;
            rejectReason.value = '';
            loadData();
        } else {
            ElMessage.error(resp.data.msg || '操作失败');
        }
    } catch (error) {
        console.error('拒绝失败:', error);
        ElMessage.error('操作失败');
    } finally {
        rejecting.value = false;
    }
};

// 加载可用员工列表（根据离职员工的职务筛选）
async function loadAvailableEmployees() {
    if (availableEmployees.value.length > 0) return; // 已加载过
    
    employeesLoading.value = true;
    try {
        const companyId = userStore.companyId || '';
        // 获取离职员工的职务ID - 离职审批不按职务筛选，显示所有在职员工
        const fromEmployeePositionId = isLeaveRequest.value ? '' : (handover.value.fromEmployeePositionId || handover.value.fromEmployee?.positionId || '');
        
        let finalCompanyId = companyId;
        if (!finalCompanyId) {
            const empRes = await getMyEmployee();
            const emp = empRes?.data?.data || {};
            finalCompanyId = emp.companyId || emp.CompanyId || '';
        }
        
        console.log('[loadAvailableEmployees] companyId:', finalCompanyId, 'positionId:', fromEmployeePositionId);
        
        if (finalCompanyId) {
            // 离职审批时不按职务筛选，显示公司所有在职员工
            const requestData: any = { 
                page: 1, 
                pageSize: 200, 
                companyId: finalCompanyId 
            };
            if (fromEmployeePositionId) {
                requestData.positionId = fromEmployeePositionId;
            }
            
            console.log('[loadAvailableEmployees] requestData:', requestData);
            const resp = await listEmployees(requestData);
            console.log('[loadAvailableEmployees] response:', resp.data);
            
            if (resp.data?.code === 200) {
                // 后端返回的数据在 data.employees.list 中
                const employees = resp.data.data?.employees || resp.data.data || {};
                const list = employees.list || [];
                console.log('[loadAvailableEmployees] employees list:', list);
                
                availableEmployees.value = list
                    .filter((e: any) => e.status === 1 && e.id !== handover.value.fromEmployeeId) // 只显示在职且不是发起人
                    .map((e: any) => ({
                        id: e.id || e.employeeId,
                        name: e.realName || e.name || '未知',
                        department: e.departmentName || '',
                        taskCount: e.taskCount || 0 // 显示任务数量
                    }));
                console.log('[loadAvailableEmployees] availableEmployees:', availableEmployees.value);
            }
        } else {
            console.warn('[loadAvailableEmployees] No companyId found');
        }
    } catch (error) {
        console.error('加载员工列表失败:', error);
    } finally {
        employeesLoading.value = false;   
    }
}

// 上级批准
const handleApproverApprove = async () => {
    // 如果是离职申请或ToEmployeeId为空，必须指定交接人
    if ((isLeaveRequest.value || !handover.value.toEmployeeId) && !selectedToEmployeeId.value) {
        ElMessage.warning('请先指定交接人');
        return;
    }

    try {
        await ElMessageBox.confirm(
            isLeaveRequest.value 
                ? '确定批准此离职申请吗？批准后将指定交接人并完成交接。'
                : '确定批准此交接申请吗？批准后任务将正式交接。',
            '确认批准',
            { type: 'info', confirmButtonText: '确定批准', cancelButtonText: '取消' }
        );
    } catch {
        return;
    }

    approving.value = true;
    try {
        const resp = await approveHandover({
            handoverId: handover.value.handoverId,
            approved: 1,
            comment: approvalComment.value,
            toEmployeeId: selectedToEmployeeId.value || handover.value.toEmployeeId || ''
        });

        if (resp.data.code === 200) {
            ElMessage.success('已批准交接');
            loadData();
        } else {
            ElMessage.error(resp.data.msg || '操作失败');
        }
    } catch (error) {
        console.error('审批失败:', error);
        ElMessage.error('操作失败');
    } finally {
        approving.value = false;
    }
};

// 上级拒绝
const handleApproverReject = async () => {
    if (!approvalComment.value.trim()) {
        ElMessage.warning('请输入拒绝原因');
        return;
    }

    // 如果建议了交接人，添加到拒绝原因中
    let rejectComment = approvalComment.value;
    if (selectedToEmployeeId.value) {
        const suggestedEmp = availableEmployees.value.find(e => e.id === selectedToEmployeeId.value);
        if (suggestedEmp) {
            rejectComment = `${approvalComment.value}（建议交接给：${suggestedEmp.name}）`;
        }
    }

    try {
        await ElMessageBox.confirm(
            '确定拒绝此交接申请吗？',
            '确认拒绝',
            { type: 'warning', confirmButtonText: '确定拒绝', cancelButtonText: '取消' }
        );
    } catch {
        return;
    }

    rejecting.value = true;
    try {
        const resp = await approveHandover({
            handoverId: handover.value.handoverId,
            approved: 0,
            comment: rejectComment,
            toEmployeeId: selectedToEmployeeId.value || '' // 拒绝时也可以建议交接人
        });

        if (resp.data.code === 200) {
            ElMessage.success('已拒绝交接');
            loadData();
        } else {
            ElMessage.error(resp.data.msg || '操作失败');
        }
    } catch (error) {
        console.error('拒绝失败:', error);
        ElMessage.error('操作失败');
    } finally {
        rejecting.value = false;
    }
};

const loadData = async () => {
    loading.value = true;
    try {
        // 获取当前用户（使用id而不是employeeId，id是员工主键）
        const meResp = await getMyEmployee();
        if (meResp.data.code === 200 && meResp.data.data) {
            currentEmployeeId.value = meResp.data.data.id || meResp.data.data.Id || meResp.data.data.ID;
        }

        // 获取交接详情
        const handoverId = route.params.id as string;
        const resp = await getHandover({ handoverId });
        
        if (resp.data.code === 200 && resp.data.data) {
            const data = resp.data.data;
            handover.value = {
                handoverId: data.handoverId || data.HandoverId,
                taskId: data.taskId || data.TaskId,
                taskTitle: data.taskTitle || data.TaskTitle || data.taskId || '-',
                fromEmployeeId: data.fromEmployeeId || data.FromEmployeeId,
                fromEmployeeName: data.fromEmployeeName || data.FromEmployeeName || '-',
                fromEmployeePositionId: data.fromEmployeePositionId || data.FromEmployeePositionId || '',
                fromDepartmentName: data.fromDepartmentName || data.FromDepartmentName || '',
                toEmployeeId: data.toEmployeeId || data.ToEmployeeId || '',
                toEmployeeName: data.toEmployeeName || data.ToEmployeeName || '-',
                toDepartmentName: data.toDepartmentName || data.ToDepartmentName || '',
                approverId: data.approverId || data.ApproverId || '',
                approverName: data.approverName || data.ApproverName || '',
                handoverReason: data.handoverReason || data.HandoverReason || '-',
                handoverNote: data.handoverNote || data.HandoverNote || '',
                status: data.handoverStatus ?? data.HandoverStatus ?? data.status ?? 0,
                createTime: data.createTime || data.CreateTime || data.handoverTime || '-',
                approveTime: data.approveTime || data.ApproveTime || '',
                rejectReason: data.rejectReason || data.RejectReason || '',
                involvedTasks: data.involvedTasks || [],
                involvedNodes: data.involvedNodes || []
            };
            
            // 如果是离职申请或ToEmployeeId为空，且需要审批，加载员工列表
            if ((isLeaveRequest.value || !handover.value.toEmployeeId) && showApproverActions.value) {
                await loadAvailableEmployees();
                // 如果有现有的toEmployeeId，设置为选中
                if (handover.value.toEmployeeId) {
                    selectedToEmployeeId.value = handover.value.toEmployeeId;
                }
            }
        } else {
            ElMessage.error('获取交接详情失败');
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        ElMessage.error('加载数据失败');
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.handover-detail-page {
    padding: 24px;
    background: #f5f7fa;
    min-height: calc(100vh - 64px);
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-left h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: #1f2937;
}

.status-tag {
    font-size: 14px;
    padding: 6px 16px;
    border-radius: 20px;
}

.content-wrapper {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.main-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 审批流程进度 */
.approval-progress {
    margin: 24px 0;
    padding: 24px;
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    border-radius: 12px;
}

.progress-title {
    font-size: 14px;
    font-weight: 600;
    color: #0369a1;
    margin-bottom: 16px;
    text-align: center;
}

/* 交接双方样式 */
.parties-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
    padding: 24px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-radius: 16px;
}

.party {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.party-label {
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.party-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.party-avatar {
    font-size: 24px;
    font-weight: 600;
}

.party-avatar.from {
    background: linear-gradient(135deg, #f87171, #ef4444);
    color: #fff;
}

.party-avatar.to {
    background: linear-gradient(135deg, #34d399, #10b981);
    color: #fff;
}

.party-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.party-name {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.party-dept {
    font-size: 13px;
    color: #6b7280;
}

.arrow-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.arrow-line {
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, #d1d5db, #9ca3af);
    border-radius: 1px;
}

.arrow-icon {
    font-size: 20px;
    color: #6b7280;
}

/* 信息区块样式 */
.info-section {
    padding-top: 24px;
    border-top: 1px solid #f3f4f6;
}

.info-section:first-of-type {
    border-top: none;
    padding-top: 0;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 16px;
}

.section-title .el-icon {
    color: #3B82F6;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.info-label {
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-value {
    font-size: 15px;
    color: #1f2937;
    font-weight: 500;
}

.info-value.mono {
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 13px;
    color: #6b7280;
}

.info-value.task-title {
    color: #3B82F6;
    font-weight: 600;
}

.info-block {
    margin-top: 16px;
}

.info-content {
    margin-top: 8px;
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 8px;
    font-size: 14px;
    color: #374151;
    line-height: 1.6;
}

.info-content.reject-reason {
    background: #fef2f2;
    color: #dc2626;
}

/* 审批结果样式 */
.approval-result {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
}

.approval-result.approved {
    background: #ecfdf5;
}

.approval-result.rejected {
    background: #fef2f2;
}

.result-icon {
    font-size: 32px;
}

.approval-result.approved .result-icon {
    color: #10b981;
}

.approval-result.rejected .result-icon {
    color: #ef4444;
}

.result-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.result-title {
    font-size: 16px;
    font-weight: 600;
}

.approval-result.approved .result-title {
    color: #059669;
}

.approval-result.rejected .result-title {
    color: #dc2626;
}

.result-time {
    font-size: 13px;
    color: #6b7280;
}

/* 操作区域样式 */
.actions-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.receiver-actions {
    border: 2px solid #10b981;
}

.approver-actions {
    border: 2px solid #3B82F6;
}

.actions-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
}

.receiver-actions .actions-title .el-icon {
    color: #10b981;
}

.approver-actions .actions-title .el-icon {
    color: #3B82F6;
}

.actions-hint {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 20px;
}

.reject-input,
.handover-employee-select {
    margin-bottom: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.select-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.comment-input {
    margin-bottom: 16px;
}

.actions-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.actions-buttons .el-button--large {
    padding: 12px 24px;
    font-size: 15px;
}

/* 等待提示样式 */
.waiting-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fffbeb;
    border: 1px solid #fbbf24;
    border-radius: 12px;
    padding: 20px 24px;
}

.waiting-icon {
    font-size: 32px;
    color: #f59e0b;
}

.waiting-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.waiting-title {
    font-size: 15px;
    font-weight: 600;
    color: #92400e;
}

.waiting-desc {
    font-size: 14px;
    color: #a16207;
}

:deep(.el-button--primary) {
    background: linear-gradient(135deg, #3B82F6, #8b5cf6);
    border: none;
}

:deep(.el-button--primary:hover) {
    background: linear-gradient(135deg, #3B82F6, #7c3aed);
}

:deep(.el-steps) {
    --el-color-primary: #3B82F6;
}

/* 涉及的任务和节点列表样式 */
.involved-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
}

.involved-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.2s;
}

.involved-item:hover {
    background: #f1f5f9;
    border-color: #3B82F6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.involved-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.involved-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.involved-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 12px;
    color: #6b7280;
}

.involved-task {
    color: #3B82F6;
}

.involved-role {
    padding: 2px 8px;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 4px;
    font-size: 11px;
}

.involved-deadline {
    color: #9ca3af;
}

.involved-progress {
    display: flex;
    align-items: center;
    gap: 8px;
}
</style>
