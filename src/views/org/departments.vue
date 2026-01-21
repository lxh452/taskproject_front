<template>
  <div class="departments-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">部门管理</h1>
        <p class="page-desc">管理公司组织架构中的部门信息</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadData" circle />
        <el-button type="primary" :icon="Plus" @click="openCreate">新建部门</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ rows.length }}</div>
          <div class="stat-label">部门总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ rows.filter(r => r.status === 1).length }}</div>
          <div class="stat-label">启用中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon inactive">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ rows.filter(r => r.status !== 1).length }}</div>
          <div class="stat-label">已停用</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon members">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ employeeOptions.length }}</div>
          <div class="stat-label">员工总数</div>
        </div>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-bar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索部门名称或编码..." 
        clearable 
        :prefix-icon="Search"
        class="search-input"
      />
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable class="status-filter">
        <el-option label="全部" value="" />
        <el-option label="启用" :value="1" />
        <el-option label="停用" :value="0" />
      </el-select>
    </div>

    <!-- 部门列表 -->
    <div class="content-area">
      <el-skeleton :rows="4" animated v-if="loading" />
      <template v-else>
        <div v-if="filteredRows.length > 0" class="departments-grid">
          <div 
            v-for="row in filteredRows" 
            :key="row.id" 
            class="dept-card"
            :class="{ 'inactive': row.status !== 1 }"
          >
            <div class="card-header">
              <div class="dept-icon">
                <el-icon><Folder /></el-icon>
              </div>
              <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
                <el-button :icon="MoreFilled" text circle class="more-btn" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view"><el-icon><View /></el-icon>查看详情</el-dropdown-item>
                    <el-dropdown-item command="edit"><el-icon><Edit /></el-icon>编辑</el-dropdown-item>
                    <el-dropdown-item command="toggle" :divided="true">
                      <el-icon><Switch /></el-icon>{{ row.status === 1 ? '停用' : '启用' }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="card-body">
              <h3 class="dept-name">{{ row.departmentName }}</h3>
              <div class="dept-meta">
                <el-tag size="small" effect="plain" class="dept-code">{{ row.departmentCode }}</el-tag>
                <el-tag 
                  size="small" 
                  :type="row.status === 1 ? 'success' : 'info'"
                  effect="light"
                >
                  {{ row.statusText }}
                </el-tag>
              </div>
            </div>

            <div class="card-info">
              <div class="info-item">
                <el-icon class="info-icon"><UserFilled /></el-icon>
                <span class="info-label">负责人</span>
                <span class="info-value">{{ row.manager || '未指定' }}</span>
              </div>
              <div class="info-item" v-if="row.employeeCount !== undefined">
                <el-icon class="info-icon"><User /></el-icon>
                <span class="info-label">成员</span>
                <span class="info-value">{{ row.employeeCount }} 人</span>
              </div>
            </div>

            <div class="card-footer">
              <el-button size="small" @click="viewDepartment(row)">
                <el-icon><View /></el-icon>查看
              </el-button>
              <el-button size="small" type="primary" @click="editDepartment(row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-empty :description="searchKeyword ? '未找到匹配的部门' : '暂无部门数据'">
            <el-button type="primary" @click="openCreate" v-if="!searchKeyword">创建第一个部门</el-button>
          </el-empty>
        </div>
      </template>
    </div>

    <!-- 查看详情抽屉 -->
    <el-drawer v-model="viewVisible" title="部门详情" size="420px" destroy-on-close>
      <div v-if="viewData" class="detail-content">
        <div class="detail-header">
          <div class="detail-icon">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="detail-title">
            <h3>{{ viewData.departmentName }}</h3>
            <el-tag size="small" :type="viewData.status === 1 ? 'success' : 'info'">
              {{ viewData.statusText }}
            </el-tag>
          </div>
        </div>

        <el-descriptions :column="1" border class="detail-desc">
          <el-descriptions-item label="部门编码">{{ viewData.departmentCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">
            <div class="manager-cell">
              <el-avatar :size="24">{{ viewData.manager?.charAt(0) || '?' }}</el-avatar>
              <span>{{ viewData.manager || '未指定' }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="viewData.status === 1 ? 'success' : 'info'" size="small">
              {{ viewData.statusText }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" v-if="viewData.remark">
            {{ viewData.remark }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
        <el-button type="primary" @click="editFromView">编辑</el-button>
      </template>
    </el-drawer>

    <!-- 编辑/新建抽屉 -->
    <el-drawer 
      v-model="visible" 
      :title="isEdit ? '编辑部门' : '新建部门'" 
      size="420px" 
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="edit-form">
        <el-form-item label="部门名称" prop="departmentName">
          <el-input v-model="form.departmentName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码" prop="departmentCode">
          <el-input v-model="form.departmentCode" placeholder="如：TECH、HR、SALES" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="form.managerId" filterable clearable placeholder="选择负责人" style="width: 100%">
            <el-option
              v-for="emp in employeeOptions"
              :key="emp.id"
              :label="emp.name"
              :value="emp.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="form.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="部门职责、定位等描述信息" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSubmit">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Refresh, Plus, Folder, View, Edit, MoreFilled, Search, Switch,
  OfficeBuilding, CircleCheck, CircleClose, User, UserFilled
} from '@element-plus/icons-vue';
import { listDepartments, getMyEmployee, listEmployees, createDepartment, updateDepartment } from '@/api';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const visible = ref(false);
const viewVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const viewData = ref<any>(null);
const searchKeyword = ref('');
const statusFilter = ref<number | ''>('');

const form = ref<any>({
  id: '',
  departmentName: '',
  departmentCode: '',
  managerId: '',
  status: 1,
  remark: '',
});

const rules: FormRules = {
  departmentName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
};

const employeeOptions = ref<{ id: string; name: string }[]>([]);
let companyId = '';

const filteredRows = computed(() => {
  return rows.value.filter(r => {
    const matchKeyword = !searchKeyword.value || 
      r.departmentName?.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      r.departmentCode?.toLowerCase().includes(searchKeyword.value.toLowerCase());
    const matchStatus = statusFilter.value === '' || r.status === statusFilter.value;
    return matchKeyword && matchStatus;
  });
});

function handleCommand(cmd: string, row: any) {
  if (cmd === 'view') viewDepartment(row);
  else if (cmd === 'edit') editDepartment(row);
  else if (cmd === 'toggle') toggleStatus(row);
}

function viewDepartment(row: any) {
  viewData.value = { ...row };
  viewVisible.value = true;
}

function editFromView() {
  if (!viewData.value) return;
  viewVisible.value = false;
  editDepartment(viewData.value);
}

function openCreate() {
  isEdit.value = false;
  form.value = { id: '', departmentName: '', departmentCode: '', managerId: '', status: 1, remark: '' };
  visible.value = true;
}

function editDepartment(row: any) {
  isEdit.value = true;
  form.value = {
    id: row.id,
    departmentName: row.departmentName,
    departmentCode: row.departmentCode !== '-' ? row.departmentCode : '',
    managerId: row.managerId || '',
    status: row.status ?? 1,
    remark: row.remark || '',
  };
  visible.value = true;
}

async function toggleStatus(row: any) {
  try {
    const newStatus = row.status === 1 ? 0 : 1;
    const resp = await updateDepartment({ id: row.id, status: newStatus });
    if (resp.data.code !== 200) throw new Error(resp.data.msg);
    ElMessage.success(newStatus === 1 ? '已启用' : '已停用');
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  }
}

async function onSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload = {
        id: form.value.id,
        companyId,
        departmentName: form.value.departmentName,
        departmentCode: form.value.departmentCode,
        managerId: form.value.managerId,
        status: form.value.status,
        description: form.value.remark,
      };
      const api = isEdit.value ? updateDepartment : createDepartment;
      const resp = await api(payload);
      if (resp.data.code !== 200) throw new Error(resp.data.msg || '保存失败');
      ElMessage.success('保存成功');
      visible.value = false;
      loadData();
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败');
    } finally {
      saving.value = false;
    }
  });
}

async function loadData() {
  loading.value = true;
  try {
    const meResp = await getMyEmployee();
    companyId = '';
    if (meResp.data.code === 200 && meResp.data.data) {
      companyId = meResp.data.data.companyId || meResp.data.data.CompanyId || '';
    }
    if (!companyId) { ElMessage.warning('无法获取公司信息'); rows.value = []; return; }

    const resp = await listDepartments({ page: 1, pageSize: 100, companyId });
    if (resp.data.code !== 200) { rows.value = []; return; }
    const list = resp.data?.data?.list || [];
    rows.value = list.map((d: any) => ({
      id: d.id || d.Id,
      departmentName: d.departmentName || d.DepartmentName || '未命名部门',
      departmentCode: (d.departmentCode?.String ?? d.departmentCode ?? d.DepartmentCode?.String ?? d.DepartmentCode) || '-',
      manager: d.managerName || d.ManagerName || '-',
      managerId: d.managerId || d.ManagerId || '',
      remark: d.description || d.remark || d.Remark || '',
      status: d.status ?? d.Status ?? 1,
      statusText: (d.status ?? d.Status ?? 1) === 1 ? '启用' : '停用',
      employeeCount: d.employeeCount ?? d.EmployeeCount,
    }));

    const empResp = await listEmployees({ page: 1, pageSize: 200, companyId });
    if (empResp.data?.code === 200) {
      const empList = empResp.data?.data?.list || [];
      employeeOptions.value = empList.map((e: any) => ({
        id: e.id || e.employeeId || e.Id,
        name: e.realName || e.name || '未知',
      }));
    }
  } catch (error: any) { 
    console.error('加载部门列表失败:', error); 
    rows.value = []; 
  } finally { 
    loading.value = false; 
  }
}

onMounted(() => { loadData(); });
</script>

<style scoped>
.departments-page {
  padding: 24px;
  background: var(--bg-page, #f5f7fa);
  min-height: calc(100vh - 64px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.stat-icon.total { background: var(--color-primary); color: #fff; }
.stat-icon.active { background: var(--color-success); color: #fff; }
.stat-icon.inactive { background: var(--text-muted); color: #fff; }
.stat-icon.members { background: var(--color-warning); color: #fff; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.search-input {
  width: 280px;
}

.status-filter {
  width: 120px;
}

/* 部门网格 */
.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

/* 部门卡片 */
.dept-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.25s ease;
}

.dept-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
  border-color: #c7d2fe;
}

.dept-card.inactive {
  opacity: 0.7;
}

.dept-card.inactive:hover {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0;
}

.dept-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.more-btn {
  color: #9ca3af;
}

.more-btn:hover {
  color: #3B82F6;
  background: #f3f4f6;
}

.card-body {
  padding: 16px 20px;
}

.dept-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px;
}

.dept-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dept-code {
  font-family: 'SF Mono', Monaco, monospace;
  background: #f3f4f6;
  border: none;
}

.card-info {
  padding: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.info-icon {
  color: #9ca3af;
  font-size: 14px;
}

.info-label {
  color: #6b7280;
}

.info-value {
  color: #1f2937;
  font-weight: 500;
  margin-left: auto;
}

.card-footer {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
}

.card-footer .el-button {
  flex: 1;
}

/* 空状态 */
.empty-state {
  padding: 80px 40px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

/* 详情抽屉 */
.detail-content {
  padding: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
}

.detail-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.detail-title h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px;
}

.detail-desc {
  margin-top: 0;
}

.manager-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 编辑表单 */
.edit-form {
  padding: 0;
}

.edit-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .departments-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .el-button:last-child {
    flex: 1;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .stat-value {
    font-size: 22px;
  }

  .filter-bar {
    flex-direction: column;
  }

  .search-input,
  .status-filter {
    width: 100%;
  }

  .departments-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>
