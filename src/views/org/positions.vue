<template>
    <div class="positions-page">
        <div class="page-header">
            <div class="header-left">
                <h1 class="page-title">职位管理</h1>
                <p class="page-desc">按部门分组管理公司职位</p>
            </div>
            <el-button type="primary" :icon="Plus" @click="handleAdd" class="create-btn">新增职位</el-button>
        </div>

        <div class="main-content">
            <!-- 左侧部门导航 -->
            <div class="dept-sidebar">
                <div class="sidebar-header">
                    <el-icon class="sidebar-icon"><OfficeBuilding /></el-icon>
                    <span>部门列表</span>
                </div>
                <el-skeleton :rows="5" animated v-if="loading" />
                <div v-else class="dept-tree">
                    <div 
                        v-for="dept in departments" 
                        :key="dept.id" 
                        class="dept-item"
                        :class="{ active: selectedDeptId === dept.id }"
                        @click="selectDepartment(dept.id)"
                    >
                        <div class="dept-item-main">
                            <el-icon class="dept-item-icon"><Folder /></el-icon>
                            <span class="dept-item-name">{{ dept.name }}</span>
                        </div>
                        <el-badge :value="getPositionCount(dept.id)" :max="99" type="info" class="dept-badge" />
                    </div>
                    <div v-if="departments.length === 0" class="empty-dept">
                        <el-icon><FolderOpened /></el-icon>
                        <span>暂无部门</span>
                    </div>
                </div>
            </div>

            <!-- 右侧职位列表 -->
            <div class="positions-main">
                <div class="positions-header">
                    <div class="header-info">
                        <h2 class="section-title">
                            <el-icon><UserFilled /></el-icon>
                            {{ selectedDeptName || '全部职位' }}
                        </h2>
                        <span class="position-count">共 {{ currentPositions.length }} 个职位</span>
                    </div>
                    <div class="header-actions">
                        <el-input 
                            v-model="query.keyword" 
                            placeholder="搜索职位" 
                            class="search-input" 
                            clearable 
                            @keyup.enter="getData"
                            :prefix-icon="Search"
                        />
                        <el-button @click="getData" :icon="Refresh" circle title="刷新" />
                    </div>
                </div>

                <el-skeleton :rows="3" animated v-if="loading" />
                <template v-else>
                    <div v-if="currentPositions.length > 0" class="positions-grid">
                        <div v-for="row in currentPositions" :key="row.id" class="pos-card">
                            <div class="card-top">
                                <div class="pos-avatar">
                                    <el-icon><Avatar /></el-icon>
                                </div>
                                <div class="status-dot" :class="row.status === 1 ? 'active' : 'inactive'" :title="row.status === 1 ? '启用中' : '已停用'"></div>
                            </div>
                            <div class="card-body">
                                <h3 class="pos-name">{{ row.positionName }}</h3>
                                <div class="pos-code">{{ row.positionCode || '-' }}</div>
                                <div class="pos-meta">
                                    <span class="meta-item level" :class="getLevelClass(row.positionLevel)">
                                        <el-icon><StarFilled /></el-icon>
                                        {{ row.positionLevel }}级
                                    </span>
                                    <span class="meta-item type" :class="row.isManagement === 1 ? 'manage' : 'normal'">
                                        {{ row.isManagement === 1 ? '管理岗' : '普通岗' }}
                                    </span>
                                </div>
                            </div>
                            <div class="card-actions">
                                <el-button plain size="default" @click="handleEdit(row)" class="action-btn">
                                    <el-icon><Edit /></el-icon>
                                    <span>编辑</span>
                                </el-button>
                                <el-button plain size="default" @click="handleAssignEmployee(row)" class="action-btn">
                                    <el-icon><User /></el-icon>
                                    <span>分配</span>
                                </el-button>
                                <el-button plain size="default" @click="handleDelete(row)" class="action-btn action-btn-danger">
                                    <el-icon><Delete /></el-icon>
                                    <span>删除</span>
                                </el-button>
                            </div>
                        </div>
                    </div>
                    <div v-else class="empty-positions">
                        <el-empty :description="selectedDeptId ? '该部门暂无职位' : '请选择部门查看职位'" />
                    </div>
                </template>
            </div>
        </div>

        <!-- 职位编辑抽屉 -->
        <el-drawer v-model="dialogVisible" :title="isEdit ? '编辑职位' : '新增职位'" size="480px" class="pos-drawer" destroy-on-close>
            <el-form :model="form" label-position="top" :rules="rules" ref="formRef" class="pos-form">
                <el-form-item label="所属部门" prop="departmentId">
                    <el-select v-model="form.departmentId" placeholder="请选择部门" filterable style="width: 100%" :disabled="isEdit">
                        <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="职位名称" prop="positionName">
                    <el-input v-model="form.positionName" placeholder="请输入职位名称" />
                </el-form-item>
                <el-form-item label="职位编码" prop="positionCode">
                    <el-input v-model="form.positionCode" placeholder="请输入职位编码（如 DEV、PM）" />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="职位等级">
                            <el-input-number v-model="form.positionLevel" :min="1" :max="20" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="岗位类型">
                            <el-radio-group v-model="form.isManagement">
                                <el-radio :value="1">管理岗</el-radio>
                                <el-radio :value="0">普通岗</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="状态">
                    <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
                </el-form-item>
                <el-form-item label="绑定角色" v-if="!isEdit">
                    <el-select v-model="form.roleIds" placeholder="可选，绑定角色权限" multiple filterable style="width: 100%">
                        <el-option v-for="role in allRoles" :key="role.id" :label="role.name" :value="role.id" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
            </template>
        </el-drawer>

        <!-- 员工分配抽屉 -->
        <el-drawer v-model="employeeDialogVisible" title="分配员工" size="480px" class="pos-drawer" destroy-on-close>
            <div v-loading="employeeLoading">
                <div class="assign-info">
                    <el-icon class="info-icon"><UserFilled /></el-icon>
                    <div class="info-text">
                        <div class="info-label">当前职位</div>
                        <div class="info-value">{{ currentPosition?.positionName }}</div>
                    </div>
                </div>
                <el-form label-position="top">
                    <el-form-item label="搜索员工">
                        <el-select 
                            v-model="selectedEmployeeIds" 
                            placeholder="输入姓名或工号搜索" 
                            filterable 
                            remote 
                            :remote-method="onEmployeeRemote" 
                            :loading="employeeSearchLoading" 
                            multiple 
                            collapse-tags
                            collapse-tags-tooltip
                            style="width: 100%"
                        >
                            <el-option v-for="e in employees" :key="e.id" :label="`${e.realName}（${e.employeeId}）`" :value="e.id" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <el-button @click="employeeDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitEmployees" :loading="employeeSubmitting">保存配置</el-button>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { listPositions, createPosition, updatePosition, deletePosition, listEmployees, updateEmployee, listDepartments, roleList } from '@/api';
