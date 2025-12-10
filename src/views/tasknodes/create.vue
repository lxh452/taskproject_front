zi'ca<template>
    <div class="create-node-page">
        <el-card shadow="hover" class="main-card" v-loading="loading">
            <template #header>
                <div class="card-header">
                    <div class="card-header-left">
                        <div class="card-header-title">创建任务节点</div>
                        <div class="card-header-desc">填写节点信息，创建新的任务节点</div>
                    </div>
                </div>
            </template>
            
            <el-form 
                :model="form" 
                label-width="120px" 
                :rules="rules" 
                ref="formRef"
                class="create-form"
            >
                <div class="form-section">
                    <div class="section-header">
                        <el-icon class="section-icon"><Document /></el-icon>
                        <span class="section-title">基本信息</span>
                    </div>
                    <el-row :gutter="24">
                        <el-col :span="12">
                            <el-form-item label="所属任务" prop="taskId">
                                <el-select 
                                    v-model="form.taskId" 
                                    filterable 
                                    placeholder="请选择任务" 
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
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="所属部门">
                                <el-input v-model="deptDisplay" disabled class="full-width" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="24">
                        <el-col :span="12">
                            <el-form-item label="节点类型" prop="nodeType">
                                <el-select 
                                    v-model="form.nodeType" 
                                    placeholder="请选择类型" 
                                    class="full-width"
                                >
                                    <el-option label="任务节点" :value="1" />
                                    <el-option label="条件节点" :value="2" />
                                    <el-option label="审批节点" :value="3" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="节点名称" prop="nodeName">
                                <el-input 
                                    v-model="form.nodeName" 
                                    placeholder="例如：接口开发" 
                                    class="full-width"
                                    clearable
                                />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-form-item label="节点详情">
                        <el-input 
                            v-model="form.nodeDetail" 
                            type="textarea" 
                            :rows="4" 
                            placeholder="请描述节点的具体内容和要求"
                            maxlength="500"
                            show-word-limit
                        />
                    </el-form-item>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <el-icon class="section-icon"><Calendar /></el-icon>
                        <span class="section-title">时间安排</span>
                    </div>
                    <el-row :gutter="24">
                        <el-col :span="12">
                            <el-form-item label="开始时间">
                                <el-date-picker 
                                    v-model="form.nodeStartTime" 
                                    type="datetime" 
                                    placeholder="选择开始时间"
                                    class="full-width"
                                    format="YYYY-MM-DD HH:mm:ss"
                                    value-format="YYYY-MM-DD HH:mm:ss"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="截止时间" prop="nodeDeadline">
                                <el-date-picker 
                                    v-model="form.nodeDeadline" 
                                    type="datetime" 
                                    placeholder="选择截止时间"
                                    class="full-width"
                                    format="YYYY-MM-DD HH:mm:ss"
                                    value-format="YYYY-MM-DD HH:mm:ss"
                                />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-form-item label="预计工时(小时)">
                        <el-input-number 
                            v-model="form.estimatedHours" 
                            :min="0" 
                            :max="1000"
                            :precision="1"
                            :step="0.5"
                            class="full-width"
                        />
                    </el-form-item>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <el-icon class="section-icon"><User /></el-icon>
                        <span class="section-title">人员分配</span>
                    </div>
                    <el-row :gutter="24">
                        <el-col :span="12">
                            <el-form-item label="负责人" prop="leaderId">
                                <el-select 
                                    v-model="form.leaderId" 
                                    filterable 
                                    placeholder="选择负责人（本部门）" 
                                    class="full-width"
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
                            <el-form-item label="执行人" prop="executorIds">
                                <el-select 
                                    v-model="form.executorIds" 
                                    multiple 
                                    filterable 
                                    :placeholder="currentEmployee?.isFounder || currentEmployee?.positionCode === 'FOUNDER' ? '选择执行人（可多选，创始人可给所有人分配）' : '选择执行人（本部门，可多选）'" 
                                    class="full-width"
                                    collapse-tags
                                    collapse-tags-tooltip
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
                                <div v-if="currentEmployee?.isFounder || currentEmployee?.positionCode === 'FOUNDER'" class="form-hint" style="margin-top: 8px; font-size: 12px; color: #909399;">
                                    <el-icon><InfoFilled /></el-icon>
                                    作为创始人，您可以给所有人分配任务
                                </div>
                                <div v-else class="form-hint" style="margin-top: 8px; font-size: 12px; color: #909399;">
                                    <el-icon><InfoFilled /></el-icon>
                                    不能给职位级别更高或部门优先级更高的员工安排任务，但可以给自己安排
                                </div>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </div>

                <el-alert
                    title="提示：前置依赖关系请在「流程设计器」中通过连线设置，此处仅创建节点基本信息。"
                    type="info"
                    show-icon
                    :closable="false"
                    class="info-alert"
                />

                <div class="form-actions">
                    <el-button type="success" :icon="Connection" @click="openDesigner" size="large">
                        打开流程设计器
                    </el-button>
                    <el-button type="primary" :icon="Check" @click="onSubmit" size="large" :loading="submitting">
                        创建节点
                    </el-button>
                    <el-button :icon="RefreshLeft" @click="onReset" size="large">
                        重置
                    </el-button>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, Calendar, User, Connection, Check, RefreshLeft, InfoFilled } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { createTaskNode, listTasks, getMyEmployee, listEmployees } from '@/api';
