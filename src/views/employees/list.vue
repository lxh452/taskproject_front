<template>
  <div class="employees-page">
    <!-- 页面头部 - Swiss Minimalism -->
    <div class="page-header">
      <h1 class="page-title">员工管理</h1>
      <p class="page-desc">查看和管理公司员工信息</p>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input v-model="query.keyword" placeholder="搜索姓名 / 邮箱..." class="search-input" />
        </div>
        <el-select v-model="query.department" placeholder="部门" clearable filterable class="filter-select">
          <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.name" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" clearable class="filter-select-sm">
          <el-option label="在职" :value="1" />
          <el-option label="离职" :value="0" />
        </el-select>
      </div>
      <div class="filter-right">
        <button class="btn-primary" @click="loadData">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          查询
        </button>
        <button class="btn-icon" @click="resetFilter">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 员工卡片网格 -->
    <div class="content-area">
      <div v-if="loading" class="skeleton-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line w-60"></div>
            <div class="skeleton-line w-40"></div>
          </div>
        </div>
      </div>
      <template v-else>
        <div v-if="filteredRows.length > 0" class="employees-grid">
          <div
            v-for="row in filteredRows"
            :key="row.id"
            class="employee-card"
            :class="{ 'is-resigned': row.status === 0 }"
          >
            <!-- 左侧状态指示线 -->
            <div class="card-indicator" :class="row.status === 1 ? 'active' : 'inactive'"></div>
            
            <div class="card-content">
              <div class="card-header">
                <el-avatar :size="48" :src="row.avatar" class="employee-avatar">
                  {{ row.realName?.charAt(0) }}
                </el-avatar>
                <div class="employee-info">
                  <h3 class="employee-name">{{ row.realName }}</h3>
                  <span class="employee-position">{{ getPosName(row.position) }}</span>
                </div>
                <span class="status-badge" :class="row.status === 1 ? 'active' : 'inactive'">
                  {{ row.status === 1 ? '在职' : '离职' }}
                </span>
              </div>

              <div class="card-body">
                <div class="info-item">
                  <span class="info-label">部门</span>
                  <span class="info-value">{{ getDeptName(row.department) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">上级</span>
                  <span 
                    class="info-value supervisor" 
                    :class="{ 'clickable': canEditSupervisor }" 
                    @click="canEditSupervisor && openSupervisorDialog(row)"
                  >
                    {{ getSupervisorName(row.supervisorId) || '自动推断' }}
                    <svg v-if="canEditSupervisor" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">邮箱</span>
                  <span class="info-value email" :title="row.workEmail">{{ row.workEmail || '未绑定' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">入职</span>
                  <span class="info-value">{{ formatDate(row.createTime) }}</span>
                </div>
              </div>

              <div class="card-footer">
                <button class="btn-text" @click="openRoles(row)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                  权限
                </button>
                <button
                  v-if="row.status === 1"
                  class="btn-text btn-danger"
                  @click="openLeaveDialog(row)"
                  :disabled="row.isFounder === true || row.positionCode === 'FOUNDER'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
                  </svg>
                  离职
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <p>暂无员工数据</p>
        </div>
      </template>
    </div>

    <!-- 角色查看抽屉 -->
    <el-drawer v-model="rolesVisible" title="员工权限配置" size="400px" destroy-on-close>
      <div v-if="rolesLoading" class="drawer-loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      <div v-else-if="roleRows.length === 0" class="drawer-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
        </svg>
        <p>暂无角色权限</p>
      </div>
      <div v-else class="roles-list">
        <div class="role-item" v-for="r in roleRows" :key="r.id">
          <div class="role-header">
            <span class="role-name">{{ r.roleName }}</span>
            <span class="role-code">{{ r.roleCode }}</span>
          </div>
          <div class="perm-tags">
            <span v-for="p in r.perms" :key="p" class="perm-tag">{{ p }}</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 离职对话框 -->
    <el-dialog v-model="leaveDialogVisible" title="办理离职" width="440px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="leaveForm" label-position="top">
        <div class="dialog-info">
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
        <button class="btn-secondary" @click="leaveDialogVisible = false">取消</button>
        <button class="btn-danger" @click="handleLeave" :disabled="leaveSubmitting">
          {{ leaveSubmitting ? '处理中...' : '确认办理' }}
        </button>
      </template>
    </el-dialog>

    <!-- 设置直属上级对话框 -->
    <el-dialog v-model="supervisorDialogVisible" title="设置直属上级" width="400px" :close-on-click-modal="false" destroy-on-close>
      <div class="dialog-info">
        <span class="label">员工：</span>
        <span class="value">{{ supervisorForm.employeeName }}</span>
      </div>
      <el-form :model="supervisorForm" label-position="top">
        <el-form-item label="直属上级">
          <el-select
            v-model="supervisorForm.supervisorId"
            placeholder="选择直属上级（留空则自动推断）"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="emp in availableSupervisors"
              :key="emp.id"
              :label="`${emp.realName} (${getDeptName(emp.department)})`"
              :value="emp.id"
            />
          </el-select>
          <p class="form-tip">如果不指定，系统将根据部门经理/职位级别自动推断</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn-secondary" @click="supervisorDialogVisible = false">取消</button>
        <button class="btn-primary" @click="handleSetSupervisor" :disabled="supervisorSubmitting">
          {{ supervisorSubmitting ? '处理中...' : '确认' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { listEmployees, employeeRoles, listDepartments, listPositions, employeeLeave, getMyEmployee, updateEmployeeSupervisor } from '@/api';
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
  const { keyword, department, status } = query.value;
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
const leaveTypeError = ref('');

const supervisorDialogVisible = ref(false);
const supervisorSubmitting = ref(false);
const supervisorForm = ref({ employeeId: '', employeeName: '', supervisorId: '' });
const employeeMap = ref<Record<string, any>>({});

const canEditSupervisor = computed(() => {
  if (!currentUser.value) return false;
  const currentEmp = rows.value.find(r => r.id === currentUser.value.employeeId);
  if (!currentEmp) return false;
  return currentEmp.isFounder === true || currentEmp.positionCode === 'FOUNDER' || currentEmp.isManagement === 1;
});

const availableSupervisors = computed(() => {
  return rows.value.filter(emp => emp.id !== supervisorForm.value.employeeId && emp.status === 1);
});

function getSupervisorName(supervisorId: string) {
  if (!supervisorId) return '';
  const supervisor = employeeMap.value[supervisorId];
  return supervisor ? supervisor.realName : supervisorId;
}

function openSupervisorDialog(row: any) {
  supervisorForm.value = { employeeId: row.id, employeeName: row.realName, supervisorId: row.supervisorId || '' };
  supervisorDialogVisible.value = true;
}

async function handleSetSupervisor() {
  supervisorSubmitting.value = true;
  try {
    const resp = await updateEmployeeSupervisor({ employeeId: supervisorForm.value.employeeId, supervisorId: supervisorForm.value.supervisorId || '' });
    if (resp.data.code === 200) {
      ElMessage.success('设置成功');
      supervisorDialogVisible.value = false;
      const emp = rows.value.find(r => r.id === supervisorForm.value.employeeId);
      if (emp) emp.supervisorId = supervisorForm.value.supervisorId;
    } else {
      ElMessage.error(resp.data.msg || '设置失败');
    }
  } catch { ElMessage.error('设置失败'); }
  finally { supervisorSubmitting.value = false; }
}

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
  } catch { console.error('加载角色失败'); }
  finally { rolesLoading.value = false; }
}

async function openLeaveDialog(row: any) {
  if (!currentUser.value) { ElMessage.warning('无法获取当前用户信息'); return; }
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
  } catch { console.error('获取当前用户信息失败'); }
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
      supervisorId: e.supervisorId || '',
      workEmail: e.workEmail || e.email || '',
      status: e.status ?? 1,
      avatar: e.avatar || '',
      createTime: e.createTime || e.hireDate,
      isFounder: e.isFounder || false,
      positionCode: e.positionCode || '',
      isManagement: e.isManagement || 0,
    }));
    rows.value.forEach((emp: any) => { employeeMap.value[emp.id] = emp; });
  } catch { rows.value = []; }
  finally { loading.value = false; }
}