import { Search, Plus, Refresh, Edit, Delete, User, UserFilled, OfficeBuilding, Folder, FolderOpened, Avatar, StarFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const rows = ref<any[]>([]);
const loading = ref(false);
const query = ref({ keyword: '' });
const departments = ref<Array<{ id: string; name: string }>>([]);
const selectedDeptId = ref<string>('');

const selectedDeptName = computed(() => {
    const dept = departments.value.find(d => d.id === selectedDeptId.value);
    return dept?.name || '';
});

const currentPositions = computed(() => {
    if (!selectedDeptId.value) return rows.value;
    return rows.value.filter(p => p.departmentId === selectedDeptId.value);
});

const getPositionCount = (deptId: string) => {
    return rows.value.filter(p => p.departmentId === deptId).length;
};

const selectDepartment = (deptId: string) => {
    selectedDeptId.value = selectedDeptId.value === deptId ? '' : deptId;
};

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
            // 默认选中第一个部门
            if (departments.value.length > 0 && !selectedDeptId.value) {
                selectedDeptId.value = departments.value[0].id;
            }
        }
    } catch (error) { console.error(error); }
};

const getData = async () => {
    loading.value = true;
    try {
        const resp = await listPositions({ page: 1, pageSize: 500, departmentId: '', name: query.value.keyword });
        if (resp.data.code !== 200) { ElMessage.error(resp.data.msg || '获取职位列表失败'); return; }
        const list = resp.data.data?.list || resp.data.data?.positions?.list || [];
        
        const deptMap = new Map(departments.value.map(d => [d.id, d.name]));
        
        rows.value = list.map((p: any) => ({
            id: p.id, 
            departmentId: p.departmentId || p.DepartmentId || '',
            departmentName: deptMap.get(p.departmentId || p.DepartmentId || '') || p.departmentName || '未分配',
            positionName: p.positionName || '未命名职位', 
            positionCode: p.positionCode?.String || p.positionCode || '',
            positionLevel: p.positionLevel ?? 0, 
            isManagement: p.isManagement ?? 0, 
            status: p.status ?? 1,
        }));
    } catch (error) { ElMessage.error('系统错误'); } finally { loading.value = false; }
};

