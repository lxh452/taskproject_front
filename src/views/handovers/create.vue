<template>
    <div class="handover-create-page">
        <!-- 页面标题 -->
        <div class="page-header">
            <div class="header-left">
                <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
                <h1>创建交接申请</h1>
            </div>
        </div>

        <!-- 表单区域 -->
        <div class="form-container">
            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="handover-form">
                <!-- 选择任务 -->
                <el-form-item label="选择任务" prop="taskId">
                    <el-select 
                        v-model="form.taskId" 
                        placeholder="请选择要交接的任务" 
                        filterable 
                        class="full-width"
                        @change="onTaskChange"
                    >
                        <el-option 
                            v-for="task in myTasks" 
                            :key="task.taskId" 
                            :label="task.taskTitle" 
                            :value="task.taskId"
                        >
                            <div class="task-option">
                                <span class="task-title">{{ task.taskTitle }}</span>
                                <el-tag size="small" type="info">{{ task.roleDisplay }}</el-tag>
                            </div>
                        </el-option>
                    </el-select>
                </el-form-item>

                <!-- 任务信息预览 -->
                <div v-if="selectedTask" class="task-preview">
                    <div class="preview-header">
                        <el-icon><Document /></el-icon>
                        <span>任务信息</span>
                    </div>
                    <div class="preview-content">
                        <div class="preview-item">
                            <span class="label">任务名称</span>
                            <span class="value">{{ selectedTask.taskTitle }}</span>
                        </div>
                        <div class="preview-item">
                            <span class="label">任务状态</span>
                            <el-tag size="small" :type="getStatusType(selectedTask.taskStatus)">{{ getStatusText(selectedTask.taskStatus) }}</el-tag>
                        </div>
                        <div class="preview-item">
                            <span class="label">截止时间</span>
                            <span class="value">{{ selectedTask.deadline || '-' }}</span>
                        </div>
                    </div>
                </div>

                <!-- 选择接收人 -->
                <el-form-item label="接收人" prop="toEmployeeId">
                    <el-select 
                        v-model="form.toEmployeeId" 
                        placeholder="请选择接收人" 
                        filterable 
                        class="full-width"
                    >
                        <el-option 
                            v-for="emp in availableEmployees" 
                            :key="emp.employeeId" 
                            :label="emp.employeeName" 
                            :value="emp.employeeId"
                            :disabled="emp.employeeId === currentEmployeeId"
                        >
                            <div class="employee-option">
                                <el-avatar :size="24" class="emp-avatar">{{ emp.employeeName?.charAt(0) }}</el-avatar>
                                <span class="emp-name">{{ emp.employeeName }}</span>
                                <span class="emp-dept">{{ emp.departmentName || '' }}</span>
                            </div>
                        </el-option>
                    </el-select>
                </el-form-item>

                <!-- 交接原因 -->
                <el-form-item label="交接原因" prop="handoverReason">
                    <el-input 
                        v-model="form.handoverReason" 
                        type="textarea" 
                        :rows="3" 
                        placeholder="请输入交接原因，如：工作调动、项目转移等"
                        maxlength="200"
                        show-word-limit
                    />
                </el-form-item>

                <!-- 备注说明 -->
                <el-form-item label="备注说明">
                    <el-input 
                        v-model="form.handoverNote" 
                        type="textarea" 
                        :rows="4" 
                        placeholder="请输入详细的交接说明，包括任务进度、注意事项等"
                        maxlength="500"
                        show-word-limit
                    />
                </el-form-item>

                <!-- 提交按钮 -->
                <el-form-item class="form-actions">
                    <el-button @click="goBack">取消</el-button>
                    <el-button type="primary" :loading="submitting" @click="handleSubmit">
                        <el-icon><Check /></el-icon>
                        提交申请
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, FormInstance } from 'element-plus';
import { ArrowLeft, Document, Check } from '@element-plus/icons-vue';
import { listEmployees, createHandover, getMyEmployee, getHandoverableTasks } from '@/api';

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive({
    taskId: '',
    toEmployeeId: '',
    handoverReason: '',
    handoverNote: ''
});

const rules = {
    taskId: [{ required: true, message: '请选择要交接的任务', trigger: 'change' }],
    toEmployeeId: [{ required: true, message: '请选择接收人', trigger: 'change' }],
    handoverReason: [{ required: true, message: '请输入交接原因', trigger: 'blur' }]
};

const myTasks = ref<any[]>([]);
const employees = ref<any[]>([]);
const currentEmployeeId = ref('');
const selectedTask = ref<any>(null);

// 只显示不是当前用户的员工
const availableEmployees = computed(() => {
    return employees.value.filter(emp => emp.status === 1);
});

