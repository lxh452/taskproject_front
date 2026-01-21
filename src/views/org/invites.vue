<template>
  <div class="invites-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">邀请码管理</h1>
    </div>

    <!-- Generate Form -->
    <div class="generate-card">
      <h3 class="card-title">生成邀请码</h3>
      <el-form :model="form" label-width="120px" class="generate-form">
        <el-form-item label="有效期（天）">
          <el-input-number v-model="form.expireDays" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="最大使用次数">
          <el-input-number v-model="form.maxUses" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="generateInviteCode" :loading="generating">
            生成邀请码
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Invite Code List -->
    <div class="invite-list-card">
      <div class="list-header">
        <h3 class="card-title">邀请码列表</h3>
        <div class="filter-bar">
          <el-select v-model="statusFilter" placeholder="筛选状态" clearable style="width: 140px" @change="loadInviteCodes">
            <el-option label="全部" value="" />
            <el-option label="有效" value="active" />
            <el-option label="已过期" value="expired" />
            <el-option label="已用完" value="exhausted" />
          </el-select>
        </div>
      </div>

      <el-table :data="inviteList" v-loading="loading" class="invite-table" style="width: 100%">
        <el-table-column prop="code" label="邀请码" min-width="180" fixed>
          <template #default="{ row }">
            <el-text class="code-text" copyable>{{ row.code }}</el-text>
          </template>
        </el-table-column>
        
        <el-table-column label="使用情况" min-width="220">
          <template #default="{ row }">
            <div class="usage-info">
              <div class="usage-text">{{ row.usedCount }} / {{ row.maxUses }}</div>
              <el-progress 
                :percentage="getUsagePercentage(row)" 
                :color="getProgressColor(row)"
                :show-text="false"
                style="margin-top: 4px;"
              />
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)" size="small">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="有效期" min-width="200">
          <template #default="{ row }">
            <div class="date-info">
              <div>{{ formatDate(row.expireTime) }}</div>
              <div v-if="row.status === 1" class="remaining-days">
                剩余 {{ getRemainingDays(row.expireTime) }} 天
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="创建者" min-width="140">
          <template #default="{ row }">
            {{ row.creatorName || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" min-width="200">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" min-width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link type="primary" @click="showQRCode(row)" :icon="Grid">
                二维码
              </el-button>
              <el-button link type="primary" @click="copyInviteLink(row)" :icon="CopyDocument">
                复制链接
              </el-button>
              <el-button 
                v-if="row.status === 1" 
                link 
                type="danger" 
                @click="revokeInviteCode(row)"
                :icon="CircleClose"
              >
                撤销
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="inviteList.length === 0 && !loading" description="暂无邀请码">
        <template #description>
          <p style="color: var(--text-secondary); margin-bottom: var(--space-3);">
            点击上方"生成邀请码"按钮创建新的邀请码
          </p>
        </template>
      </el-empty>
    </div>

    <!-- QR Code Dialog -->
    <el-dialog
      v-model="qrDialogVisible"
      title="邀请码二维码"
      width="450px"
      center
    >
      <div class="qr-container">
        <div class="qr-code" ref="qrCodeRef"></div>
        <div class="invite-code-display">
          <p class="code-label">邀请码</p>
          <el-text class="code-value" copyable>{{ currentInviteCode }}</el-text>
        </div>
        <div class="invite-link-display">
          <p class="link-label">邀请链接</p>
          <el-text class="link-value" copyable>{{ currentInviteLink }}</el-text>
        </div>
        <el-alert
          title="提示"
          type="info"
          :closable="false"
          style="margin-top: var(--space-4);"
        >
          扫描二维码或复制链接分享给新成员加入公司
        </el-alert>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { generateInviteCode as generateInviteCodeAPI, parseInviteCode, getInviteCodeList, revokeInviteCode as revokeInviteCodeAPI } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CopyDocument, CircleClose, Grid } from '@element-plus/icons-vue';
import QRCode from 'qrcode';

// State
const loading = ref(false);
const generating = ref(false);
const inviteList = ref<any[]>([]);
const qrDialogVisible = ref(false);
const currentInviteCode = ref('');
const currentInviteLink = ref('');
const qrCodeRef = ref<HTMLElement | null>(null);
const statusFilter = ref('');

// Form
const form = ref({
  expireDays: 30,
  maxUses: 10,
});

// Methods
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getUsagePercentage(row: any): number {
  if (row.maxUses === 0) return 0;
  return Math.round((row.usedCount / row.maxUses) * 100);
}

function getProgressColor(row: any): string {
  const percentage = getUsagePercentage(row);
  if (percentage >= 90) return '#f56c6c';
  if (percentage >= 70) return '#e6a23c';
  return '#67c23a';
}

function getStatusType(row: any): string {
  const now = new Date().getTime();
  const expireTime = new Date(row.expireTime).getTime();
  
  if (now > expireTime) return 'info';
  if (row.maxUses > 0 && row.usedCount >= row.maxUses) return 'warning';
  return 'success';
}

function getStatusText(row: any): string {
  const now = new Date().getTime();
  const expireTime = new Date(row.expireTime).getTime();
  
  if (now > expireTime) return '已过期';
  if (row.maxUses > 0 && row.usedCount >= row.maxUses) return '已用完';
  return '有效';
}

function getRemainingDays(expireTime: string): number {
  const now = new Date().getTime();
  const expire = new Date(expireTime).getTime();
  const diff = expire - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

async function revokeInviteCode(row: any) {
  try {
    await ElMessageBox.confirm(
      '确定要撤销此邀请码吗？撤销后将无法使用。',
      '确认撤销',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const res = await revokeInviteCodeAPI({ inviteCode: row.code });
    if (res.data.code === 200) {
      ElMessage.success('撤销成功');
      await loadInviteCodes();
    } else {
      ElMessage.error(res.data.msg || '撤销失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('[Invites] 撤销邀请码失败:', error);
      ElMessage.error('撤销失败');
    }
  }
}

async function generateInviteCode() {
  if (form.value.expireDays < 1) {
    ElMessage.warning('有效期至少为1天');
    return;
  }
  if (form.value.maxUses < 1) {
    ElMessage.warning('最大使用次数至少为1次');
    return;
  }

  generating.value = true;
  try {
    const resp = await generateInviteCodeAPI({
      expireDays: form.value.expireDays,
      maxUses: form.value.maxUses,
    });

    console.log('[Invites] 生成邀请码API响应:', resp.data);

    if (resp.data.code === 200) {
      ElMessage.success('生成成功');
      // Reload the list to show the new invite code
      await loadInviteCodes();
    } else {
      ElMessage.error(resp.data.msg || '生成失败');
    }
  } catch (error: any) {
    console.error('[Invites] 生成邀请码失败:', error);
    ElMessage.error('生成邀请码失败');
  } finally {
    generating.value = false;
  }
}

async function loadInviteCodes() {
  loading.value = true;
  try {
    const res = await getInviteCodeList({ page: 1, pageSize: 100 });
    console.log('[Invites] 邀请码列表响应:', res);
    
    if (res.data.code === 200 && res.data.data) {
      const list = res.data.data.list || [];
      inviteList.value = list.map((item: any) => ({
        code: item.inviteCode,
        expireTime: item.expireAt,
        maxUses: item.maxUses || 0,
        usedCount: item.usedCount || 0,
        status: item.status === 'active' ? 1 : 0,
        createTime: item.createTime,
        creatorName: item.creatorName
      }));
      console.log('[Invites] 邀请码列表加载成功:', inviteList.value.length, '条');
    } else {
      console.warn('[Invites] 邀请码列表响应异常:', res.data);
      inviteList.value = [];
    }
  } catch (error) {
    console.error('[Invites] 加载邀请码列表失败:', error);
    ElMessage.error('加载邀请码列表失败');
    inviteList.value = [];
  } finally {
    loading.value = false;
  }
}

async function showQRCode(invite: any) {
  currentInviteCode.value = invite.code;
  currentInviteLink.value = `${window.location.origin}/#/join?inviteCode=${invite.code}`;
  qrDialogVisible.value = true;

  await nextTick();
  if (qrCodeRef.value) {
    qrCodeRef.value.innerHTML = '';
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, currentInviteLink.value, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1E3A5F',
          light: '#FFFFFF'
        }
      });
      qrCodeRef.value.appendChild(canvas);
    } catch (error) {
      console.error('生成二维码失败:', error);
      ElMessage.error('生成二维码失败');
    }
  }
}

