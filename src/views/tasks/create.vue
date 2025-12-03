<template>
    <div class="create-task-page">
        <el-card shadow="hover" class="main-card">
            <template #header>
                <div class="card-header">
                    <div class="card-header-left">
                        <div class="card-header-title">
                            <el-icon class="title-icon"><Plus /></el-icon>
                            <span>创建任务</span>
                        </div>
                    </div>
                </div>
            </template>
            
            <el-form 
                :model="form" 
                :rules="rules" 
                ref="formRef" 
                label-width="120px" 
                class="create-form"
            >
                <div class="form-section">
                    <div class="section-header">
                        <el-icon class="section-icon"><Document /></el-icon>
                        <span class="section-title">基本信息</span>
                    </div>
                    <el-form-item label="标题" prop="title">
                        <el-input 
                            v-model="form.title" 
                            placeholder="请输入任务标题" 
                            clearable 
                            class="full-width"
                            maxlength="100"
                            show-word-limit
                        />
                    </el-form-item>
                    <el-form-item label="所属部门" prop="departmentIds">
                        <el-select 
                            v-model="form.departmentIds" 
                            multiple 
                            placeholder="请选择部门（可多选）" 
                            filterable 
                            clearable 
                            class="full-width"
                            collapse-tags
                            collapse-tags-tooltip
                        >
                            <el-option 
                                v-for="d in departments" 
                                :key="d.id" 
                                :label="d.name" 
                                :value="d.id" 
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="优先级" prop="priority">
                        <el-select 
                            v-model="form.priority" 
                            placeholder="请选择优先级" 
                            class="priority-select"
                        >
                            <el-option :value="1" label="紧急">
                                <span class="priority-option">
                                    <el-icon class="priority-icon danger"><Warning /></el-icon>
                                    <span>紧急</span>
                                </span>
                            </el-option>
                            <el-option :value="2" label="高">
                                <span class="priority-option">
                                    <el-icon class="priority-icon warning"><ArrowUp /></el-icon>
                                    <span>高</span>
                                </span>
                            </el-option>
                            <el-option :value="3" label="中">
                                <span class="priority-option">
                                    <el-icon class="priority-icon info"><Minus /></el-icon>
                                    <span>中</span>
                                </span>
                            </el-option>
                            <el-option :value="4" label="低">
                                <span class="priority-option">
                                    <el-icon class="priority-icon success"><ArrowDown /></el-icon>
                                    <span>低</span>
                                </span>
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="截止时间" prop="deadline">
                        <el-date-picker 
                            v-model="form.deadline" 
                            type="datetime" 
                            placeholder="选择截止时间"
                            class="full-width"
                            format="YYYY-MM-DD HH:mm:ss"
                            value-format="YYYY-MM-DD HH:mm:ss"
                        />
                    </el-form-item>
                    <el-form-item label="描述" prop="description">
                        <el-input 
                            type="textarea" 
                            :rows="6" 
                            v-model="form.description" 
                            placeholder="请输入任务描述"
                            maxlength="1000"
                            show-word-limit
                        />
                    </el-form-item>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <el-icon class="section-icon"><User /></el-icon>
                        <span class="section-title">负责人分配</span>
                    </div>
                    <el-form-item label="负责人" prop="responsibles">
                        <div class="assignees-wrapper">
                            <div class="assignees">
                                <el-tag
                                    v-for="uid in form.responsibles"
                                    :key="uid"
                                    closable
                                    class="assignee-tag"
                                    @close="removeAssignee(uid)"
                                    type="primary"
                                >
                                    {{ idToName[uid] || uid }}
                                </el-tag>
                                <el-button 
                                    type="primary" 
                                    link 
                                    :icon="Plus" 
                                    @click="chooserVisible=true"
                                    class="add-btn"
                                >
                                    选择负责人
                                </el-button>
                            </div>
                            <div class="assignees-hint" v-if="form.responsibles.length === 0">
                                <el-icon><InfoFilled /></el-icon>
                                <span>请至少选择一位负责人</span>
                            </div>
                        </div>
                    </el-form-item>
                </div>

                <div class="form-actions">
                    <el-button 
                        type="primary" 
                        :icon="Check" 
                        :loading="submitting" 
                        @click="submit"
                        size="large"
                    >
                        提交任务
                    </el-button>
                    <el-button 
                        :icon="RefreshLeft" 
                        @click="reset"
                        size="large"
                    >
                        重置
                    </el-button>
                </div>
            </el-form>
        </el-card>

        <el-dialog 
            v-model="chooserVisible" 
            title="选择负责人" 
            width="720px"
            class="chooser-dialog"
        >
            <div class="dialog-content">
                <el-input 
                    v-model="search" 
                    placeholder="搜索员工姓名/邮箱" 
                    class="search-input"
                    clearable
                    :prefix-icon="Search"
                />
                <el-tree
                    ref="treeRef"
                    :data="chooserTree"
                    node-key="id"
                    show-checkbox
                    :props="{ label: 'label', children: 'children' }"
                    :check-on-click-node="true"
                    :filter-node-method="filterNode"
                    default-expand-all
                    @check="onTreeCheck"
                    class="chooser-tree"
                />
            </div>
            <template #footer>
                <el-button @click="chooserVisible=false">取消</el-button>
                <el-button type="primary" @click="confirmChoose">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { 
    Document, User, Check, RefreshLeft, Plus, InfoFilled, Search,
    Warning, ArrowUp, ArrowDown, Minus
} from '@element-plus/icons-vue';
import { listDepartments, listEmployees, getMyEmployee, createTask } from '@/api';

