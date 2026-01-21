<template>
  <div v-if="isVisible" class="security-feedback" :class="feedbackClass">
    <div class="feedback-content">
      <el-icon class="feedback-icon">
        <WarningFilled v-if="isLocked || remainingAttempts < 3" />
        <InfoFilled v-else />
      </el-icon>
      <div class="feedback-text">
        <template v-if="isLocked">
          <span class="feedback-message">账户已锁定，请在 {{ lockTimeDisplay }} 后重试</span>
        </template>
        <template v-else>
          <span class="feedback-message">登录失败，还剩 {{ remainingAttempts }} 次尝试机会</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onUnmounted } from 'vue';
import { WarningFilled, InfoFilled } from '@element-plus/icons-vue';

interface Props {
  remainingAttempts: number;
  lockTimeMinutes: number;
  lockTimeSeconds: number;
  isLocked: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  remainingAttempts: 5,
  lockTimeMinutes: 0,
  lockTimeSeconds: 0,
  isLocked: false,
});

const emit = defineEmits<{
  unlock: [];
}>();

// 内部倒计时状态
const internalMinutes = ref(props.lockTimeMinutes);
const internalSeconds = ref(props.lockTimeSeconds);
let countdownTimer: number | null = null;

// 是否显示反馈
const isVisible = computed(() => {
  return props.isLocked || props.remainingAttempts < 5;
});

// 反馈样式类
const feedbackClass = computed(() => {
  if (props.isLocked) {
    return 'feedback-danger';
  } else if (props.remainingAttempts < 3) {
    return 'feedback-warning';
  } else {
    return 'feedback-normal';
  }
});

// 锁定时间显示
const lockTimeDisplay = computed(() => {
  if (internalMinutes.value > 0) {
    return `${internalMinutes.value}分${internalSeconds.value}秒`;
  } else {
    return `${internalSeconds.value}秒`;
  }
});

// 启动倒计时
function startCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  
  internalMinutes.value = props.lockTimeMinutes;
  internalSeconds.value = props.lockTimeSeconds;
  
  countdownTimer = window.setInterval(() => {
    if (internalSeconds.value > 0) {
      internalSeconds.value--;
    } else if (internalMinutes.value > 0) {
      internalMinutes.value--;
      internalSeconds.value = 59;
    } else {
      // 倒计时结束
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      emit('unlock');
    }
  }, 1000);
}

// 停止倒计时
function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

// 监听锁定状态变化
watch(() => props.isLocked, (newVal) => {
  if (newVal) {
    startCountdown();
  } else {
    stopCountdown();
  }
}, { immediate: true });

// 组件卸载时清理定时器
onUnmounted(() => {
  stopCountdown();
});
</script>

<style scoped>
.security-feedback {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-normal {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.feedback-warning {
  background-color: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.feedback-danger {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.feedback-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feedback-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.feedback-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.feedback-message {
  font-weight: 500;
}

/* 深色模式适配 */
html.dark-mode .feedback-normal {
  background-color: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
}

html.dark-mode .feedback-warning {
  background-color: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}

html.dark-mode .feedback-danger {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}
</style>
