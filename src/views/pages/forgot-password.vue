<template>
    <div class="forgot-bg">
        <div class="task-bg-text">
            <span class="task-letter">T</span>
            <span class="task-letter">A</span>
            <span class="task-letter">S</span>
            <span class="task-letter">K</span>
        </div>
        <div class="forgot-container">
            <div class="forgot-header">
                <div class="forgot-title">RESET PASSWORD</div>
                <div class="forgot-subtitle">重置密码 · 找回账号</div>
            </div>
            
            <!-- 步骤指示器 -->
            <div class="steps">
                <div class="step" :class="{ active: step >= 1, done: step > 1 }">
                    <span class="step-num">1</span>
                    <span class="step-text">验证邮箱</span>
                </div>
                <div class="step-line" :class="{ active: step > 1 }"></div>
                <div class="step" :class="{ active: step >= 2 }">
                    <span class="step-num">2</span>
                    <span class="step-text">设置新密码</span>
                </div>
            </div>

            <el-form :model="form" :rules="rules" ref="formRef" size="large" class="forgot-form">
                <!-- 步骤1：验证邮箱 -->
                <template v-if="step === 1">
                    <el-form-item prop="email">
                        <el-input v-model="form.email" placeholder="请输入注册邮箱">
                            <template #prepend>
                                <el-icon><Message /></el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item prop="verificationCode">
                        <div class="code-input-wrapper">
                            <el-input v-model="form.verificationCode" placeholder="邮箱验证码" maxlength="6">
                                <template #prepend>
                                    <el-icon><Key /></el-icon>
                                </template>
                            </el-input>
                            <el-button 
                                type="primary" 
                                :disabled="codeSending || codeCountdown > 0"
                                :loading="codeSending"
                                @click="sendCode"
                                class="send-code-btn"
                            >
                                {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
                            </el-button>
                        </div>
                    </el-form-item>
                    <el-button class="submit-btn" type="primary" size="large" @click="verifyCode" :loading="loading">
                        下一步
                    </el-button>
                </template>

                <!-- 步骤2：设置新密码 -->
                <template v-if="step === 2">
                    <el-form-item prop="newPassword">
                        <el-input
                            type="password"
                            placeholder="新密码"
                            v-model="form.newPassword"
                            show-password
                        >
                            <template #prepend>
                                <el-icon><Lock /></el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item prop="confirmPassword">
                        <el-input
                            type="password"
                            placeholder="确认新密码"
                            v-model="form.confirmPassword"
                            show-password
                            @keyup.enter="submitReset"
                        >
                            <template #prepend>
                                <el-icon><Lock /></el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <div class="password-tips">
                        <p>密码要求：</p>
                        <ul>
                            <li :class="{ valid: form.newPassword.length >= 8 }">至少8位字符</li>
                            <li :class="{ valid: /[a-z]/.test(form.newPassword) }">包含小写字母</li>
                            <li :class="{ valid: /[A-Z]/.test(form.newPassword) }">包含大写字母</li>
                            <li :class="{ valid: /\d/.test(form.newPassword) }">包含数字</li>
                        </ul>
                    </div>
                    <el-button class="submit-btn" type="primary" size="large" @click="submitReset" :loading="loading">
                        重置密码
                    </el-button>
                </template>

                <div class="forgot-text">
                    想起密码了？<span class="login-link" @click="$router.push('/login')">返回登录</span>
                </div>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { sendVerificationCode, resetPassword } from '@/api';
import { Message, Lock, Key } from '@element-plus/icons-vue';

const router = useRouter();
const formRef = ref<FormInstance>();
const step = ref(1);
const loading = ref(false);
const codeSending = ref(false);
const codeCountdown = ref(0);
let countdownTimer: number | null = null;

const form = reactive({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
});

// 验证确认密码
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
    if (!value) {
        callback(new Error('请确认新密码'));
        return;
    }
    if (value !== form.newPassword) {
        callback(new Error('两次输入的密码不一致'));
        return;
    }
    callback();
};

// 密码强度验证
const validateNewPassword = (rule: any, value: string, callback: any) => {
    if (!value) {
        callback(new Error('请输入新密码'));
        return;
    }
    if (value.length < 8) {
        callback(new Error('密码长度至少8位'));
        return;
    }
    if (value.length > 32) {
        callback(new Error('密码长度不能超过32位'));
        return;
    }
    if (!/\d/.test(value)) {
        callback(new Error('密码必须包含数字'));
        return;
    }
    if (!/[a-z]/.test(value)) {
        callback(new Error('密码必须包含小写字母'));
        return;
    }
    if (!/[A-Z]/.test(value)) {
        callback(new Error('密码必须包含大写字母'));
        return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        callback(new Error('密码必须包含特殊字符'));
        return;
    }
    callback();
};

const rules: FormRules = {
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
    ],
    verificationCode: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码为6位数字', trigger: 'blur' },
        { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' },
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { validator: validateNewPassword, trigger: 'blur' },
    ],
    confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' },
    ],
};

// 发送验证码
const sendCode = async () => {
    if (!form.email) {
        ElMessage.warning('请先输入邮箱');
        return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) {
        ElMessage.warning('请输入有效的邮箱地址');
        return;
    }
    
    codeSending.value = true;
    try {
        const res = await sendVerificationCode({ email: form.email, type: 'reset_password' });
        if (res.data.code === 200) {
            ElMessage.success('验证码已发送到您的邮箱');
            codeCountdown.value = 60;
            countdownTimer = window.setInterval(() => {
                if (codeCountdown.value > 0) {
                    codeCountdown.value--;
                } else {
                    if (countdownTimer) {
                        clearInterval(countdownTimer);
                        countdownTimer = null;
                    }
                }
            }, 1000);
        } else {
            ElMessage.error(res.data.msg || '发送验证码失败');
        }
    } catch (error: any) {
        ElMessage.error(error.response?.data?.msg || '发送验证码失败');
    } finally {
        codeSending.value = false;
    }
};

