<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'import' ? '导入职位' : '导出职位'"
    width="560px"
    class="import-export-dialog"
    destroy-on-close
  >
    <!-- Import Mode -->
    <template v-if="mode === 'import'">
      <el-steps :active="importStep" finish-status="success" simple class="import-steps">
        <el-step title="下载模板" />
        <el-step title="上传文件" />
        <el-step title="预览确认" />
      </el-steps>

      <!-- Step 1: Download template -->
      <div class="step-content" v-show="importStep === 0">
        <div class="step-desc">
          <el-icon class="desc-icon"><Download /></el-icon>
          <div class="desc-text">
            <h4>下载导入模板</h4>
            <p>请先下载模板文件，按照模板格式填写职位数据后上传</p>
          </div>
        </div>
        <el-button type="primary" :icon="Download" @click="downloadTemplate">
          下载模板
        </el-button>
      </div>

      <!-- Step 2: Upload file -->
      <div class="step-content" v-show="importStep === 1">
        <el-upload
          ref="uploadRef"
          class="upload-area"
          drag
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls,.csv"
          :on-change="handleFileChange"
          :on-exceed="handleExceed"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">
            <span>将文件拖到此处，或</span>
            <em>点击上传</em>
          </div>
          <template #tip>
            <div class="upload-tip">支持 .xlsx, .xls, .csv 格式</div>
          </template>
        </el-upload>
      </div>

      <!-- Step 3: Preview -->
      <div class="step-content" v-show="importStep === 2">
        <div class="preview-summary">
          <div class="summary-item success">
            <el-icon><CircleCheck /></el-icon>
            <span>可导入: {{ previewData.valid }} 条</span>
          </div>
          <div class="summary-item error" v-if="previewData.invalid > 0">
            <el-icon><CircleClose /></el-icon>
            <span>错误: {{ previewData.invalid }} 条</span>
          </div>
        </div>

        <el-table :data="previewData.rows" max-height="300" size="small" class="preview-table">
          <el-table-column prop="positionName" label="职位名称" min-width="120" />
          <el-table-column prop="departmentName" label="部门" min-width="100" />
          <el-table-column prop="positionCode" label="编码" width="80" />
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
                {{ row.valid ? '有效' : '错误' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="error" label="错误信息" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="error-text" v-if="row.error">{{ row.error }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- Export Mode -->
    <template v-else>
      <el-form label-position="top" class="export-form">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportOptions.format">
            <el-radio-button value="xlsx">Excel (.xlsx)</el-radio-button>
            <el-radio-button value="csv">CSV (.csv)</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="导出范围">
          <el-radio-group v-model="exportOptions.scope">
            <el-radio value="all">全部职位 ({{ totalCount }})</el-radio>
            <el-radio value="filtered" :disabled="filteredCount === totalCount">
              筛选结果 ({{ filteredCount }})
            </el-radio>
            <el-radio value="selected" :disabled="selectedCount === 0">
              选中项 ({{ selectedCount }})
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="导出列">
          <el-checkbox-group v-model="exportOptions.columns" class="column-checkboxes">
            <el-checkbox
              v-for="col in availableColumns"
              :key="col.value"
              :value="col.value"
            >
              {{ col.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </template>

    <template #footer>
      <div class="dialog-footer">
        <template v-if="mode === 'import'">
          <el-button @click="handlePrevStep" v-if="importStep > 0">上一步</el-button>
          <el-button @click="visible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleNextStep"
            v-if="importStep < 2"
            :disabled="importStep === 1 && !uploadedFile"
          >
            下一步
          </el-button>
          <el-button
            type="primary"
            @click="handleImport"
            v-if="importStep === 2"
            :loading="importing"
            :disabled="previewData.valid === 0"
          >
            确认导入
          </el-button>
        </template>
        <template v-else>
          <el-button @click="visible = false">取消</el-button>
          <el-button
            type="primary"
            :icon="Download"
            @click="handleExport"
            :loading="exporting"
          >
            导出
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Download,
  UploadFilled,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue';
import type { UploadInstance, UploadFile, UploadRawFile } from 'element-plus';
import type { ExportOptions } from '../types';

interface Props {
  modelValue: boolean;
  mode: 'import' | 'export';
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'import', data: any[]): void;
  (e: 'export', options: ExportOptions): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// Import state
const uploadRef = ref<UploadInstance>();
const importStep = ref(0);
const uploadedFile = ref<UploadRawFile | null>(null);
const importing = ref(false);
const previewData = reactive({
  rows: [] as any[],
  valid: 0,
  invalid: 0,
});

// Export state
const exporting = ref(false);
const exportOptions = reactive<ExportOptions>({
  format: 'xlsx',
  scope: 'all',
  columns: ['positionName', 'departmentName', 'positionCode', 'positionLevel', 'isManagement', 'status'],
});

const availableColumns = [
  { value: 'positionName', label: '职位名称' },
  { value: 'departmentName', label: '所属部门' },
  { value: 'positionCode', label: '职位编码' },
  { value: 'positionLevel', label: '职位级别' },
  { value: 'isManagement', label: '岗位类型' },
  { value: 'status', label: '状态' },
  { value: 'salaryMin', label: '最低薪资' },
  { value: 'salaryMax', label: '最高薪资' },
  { value: 'headcountMax', label: '编制人数' },
  { value: 'skillRequirements', label: '技能要求' },
  { value: 'description', label: '职位描述' },
];

// Reset state when dialog opens
watch(visible, (isVisible) => {
  if (isVisible) {
    importStep.value = 0;
    uploadedFile.value = null;
    previewData.rows = [];
    previewData.valid = 0;
    previewData.invalid = 0;
  }
});

function downloadTemplate() {
  // Create template CSV content
  const headers = ['职位名称*', '部门名称*', '职位编码*', '职位级别', '岗位类型', '状态', '最低薪资', '最高薪资', '编制人数'];
  const example = ['前端开发工程师', '技术部', 'FE001', '5', '普通岗', '启用', '15', '25', '5'];

  const csvContent = [headers.join(','), example.join(',')].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = '职位导入模板.csv';
  link.click();

  URL.revokeObjectURL(url);
  ElMessage.success('模板下载成功');
  importStep.value = 1;
}

function handleFileChange(file: UploadFile) {
  uploadedFile.value = file.raw || null;
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件');
}

function handlePrevStep() {
  if (importStep.value > 0) {
    importStep.value--;
  }
}

function handleNextStep() {
  if (importStep.value === 1 && uploadedFile.value) {
    // Parse file and preview
    parseUploadedFile();
  } else {
    importStep.value++;
  }
}

async function parseUploadedFile() {
  if (!uploadedFile.value) return;

  // Simulate parsing - in real implementation, use xlsx library
  // For now, just show mock preview data
  previewData.rows = [
    { positionName: '前端开发工程师', departmentName: '技术部', positionCode: 'FE001', valid: true, error: '' },
    { positionName: '后端开发工程师', departmentName: '技术部', positionCode: 'BE001', valid: true, error: '' },
    { positionName: '', departmentName: '产品部', positionCode: 'PM001', valid: false, error: '职位名称不能为空' },
  ];
  previewData.valid = previewData.rows.filter(r => r.valid).length;
  previewData.invalid = previewData.rows.filter(r => !r.valid).length;

  importStep.value = 2;
}

async function handleImport() {
  importing.value = true;
  try {
    const validRows = previewData.rows.filter(r => r.valid);
    emit('import', validRows);
    ElMessage.success(`成功导入 ${validRows.length} 条数据`);
    visible.value = false;
  } catch (error) {
    ElMessage.error('导入失败');
  } finally {
    importing.value = false;
  }
}

async function handleExport() {
  if (exportOptions.columns.length === 0) {
    ElMessage.warning('请至少选择一列');
    return;
  }

  exporting.value = true;
  try {
    emit('export', { ...exportOptions });
    ElMessage.success('导出成功');
    visible.value = false;
  } catch (error) {
    ElMessage.error('导出失败');
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.import-export-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

/* Import steps */
.import-steps {
  margin-bottom: 24px;
}

.step-content {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.step-desc {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  text-align: left;
  max-width: 400px;
}

.desc-icon {
  font-size: 40px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.desc-text h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.desc-text p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Upload area */
.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 40px;
  border-radius: var(--radius-lg);
}

.upload-icon {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.upload-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.upload-text em {
  color: var(--color-primary);
  font-style: normal;
}

.upload-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* Preview */
.preview-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  width: 100%;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.summary-item.success {
  color: var(--color-success);
}

.summary-item.error {
  color: var(--color-danger);
}

.preview-table {
  width: 100%;
}

.error-text {
  color: var(--color-danger);
  font-size: 12px;
}

/* Export form */
.export-form {
  padding: 0;
}

.column-checkboxes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

/* Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
