<template>
    <div class="create-node-form">
        <el-form 
            :model="form" 
            label-position="top"
            :rules="rules" 
            ref="formRef"
            class="form"
        >
            <div class="form-section">
                <h3 class="section-title">基本信息</h3>
                <el-form-item label="所属任务" prop="taskId">
                    <el-select 
                        v-model="form.taskId" 
                        filterable 
                        placeholder="选择关联任务" 
                        class="full-width"
                        @change="onTaskChange"
                    >
                        <el-option 
                            v-for="t in taskOptions" 
                            :key="t.id" 
                            :label="t.title" 
                            :value="t.id" 
                        />
                    </el-select>
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="节点类型" prop="nodeType">
                            <el-select v-model="form.nodeType" placeholder="类型" class="full-width">
                                <el-option label="任务节点" :value="1" />
                                <el-option label="条件节点" :value="2" />
                                <el-option label="审批节点" :value="3" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="所属部门">
                            <el-input v-model="deptDisplay" disabled class="full-width" placeholder="自动获取" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="节点名称" prop="nodeName">
                    <el-input 
                        v-model="form.nodeName" 
                        placeholder="例如：API接口开发" 
                        class="full-width"
                        clearable
                    />
                </el-form-item>

                <el-form-item label="节点详情">
                    <el-input 
                        v-model="form.nodeDetail" 
                        type="textarea" 
                        :rows="3" 
                        placeholder="描述节点的具体要求..."
                        maxlength="500"
                        show-word-limit
                    />
                </el-form-item>
            </div>

            <div class="form-section">
                <h3 class="section-title">时间与人员</h3>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="开始时间">
                            <el-date-picker 
                                v-model="form.nodeStartTime" 
                                type="datetime" 
                                placeholder="选择时间"
                                class="full-width"
                                value-format="YYYY-MM-DD HH:mm:ss"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="截止时间" prop="nodeDeadline">
                            <el-date-picker 
                                v-model="form.nodeDeadline" 
                                type="datetime" 
                                placeholder="选择时间"
                                class="full-width"
                                value-format="YYYY-MM-DD HH:mm:ss"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="负责人" prop="leaderId">
                            <el-select 
                                v-model="form.leaderId" 
                                filterable 
                                placeholder="选择负责人" 
                                class="full-width"
                                clearable
                            >
                                <el-option 
                                    v-for="e in employeeOptions" 
                                    :key="e.id" 
                                    :label="e.name" 
                                    :value="e.id" 
                                />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="预计工时">
                            <el-input-number 
                                v-model="form.estimatedHours" 
                                :min="0" 
                                :max="1000" 
                                :precision="1"
                                placeholder="0.0"
                                class="full-width"
                                controls-position="right"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="执行人">
                    <el-select 
                        v-model="form.executorIds" 
                        multiple 
                        filterable 
                        placeholder="选择执行人（可多选）" 
                        class="full-width"
                        collapse-tags
                    >
                        <el-option 
                            v-for="e in employeeOptions" 
                            :key="e.id" 
                            :label="e.name" 
                            :value="e.id"
                        >
                            <span>{{ e.name }}</span>
                            <span v-if="e.isFounder" style="color: #f56c6c; margin-left: 8px;">[创始人]</span>
                        </el-option>
                    </el-select>
                    <div v-if="currentEmployee?.isFounder || currentEmployee?.positionCode === 'FOUNDER'" class="form-hint">
                        <el-icon><InfoFilled /></el-icon>
                        作为创始人，您可以给所有人分配任务
                    </div>
                    <div v-else class="form-hint">
                        <el-icon><InfoFilled /></el-icon>
                        不能给职位级别更高或部门优先级更高的员工安排任务，但可以给自己安排
                    </div>
                </el-form-item>
            </div>

            <div class="form-actions-fixed">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="submitting">
                    创建节点
                </el-button>
            </div>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { createTaskNode, listTasks, getMyEmployee, listEmployees } from '@/api';
import { useUserStore } from '@/store/user';

const props = defineProps<{
    taskId?: string;
}>();

const emit = defineEmits(['success', 'cancel']);

const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = ref<any>({
    taskId: '',
    departmentId: '',
    nodeType: undefined,
    nodeName: '',
    nodeDetail: '',
    nodeStartTime: '',
    nodeDeadline: '',
    estimatedHours: 0,
    leaderId: '',
    executorIds: [],
});

const taskOptions = ref<{ id: string; title: string }[]>([]);
const deptDisplay = ref<string>('');
const employeeOptions = ref<{ id: string; name: string; positionLevel?: number; departmentPriority?: number; isFounder?: boolean }[]>([]);
const allEmployees = ref<{ id: string; name: string; positionLevel?: number; departmentPriority?: number; isFounder?: boolean; positionCode?: string }[]>([]);
const currentEmployee = ref<any>(null);
const userStore = useUserStore();

const rules: FormRules = {
    taskId: [{ required: true, message: '请选择任务', trigger: 'change' }],
    nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
    nodeName: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
    nodeDeadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
    leaderId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
};

watch(() => props.taskId, (newTaskId) => {
    if (newTaskId) {
        form.value.taskId = newTaskId;
        onTaskChange();
    }
}, { immediate: true });

