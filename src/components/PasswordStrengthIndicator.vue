<template>
  <div v-if="password" class="password-strength-indicator">
    <div class="strength-bar-container">
      <div class="strength-bar" :class="strengthClass" :style="{ width: `${strengthPercentage}%` }"></div>
    </div>
    <div class="strength-info">
      <span class="strength-label" :class="strengthClass">
        密码强度: {{ strengthText }}
      </span>
      <span class="strength-score">{{ score }}/100</span>
    </div>
    <div class="strength-checks">
      <div class="check-item" :class="{ 'check-satisfied': checks.hasMinLength }">
        <el-icon><Check v-if="checks.hasMinLength" /><Close v-else /></el-icon>
        <span>长度足够 (≥8位)</span>
      </div>
      <div class="check-item" :class="{ 'check-satisfied': checks.hasNumber }">
        <el-icon><Check v-if="checks.hasNumber" /><Close v-else /></el-icon>
        <span>包含数字</span>
      </div>
      <div class="check-item" :class="{ 'check-satisfied': checks.hasMixedCase }">
        <el-icon><Check v-if="checks.hasMixedCase" /><Close v-else /></el-icon>
        <span>包含大小写字母</span>
      </div>
      <div class="check-item" :class="{ 'check-satisfied': checks.hasSpecialChar }">
        <el-icon><Check v-if="checks.hasSpecialChar" /><Close v-else /></el-icon>
        <span>包含特殊字符</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Check, Close } from '@element-plus/icons-vue';
import { calculatePasswordStrength } from '@/utils/validation';
import type { PasswordStrengthLevel } from '@/utils/validation';

interface Props {
  password: string;
}

const props = defineProps<Props>();

// 计算密码强度
const strengthResult = computed(() => {
  return calculatePasswordStrength(props.password);
});

const strength = computed(() => strengthResult.value.strength);
const score = computed(() => strengthResult.value.score);
const checks = computed(() => strengthResult.value.checks);

// 强度文本
const strengthText = computed(() => {
  const textMap: Record<PasswordStrengthLevel, string> = {
    weak: '弱',
    medium: '中',
    strong: '强',
  };
  return textMap[strength.value];
});

// 强度样式类
const strengthClass = computed(() => {
  return `strength-${strength.value}`;
});

// 强度百分比
const strengthPercentage = computed(() => {
  return Math.min(score.value, 100);
});
</script>

<style scoped>
.password-strength-indicator {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.strength-bar-container {
  width: 100%;
  height: 6px;
  background-color: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.strength-bar {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.strength-bar.strength-weak {
  background-color: #ef4444;
}

.strength-bar.strength-medium {
  background-color: #f59e0b;
}

.strength-bar.strength-strong {
  background-color: #10b981;
}

.strength-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
}

.strength-label {
  font-weight: 600;
}

.strength-label.strength-weak {
  color: #ef4444;
}

.strength-label.strength-medium {
  color: #f59e0b;
}

.strength-label.strength-strong {
  color: #10b981;
}

.strength-score {
  color: var(--text-muted);
  font-size: 12px;
}

.strength-checks {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  transition: color 0.2s;
}

.check-item.check-satisfied {
  color: #10b981;
}

.check-item .el-icon {
  font-size: 14px;
}

/* 深色模式适配 */
html.dark-mode .password-strength-indicator {
  background-color: rgba(30, 41, 59, 0.5);
}

/* 响应式 */
@media (max-width: 480px) {
  .strength-checks {
    grid-template-columns: 1fr;
  }
}
</style>
