<template>
  <div class="my-checklists-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">我的清单</h1>
      <p class="page-subtitle">查看和管理分配给我的所有清单项</p>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <el-radio-group v-model="filters.isCompleted" class="status-filter">
        <el-radio-button :label="-1">全部</el-radio-button>
        <el-radio-button :label="0">未完成</el-radio-button>
        <el-radio-button :label="1">已完成</el-radio-button>
      </el-radio-group>
      
      <el-input 
        v-model="filters.keyword" 
        placeholder="搜索清单内容" 
        clearable 
        class="filter-input"
        :prefix-icon="Search"
      />
      
      <div class="spacer"></div>
      
      <el-button 
        v-if="selectedIds.length > 0" 
        type="primary" 
        @click="batchComplete"
        :loading="batchLoading"
      >
        批量完成 ({{ selectedIds.length }})
      </el-button>
    </div>

    <!-- Checklist Table -->
    <div class="table-container">
      <el-table 
        :data="filteredChecklists" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
        class="checklist-table"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="清单内容" min-width="300">
          <template #default="{ row }">
            <div class="checklist-content">
              <el-checkbox 
                :model-value="row.isCompleted === 1"
                @change="toggleComplete(row)"
                :disabled="updating"
                class="checklist-checkbox"
              />
              <span 
                class="content-text" 
                :class="{ 'completed': row.isCompleted === 1 }"
              >
                {{ row.content }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="taskTitle" label="所属任务" width="200">
          <template #default="{ row }">
            <el-button 
              type="primary"
              size="small"
              @click="goToTask(row.taskId)"
            >
              {{ row.taskTitle }}
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column prop="taskNodeName" label="任务节点" width="180">
          <template #default="{ row }">
            <span class="node-name">{{ row.taskNodeName }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="完成时间" width="180">
          <template #default="{ row }">
            <span class="time-text">
              {{ row.completeTime ? formatDate(row.completeTime) : '-' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.createTime) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty 
        v-if="filteredChecklists.length === 0 && !loading" 
        description="暂无清单项" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { getMyChecklist, updateChecklist, batchCompleteChecklist } from '@/api';
import { ElMessage } from 'element-plus';

const router = useRouter();

// State
const loading = ref(false);
const updating = ref(false);
const batchLoading = ref(false);
const checklists = ref<any[]>([]);
const selectedIds = ref<string[]>([]);

// Filters
const filters = ref({
  isCompleted: -1,
  keyword: '',
});

// Computed
const filteredChecklists = computed(() => {
  const { isCompleted, keyword } = filters.value;
  
  console.log('=== 过滤清单 ===');
  console.log('过滤条件 isCompleted:', isCompleted);
  console.log('原始清单数据:', checklists.value);
  
  return checklists.value.filter((item) => {
    // 确保 isCompleted 字段是数字类型进行比较
    const itemCompleted = Number(item.isCompleted);
    const filterCompleted = Number(isCompleted);
    
    const matchStatus = filterCompleted === -1 || itemCompleted === filterCompleted;
    const matchKeyword = !keyword || 
      item.content.toLowerCase().includes(keyword.toLowerCase());
    
    console.log(`清单项 "${item.content}": isCompleted=${itemCompleted}, 匹配状态=${matchStatus}`);
    
    return matchStatus && matchKeyword;
  });
});

// Methods
function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleSelectionChange(selection: any[]) {
  selectedIds.value = selection.map(item => item.id);
}

async function toggleComplete(row: any) {
  updating.value = true;
  try {
    const newStatus = row.isCompleted === 1 ? 0 : 1;
    const resp = await updateChecklist({
      checklistId: row.id,
      isCompleted: newStatus,
    });

    if (resp.data.code === 200) {
      row.isCompleted = newStatus;
      row.completeTime = newStatus === 1 ? new Date().toISOString() : null;
      ElMessage.success(newStatus === 1 ? '已完成' : '已取消完成');
    } else {
      ElMessage.error(resp.data.msg || '操作失败');
    }
  } catch (error) {
    console.error('更新清单失败:', error);
    ElMessage.error('网络错误，请稍后重试');
  } finally {
    updating.value = false;
  }
}

async function batchComplete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择清单项');
    return;
  }

  batchLoading.value = true;
  try {
    const resp = await batchCompleteChecklist({
      checklistIds: selectedIds.value,
      isCompleted: 1,
    });

    if (resp.data.code === 200) {
      // Update local data
      checklists.value.forEach(item => {
        if (selectedIds.value.includes(item.id)) {
          item.isCompleted = 1;
          item.completeTime = new Date().toISOString();
        }
      });
      selectedIds.value = [];
      ElMessage.success('批量完成成功');
    } else {
      ElMessage.error(resp.data.msg || '批量完成失败');
    }
  } catch (error) {
    console.error('批量完成失败:', error);
    ElMessage.error('网络错误，请稍后重试');
  } finally {
    batchLoading.value = false;
  }
}

function goToTask(taskId: string) {
  if (taskId) {
    router.push(`/tasks/detail/${taskId}`);
  }
}

async function loadChecklists() {
  loading.value = true;
  try {
    // 注意：后端的 isCompleted 参数：-1或其他=全部, 0=未完成, 1=已完成
    // 但前端过滤时使用 -1, 0, 1，所以这里传递 -1 获取全部数据，然后在前端过滤
    const resp = await getMyChecklist({
      page: 1,
      pageSize: 1000,
      isCompleted: -1, // 获取全部数据
    });

    console.log('=== 我的清单 API 响应 ===');
    console.log('完整响应:', resp.data);
    
    if (resp.data.code === 200) {
      const data = resp.data.data;
      checklists.value = data.list || [];
      
      console.log('清单总数:', checklists.value.length);
      console.log('未完成数量:', checklists.value.filter(item => Number(item.isCompleted) === 0).length);
      console.log('已完成数量:', checklists.value.filter(item => Number(item.isCompleted) === 1).length);
      console.log('清单数据示例:', checklists.value.slice(0, 3));
      
      // 打印每个清单项的 isCompleted 类型和值
      checklists.value.forEach((item, index) => {
        console.log(`清单 ${index}: isCompleted=${item.isCompleted}, type=${typeof item.isCompleted}`);
      });
    } else {
      ElMessage.error(resp.data.msg || '加载失败');
    }
  } catch (error) {
    console.error('加载清单失败:', error);
    ElMessage.error('网络错误，请稍后重试');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadChecklists();
});
// keep-alive 激活时重新加载数据
onActivated(() => {
  loadChecklists();
});
</script>

<style scoped>
.my-checklists-page {
  padding: var(--space-6);
  background: var(--bg-page);
  min-height: calc(100vh - var(--header-height));
}

/* Header */
.page-header {
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.page-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Filters */
.filters-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.status-filter {
  flex-shrink: 0;
}

.filter-input {
  width: 300px;
}

.spacer {
  flex: 1;
}

/* Table */
.table-container {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  padding: var(--space-1);
}

.checklist-table {
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-header-bg-color: var(--bg-secondary) !important;
  --el-table-row-hover-bg-color: var(--bg-hover) !important;
  --el-table-border-color: var(--border-color) !important;
  --el-table-text-color: var(--text-primary) !important;
  --el-table-header-text-color: var(--text-secondary) !important;
}

.checklist-table :deep(.el-table__cell) {
  background-color: transparent !important;
}

.checklist-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.checklist-checkbox {
  flex-shrink: 0;
}

.content-text {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.content-text.completed {
  color: var(--text-muted);
  text-decoration: line-through;
}

.node-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.time-text {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .my-checklists-page {
    padding: var(--space-4);
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-input {
    width: 100%;
  }

  .spacer {
    display: none;
  }
}
</style>
