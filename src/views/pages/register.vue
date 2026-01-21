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
            <el-form :model="param" :rules="rules" ref="register" size="large" class="login-form">
                <el-form-item prop="username">
                    <el-input v-model="param.username" placeholder="用户名">
                        <template #prepend>
                            <el-icon>
                                <User />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="realName">
                    <el-input v-model="param.realName" placeholder="真实姓名（用于任务协作）">
                        <template #prepend>
                            <el-icon>
                                <UserFilled />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="email">
                    <el-input v-model="param.email" placeholder="邮箱">
                        <template #prepend>
                            <el-icon>
                                <Message />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="verificationCode">
                    <div class="code-input-wrapper">
                        <el-input v-model="param.verificationCode" placeholder="邮箱验证码" maxlength="6">
                            <template #prepend>
                                <el-icon>
                                    <Key />
                                </el-icon>
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
                
                <!-- 邀请码输入（可选） -->
                <el-form-item>
                    <el-collapse v-model="showInviteCodeSection" class="invite-collapse">
                        <el-collapse-item name="invite" title="有邀请码？点击输入（可选）">
                            <InviteCodeInput
                                v-model="inviteCode"
                                :auto-validate="true"
                                :show-preview="true"
                                :show-qr-scanner="true"
                                @validated="handleInviteCodeValidated"
                                @error="handleInviteCodeError"
                            />
                        </el-collapse-item>
                    </el-collapse>
                </el-form-item>
                
                <el-form-item prop="password">
                    <el-input
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="密码"
                        v-model="param.password"
                        @keyup.enter="submitForm(register)"
                    >
                        <template #prepend>
                            <el-icon>
                                <Lock />
                            </el-icon>
                        </template>
                        <template #suffix>
                            <el-icon class="password-toggle" @click="showPassword = !showPassword">
                                <View v-if="showPassword" />
                                <Hide v-else />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-button class="login-btn" type="primary" size="large" @click="submitForm(register)" :loading="loading">
                    注册账号
                </el-button>
                <div class="login-text">
                    已有账号，<span class="register-link" @click="$router.push('/login')">立即登录</span>
                </div>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Register } from '@/types/user';
import { apiRegister, sendVerificationCode as sendCode, applyJoinCompany } from '@/api';
import { User, Message, Lock, UserFilled, Key, View, Hide } from '@element-plus/icons-vue';
import InviteCodeInput from '@/components/InviteCodeInput.vue';
import type { InviteCodeInfo } from '@/types/company';
import { extractInviteCodeFromURL } from '@/utils/validation';

const router = useRouter();
const param = reactive<Register & { verificationCode: string }>({
    username: '',
    password: '',
    email: '',
    realName: '',
    verificationCode: '',
});
const loading = ref(false);
const codeSending = ref(false);
const codeCountdown = ref(0);
const showPassword = ref(false);
let countdownTimer: number | null = null;

// 邀请码相关
const inviteCode = ref('');
const validatedCompanyInfo = ref<InviteCodeInfo | null>(null);
const showInviteCodeSection = ref<string[]>([]);

onMounted(() => {
    // 从URL参数提取邀请码
    const urlCode = extractInviteCodeFromURL(window.location.href);
    if (urlCode) {
        inviteCode.value = urlCode;
        showInviteCodeSection.value = ['invite']; // 自动展开邀请码区域
        ElMessage.success('已自动填充邀请码');
    }
});

function handleInviteCodeValidated(companyInfo: InviteCodeInfo | null) {
    validatedCompanyInfo.value = companyInfo;
}

function handleInviteCodeError(error: string) {
    validatedCompanyInfo.value = null;
}

// 发送验证码
const sendVerificationCode = async () => {
    // 先验证邮箱
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
            // 开始倒计时
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

// 密码强度验证器
const validatePassword = (rule: any, value: string, callback: any) => {
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
    // 检查是否包含数字
    if (!/\d/.test(value)) {
        callback(new Error('密码必须包含数字'));
        return;
    }
    // 检查是否包含字母
    if (!/[a-zA-Z]/.test(value)) {
        callback(new Error('密码必须包含字母'));
        return;
    }
    // 检查是否包含特殊字符（可选，但推荐）
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        callback(new Error('密码必须包含特殊字符(!@#$%^&*等)'));
        return;
    }
    callback();
};

// 邮箱验证器
const validateEmail = (rule: any, value: string, callback: any) => {
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
};

const rules: FormRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度3-20位', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' },
    ],
    realName: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度2-20位', trigger: 'blur' },
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { validator: validatePassword, trigger: 'blur' },
    ],
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
const register = ref<FormInstance>();
const submitForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    formEl.validate(async (valid: boolean) => {
        if (valid) {
            loading.value = true;
            try {
                const res = await apiRegister(param);
                if (res.data.code === 200) {
                    ElMessage.success('注册成功');
                    
                    // 如果有邀请码，自动提交加入公司申请
                    if (inviteCode.value && validatedCompanyInfo.value) {
                        try {
                            const joinRes = await applyJoinCompany({ inviteCode: inviteCode.value });
                            if (joinRes.data.code === 200) {
                                ElMessage.success('已自动提交加入公司申请，请登录后等待审批');
                            }
                        } catch (error) {
                            console.error('自动加入公司失败:', error);
                            // 不影响注册流程，只是提示
                            ElMessage.warning('注册成功，但加入公司申请失败，请登录后手动加入');
                        }
                    }
                    
                    // 跳转到登录页
                    router.push('/login');
                } else {
                    ElMessage.error(res.data.msg || '注册失败');
                }
            } catch (error: any) {
                console.error('注册错误:', error);
                ElMessage.error(error.response?.data?.msg || '注册失败，请稍后重试');
            } finally {
                loading.value = false;
            }
        }
    });
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
    margin-bottom: 36px;
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

.invite-collapse {
    width: 100%;
    border: none;
    background: transparent;
}

.invite-collapse :deep(.el-collapse-item__header) {
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 500;
    padding: 0;
    height: auto;
    line-height: 1.5;
}

.invite-collapse :deep(.el-collapse-item__wrap) {
    background: transparent;
    border: none;
}

.invite-collapse :deep(.el-collapse-item__content) {
    padding: 16px 0 0 0;
}
</style>