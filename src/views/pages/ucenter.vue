<template>
    <div class="ucenter-page">
        <!-- 顶部英雄区域 -->
        <div class="hero-section">
            <div class="hero-bg"></div>
            <div class="hero-content">
                <div class="profile-card">
                    <div class="avatar-section">
                        <div class="avatar-wrapper" @click="activeName = 'avatar'">
                            <el-avatar :size="120" :src="userInfo.avatar || defaultAvatar" class="user-avatar" />
                            <div class="avatar-overlay">
                                <el-icon><Camera /></el-icon>
                            </div>
                </div>
                        <div class="status-badge" :class="{ online: true }">在线</div>
                    </div>
                    <div class="user-info">
                        <h1 class="user-name">{{ userInfo.realName || '用户' }}</h1>
                        <div class="user-meta">
                            <span class="meta-item" v-if="userInfo.positionName">
                                <el-icon><Briefcase /></el-icon>
                                {{ userInfo.positionName }}
                            </span>
                            <span class="meta-item" v-if="userInfo.departmentName">
                                <el-icon><OfficeBuilding /></el-icon>
                                {{ userInfo.departmentName }}
                            </span>
                            <span class="meta-item" v-if="userInfo.companyName">
                                <el-icon><Flag /></el-icon>
                                {{ userInfo.companyName }}
                            </span>
                        </div>
                        <div class="user-email" v-if="userInfo.email">
                            <el-icon><Message /></el-icon>
                            {{ userInfo.email }}
                        </div>
                    </div>
                </div>
                
                <!-- 统计卡片 -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <el-icon><Document /></el-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.totalTasks }}</div>
                            <div class="stat-label">总任务数</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                            <el-icon><CircleCheck /></el-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.completedTasks }}</div>
                            <div class="stat-label">已完成</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                            <el-icon><Loading /></el-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.inProgressTasks }}</div>
                            <div class="stat-label">进行中</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                            <el-icon><Clock /></el-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.totalHours }}h</div>
                            <div class="stat-label">工作时长</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 主要内容区 -->
        <div class="main-content">
            <el-card class="content-card" shadow="hover">
                <el-tabs v-model="activeName" class="settings-tabs">
                    <!-- 消息通知 -->
                    <el-tab-pane name="notifications" label="消息通知">
                        <template #label>
                            <span class="tab-label">
                                <el-icon><Bell /></el-icon>
                                消息通知
                            </span>
                        </template>
                        <div class="tab-content">
                            <div class="section-header">
                                <h3>通知设置</h3>
                                <p class="section-desc">管理您的消息和通知偏好</p>
                            </div>
                            <div class="settings-list">
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">任务提醒</div>
                                        <div class="setting-desc">接收任务截止日期和更新提醒</div>
                                    </div>
                                    <el-switch v-model="notificationSettings.taskReminder" />
                                </div>
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">评论通知</div>
                                        <div class="setting-desc">有人@您或回复您的评论时通知</div>
                                    </div>
                                    <el-switch v-model="notificationSettings.commentNotify" />
                                </div>
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">系统消息</div>
                                        <div class="setting-desc">接收系统更新和重要公告</div>
                                    </div>
                                    <el-switch v-model="notificationSettings.systemMessage" />
                                </div>
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">邮件通知</div>
                                        <div class="setting-desc">将重要通知发送到您的邮箱</div>
                                    </div>
                                    <el-switch v-model="notificationSettings.emailNotify" />
                                </div>
                            </div>
                        </div>
                    </el-tab-pane>

                    <!-- 头像设置 -->
                    <el-tab-pane name="avatar" label="我的头像">
                        <template #label>
                            <span class="tab-label">
                                <el-icon><User /></el-icon>
                                我的头像
                            </span>
                        </template>
                        <div class="tab-content">
                            <div class="section-header">
                                <h3>头像设置</h3>
                                <p class="section-desc">上传并裁剪您的个人头像</p>
                            </div>
                            <div class="avatar-editor">
                                <div class="crop-container" v-if="activeName === 'avatar'">
                            <vueCropper
                                ref="cropper"
                                :img="imgSrc"
                                :autoCrop="true"
                                :centerBox="true"
                                :full="true"
                                mode="contain"
                                        outputType="png"
                                    />
                                </div>
                                <div class="avatar-actions">
                                    <div class="upload-btn-wrapper">
                                        <el-button type="primary" :icon="Upload">
                                            选择图片
                                            <input 
                                                class="hidden-input" 
                                                type="file" 
                                                accept="image/*" 
                                                @change="setImage" 
                                            />
                                        </el-button>
                                    </div>
                                    <el-button 
                                        type="success" 
                                        :icon="Check"
                                        @click="saveAvatar" 
                                        :loading="uploading"
                                    >
                                        上传并保存
                                    </el-button>
                                </div>
                                <div class="avatar-tips">
                                    <el-icon><InfoFilled /></el-icon>
                                    <span>支持 JPG、PNG、GIF 格式，文件大小不超过 5MB</span>
                                </div>
                            </div>
                        </div>
                    </el-tab-pane>

                    <!-- 修改密码 -->
                    <el-tab-pane name="password" label="修改密码">
                        <template #label>
                            <span class="tab-label">
                                <el-icon><Lock /></el-icon>
                                修改密码
                            </span>
                        </template>
                        <div class="tab-content">
                            <div class="section-header">
                                <h3>账号安全</h3>
                                <p class="section-desc">定期修改密码可以提高账号安全性</p>
                            </div>
                            <el-form 
                                ref="passwordFormRef"
                                :model="passwordForm" 
                                :rules="passwordRules"
                                label-position="top" 
                                class="password-form"
                            >
                                <el-form-item label="当前密码" prop="oldPassword">
                                    <el-input 
                                        v-model="passwordForm.oldPassword" 
                                        type="password" 
                                        show-password
                                        placeholder="请输入当前密码"
                                    />
                            </el-form-item>
                                <el-form-item label="新密码" prop="newPassword">
                                    <el-input 
                                        v-model="passwordForm.newPassword" 
                                        type="password" 
                                        show-password
                                        placeholder="请输入新密码（至少6位）"
                                    />
                                    <div class="password-strength" v-if="passwordForm.newPassword">
                                        <div class="strength-bar">
                                            <div 
                                                class="strength-fill" 
                                                :style="{ width: passwordStrength.percentage + '%' }"
                                                :class="passwordStrength.level"
                                            ></div>
                                        </div>
                                        <span class="strength-text" :class="passwordStrength.level">
                                            {{ passwordStrength.text }}
                                        </span>
                                    </div>
                            </el-form-item>
                                <el-form-item label="确认新密码" prop="confirmPassword">
                                    <el-input 
                                        v-model="passwordForm.confirmPassword" 
                                        type="password" 
                                        show-password
                                        placeholder="请再次输入新密码"
                                    />
                            </el-form-item>
                            <el-form-item>
                                    <el-button 
                                        type="primary" 
                                        @click="submitPasswordChange"
                                        :loading="changingPassword"
                                    >
                                        修改密码
                                    </el-button>
                            </el-form-item>
                        </el-form>
                        </div>
                    </el-tab-pane>

                    <!-- 个人信息 -->
                    <el-tab-pane name="profile" label="个人信息">
                        <template #label>
                            <span class="tab-label">
                                <el-icon><UserFilled /></el-icon>
                                个人信息
                            </span>
                        </template>
                        <div class="tab-content">
                            <div class="section-header">
                                <h3>基本信息</h3>
                                <p class="section-desc">查看和管理您的个人资料</p>
                            </div>
                            <div class="profile-info-list">
                                <div class="info-row">
                                    <div class="info-label">用户名</div>
                                    <div class="info-value">{{ userInfo.username || '-' }}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">真实姓名</div>
                                    <div class="info-value">{{ userInfo.realName || '-' }}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">邮箱</div>
                                    <div class="info-value">{{ userInfo.email || '-' }}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">手机号</div>
                                    <div class="info-value">{{ userInfo.phone || '-' }}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">所属公司</div>
                                    <div class="info-value">{{ userInfo.companyName || '-' }}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">所属部门</div>
                                    <div class="info-value">{{ userInfo.departmentName || '-' }}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">职位</div>
                                    <div class="info-value">{{ userInfo.positionName || '-' }}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">入职日期</div>
                                    <div class="info-value">{{ formatDate(userInfo.hireDate) || '-' }}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">员工状态</div>
                                    <div class="info-value">
                                        <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'" size="small">
                                            {{ userInfo.status === 1 ? '在职' : '离职' }}
                                        </el-tag>
                                    </div>
                                </div>
                        </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts" name="ucenter">
