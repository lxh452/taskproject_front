<template>
    <div class="join-company-bg">
        <div class="task-bg-text">
            <span class="task-letter">T</span>
            <span class="task-letter">A</span>
            <span class="task-letter">S</span>
            <span class="task-letter">K</span>
        </div>
        <div class="join-container">
            <div class="join-header">
                <div class="join-title">WELCOME</div>
                <div class="join-subtitle">加入或创建公司 · 开启协作之旅</div>
            </div>
            
            <div class="action-cards">
                <!-- 加入公司 -->
                <div class="action-card" :class="{ active: mode === 'join' }" @click="mode = 'join'">
                    <el-icon class="card-icon"><OfficeBuilding /></el-icon>
                    <div class="card-title">加入公司</div>
                    <div class="card-desc">使用邀请码申请加入企业团队</div>
                </div>

                <!-- 创建公司 -->
                <div class="action-card" :class="{ active: mode === 'create' }" @click="mode = 'create'">
                    <el-icon class="card-icon"><Plus /></el-icon>
                    <div class="card-title">创建公司</div>
                    <div class="card-desc">注册并建立全新的企业组织架构</div>
                </div>
            </div>

            <!-- 加入公司表单 -->
            <div class="form-section" v-if="mode === 'join'">
                <el-form :model="joinForm" :rules="joinRules" ref="joinRef" size="large">
                    <!-- 邀请码输入 -->
                    <el-form-item prop="inviteCode">
                        <el-input 
                            v-model="joinForm.inviteCode" 
                            placeholder="请输入邀请码"
                            maxlength="8"
                            :formatter="(value: string) => value.toUpperCase()"
                            class="invite-code-input"
                        >
                            <template #prefix>
                                <el-icon><Ticket /></el-icon>
                            </template>
                            <template #append>
                                <el-button @click="handleParseInviteCode" :loading="parsing">
                                    验证
                                </el-button>
                            </template>
                        </el-input>
                    </el-form-item>
                    
                    <!-- 公司信息预览 -->
                    <div class="company-preview" v-if="companyInfo">
                        <div class="preview-header">
                            <el-icon class="preview-icon"><CircleCheckFilled /></el-icon>
                            <span>邀请码有效</span>
                        </div>
                        <div class="preview-card">
                            <div class="preview-row">
                                <span class="label">公司名称</span>
                                <span class="value company-name">{{ companyInfo.companyName }}</span>
                            </div>
                            <div class="preview-row" v-if="companyInfo.description">
                                <span class="label">公司简介</span>
                                <span class="value">{{ companyInfo.description }}</span>
                            </div>
                            <div class="preview-row" v-if="companyInfo.address">
                                <span class="label">公司地址</span>
                                <span class="value">{{ companyInfo.address }}</span>
                                </div>
                            <div class="preview-row">
                                <span class="label">过期时间</span>
                                <span class="value">{{ companyInfo.expireAt }}</span>
                            </div>
                        </div>
                        
                        <!-- 申请理由 -->
                        <el-form-item prop="applyReason" style="margin-top: 16px;">
                            <el-input 
                                v-model="joinForm.applyReason" 
                                type="textarea"
                                :rows="2"
                                placeholder="请输入申请理由（选填）"
                            />
                        </el-form-item>
                    </div>

                    <!-- 无效邀请码提示 -->
                    <div class="invalid-code" v-if="inviteCodeError">
                        <el-icon><CircleCloseFilled /></el-icon>
                        <span>{{ inviteCodeError }}</span>
                    </div>

                    <el-button 
                        class="submit-btn" 
                        type="primary" 
                        size="large" 
                        :disabled="!companyInfo"
                        :loading="submitting"
                        @click="handleApplyJoin"
                    >
                        提交申请
                    </el-button>
                    
                    <div class="join-tips">
                        <el-icon><InfoFilled /></el-icon>
                        <span>提交后需等待公司管理员审批</span>
                    </div>
                </el-form>
            </div>

            <!-- 创建公司表单 -->
            <div class="form-section" v-if="mode === 'create'">
                <el-form :model="createForm" :rules="createRules" ref="createRef" size="large" label-position="top">
                    <el-form-item label="公司名称" prop="name">
                        <el-input v-model="createForm.name" placeholder="请输入公司全称" />
                    </el-form-item>
                    <el-form-item label="联系电话" prop="phone">
                        <el-input v-model="createForm.phone" placeholder="请输入公司联系电话" />
                    </el-form-item>
                    <el-form-item label="公司地址" prop="address">
                        <el-input v-model="createForm.address" placeholder="请输入公司办公地址" />
                    </el-form-item>
                    <el-form-item label="公司简介" prop="description">
                        <el-input 
                            v-model="createForm.description" 
                            type="textarea" 
                            :rows="3" 
                            placeholder="请输入简单的公司介绍" 
                        />
                    </el-form-item>
                    
                    <!-- 模板选择 -->
                    <el-form-item label="初始化选项">
                        <div class="template-option">
                            <el-checkbox v-model="createForm.useTemplate" size="large">
                                <span class="option-label">使用推荐的组织结构模板</span>
                            </el-checkbox>
                            <div class="option-desc" v-if="createForm.useTemplate">
                                将自动创建常用部门（人力、研发、市场、销售、财务、行政、运维）及默认职位
                            </div>
                            <div class="option-desc minimal" v-else>
                                仅创建「总裁办」部门和您的创始人身份，后续可手动添加部门
                            </div>
                        </div>
                    </el-form-item>
                    
                    <el-button 
                        class="submit-btn" 
                        type="primary" 
                        size="large" 
                        :loading="submitting"
                        @click="handleCreate"
                    >
                        立即创建
                    </el-button>
                </el-form>
            </div>
            
            <div class="footer-link">
                <el-link type="info" @click="handleLogout">退出登录</el-link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { OfficeBuilding, Plus, Ticket, CircleCheckFilled, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue';
import { createCompany, parseInviteCode, applyJoinCompany } from '@/api';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();
const mode = ref<'join' | 'create'>('join');
const submitting = ref(false);
const parsing = ref(false);

// 加入公司相关
const joinRef = ref<FormInstance>();
const joinForm = reactive({
    inviteCode: '',
    applyReason: ''
});
const companyInfo = ref<any>(null);
const inviteCodeError = ref('');

const joinRules: FormRules = {
    inviteCode: [
        { required: true, message: '请输入邀请码', trigger: 'blur' },
        { min: 6, max: 10, message: '邀请码长度为6-10位', trigger: 'blur' }
    ]
};

// 创建公司相关
const createRef = ref<FormInstance>();
const createForm = reactive({
    name: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    companyAttributes: 1,
    companyBusiness: 1,
    useTemplate: true,
});

const createRules: FormRules = {
    name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
};

// 解析邀请码
const handleParseInviteCode = async () => {
    if (!joinForm.inviteCode || joinForm.inviteCode.length < 6) {
        ElMessage.warning('请输入有效的邀请码');
        return;
    }
    
    parsing.value = true;
    companyInfo.value = null;
    inviteCodeError.value = '';
    
    try {
        const res = await parseInviteCode({ inviteCode: joinForm.inviteCode.toUpperCase() });
        if (res.data.code === 200) {
            companyInfo.value = res.data.data;
            ElMessage.success('邀请码验证成功');
        } else {
            inviteCodeError.value = res.data.msg || '邀请码无效或已过期';
        }
    } catch (error: any) {
        console.error(error);
        inviteCodeError.value = error.response?.data?.msg || '验证失败，请稍后重试';
    } finally {
        parsing.value = false;
    }
};

// 提交加入申请
const handleApplyJoin = async () => {
    if (!companyInfo.value) {
        ElMessage.warning('请先验证邀请码');
        return;
    }
    
    submitting.value = true;
    try {
        const res = await applyJoinCompany({ 
            inviteCode: joinForm.inviteCode.toUpperCase(),
            applyReason: joinForm.applyReason
        });
        if (res.data.code === 200) {
            await ElMessageBox.alert(
                `<div style="line-height: 1.8;">
                    <p><strong>🎉 申请已提交！</strong></p>
                    <p style="margin-top: 12px; color: #666;">您的加入申请已成功提交到 <strong>${companyInfo.value.companyName}</strong></p>
                    <p style="margin-top: 8px; color: #666;">请耐心等待公司管理员审批。</p>
                    <p style="margin-top: 12px; color: #999; font-size: 12px;">审批通过后，系统会自动为您分配部门和职位。</p>
                </div>`,
                '申请已提交',
                {
                    dangerouslyUseHTMLString: true,
                    confirmButtonText: '我知道了',
                    customClass: 'welcome-dialog',
                }
            );
            // 清空表单
            joinForm.inviteCode = '';
            joinForm.applyReason = '';
            companyInfo.value = null;
        } else {
            ElMessage.error(res.data.msg || '申请失败');
        }
    } catch (error: any) {
        console.error(error);
        ElMessage.error(error.response?.data?.msg || '申请失败');
    } finally {
        submitting.value = false;
    }
};

// 提交创建公司
const handleCreate = async () => {
    if (!createRef.value) return;
    await createRef.value.validate(async (valid) => {
        if (valid) {
            submitting.value = true;
            try {
                const res = await createCompany(createForm);
                if (res.data.code === 200) {
                    // 更新token
                    const newToken = res.data.data?.token;
                    if (newToken) {
                        localStorage.setItem('authToken', newToken);
                    }
                    
                    const companyId = res.data.data?.companyId || res.data.data?.id;
                    const employeeId = res.data.data?.employeeId;
                    if (companyId) {
                        userStore.setUserInfo({ companyId, employeeId });
                    }
                    
                    const templateMsg = createForm.useTemplate 
                        ? `<div style="line-height: 1.8;">
                            <p><strong>🎉 公司创建成功！</strong></p>
                            <p style="margin-top: 12px; color: #666;">系统已为您自动初始化以下组织结构：</p>
                            <ul style="margin: 12px 0; padding-left: 20px; color: #666;">
                                <li><strong>总裁办</strong> - 您作为创始人已自动加入</li>
                                <li><strong>人力资源部、研发部、市场部、销售部、财务部、行政部、运维部</strong></li>
                            </ul>
                            <p style="color: #666;">每个部门下已配置默认职位：<strong>经理、高级、工程师、助理</strong></p>
                            <p style="margin-top: 12px; color: #666;">您已被自动分配<strong style="color: #4f46e5;">「超级管理员」</strong>角色，拥有所有系统权限。</p>
                            <p style="margin-top: 12px; color: #999; font-size: 12px;">提示：您可以在「组织管理」中根据实际需要调整部门和职位。</p>
                        </div>`
                        : `<div style="line-height: 1.8;">
                            <p><strong>🎉 公司创建成功！</strong></p>
                            <p style="margin-top: 12px; color: #666;">已为您创建：</p>
                            <ul style="margin: 12px 0; padding-left: 20px; color: #666;">
                                <li><strong>总裁办</strong> - 您作为创始人已自动加入</li>
                                <li><strong>超级管理员</strong>角色 - 拥有所有系统权限</li>
                            </ul>
                            <p style="margin-top: 12px; color: #999; font-size: 12px;">提示：您可以在「组织管理」中手动添加部门和职位。</p>
                        </div>`;
                    
                    await ElMessageBox.alert(
                        templateMsg,
                        '欢迎使用 Task Pro',
                        {
                            dangerouslyUseHTMLString: true,
                            confirmButtonText: '开始使用',
                            customClass: 'welcome-dialog',
                        }
                    );
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    router.push('/dashboard');
                } else {
                    ElMessage.error(res.data.msg || '创建失败');
                }
            } catch (error) {
                console.error(error);
                ElMessage.error('创建失败');
            } finally {
                submitting.value = false;
            }
        }
    });
};

const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('vuems_name');
    localStorage.removeItem('user_permissions');
    router.push('/login');
};
</script>

