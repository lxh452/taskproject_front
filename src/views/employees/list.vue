<template>
    <div class="employees-page">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-left">
                <h1 class="page-title">员工管理</h1>
                <p class="page-desc">查看和管理公司员工信息</p>
            </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
            <div class="filter-left">
                <el-input 
                    v-model="query.keyword" 
                    placeholder="搜索姓名 / 邮箱..." 
                    clearable 
                    class="search-input"
                    :prefix-icon="Search"
                />
                <el-select v-model="query.department" placeholder="部门" clearable filterable class="filter-select">
                    <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.name" />
                </el-select>
                <el-select v-model="query.status" placeholder="状态" clearable class="filter-select-sm">
                    <el-option label="在职" :value="1" />
                    <el-option label="离职" :value="0" />
                </el-select>
            </div>
            <div class="filter-right">
                <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
                <el-button :icon="Refresh" circle @click="resetFilter" />
            </div>
        </div>
        
        <!-- 员工卡片网格 -->
        <div class="content-area">
            <el-skeleton :rows="3" animated v-if="loading" />
            <template v-else>
                <div v-if="filteredRows.length > 0" class="employees-grid">
                    <div 
                        v-for="row in filteredRows" 
                        :key="row.id" 
                        class="employee-card"
                        :class="{ 'is-resigned': row.status === 0 }"
                    >
                        <div class="card-status" :class="row.status === 1 ? 'active' : 'inactive'">
                            {{ row.status === 1 ? '在职' : '离职' }}
                        </div>
                        
                        <div class="card-header">
                            <el-avatar :size="56" :src="row.avatar" class="employee-avatar">
                                {{ row.realName?.charAt(0) }}
                            </el-avatar>
                            <div class="employee-info">
                                <h3 class="employee-name">{{ row.realName }}</h3>
                                <p class="employee-position">{{ getPosName(row.position) }}</p>
                            </div>
                        </div>

                        <div class="card-body">
                            <div class="info-row">
                                <span class="info-label">部门</span>
                                <el-tag size="small" type="info" effect="plain">{{ getDeptName(row.department) }}</el-tag>
                            </div>
                            <div class="info-row">
                                <span class="info-label">邮箱</span>
                                <span class="info-value email" :title="row.workEmail">{{ row.workEmail || '未绑定' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">入职时间</span>
                                <span class="info-value">{{ formatDate(row.createTime) }}</span>
                            </div>
                        </div>

                        <div class="card-footer">
                            <el-button text size="small" @click="openRoles(row)">
                                <el-icon><Key /></el-icon> 权限
                            </el-button>
                            <el-button 
                                v-if="row.status === 1" 
                                text 
                                size="small" 
                                type="danger" 
                                @click="openLeaveDialog(row)"
                                :disabled="row.isFounder === true || row.positionCode === 'FOUNDER'"
                                :title="(row.isFounder === true || row.positionCode === 'FOUNDER') ? '不能给公司创始人递交离职申请' : ''"
                            >
                                <el-icon><CircleClose /></el-icon> 离职
                            </el-button>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <el-empty description="暂无员工数据" />
                </div>
            </template>
        </div>

        <!-- 角色查看抽屉 -->
        <el-drawer v-model="rolesVisible" title="员工权限配置" size="450px" class="vben-drawer" destroy-on-close>
            <div v-if="rolesLoading" class="drawer-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载中...</span>
            </div>
            <div v-else-if="roleRows.length === 0" class="drawer-empty">
                <el-empty description="暂无角色权限" :image-size="80" />
            </div>
            <div v-else class="roles-list">
                <div class="role-item" v-for="r in roleRows" :key="r.id">
                    <div class="role-header">
                        <span class="role-name">{{ r.roleName }}</span>
                        <el-tag size="small" type="info">{{ r.roleCode }}</el-tag>
                    </div>
                    <div class="perm-tags">
                        <el-tag v-for="p in r.perms" :key="p" size="small" effect="plain">{{ p }}</el-tag>
                    </div>
                </div>
            </div>
        </el-drawer>

        <!-- 离职对话框 -->
        <el-dialog v-model="leaveDialogVisible" title="办理离职" width="480px" class="vben-dialog" :close-on-click-modal="false" destroy-on-close>
            <el-form :model="leaveForm" label-position="top" class="leave-form">
                <div class="dialog-user-info">
                    <span class="label">员工：</span>
                    <span class="value">{{ leaveForm.employeeName }}</span>
                </div>
                
                <el-form-item label="离职类型">
                    <el-radio-group v-model="leaveForm.leaveType" @change="handleLeaveTypeChange">
                        <el-radio label="hr" border>HR协商离职</el-radio>
                        <el-radio label="employee" border>主动离职</el-radio>
                    </el-radio-group>
                    <div v-if="leaveTypeError" class="error-tip">{{ leaveTypeError }}</div>
                </el-form-item>
                
                <el-form-item label="离职日期" required>
                    <el-date-picker v-model="leaveForm.leaveDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
                
                <el-form-item label="离职原因" required>
                    <el-input v-model="leaveForm.leaveReason" type="textarea" :rows="3" placeholder="请输入具体原因..." maxlength="500" show-word-limit />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="leaveDialogVisible = false">取消</el-button>
                <el-button type="danger" @click="handleLeave" :loading="leaveSubmitting">确认办理</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Search, Refresh, Loading, Key, CircleClose } from '@element-plus/icons-vue';
import { listEmployees, employeeRoles, listDepartments, listPositions, employeeLeave, getMyEmployee } from '@/api';
import { useUserStore } from '@/store/user';
import { PERM_NAMES } from '@/perm/defs';
import { ElMessage, ElMessageBox } from 'element-plus';

const userStore = useUserStore();
const rows = ref<any[]>([]);
const loading = ref(false);
const query = ref<any>({ keyword: '', department: '', position: '', status: null });

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
        const rDeptName = getDeptName(r.department);
        const byDept = !department || rDeptName.includes(department);
        const bySt = (status === '' || status === null || status === undefined) || r.status === status;
        return byKw && byDept && bySt;
    });
});

