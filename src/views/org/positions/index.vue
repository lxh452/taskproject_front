<template>
  <div class="positions-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">职位管理</h1>
        <p class="page-desc">管理公司组织架构中的职位信息</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="handleRefresh" circle title="刷新" />
        <el-dropdown trigger="click" @command="handleImportExport">
          <el-button>
            <el-icon><Operation /></el-icon>
            导入/导出
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="import">
                <el-icon><Upload /></el-icon>导入职位
              </el-dropdown-item>
              <el-dropdown-item command="export">
                <el-icon><Download /></el-icon>导出职位
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增职位</el-button>
      </div>
    </div>

    <!-- Stats Row -->
    <PositionStats :stats="stats" />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Left: Department Tree -->
      <DepartmentTree
        :departments="departmentTree"
        :selected-id="selectedDeptId"
        :loading="loading"
        @select="selectDepartment"
        @collapse-change="handleTreeCollapse"
      />

      <!-- Right: Filter + Table -->
      <div class="content-right">
        <!-- Filter Bar -->
        <PositionFilter
          :filter="filter"
          @update:filter="handleFilterUpdate"
          @reset="resetFilter"
        />

        <!-- Table -->
        <PositionTable
          ref="tableRef"
          :data="paginatedPositions"
          :loading="loading"
          :total="filteredPositions.length"
          :page="pagination.page"
          :page-size="pagination.pageSize"
          :selected-rows="selectedRows"
          @edit="handleEdit"
          @view="handleView"
          @delete="handleDelete"
          @toggle-status="handleToggleStatus"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
          @batch-delete="handleBatchDelete"
          @batch-enable="handleBatchEnable"
          @batch-disable="handleBatchDisable"
          @batch-export="handleBatchExport"
        />
      </div>
    </div>

    <!-- Position Form Drawer -->
    <PositionForm
      v-model="formVisible"
      :position="currentPosition"
      :departments="departments"
      :roles="roles"
      :default-department-id="selectedDeptId"
      @submit="handleFormSubmit"
    />

    <!-- Position Detail Drawer -->
    <PositionDetail
      v-model="detailVisible"
      :position="currentPosition"
      @edit="handleEditFromDetail"
    />

    <!-- Import/Export Dialog -->
    <ImportExportDialog
      v-model="importExportVisible"
      :mode="importExportMode"
      :total-count="positions.length"
      :filtered-count="filteredPositions.length"
      :selected-count="selectedRows.length"
      @import="handleImport"
      @export="handleExport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Plus, Refresh, Operation, Upload, Download, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// Components
import DepartmentTree from './components/DepartmentTree.vue';
import PositionStats from './components/PositionStats.vue';
import PositionFilter from './components/PositionFilter.vue';
import PositionTable from './components/PositionTable.vue';
import PositionForm from './components/PositionForm.vue';
import PositionDetail from './components/PositionDetail.vue';
import ImportExportDialog from './components/ImportExportDialog.vue';

// Composables
import { usePositionData } from './composables/usePositionData';

// Types
import type { Position, PositionFormData, FilterState, ExportOptions } from './types';

// Use composable
const {
  loading,
  positions,
  departments,
  roles,
  selectedDeptId,
  selectedRows,
  filter,
  pagination,
  filteredPositions,
  paginatedPositions,
  stats,
  departmentTree,
  initData,
  loadPositions,
  loadRoles,
  createPositionData,
  updatePositionData,
  deletePositionData,
  batchDelete,
  batchUpdateStatus,
  resetFilter,
  handleSortChange,
  handlePageChange,
  handlePageSizeChange,
  handleSelectionChange,
  selectDepartment,
} = usePositionData();

// Refs
const tableRef = ref();
const formVisible = ref(false);
const detailVisible = ref(false);
const importExportVisible = ref(false);
const importExportMode = ref<'import' | 'export'>('import');
const currentPosition = ref<Position | null>(null);

// Initialize
onMounted(async () => {
  await initData();
  await loadRoles();

  // Register keyboard shortcuts
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  // Ctrl+N: New position
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    handleAdd();
  }
  // Ctrl+F: Focus search
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    const searchInput = document.querySelector('.search-input input') as HTMLInputElement;
    searchInput?.focus();
  }
  // Escape: Clear selection
  if (e.key === 'Escape') {
    tableRef.value?.clearSelection();
  }
  // Delete: Delete selected (with confirmation)
  if (e.key === 'Delete' && selectedRows.value.length > 0) {
    handleBatchDelete(selectedRows.value.map(r => r.id));
  }
}