const formRef = ref();
const myCompanyId = ref<string>('');
const myEmployeeId = ref<string>('');
const form = reactive<any>({
    title: '',
    departmentIds: [] as string[],
    responsibles: [] as string[],
    deadline: '',
    priority: 3,
    description: '',
    taskType: 0,
});

const rules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    departmentIds: [{ required: true, message: '请选择至少一个部门', trigger: 'change' }],
    deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
    responsibles: [{ type: 'array', required: true, message: '请至少选择一位负责人', trigger: 'change' }],
};

const departments = ref<{ id: string; name: string }[]>([]);
const empByDept = ref<Record<string, { id: string; name: string; email: string }[]>>({});
const employeeOptions = ref<{ id: string; label: string }[]>([]);
const chooserVisible = ref(false);
const chooserTree = ref<any[]>([]);
const treeRef = ref();
const search = ref('');
const idToName = reactive<Record<string, string>>({});
const submitting = ref(false);

onMounted(async () => {
    try {
        const me = await getMyEmployee();
        const companyId = me?.data?.data?.companyId || me?.data?.data?.CompanyId || '';
        const employeeId = me?.data?.data?.employeeId || me?.data?.data?.EmployeeId || '';
        myCompanyId.value = String(companyId || '');
        myEmployeeId.value = String(employeeId || '');
        const depReq: any = { page: 1, pageSize: 100 };
        if (companyId) depReq.companyId = companyId;
        const resp = await listDepartments(depReq);
        if (resp.data?.code !== 200) return;
        const list = resp.data?.data?.list || [];
        departments.value = list.map((d: any) => ({
            id: d.id || d.Id,
            name: d.departmentName || d.DepartmentName || '未命名部门',
        }));
        const empReq: any = { page: 1, pageSize: 100 };
        if (companyId) empReq.companyId = companyId;
        const eres = await listEmployees(empReq);
        const elist = eres.data?.data?.list || [];
        const byDept: Record<string, any[]> = {};
        elist.forEach((e: any) => {
            const dep = String(e.departmentId || e.DepartmentId || '');
            if (!byDept[dep]) byDept[dep] = [];
            const id = e.id || e.employeeId || e.EmployeeId;
            const name = e.realName || e.name || '未知';
            byDept[dep].push({ id, name, email: e.workEmail || e.email || '' });
            idToName[id] = name;
        });
        empByDept.value = byDept;
        rebuildChooserTree();
    } catch {}
});