onMounted(async () => { await loadCurrentUser(); loadData(); });
</script>


<style scoped>
.employees-page {
  padding: var(--space-6);
  background: var(--bg-secondary);
  min-height: 100vh;
}

/* Page Header */
.page-header {
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-1) 0;
}

.page-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: var(--space-5);
}

.filter-left {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  height: 36px;
}

.search-box svg {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  width: 180px;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.filter-select {
  width: 130px;
}

.filter-select-sm {
  width: 100px;
}

.filter-right {
  display: flex;
  gap: var(--space-2);
}

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-text {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-text:hover {
  background: var(--bg-secondary);
  color: var(--color-primary);
}

.btn-text.btn-danger:hover {
  background: #FEE2E2;
  color: #DC2626;
}

.btn-text:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  padding: var(--space-2) var(--space-4);
  background: #DC2626;
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-danger:hover {
  background: #B91C1C;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Skeleton Loading */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.skeleton-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(90deg, var(--border-light) 25%, var(--bg-secondary) 50%, var(--border-light) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--border-light) 25%, var(--bg-secondary) 50%, var(--border-light) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-line.w-60 { width: 60%; }
.skeleton-line.w-40 { width: 40%; }

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Employees Grid */
.employees-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

/* Employee Card */
.employee-card {
  position: relative;
  display: flex;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  cursor: pointer;
}

.employee-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.employee-card.is-resigned {
  opacity: 0.7;
}

/* Left Indicator Line */
.card-indicator {
  width: 3px;
  flex-shrink: 0;
}

.card-indicator.active {
  background: var(--color-success);
}

.card-indicator.inactive {
  background: var(--text-muted);
}

.card-content {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.employee-avatar {
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.employee-info {
  flex: 1;
  min-width: 0;
}

.employee-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.employee-position {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.status-badge.active {
  background: #D1FAE5;
  color: #059669;
}

.status-badge.inactive {
  background: var(--bg-tertiary);
  color: var(--text-muted);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
}

.info-label {
  color: var(--text-muted);
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.info-value.email {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-value.supervisor {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-value.supervisor.clickable {
  color: var(--color-primary);
  cursor: pointer;
}

.info-value.supervisor.clickable:hover {
  text-decoration: underline;
}

.info-value.supervisor svg {
  opacity: 0.6;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-light);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-12);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
}

.empty-state svg {
  opacity: 0.4;
}

.empty-state p {
  font-size: var(--font-size-sm);
  margin: 0;
}

/* Drawer */
.drawer-loading,
.drawer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-muted);
  gap: var(--space-3);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.drawer-empty svg {
  opacity: 0.4;
}

.drawer-empty p {
  font-size: var(--font-size-sm);
  margin: 0;
}

.roles-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.role-item {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border: 1px solid var(--border-color);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.role-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.role-code {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.perm-tag {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-primary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

/* Dialog */
.dialog-info {
  background: var(--bg-secondary);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-5);
  font-size: var(--font-size-sm);
}

.dialog-info .label {
  color: var(--text-muted);
}

.dialog-info .value {
  font-weight: 600;
  color: var(--text-primary);
}

.form-tip {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: var(--space-2);
}

.error-tip {
  color: #DC2626;
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
}

/* Responsive */
@media (max-width: 768px) {
  .employees-page {
    padding: var(--space-4);
  }

  .filter-bar {
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .filter-left {
    flex-direction: column;
    width: 100%;
  }

  .search-box,
  .filter-select,
  .filter-select-sm {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .filter-right {
    width: 100%;
    justify-content: space-between;
  }

  .employees-grid {
    grid-template-columns: 1fr;
  }
}

/* Dark Mode */
html.dark-mode .search-box {
  background: var(--bg-tertiary);
}

html.dark-mode .status-badge.active {
  background: rgba(52, 211, 153, 0.15);
  color: #34D399;
}

html.dark-mode .btn-text.btn-danger:hover {
  background: rgba(248, 113, 113, 0.15);
  color: #F87171;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .employee-card,
  .skeleton-avatar,
  .skeleton-line,
  .loading-spinner {
    animation: none;
    transition: none;
  }
}
</style>