const getLevelClass = (level: number) => level >= 15 ? 'high' : level >= 10 ? 'medium' : level >= 5 ? 'low' : 'entry';

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();
const form = reactive({ id: '', departmentId: '', positionName: '', positionCode: '', positionLevel: 1, isManagement: 0, status: 1, roleIds: [] as string[] });
const rules = { 
    departmentId: [{ required: true, message: '请选择所属部门', trigger: 'change' }], 
    positionName: [{ required: true, message: '请输入职位名称', trigger: 'blur' }] 
};

const allRoles = ref<any[]>([]);
const loadAllRoles = async () => {
    if (allRoles.value.length > 0) return;
    try {
        const roleResp = await roleList({ page: 1, pageSize: 1000 });
        if (roleResp.data.code === 200) allRoles.value = (roleResp.data.data?.list || []).map((r: any) => ({ id: r.id || r.Id, name: r.roleName || r.RoleName }));
    } catch (error) { console.error(error); }
};

const handleAdd = async () => {
    isEdit.value = false;
    Object.assign(form, { 
        id: '', 
        departmentId: selectedDeptId.value || '', 
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
    Object.assign(form, { 
        id: row.id, 
        departmentId: row.departmentId,
        positionName: row.positionName, 
        positionCode: row.positionCode, 
        positionLevel: row.positionLevel, 
        isManagement: row.isManagement, 
        status: row.status, 
        roleIds: [] 
    }); 
    dialogVisible.value = true; 
};

const handleDelete = (row: any) => {
    ElMessageBox.confirm(`确定要删除职位「${row.positionName}」吗？`, '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }).then(async () => {
        const resp = await deletePosition({ id: row.id });
        if (resp.data.code === 200) { ElMessage.success('删除成功'); getData(); } else { ElMessage.error(resp.data.msg || '删除失败'); }
    });
};

const submitForm = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid: boolean) => {
        if (valid) {
            submitting.value = true;
            try {
                const api = isEdit.value ? updatePosition : createPosition;
                const payload: any = { ...form };
                if (isEdit.value) delete payload.roleIds;
                const resp = await api(payload);
                if (resp.data.code === 200) { 
                    ElMessage.success(isEdit.value ? '更新成功' : '创建成功'); 
                    dialogVisible.value = false; 
                    getData(); 
                } else { ElMessage.error(resp.data.msg || '操作失败'); }
            } catch (error) { ElMessage.error('请求失败'); } finally { submitting.value = false; }
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
        const empResp = await listEmployees({ page: 1, pageSize: 1000, companyId: userStore.companyId || '', positionId: row.id });
        if (empResp.data.code === 200) {
            const list = empResp.data.data?.list || [];
            selectedEmployeeIds.value = list.map((e: any) => e.id || e.Id);
            initialEmployeeIds.value = [...selectedEmployeeIds.value];
        }
        await onEmployeeRemote('');
    } catch (error) { ElMessage.error('加载员工数据失败'); } finally { employeeLoading.value = false; }
};