function filterNode(value: string, data: any) {
    if (!value) return true;
    return String(data.label).toLowerCase().includes(value.toLowerCase());
}

watch(search, (val) => {
    const tree: any = treeRef.value;
    if (tree && typeof tree.filter === 'function') tree.filter(val);
});

function onTreeCheck() {
    // no-op; we confirm on click
}

function confirmChoose() {
    const tree = treeRef.value as any;
    const nodes: any[] = tree.getCheckedNodes(true);
    const allowedDept = new Set((form.departmentIds || []).map((x: any) => String(x)));
    const leafIds = nodes
        .filter((n: any) => n.type === 'emp')
        .map((n: any) => String(n.id))
        .filter((id: string) => {
            for (const depId in empByDept.value) {
                if ((empByDept.value[depId] || []).some((e) => e.id === id)) {
                    return allowedDept.has(String(depId));
                }
            }
            return false;
        });
    form.responsibles = Array.from(new Set(leafIds));
    chooserVisible.value = false;
}

function removeAssignee(id: string) {
    form.responsibles = form.responsibles.filter((x: string) => x !== id);
}

function reset() {
    Object.assign(form, { title: '', departmentIds: [], responsibles: [], deadline: '', priority: 3, description: '', taskType: 0 });
    formRef.value?.clearValidate();
}

async function submit() {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid: boolean) => {
        if (!valid) return;
        try {
            submitting.value = true;
            function formatDateTime(val: any): string {
                const d = val instanceof Date ? val : new Date(val);
                if (Number.isNaN(d.getTime())) return '';
                const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
                return (
                    d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
                    pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
                );
            }
            function formatDateOnly(val: any): string {
                const d = val instanceof Date ? val : new Date(val);
                if (Number.isNaN(d.getTime())) return '';
                const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
                return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
            }
            const depIds = Array.isArray(form.departmentIds) ? form.departmentIds : [];
            const autoTaskType = depIds.length > 1 ? 1 : form.taskType;
            const payload = {
                taskTitle: form.title,
                departmentIds: depIds,
                responsibleEmployeeIds: Array.isArray(form.responsibles) ? form.responsibles : [],
                nodeEmployeeIds: Array.isArray(form.responsibles) ? form.responsibles : [],
                taskDeadline: formatDateOnly(form.deadline),
                taskStartTime: formatDateTime(new Date()),
                taskPriority: form.priority,
                taskStatus: 0,
                taskType: autoTaskType,
                description: form.description,
                taskDetail: form.description,
                companyId: myCompanyId.value,
                taskCreator: myEmployeeId.value,
                taskAssigner: myEmployeeId.value,
                department_ids: depIds,
                responsible_employee_ids: Array.isArray(form.responsibles) ? form.responsibles : [],
                node_employee_ids: Array.isArray(form.responsibles) ? form.responsibles : [],
                task_start_time: formatDateTime(new Date()),
                task_creator: myEmployeeId.value,
            };
            const resp = await createTask(payload);
            if (resp.data?.code !== 200) throw new Error(resp.data?.msg || '创建任务失败');
            ElMessage.success('任务创建成功');
            reset();
        } catch (e: any) {
            const url = e?.response?.config?.url || '';
            const status = e?.response?.status;
            const msg = e?.response?.data?.msg || e?.message || '提交失败';
            console.error('创建任务失败:', { url, status, msg, payload });
            ElMessage.error(`${msg}${url ? ' (' + url + ')' : ''}`);
        } finally {
            submitting.value = false;
        }
    });
}

function rebuildChooserTree() {
    const selectedDeptIds = (form.departmentIds || []).map((x: any) => String(x));
    const deptSet = new Set(selectedDeptIds);
    const children = departments.value
        .filter((d) => deptSet.size === 0 || deptSet.has(String(d.id)))
        .map((d) => ({
            id: d.id,
            label: d.name,
            type: 'dept',
            children: (empByDept.value[String(d.id)] || []).map((e) => ({ id: e.id, label: `${e.name}`, isLeaf: true, type: 'emp' }))
        }));
    chooserTree.value = [
        { id: myCompanyId.value || 'company', label: '所属公司', children }
    ];
}