<style scoped>
.join-company-bg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100vh;
    background: #f8f9fa;
    background-image: 
        linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    padding: 20px;
    box-sizing: border-box;
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

.join-container {
    width: 560px;
    max-width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 16px;
    padding: 40px;
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

.join-header {
    text-align: center;
    margin-bottom: 32px;
}

.join-title {
    font-size: 24px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 8px;
    letter-spacing: 3px;
    text-transform: uppercase;
}

.join-subtitle {
    font-size: 12px;
    color: #9ca3af;
    letter-spacing: 4px;
    text-transform: uppercase;
    font-weight: 500;
}

.action-cards {
    display: flex;
    gap: 16px;
    margin-bottom: 28px;
}

.action-card {
    flex: 1;
    background: #f9fafb;
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 24px 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.action-card:hover {
    background: #eef2ff;
    transform: translateY(-2px);
    border-color: rgba(59, 130, 246, 0.2);
}

.action-card.active {
    background: #eef2ff;
    border-color: #3B82F6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.card-icon {
    font-size: 32px;
    color: #3B82F6;
    margin-bottom: 12px;
}

.card-title {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
}

.card-desc {
    font-size: 11px;
    color: #6b7280;
    line-height: 1.6;
}

.form-section {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.form-section :deep(.el-input__wrapper) {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    box-shadow: none;
    transition: all 0.2s;
    border-radius: 8px;
}

.form-section :deep(.el-input__wrapper.is-focus) {
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background-color: #fff;
}

.form-section :deep(.el-input__inner) {
    color: #111827;
}

.form-section :deep(.el-form-item__label) {
    color: #374151;
    font-weight: 600;
}

.form-section :deep(.el-textarea__inner) {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
}

.form-section :deep(.el-textarea__inner:focus) {
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 邀请码输入框样式 */
.invite-code-input :deep(.el-input__inner) {
    font-family: 'Courier New', monospace;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 4px;
    text-transform: uppercase;
}

/* 公司信息预览 */
.company-preview {
    margin-top: 16px;
    animation: fadeIn 0.3s ease-out;
}

.preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #059669;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
}

.preview-icon {
    font-size: 18px;
}

.preview-card {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 1px solid #6ee7b7;
    border-radius: 12px;
    padding: 16px;
}

.preview-row {
    display: flex;
    margin-bottom: 10px;
}

.preview-row:last-child {
    margin-bottom: 0;
}

.preview-row .label {
    width: 80px;
    color: #047857;
    font-size: 12px;
    flex-shrink: 0;
}

.preview-row .value {
    color: #065f46;
    font-size: 13px;
    flex: 1;
}

.preview-row .value.company-name {
    font-weight: 700;
    font-size: 15px;
}

/* 无效邀请码提示 */
.invalid-code {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 13px;
    margin-top: 16px;
}

/* 加入提示 */
.join-tips {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 16px;
    color: #9ca3af;
    font-size: 12px;
}

.submit-btn {
    width: 100%;
    height: 46px;
    margin-top: 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    color: #ffffff;
    border: none;
    transition: all 0.3s;
    letter-spacing: 2px;
}

.submit-btn:hover {
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
}

.submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.footer-link {
    text-align: center;
    margin-top: 24px;
}

.footer-link :deep(.el-link) {
    color: #6b7280;
    font-size: 13px;
}

.footer-link :deep(.el-link:hover) {
    color: #3B82F6;
}

/* 模板选择样式 */
.template-option {
    width: 100%;
}

.option-label {
    font-weight: 600;
    color: #111827;
}

.option-desc {
    margin-top: 8px;
    padding: 12px 14px;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 1px solid #6ee7b7;
    border-radius: 8px;
    font-size: 12px;
    color: #047857;
    line-height: 1.5;
}

.option-desc.minimal {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-color: #d1d5db;
    color: #6b7280;
}
</style>