import { useUserStore } from '@/store/user';

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
const loading = ref(false);

async function loadTasks() {
    try {
        const resp = await listTasks({ page: 1, pageSize: 100 });
        if (resp.data?.code === 200) {
            const list = resp.data?.data?.list || resp.data?.data || [];
            taskOptions.value = (list as any[])
                .map((t: any) => ({ id: t.taskId || t.id || t.Id, title: t.taskTitle || t.title || t.TaskTitle }))
                .filter((t: any) => !!t.id);
        } else {
            console.warn('加载任务列表失败:', resp.data?.msg);
            taskOptions.value = [];
        }
    } catch (error: any) {
        console.error('加载任务列表异常:', error);
        taskOptions.value = [];
    }
}

async function initMyDepartmentAndEmployees() {
    try {
        const me = await getMyEmployee();
        const emp = me?.data?.data || me?.data?.employee || {};
        currentEmployee.value = emp;
        const deptId = emp.departmentId || emp.DepartmentId || emp.department_id || '';
        const deptName = emp.departmentName || emp.DepartmentName || '';
        form.value.departmentId = String(deptId || '');
        deptDisplay.value = deptName || form.value.departmentId || '未设置部门';
        
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
                id: e.id || e.employeeId || e.Id, 
                name: e.realName || e.RealName || e.username || e.Username || '未知',
                positionLevel: e.positionLevel || 0,
                departmentPriority: e.departmentPriority || 0,
                isFounder: e.isFounder === true || e.positionCode === 'FOUNDER',
                positionCode: e.positionCode || '',
            }));
            
            // 过滤员工选项（不能以下犯上，不能给创始人安排任务，但允许给自己安排）
            filterEmployeeOptions();
        } else {
            console.warn('加载员工列表失败:', resp.data?.msg);
            employeeOptions.value = [];
        }
    } catch (error: any) {
        console.error('加载部门员工信息异常:', error);
        employeeOptions.value = [];
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

function onTaskChange() {
    // 预留：切换任务时可自动筛选推荐部门
}

onMounted(async () => {
    loading.value = true;
    try {
        await Promise.all([
            loadTasks().catch(err => {
                console.error('加载任务失败:', err);
                ElMessage.warning('加载任务列表失败，部分功能可能受限');
            }),
            initMyDepartmentAndEmployees().catch(err => {
                console.error('加载部门员工失败:', err);
                ElMessage.warning('加载部门信息失败，请检查权限设置');
            })
        ]);
    } catch (error: any) {
        console.error('初始化失败:', error);
        ElMessage.error('加载数据失败，请刷新页面重试');
    } finally {
        loading.value = false;
    }
});

const rules: FormRules = {
    taskId: [{ required: true, message: '请选择所属任务', trigger: 'change' }],
    nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
    nodeName: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
    nodeDeadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
    leaderId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
    executorIds: [{ type: 'array', required: true, message: '请选择至少一位执行人', trigger: 'change' }],
};

const onSubmit = () => {
    if (!formRef.value) return;
    formRef.value.validate(async (valid) => {
        if (!valid) return;
        const exists = taskOptions.value.some(t => String(t.id) === String(form.value.taskId));
        if (!exists) {
            ElMessage.error('所属任务不存在或无权限，请重新选择');
            return;
        }
        const sanitize = (v: any) => {
            const s = String(v ?? '').trim();
            if (!s) return '';
            if (/\bcode\b\s*[:=]\s*404/.test(s) || /资源不存在/.test(s)) return '';
            return s;
        };
        form.value.nodeName = sanitize(form.value.nodeName);
        form.value.nodeDetail = sanitize(form.value.nodeDetail);
        if (!form.value.nodeName) {
            ElMessage.error('请填写节点名称');
            return;
        }
        const allowedIds = new Set((employeeOptions.value || []).map(e => String(e.id)));
        if (!allowedIds.has(String(form.value.leaderId))) {
            ElMessage.error('负责人不属于当前部门');
            return;
        }
        const safeExecutors = (Array.isArray(form.value.executorIds) ? form.value.executorIds : []).filter((id: any) => allowedIds.has(String(id)));
        if (safeExecutors.length === 0) {
            ElMessage.error('请至少选择一位本部门执行人');
            return;
        }
        submitting.value = true;
        try {
            const payload: any = {
                taskId: form.value.taskId,
                departmentId: form.value.departmentId,
                nodeType: form.value.nodeType,
                nodeName: form.value.nodeName,
                nodeDetail: form.value.nodeDetail,
                nodeStartTime: form.value.nodeStartTime ? formatDate(form.value.nodeStartTime) : undefined,
                nodeDeadline: form.value.nodeDeadline ? formatDate(form.value.nodeDeadline) : undefined,
                estimatedHours: form.value.estimatedHours || 0,
                leaderId: form.value.leaderId,
                executorId: safeExecutors,
            };
            const resp = await createTaskNode(payload);
            if (resp.data.code !== 200) throw new Error(resp.data.msg || '创建失败');
            ElMessage.success('创建成功');
            onReset();
        } catch (e: any) {
            ElMessage.error(e.message || '创建失败');
        } finally {
            submitting.value = false;
        }
    });
};

const onReset = () => {
    const deptId = form.value.departmentId;
    form.value = { 
        taskId: '', 
        departmentId: deptId, 
        nodeType: undefined, 
        nodeName: '', 
        nodeDetail: '', 
        nodeStartTime: '', 
        nodeDeadline: '', 
        estimatedHours: 0, 
        leaderId: '', 
        executorIds: [] 
    };
    formRef.value?.clearValidate();
};

function formatDate(d: any) {
    const date = new Date(d);
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function openDesigner() {
    if (!form.value.taskId) {
        ElMessage.warning('请先填写所属任务ID');
        return;
    }
    window.location.hash = `#/flow-designer?taskId=${encodeURIComponent(form.value.taskId)}`;
}
</script>

<style scoped>
.create-node-page {
    padding: 20px;
    background: var(--bg-page);
    min-height: calc(100vh - 100px);
}

.main-card {
    border-radius: 16px;
    box-shadow: var(--shadow-lg);
    border: none;
    max-width: 1200px;
    margin: 0 auto;
    background: var(--bg-card);
}

.main-card :deep(.el-card__header) {
    background: var(--bg-card);
    border-bottom: 2px solid var(--border-color);
    padding: 20px 24px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.card-header-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-main);
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.card-header-desc {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 400;
}

.create-form {
    padding: 24px;
}

.form-section {
    margin-bottom: 32px;
    padding: 24px;
    background: var(--bg-card);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
}

.form-section:hover {
    box-shadow: var(--shadow-md);
}

.section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--border-color);
}