watch(() => form.departmentIds, () => {
    rebuildChooserTree();
    if (Array.isArray(form.responsibles) && form.responsibles.length) {
        const allowed = new Set<string>();
        for (const depId in empByDept.value) {
            if (!(form.departmentIds as any[]).map(String).includes(String(depId))) continue;
            for (const emp of empByDept.value[depId] || []) allowed.add(emp.id);
        }
        form.responsibles = form.responsibles.filter((id: string) => allowed.has(id));
    }
}, { deep: true });
</script>

<style scoped>
.create-task-page {
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8ecf1 100%);
    min-height: calc(100vh - 100px);
}

.main-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    max-width: 1000px;
    margin: 0 auto;
}

.main-card :deep(.el-card__header) {
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border-bottom: 2px solid #e5e7eb;
    padding: 20px 24px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header-left {
    display: flex;
    align-items: center;
    flex: 1;
}

.card-header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: -0.02em;
}

.title-icon {
    font-size: 24px;
    color: #2563eb;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);
    padding: 8px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-header-desc {
    font-size: 14px;
    color: #6b7280;
    font-weight: 400;
}

.create-form {
    padding: 24px;
}

.form-section {
    margin-bottom: 32px;
    padding: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
}

.form-section:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e5e7eb;
}

.section-icon {
    font-size: 20px;
    color: #667eea;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    letter-spacing: -0.01em;
}

.full-width {
    width: 100%;
}

.priority-select {
    width: 200px;
}

.priority-option {
    display: flex;
    align-items: center;
    gap: 8px;
}

.priority-icon {
    font-size: 16px;
}

.priority-icon.danger {
    color: #f56c6c;
}

.priority-icon.warning {
    color: #e6a23c;
}

.priority-icon.info {
    color: #409eff;
}

.priority-icon.success {
    color: #67c23a;
}

.assignees-wrapper {
    width: 100%;
}

.assignees {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-height: 40px;
    padding: 8px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px dashed #d1d5db;
}

.assignee-tag {
    font-size: 13px;
    padding: 6px 12px;
    border-radius: 6px;
}

.add-btn {
    font-weight: 500;
}

.assignees-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 13px;
    color: #6b7280;
}

.create-form :deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
    font-size: 14px;
}

.create-form :deep(.el-input__inner),
.create-form :deep(.el-select .el-input__inner),
.create-form :deep(.el-textarea__inner) {
    border-radius: 8px;
    border: 1px solid #d1d5db;
    transition: all 0.3s ease;
    font-size: 14px;
}

.create-form :deep(.el-input__inner:hover),
.create-form :deep(.el-select .el-input__inner:hover),
.create-form :deep(.el-textarea__inner:hover) {
    border-color: #667eea;
}

.create-form :deep(.el-input__inner:focus),
.create-form :deep(.el-select .el-input__inner:focus),
.create-form :deep(.el-textarea__inner:focus) {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 2px solid #e5e7eb;
}

.form-actions .el-button {
    padding: 12px 24px;
    font-weight: 600;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-actions .el-button--primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

.form-actions .el-button--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.45);
}

.chooser-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border-bottom: 2px solid #e5e7eb;
    padding: 20px 24px;
}

.chooser-dialog :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.dialog-content {
    padding: 20px 0;
}

.search-input {
    margin-bottom: 20px;
}

.chooser-tree {
    max-height: 400px;
    overflow-y: auto;
    padding: 12px;
    background: #fafbfc;
    border-radius: 8px;
}

.chooser-tree :deep(.el-tree-node__content) {
    height: 40px;
    border-radius: 6px;
    margin-bottom: 4px;
    transition: all 0.2s ease;
}

.chooser-tree :deep(.el-tree-node__content:hover) {
    background: #f0f9ff;
}
</style>