import { reactive, ref, computed, onMounted } from 'vue';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import { 
    Camera, Bell, User, Lock, UserFilled, Upload, Check, InfoFilled,
    Briefcase, OfficeBuilding, Flag, Message, Document, CircleCheck, Loading, Clock
} from '@element-plus/icons-vue';
import { getMyEmployee, uploadAvatar, getMyTaskNodes } from '@/api';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import defaultAvatarImg from '@/assets/img/img.jpg';

const defaultAvatar = defaultAvatarImg;
const activeName = ref('notifications');

// 用户信息
const userInfo = ref<any>({});

// 统计数据
const stats = ref({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalHours: 0
});

// 通知设置
const notificationSettings = reactive({
    taskReminder: true,
    commentNotify: true,
    systemMessage: true,
    emailNotify: false
});

// 头像相关
const imgSrc = ref(defaultAvatarImg);
const cropper = ref<any>();
const uploading = ref(false);

// 密码相关
const passwordFormRef = ref<FormInstance>();
const changingPassword = ref(false);
const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
    if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
    } else {
        callback();
    }
};

const passwordRules: FormRules = {
    oldPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少6位', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
    ]
};

// 密码强度
const passwordStrength = computed(() => {
    const pwd = passwordForm.newPassword;
    if (!pwd) return { percentage: 0, level: '', text: '' };
    
    let score = 0;
    if (pwd.length >= 6) score += 20;
    if (pwd.length >= 10) score += 20;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;
    
    if (score <= 30) return { percentage: 33, level: 'weak', text: '弱' };
    if (score <= 60) return { percentage: 66, level: 'medium', text: '中' };
    return { percentage: 100, level: 'strong', text: '强' };
});