function copyInviteLink(invite: any) {
  const link = `${window.location.origin}/#/join?inviteCode=${invite.code}`;
  navigator.clipboard.writeText(link).then(() => {
    ElMessage.success('链接已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
}

onMounted(() => {
  loadInviteCodes();
});
</script>

<style scoped>
.invites-page {
  padding: var(--space-6);
  background: var(--bg-page);
  min-height: calc(100vh - var(--header-height));
  max-width: 100%;
  margin: 0;
}

/* Header */
.page-header {
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

/* Cards */
.generate-card,
.invite-list-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-4);
  width: 100%;
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-4) 0;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-color);
}

/* Generate Form */
.generate-form {
  max-width: 100%;
}

/* Table */
.invite-table {
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-header-bg-color: var(--bg-secondary) !important;
  --el-table-row-hover-bg-color: var(--bg-hover) !important;
  --el-table-border-color: var(--border-color) !important;
  --el-table-text-color: var(--text-primary) !important;
  --el-table-header-text-color: var(--text-secondary) !important;
  width: 100%;
}

.invite-table :deep(.el-table__row) {
  cursor: default;
  transition: background-color var(--transition-fast);
}

.code-text {
  font-family: monospace;
  font-size: var(--font-size-sm);
}

/* List Header */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-color);
}

.filter-bar {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

/* Usage Info */
.usage-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.usage-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Date Info */
.date-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.remaining-days {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* QR Code Dialog */
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
}

.qr-code {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-4);
  background: white;
  border-radius: var(--radius-md);
}

.invite-code-display,
.invite-link-display {
  width: 100%;
  text-align: center;
}

.code-label,
.link-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-2) 0;
}

.code-value,
.link-value {
  font-family: monospace;
  font-size: var(--font-size-sm);
  word-break: break-all;
}

/* Responsive */
@media (max-width: 768px) {
  .invites-page {
    padding: var(--space-4);
  }

  .generate-form {
    max-width: 100%;
  }
}
</style>
