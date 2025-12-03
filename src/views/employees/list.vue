<template>
    <div class="employees-page">
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="filter-item search-box">
                    <el-input 
                        v-model="query.keyword" 
                        placeholder="搜索姓名 / 邮箱 / 手机号" 
                        clearable 
                        :prefix-icon="Search"
                    />
                </div>
                <div class="filter-item">
                    <el-select 
                        v-model="query.department" 
                        placeholder="所属部门" 
                        clearable 
                        filterable
                        class="filter-select"
                    >
                        <el-option 
                            v-for="dept in departments" 
                            :key="dept.id" 
                            :label="dept.name" 
                            :value="dept.name" 
                        />
                    </el-select>
                </div>
                <div class="filter-item">
                    <el-select 
                        v-model="query.position" 
                        placeholder="担任职位" 
                        clearable 
                        filterable
                        class="filter-select"
                    >
                        <el-option 
                            v-for="pos in positions" 
                            :key="pos.id" 
                            :label="pos.name" 
                            :value="pos.name" 
                        />
                    </el-select>
                </div>
                <div class="filter-item">
                    <el-select v-model="query.status" placeholder="员工状态" clearable class="filter-select status-select">
                        <el-option label="在职" :value="1">
                            <div class="option-item"><span class="status-dot success"></span>在职</div>
                        </el-option>
                        <el-option label="离职" :value="0">
                            <div class="option-item"><span class="status-dot info"></span>离职</div>
                        </el-option>
                    </el-select>
                </div>
            </div>
            <div class="toolbar-right">
                <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
                <el-button @click="resetFilter" :icon="Refresh" plain>重置</el-button>
            </div>
        </div>
        
        <div class="table-container">
            <el-table 
                :data="filteredRows" 
                style="width: 100%" 
                v-loading="loading" 
                class="employees-table" 
                :header-cell-style="{ background: '#f8f9fb', color: '#606266', fontWeight: '600', height: '50px' }"
                :row-style="{ height: '65px' }"
            >
                <el-table-column prop="realName" label="员工信息" min-width="240">
                    <template #default="{ row }">
                        <div class="employee-info-cell">
                            <el-avatar :size="40" :src="row.avatar" class="employee-avatar" shape="square">
                                {{ row.realName?.charAt(0) }}
                            </el-avatar>
                            <div class="info-content">
                                <div class="main-text">
                                    <span class="name">{{ row.realName }}</span>
                                    <el-tag v-if="row.status === 1" type="success" size="small" class="status-tag-mini">在职</el-tag>
                                    <el-tag v-else type="info" size="small" class="status-tag-mini">离职</el-tag>
                                </div>
                                <div class="sub-text">{{ row.workEmail || '未绑定邮箱' }}</div>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="department" label="所属部门" width="180">
                    <template #default="{ row }">
                        <div class="dept-cell">
                            <span class="dept-text">{{ getDeptName(row.department) }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="position" label="职位" width="180">
                    <template #default="{ row }">
                        <div class="pos-cell">
                            <span class="pos-text">{{ getPosName(row.position) }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="入职时间" width="150" prop="hireDate">
                    <template #default="{ row }">
                        <span class="date-text">{{ formatDate(row.createTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="离职信息" width="220">
                    <template #default="{ row }">
                        <div v-if="row.status === 0 && (row.leaveDate || row.leaveReason)" class="leave-info">
                            <div class="leave-date" v-if="row.leaveDate">
                                <el-icon><Calendar /></el-icon>
                                <span>{{ formatDate(row.leaveDate) }}</span>
                            </div>
                            <div class="leave-reason" v-if="row.leaveReason" :title="row.leaveReason">
                                {{ row.leaveReason.length > 15 ? row.leaveReason.substring(0, 15) + '...' : row.leaveReason }}
                            </div>
                            <div class="leave-type" v-if="row.leaveType">
                                <el-tag :type="row.leaveType === 'hr' ? 'warning' : 'info'" size="small">
                                    {{ row.leaveType === 'hr' ? 'HR协商离职' : '主动离职' }}
                                </el-tag>
                            </div>
                        </div>
                        <span v-else class="date-text">-</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" align="right" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openRoles(row)">权限配置</el-button>
                        <el-button 
                            v-if="row.status === 1" 
                            link 
                            type="danger" 
                            @click="openLeaveDialog(row)"
                        >
                            离职
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 角色查看抽屉 -->
        <el-drawer
            v-model="rolesVisible"
            title="员工权限配置"
            size="480px"
            class="modern-drawer"
            destroy-on-close
        >
            <div v-if="rolesLoading" class="loading-state">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>正在加载权限信息...</span>
            </div>
            <div v-else-if="roleRows.length === 0" class="empty-state">
                <el-empty description="暂无角色权限" :image-size="120" />
            </div>
            <div v-else class="roles-container">
                <div class="role-card" v-for="r in roleRows" :key="r.id">
                    <div class="role-card-header">
                        <div class="role-icon-wrapper">
                            <el-icon><UserFilled /></el-icon>
                        </div>
                        <div class="role-info">
                            <div class="role-name">{{ r.roleName }}</div>
                            <div class="role-code">{{ r.roleCode }}</div>
                        </div>
                    </div>
                    <div class="role-card-body">
                        <div class="perm-label">包含权限点：</div>
                        <div class="perm-tags">
                            <span v-for="p in r.perms" :key="p" class="perm-item">{{ p }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </el-drawer>

        <!-- 离职对话框 -->
        <el-dialog
            v-model="leaveDialogVisible"
            title="员工离职"
            width="500px"
            :close-on-click-modal="false"
            destroy-on-close
        >
            <el-form :model="leaveForm" label-width="100px" label-position="left">
                <el-form-item label="员工姓名">
                    <el-input v-model="leaveForm.employeeName" disabled />
                </el-form-item>
                <el-form-item label="离职类型">
                    <el-radio-group v-model="leaveForm.leaveType" @change="handleLeaveTypeChange">
                        <el-radio label="hr">HR协商离职</el-radio>
                        <el-radio label="employee">员工主动离职</el-radio>
                    </el-radio-group>
                    <div v-if="leaveTypeError" class="leave-type-error">
                        <el-icon><WarningFilled /></el-icon>
                        <span>{{ leaveTypeError }}</span>
                    </div>
                </el-form-item>
                <el-form-item label="离职日期" required>
                    <el-date-picker
                        v-model="leaveForm.leaveDate"
                        type="date"
                        placeholder="选择离职日期"
                        value-format="YYYY-MM-DD"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-form-item label="离职原因" required>
                    <el-input
                        v-model="leaveForm.leaveReason"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入离职原因"
                        maxlength="500"
                        show-word-limit
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="leaveDialogVisible = false">取消</el-button>
                <el-button type="danger" @click="handleLeave" :loading="leaveSubmitting">
                    确认离职
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Search, Refresh, Loading, UserFilled, Calendar, WarningFilled } from '@element-plus/icons-vue';
import { listEmployees, employeeRoles, listDepartments, listPositions, employeeLeave, getMyEmployee } from '@/api';
import { useUserStore } from '@/store/user';
import { PERM_NAMES } from '@/perm/defs';
import { ElMessage, ElMessageBox } from 'element-plus';

const userStore = useUserStore();
const rows = ref<any[]>([]);
const loading = ref(false);
const query = ref<any>({ keyword: '', department: '', position: '', status: null });

// 字典数据
const departments = ref<any[]>([]);
const positions = ref<any[]>([]);
const deptMap = ref<Record<string, string>>({});
const posMap = ref<Record<string, string>>({});

const filteredRows = computed(() => {
    const { keyword, department, position, status } = query.value;
    return rows.value.filter((r) => {
        const byKw = !keyword || 
            (r.realName && r.realName.toLowerCase().includes(keyword.toLowerCase())) ||
            (r.workEmail && r.workEmail.toLowerCase().includes(keyword.toLowerCase()));
        // 部门和职位筛选逻辑优化：支持名称匹配
        const rDeptName = getDeptName(r.department);
        const rPosName = getPosName(r.position);
        const byDept = !department || rDeptName.includes(department);
        const byPos = !position || rPosName.includes(position);
        const bySt = (status === '' || status === null || status === undefined) || r.status === status;
        return byKw && byDept && byPos && bySt;
    });
});

const resetFilter = () => { 
    query.value = { keyword: '', department: '', position: '', status: null }; 
};

// 字典加载
async function loadDicts() {
    const companyId = userStore.companyId || '';
    if (!companyId) return;

    // 加载部门
    try {
        const deptResp = await listDepartments({ page: 1, pageSize: 1000, companyId });
        if (deptResp.data.code === 200) {
            const list = deptResp.data.data?.list || [];
            departments.value = list.map((d: any) => ({
                id: d.id || d.Id,
                name: d.departmentName || d.DepartmentName
            }));
            // 构建映射
            list.forEach((d: any) => {
                const id = d.id || d.Id;
                if (id) deptMap.value[id] = d.departmentName || d.DepartmentName;
            });
        }
    } catch (e) { console.error(e); }

    // 加载职位
    try {
        const posResp = await listPositions({ page: 1, pageSize: 1000, departmentId: '', name: '' }); // companyId implied
        if (posResp.data.code === 200) {
            // 兼容不同的返回结构
            const list = posResp.data.data?.list || posResp.data.data?.positions?.list || [];
            positions.value = list.map((p: any) => ({
                id: p.id,
                name: p.positionName
            }));
            list.forEach((p: any) => {
                if (p.id) posMap.value[p.id] = p.positionName;
            });
        }
    } catch (e) { console.error(e); }
}

// 名称转换辅助函数
function getDeptName(val: string) {
    if (!val) return '-';
    // 如果已经是中文名（简单判断不包含下划线或者在map的值中），直接返回
    // 但 ID 也有可能不带下划线，所以优先查 Map
    if (deptMap.value[val]) return deptMap.value[val];
    // 如果是 dept_ 开头的 ID 但没找到 Map，可能是数据同步问题，暂时显示 ID 或尝试格式化
    if (val.startsWith('dept_')) return '未知部门'; 
    return val;
}

function getPosName(val: string) {
    if (!val) return '-';
    if (posMap.value[val]) return posMap.value[val];
    if (val.startsWith('pos_')) return '未知职位';
    return val;
}

function formatDate(time: string) {
    if (!time) return '-';
    try {
        return new Date(time).toLocaleDateString();
    } catch {
        return time;
    }
}

function parsePerms(p: any): string[] {
    if (!p) return [];
    if (typeof p === 'string') {
        try {
            const parsed = JSON.parse(p);
            if (Array.isArray(parsed)) {
                return parsed.map((perm: any) => {
                    const permNum = typeof perm === 'number' ? perm : parseInt(perm);
                    return PERM_NAMES[permNum] || `权限${permNum}`;
                });
            }
        } catch {
            return p.split(',').map((s: string) => {
                const permNum = parseInt(s.trim());
                return PERM_NAMES[permNum] || `权限${permNum}`;
            });
        }
    }
    if (Array.isArray(p)) {
        return p.map((perm: any) => {
            const permNum = typeof perm === 'number' ? perm : parseInt(perm);
            return PERM_NAMES[permNum] || `权限${permNum}`;
        });
    }
    return [];
}

const rolesVisible = ref(false);
const rolesLoading = ref(false);
const roleRows = ref<any[]>([]);

// 离职相关
const leaveDialogVisible = ref(false);
const leaveSubmitting = ref(false);
const leaveForm = ref({
    employeeId: '',
    employeeName: '',
    leaveType: 'hr', // 'hr' 或 'employee'
    leaveDate: '',
    leaveReason: ''
});

// 当前用户信息
const currentUser = ref<any>(null);
const currentUserPosition = ref<any>(null);
const leaveTypeError = ref('');


async function openRoles(row: any) {
    rolesVisible.value = true;
    rolesLoading.value = true;
    roleRows.value = [];
    try {
        const resp = await employeeRoles({ employeeId: row.id });
        const list = resp.data?.data?.list || [];
        roleRows.value = list.map((r: any) => ({
            id: r.id || r.Id,
            roleName: r.roleName || r.RoleName,
            roleCode: r.roleCode || r.RoleCode,
            perms: parsePerms(r.permissions || r.Permissions),
        }));
    } catch (error: any) {
        console.error('加载角色失败:', error);
    } finally {
        rolesLoading.value = false;
    }
}

async function openLeaveDialog(row: any) {
    // 校验权限
    if (!currentUser.value) {
        ElMessage.warning('无法获取当前用户信息，请刷新页面重试');
        return;
    }

    // 检查是否是员工本人
    const isSelf = currentUser.value.employeeId === row.id || currentUser.value.userId === row.userId;
    
    // 如果是员工本人，默认选择主动离职
    // 如果不是员工本人，默认选择HR协商离职，但需要检查是否是管理岗
    if (isSelf) {
        leaveForm.value = {
            employeeId: row.id,
            employeeName: row.realName,
            leaveType: 'employee',
            leaveDate: new Date().toISOString().split('T')[0],
            leaveReason: ''
        };
    } else {
        // 检查是否是管理岗
        const isManagement = currentUserPosition.value?.isManagement === 1 || currentUserPosition.value?.IsManagement === 1;
        if (!isManagement) {
            ElMessage.warning('只有管理岗或HR可以办理其他员工的离职手续');
            return;
        }
        leaveForm.value = {
            employeeId: row.id,
            employeeName: row.realName,
            leaveType: 'hr',
            leaveDate: new Date().toISOString().split('T')[0],
            leaveReason: ''
        };
    }
    leaveDialogVisible.value = true;
}

// 处理离职类型变化
function handleLeaveTypeChange() {
    leaveTypeError.value = '';
    
    if (!currentUser.value) {
        return;
    }

    // 获取要离职的员工信息
    const targetEmployee = rows.value.find((r: any) => r.id === leaveForm.value.employeeId);
    if (!targetEmployee) {
        return;
    }

    // 检查是否是员工本人
    const isSelf = currentUser.value.employeeId === targetEmployee.id || 
                   currentUser.value.userId === targetEmployee.userId;

    if (leaveForm.value.leaveType === 'employee') {
        // 主动离职：必须是员工本人
        if (!isSelf) {
            leaveTypeError.value = '只有员工本人可以申请主动离职';
            leaveForm.value.leaveType = 'hr'; // 自动切换回HR协商离职
            return;
        }
    } else if (leaveForm.value.leaveType === 'hr') {
        // HR协商离职：必须是管理岗
        const isManagement = currentUserPosition.value?.isManagement === 1 || 
                             currentUserPosition.value?.IsManagement === 1;
        if (!isManagement) {
            leaveTypeError.value = '只有管理岗或HR可以办理HR协商离职';
            if (isSelf) {
                leaveForm.value.leaveType = 'employee'; // 如果是本人，切换回主动离职
            }
            return;
        }
    }
}

async function handleLeave() {
    // 再次校验权限
    if (!currentUser.value) {
        ElMessage.warning('无法获取当前用户信息，请刷新页面重试');
        return;
    }

    // 获取要离职的员工信息
    const targetEmployee = rows.value.find((r: any) => r.id === leaveForm.value.employeeId);
    if (!targetEmployee) {
        ElMessage.error('找不到要离职的员工信息');
        return;
    }

    // 检查是否是员工本人
    const isSelf = currentUser.value.employeeId === targetEmployee.id || 
                   currentUser.value.userId === targetEmployee.userId;

    // 校验离职类型和权限
    if (leaveForm.value.leaveType === 'employee') {
        // 主动离职：必须是员工本人
        if (!isSelf) {
            ElMessage.error('只有员工本人可以申请主动离职');
            return;
        }
    } else if (leaveForm.value.leaveType === 'hr') {
        // HR协商离职：必须是管理岗
        const isManagement = currentUserPosition.value?.isManagement === 1 || 
                             currentUserPosition.value?.IsManagement === 1;
        if (!isManagement) {
            ElMessage.error('只有管理岗或HR可以办理HR协商离职');
            return;
        }
    }

    if (!leaveForm.value.leaveReason.trim()) {
        ElMessage.warning('请输入离职原因');
        return;
    }
    if (!leaveForm.value.leaveDate) {
        ElMessage.warning('请选择离职日期');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确认要办理 ${leaveForm.value.employeeName} 的离职手续吗？离职后将无法恢复。`,
            '确认离职',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        leaveSubmitting.value = true;
        const resp = await employeeLeave({
            employeeId: leaveForm.value.employeeId,
            leaveReason: leaveForm.value.leaveReason,
            leaveDate: leaveForm.value.leaveDate
        });

        if (resp.data.code === 200) {
            ElMessage.success('离职申请已提交，等待审批');
            leaveDialogVisible.value = false;
            loadData();
        } else {
            ElMessage.error(resp.data.msg || '提交离职申请失败');
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('提交离职申请失败:', error);
            ElMessage.error('提交离职申请失败: ' + (error.message || '未知错误'));
        }
    } finally {
        leaveSubmitting.value = false;
    }
}

// 加载当前用户信息
async function loadCurrentUser() {
    try {
        const resp = await getMyEmployee();
        if (resp.data.code === 200) {
            const emp = resp.data.data || resp.data.employee || {};
            currentUser.value = {
                employeeId: emp.id || emp.employeeId || emp.Id || emp.EmployeeId,
                userId: emp.userId || emp.UserId || emp.user_id || emp.UserID,
                positionId: emp.positionId || emp.PositionId || emp.position_id || emp.PositionID
            };

            // 如果有职位ID，获取职位信息
            if (currentUser.value.positionId) {
                try {
                    const posList = await listPositions({ page: 1, pageSize: 1000, departmentId: '', name: '' });
                    if (posList.data?.code === 200) {
                        const positions = posList.data.data?.list || posList.data.data?.positions?.list || [];
                        currentUserPosition.value = positions.find((p: any) => 
                            (p.id || p.Id) === currentUser.value.positionId
                        );
                    }
                } catch (error) {
                    console.error('获取职位信息失败:', error);
                }
            }
        }
    } catch (error: any) {
        console.error('获取当前用户信息失败:', error);
    }
}

async function loadData() {
    loading.value = true;
    try {
        // 确保字典已加载
        if (departments.value.length === 0) await loadDicts();

        const companyId = userStore.companyId || '';
        const resp = await listEmployees({ page: 1, pageSize: 100, companyId });
        if (resp.data.code !== 200) {
            rows.value = [];
            return;
        }
        const responseData = resp.data?.data || resp.data || {};
        const list = responseData.list || [];
        rows.value = list.map((e: any) => ({
            id: e.id || e.employeeId,
            userId: e.userId || e.UserId || e.user_id || e.UserID,
            realName: e.realName || e.name || '未知',
            // 这里后端返回的可能是 ID，如 dept_xxx
            department: e.departmentId || e.department_id || e.departmentName || '',
            position: e.positionId || e.position_id || e.positionName || '',
            workEmail: e.workEmail || e.email || '',
            status: e.status ?? 1,
            avatar: e.avatar || '',
            createTime: e.createTime || e.hireDate,
            leaveDate: e.leaveDate || e.leaveDate || '',
            leaveReason: e.leaveReason || '',
            leaveType: e.leaveType || ''
        }));
    } catch (error: any) {
        rows.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await loadCurrentUser();
    loadData();
});
</script>

<style scoped>
.employees-page {
    padding: 24px;
    background: #f5f7fa;
    min-height: calc(100vh - 64px);
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    background: #ffffff;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    flex: 1;
}

.filter-item {
    display: flex;
    align-items: center;
}

.search-box {
    width: 280px;
}

.filter-select {
    width: 160px;
}

.status-select {
    width: 140px;
}

.option-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.table-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    overflow: hidden;
    border: 1px solid #ebeef5;
}

.employees-table {
    --el-table-border-color: #f0f2f5;
}

.employee-info-cell {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
}

.employee-avatar {
    background: #eef2ff;
    color: #4f46e5;
    font-size: 18px;
    font-weight: 600;
    border-radius: 10px;
}

.info-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.main-text {
    display: flex;
    align-items: center;
    gap: 8px;
}

.name {
    font-weight: 600;
    color: #1f2937;
    font-size: 15px;
}

.status-tag-mini {
    height: 20px;
    line-height: 18px;
    padding: 0 6px;
    border-radius: 4px;
}

.sub-text {
    font-size: 13px;
    color: #9ca3af;
}

.dept-cell, .pos-cell {
    display: flex;
    align-items: center;
}

.dept-text {
    color: #4b5563;
    font-weight: 500;
    background: #f3f4f6;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 13px;
}

.pos-text {
    color: #6b7280;
    font-size: 13px;
}

.date-text {
    color: #9ca3af;
    font-size: 13px;
    font-family: var(--el-font-family);
}

.status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}
.status-dot.success { background: #10b981; }
.status-dot.info { background: #9ca3af; }

/* Drawer Styles */
:deep(.modern-drawer) { background: #ffffff !important; }
:deep(.modern-drawer .el-drawer__header) {
    margin-bottom: 0;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
    font-weight: 600;
    font-size: 16px;
}
:deep(.modern-drawer .el-drawer__body) { 
    padding: 24px; 
    background: #f9fafb;
}

.roles-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.role-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    transition: all 0.2s;
}

.role-card:hover {
    border-color: #4f46e5;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
    transform: translateY(-1px);
}

.role-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px dashed #f3f4f6;
}

.role-icon-wrapper {
    width: 40px;
    height: 40px;
    background: #eef2ff;
    color: #4f46e5;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.role-info {
    flex: 1;
}

.role-name {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 2px;
}

.role-code {
    font-size: 12px;
    color: #9ca3af;
    font-family: monospace;
    background: #f3f4f6;
    padding: 1px 6px;
    border-radius: 4px;
    display: inline-block;
}

.role-card-body {
    font-size: 13px;
}

.perm-label {
    color: #6b7280;
    margin-bottom: 8px;
}

.perm-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.perm-item {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 4px 10px;
    border-radius: 6px;
    color: #4b5563;
    font-size: 12px;
}

.loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: #9ca3af;
    background: white;
    border-radius: 12px;
}

.leave-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
}

.leave-date {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #6b7280;
}

.leave-reason {
    color: #4b5563;
    line-height: 1.4;
}

.leave-type {
    margin-top: 4px;
}

.leave-type-error {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #f56c6c;
    font-size: 12px;
    margin-top: 8px;
}
</style>