// 加载用户信息
async function loadUserInfo() {
    try {
        const resp = await getMyEmployee();
        if (resp.data?.code === 200) {
            const data = resp.data?.data || {};
            userInfo.value = data;
            if (data.avatar) {
                imgSrc.value = data.avatar;
            }
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
}

// 加载统计数据
async function loadStats() {
    try {
        const resp = await getMyTaskNodes({ page: 1, pageSize: 200 });
        if (resp.data?.code === 200) {
            const list = resp.data?.data?.list || [];
            stats.value.totalTasks = list.length;
            stats.value.completedTasks = list.filter((t: any) => t.status === 2).length;
            stats.value.inProgressTasks = list.filter((t: any) => t.status === 1).length;
            // 简单估算工作时长
            stats.value.totalHours = Math.round(list.reduce((sum: number, t: any) => sum + (t.actualHours || 0), 0));
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 设置头像图片
function setImage(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
        ElMessage.warning('请选择图片文件');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        ElMessage.warning('图片大小不能超过5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event: any) => {
        imgSrc.value = event.target.result;
        cropper.value?.replace(event.target.result);
    };
    reader.readAsDataURL(file);
}

// 保存头像
async function saveAvatar() {
    if (!cropper.value) {
        ElMessage.warning('请先选择图片');
        return;
    }

    uploading.value = true;
    try {
        const canvas = cropper.value.getCroppedCanvas();
        if (!canvas) {
            ElMessage.warning('请先选择并裁剪图片');
            uploading.value = false;
            return;
        }

        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) {
                ElMessage.error('图片处理失败');
                uploading.value = false;
                return;
            }

            const formData = new FormData();
            formData.append('avatar', blob, 'avatar.png');

            try {
                const resp = await uploadAvatar(formData);
                if (resp.data?.code === 200 && resp.data?.data?.avatarUrl) {
                    userInfo.value.avatar = resp.data.data.avatarUrl;
                    ElMessage.success('头像更新成功');
                } else if (resp.data?.avatarUrl) {
                    userInfo.value.avatar = resp.data.avatarUrl;
                    ElMessage.success('头像更新成功');
                } else {
                    ElMessage.error(resp.data?.msg || '头像更新失败');
                }
            } catch (error: any) {
                console.error('上传头像失败:', error);
                ElMessage.error('上传头像失败');
            } finally {
                uploading.value = false;
            }
        }, 'image/png');
    } catch (error: any) {
        console.error('处理头像失败:', error);
        ElMessage.error('处理头像失败');
        uploading.value = false;
    }
}

// 提交密码修改
async function submitPasswordChange() {
    if (!passwordFormRef.value) return;
    
    await passwordFormRef.value.validate((valid) => {
        if (valid) {
            changingPassword.value = true;
            setTimeout(() => {
                ElMessage.info('密码修改功能正在开发中...');
                changingPassword.value = false;
            }, 1000);
        }
    });
}

// 格式化日期
function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
        return dateStr;
    }
}

onMounted(() => {
    loadUserInfo();
    loadStats();
});
</script>

<style scoped>
.ucenter-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8ecf1 100%);
}

/* 英雄区域 */
.hero-section {
    position: relative;
    padding: 40px 24px 120px;
    overflow: hidden;
}

.hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    z-index: 0;
}

