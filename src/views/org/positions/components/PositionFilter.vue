<template>
  <div class="filter-bar">
    <div class="filter-left">
      <!-- Search input -->
      <el-input
        v-model="localFilter.keyword"
        placeholder="搜索职位名称或编码..."
        clearable
        :prefix-icon="Search"
        class="search-input"
        @input="handleFilterChange"
        @keyup.enter="handleFilterChange"
      />

      <!-- Level filter -->
      <el-select
        v-model="localFilter.levels"
        placeholder="职位级别"
        multiple
        collapse-tags
        collapse-tags-tooltip
        clearable
        class="level-filter"
        @change="handleFilterChange"
      >
        <el-option
          v-for="level in levelOptions"
          :key="level.value"
          :label="level.label"
          :value="level.value"
        />
      </el-select>

      <!-- Job type filter -->
      <el-select
        v-model="localFilter.jobType"
        placeholder="岗位类型"
        clearable
        class="type-filter"
        @change="handleFilterChange"
      >
        <el-option label="全部类型" value="" />
        <el-option label="管理岗" :value="1" />
        <el-option label="普通岗" :value="0" />
      </el-select>

      <!-- Status filter -->
      <el-select
        v-model="localFilter.status"
        placeholder="状态"
        clearable
        class="status-filter"
        @change="handleFilterChange"
      >
        <el-option label="全部状态" value="" />
        <el-option label="启用" :value="1" />
        <el-option label="停用" :value="0" />
      </el-select>
    </div>

    <div class="filter-right">
      <!-- Advanced filter toggle -->
      <el-button
        :icon="Filter"
        :type="hasAdvancedFilter ? 'primary' : 'default'"
        plain
        @click="showAdvanced = !showAdvanced"
      >
        高级筛选
        <el-badge :value="advancedFilterCount" :hidden="advancedFilterCount === 0" class="filter-badge" />
      </el-button>

      <!-- Reset button -->
      <el-button :icon="RefreshLeft" @click="handleReset" v-if="hasAnyFilter">
        重置
      </el-button>
    </div>

    <!-- Advanced filter panel -->
    <transition name="slide-down">
      <div class="advanced-filter" v-show="showAdvanced">
        <div class="filter-group">
          <label class="filter-label">薪资范围 (K)</label>
          <div class="salary-range">
            <el-input-number
              v-model="localFilter.salaryMin"
              :min="0"
              :max="localFilter.salaryMax || 999"
              placeholder="最低"
              controls-position="right"
              class="salary-input"
              @change="handleFilterChange"
            />
            <span class="range-separator">-</span>
            <el-input-number
              v-model="localFilter.salaryMax"
              :min="localFilter.salaryMin || 0"
              :max="999"
              placeholder="最高"
              controls-position="right"
              class="salary-input"
              @change="handleFilterChange"
            />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">其他条件</label>
          <el-checkbox
            v-model="localFilter.hasVacancy"
            @change="handleFilterChange"
          >
            仅显示有空缺的职位
          </el-checkbox>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import { Search, Filter, RefreshLeft } from '@element-plus/icons-vue';
import type { FilterState } from '../types';

interface Props {
  filter: FilterState;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:filter', filter: FilterState): void;
  (e: 'reset'): void;
}>();

const showAdvanced = ref(false);

// Local copy of filter for v-model binding
const localFilter = reactive<FilterState>({
  keyword: '',
  levels: [],
  jobType: '',
  status: '',
  salaryMin: null,
  salaryMax: null,
  hasVacancy: false,
});

// Sync with props
watch(() => props.filter, (newFilter) => {
  Object.assign(localFilter, newFilter);
}, { immediate: true, deep: true });

// Level options
const levelOptions = computed(() => {
  return Array.from({ length: 20 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}级`,
  }));
});

// Check if has any filter
const hasAnyFilter = computed(() => {
  return (
    localFilter.keyword !== '' ||
    localFilter.levels.length > 0 ||
    localFilter.jobType !== '' ||
    localFilter.status !== '' ||
    localFilter.salaryMin !== null ||
    localFilter.salaryMax !== null ||
    localFilter.hasVacancy
  );
});

// Check if has advanced filter
const hasAdvancedFilter = computed(() => {
  return (
    localFilter.salaryMin !== null ||
    localFilter.salaryMax !== null ||
    localFilter.hasVacancy
  );
});

// Count of advanced filters
const advancedFilterCount = computed(() => {
  let count = 0;
  if (localFilter.salaryMin !== null || localFilter.salaryMax !== null) count++;
  if (localFilter.hasVacancy) count++;
  return count;
});

function handleFilterChange() {
  emit('update:filter', { ...localFilter });
}

function handleReset() {
  localFilter.keyword = '';
  localFilter.levels = [];
  localFilter.jobType = '';
  localFilter.status = '';
  localFilter.salaryMin = null;
  localFilter.salaryMax = null;
  localFilter.hasVacancy = false;
  emit('reset');
}
</script>

<style scoped>
.filter-bar {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-left {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.filter-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  width: 240px;
}

.level-filter {
  width: 160px;
}

.type-filter,
.status-filter {
  width: 120px;
}

.filter-badge {
  margin-left: 4px;
}

.filter-badge :deep(.el-badge__content) {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 5px;
}

/* Advanced filter panel */
.advanced-filter {
  width: 100%;
  padding-top: 16px;
  margin-top: 4px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.salary-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.salary-input {
  width: 120px;
}

.range-separator {
  color: var(--text-muted);
}

/* Slide animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-base);
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  margin-top: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 200px;
}

/* Responsive */
@media (max-width: 1024px) {
  .search-input {
    width: 200px;
  }

  .level-filter {
    width: 140px;
  }
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-left {
    flex-direction: column;
  }

  .filter-right {
    justify-content: flex-end;
  }

  .search-input,
  .level-filter,
  .type-filter,
  .status-filter {
    width: 100%;
  }

  .advanced-filter {
    flex-direction: column;
    gap: 16px;
  }

  .salary-range {
    width: 100%;
  }

  .salary-input {
    flex: 1;
  }
}
</style>
