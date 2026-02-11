<template>
    <div class="login-bg">
        <div class="task-bg-text">
            <span class="task-letter">T</span>
            <span class="task-letter">A</span>
            <span class="task-letter">S</span>
            <span class="task-letter">K</span>
        </div>
        <div class="login-container">
            <div class="login-header">
                <div class="login-title">REGISTER</div>
                <div class="login-subtitle">加入我们 · 开启高效工作</div>
            </div>

            <!-- Step Indicator -->
            <div class="step-indicator">
                <div 
                    v-for="(step, index) in steps" 
                    :key="index"
                    class="step-item"
                    :class="{ 
                        'active': currentStep === index, 
                        'completed': currentStep > index 
                    }"
                >
                    <div class="step-number">
                        <el-icon v-if="currentStep > index"><Check /></el-icon>
                        <span v-else>{{ index + 1 }}</span>
                    </div>
                    <div class="step-title">{{ step.title }}</div>
                </div>
                <div class="step-line">
                    <div class="step-progress" :style="{ width: stepProgress + '%' }"></div>
                </div>
            </div>

            <!-- Step 1: Basic Info -->
            <el-form 
                v-show="currentStep === 0" 
                :model="param" 
                :rules="step1Rules" 
                ref="step1Form" 
                size="large" 
                class="login-form step-form"
            >
                <el-form-item prop="username">
                    <el-input v-model="param.username" placeholder="用户名">
                        <template #prepend>
                            <el-icon><User /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="realName">
                    <el-input v-model="param.realName" placeholder="真实姓名（用于任务协作）">
                        <template #prepend>
                            <el-icon><UserFilled /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
            </el-form>

            <!-- Step 2: Email Verification -->
            <el-form 
                v-show="currentStep === 1" 
                :model="param" 
                :rules="step2Rules" 
                ref="step2Form" 
                size="large" 
                class="login-form step-form"
            >
                <el-form-item prop="email">
                    <el-input v-model="param.email" placeholder="邮箱">
                        <template #prepend>
                            <el-icon><Message /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="verificationCode">
                    <div class="code-input-wrapper">
                        <el-input v-model="param.verificationCode" placeholder="邮箱验证码" maxlength="6">
                            <template #prepend>
                                <el-icon><Key /></el-icon>
                            </template>
                        </el-input>
                        <el-button 
                            type="primary" 
                            :disabled="codeSending || codeCountdown > 0"
                            :loading="codeSending"
                            @click="sendVerificationCode"
                            class="send-code-btn"
                        >
                            {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
                        </el-button>
                    </div>
                </el-form-item>
            </el-form>

            <!-- Step 3: Security -->
            <el-form 
                v-show="currentStep === 2" 
                :model="param" 
                :rules="step3Rules" 
                ref="step3Form" 
                size="large" 
                class="login-form step-form"
            >
                <el-form-item prop="password">
                    <el-input
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="密码"
                        v-model="param.password"
                    >
                        <template #prepend>
                            <el-icon><Lock /></el-icon>
                        </template>
                        <template #suffix>
                            <el-icon class="password-toggle" @click="showPassword = !showPassword">
                                <View v-if="showPassword" />
                                <Hide v-else />
                            </el-icon>
                        </template>
                    </el-input>
                    <PasswordStrengthIndicator :password="param.password" />
                </el-form-item>
                <el-form-item prop="confirmPassword">
                    <el-input
                        :type="showConfirmPassword ? 'text' : 'password'"
                        placeholder="确认密码"
                        v-model="param.confirmPassword"
                    >
                        <template #prepend>
                            <el-icon><Lock /></el-icon>
                        </template>
                        <template #suffix>
                            <el-icon class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                                <View v-if="showConfirmPassword" />
                                <Hide v-else />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
            </el-form>

            <!-- Step 4: Invite Code -->
            <el-form 
                v-show="currentStep === 3" 
                :model="param" 
                ref="step4Form" 
                size="large" 
                class="login-form step-form"
            >
                <div class="invite-code-section">
                    <p class="invite-hint">输入邀请码可自动加入公司团队（可选）</p>
                    <InviteCodeInput
                        v-model="inviteCode"
                        :auto-validate="true"
                        :show-preview="true"
                        :show-qr-scanner="true"
                        @validated="handleInviteCodeValidated"
                        @error="handleInviteCodeError"
                    />
                </div>
            </el-form>

            <!-- Navigation Buttons -->
            <div class="step-navigation">
                <el-button 
                    v-if="currentStep > 0" 
                    class="nav-btn prev-btn" 
                    size="large" 
                    @click="prevStep"
                >
                    <el-icon><ArrowLeft /></el-icon>
                    上一步
                </el-button>
                <el-button 
                    v-if="currentStep < steps.length - 1" 
                    class="nav-btn next-btn" 
                    type="primary" 
                    size="large" 
                    @click="nextStep"
                >
                    下一步
                    <el-icon><ArrowRight /></el-icon>
                </el-button>
                <el-button 
                    v-else 
                    class="login-btn" 
                    type="primary" 
                    size="large" 
                    @click="submitRegistration" 
                    :loading="loading"
                >
                    完成注册
                </el-button>
            </div>

            <div class="login-text">
                已有账号，<span class="register-link" @click="$router.push('/login')">立即登录</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Register } from '@/types/user';
