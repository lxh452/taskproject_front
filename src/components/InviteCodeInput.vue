<template>
  <div class="invite-code-input">
    <div class="input-wrapper">
      <el-input
        v-model="localCode"
        placeholder="请输入邀请码"
        :maxlength="12"
        clearable
        @input="handleInput"
        @paste="handlePaste"
      />
      
      <div v-if="validationError" class="error-message">
        <el-text type="danger" size="small">
          <el-icon><CircleClose /></el-icon>
          {{ validationError }}
        </el-text>
      </div>
      
      <div v-if="isValidating" class="validating-message">
        <el-text type="info" size="small">
          <el-icon class="is-loading"><Loading /></el-icon>
          正在验证邀请码...
        </el-text>
      </div>
    </div>
    
    <!-- 公司信息预览 -->
    <transition name="el-fade-in">
      <div v-if="showPreview && companyInfo" class="company-preview">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon color="#67c23a"><SuccessFilled /></el-icon>
              <span>邀请码有效</span>
            </div>
          </template>
          <div class="company-info">
            <div class="info-item">
              <span class="label">公司名称:</span>
              <span class="value">{{ companyInfo.companyName }}</span>
            </div>
            <div class="info-item">
              <span class="label">公司类型:</span>
              <span class="value">{{ companyInfo.companyType }}</span>
            </div>
            <div class="info-item">
              <span class="label">业务范围:</span>
              <span class="value">{{ companyInfo.companyBusiness }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </transition>
    

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { CircleClose, Loading, SuccessFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  validateInviteCode,
  sanitizeInviteCode,
  extractInviteCodeFromURL
} from '@/utils/validation';
import type { InviteCodeInfo } from '@/types/company';
import { parseInviteCode } from '@/api/index';

interface Props {
  modelValue: string;
  autoValidate?: boolean;
  showPreview?: boolean;
  showQRScanner?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'validated', companyInfo: InviteCodeInfo | null): void;
  (e: 'error', error: string): void;
  (e: 'qr-scanned', inviteCode: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  autoValidate: true,
  showPreview: true,
  showQRScanner: true,
});

const emit = defineEmits<Emits>();

const localCode = ref('');
const validationError = ref('');
const isValidating = ref(false);
const companyInfo = ref<InviteCodeInfo | null>(null);

watch(() => props.modelValue, (newVal) => {
  localCode.value = newVal;
});

watch(localCode, (newVal) => {
  emit('update:modelValue', newVal);
  
  if (props.autoValidate && newVal) {
    validateCode();
  } else if (!newVal) {
    validationError.value = '';
    companyInfo.value = null;
  }
});

onMounted(() => {
  // 从URL参数提取邀请码
  const urlCode = extractInviteCodeFromURL(window.location.href);
  if (urlCode) {
    localCode.value = urlCode;
    ElMessage.success('已自动填充邀请码');
  }
});

function handleInput(value: string) {
  // 自动清理和转换
  localCode.value = sanitizeInviteCode(value);
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault();
  const pastedText = event.clipboardData?.getData('text') || '';
  localCode.value = sanitizeInviteCode(pastedText);
}

async function validateCode() {
  if (!localCode.value) {
    validationError.value = '';
    companyInfo.value = null;
    return;
  }
  
  // 客户端格式验证
  const validation = validateInviteCode(localCode.value);
  if (!validation.valid) {
    validationError.value = validation.error || '邀请码格式错误';
    companyInfo.value = null;
    emit('error', validationError.value);
    return;
  }
  
  // 服务器验证
  isValidating.value = true;
  validationError.value = '';
  
  try {
    const res = await parseInviteCode({ inviteCode: localCode.value });
    
    if (res.data.code === 200 && res.data.data) {
      companyInfo.value = res.data.data;
      emit('validated', companyInfo.value);
    } else {
      validationError.value = res.data.msg || '邀请码无效';
      companyInfo.value = null;
      emit('error', validationError.value);
    }
  } catch (error: any) {
    validationError.value = '验证失败,请稍后重试';
    companyInfo.value = null;
    emit('error', validationError.value);
  } finally {
    isValidating.value = false;
  }
}

function clearCode() {
  localCode.value = '';
  validationError.value = '';
  companyInfo.value = null;
}

defineExpose({
  validateCode,
  clearCode,
});
</script>

<style scoped>
.invite-code-input {
  width: 100%;
}

.input-wrapper {
  margin-bottom: 16px;
}

.error-message,
.validating-message {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.company-preview {
  margin-top: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.company-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  min-width: 80px;
  color: #909399;
  font-size: 14px;
}

.info-item .value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}
</style>
