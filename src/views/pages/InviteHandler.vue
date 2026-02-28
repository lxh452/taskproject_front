<template>
  <div class="invite-handler-page">
    <div class="loading-container" v-if="loading">
      <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
      <p class="loading-text">{{ loadingText }}</p>
    </div>

    <div class="error-container" v-else-if="errorMessage">
      <el-icon :size="64" color="#f56c6c"><CircleCloseFilled /></el-icon>
      <h3 class="error-title">处理失败</h3>
      <p class="error-text">{{ errorMessage }}</p>
      <el-button type="primary" @click="goToLogin">去登录</el-button>
    </div>

    <!-- 等待审批组件 -->
    <WaitingForApproval
      v-if="showWaitingApproval"
      :company-name="companyName"
      @approved="handleApproved"
      @rejected="handleRejected"
      @timeout="handleTimeout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading, CircleCloseFilled } from '@element-plus/icons-vue';
import WaitingForApproval from '@/components/WaitingForApproval.vue';
import { applyJoinCompany, parseInviteCode } from '@/api';

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const loadingText = ref('正在处理...');
const errorMessage = ref('');
const showWaitingApproval = ref(false);
const companyName = ref('');

onMounted(async () => {
  // 等待下一个 tick，确保路由参数已解析
  await nextTick();
  
  const inviteCode = route.query.inviteCode as string;
  console.log('[InviteHandler] 获取到的邀请码:', inviteCode);
  console.log('[InviteHandler] 当前路由:', route.path, route.query);

  if (!inviteCode) {
    errorMessage.value = '邀请码无效或缺失';
    loading.value = false;
    return;
  }

  // 验证邀请码有效性
  loadingText.value = '正在验证邀请码...';
  try {
    const parseRes = await parseInviteCode({ inviteCode });
    if (parseRes.data.code !== 200) {
      errorMessage.value = parseRes.data.msg || '邀请码无效或已过期';
      loading.value = false;
      return;
    }
    companyName.value = parseRes.data.data?.companyName || '';
  } catch (error: any) {
    errorMessage.value = error.response?.data?.msg || '验证邀请码失败';
    loading.value = false;
    return;
  }

  // 检查登录状态
  const token = localStorage.getItem('authToken');

  if (!token) {
    // 未登录，跳转到注册页面，携带邀请码
    // 注册完成后会自动申请加入
    router.replace({
      path: '/register',
      query: { inviteCode }
    });
    return;
  }

  // 已登录，直接申请加入
  loadingText.value = '正在申请加入公司...';
  try {
    const resp = await applyJoinCompany({ inviteCode });

    if (resp.data.code === 200) {
      loading.value = false;
      showWaitingApproval.value = true;
    } else {
      errorMessage.value = resp.data.msg || '申请加入失败';
      loading.value = false;
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.msg || '申请加入失败';
    loading.value = false;
  }
});

function handleApproved() {
  ElMessage.success('审批通过，欢迎加入公司！');
  router.push('/dashboard');
}

function handleRejected() {
  ElMessage.error('申请被拒绝');
  showWaitingApproval.value = false;
  errorMessage.value = '您的加入申请已被拒绝';
}

function handleTimeout() {
  ElMessage.warning('审批超时，请联系管理员');
  showWaitingApproval.value = false;
  errorMessage.value = '审批超时，请联系公司管理员';
}

function goToLogin() {
  const inviteCode = route.query.inviteCode as string;
  if (inviteCode) {
    router.push(`/login?redirect=/invite&inviteCode=${inviteCode}`);
  } else {
    router.push('/login');
  }
}

// 监听路由参数变化
watch(() => route.query.inviteCode, (newCode) => {
  if (newCode && !loading.value && !showWaitingApproval.value) {
    console.log('[InviteHandler] 检测到邀请码变化:', newCode);
    // 重新加载页面
    window.location.reload();
  }
});
</script>

<style scoped>
.invite-handler-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-page);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.loading-icon {
  animation: rotate 1s linear infinite;
  color: var(--primary-color);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: var(--text-secondary);
}

.error-title {
  margin-top: 24px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.error-text {
  margin-top: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 400px;
}
</style>
