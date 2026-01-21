<template>
  <div class="join-company-polling">
    <!-- 轮询状态指示器 -->
    <div v-if="isPolling" class="polling-status">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在检查审批状态...</span>
    </div>
    
    <!-- 审批通过提示 -->
    <transition name="el-fade-in">
      <div v-if="approvalStatus === 'approved'" class="approval-result success">
        <el-icon color="#67c23a"><SuccessFilled /></el-icon>
        <h3>审批通过！</h3>
        <p>欢迎加入 {{ companyName }}，正在跳转...</p>
      </div>
    </transition>
    
    <!-- 审批拒绝提示 -->
    <transition name="el-fade-in">
      <div v-if="approvalStatus === 'rejected'" class="approval-result error">
        <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
        <h3>审批被拒绝</h3>
        <p v-if="rejectReason" class="reject-reason">{{ rejectReason }}</p>
        <el-button type="primary" @click="handleRetry">重新申请</el-button>
      </div>
    </transition>
    
    <!-- 超时提示 -->
    <transition name="el-fade-in">
      <div v-if="isTimeout" class="approval-result warning">
        <el-icon color="#e6a23c"><WarningFilled /></el-icon>
        <h3>等待超时</h3>
        <p>审批等待时间过长，请稍后手动刷新查看结果</p>
        <el-button type="primary" @click="handleRefresh">刷新状态</el-button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Loading, SuccessFilled, CircleCloseFilled, WarningFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { createPollingManager } from '@/utils/polling';
import { getMyEmployee } from '@/api';
import { useUserStore } from '@/store/user';

interface Props {
  /** 是否自动开始轮询 */
  autoStart?: boolean;
  /** 轮询间隔（毫秒） */
  interval?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
}

interface Emits {
  (e: 'approved', employeeInfo: any): void;
  (e: 'rejected', reason: string): void;
  (e: 'timeout'): void;
  (e: 'error', error: Error): void;
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: true,
  interval: 5000, // 5秒
  timeout: 30 * 60 * 1000, // 30分钟
});

const emit = defineEmits<Emits>();
const router = useRouter();
const userStore = useUserStore();

const isPolling = ref(false);
const approvalStatus = ref<'pending' | 'approved' | 'rejected' | null>(null);
const rejectReason = ref('');
const companyName = ref('');
const isTimeout = ref(false);

let pollingManager = createPollingManager({
  interval: props.interval,
  timeout: props.timeout,
  immediate: true,
});

onMounted(() => {
  if (props.autoStart) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

/**
 * 开始轮询
 */
function startPolling() {
  if (isPolling.value) {
    return;
  }

  isPolling.value = true;
  isTimeout.value = false;
  approvalStatus.value = 'pending';

  pollingManager.start(
    checkApprovalStatus,
    (result) => {
      // 停止条件：审批通过或拒绝
      return result.status === 'approved' || result.status === 'rejected';
    },
    (error) => {
      console.error('轮询错误:', error);
      emit('error', error);
    },
    () => {
      // 超时处理
      isPolling.value = false;
      isTimeout.value = true;
      emit('timeout');
      ElMessage.warning('审批等待超时，请稍后手动刷新');
    }
  );
}

/**
 * 停止轮询
 */
function stopPolling() {
  pollingManager.stop();
  isPolling.value = false;
}

/**
 * 检查审批状态
 */
async function checkApprovalStatus(): Promise<{ status: string; data?: any }> {
  try {
    const res = await getMyEmployee();
    
    if (res.data.code === 200 && res.data.data) {
      const employeeData = res.data.data;
      
      // 检查审批状态
      // 假设后端返回的字段：approvalStatus: 'pending' | 'approved' | 'rejected'
      const status = employeeData.approvalStatus || employeeData.status;
      
      if (status === 'approved' || status === 1) {
        // 审批通过
        handleApproved(employeeData);
        return { status: 'approved', data: employeeData };
      } else if (status === 'rejected' || status === 2) {
        // 审批拒绝
        handleRejected(employeeData.rejectReason || '未提供拒绝原因');
        return { status: 'rejected', data: employeeData };
      }
    }
    
    // 仍在等待审批
    return { status: 'pending' };
  } catch (error) {
    console.error('检查审批状态失败:', error);
    throw error;
  }
}

/**
 * 处理审批通过
 */
function handleApproved(employeeInfo: any) {
  isPolling.value = false;
  approvalStatus.value = 'approved';
  companyName.value = employeeInfo.companyName || '公司';
  
  emit('approved', employeeInfo);
  ElMessage.success('审批通过，欢迎加入！');
  
  // 更新用户信息
  userStore.getUserInfo().then(() => {
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      router.push('/');
    }, 2000);
  });
}

/**
 * 处理审批拒绝
 */
function handleRejected(reason: string) {
  isPolling.value = false;
  approvalStatus.value = 'rejected';
  rejectReason.value = reason;
  
  emit('rejected', reason);
  ElMessage.error('审批被拒绝');
}

/**
 * 重新申请
 */
function handleRetry() {
  approvalStatus.value = null;
  rejectReason.value = '';
  router.push('/org/companies');
}

/**
 * 刷新状态
 */
function handleRefresh() {
  isTimeout.value = false;
  startPolling();
}

/**
 * 手动触发检查
 */
async function checkNow() {
  try {
    const result = await checkApprovalStatus();
    if (result.status === 'pending') {
      ElMessage.info('仍在等待审批');
    }
  } catch (error) {
    ElMessage.error('检查失败，请稍后重试');
  }
}

defineExpose({
  startPolling,
  stopPolling,
  checkNow,
});
</script>

<style scoped>
.join-company-polling {
  width: 100%;
}

.polling-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
}

.polling-status .el-icon {
  font-size: 20px;
  color: var(--color-primary);
}

.approval-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.approval-result .el-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.approval-result h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--text-primary);
}

.approval-result p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 20px 0;
}

.approval-result.success h3 {
  color: var(--color-success);
}

.approval-result.error h3 {
  color: var(--color-danger);
}

.approval-result.warning h3 {
  color: var(--color-warning);
}

.reject-reason {
  padding: 12px 16px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-danger);
  color: var(--text-primary);
  font-size: 13px;
  max-width: 400px;
}

/* 动画 */
.el-fade-in-enter-active,
.el-fade-in-leave-active {
  transition: opacity 0.3s;
}

.el-fade-in-enter-from,
.el-fade-in-leave-to {
  opacity: 0;
}
</style>
