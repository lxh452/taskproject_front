<template>
  <div class="my-attachments-page">
    <div class="page-header">
      <h1 class="page-title">我的附件</h1>
      <p class="page-subtitle">查看和管理我上传的所有附件</p>
    </div>

    <div class="filters-bar">
      <el-input 
        v-model="filters.keyword" 
        placeholder="搜索文件名" 
        clearable 
        class="filter-input"
        :prefix-icon="Search"
      />
      <el-select v-model="filters.fileType" placeholder="文件类型" clearable class="filter-select">
        <el-option label="图片" value="image" />
        <el-option label="文档" value="document" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
    </div>

    <div class="attachments-grid" v-loading="loading">
      <div 
        v-for="file in filteredAttachments" 
        :key="file.fileId" 
        class="attachment-card"
      >
        <div class="file-preview">
          <el-image
            v-if="isImage(file.fileType)"
            :src="getFileUrl(file.fileUrl)"
            fit="cover"
            class="preview-image"
            :preview-src-list="[getFileUrl(file.fileUrl)]"
          />
          <div v-else class="preview-icon">
            <el-icon :size="48"><Document /></el-icon>
          </div>
        </div>
        
        <div class="file-info">
          <div class="file-name" :title="file.fileName">{{ file.fileName }}</div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
            <span class="file-date">{{ formatDate(file.uploadTime) }}</span>
          </div>
          <div class="file-task">
            <el-tag size="small">{{ file.taskName || '未关联任务' }}</el-tag>
          </div>
        </div>
        
        <div class="file-actions">
          <el-button type="primary" size="small" :icon="View" @click="previewFile(file)">
            预览
          </el-button>
          <el-button type="primary" size="small" :icon="Download" @click="downloadFile(file)">
            下载
          </el-button>
        </div>
      </div>

      <el-empty v-if="filteredAttachments.length === 0 && !loading" description="暂无附件">
        <template #description>
          <p style="color: var(--text-secondary); margin-bottom: var(--space-3);">
            您还没有上传任何附件
          </p>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Document, View, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getMyAttachments } from '@/api';
import { getFileUrl } from '@/utils/fileUrl';

const router = useRouter();

const loading = ref(false);
const attachments = ref<any[]>([]);

const filters = ref({
  keyword: '',
  fileType: null as string | null,
});

const filteredAttachments = computed(() => {
  const { keyword, fileType } = filters.value;
  return attachments.value.filter((file) => {
    const matchKeyword = !keyword || file.fileName.toLowerCase().includes(keyword.toLowerCase());
    const matchType = !fileType || getFileCategory(file.fileType) === fileType;
    return matchKeyword && matchType;
  });
});

function getFileCategory(fileType: string): string {
  if (!fileType) return 'other';
  const type = fileType.toLowerCase();
  if (type.includes('image')) return 'image';
  if (type.includes('pdf') || type.includes('doc') || type.includes('xls')) return 'document';
  return 'other';
}

function isImage(fileType: string): boolean {
  if (!fileType) return false;
  return fileType.toLowerCase().includes('image');
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

function resetFilters() {
  filters.value = {
    keyword: '',
    fileType: null,
  };
}

function previewFile(file: any) {
  if (!file.fileId) return;
  router.push({
    path: `/file/preview/${file.fileId}`,
    query: { fileName: file.fileName }
  });
}

async function downloadFile(file: any) {
  if (!file.fileId && !file.fileUrl) return;
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      ElMessage.warning('请先登录');
      return;
    }
    const url = getFileUrl(file.fileUrl, file.fileId);
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      ElMessage.error('下载文件失败');
      return;
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = file.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  } catch (error) {
    console.error('下载文件失败:', error);
    ElMessage.error('下载文件失败');
  }
}

async function loadAttachments() {
  loading.value = true;
  try {
    const resp = await getMyAttachments({ page: 1, pageSize: 1000 });
    console.log('[MyAttachments] API响应:', resp);
    
    if (resp.data.code === 200 && resp.data.data) {
      const list = resp.data.data.list || [];
      attachments.value = list.map((item: any) => ({
        fileId: item.fileId,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        fileSize: item.fileSize,
        fileType: item.fileType,
        uploadTime: item.uploadTime,
        taskName: item.relatedName || '未关联任务',
        module: item.module,
        category: item.category
      }));
      console.log('[MyAttachments] 附件加载成功:', attachments.value.length, '个');
    } else {
      console.warn('[MyAttachments] 接口返回错误:', resp.data.msg);
      attachments.value = [];
    }
  } catch (error: any) {
    console.error('[MyAttachments] 加载附件失败:', error);
    ElMessage.error('加载附件失败');
    attachments.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadAttachments();
});
</script>

<style scoped>
.my-attachments-page {
  padding: var(--space-6);
  background: var(--bg-page);
  min-height: calc(100vh - var(--header-height));
}

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

.filters-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.filter-input {
  width: 300px;
}

.filter-select {
  width: 140px;
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.attachment-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  border: 1px solid var(--border-color);
  cursor: pointer;
}

.attachment-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.file-preview {
  width: 100%;
  height: 180px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.preview-icon {
  color: var(--text-muted);
}

.file-info {
  padding: var(--space-4);
}

.file-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.file-task {
  margin-top: var(--space-2);
}

.file-actions {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

@media (max-width: 768px) {
  .my-attachments-page {
    padding: var(--space-4);
  }

  .attachments-grid {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-direction: column;
  }

  .filter-input {
    width: 100%;
  }
}
</style>