const resetFilter = () => { query.value = { keyword: '', department: '', position: '', status: null }; };

async function loadDicts() {
    const companyId = userStore.companyId || '';
    if (!companyId) return;

    try {
        const deptResp = await listDepartments({ page: 1, pageSize: 1000, companyId });
        if (deptResp.data.code === 200) {
            const list = deptResp.data.data?.list || [];
            departments.value = list.map((d: any) => ({ id: d.id || d.Id, name: d.departmentName || d.DepartmentName }));
            list.forEach((d: any) => { const id = d.id || d.Id; if (id) deptMap.value[id] = d.departmentName || d.DepartmentName; });
        }
    } catch (e) { console.error(e); }

    try {
        const posResp = await listPositions({ page: 1, pageSize: 1000, departmentId: '', name: '' });
        if (posResp.data.code === 200) {
            const list = posResp.data.data?.list || posResp.data.data?.positions?.list || [];
            positions.value = list.map((p: any) => ({ id: p.id, name: p.positionName }));
            list.forEach((p: any) => { if (p.id) posMap.value[p.id] = p.positionName; });
        }
    } catch (e) { console.error(e); }
}

function getDeptName(val: string) { return val ? (deptMap.value[val] || val) : '-'; }
function getPosName(val: string) { return val ? (posMap.value[val] || val) : '-'; }
function formatDate(time: string) { return time ? new Date(time).toLocaleDateString() : '-'; }

function parsePerms(p: any): string[] {
    if (!p) return [];
    if (typeof p === 'string') {
        try {
            const parsed = JSON.parse(p);
            if (Array.isArray(parsed)) return parsed.map((perm: any) => PERM_NAMES[typeof perm === 'number' ? perm : parseInt(perm)] || `权限${perm}`);
        } catch { return p.split(',').map((s: string) => PERM_NAMES[parseInt(s.trim())] || `权限${s.trim()}`); }
    }
    if (Array.isArray(p)) return p.map((perm: any) => PERM_NAMES[typeof perm === 'number' ? perm : parseInt(perm)] || `权限${perm}`);
    return [];
}

const rolesVisible = ref(false);
const rolesLoading = ref(false);
const roleRows = ref<any[]>([]);

const leaveDialogVisible = ref(false);
const leaveSubmitting = ref(false);
const leaveForm = ref({ employeeId: '', employeeName: '', leaveType: 'hr', leaveDate: '', leaveReason: '' });
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
    } catch (error: any) { console.error('加载角色失败:', error); } 
    finally { rolesLoading.value = false; }
}

