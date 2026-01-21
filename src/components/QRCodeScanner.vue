<template>
  <el-dialog
    v-model="dialogVisible"
    title="扫描二维码"
    width="500px"
    :before-close="handleClose"
  >
    <div class="qr-scanner-container">
      <div v-if="!hasPermission" class="permission-warning">
        <el-alert
          title="需要摄像头权限"
          type="warning"
          description="请允许浏览器访问摄像头以扫描二维码"
          show-icon
        />
      </div>
      
      <div v-else-if="error" class="error-message">
        <el-alert
          :title="error"
          type="error"
          show-icon
        />
      </div>
      
      <div v-else class="scanner-wrapper">
        <video ref="videoRef" class="scanner-video" autoplay playsinline></video>
        <div class="scanner-overlay">
          <div class="scanner-frame"></div>
          <p class="scanner-hint">将二维码放入框内</p>
        </div>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { extractInviteCodeFromQR } from '@/utils/validation';
import jsQR from 'jsqr';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'scanned', inviteCode: string): void;
  (e: 'error', error: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialogVisible = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const hasPermission = ref(true);
const error = ref('');
const stream = ref<MediaStream | null>(null);
const scanInterval = ref<number | null>(null);

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal;
  if (newVal) {
    startScan();
  } else {
    stopScan();
  }
});

watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false);
    stopScan();
  }
});

async function startScan() {
  try {
    error.value = '';
    hasPermission.value = true;
    
    // 请求摄像头权限
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value;
      
      // 开始扫描
      scanInterval.value = window.setInterval(() => {
        scanQRCode();
      }, 300);
    }
  } catch (err: any) {
    hasPermission.value = false;
    error.value = '无法访问摄像头: ' + err.message;
    emit('error', error.value);
  }
}

function scanQRCode() {
  if (!videoRef.value) return;
  
  const video = videoRef.value;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) return;
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  if (canvas.width === 0 || canvas.height === 0) return;
  
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  
  if (code && code.data) {
    handleQRCodeDetected(code.data);
  }
}

function handleQRCodeDetected(qrData: string) {
  const inviteCode = extractInviteCodeFromQR(qrData);
  
  if (inviteCode) {
    ElMessage.success('扫描成功!');
    emit('scanned', inviteCode);
    handleClose();
  } else {
    error.value = '二维码中未找到有效的邀请码';
    emit('error', error.value);
  }
}

function stopScan() {
  if (scanInterval.value) {
    clearInterval(scanInterval.value);
    scanInterval.value = null;
  }
  
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop());
    stream.value = null;
  }
}

function handleClose() {
  stopScan();
  dialogVisible.value = false;
}

onUnmounted(() => {
  stopScan();
});
</script>

<style scoped>
.qr-scanner-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.permission-warning,
.error-message {
  width: 100%;
}

.scanner-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.scanner-frame {
  width: 250px;
  height: 250px;
  border: 3px solid #409eff;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

.scanner-hint {
  margin-top: 20px;
  color: white;
  font-size: 14px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
</style>
