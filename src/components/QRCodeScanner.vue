<template>
  <el-dialog
    v-model="dialogVisible"
    title="扫描二维码"
    width="500px"
    :before-close="handleClose"
  >
    <div class="qr-scanner-container">
      <el-alert
        title="请使用外部扫码工具"
        type="info"
        description="请使用微信、支付宝等扫码工具扫描二维码，然后在打开的页面中输入邀请码"
        show-icon
        :closable="false"
      />
    </div>
    
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialogVisible = ref(false);

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal;
});

watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false);
  }
});

function handleClose() {
  dialogVisible.value = false;
}
</script>

<style scoped>
.qr-scanner-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>