async function openLeaveDialog(row: any) {
    if (!currentUser.value) { ElMessage.warning('无法获取当前用户信息'); return; }
    
    // 检查是否是创始人，不能给创始人递交离职
    if (row.isFounder === true || row.positionCode === 'FOUNDER') {
        ElMessage.warning('不能给公司创始人递交离职申请');
        return;
    }
    
    const isSelf = currentUser.value.employeeId === row.id || currentUser.value.userId === row.userId;
    leaveForm.value = {
        employeeId: row.id,
        employeeName: row.realName,
        leaveType: isSelf ? 'employee' : 'hr',
        leaveDate: new Date().toISOString().split('T')[0],
        leaveReason: ''
    };
    leaveDialogVisible.value = true;
}

function handleLeaveTypeChange() {
    leaveTypeError.value = '';
    if (!currentUser.value) return;
    const targetEmployee = rows.value.find((r: any) => r.id === leaveForm.value.employeeId);
    if (!targetEmployee) return;
    const isSelf = currentUser.value.employeeId === targetEmployee.id || currentUser.value.userId === targetEmployee.userId;
    if (leaveForm.value.leaveType === 'employee' && !isSelf) {
        leaveTypeError.value = '只有员工本人可以申请主动离职';
        leaveForm.value.leaveType = 'hr';
    }
}

async function handleLeave() {
    if (!leaveForm.value.leaveReason.trim()) { ElMessage.warning('请输入离职原因'); return; }
    if (!leaveForm.value.leaveDate) { ElMessage.warning('请选择离职日期'); return; }
    try {
        await ElMessageBox.confirm(`确认办理 ${leaveForm.value.employeeName} 的离职手续？`, '确认操作', { type: 'warning' });
        leaveSubmitting.value = true;
        const resp = await employeeLeave({ employeeId: leaveForm.value.employeeId, leaveReason: leaveForm.value.leaveReason, leaveDate: leaveForm.value.leaveDate });
        if (resp.data.code === 200) { ElMessage.success('操作成功'); leaveDialogVisible.value = false; loadData(); }
        else { ElMessage.error(resp.data.msg || '操作失败'); }
    } catch (error: any) { if (error !== 'cancel') ElMessage.error('操作失败'); } 
    finally { leaveSubmitting.value = false; }
}

async function loadCurrentUser() {
    try {
        const resp = await getMyEmployee();
        if (resp.data.code === 200) {
            const emp = resp.data.data || resp.data.employee || {};
            currentUser.value = { employeeId: emp.id || emp.employeeId, userId: emp.userId || emp.UserId, positionId: emp.positionId || emp.PositionId };
        }
    } catch (error: any) { console.error('获取当前用户信息失败:', error); }
}

async function loadData() {
    loading.value = true;
    try {
        if (departments.value.length === 0) await loadDicts();
        const companyId = userStore.companyId || '';
        const resp = await listEmployees({ page: 1, pageSize: 100, companyId });
        if (resp.data.code !== 200) { rows.value = []; return; }
        const list = resp.data?.data?.list || [];
        rows.value = list.map((e: any) => ({
            id: e.id || e.employeeId,
            userId: e.userId || e.UserId,
            realName: e.realName || e.name || '未知',
            department: e.departmentId || e.departmentName || '',
            position: e.positionId || e.positionName || '',
            workEmail: e.workEmail || e.email || '',
            status: e.status ?? 1,
            avatar: e.avatar || '',
            createTime: e.createTime || e.hireDate,
        }));
    } catch (error: any) { rows.value = []; } 
    finally { loading.value = false; }
}

onMounted(async () => { await loadCurrentUser(); loadData(); });
</script>

<style scoped>
.employees-page {
    padding: clamp(16px, 1.5vw, 24px);
    background: var(--bg-page);
    min-height: calc(100vh - clamp(56px, 8vh, 64px));
    width: 100%;
    box-sizing: border-box;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: clamp(16px, 1.5vw, 24px);
}

.page-title {
    font-size: clamp(20px, 1.5vw, 24px);
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 clamp(4px, 0.3vw, 8px);
}

.page-desc {
    font-size: clamp(13px, 0.95vw, 15px);
    color: var(--text-secondary);
    margin: 0;
}

.filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: clamp(12px, 1vw, 16px) clamp(16px, 1.3vw, 20px);
    background: var(--bg-card);
    border-radius: clamp(10px, 0.8vw, 12px);
    border: 1px solid var(--border-color);
    margin-bottom: clamp(16px, 1.5vw, 24px);
}

.filter-left {
    display: flex;
    gap: clamp(10px, 0.8vw, 12px);
    align-items: center;
}

.search-input { width: clamp(180px, 13vw, 220px); }
.filter-select { width: clamp(120px, 9vw, 160px); }
.filter-select-sm { width: clamp(90px, 7vw, 120px); }

.filter-right {
    display: flex;
    gap: clamp(6px, 0.5vw, 8px);
}

.employees-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 20vw, 320px), 1fr));
    gap: clamp(12px, 1.2vw, 20px);
    width: 100%;
}

.employee-card {
    background: var(--bg-card);
    border-radius: clamp(12px, 1vw, 16px);
    border: 1px solid var(--border-color);
    padding: clamp(16px, 1.3vw, 24px);
    position: relative;
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
}

.employee-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

.employee-card.is-resigned {
    opacity: 0.65;
}

.card-status {
    position: absolute;
    top: clamp(12px, 1vw, 16px);
    right: clamp(12px, 1vw, 16px);
    font-size: clamp(10px, 0.75vw, 12px);
    font-weight: 500;
    padding: clamp(3px, 0.3vw, 5px) clamp(8px, 0.7vw, 12px);
    border-radius: clamp(16px, 1.3vw, 20px);
}

.card-status.active { background: var(--bg-hover); color: var(--color-success); }
.card-status.inactive { background: var(--bg-hover); color: var(--text-secondary); }

.card-header {
    display: flex;
    align-items: center;
    gap: clamp(12px, 1vw, 14px);
    margin-bottom: clamp(16px, 1.3vw, 20px);
    padding-bottom: clamp(16px, 1.3vw, 20px);
    border-bottom: 1px solid var(--border-color);
}

.employee-avatar {
    background: linear-gradient(135deg, var(--color-danger) 0%, #b91c1c 100%);
    color: #fff;
    font-weight: 600;
    font-size: clamp(18px, 1.3vw, 22px);
    flex-shrink: 0;
}

.employee-name {
    font-size: clamp(15px, 1.1vw, 17px);
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 clamp(3px, 0.3vw, 5px);
}

.employee-position {
    font-size: clamp(12px, 0.9vw, 14px);
    color: var(--text-secondary);
    margin: 0;
}

.card-body {
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 0.8vw, 12px);
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: clamp(12px, 0.9vw, 14px);
}

.info-label { color: var(--text-muted); }
.info-value { color: var(--text-main); font-weight: 500; }
.info-value.email { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
}

.empty-state {
    padding: 60px;
    background: var(--bg-card);
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

/* Drawer */
.drawer-loading, .drawer-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--text-secondary);
    gap: 12px;
}

.roles-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.role-item {
    background: var(--bg-hover);
    border-radius: 10px;
    padding: 16px;
    border: 1px solid var(--border-color);
}

.role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.role-name { font-weight: 600; color: var(--text-main); }

.perm-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

/* Dialog */
.dialog-user-info {
    background: var(--bg-hover);
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
}

.dialog-user-info .label { color: var(--text-secondary); }
.dialog-user-info .value { font-weight: 600; color: var(--text-main); }

.error-tip { color: var(--color-danger); font-size: 12px; margin-top: 4px; }

/* 响应式布局 - 保持比例 */
@media (max-width: 1024px) {
    .employees-grid {
        grid-template-columns: repeat(auto-fill, minmax(22vw, 1fr));
    }
}

@media (max-width: 768px) {
    .employees-page {
        padding: 4vw;
    }
    
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 2vw;
    }
    
    .filter-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5vw;
    }
    
    .filter-left {
        flex-direction: column;
        width: 100%;
    }
    
    .search-input,
    .filter-select,
    .filter-select-sm {
        width: 100%;
    }
    
    .filter-right {
        width: 100%;
        justify-content: space-between;
    }
    
    .employees-grid {
        grid-template-columns: 1fr;
        gap: 3vw;
    }
}
</style>
