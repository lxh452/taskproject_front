<template>
  <div class="join-via-invite-page">
    <div class="join-container">
      <div class="join-header">
        <h1 class="join-title">加入公司</h1>
        <p class="join-subtitle">使用邀请码加入您的团队</p>
      </div>

      <div class="join-content">
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <InviteCodeInput
          v-model="inviteCode"
          :auto-validate="true"
          :show-preview="true"
          :show-qr-scanner="false"
          @validated="handleInviteCodeValidated"
          @error="handleInviteCodeError"
        />
      </div>

      <div class="join-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button
          type="primary"
          @click="submitJoinCompany"
          :loading="submitting"
          :disabled="!validatedCompanyInfo"
        >
          加入公司
        </el-button>
      </div>
    </div>

    <!-- 等待审批组件 -->
    <WaitingForApproval
      v-if="showWaitingApproval"
      :company-name="validatedCompanyInfo?.companyName || ''"
      @approved="handleApproved"
      @rejected="handleRejected"
      @timeout="handleTimeout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import InviteCodeInput from '@/components/InviteCodeInput.vue';
import WaitingForApproval from '@/components/WaitingForApproval.vue';
import type { InviteCodeInfo } from '@/types/company';
import { applyJoinCompany } from '@/api';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const inviteCode = ref('');
const validatedCompanyInfo = ref<InviteCodeInfo | null>(null);
const submitting = ref(false);
const errorMessage = ref('');
const showWaitingApproval = ref(false);

onMounted(async () => {
  // 检查登录状态
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    // 未登录，跳转到登录页面，保留邀请码参数
    const inviteCodeParam = route.query.inviteCode as string;
    const redirectUrl = inviteCodeParam 
      ? `/login?redirect=/join&inviteCode=${inviteCodeParam}`
      : '/login?redirect=/join';
    
    router.push(redirectUrl);
    return;
  }

  // 已登录，检查是否有公司
  if (userStore.companyId) {
    // 已有公司，跳转到控制台
    ElMessage.info('您已加入公司');
    router.push('/dashboard');
    return;
  }

  // 从URL参数提取邀请码
  const inviteCodeParam = route.query.inviteCode as string;
  if (inviteCodeParam) {
    inviteCode.value = inviteCodeParam;
  }
});

function handleInviteCodeValidated(companyInfo: InviteCodeInfo | null) {
  validatedCompanyInfo.value = companyInfo;
  errorMessage.value = '';
}

function handleInviteCodeError(error: string) {
  validatedCompanyInfo.value = null;
  errorMessage.value = error;
}

async function submitJoinCompany() {
  if (!inviteCode.value || !validatedCompanyInfo.value) {
    ElMessage.warning('请输入有效的邀请码');
    return;
  }

  submitting.value = true;
  try {
    const resp = await applyJoinCompany({ inviteCode: inviteCode.value });
    
    if (resp.data.code === 200) {
      ElMessage.success('加入公司申请已提交');
      // 显示等待审批页面
      showWaitingApproval.value = true;
    } else {
      ElMessage.error(resp.data.msg || '加入公司失败');
    }
  } catch (error: any) {
    ElMessage.error('加入公司失败: ' + (error.message || '未知错误'));
  } finally {
    submitting.value = false;
  }
}

function handleApproved() {
  ElMessage.success('审批通过，欢迎加入公司！');
  router.push('/dashboard');
}

function handleRejected() {
  ElMessage.error('申请被拒绝');
  showWaitingApproval.value = false;
}

function handleTimeout() {
  ElMessage.warning('审批超时，请联系管理员');
  showWaitingApproval.value = false;
}

function goBack() {
  router.back();
}
</script>

<style scoped>
.join-via-invite-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-page);
  padding: var(--spacing-xl);
}

.join-container {
  width: 100%;
  max-width: 520px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: 48px 40px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-light);
}

.join-header {
  text-align: center;
  margin-bottom: 32px;
}

.join-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.join-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
}

.join-content {
  margin-bottom: 32px;
}

.join-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

.join-actions .el-button {
  min-width: 100px;
}

@media (max-width: 768px) {
  .join-container {
    padding: 36px 28px;
  }
  
  .join-actions {
    flex-direction: column-reverse;
  }
  
  .join-actions .el-button {
    width: 100%;
  }
}
</style>
