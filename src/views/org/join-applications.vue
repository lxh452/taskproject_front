<template>
    <div class="join-applications-page">
        <div class="page-header">
            <div class="header-left">
                <h1 class="page-title">加入申请</h1>
                <p class="page-desc">管理员工加入公司的申请与审批</p>
            </div>
            <div class="header-right">
                <el-button type="primary" :icon="Ticket" @click="showInviteDialog = true">
                    生成邀请码
                </el-button>
            </div>
        </div>

        <div class="content-card">
            <el-table :data="applications" v-loading="loading" stripe>
                <el-table-column label="申请人" min-width="150">
                    <template #default="{ row }">
                        <div class="applicant-info">
                            <el-avatar :size="32">{{ row.realName?.charAt(0) || row.username?.charAt(0) || '?' }}</el-avatar>
                            <div class="applicant-detail">
                                <span class="name">{{ row.realName || row.username }}</span>
                                <span class="username" v-if="row.realName">@{{ row.username }}</span>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="邀请码" prop="inviteCode" width="120">
                    <template #default="{ row }">
                        <el-tag v-if="row.inviteCode" type="info" size="small">{{ row.inviteCode }}</el-tag>
                        <span v-else class="text-gray">-</span>
                    </template>
                </el-table-column>
                <el-table-column label="申请理由" prop="applyReason" min-width="200">
                    <template #default="{ row }">
                        <span v-if="row.applyReason">{{ row.applyReason }}</span>
                        <span v-else class="text-gray">未填写</span>
                    </template>
                </el-table-column>
                <el-table-column label="申请时间" prop="createTime" width="170" />
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)" size="small">
                            {{ getStatusText(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                    <template #default="{ row }">
                        <template v-if="row.status === 0">
                            <el-button type="success" size="small" @click="handleApprove(row, true)">
                                通过
                            </el-button>
                            <el-button type="danger" size="small" @click="handleApprove(row, false)">
                                拒绝
                            </el-button>
                        </template>
                        <span v-else class="text-gray">已处理</span>
                    </template>
                </el-table-column>
            </el-table>
            
            <el-empty v-if="!loading && applications.length === 0" description="暂无待审批的申请" />
        </div>

        <!-- 生成邀请码弹窗 -->
        <el-dialog v-model="showInviteDialog" title="生成邀请码" width="420px">
            <el-form :model="inviteForm" label-width="100px">
                <el-form-item label="有效期">
                    <el-select v-model="inviteForm.expireDays" style="width: 100%">
                        <el-option label="1 天" :value="1" />
                        <el-option label="3 天" :value="3" />
                        <el-option label="7 天" :value="7" />
                        <el-option label="14 天" :value="14" />
                        <el-option label="30 天" :value="30" />
                    </el-select>
                </el-form-item>
                <el-form-item label="使用次数">
                    <el-input-number v-model="inviteForm.maxUses" :min="0" :max="100" style="width: 100%">
                        <template #suffix>
                            <span class="text-gray">0 表示不限制</span>
                        </template>
                    </el-input-number>
                    <div class="form-tip">0 表示不限制使用次数</div>
                </el-form-item>
            </el-form>
            
            <!-- 生成结果 -->
            <div v-if="generatedCode" class="invite-result">
                <div class="result-label">邀请码已生成</div>
                <div class="result-code">{{ generatedCode }}</div>
                <el-button type="primary" size="small" @click="copyInviteCode">
                    <el-icon><DocumentCopy /></el-icon>
                    复制邀请码
                </el-button>
            </div>
            
            <template #footer>
                <el-button @click="showInviteDialog = false">关闭</el-button>
                <el-button type="primary" @click="handleGenerateCode" :loading="generating">
                    {{ generatedCode ? '重新生成' : '生成' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- 审批弹窗 -->
        <el-dialog v-model="showApproveDialog" :title="approveData.approved ? '通过申请' : '拒绝申请'" width="420px">
            <el-form :model="approveData" label-width="80px">
                <el-form-item label="申请人">
                    <span>{{ currentApplication?.realName || currentApplication?.username }}</span>
                </el-form-item>
                <el-form-item label="审批备注">
                    <el-input 
                        v-model="approveData.note" 
                        type="textarea" 
                        :rows="3" 
                        :placeholder="approveData.approved ? '欢迎加入团队！' : '请填写拒绝原因'"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showApproveDialog = false">取消</el-button>
                <el-button 
                    :type="approveData.approved ? 'success' : 'danger'" 
                    @click="submitApproval" 
                    :loading="approving"
                >
                    {{ approveData.approved ? '确认通过' : '确认拒绝' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Ticket, DocumentCopy } from '@element-plus/icons-vue';
import { getPendingJoinApplications, generateInviteCode, approveJoinApplication } from '@/api';

const loading = ref(false);
const applications = ref<any[]>([]);

// 邀请码相关
const showInviteDialog = ref(false);
const generating = ref(false);
const generatedCode = ref('');
const inviteForm = reactive({
    expireDays: 7,
    maxUses: 0
});

// 审批相关
const showApproveDialog = ref(false);
const approving = ref(false);
const currentApplication = ref<any>(null);
const approveData = reactive({
    approved: true,
    note: ''
});

const getStatusType = (status: number) => {
    const types: Record<number, string> = {
        0: 'warning',
        1: 'success',
        2: 'danger',
        3: 'info'
    };
    return types[status] || 'info';
};

const getStatusText = (status: number) => {
    const texts: Record<number, string> = {
        0: '待审批',
        1: '已通过',
        2: '已拒绝',
        3: '已取消'
    };
    return texts[status] || '未知';
};

const loadApplications = async () => {
    loading.value = true;
    try {
        const res = await getPendingJoinApplications({ page: 1, pageSize: 50 });
        if (res.data.code === 200) {
            applications.value = res.data.data?.list || [];
        }
    } catch (error) {
        console.error('加载申请列表失败:', error);
    } finally {
        loading.value = false;
    }
};

const handleGenerateCode = async () => {
    generating.value = true;
    try {
        const res = await generateInviteCode({
            expireDays: inviteForm.expireDays,
            maxUses: inviteForm.maxUses
        });
        if (res.data.code === 200) {
            generatedCode.value = res.data.data?.inviteCode || '';
            ElMessage.success('邀请码生成成功');
        } else {
            ElMessage.error(res.data.msg || '生成失败');
        }
    } catch (error: any) {
        console.error('生成邀请码失败:', error);
        ElMessage.error(error.response?.data?.msg || '生成失败');
    } finally {
        generating.value = false;
    }
};

const copyInviteCode = () => {
    if (generatedCode.value) {
        navigator.clipboard.writeText(generatedCode.value);
        ElMessage.success('邀请码已复制到剪贴板');
    }
};

const handleApprove = (row: any, approved: boolean) => {
    currentApplication.value = row;
    approveData.approved = approved;
    approveData.note = '';
    showApproveDialog.value = true;
};

const submitApproval = async () => {
    if (!currentApplication.value) return;
    
    approving.value = true;
    try {
        const res = await approveJoinApplication({
            applicationId: currentApplication.value.id,
            approved: approveData.approved,
            note: approveData.note
        });
        if (res.data.code === 200) {
            ElMessage.success(approveData.approved ? '已通过申请' : '已拒绝申请');
            showApproveDialog.value = false;
            loadApplications();
        } else {
            ElMessage.error(res.data.msg || '操作失败');
        }
    } catch (error: any) {
        console.error('审批失败:', error);
        ElMessage.error(error.response?.data?.msg || '操作失败');
    } finally {
        approving.value = false;
    }
};

onMounted(() => {
    loadApplications();
});
</script>

<style scoped>
.join-applications-page {
    padding: clamp(16px, 1.5vw, 24px);
    background: var(--bg-page);
    min-height: calc(100vh - clamp(56px, 8vh, 64px));
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.page-title {
    font-size: clamp(20px, 1.5vw, 24px);
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 4px;
}

.page-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
}

.content-card {
    background: var(--bg-card);
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--shadow-sm);
}

.applicant-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.applicant-detail {
    display: flex;
    flex-direction: column;
}

.applicant-detail .name {
    font-weight: 600;
    color: var(--text-main);
}

.applicant-detail .username {
    font-size: 12px;
    color: var(--text-secondary);
}

.text-gray {
    color: var(--text-tertiary);
}

.form-tip {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
}

.invite-result {
    margin-top: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 1px solid #6ee7b7;
    border-radius: 12px;
    text-align: center;
}

.result-label {
    font-size: 12px;
    color: #047857;
    margin-bottom: 8px;
}

.result-code {
    font-size: 28px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    letter-spacing: 4px;
    color: #065f46;
    margin-bottom: 12px;
}
</style>

