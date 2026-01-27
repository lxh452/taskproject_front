<template>
  <div class="table-container">
    <!-- Table header with batch actions -->
    <div class="table-header">
      <div class="header-left">
        <span class="result-count">共 {{ total }} 条记录</span>
        <transition name="fade">
          <span class="selected-count" v-if="selectedRows.length > 0">
            已选择 {{ selectedRows.length }} 项
          </span>
        </transition>
      </div>
      <div class="header-right">
        <!-- Batch actions dropdown -->
        <el-dropdown
          trigger="click"
          :disabled="selectedRows.length === 0"
          @command="handleBatchCommand"
        >
          <el-button :disabled="selectedRows.length === 0">
            批量操作
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="enable">
                <el-icon><CircleCheck /></el-icon>批量启用
              </el-dropdown-item>
              <el-dropdown-item command="disable">
                <el-icon><CircleClose /></el-icon>批量停用
              </el-dropdown-item>
              <el-dropdown-item command="export" divided>
                <el-icon><Download /></el-icon>导出选中
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided class="danger-item">
                <el-icon><Delete /></el-icon>批量删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Table -->
    <el-table
      ref="tableRef"
      :data="data"
      :row-key="(row: Position) => row.id"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      v-loading="loading"
      stripe
      class="position-table"
    >
      <!-- Selection column -->
      <el-table-column type="selection" width="55" fixed="left" />

      <!-- Position name -->
      <el-table-column
        prop="positionName"
        label="职位名称"
        min-width="180"
        sortable="custom"
        fixed="left"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <div class="name-cell">
            <span class="position-name">{{ row.positionName }}</span>
            <el-tag size="small" effect="plain" class="position-code" v-if="row.positionCode">
              {{ row.positionCode }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- Department -->
      <el-table-column
        prop="departmentName"
        label="所属部门"
        min-width="140"
        sortable="custom"
        show-overflow-tooltip
      />

      <!-- Level -->
      <el-table-column
        prop="positionLevel"
        label="职位级别"
        width="100"
        sortable="custom"
        align="center"
      >
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="getLevelType(row.positionLevel)"
            effect="light"
            class="level-tag"
          >
            L{{ row.positionLevel }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Job type -->
      <el-table-column
        prop="isManagement"
        label="岗位类型"
        width="100"
        sortable="custom"
        align="center"
      >
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="row.isManagement === 1 ? 'warning' : 'info'"
            effect="light"
          >
            {{ row.isManagement === 1 ? '管理岗' : '普通岗' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Salary range -->
      <el-table-column
        prop="salaryMin"
        label="薪资范围"
        width="140"
        sortable="custom"
        align="center"
        class-name="hide-mobile-col"
      >
        <template #default="{ row }">
          <span v-if="row.salaryMin || row.salaryMax" class="salary-text">
            {{ row.salaryMin || 0 }}K - {{ row.salaryMax || '不限' }}K
          </span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>

      <!-- Headcount -->
      <el-table-column
        label="编制人数"
        width="100"
        align="center"
        class-name="hide-mobile-col"
      >
        <template #default="{ row }">
          <span class="headcount-text">
            <span :class="{ 'text-warning': (row.headcountCurrent || 0) < (row.headcountMax || 0) }">
              {{ row.headcountCurrent || 0 }}
            </span>
            <span class="text-muted">/{{ row.headcountMax || '-' }}</span>
          </span>
        </template>
      </el-table-column>

      <!-- Status -->
      <el-table-column
        prop="status"
        label="状态"
        width="90"
        sortable="custom"
        align="center"
      >
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="row.status === 1 ? 'success' : 'info'"
            effect="light"
          >
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Actions -->
      <el-table-column
        label="操作"
        width="150"
        fixed="right"
        align="center"
      >
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="handleView(row)"
            >
              详情
            </el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => handleRowCommand(cmd, row)">
              <el-button type="primary" link size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="toggle">
                    {{ row.status === 1 ? '停用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided class="danger-item">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ArrowDown,
  CircleCheck,
  CircleClose,
  Download,
  Delete,
  MoreFilled
} from '@element-plus/icons-vue';
import type { Position } from '../types';

interface Props {
  data: Position[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  selectedRows: Position[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'edit', row: Position): void;
  (e: 'view', row: Position): void;
  (e: 'delete', row: Position): void;
  (e: 'toggle-status', row: Position): void;
  (e: 'selection-change', rows: Position[]): void;
  (e: 'sort-change', sort: { prop: string; order: 'ascending' | 'descending' | null }): void;
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', size: number): void;
  (e: 'batch-delete', ids: string[]): void;
  (e: 'batch-enable', ids: string[]): void;
  (e: 'batch-disable', ids: string[]): void;
  (e: 'batch-export', ids: string[]): void;
}>();

const tableRef = ref();

const currentPage = computed({
  get: () => props.page,
  set: (val) => emit('page-change', val),
});

const currentPageSize = computed({
  get: () => props.pageSize,
  set: (val) => emit('page-size-change', val),
});

function getLevelType(level: number): '' | 'success' | 'warning' | 'danger' | 'info' {
  if (level >= 15) return 'danger';
  if (level >= 10) return 'warning';
  if (level >= 5) return 'success';
  return 'info';
}

function handleSelectionChange(rows: Position[]) {
  emit('selection-change', rows);
}

function handleSortChange({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) {
  emit('sort-change', { prop, order });
}

function handlePageChange(page: number) {
  emit('page-change', page);
}

function handlePageSizeChange(size: number) {
  emit('page-size-change', size);
}

function handleEdit(row: Position) {
  emit('edit', row);
}

function handleView(row: Position) {
  emit('view', row);
}

function handleRowCommand(cmd: string, row: Position) {
  if (cmd === 'toggle') {
    emit('toggle-status', row);
  } else if (cmd === 'delete') {
    emit('delete', row);
  }
}

function handleBatchCommand(cmd: string) {
  const ids = props.selectedRows.map(r => r.id);
  if (cmd === 'delete') {
    emit('batch-delete', ids);
  } else if (cmd === 'enable') {
    emit('batch-enable', ids);
  } else if (cmd === 'disable') {
    emit('batch-disable', ids);
  } else if (cmd === 'export') {
    emit('batch-export', ids);
  }
}

// Expose method to clear selection
function clearSelection() {
  tableRef.value?.clearSelection();
}

defineExpose({ clearSelection });
</script>

<style scoped>
.table-container {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.result-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.selected-count {
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
  padding: 4px 12px;
  background: var(--color-primary-light);
  border-radius: var(--radius-full);
}

.header-right {
  display: flex;
  gap: 8px;
}

/* Table styles */
.position-table {
  --el-table-header-bg-color: var(--bg-secondary);
}

.position-table :deep(.el-table__header th) {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-secondary);
}

.position-table :deep(.el-table__row) {
  cursor: pointer;
}

.position-table :deep(.el-table__row:hover > td) {
  background: var(--bg-hover) !important;
}

/* Name cell */
.name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.position-name {
  font-weight: 500;
  color: var(--text-primary);
}

.position-code {
  font-family: var(--font-family-mono);
  font-size: 11px;
  background: var(--bg-tertiary);
  border: none;
  width: fit-content;
}

/* Level tag */
.level-tag {
  font-weight: 600;
  min-width: 36px;
}

/* Salary text */
.salary-text {
  font-size: 13px;
  color: var(--text-primary);
}

/* Headcount */
.headcount-text {
  font-size: 13px;
}

.text-muted {
  color: var(--text-muted);
}

.text-warning {
  color: var(--color-warning);
  font-weight: 500;
}

/* Action buttons */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* Danger dropdown item */
.danger-item {
  color: var(--color-danger) !important;
}

.danger-item:hover {
  background: var(--color-danger-light) !important;
}

/* Pagination */
.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-card);
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .table-pagination {
    padding: 12px 16px;
  }

  .table-pagination :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }

  .table-pagination :deep(.el-pagination__sizes),
  .table-pagination :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
