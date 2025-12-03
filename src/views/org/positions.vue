<template>
    <div class="positions-page">
        <div class="toolbar">
            <div class="toolbar-left">
                <el-input
                    v-model="query.keyword"
                    placeholder="搜索职位名称或编码"
                    class="search-input"
                    clearable
                    @clear="getData"
                    @keyup.enter="getData"
                    :prefix-icon="Search"
                />
                <el-button type="primary" @click="getData" :icon="Search">搜索</el-button>
            </div>
            <div class="toolbar-right">
                <el-button @click="getData" :icon="Refresh" circle plain />
                <el-button type="primary" :icon="Plus" @click="handleAdd">新增职位</el-button>
            </div>
        </div>

        <div class="table-container">
            <el-table :data="rows" style="width: 100%" v-loading="loading" class="positions-table" :header-cell-style="{ background: '#f9fafb', color: '#6b7280', fontWeight: '600' }">
                <el-table-column prop="positionName" label="职位名称" min-width="180">
                    <template #default="{ row }">
                        <div class="position-cell">
                            <span class="position-name">{{ row.positionName }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="positionCode" label="编码" width="150">
                    <template #default="{ row }">
                        <span class="code-text">{{ row.positionCode }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="positionLevel" label="等级" width="100" align="center">
                    <template #default="{ row }">
                        <div class="level-badge" :class="getLevelClass(row.positionLevel)">
                            {{ row.positionLevel }}级
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="isManagement" label="属性" width="120" align="center">
                    <template #default="{ row }">
                        <div class="type-badge" :class="row.isManagement === 1 ? 'manage' : 'normal'">
                            {{ row.isManagement === 1 ? '管理岗' : '普通岗' }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                    <template #default="{ row }">
                        <div class="status-badge" :class="row.status === 1 ? 'success' : 'default'">
                            {{ row.status === 1 ? '启用' : '停用' }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="280" align="right" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                        <el-button link type="primary" @click="handleAssignEmployee(row)">分配员工</el-button>
                        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 职位编辑/新增抽屉 -->
        <el-drawer
            v-model="dialogVisible"
            :title="isEdit ? '编辑职位' : '新增职位'"
            size="500px"
            class="modern-drawer"
            destroy-on-close
        >
            <el-form :model="form" label-position="top" :rules="rules" ref="formRef" class="drawer-form">
                <el-form-item label="所属部门" prop="departmentId" v-if="!isEdit">
                    <el-select 
                        v-model="form.departmentId" 
                        placeholder="请选择部门" 
                        filterable
                        class="full-width"
                    >
                        <el-option
                            v-for="dept in departments"
                            :key="dept.id"
                            :label="dept.name"
                            :value="dept.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="职位名称" prop="positionName">
                    <el-input v-model="form.positionName" placeholder="请输入职位名称" />
                </el-form-item>
                <el-form-item label="职位编码" prop="positionCode">
                    <el-input v-model="form.positionCode" placeholder="请输入职位编码（如：MGR_01）" />
                </el-form-item>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="职位等级" prop="positionLevel">
                            <el-input-number v-model="form.positionLevel" :min="1" :max="20" class="full-width" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="是否管理岗" prop="isManagement">
                            <el-radio-group v-model="form.isManagement">
                                <el-radio :label="1">是</el-radio>
                                <el-radio :label="0">否</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="状态" prop="status">
                    <el-switch
                        v-model="form.status"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="启用"
                        inactive-text="停用"
                    />
                </el-form-item>
                <el-form-item label="角色权限" prop="roleIds" v-if="!isEdit">
                    <el-select
                        v-model="form.roleIds"
                        placeholder="请选择角色（可多选）"
                        multiple
                        filterable
                        class="full-width"
                    >
                        <el-option
                            v-for="role in allRoles"
                            :key="role.id"
                            :label="role.name"
                            :value="role.id"
                        />
                    </el-select>
                    <div class="form-tip">提示：创建职位时可同时绑定角色，后续可在角色管理中修改</div>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
                </div>
            </template>
        </el-drawer>

        <!-- 员工分配抽屉 -->
        <el-drawer
            v-model="employeeDialogVisible"
            title="分配员工"
            size="500px"
            class="modern-drawer"
            destroy-on-close
        >
            <div v-loading="employeeLoading" class="drawer-content">
                <div class="info-card">
                    <div class="info-label">当前职位</div>
                    <div class="info-value">{{ currentPosition?.positionName }}</div>
                    <div class="info-tip">选择员工以分配到该职位</div>
                </div>
                <el-form label-position="top">
                    <el-form-item label="搜索员工">
                        <el-select
                            v-model="selectedEmployeeIds"
                            placeholder="搜索姓名/工号"
                            filterable
                            remote
                            :remote-method="onEmployeeRemote"
                            :loading="employeeSearchLoading"
                            multiple
                            collapse-tags
                            class="full-width"
                        >
                            <el-option 
                                v-for="e in employees" 
                                :key="e.id" 
                                :label="`${e.realName}（${e.employeeId}）`" 
                                :value="e.id" 
                            />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="employeeDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitEmployees" :loading="employeeSubmitting">保存配置</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { 
    listPositions, createPosition, updatePosition, deletePosition, 
    listEmployees, updateEmployee,
    listDepartments, roleList
} from '@/api';
import { Search, Plus, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const rows = ref<any[]>([]);
const loading = ref(false);
const query = ref({ keyword: '' });
const departments = ref<Array<{ id: string; name: string }>>([]);

const loadDepartments = async () => {
    try {
        const companyId = userStore.companyId || '';
        if (!companyId) return;
        const resp = await listDepartments({ page: 1, pageSize: 1000, companyId });
        if (resp.data.code === 200) {
            const list = resp.data.data?.list || [];
            departments.value = list.map((d: any) => ({
                id: d.id || d.Id,
                name: d.departmentName || d.DepartmentName || '未知部门'
            }));
        }
    } catch (error) {
        console.error('加载部门列表失败:', error);
    }
};

const getData = async () => {
    loading.value = true;
    try {
        const resp = await listPositions({ 
            page: 1, 
            pageSize: 100,
            departmentId: '', 
            name: query.value.keyword
        });
        if (resp.data.code !== 200) {
            ElMessage.error(resp.data.msg || '获取职位列表失败');
            return;
        }
        const list = resp.data.data?.list || resp.data.data?.positions?.list || [];
        rows.value = list.map((p: any) => ({
            id: p.id,
            positionName: p.positionName || '未命名职位',
            positionCode: p.positionCode?.String || p.positionCode || '-',
            positionLevel: p.positionLevel ?? 0,
            isManagement: p.isManagement ?? 0,
            status: p.status ?? 1,
            createTime: p.createTime
        }));
    } catch (error) {
        ElMessage.error('系统错误，请重试');
    } finally {
        loading.value = false;
    }
};

const getLevelClass = (level: number) => {
    if (level >= 15) return 'danger';
    if (level >= 10) return 'warning';
    if (level >= 5) return 'success';
    return 'info';
};

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();
const form = reactive({
    id: '',
    departmentId: '',
    positionName: '',
    positionCode: '',
    positionLevel: 1,
    isManagement: 0,
    status: 1,
    roleIds: [] as string[]
});

const rules = {
    departmentId: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
    positionName: [{ required: true, message: '请输入职位名称', trigger: 'blur' }],
    positionCode: [{ required: true, message: '请输入职位编码', trigger: 'blur' }]
};

const allRoles = ref<any[]>([]);
const loadAllRoles = async () => {
    if (allRoles.value.length > 0) return;
    try {
        const roleResp = await roleList({ page: 1, pageSize: 1000 });
        if (roleResp.data.code === 200) {
            allRoles.value = (roleResp.data.data?.list || []).map((r: any) => ({
                id: r.id || r.Id,
                name: r.roleName || r.RoleName || r.name || r.Name,
                code: r.roleCode || r.RoleCode || r.code || r.Code
            }));
        }
    } catch (error) {
        console.error('加载角色列表失败:', error);
    }
};

const handleAdd = async () => {
    isEdit.value = false;
    Object.assign(form, {
        id: '',
        departmentId: '',
        positionName: '',
        positionCode: '',
        positionLevel: 1,
        isManagement: 0,
        status: 1,
        roleIds: []
    });
    if (allRoles.value.length === 0) await loadAllRoles();
    dialogVisible.value = true;
};

const handleEdit = (row: any) => {
    isEdit.value = true;
    Object.assign(form, row);
    dialogVisible.value = true;
};

const handleDelete = (row: any) => {
    ElMessageBox.confirm(`确定要删除职位 "${row.positionName}" 吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        try {
            const resp = await deletePosition({ id: row.id });
            if (resp.data.code === 200) {
                ElMessage.success('删除成功');
                getData();
            } else {
                ElMessage.error(resp.data.msg || '删除失败');
            }
        } catch (error) {
            ElMessage.error('操作失败');
        }
    });
};

const submitForm = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid: boolean) => {
        if (valid) {
            if (!isEdit.value && !form.departmentId) {
                ElMessage.error('请选择所属部门');
                return;
            }
            submitting.value = true;
            try {
                const api = isEdit.value ? updatePosition : createPosition;
                const payload: any = { ...form };
                if (!isEdit.value) {
                    if (!payload.departmentId) {
                        ElMessage.error('请选择所属部门');
                        submitting.value = false;
                        return;
                    }
                    if (!payload.roleIds || !Array.isArray(payload.roleIds)) payload.roleIds = [];
                } else {
                    delete payload.roleIds;
                }
                const resp = await api(payload);
                if (resp.data.code === 200) {
                    ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
                    dialogVisible.value = false;
                    getData();
                } else {
                    ElMessage.error(resp.data.msg || '操作失败');
                }
            } catch (error) {
                ElMessage.error('请求失败');
            } finally {
                submitting.value = false;
            }
        }
    });
};

const employeeDialogVisible = ref(false);
const employeeLoading = ref(false);
const employeeSubmitting = ref(false);
const employeeSearchLoading = ref(false);
const currentPosition = ref<any>(null);
const employees = ref<any[]>([]);
const selectedEmployeeIds = ref<string[]>([]);
const initialEmployeeIds = ref<string[]>([]);

const handleAssignEmployee = async (row: any) => {
    currentPosition.value = row;
    employeeDialogVisible.value = true;
    employeeLoading.value = true;
    selectedEmployeeIds.value = [];
    employees.value = [];
    
    try {
        const empResp = await listEmployees({ 
            page: 1, 
            pageSize: 1000, 
            companyId: userStore.companyId || '',
            positionId: row.id 
        });
        if (empResp.data.code === 200) {
            const list = empResp.data.data?.list || [];
            selectedEmployeeIds.value = list.map((e: any) => e.id || e.Id);
            initialEmployeeIds.value = [...selectedEmployeeIds.value];
        }
        await onEmployeeRemote('');
    } catch (error) {
        ElMessage.error('加载员工数据失败');
    } finally {
        employeeLoading.value = false;
    }
};

const onEmployeeRemote = async (keyword: string) => {
    employeeSearchLoading.value = true;
    try {
        const resp = await listEmployees({ 
            page: 1, 
            pageSize: 100, 
            companyId: userStore.companyId || '', 
            name: keyword 
        });
        if (resp.data.code === 200) {
            const list = resp.data.data?.list || [];
            employees.value = list.map((e: any) => ({
                id: e.id || e.Id,
                employeeId: e.employeeId || e.EmployeeId,
                realName: e.realName || e.RealName
            }));
        }
    } catch (error) {
        console.error('搜索员工失败:', error);
    } finally {
        employeeSearchLoading.value = false;
    }
};

const submitEmployees = async () => {
    employeeSubmitting.value = true;
    try {
        const current = new Set(selectedEmployeeIds.value);
        const initial = new Set(initialEmployeeIds.value);
        
        const toAdd = [...current].filter(x => !initial.has(x));
        const toRemove = [...initial].filter(x => !current.has(x));
        
        for (const employeeId of toAdd) {
            await updateEmployee({ id: employeeId, positionId: currentPosition.value.id });
        }
        for (const employeeId of toRemove) {
            await updateEmployee({ id: employeeId, positionId: '' });
        }
        
        ElMessage.success('员工配置已更新');
        employeeDialogVisible.value = false;
    } catch (error: any) {
        ElMessage.error(error.message || '部分操作失败，请重试');
    } finally {
        employeeSubmitting.value = false;
    }
};

onMounted(() => {
    loadDepartments();
    loadAllRoles();
    getData();
});
</script>

<style scoped>
.positions-page {
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

.search-input { width: 300px; }

.table-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 4px;
}

.positions-table {
    --el-table-border-color: #f3f4f6;
    --el-table-header-bg-color: #f9fafb;
}

.position-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
}

.code-text {
    font-family: monospace;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
}

.level-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}
.level-badge.danger { color: #ef4444; background: #fef2f2; }
.level-badge.warning { color: #f59e0b; background: #fffbeb; }
.level-badge.success { color: #10b981; background: #ecfdf5; }
.level-badge.info { color: #6b7280; background: #f3f4f6; }

.type-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
}
.type-badge.manage { color: #d97706; background: #fffbeb; border: 1px solid #fcd34d; }
.type-badge.normal { color: #6b7280; background: #f3f4f6; border: 1px solid #e5e7eb; }

.status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}
.status-badge.success { background: #ecfdf5; color: #10b981; }
.status-badge.default { background: #f3f4f6; color: #6b7280; }

/* Drawer Styles */
:deep(.modern-drawer) { background: #ffffff !important; }
:deep(.modern-drawer .el-drawer__header) {
    margin-bottom: 0;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
    font-weight: 600;
}
:deep(.modern-drawer .el-drawer__body) { padding: 24px; }

.drawer-form { padding: 0 4px; }
.full-width { width: 100%; }
.form-tip { font-size: 12px; color: #9ca3af; margin-top: 6px; }

.drawer-footer {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    gap: 12px;
}

.info-card {
    background: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    border: 1px solid #e5e7eb;
}
.info-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.info-value { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
.info-tip { font-size: 12px; color: #9ca3af; }
</style>