const onEmployeeRemote = async (keyword: string) => {
    employeeSearchLoading.value = true;
    try {
        const resp = await listEmployees({ page: 1, pageSize: 100, companyId: userStore.companyId || '', name: keyword });
        if (resp.data.code === 200) employees.value = (resp.data.data?.list || []).map((e: any) => ({ id: e.id || e.Id, employeeId: e.employeeId, realName: e.realName }));
    } catch (error) { console.error(error); } finally { employeeSearchLoading.value = false; }
};

const submitEmployees = async () => {
    employeeSubmitting.value = true;
    try {
        const current = new Set(selectedEmployeeIds.value);
        const initial = new Set(initialEmployeeIds.value);
        for (const employeeId of [...current].filter(x => !initial.has(x))) await updateEmployee({ id: employeeId, positionId: currentPosition.value.id });
        for (const employeeId of [...initial].filter(x => !current.has(x))) await updateEmployee({ id: employeeId, positionId: '' });
        ElMessage.success('员工配置已更新');
        employeeDialogVisible.value = false;
    } catch (error: any) { ElMessage.error(error.message || '操作失败'); } finally { employeeSubmitting.value = false; }
};

onMounted(() => { loadDepartments().then(() => getData()); loadAllRoles(); });
</script>

<style scoped>
.positions-page { 
    padding: clamp(16px, 1.5vw, 24px); 
    background: var(--bg-page); 
    min-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    gap: clamp(16px, 1.2vw, 20px);
}

.page-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
}
.page-title { 
    font-size: clamp(20px, 1.5vw, 24px); 
    font-weight: 700; 
    color: var(--text-main); 
    margin: 0 0 4px; 
}
.page-desc { 
    font-size: clamp(13px, 0.95vw, 15px); 
    color: var(--text-secondary); 
    margin: 0; 
}
.create-btn { 
    height: 40px; 
    padding: 0 20px; 
    border-radius: 10px; 
    font-weight: 500; 
    background: var(--color-primary);
    border: none; 
    box-shadow: 0 2px 8px rgba(30, 58, 95, 0.2);
}
.create-btn:hover {
    box-shadow: 0 4px 12px rgba(30, 58, 95, 0.25);
}

.main-content {
    display: flex;
    gap: clamp(16px, 1.2vw, 20px);
    flex: 1;
    min-height: 0;
}

/* 左侧部门导航 */
.dept-sidebar {
    width: clamp(220px, 18vw, 280px);
    background: var(--bg-card);
    border-radius: 14px;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
}

.sidebar-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px;
    background: var(--color-primary-light);
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    font-size: 15px;
    color: var(--text-main);
}
.sidebar-icon {
    color: #3B82F6;
    font-size: 18px;
}

.dept-tree {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.dept-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 6px;
}
.dept-item:hover {
    background: var(--bg-hover);
}
.dept-item.active {
    background: var(--color-primary-light);
    border: 1px solid var(--color-primary);
}
.dept-item.active .dept-item-name {
    color: #3B82F6;
    font-weight: 600;
}
.dept-item.active .dept-item-icon {
    color: #3B82F6;
}

.dept-item-main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
}
.dept-item-icon {
    font-size: 16px;
    color: var(--text-secondary);
    flex-shrink: 0;
}
.dept-item-name {
    font-size: 14px;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.dept-badge :deep(.el-badge__content) {
    font-size: 11px;
    height: 18px;
    line-height: 18px;
    padding: 0 6px;
}

.empty-dept {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--text-secondary);
    gap: 8px;
}
.empty-dept .el-icon {
    font-size: 32px;
    opacity: 0.5;
}

