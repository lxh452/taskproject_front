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
  padding: 20px;
  background: #f9fafb;
  min-height: calc(100vh - 64px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input { width: 200px; }
.filter-select { width: 140px; }
.filter-select-sm { width: 100px; }

.filter-right {
  display: flex;
  gap: 8px;
}

/* 员工网格 */
.employees-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* 员工卡片 */
.employee-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 18px;
  position: relative;
  transition: box-shadow 0.15s;
}

.employee-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.employee-card.is-resigned {
  opacity: 0.6;
}

.card-status {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 10px;
}

.card-status.active { background: #d1fae5; color: #059669; }
.card-status.inactive { background: #f3f4f6; color: #6b7280; }

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.employee-avatar {
  background: #4f46e5;
  color: #fff;
  font-weight: 600;
  font-size: 18px;
}

.employee-info { flex: 1; min-width: 0; }

.employee-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 2px;
}

.employee-position {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.info-label { color: #9ca3af; }
.info-value { color: #1f2937; font-weight: 500; }
.info-value.email {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
}

/* 空状态 */
.empty-state {
  padding: 60px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* 抽屉 */
.drawer-loading, .drawer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 180px;
  color: #6b7280;
  gap: 10px;
}

.roles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-item {
  background: #f9fafb;
  border-radius: 6px;
  padding: 14px;
  border: 1px solid #e5e7eb;
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.role-name { font-weight: 600; color: #1f2937; font-size: 14px; }

.perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 对话框 */
.dialog-user-info {
  background: #f9fafb;
  padding: 12px 14px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 13px;
}

.dialog-user-info .label { color: #6b7280; }
.dialog-user-info .value { font-weight: 600; color: #1f2937; }

.error-tip { color: #ef4444; font-size: 12px; margin-top: 4px; }

@media (max-width: 768px) {
    .employees-page { padding: 16px; }
    .filter-bar { flex-direction: column; gap: 10px; }
    .filter-left { flex-direction: column; width: 100%; }
    .search-input, .filter-select, .filter-select-sm { width: 100%; }
    .filter-right { width: 100%; justify-content: space-between; }
    .employees-grid { grid-template-columns: 1fr; }
}
</style>
