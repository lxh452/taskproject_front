<template>
    <div class="profile-page">
        <!-- 个人信息卡片 -->
        <el-card class="profile-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <el-icon class="header-icon"><User /></el-icon>
                    <span>个人信息</span>
                </div>
            </template>
            
            <div class="profile-content">
                <!-- 头像区域 -->
                <div class="avatar-section">
                    <div class="avatar-wrapper">
                        <el-avatar 
                            :size="120" 
                            :src="userInfo.avatar || ''"
                            class="user-avatar"
                        >
                            {{ userInfo.realName?.[0] || 'U' }}
                        </el-avatar>
                        <el-upload
                            class="avatar-uploader"
                            action="#"
                            :show-file-list="false"
                            :before-upload="beforeAvatarUpload"
                            :http-request="uploadAvatarHandler"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                        >
                            <div class="upload-overlay">
                                <el-icon :size="24"><Camera /></el-icon>
                                <span>更换头像</span>
                            </div>
                        </el-upload>
                    </div>
                    <div class="avatar-tips">
                        支持 jpg、png、gif、webp 格式，大小不超过 5MB
                    </div>
                </div>

                <!-- 基本信息 -->
                <div class="info-section">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="用户名">
                            {{ userInfo.username || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="真实姓名">
                            {{ userInfo.realName || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="邮箱">
                            {{ userInfo.email || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="手机号">
                            {{ userInfo.phone || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="所属公司">
                            {{ employeeInfo.companyName || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="所属部门">
                            {{ employeeInfo.departmentName || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="职位">
                            {{ employeeInfo.positionName || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="入职日期">
                            {{ employeeInfo.hireDate || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="工作邮箱">
                            {{ employeeInfo.workEmail || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="工作电话">
                            {{ employeeInfo.workPhone || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="技能标签" :span="2">
                            <template v-if="employeeInfo.skills">
                                <el-tag 
                                    v-for="skill in employeeInfo.skills.split(',')" 
                                    :key="skill"
                                    size="small"
                                    style="margin-right: 8px; margin-bottom: 4px;"
                                >
                                    {{ skill.trim() }}
                                </el-tag>
                            </template>
                            <span v-else>-</span>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
        </el-card>

        <!-- 修改密码卡片 -->
        <el-card class="password-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <el-icon class="header-icon"><Lock /></el-icon>
                    <span>修改密码</span>
                </div>
            </template>

            <el-form 
                ref="passwordFormRef" 
                :model="passwordForm" 
                :rules="passwordRules"
                label-width="100px"
                style="max-width: 500px;"
            >
                <el-form-item label="当前密码" prop="oldPassword">
                    <el-input 
                        v-model="passwordForm.oldPassword" 
                        type="password" 
                        placeholder="请输入当前密码"
                        show-password
                    />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                    <el-input 
                        v-model="passwordForm.newPassword" 
                        type="password" 
                        placeholder="请输入新密码（至少6位）"
                        show-password
                    />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                    <el-input 
                        v-model="passwordForm.confirmPassword" 
                        type="password" 
                        placeholder="请再次输入新密码"
                        show-password
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
                        确认修改
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, type UploadProps, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock, Camera } from '@element-plus/icons-vue';
import { getMyEmployee, uploadAvatar } from '@/api';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

// 用户信息
const userInfo = ref<any>({
    username: '',
    realName: '',
    email: '',
    phone: '',
    avatar: '',
});

// 员工信息
const employeeInfo = ref<any>({
    companyName: '',
    departmentName: '',
    positionName: '',
    hireDate: '',
    workEmail: '',
    workPhone: '',
    skills: '',
});

// 密码表单
const passwordFormRef = ref<FormInstance>();
const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
});
const changingPassword = ref(false);

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
    if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
    } else {
        callback();
    }
};

const passwordRules: FormRules = {
    oldPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' },
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少6位', trigger: 'blur' },
    ],
    confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' },
    ],
};

// 加载用户信息
const loadUserInfo = async () => {
    try {
        const resp = await getMyEmployee();
        if (resp.data?.code === 200) {
            const data = resp.data?.data || {};
            userInfo.value = {
                username: userStore.username || localStorage.getItem('vuems_name') || '',
                realName: data.realName || '',
                email: data.email || '',
                phone: data.phone || '',
                avatar: data.avatar || '',
            };
            employeeInfo.value = {
                companyName: data.companyName || '',
                departmentName: data.departmentName || '',
                positionName: data.positionName || '',
                hireDate: data.hireDate?.split('T')[0] || '',
                workEmail: data.workEmail || '',
                workPhone: data.workPhone || '',
                skills: data.skills || '',
            };
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
};

// 上传头像前的验证
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error('只能上传 jpg/png/gif/webp 格式的图片!');
        return false;
    }
    if (rawFile.size / 1024 / 1024 > 5) {
        ElMessage.error('图片大小不能超过 5MB!');
        return false;
    }
    return true;
};

// 上传头像
const uploadAvatarHandler = async (options: any) => {
    const formData = new FormData();
    formData.append('avatar', options.file);

    try {
        const resp = await uploadAvatar(formData);
        if (resp.data?.avatarUrl) {
            userInfo.value.avatar = resp.data.avatarUrl;
            ElMessage.success('头像更新成功');
        } else if (resp.data?.code === 200 && resp.data?.data?.avatarUrl) {
            userInfo.value.avatar = resp.data.data.avatarUrl;
            ElMessage.success('头像更新成功');
        } else {
            ElMessage.error(resp.data?.msg || '头像更新失败');
        }
    } catch (error: any) {
        console.error('上传头像失败:', error);
        ElMessage.error('上传头像失败');
    }
};

// 修改密码
const handleChangePassword = async () => {
    if (!passwordFormRef.value) return;
    
    await passwordFormRef.value.validate(async (valid) => {
        if (!valid) return;
        
        changingPassword.value = true;
        try {
            ElMessage.warning('修改密码功能正在开发中');
        } catch (error: any) {
            console.error('修改密码失败:', error);
            ElMessage.error('修改密码失败');
        } finally {
            changingPassword.value = false;
        }
    });
};

onMounted(() => {
    loadUserInfo();
});
</script>

<style scoped>
.profile-page {
    padding: 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8ecf1 100%);
    min-height: calc(100vh - 120px);
}

.profile-card,
.password-card {
    border-radius: 16px;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
}

.profile-card :deep(.el-card__header),
.password-card :deep(.el-card__header) {
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border-bottom: 2px solid #e5e7eb;
    padding: 20px 24px;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
}

.header-icon {
    font-size: 20px;
    color: #2563eb;
}

.profile-content {
    display: flex;
    gap: 48px;
    padding: 24px;
}

.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.avatar-wrapper {
    position: relative;
    cursor: pointer;
}

.user-avatar {
    background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%);
    color: white;
    font-size: 48px;
    font-weight: 600;
    border: 4px solid #e5e7eb;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.avatar-uploader {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.upload-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: white;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: pointer;
}

.avatar-wrapper:hover .upload-overlay {
    opacity: 1;
}

.avatar-tips {
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
}

.info-section {
    flex: 1;
}

.info-section :deep(.el-descriptions__label) {
    font-weight: 600;
    color: #374151;
    background: #f9fafb;
}

.info-section :deep(.el-descriptions__content) {
    color: #1f2937;
}

.password-card :deep(.el-card__body) {
    padding: 24px;
}

@media (max-width: 768px) {
    .profile-content {
        flex-direction: column;
        align-items: center;
        gap: 24px;
    }
    
    .info-section {
        width: 100%;
    }
}
</style>