import { apiRegister, sendVerificationCode as sendCode, applyJoinCompany } from '@/api';
import { User, Message, Lock, UserFilled, Key, View, Hide, Check, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import InviteCodeInput from '@/components/InviteCodeInput.vue';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator.vue';
import type { InviteCodeInfo } from '@/types/company';
import { extractInviteCodeFromURL } from '@/utils/validation';
import { handleApiError } from '@/utils/errorHandler';

const router = useRouter();
const currentStep = ref(0);
const loading = ref(false);
const codeSending = ref(false);
const codeCountdown = ref(0);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
let countdownTimer: number | null = null;

// 步骤定义
const steps = [
    { title: '基本信息' },
    { title: '邮箱验证' },
    { title: '设置密码' },
    { title: '邀请码' }
];

// 计算进度条宽度
const stepProgress = computed(() => {
    return (currentStep.value / (steps.length - 1)) * 100;
});

// 表单数据
const param = reactive<Register & { verificationCode: string; confirmPassword: string }>({
    username: '',
    password: '',
    email: '',
    realName: '',
    verificationCode: '',
    confirmPassword: '',
});

// 邀请码相关
const inviteCode = ref('');
const validatedCompanyInfo = ref<InviteCodeInfo | null>(null);

onMounted(() => {
    // 从URL参数提取邀请码
    const urlCode = extractInviteCodeFromURL(window.location.href);
    if (urlCode) {
        inviteCode.value = urlCode;
        ElMessage.success('已自动填充邀请码');
    }
});

function handleInviteCodeValidated(companyInfo: InviteCodeInfo | null) {
    validatedCompanyInfo.value = companyInfo;
}

function handleInviteCodeError(error: string) {
    validatedCompanyInfo.value = null;
}

// 表单引用
const step1Form = ref<FormInstance>();
const step2Form = ref<FormInstance>();
const step3Form = ref<FormInstance>();
const step4Form = ref<FormInstance>();

// 步骤1验证规则
const step1Rules: FormRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度3-20位', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' },
    ],
    realName: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度2-20位', trigger: 'blur' },
    ],
};

// 步骤2验证规则
const step2Rules: FormRules = {
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { validator: validateEmail, trigger: 'blur' },
    ],
    verificationCode: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码为6位数字', trigger: 'blur' },
        { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' },
    ],
};

// 步骤3验证规则
const step3Rules: FormRules = {
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { validator: validatePassword, trigger: 'blur' },
    ],
    confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' },
    ],
};

// 邮箱验证器
function validateEmail(rule: any, value: string, callback: any) {
    if (!value) {
        callback(new Error('请输入邮箱'));
        return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
        callback(new Error('请输入有效的邮箱地址'));
        return;
    }
    callback();
}

// 密码强度验证器
function validatePassword(rule: any, value: string, callback: any) {
    if (!value) {
        callback(new Error('请输入密码'));
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
    if (!/[a-zA-Z]/.test(value)) {
        callback(new Error('密码必须包含字母'));
        return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        callback(new Error('密码必须包含特殊字符(!@#$%^&*等)'));
        return;
    }
    callback();
}

// 确认密码验证器
function validateConfirmPassword(rule: any, value: string, callback: any) {
    if (!value) {
        callback(new Error('请确认密码'));
        return;
    }
    if (value !== param.password) {
        callback(new Error('两次输入的密码不一致'));
        return;
    }
    callback();
}

// 发送验证码
const sendVerificationCode = async () => {
    if (!param.email) {
        ElMessage.warning('请先输入邮箱');
        return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(param.email)) {
        ElMessage.warning('请输入有效的邮箱地址');
        return;
    }
    
    codeSending.value = true;
    try {
        const res = await sendCode({ email: param.email, type: 'register' });
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
        console.error('发送验证码错误:', error);
        ElMessage.error(error.response?.data?.msg || '发送验证码失败');
    } finally {
        codeSending.value = false;
    }
};

// 下一步
const nextStep = async () => {
    let formRef: FormInstance | undefined;
    
    switch (currentStep.value) {
        case 0:
            formRef = step1Form.value;
            break;
        case 1:
            formRef = step2Form.value;
            break;
        case 2:
            formRef = step3Form.value;
            break;
        default:
            return;
    }

    if (!formRef) return;
    
    await formRef.validate((valid: boolean) => {
        if (valid) {
            currentStep.value++;
        }
    });
};

// 上一步
const prevStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
};

