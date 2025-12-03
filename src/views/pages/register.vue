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
                <el-form-item prop="password">
                    <el-input
                        type="password"
                        placeholder="密码"
                        v-model="param.password"
                        @keyup.enter="submitForm(register)"
                    >
                        <template #prepend>
                            <el-icon>
                                <Lock />
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
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Register } from '@/types/user';
import { apiRegister } from '@/api';
import { User, Message, Lock, UserFilled } from '@element-plus/icons-vue';

const router = useRouter();
const param = reactive<Register>({
    username: '',
    password: '',
    email: '',
    realName: '',
});
const loading = ref(false);

const rules: FormRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
    ],
    realName: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
    ],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
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
                    ElMessage.success('注册成功，请登录');
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
        } else {
            return false;
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
    color: #111827;
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: 3px;
    text-transform: uppercase;
}

.login-subtitle {
    font-size: 11px;
    color: #9ca3af;
    letter-spacing: 6px;
    text-transform: uppercase;
    font-weight: 500;
}

.login-form :deep(.el-input__wrapper) {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    box-shadow: none;
    transition: all 0.2s;
    border-radius: 8px;
}

.login-form :deep(.el-input__wrapper.is-focus) {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    background-color: #fff;
}

.login-form :deep(.el-input__inner) {
    color: #111827;
    height: 44px;
}

.login-form :deep(.el-input-group__prepend) {
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-right: none;
    box-shadow: none;
    color: #6b7280;
}

.login-btn {
    width: 100%;
    height: 46px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: #ffffff;
    border: none;
    transition: all 0.3s;
    letter-spacing: 3px;
    position: relative;
    overflow: hidden;
}

.login-btn:hover {
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(220, 38, 38, 0.2);
}

.login-text {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 24px;
    font-size: 13px;
    color: #6b7280;
}

.register-link {
    color: #dc2626;
    cursor: pointer;
    margin-left: 5px;
    transition: color 0.3s;
    font-weight: 600;
}

.register-link:hover {
    color: #b91c1c;
    text-decoration: underline;
}
</style>