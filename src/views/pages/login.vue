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
                <div class="login-title">TASK MANAGEMENT</div>
                <div class="login-subtitle">任务 · 协作 · 效率</div>
            </div>
            <el-form :model="param" :rules="rules" ref="login" size="large" class="login-form">
                <el-form-item prop="username">
                    <el-input v-model="param.username" placeholder="用户名">
                        <template #prepend>
                            <el-icon>
                                <User />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input
                        type="password"
                        placeholder="密码"
                        v-model="param.password"
                        @keyup.enter="submitForm(login)"
                    >
                        <template #prepend>
                            <el-icon>
                                <Lock />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <div class="pwd-tips">
                    <el-checkbox class="pwd-checkbox" v-model="checked" label="记住密码" />
                    <el-link class="forget-pwd" @click="$router.push('/forgot-password')">忘记密码</el-link>
                </div>
                <el-button class="login-btn" type="primary" size="large" @click="submitForm(login)">
                    <span class="btn-text">登录系统</span>
                </el-button>
                <div class="login-text">
                    没有账号？<span class="register-link" @click="$router.push('/register')">立即注册</span>
                </div>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useTabsStore } from '@/store/tabs';
import { usePermissStore } from '@/store/permiss';
import { useUserStore } from '@/store/user';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { apiLogin } from '@/api';
import { getMyEmployee, employeeRoles } from '@/api';
import { User, Lock } from '@element-plus/icons-vue';

interface LoginInfo {
    username: string;
    password: string;
}

const lgStr = localStorage.getItem('login-param');
const defParam = lgStr ? JSON.parse(lgStr) : null;
const checked = ref(lgStr ? true : false);

const router = useRouter();
const param = reactive<LoginInfo>({
    username: defParam ? defParam.username : '',
    password: defParam ? defParam.password : '',
});

const rules: FormRules = {
    username: [
        {
            required: true,
            message: '请输入用户名',
            trigger: 'blur',
        },
        { min: 3, max: 20, message: '用户名长度3-20位', trigger: 'blur' },
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 8, max: 32, message: '密码长度8-32位', trigger: 'blur' },
    ],
};
const permiss = usePermissStore();
const userStore = useUserStore();
const login = ref<FormInstance>();
const submitForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    formEl.validate(async (valid: boolean) => {
        if (!valid) {
            return false;
        }
        try {
            const res = await apiLogin({ username: param.username, password: param.password });
            
            if (res.data.code !== 200) {
                console.error('登录失败:', res.data);
                ElMessage.error(res.data.msg || '登录失败');
                return;
            }
            
            const loginData = res.data?.data;
            const token = loginData?.token as string | undefined;
            
            if (!token) {
                ElMessage.error('登录失败：未获取到令牌');
                return;
            }
            
            localStorage.setItem('authToken', token);
            
            const userInfo = {
                userId: loginData.userId || loginData.userID,
                username: loginData.username || param.username,
                realName: loginData.realName || loginData.real_name,
            };
            userStore.setUserInfo(userInfo);
            
            // 检查用户是否已加入公司
            const hasJoinedCompany = loginData.hasJoinedCompany || false;
            
            if (!hasJoinedCompany) {
                // 用户未加入公司，跳转到加入/创建公司页面
                ElMessage.success('登录成功，请先加入或创建公司');
                localStorage.setItem('vuems_name', param.username);
                router.push('/join-company');
                return;
            }
            
            // 已加入公司，继续获取员工信息
            try {
                const me = await getMyEmployee();
                const emp = me.data?.data || me.data;
                const empId = (emp && (emp.id || emp.Id || emp.employeeId)) as string | undefined;
                const companyId = emp && (emp.companyId || emp.CompanyId);
                
                if (empId) {
                    userStore.setUserInfo({ employeeId: empId, companyId });
                    const er = await employeeRoles({ employeeId: empId });
                    const list = er.data?.data?.list || er.data?.list || [];
                    
                    const permsSet = new Set<number>();
                    list.forEach((r: any) => {
                        const p = r.permissions || r.Permissions || '';
                        if (!p) return;
                        try {
                            const arr = JSON.parse(p);
                            if (Array.isArray(arr)) {
                                arr.forEach((x: any) => {
                                    const permCode = typeof x === 'number' ? x : parseInt(String(x), 10);
                                    if (!isNaN(permCode) && permCode > 0) {
                                        permsSet.add(permCode);
                                    }
                                });
                            }
                        } catch (parseError) {
                            const parts = String(p).split(',');
                            parts.forEach((part: string) => {
                                const trimmed = part.trim();
                                if (trimmed) {
                                    const permCode = parseInt(trimmed, 10);
                                    if (!isNaN(permCode) && permCode > 0) {
                                        permsSet.add(permCode);
                                    }
                                }
                            });
                        }
                    });
                    
                    const permsArray = Array.from(permsSet);
                    if (permsArray.length > 0) {
                        permiss.applyPermissions(permsArray);
                    } else {
                        const keys = permiss.defaultList[param.username == 'admin' ? 'admin' : 'user'];
                        permiss.handleSet(keys);
                    }
                    
                    router.push('/dashboard').catch((err) => {
                        console.error('路由跳转失败:', err);
                        window.location.href = '/';
                    });
                } else {
                    router.push('/join-company');
                }
            } catch (e) {
                console.error('获取员工信息失败:', e);
                router.push('/join-company');
            }

            ElMessage.success('登录成功');
            localStorage.setItem('vuems_name', param.username);
            
            if (checked.value) {
                localStorage.setItem('login-param', JSON.stringify(param));
            } else {
                localStorage.removeItem('login-param');
            }
        } catch (e: any) {
            console.error('登录错误:', e);
            ElMessage.error(e.response?.data?.msg || e.message || '账号或密码错误');
        }
    });
};

