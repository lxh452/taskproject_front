<template>
  <div class="waiting-approval-page">
    <div class="waiting-container">
      <div class="status-icon">
        <el-icon :size="80" color="#e6a23c"><Clock /></el-icon>
      </div>
      
      <h1 class="title">申请已提交</h1>
      
      <div class="company-info" v-if="companyName">
        <p class="label">申请加入公司</p>
        <p class="company-name">{{ companyName }}</p>
      </div>
      
      <div class="status-message">
        <p>您的加入申请已提交成功</p>
        <p>请耐心等待公司管理员审批</p>
      </div>
      
      <div class="tips">
        <el-alert
          title="温馨提示"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <ul class="tip-list">
              <li>审批通过后，系统会自动为您分配部门和职位</li>
              <li>您可以在「我的申请」中查看审批进度</li>
              <li>如有疑问，请联系公司管理员</li>
            </ul>
          </template>
        </el-alert>
      </div>
      
      <div class="actions">
        <el-button type="primary" @click="goToDashboard">
          进入工作台
        </el-button>
        <el-button @click="goToApplications">
          查看申请进度
        </el-button>
      </div>
    </div>
    
    <!-- 实时状态检查 -->
    <div v-if="checkingStatus" class="status-checking">
      <el-icon class="checking-icon" :size="24"><Loading /></el-icon>
      <span>正在检查审批状态...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Clock, Loading } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const companyName = ref('');
const checkingStatus = ref(false);
let checkTimer: number | null = null;

onMounted(async () => {
  // 获取公司名称
  companyName.value = route.query.companyName as string || '';
  
  // 刷新用户信息
  await userStore.getUserInfo();
  
  // 检查是否已有公司（审批已通过）
  if (userStore.companyId) {
    ElMessage.success('您已成功加入公司！');
    router.replace('/dashboard');
    return;
  }
  
  // 启动定时检查（每30秒检查一次）
  checkTimer = window.setInterval(checkApprovalStatus, 30000);
});

onUnmounted(() => {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
});

async function checkApprovalStatus() {
  checkingStatus.value = true;
  try {
    await userStore.getUserInfo();
    if (userStore.companyId) {
      ElMessage.success('审批通过！欢迎加入公司！');
      router.replace('/dashboard');
    }
  } finally {
    checkingStatus.value = false;
  }
}

function goToDashboard() {
  router.push('/dashboard');
}

function goToApplications() {
  router.push('/my-approvals');
}
</script>

<style scoped>
.waiting-approval-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-page);
  padding: 24px;
}

.waiting-container {
  width: 100%;
  max-width: 560px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: 48px 40px;
  box-shadow: var(--shadow-xl);
  text-align: center;
}

.status-icon {
  margin-bottom: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 24px 0;
}

.company-info {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.company-info .label {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.company-info .company-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.status-message {
  margin-bottom: 24px;
}

.status-message p {
  font-size: 16px;
  color: var(--text-primary);
  margin: 8px 0;
}

.tips {
  margin-bottom: 32px;
  text-align: left;
}

.tip-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.8;
}

.tip-list li {
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.status-checking {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-size: 14px;
  color: var(--text-secondary);
}

.checking-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
