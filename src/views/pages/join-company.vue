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
                    <div class="card-desc">搜索并申请加入已存在的企业团队</div>
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
                    <el-form-item prop="keyword">
                        <el-input 
                            v-model="joinForm.keyword" 
                            placeholder="请输入公司名称或代码搜索"
                            prefix-icon="Search"
                        >
                            <template #append>
                                <el-button @click="handleSearch" :loading="searching">搜索</el-button>
                            </template>
                        </el-input>
                    </el-form-item>
                    
                    <div class="company-list" v-if="companyList.length > 0">
                        <div 
                            v-for="company in companyList" 
                            :key="company.id" 
                            class="company-item"
                            :class="{ selected: selectedCompany?.id === company.id }"
                            @click="selectCompany(company)"
                        >
                            <div class="company-info">
                                <div class="company-name">{{ company.name }}</div>
                                <div class="company-meta">
                                    <span class="meta-item">负责人: {{ company.owner || '未知' }}</span>
                                    <span class="meta-item">电话: {{ company.phone || '-' }}</span>
                                </div>
                            </div>
                            <el-icon v-if="selectedCompany?.id === company.id" class="check-icon"><Check /></el-icon>
                        </div>
                    </div>
                    <div class="empty-result" v-else-if="searched">
                        未找到相关公司
                    </div>

                    <el-button 
                        class="submit-btn" 
                        type="primary" 
                        size="large" 
                        :disabled="!selectedCompany"
                        :loading="submitting"
                        @click="handleJoin"
                    >
                        申请加入
                    </el-button>
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
import { OfficeBuilding, Plus, Check, Search } from '@element-plus/icons-vue';
import { listCompanies, createCompany, joinCompany } from '@/api';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();
const mode = ref<'join' | 'create'>('join');
const submitting = ref(false);
const searching = ref(false);
const searched = ref(false);

// 加入公司相关
const joinRef = ref<FormInstance>();
const joinForm = reactive({
    keyword: ''
});
const companyList = ref<any[]>([]);
const selectedCompany = ref<any>(null);

const joinRules: FormRules = {
    keyword: [{ required: true, message: '请输入搜索关键词', trigger: 'blur' }]
};

// 创建公司相关
const createRef = ref<FormInstance>();
const createForm = reactive({
    name: '',
    phone: '',
    email: '',
    address: '',
    description: ''
});

const createRules: FormRules = {
    name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
};

// 搜索公司
const handleSearch = async () => {
    if (!joinForm.keyword) return;
    searching.value = true;
    searched.value = true;
    selectedCompany.value = null;
    try {
        const res = await listCompanies({ 
            page: 1, 
            pageSize: 20, 
            name: joinForm.keyword 
        });
        if (res.data.code === 200) {
            companyList.value = res.data.data.list || [];
        }
    } catch (error) {
        console.error(error);
        ElMessage.error('搜索失败');
    } finally {
        searching.value = false;
    }
};

const selectCompany = (company: any) => {
    selectedCompany.value = company;
};

// 提交加入申请
const handleJoin = async () => {
    if (!selectedCompany.value) return;
    submitting.value = true;
    try {
        const res = await joinCompany({ companyId: selectedCompany.value.id });
        if (res.data.code === 200) {
            ElMessage.success('申请成功，已加入公司');
            // 更新用户信息并跳转
            userStore.setUserInfo({ companyId: selectedCompany.value.id });
            router.push('/dashboard');
        } else {
            ElMessage.error(res.data.msg || '加入失败');
        }
    } catch (error) {
        console.error(error);
        ElMessage.error('加入失败');
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
                    ElMessage.success('创建成功');
                    // 假设创建后自动加入或返回公司信息
                    const companyId = res.data.data?.companyId || res.data.data?.id;
                    if (companyId) {
                        userStore.setUserInfo({ companyId });
                    }
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
    background: #fff5f5;
    transform: translateY(-2px);
    border-color: rgba(220, 38, 38, 0.2);
}

.action-card.active {
    background: #fff5f5;
    border-color: #dc2626;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.card-icon {
    font-size: 32px;
    color: #dc2626;
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
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.company-list {
    margin-top: 16px;
    max-height: 280px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
}

.company-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.2s;
}

.company-item:last-child {
    border-bottom: none;
}

.company-item:hover {
    background: #f9fafb;
}

.company-item.selected {
    background: #fff5f5;
}

.company-name {
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
}

.company-meta {
    font-size: 12px;
    color: #6b7280;
    display: flex;
    gap: 16px;
}

.check-icon {
    color: #dc2626;
    font-size: 20px;
}

.empty-result {
    text-align: center;
    color: #6b7280;
    padding: 24px;
    background: #f9fafb;
    border-radius: 10px;
    margin-top: 16px;
    font-size: 13px;
}

.submit-btn {
    width: 100%;
    height: 46px;
    margin-top: 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: #ffffff;
    border: none;
    transition: all 0.3s;
    letter-spacing: 2px;
}

.submit-btn:hover {
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(220, 38, 38, 0.2);
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
    color: #dc2626;
}
</style>