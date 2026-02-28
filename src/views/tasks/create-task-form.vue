<template>
    <div class="create-task-form">
        <el-form 
            :model="form" 
            :rules="rules" 
            ref="formRef" 
            label-position="top"
            class="form"
        >
            <div class="form-section">
                <h3 class="section-title">基本信息</h3>
                <el-form-item label="标题" prop="title">
                    <el-input 
                        v-model="form.title" 
                        placeholder="输入任务标题" 
                        clearable 
                        maxlength="100"
                        show-word-limit
                    />
                </el-form-item>
                
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="所属部门" prop="departmentIds">
                            <el-select 
                                v-model="form.departmentIds" 
                                multiple 
                                placeholder="选择部门" 
                                filterable 
                                collapse-tags
                                collapse-tags-tooltip
                                class="full-width"
                            >
                                <el-option 
                                    v-for="d in departments" 
                                    :key="d.id" 
                                    :label="d.name" 
                                    :value="d.id" 
                                />
                            </el-select>
                            <div v-if="currentEmployee?.isFounder || currentEmployee?.positionCode === 'FOUNDER'" class="form-hint">
                                <el-icon><InfoFilled /></el-icon>
                                作为创始人，您可以给所有部门的员工分配任务
                            </div>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="优先级" prop="priority">
                            <el-select v-model="form.priority" placeholder="选择优先级" class="full-width">
                                <el-option :value="1" label="紧急">
                                    <span class="priority-option danger">紧急</span>
                                </el-option>
                                <el-option :value="2" label="高">
                                    <span class="priority-option warning">高</span>
                                </el-option>
                                <el-option :value="3" label="中">
                                    <span class="priority-option info">中</span>
                                </el-option>
                                <el-option :value="4" label="低">
                                    <span class="priority-option success">低</span>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

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
                        v-model="form.description" 
                        placeholder="输入任务描述..."
                        :rows="4"
                        maxlength="500"
                        show-word-limit
                    />
                </el-form-item>
            </div>

            <div class="form-section">
                <h3 class="section-title">人员分配</h3>
                <el-form-item label="负责人" prop="responsibles">
                    <div class="responsible-wrapper">
                        <div class="selected-list" v-if="form.responsibles.length > 0">
                            <el-tag
                                v-for="id in form.responsibles"
                                :key="id"
                                closable
                                @close="removeResponsible(id)"
                                size="default"
                                effect="plain"
                            >
                                {{ getResponsibleName(id) }}
                            </el-tag>
                        </div>
                        <el-button 
                            plain 
                            :icon="Plus" 
                            @click="openResponsibleChooser"
                            class="add-btn"
                        >
                            添加负责人
                        </el-button>
                    </div>
                </el-form-item>
            </div>

            <div class="form-actions-fixed">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="submitting">
                    创建任务
                </el-button>
            </div>
        </el-form>

        <!-- 负责人选择弹窗 (保持 Dialog 以避免嵌套 Drawer 的复杂性) -->
        <el-dialog
            v-model="responsibleChooserVisible"
            title="选择负责人"
            width="500px"
            class="chooser-dialog"
            append-to-body
        >
            <div class="dialog-content">
                <el-input
                    v-model="empKeyword"
                    placeholder="搜索姓名或部门"
                    :prefix-icon="Search"
                    clearable
                    @input="filterChooserTree"
                    class="search-input"
                />
                <div class="tree-wrapper">
                    <el-tree
                        v-if="filteredChooserTree.length > 0"
                        ref="chooserTreeRef"
                        :data="filteredChooserTree"
                        :props="{ label: 'label', children: 'children' }"
                        show-checkbox
                        node-key="id"
                        :default-expand-all="true"
                        :check-strictly="true"
                        @check="handleEmployeeCheck"
                    />
                    <el-empty v-else description="未找到匹配员工" :image-size="60" />
                </div>
            </div>
            <template #footer>
                <el-button @click="responsibleChooserVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmResponsibles">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Search, InfoFilled } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { createTask, listDepartments, listEmployees, getMyEmployee } from '@/api';
import { useUserStore } from '@/store/user';

const emit = defineEmits(['success', 'cancel']);

const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = ref<any>({
    title: '',
    departmentIds: [],
    priority: 3,
    deadline: '',
    description: '',
    responsibles: [],
});

