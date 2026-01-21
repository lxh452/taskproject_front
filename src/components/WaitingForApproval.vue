<template>
  <div class="waiting-for-approval">
    <div class="waiting-container">
      <!-- 头部图标 -->
      <div class="waiting-icon">
        <el-icon :size="80" color="#409eff">
          <Clock />
        </el-icon>
      </div>
      
      <!-- 标题 -->
      <h2 class="waiting-title">等待审批中</h2>
      
      <!-- 描述 -->
      <p class="waiting-desc">
        您的加入申请已提交，请耐心等待管理员审批
      </p>
      
      <!-- 申请信息 -->
      <div class="application-info">
        <div class="info-item">
          <span class="label">申请时间:</span>
          <span class="value">{{ formatApplicationTime }}</span>
        </div>
        <div class="info-item" v-if="companyName">
          <span class="label">申请公司:</span>
          <span class="value">{{ companyName }}</span>
        </div>
      </div>
      
      <!-- 轮询组件 -->
      <JoinCompanyPolling
        :auto-start="true"
        :interval="5000"
        :timeout="1800000"
        @approved="handleApproved"
        @rejected="handleRejected"
        @timeout="handleTimeout"
        @error="handleError"
      />
      
      <!-- 提示信息 -->
      <div class="tips">
        <el-alert
          title="温馨提示"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <ul class="tips-list">
              <li>系统每5秒自动检查一次审批状态</li>
              <li>审批通过后将自动跳转到首页</li>
              <li>如果长时间未审批，您可以联系管理员</li>
              <li>您可以关闭此页面，稍后再来查看</li>
            </ul>
          </template>
        </el-alert>
      </div>
      
      <!-- 操作按钮 -->
      <div class="actions">
        <el-button @click="handleBack">返回</el-button>
        <el-button type="primary" @click="handleContactAdmin">联系管理员</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Clock } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import JoinCompanyPolling from './JoinCompanyPolling.vue';

interface Props {
  /** 申请提交时间 */
  applicationTime?: string | Date;
  /** 公司名称 */
  companyName?: string;
}

const props = defineProps<Props>();
const router = useRouter();

const applicationTime = ref<Date>(
  props.applicationTime ? new Date(props.applicationTime) : new Date()
);

const formatApplicationTime = computed(() => {
  return applicationTime.value.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
});

onMounted(() => {
  // 可以在这里添加页面加载时的逻辑
});

/**
 * 处理审批通过
 */
function handleApproved(employeeInfo: any) {
  console.log('审批通过:', employeeInfo);
  // JoinCompanyPolling 组件会自动处理跳转
}

/**
 * 处理审批拒绝
 */
function handleRejected(reason: string) {
  console.log('审批拒绝:', reason);
  
  ElMessageBox.alert(
    reason || '您的加入申请被拒绝，请联系管理员了解详情',
    '审批结果',
    {
      confirmButtonText: '我知道了',
      type: 'error',
      callback: () => {
        router.push('/org/companies');
      },
    }
  );
}

/**
 * 处理超时
 */
function handleTimeout() {
  ElMessageBox.confirm(
    '审批等待时间过长，您可以选择继续等待或稍后再来查看',
    '等待超时',
    {
      confirmButtonText: '继续等待',
      cancelButtonText: '稍后再来',
      type: 'warning',
    }
  ).then(() => {
    // 用户选择继续等待，刷新页面重新开始轮询
    window.location.reload();
  }).catch(() => {
    // 用户选择稍后再来，返回公司列表
    router.push('/org/companies');
  });
}

/**
 * 处理错误
 */
function handleError(error: Error) {
  console.error('轮询错误:', error);
  ElMessage.error('检查审批状态时出错，请稍后重试');
}

/**
 * 返回
 */
function handleBack() {
  ElMessageBox.confirm(
    '返回后将停止自动检查审批状态，您需要手动刷新查看结果',
    '确认返回',
    {
      confirmButtonText: '确定返回',
      cancelButtonText: '继续等待',
      type: 'warning',
    }
  ).then(() => {
    router.push('/org/companies');
  }).catch(() => {
    // 用户取消，继续等待
  });
}

/**
 * 联系管理员
 */
function handleContactAdmin() {
  ElMessageBox.alert(
    '请通过以下方式联系管理员：\n\n' +
    '1. 查看公司联系方式\n' +
    '2. 发送邮件说明情况\n' +
    '3. 等待管理员处理',
    '联系管理员',
    {
      confirmButtonText: '我知道了',
      type: 'info',
    }
  );
}
</script>

<style scoped>
.waiting-for-approval {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  padding: var(--spacing-xl);
}

.waiting-container {
  max-width: 600px;
  width: 100%;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3xl);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.waiting-icon {
  margin-bottom: var(--spacing-xl);
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

.waiting-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.waiting-desc {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-2xl) 0;
  line-height: var(--line-height-relaxed);
}

.application-info {
  background: var(--bg-hover);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.info-item:not(:last-child) {
  border-bottom: 1px solid var(--border-light);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-md);
}

.info-item .label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.info-item .value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.tips {
  margin: var(--spacing-2xl) 0;
  text-align: left;
}

.tips-list {
  margin: 0;
  padding-left: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.tips-list li {
  margin-bottom: var(--spacing-xs);
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-2xl);
}

.actions .el-button {
  min-width: 120px;
}

/* 响应式 */
@media (max-width: 768px) {
  .waiting-for-approval {
    padding: var(--spacing-lg);
  }
  
  .waiting-container {
    padding: var(--spacing-2xl) var(--spacing-lg);
  }
  
  .waiting-icon .el-icon {
    font-size: 60px !important;
  }
  
  .waiting-title {
    font-size: var(--font-size-2xl);
  }
  
  .actions {
    flex-direction: column;
  }
  
  .actions .el-button {
    width: 100%;
  }
}
</style>