.hero-bg::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 50%);
}

.hero-bg::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 70% 60%, rgba(255,255,255,0.1) 0%, transparent 40%);
}

.hero-content {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
}

/* 个人资料卡片 */
.profile-card {
    display: flex;
    align-items: center;
    gap: 32px;
    margin-bottom: 32px;
}

.avatar-section {
    position: relative;
}

.avatar-wrapper {
    position: relative;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.3s ease;
}

.avatar-wrapper:hover {
    transform: scale(1.05);
}

.avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
}

.user-avatar {
    border: 4px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    color: white;
    font-size: 28px;
}

.status-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    background: rgba(255,255,255,0.9);
    color: #6b7280;
}

.status-badge.online {
    background: #22c55e;
    color: white;
}

.user-info {
    color: white;
}

.user-name {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 12px 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.user-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 8px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    opacity: 0.9;
}

.user-email {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    opacity: 0.8;
}

/* 统计网格 */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.stat-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    flex-shrink: 0;
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1;
}

.stat-label {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
}

/* 主要内容区 */
.main-content {
    max-width: 1200px;
    margin: -80px auto 40px;
    padding: 0 24px;
    position: relative;
    z-index: 2;
}

.content-card {
    border-radius: 20px;
    border: none;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.content-card :deep(.el-card__body) {
    padding: 0;
}

/* 选项卡样式 */
.settings-tabs {
    height: 100%;
}

.settings-tabs :deep(.el-tabs__header) {
    margin: 0;
    background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
    border-bottom: 1px solid #e5e7eb;
}

.settings-tabs :deep(.el-tabs__nav-wrap) {
    padding: 0 24px;
}

.settings-tabs :deep(.el-tabs__item) {
    padding: 20px 24px;
    height: auto;
    font-size: 15px;
}

.settings-tabs :deep(.el-tabs__item.is-active) {
    color: #667eea;
}

.settings-tabs :deep(.el-tabs__active-bar) {
    background: linear-gradient(90deg, #667eea, #764ba2);
    height: 3px;
    border-radius: 3px 3px 0 0;
}

.tab-label {
    display: flex;
    align-items: center;
    gap: 8px;
}

.settings-tabs :deep(.el-tabs__content) {
    padding: 0;
}

.tab-content {
    padding: 32px;
    min-height: 400px;
}

.section-header {
    margin-bottom: 32px;
}

.section-header h3 {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
}

.section-desc {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
}

/* 设置列表 */
.settings-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
}

.setting-item:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.setting-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
}

.setting-desc {
    font-size: 13px;
    color: #6b7280;
}

/* 头像编辑器 */
.avatar-editor {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.crop-container {
    width: 400px;
    height: 300px;
    margin-bottom: 24px;
    border-radius: 16px;
    overflow: hidden;
    border: 2px solid #e5e7eb;
    background: #f9fafb;
}

.avatar-actions {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
}

.upload-btn-wrapper {
    position: relative;
}

.hidden-input {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: 0;
    cursor: pointer;
}

.avatar-tips {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;
    background: #f9fafb;
    padding: 12px 20px;
    border-radius: 10px;
}

/* 密码表单 */
.password-form {
    max-width: 500px;
}

.password-form :deep(.el-form-item__label) {
    font-weight: 600;
    color: #374151;
}

.password-form :deep(.el-input__wrapper) {
    border-radius: 10px;
}

.password-strength {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
}

.strength-bar {
    flex: 1;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
}

.strength-fill {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: 3px;
}

.strength-fill.weak {
    background: #ef4444;
}

.strength-fill.medium {
    background: #eab308;
}

.strength-fill.strong {
    background: #22c55e;
}

.strength-text {
    font-size: 12px;
    font-weight: 600;
}

.strength-text.weak {
    color: #ef4444;
}

.strength-text.medium {
    color: #eab308;
}

.strength-text.strong {
    color: #22c55e;
}

/* 个人信息列表 */
.profile-info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-row {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.info-label {
    width: 120px;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    flex-shrink: 0;
}

.info-value {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: #1f2937;
}

/* 响应式 */
@media (max-width: 768px) {
    .hero-section {
        padding: 24px 16px 100px;
    }

    .profile-card {
        flex-direction: column;
        text-align: center;
        gap: 20px;
    }

    .user-meta {
        justify-content: center;
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .main-content {
        padding: 0 16px;
    }

    .crop-container {
        width: 100%;
        height: 250px;
    }

    .tab-content {
        padding: 24px 16px;
    }

    .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .info-label {
        width: auto;
    }
}
</style>