const departments = ref<any[]>([]);
const employees = ref<any[]>([]);
const employeeMap = ref<Record<string, any>>({});
const currentEmployee = ref<any>(null);
const userStore = useUserStore();

const responsibleChooserVisible = ref(false);
const chooserTreeRef = ref();
const empKeyword = ref('');
const chooserTree = ref<any[]>([]);
const filteredChooserTree = ref<any[]>([]);
const selectedEmployeeIds = ref<string[]>([]);

const rules: FormRules = {
    title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
    departmentIds: [{ required: true, message: '请选择部门', trigger: 'change' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
    deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
};

async function loadDepartments() {
    try {
        const companyId = userStore.companyId || '';
        const resp = await listDepartments({ page: 1, pageSize: 100, companyId });
        if (resp.data?.code === 200) {
            // 适配后端返回的 departments key
            const data = resp.data?.data;
            const list = data?.list || data?.departments?.list || data?.departments || [];
            departments.value = list.map((d: any) => ({
                id: d.id || d.departmentId || d.DepartmentId || d.Id,
                name: d.departmentName || d.DepartmentName || d.name || d.Name || '未命名部门',
            }));
        }
    } catch (error: any) {
        console.error('加载部门列表失败:', error);
    }
}

async function loadEmployees() {
    try {
        const companyId = userStore.companyId || '';
        const resp = await listEmployees({ page: 1, pageSize: 1000, companyId });
        if (resp.data?.code === 200) {
            const list = resp.data?.data?.list || resp.data?.data || [];
            employees.value = list.map((e: any) => ({
                id: e.id || e.employeeId,
                name: e.realName || e.name || '未知',
                departmentId: e.departmentId || e.department_id,
                departmentName: e.departmentName || '',
            }));
            
            employees.value.forEach((emp: any) => {
                employeeMap.value[String(emp.id)] = emp;
            });

            buildChooserTree();
        }
    } catch (error: any) {
        console.error('加载员工列表失败:', error);
    }
}

function buildChooserTree() {
    // 检查是否是创始人
    const isFounder = currentEmployee.value?.isFounder === 1 || 
                      currentEmployee.value?.positionCode === 'FOUNDER' ||
                      currentEmployee.value?.roleTags?.includes('创始人');
    
    // 如果是创始人，显示所有部门；否则只显示选中的部门
    const selectedDeptIds = isFounder 
        ? departments.value.map((d: any) => String(d.id))
        : (form.value.departmentIds.length > 0 
            ? form.value.departmentIds.map((id: string) => String(id))
            : departments.value.map((d: any) => String(d.id)));
    
    const deptMap = new Map();
    
    departments.value.forEach((dept: any) => {
        const deptId = String(dept.id);
        if (selectedDeptIds.includes(deptId)) {
            deptMap.set(deptId, {
                id: `dept_${dept.id}`,
                label: dept.name,
                type: 'department',
                children: [],
            });
        }
    });

    employees.value.forEach((emp: any) => {
        const deptId = String(emp.departmentId);
        if (deptMap.has(deptId)) {
            deptMap.get(deptId).children.push({
                id: String(emp.id),
                label: emp.name,
                type: 'employee',
            });
        }
    });

    chooserTree.value = Array.from(deptMap.values());
    filteredChooserTree.value = chooserTree.value;
}

function filterChooserTree() {
    const keyword = empKeyword.value.trim().toLowerCase();
    if (!keyword) {
        filteredChooserTree.value = chooserTree.value;
        return;
    }
    
    filteredChooserTree.value = chooserTree.value.map((dept: any) => {
        const deptMatch = dept.label.toLowerCase().includes(keyword);
        const filteredChildren = dept.children.filter((emp: any) => {
            return emp.label.toLowerCase().includes(keyword);
        });
        
        if (deptMatch || filteredChildren.length > 0) {
            return {
                ...dept,
                children: deptMatch ? dept.children : filteredChildren,
            };
        }
        return null;
    }).filter(Boolean);
}

function openResponsibleChooser() {
    // 检查是否是创始人
    const isFounder = currentEmployee.value?.isFounder === 1 || 
                      currentEmployee.value?.positionCode === 'FOUNDER' ||
                      currentEmployee.value?.roleTags?.includes('创始人');
    
    // 如果不是创始人，需要先选择部门
    if (!isFounder && form.value.departmentIds.length === 0) {
        ElMessage.warning('请先选择部门');
        return;
    }
    buildChooserTree();
    empKeyword.value = '';
    filteredChooserTree.value = chooserTree.value;
    selectedEmployeeIds.value = [...form.value.responsibles];
    responsibleChooserVisible.value = true;
    nextTick(() => {
        if (chooserTreeRef.value) {
            chooserTreeRef.value.setCheckedKeys(selectedEmployeeIds.value);
        }
    });
}

function handleEmployeeCheck(data: any, checked: any) {
    const checkedKeys = checked.checkedKeys || [];
    selectedEmployeeIds.value = checkedKeys.filter((key: string) => !key.startsWith('dept_'));
}

function confirmResponsibles() {
    form.value.responsibles = [...selectedEmployeeIds.value];
    responsibleChooserVisible.value = false;
}

function removeResponsible(id: string) {
    form.value.responsibles = form.value.responsibles.filter((rid: string) => rid !== id);
}

function getResponsibleName(id: string) {
    const emp = employeeMap.value[String(id)];
    return emp ? emp.name : `员工${id}`;
}

function handleCancel() {
    emit('cancel');
}

async function handleSubmit() {
    if (!formRef.value) return;
    
    await formRef.value.validate(async (valid) => {
        if (valid) {
            submitting.value = true;
            try {
                let companyId = userStore.companyId || '';
                if (!companyId) {
                    const me = await getMyEmployee();
                    companyId = me?.data?.data?.companyId || '';
                }
                
                if (!companyId) {
                    ElMessage.error('无法获取公司ID');
                    return;
                }
                
                let taskDeadline = '';
                if (form.value.deadline) {
                    const deadlineDate = new Date(form.value.deadline);
                    taskDeadline = deadlineDate.toISOString().split('T')[0];
                }
                
                // 根据部门数量确定任务类型：1-单部门，2-跨部门
                const taskType = (form.value.departmentIds?.length || 0) > 1 ? 2 : 1;
                
                const resp = await createTask({
                    companyId: companyId,
                    taskTitle: form.value.title,
                    taskDetail: form.value.description || '',
                    taskPriority: form.value.priority,
                    taskType: taskType,
                    taskDeadline: taskDeadline,
                    departmentIds: form.value.departmentIds || [],
                    responsibleEmployeeIds: form.value.responsibles || [],
                    nodeEmployeeIds: form.value.responsibles || [],
                });
                
                if (resp.data?.code === 200) {
                    ElMessage.success('任务创建成功');
                    emit('success');
                } else {
                    ElMessage.error(resp.data?.msg || '创建失败');
                }
            } catch (error: any) {
                console.error('创建任务失败:', error);
                ElMessage.error('创建失败');
            } finally {
                submitting.value = false;
            }
        }
    });
}

watch(() => form.value.departmentIds, () => {
    if (form.value.departmentIds.length > 0) {
        buildChooserTree();
    }
}, { deep: true });

onMounted(async () => {
    // 加载当前员工信息
    try {
        const me = await getMyEmployee();
        currentEmployee.value = me?.data?.data || me?.data?.employee || {};
    } catch (error: any) {
        console.error('获取当前员工信息失败:', error);
    }
    await Promise.all([loadDepartments(), loadEmployees()]);
});
</script>

<style scoped>
.create-task-form {
    padding-bottom: 60px; /* 留出底部按钮空间 */
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
    border-left: 3px solid #3B82F6;
    line-height: 1.2;
}

.full-width {
    width: 100%;
}

.priority-option.danger { color: #ef4444; font-weight: 600; }
.priority-option.warning { color: #f59e0b; font-weight: 600; }
.priority-option.info { color: #6b7280; }
.priority-option.success { color: #10b981; }

.responsible-wrapper {
    width: 100%;
}

.selected-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
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

.chooser-dialog :deep(.el-dialog__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    margin-right: 0;
}

.dialog-content {
    padding: 10px 0;
}

.search-input {
    margin-bottom: 16px;
}

.tree-wrapper {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
    padding: 8px;
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