async function loadTasks() {
    try {
        const resp = await listTasks({ page: 1, pageSize: 100 });
        if (resp.data?.code === 200) {
            const list = resp.data?.data?.list || resp.data?.data || [];
            taskOptions.value = (list as any[])
                .map((t: any) => ({ id: t.taskId || t.id || t.Id, title: t.taskTitle || t.title || t.TaskTitle }))
                .filter((t: any) => !!t.id);
        }
    } catch (error: any) {
        console.error('加载任务列表异常:', error);
    }
}

async function initMyDepartmentAndEmployees() {
    try {
        const me = await getMyEmployee();
        const emp = me?.data?.data || me?.data?.employee || {};
        currentEmployee.value = emp;
        const deptId = emp.departmentId || emp.DepartmentId || '';
        const deptName = emp.departmentName || emp.DepartmentName || '';
        form.value.departmentId = String(deptId || '');
        deptDisplay.value = deptName || form.value.departmentId || '未设置';
        
        const companyId = emp.companyId || emp.CompanyId || '';
        if (!companyId) return;
        
        // 如果是创始人，加载所有员工；否则只加载本部门员工
        const isFounder = emp.isFounder === 1 || emp.positionCode === 'FOUNDER' || emp.roleTags?.includes('创始人');
        const resp = await listEmployees({ 
            page: 1, 
            pageSize: 1000, 
            companyId, 
            departmentId: isFounder ? '' : form.value.departmentId 
        });
        
        if (resp.data?.code === 200) {
            const list = resp.data?.data?.list || resp.data?.data || [];
            // 保存所有员工信息（包含职位级别、部门优先级等）
            allEmployees.value = (list as any[]).map((e: any) => ({ 
                id: e.id || e.employeeId, 
                name: e.realName || e.username || '未知',
                positionLevel: e.positionLevel || 0,
                departmentPriority: e.departmentPriority || 0,
                isFounder: e.isFounder === true || e.positionCode === 'FOUNDER',
                positionCode: e.positionCode || '',
            }));
            
            // 过滤员工选项（不能以下犯上，不能给创始人安排任务，但允许给自己安排）
            filterEmployeeOptions();
        }
    } catch (error: any) {
        console.error('加载部门员工失败:', error);
    }
}

// 过滤员工选项：不能以下犯上，不能给创始人安排任务，但允许给自己安排
function filterEmployeeOptions() {
    if (!currentEmployee.value) {
        employeeOptions.value = allEmployees.value;
        return;
    }
    
    const currentEmpId = currentEmployee.value.id || currentEmployee.value.employeeId;
    const currentLevel = currentEmployee.value.positionLevel || 0;
    const currentDeptPriority = currentEmployee.value.departmentPriority || 0;
    const isCurrentFounder = currentEmployee.value.isFounder === 1 || 
                             currentEmployee.value.positionCode === 'FOUNDER' ||
                             currentEmployee.value.roleTags?.includes('创始人');
    
    employeeOptions.value = allEmployees.value.filter((e: any) => {
        // 允许给自己安排任务
        if (e.id === currentEmpId) {
            return true;
        }
        
        // 不能给创始人安排任务（除非分配者也是创始人）
        if (e.isFounder && !isCurrentFounder) {
            return false;
        }
        
        // 如果是创始人，可以给所有人安排任务
        if (isCurrentFounder) {
            return true;
        }
        
        // 不能以下犯上：不能给职位级别更高的员工安排任务
        if (e.positionLevel > currentLevel) {
            return false;
        }
        
        // 同级时，不能给部门优先级更高的员工安排任务
        if (e.positionLevel === currentLevel && e.departmentPriority > currentDeptPriority) {
            return false;
        }
        
        return true;
    });
}

function onTaskChange() {}

function handleCancel() {
    emit('cancel');
}

async function handleSubmit() {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid) => {
        if (valid) {
            submitting.value = true;
            try {
                const resp = await createTaskNode({
                    taskId: form.value.taskId,
                    departmentId: form.value.departmentId,
                    nodeType: form.value.nodeType,
                    nodeName: form.value.nodeName,
                    nodeDetail: form.value.nodeDetail,
                    nodeStartTime: form.value.nodeStartTime,
                    nodeDeadline: form.value.nodeDeadline,
                    estimatedHours: form.value.estimatedHours,
                    leaderId: form.value.leaderId,
                    executorIds: form.value.executorIds,
                });
                if (resp.data?.code === 200) {
                    ElMessage.success('节点创建成功');
                    emit('success');
                } else {
                    ElMessage.error(resp.data?.msg || '创建失败');
                }
            } catch (error: any) {
                ElMessage.error('创建失败');
            } finally {
                submitting.value = false;
            }
        }
    });
}

onMounted(async () => {
    await Promise.all([loadTasks(), initMyDepartmentAndEmployees()]);
});
</script>

<style scoped>
.create-node-form {
    padding-bottom: 60px;
}

.form-section {
    margin-bottom: 24px;
}

.section-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px 0;
    padding-left: 8px;
    border-left: 3px solid #10b981; /* Use green for nodes to distinguish from tasks */
    line-height: 1.2;
}

.full-width {
    width: 100%;
}

.form-actions-fixed {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 24px;
    background: #fff;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    z-index: 10;
}

.form-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
}

.form-hint .el-icon {
    font-size: 14px;
}
</style>