.section-icon {
    font-size: 20px;
    color: var(--color-primary);
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
    letter-spacing: -0.01em;
}

.full-width {
    width: 100%;
}

.create-form :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--text-main);
    font-size: 14px;
}

.create-form :deep(.el-input__inner),
.create-form :deep(.el-select .el-input__inner),
.create-form :deep(.el-textarea__inner) {
    border-radius: 8px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    font-size: 14px;
    background-color: var(--bg-card);
    color: var(--text-main);
}

.create-form :deep(.el-input__inner:hover),
.create-form :deep(.el-select .el-input__inner:hover),
.create-form :deep(.el-textarea__inner:hover) {
    border-color: var(--color-primary);
}

.create-form :deep(.el-input__inner:focus),
.create-form :deep(.el-select .el-input__inner:focus),
.create-form :deep(.el-textarea__inner:focus) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.create-form :deep(.el-date-editor) {
    width: 100%;
}

.create-form :deep(.el-date-editor .el-input__inner) {
    border-radius: 8px;
}

.info-alert {
    margin: 24px 0;
    border-radius: 8px;
    border-left: 4px solid var(--color-info);
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 2px solid var(--border-color);
}

.form-actions .el-button {
    padding: 12px 24px;
    font-weight: 600;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-actions .el-button--primary {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

.form-actions .el-button--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.45);
}

.form-actions .el-button--success {
    background: linear-gradient(135deg, var(--color-success) 0%, #22c55e 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.35);
}

.form-actions .el-button--success:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 222, 128, 0.45);
}
</style>