// 验证验证码（进入下一步）
const verifyCode = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validateField(['email', 'verificationCode'], (valid) => {
        if (valid) {
            step.value = 2;
        }
    });
};

// 提交重置密码
const submitReset = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true;
            try {
                const res = await resetPassword({
                    email: form.email,
                    verificationCode: form.verificationCode,
                    newPassword: form.newPassword,
                });
                if (res.data.code === 200) {
                    ElMessage.success('密码重置成功，请使用新密码登录');
                    router.push('/login');
                } else {
                    ElMessage.error(res.data.msg || '重置密码失败');
                }
            } catch (error: any) {
                ElMessage.error(error.response?.data?.msg || '重置密码失败');
            } finally {
                loading.value = false;
            }
        }
    });
};
</script>

<style scoped>
.forgot-bg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
    background: #f8f9fa;
    background-image: 
        linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    position: relative;
    overflow: hidden;
}

.task-bg-text {
    position: absolute;
    display: flex;
    gap: 2vw;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    pointer-events: none;
    user-select: none;
}

.task-letter {
    font-size: 28vw;
    font-weight: 900;
    font-family: 'Impact', 'Arial Black', sans-serif;
    color: transparent;
    -webkit-text-stroke: 2px rgba(220, 38, 38, 0.15);
    text-shadow: 
        0 0 80px rgba(220, 38, 38, 0.1),
        0 0 120px rgba(220, 38, 38, 0.05);
    letter-spacing: -0.02em;
    line-height: 0.85;
    animation: letterPulse 4s ease-in-out infinite;
}

.task-letter:nth-child(1) { animation-delay: 0s; }
.task-letter:nth-child(2) { animation-delay: 0.5s; }
.task-letter:nth-child(3) { animation-delay: 1s; }
.task-letter:nth-child(4) { animation-delay: 1.5s; }

@keyframes letterPulse {
    0%, 100% { 
        opacity: 0.6;
        transform: scale(1);
    }
    50% { 
        opacity: 1;
        transform: scale(1.02);
    }
}

.forgot-container {
    width: 420px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 0, 0, 0.05);
    padding: 48px 40px;
    box-sizing: border-box;
    box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.08),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    position: relative;
    z-index: 1;
    animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.forgot-header {
    margin-bottom: 24px;
    text-align: center;
}

.forgot-title {
    font-size: 20px;
    color: #111827;
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: 2px;
    text-transform: uppercase;
}

.forgot-subtitle {
    font-size: 11px;
    color: #9ca3af;
    letter-spacing: 4px;
    text-transform: uppercase;
    font-weight: 500;
}

/* 步骤指示器 */
.steps {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.step-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s;
}

.step.active .step-num {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
}

.step.done .step-num {
    background: #22c55e;
    color: white;
}

.step-text {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 500;
}

.step.active .step-text {
    color: #dc2626;
}

.step-line {
    width: 60px;
    height: 2px;
    background: #e5e7eb;
    margin: 0 16px;
    margin-bottom: 20px;
    transition: all 0.3s;
}

.step-line.active {
    background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
}

.forgot-form :deep(.el-input__wrapper) {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    box-shadow: none;
    transition: all 0.2s;
    border-radius: 8px;
}

.forgot-form :deep(.el-input__wrapper.is-focus) {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    background-color: #fff;
}

.forgot-form :deep(.el-input__inner) {
    color: #111827;
    height: 44px;
}

.forgot-form :deep(.el-input-group__prepend) {
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-right: none;
    box-shadow: none;
    color: #6b7280;
}

.code-input-wrapper {
    display: flex;
    gap: 10px;
    width: 100%;
}

.code-input-wrapper .el-input {
    flex: 1;
}

.send-code-btn {
    min-width: 110px;
    height: 44px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    border: none;
    color: #fff;
}

.send-code-btn:disabled {
    background: #e5e7eb;
    color: #9ca3af;
}

.send-code-btn:not(:disabled):hover {
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
}

.password-tips {
    background: #f9fafb;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 12px;
    color: #6b7280;
}

.password-tips p {
    margin: 0 0 8px;
    font-weight: 600;
    color: #374151;
}

.password-tips ul {
    margin: 0;
    padding-left: 16px;
}

.password-tips li {
    margin-bottom: 4px;
    transition: color 0.2s;
}

.password-tips li.valid {
    color: #22c55e;
}

.password-tips li.valid::marker {
    content: '✓ ';
}

.submit-btn {
    width: 100%;
    height: 46px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: #ffffff;
    border: none;
    transition: all 0.3s;
    letter-spacing: 2px;
    position: relative;
    overflow: hidden;
}

.submit-btn:hover {
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(220, 38, 38, 0.2);
}

.forgot-text {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 24px;
    font-size: 13px;
    color: #6b7280;
}

.login-link {
    color: #dc2626;
    cursor: pointer;
    margin-left: 5px;
    transition: color 0.3s;
    font-weight: 600;
}

.login-link:hover {
    color: #b91c1c;
    text-decoration: underline;
}
</style>