// 提交注册
const submitRegistration = async () => {
    loading.value = true;
    try {
        const res = await apiRegister(param);
        if (res.data.code === 200) {
            ElMessage.success('注册成功');
            
            if (inviteCode.value && validatedCompanyInfo.value) {
                try {
                    const joinRes = await applyJoinCompany({ inviteCode: inviteCode.value });
                    if (joinRes.data.code === 200) {
                        ElMessage.success('已自动提交加入公司申请，请登录后等待审批');
                    }
                } catch (error) {
                    console.error('自动加入公司失败:', error);
                    ElMessage.warning('注册成功，但加入公司申请失败，请登录后手动加入');
                }
            }
            
            router.push('/login');
        } else {
            ElMessage.error(res.data.msg || '注册失败');
        }
    } catch (error: any) {
        console.error('注册错误:', error);
        handleApiError(error, true);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.login-bg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
    background: var(--bg-secondary);
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
    -webkit-text-stroke: 2px rgba(59, 130, 246, 0.15);
    text-shadow: 
        0 0 80px rgba(59, 130, 246, 0.1),
        0 0 120px rgba(59, 130, 246, 0.05);
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

.login-container {
    width: 400px;
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

.login-header {
    margin-bottom: 32px;
    text-align: center;
}

.login-title {
    font-size: 22px;
    color: var(--text-primary);
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: 3px;
    text-transform: uppercase;
}

.login-subtitle {
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 6px;
    text-transform: uppercase;
    font-weight: 500;
}

/* Step Indicator Styles */
.step-indicator {
    display: flex;
    justify-content: space-between;
    margin-bottom: 32px;
    position: relative;
    padding: 0 8px;
}

.step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;
    flex: 1;
}

.step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    border: 2px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
    transition: all 0.3s ease;
    margin-bottom: 8px;
}

.step-item.active .step-number {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.15);
}

.step-item.completed .step-number {
    background: var(--color-success, #10b981);
    border-color: var(--color-success, #10b981);
    color: #fff;
}

.step-title {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
    transition: color 0.3s ease;
}

.step-item.active .step-title {
    color: var(--color-primary);
    font-weight: 600;
}

.step-item.completed .step-title {
    color: var(--color-success, #10b981);
}

.step-line {
    position: absolute;
    top: 16px;
    left: 40px;
    right: 40px;
    height: 2px;
    background: var(--border-color);
    z-index: 1;
}

.step-progress {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.4s ease;
    border-radius: 1px;
}

/* Form Styles */
.login-form :deep(.el-input__wrapper) {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    box-shadow: none;
    transition: all 0.2s;
    border-radius: 8px;
}

.login-form :deep(.el-input__wrapper.is-focus) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
    background-color: var(--bg-card);
}

.login-form :deep(.el-input__inner) {
    color: var(--text-primary);
    height: 44px;
}

.login-form :deep(.el-input__suffix) {
    cursor: pointer;
}

.password-toggle {
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.2s;
}

.password-toggle:hover {
    color: var(--color-primary);
}

.login-form :deep(.el-input-group__prepend) {
    background-color: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-right: none;
    box-shadow: none;
    color: var(--text-secondary);
}

/* Step Form Animation */
.step-form {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateX(10px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Navigation Buttons */
.step-navigation {
    display: flex;
    gap: 12px;
    margin-top: 24px;
}

.nav-btn {
    flex: 1;
    height: 46px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.3s;
    letter-spacing: 1px;
}

.prev-btn {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
}

.prev-btn:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-color: var(--text-muted);
}

.next-btn {
    background: var(--color-primary);
    color: #ffffff;
    border: none;
}

.next-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(var(--color-primary-rgb), 0.2);
}

.login-btn {
    width: 100%;
    height: 46px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    background: var(--color-primary);
    color: #ffffff;
    border: none;
    transition: all 0.3s;
    letter-spacing: 3px;
    position: relative;
    overflow: hidden;
}

.login-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(var(--color-primary-rgb), 0.2);
}

.login-text {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 24px;
    font-size: 13px;
    color: var(--text-secondary);
}

.register-link {
    color: var(--color-primary);
    cursor: pointer;
    margin-left: 5px;
    transition: color 0.3s;
    font-weight: 600;
}

.register-link:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
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
    background: var(--color-primary);
    border: none;
    color: #fff;
}

.send-code-btn:disabled {
    background: var(--bg-active);
    color: var(--text-muted);
}

.send-code-btn:not(:disabled):hover {
    background: var(--color-primary-hover);
}

/* Invite Code Section */
.invite-code-section {
    padding: 20px 0;
}

.invite-hint {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 16px;
    text-align: center;
}
</style>