const getStatusType = (status: number) => {
    const types: Record<number, string> = {
        1: 'info',
        2: 'primary',
        3: 'success',
        4: 'danger'
    };
    return types[status] || 'info';
};

const getStatusText = (status: number) => {
    const texts: Record<number, string> = {
        1: '待开始',
        2: '进行中',
        3: '已完成',
        4: '已取消'
    };
    return texts[status] || '未知';
};

const onTaskChange = (taskId: string) => {
    selectedTask.value = myTasks.value.find(t => t.taskId === taskId) || null;
};

const goBack = () => {
    router.push('/handovers');
};

const handleSubmit = async () => {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;

    submitting.value = true;
    try {
        const resp = await createHandover({
            taskId: form.taskId,
            fromEmployeeId: currentEmployeeId.value,
            toEmployeeId: form.toEmployeeId,
            handoverReason: form.handoverReason,
            handoverNote: form.handoverNote
        });

        if (resp.data.code === 200) {
            ElMessage.success('交接申请已提交，等待接收人审批');
            router.push('/handovers');
        } else {
            ElMessage.error(resp.data.msg || '提交失败');
        }
    } catch (error: any) {
        console.error('提交交接申请失败:', error);
        ElMessage.error('提交失败，请稍后重试');
    } finally {
        submitting.value = false;
    }
};

const loadData = async () => {
    try {
        // 获取当前用户信息
        const meResp = await getMyEmployee();
        let companyId = '';
        if (meResp.data.code === 200 && meResp.data.data) {
            // 使用 id（员工主键ID）而不是 employeeId（工号）
            currentEmployeeId.value = meResp.data.data.id || meResp.data.data.Id || meResp.data.data.ID;
            companyId = meResp.data.data.companyId || meResp.data.data.CompanyId || '';
        }

        // 获取当前用户可交接的任务列表
        const tasksResp = await getHandoverableTasks({ page: 1, pageSize: 100 });
        console.log('getHandoverableTasks response:', tasksResp.data);
        if (tasksResp.data.code === 200) {
            const list = tasksResp.data.data?.list || [];
            myTasks.value = list.map((task: any) => ({
                taskId: task.taskId,
                taskTitle: task.taskTitle || '-',
                taskStatus: task.taskStatus,
                deadline: task.deadline || '',
                role: task.role,
                roleDisplay: task.roleDisplay
            }));
            console.log('Handoverable tasks:', myTasks.value);
        }

        // 获取员工列表（需要传入companyId）
        if (companyId) {
            const empResp = await listEmployees({ page: 1, pageSize: 100, companyId });
            if (empResp.data.code === 200) {
                const empList = empResp.data.data?.list || [];
                // 标准化员工数据，使用id（员工主键）而不是employeeId（工号）
                employees.value = empList.map((emp: any) => ({
                    employeeId: emp.id || emp.Id || emp.ID || '',  // 使用员工主键ID
                    employeeName: emp.realName || emp.RealName || emp.employeeName || emp.EmployeeName || emp.name || '-',
                    departmentName: emp.departmentName || emp.DepartmentName || '',
                    status: emp.status ?? emp.Status ?? 1
                })).filter((emp: any) => emp.employeeId); // 过滤掉没有ID的员工
            }
        }

        // 如果URL有taskId参数，自动选中
        if (route.query.taskId) {
            form.taskId = route.query.taskId as string;
            onTaskChange(form.taskId);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        ElMessage.error('加载数据失败');
    }
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.handover-create-page {
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

.form-container {
    max-width: 680px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.handover-form {
    width: 100%;
}

.full-width {
    width: 100%;
}

.task-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.task-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.employee-option {
    display: flex;
    align-items: center;
    gap: 10px;
}

.emp-avatar {
    background: linear-gradient(135deg, #3B82F6, #8b5cf6);
    color: #fff;
    font-size: 12px;
}

.emp-name {
    font-weight: 500;
    color: #1f2937;
}

.emp-dept {
    font-size: 12px;
    color: #9ca3af;
    margin-left: auto;
}

.task-preview {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
}

.preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
}

.preview-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.preview-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.preview-item .label {
    font-size: 12px;
    color: #6b7280;
}

.preview-item .value {
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
}

.form-actions {
    margin-top: 32px;
    margin-bottom: 0;
}

.form-actions :deep(.el-form-item__content) {
    justify-content: flex-end;
    gap: 12px;
}

:deep(.el-form-item__label) {
    font-weight: 600;
    color: #374151;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
    border-radius: 8px;
}

:deep(.el-select) {
    --el-select-border-color-hover: #3B82F6;
}

:deep(.el-button--primary) {
    background: linear-gradient(135deg, #3B82F6, #8b5cf6);
    border: none;
}

:deep(.el-button--primary:hover) {
    background: linear-gradient(135deg, #3B82F6, #7c3aed);
}
</style>