// Handlers
function handleRefresh() {
  loadPositions();
}

function handleTreeCollapse(collapsed: boolean) {
  // Could store preference
}

function handleFilterUpdate(newFilter: FilterState) {
  Object.assign(filter, newFilter);
}

function handleAdd() {
  currentPosition.value = null;
  formVisible.value = true;
}

function handleEdit(row: Position) {
  currentPosition.value = row;
  formVisible.value = true;
}

function handleView(row: Position) {
  currentPosition.value = row;
  detailVisible.value = true;
}

function handleEditFromDetail(row: Position) {
  currentPosition.value = row;
  detailVisible.value = false;
  formVisible.value = true;
}

async function handleDelete(row: Position) {
  await deletePositionData(row.id);
}

async function handleToggleStatus(row: Position) {
  const newStatus = row.status === 1 ? 0 : 1;
  await updatePositionData({ ...row, status: newStatus });
}

async function handleFormSubmit(data: PositionFormData) {
  let success = false;
  if (data.id) {
    success = await updatePositionData(data);
  } else {
    success = await createPositionData(data);
  }
  if (success) {
    formVisible.value = false;
  }
}

async function handleBatchDelete(ids: string[]) {
  await batchDelete(ids);
}

async function handleBatchEnable(ids: string[]) {
  await batchUpdateStatus(ids, 1);
}

async function handleBatchDisable(ids: string[]) {
  await batchUpdateStatus(ids, 0);
}

function handleBatchExport(ids: string[]) {
  importExportMode.value = 'export';
  importExportVisible.value = true;
}

function handleImportExport(command: string) {
  importExportMode.value = command as 'import' | 'export';
  importExportVisible.value = true;
}

async function handleImport(data: any[]) {
  // Process imported data
  let successCount = 0;
  for (const item of data) {
    const result = await createPositionData({
      departmentId: item.departmentId || '',
      positionName: item.positionName,
      positionCode: item.positionCode,
      positionLevel: item.positionLevel || 1,
      isManagement: item.isManagement || 0,
      status: item.status || 1,
    });
    if (result) successCount++;
  }
  if (successCount > 0) {
    ElMessage.success(`成功导入 ${successCount} 个职位`);
    await loadPositions();
  }
}

function handleExport(options: ExportOptions) {
  // Get data to export based on scope
  let dataToExport: Position[] = [];
  if (options.scope === 'all') {
    dataToExport = positions.value;
  } else if (options.scope === 'filtered') {
    dataToExport = filteredPositions.value;
  } else if (options.scope === 'selected') {
    dataToExport = selectedRows.value;
  }

  // Build CSV content
  const headers = options.columns.map(col => {
    const colMap: Record<string, string> = {
      positionName: '职位名称',
      departmentName: '所属部门',
      positionCode: '职位编码',
      positionLevel: '职位级别',
      isManagement: '岗位类型',
      status: '状态',
      salaryMin: '最低薪资',
      salaryMax: '最高薪资',
      headcountMax: '编制人数',
      skillRequirements: '技能要求',
      description: '职位描述',
    };
    return colMap[col] || col;
  });

  const rows = dataToExport.map(item => {
    return options.columns.map(col => {
      const value = item[col as keyof Position];
      if (col === 'isManagement') {
        return value === 1 ? '管理岗' : '普通岗';
      }
      if (col === 'status') {
        return value === 1 ? '启用' : '停用';
      }
      return value ?? '';
    });
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download file
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `职位列表_${new Date().toISOString().slice(0, 10)}.${options.format === 'csv' ? 'csv' : 'csv'}`;
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success(`成功导出 ${dataToExport.length} 条数据`);
}
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

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: clamp(20px, 1.5vw, 24px);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.page-desc {
  font-size: clamp(13px, 0.95vw, 15px);
  color: var(--text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Main Content */
.main-content {
  display: flex;
  gap: clamp(16px, 1.2vw, 20px);
  flex: 1;
  min-height: 0;
}

.content-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .positions-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .header-actions .el-button:last-child {
    flex: 1;
  }
}
</style>