/* 右侧职位列表 */
.positions-main {
    flex: 1;
    background: var(--bg-card);
    border-radius: 14px;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
}

.positions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-card);
}
.header-info {
    display: flex;
    align-items: center;
    gap: 12px;
}
.section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}
.section-title .el-icon {
    color: #3B82F6;
}
.position-count {
    font-size: 13px;
    color: var(--text-secondary);
    background: var(--bg-hover);
    padding: 4px 10px;
    border-radius: 12px;
}
.header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
}
.search-input {
    width: 200px;
}

/* 职位卡片网格 */
.positions-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); 
    gap: 16px;
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.pos-card { 
    background: var(--bg-card); 
    border-radius: 12px; 
    border: 1px solid var(--border-color); 
    padding: 18px;
    transition: all 0.25s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
    cursor: pointer;
}
.pos-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    border-color: var(--color-primary);
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}
.pos-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--color-primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    font-size: 20px;
}
.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(0,0,0,0.05);
}
.status-dot.active {
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}
.status-dot.inactive {
    background: #9ca3af;
}

.card-body {
    flex: 1;
}
.pos-name { 
    font-size: 15px; 
    font-weight: 600; 
    color: var(--text-main); 
    margin: 0 0 6px; 
    line-height: 1.3;
}
.pos-code {
    font-size: 12px;
    font-family: 'SF Mono', Monaco, monospace;
    color: var(--text-secondary);
    background: var(--bg-hover);
    padding: 3px 8px;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 10px;
}
.pos-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
.meta-item {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
}
.meta-item.level {
    background: var(--bg-hover);
    color: var(--text-secondary);
}
.meta-item.level.high { background: #fef2f2; color: #dc2626; }
.meta-item.level.medium { background: #fef3c7; color: #d97706; }
.meta-item.level.low { background: #d1fae5; color: #059669; }
.meta-item.level.entry { background: var(--bg-hover); color: var(--text-secondary); }
.meta-item.type.manage { background: #fef3c7; color: #b45309; }
.meta-item.type.normal { background: var(--bg-hover); color: var(--text-secondary); }

.card-actions {
    display: flex;
    gap: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--border-color);
    justify-content: space-between;
}
.card-actions .action-btn {
    flex: 1;
    height: 34px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-color: var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
}
.card-actions .action-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-light);
}
.card-actions .action-btn-danger:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-danger-light);
}

.empty-positions {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
}

/* 抽屉样式 - Swiss Minimalism */
.pos-drawer :deep(.el-drawer) {
    background: var(--drawer-bg);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
}
.pos-drawer :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
}
.pos-drawer :deep(.el-drawer__title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}
.pos-drawer :deep(.el-drawer__body) {
    padding: 24px;
    background: var(--bg-card);
}
.pos-drawer :deep(.el-drawer__footer) {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    background: var(--bg-secondary);
}
.pos-form :deep(.el-form-item__label) {
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
    font-size: var(--font-size-base);
}

.assign-info {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--color-primary-light);
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 20px;
}
.info-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--color-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}
.info-text {
    flex: 1;
}
.info-label {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 2px;
}
.info-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
}

/* 响应式 */
@media (max-width: 1024px) {
    .main-content {
        flex-direction: column;
    }
    .dept-sidebar {
        width: 100%;
        max-height: 200px;
    }
    .dept-tree {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px;
    }
    .dept-item {
        margin-bottom: 0;
        padding: 8px 12px;
    }
    .positions-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
}

@media (max-width: 768px) {
    .positions-page {
        padding: 16px;
    }
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    .create-btn {
        width: 100%;
    }
    .positions-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    .header-actions {
        width: 100%;
    }
    .search-input {
        flex: 1;
    }
    .positions-grid {
        grid-template-columns: 1fr;
        padding: 16px;
    }
}
</style>
