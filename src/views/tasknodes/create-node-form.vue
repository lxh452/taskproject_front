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
                        />
                    </el-select>
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
const employeeOptions = ref<{ id: string; name: string }[]>([]);
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
        const deptId = emp.departmentId || emp.DepartmentId || '';
        const deptName = emp.departmentName || emp.DepartmentName || '';
        form.value.departmentId = String(deptId || '');
        deptDisplay.value = deptName || form.value.departmentId || '未设置';
        
        if (!form.value.departmentId) return;
        
        const companyId = emp.companyId || emp.CompanyId || '';
        const resp = await listEmployees({ page: 1, pageSize: 100, companyId, departmentId: form.value.departmentId });
        if (resp.data?.code === 200) {
            const list = resp.data?.data?.list || resp.data?.data || [];
            employeeOptions.value = (list as any[]).map((e: any) => ({ 
                id: e.id || e.employeeId, 
                name: e.realName || e.username || '未知'
            }));
        }
    } catch (error: any) {
        console.error('加载部门员工失败:', error);
    }
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
</style>