const tabs = useTabsStore();
tabs.clearTabs();
</script>

<style scoped>
.login-bg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
    background: #f1f5f9;
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
    font-size: 25vw;
    font-weight: 900;
    font-family: 'Inter', 'Arial Black', sans-serif;
    color: transparent;
    -webkit-text-stroke: 1px rgba(99, 102, 241, 0.08);
    letter-spacing: -0.02em;
    line-height: 0.85;
}

.login-container {
    width: 400px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    padding: 40px 36px;
    box-sizing: border-box;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    position: relative;
    z-index: 1;
}

.login-header {
    margin-bottom: 32px;
    text-align: center;
}

.login-title {
    font-size: 20px;
    color: #1f2937;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: 1px;
}

.login-subtitle {
    font-size: 12px;
    color: #9ca3af;
    letter-spacing: 3px;
}

.login-form :deep(.el-input__wrapper) {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    box-shadow: none;
    transition: all 0.15s;
    border-radius: 8px;
}

.login-form :deep(.el-input__wrapper:hover) {
    border-color: #d1d5db;
}

.login-form :deep(.el-input__wrapper.is-focus) {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    background-color: #fff;
}

.login-form :deep(.el-input__inner) {
    color: #1f2937;
    height: 44px;
    font-size: 14px;
}

.login-form :deep(.el-input-group__prepend) {
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-right: none;
    box-shadow: none;
    color: #6b7280;
    border-radius: 8px 0 0 8px;
}

.pwd-tips {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    margin: 0 0 24px;
}

.pwd-checkbox { height: auto; }

.login-form :deep(.el-checkbox__label) {
    color: #6b7280;
    font-size: 13px;
}

.login-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: #4f46e5;
    border-color: #4f46e5;
}

.login-form :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
    color: #4f46e5;
}

.forget-pwd {
    color: #6b7280;
    font-size: 13px;
}

.forget-pwd:hover {
    color: #4f46e5;
}

.login-btn {
    width: 100%;
    height: 46px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    background: #4f46e5;
    color: #fff;
    border: none;
    transition: background 0.15s;
}

.login-btn:hover {
    background: #4338ca;
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
    color: #4f46e5;
    cursor: pointer;
    margin-left: 4px;
    font-weight: 500;
}

.register-link:hover {
    text-decoration: underline;
}

@media (max-width: 480px) {
    .login-container {
        width: 90%;
        padding: 32px 24px;
        margin: 20px;
    }
    
    .task-letter {
        font-size: 30vw;
    }
}
</style>