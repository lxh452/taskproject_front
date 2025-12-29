<template>
    <div class="companies-page">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-left">
                <h1 class="page-title">公司管理</h1>
                <p class="page-desc">管理您所在的公司信息</p>
            </div>
            <div class="header-right">
                <el-button type="primary" :icon="Plus" @click="showCreateDialog = true" v-if="canCreateCompany">
                    创建公司
                </el-button>
            </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
            <div class="filter-left">
                <el-input 
                    v-model="query.keyword" 
                    placeholder="搜索公司名称" 
                    clearable 
                    class="search-input"
                    :prefix-icon="Search"
                    @keyup.enter="loadData"
                />
                <el-select v-model="query.status" placeholder="状态" clearable class="filter-select">
                    <el-option label="正常" :value="1">
                        <span class="status-option"><span class="dot success"></span>正常</span>
                    </el-option>
                    <el-option label="停用" :value="0">
                        <span class="status-option"><span class="dot default"></span>停用</span>
                    </el-option>
                </el-select>
            </div>
            <div class="filter-right">
                <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
            </div>
        </div>

        <!-- 公司卡片列表 -->
        <div class="content-area">
            <el-skeleton :rows="4" animated v-if="loading" />
            <template v-else>
                <div v-if="filteredRows.length > 0" class="companies-grid">
                    <div 
                        v-for="company in filteredRows" 
                        :key="company.id" 
                        class="company-card"
                        :class="{ 'is-current': company.id === currentCompanyId }"
                        @click="viewCompany(company)"
                    >
                        <div class="card-header">
                            <div class="company-avatar" :style="{ background: getCompanyColor(company.name) }">
                                {{ company.name?.charAt(0) || 'C' }}
                            </div>
                            <div class="company-info">
                                <h3 class="company-name">{{ company.name }}</h3>
                                <span class="company-type">{{ getCompanyTypeText(company.companyAttributes) }}</span>
                            </div>
                            <el-tag v-if="company.id === currentCompanyId" type="primary" size="small" class="current-tag">
                                当前
                            </el-tag>
                        </div>
                        
                        <div class="card-body">
                            <div class="info-row">
                                <el-icon><User /></el-icon>
                                <span>负责人：{{ company.ownerName || '-' }}</span>
                            </div>
                            <div class="info-row">
                                <el-icon><OfficeBuilding /></el-icon>
                                <span>行业：{{ getBusinessText(company.companyBusiness) }}</span>
                            </div>
                            <div class="info-row">
                                <el-icon><Location /></el-icon>
                                <span>{{ company.address || '未设置地址' }}</span>
                            </div>
                            <div class="info-row">
                                <el-icon><Calendar /></el-icon>
                                <span>创建于 {{ formatDate(company.createTime) }}</span>
                            </div>
                        </div>

                        <div class="card-stats">
                            <div class="stat-item">
                                <span class="stat-value">{{ company.employeeCount || 0 }}</span>
                                <span class="stat-label">员工</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">{{ company.departmentCount || 0 }}</span>
                                <span class="stat-label">部门</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">{{ company.taskCount || 0 }}</span>
                                <span class="stat-label">任务</span>
                            </div>
                        </div>

                        <div class="card-footer">
                            <el-button type="primary" size="small" @click.stop="viewCompany(company)">
                                <el-icon><View /></el-icon>
                                <span class="hide-mobile">查看</span>
                            </el-button>
                            <el-button size="small" @click.stop="editCompany(company)" v-if="canEditCompany(company)">
                                <el-icon><Edit /></el-icon>
                                <span class="hide-mobile">编辑</span>
                            </el-button>
                            <el-button size="small" @click.stop="showInviteDialog(company)" v-if="canInvite(company)">
                                <el-icon><Share /></el-icon>
                                <span class="hide-mobile">邀请</span>
                            </el-button>
                        </div>
                    </div>
                </div>
                <el-empty v-else description="暂无公司数据" />
            </template>
        </div>

        <!-- 公司详情抽屉 -->
        <el-drawer 
            v-model="showDetailDrawer" 
            :title="selectedCompany?.name || '公司详情'" 
            size="480px"
            direction="rtl"
        >
            <div class="company-detail" v-if="selectedCompany">
                <div class="detail-header">
                    <div class="company-avatar large" :style="{ background: getCompanyColor(selectedCompany.name) }">
                        {{ selectedCompany.name?.charAt(0) || 'C' }}
                    </div>
                    <div class="company-meta">
                        <h2>{{ selectedCompany.name }}</h2>
                        <el-tag :type="selectedCompany.status === 1 ? 'success' : 'info'" size="small">
                            {{ selectedCompany.status === 1 ? '正常' : '停用' }}
                        </el-tag>
                    </div>
                </div>

                <el-divider />

                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-item">
                        <span class="label">公司类型</span>
                        <span class="value">{{ getCompanyTypeText(selectedCompany.companyAttributes) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">所属行业</span>
                        <span class="value">{{ getBusinessText(selectedCompany.companyBusiness) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">负责人</span>
                        <span class="value">{{ selectedCompany.ownerName || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">联系电话</span>
                        <span class="value">{{ selectedCompany.phone || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">联系邮箱</span>
                        <span class="value">{{ selectedCompany.email || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">公司地址</span>
                        <span class="value">{{ selectedCompany.address || '-' }}</span>
                    </div>
                </div>

                <el-divider />

                <div class="detail-section">
                    <h4>公司简介</h4>
                    <p class="description">{{ selectedCompany.description || '暂无简介' }}</p>
                </div>

                <el-divider />

                <div class="detail-section">
                    <h4>统计数据</h4>
                    <div class="stats-row">
                        <div class="stat-card">
                            <span class="stat-num">{{ selectedCompany.employeeCount || 0 }}</span>
                            <span class="stat-text">员工数</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-num">{{ selectedCompany.departmentCount || 0 }}</span>
                            <span class="stat-text">部门数</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-num">{{ selectedCompany.taskCount || 0 }}</span>
                            <span class="stat-text">任务数</span>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <el-button @click="showDetailDrawer = false">关闭</el-button>
                <el-button type="primary" @click="editCompany(selectedCompany)" v-if="canEditCompany(selectedCompany)">
                    编辑公司
                </el-button>
            </template>
        </el-drawer>

        <!-- 编辑公司对话框 -->
        <el-dialog 
            v-model="showEditDialog" 
            :title="editForm.id ? '编辑公司' : '创建公司'" 
            width="560px"
            :close-on-click-modal="false"
        >
            <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
                <el-form-item label="公司名称" prop="name">
                    <el-input v-model="editForm.name" placeholder="请输入公司名称" />
                </el-form-item>
                <el-form-item label="公司类型" prop="companyAttributes">
                    <el-select v-model="editForm.companyAttributes" placeholder="请选择公司类型" style="width: 100%">
                        <el-option label="有限责任公司" :value="1" />
                        <el-option label="股份有限公司" :value="2" />
                        <el-option label="个人独资企业" :value="3" />
                        <el-option label="合伙企业" :value="4" />
                        <el-option label="其他" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item label="所属行业" prop="companyBusiness">
                    <el-select v-model="editForm.companyBusiness" placeholder="请选择所属行业" style="width: 100%">
                        <el-option label="互联网/IT" :value="1" />
                        <el-option label="金融" :value="2" />
                        <el-option label="制造业" :value="3" />
                        <el-option label="教育" :value="4" />
                        <el-option label="医疗健康" :value="5" />
                        <el-option label="零售/电商" :value="6" />
                        <el-option label="房地产" :value="7" />
                        <el-option label="其他" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item label="联系电话">
                    <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
                </el-form-item>
                <el-form-item label="联系邮箱">
                    <el-input v-model="editForm.email" placeholder="请输入联系邮箱" />
                </el-form-item>
                <el-form-item label="公司地址">
                    <el-input v-model="editForm.address" placeholder="请输入公司地址" />
                </el-form-item>
                <el-form-item label="公司简介">
                    <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入公司简介" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showEditDialog = false">取消</el-button>
                <el-button type="primary" @click="submitEdit" :loading="submitting">保存</el-button>
            </template>
        </el-dialog>

        <!-- 邀请码对话框 -->
        <el-dialog v-model="showInviteCodeDialog" title="邀请成员" width="420px">
            <div class="invite-content">
                <p class="invite-tip">分享以下邀请码给新成员，他们可以通过邀请码加入公司</p>
                <div class="invite-code-box">
                    <span class="invite-code">{{ inviteCode }}</span>
                    <el-button type="primary" size="small" @click="copyInviteCode">
                        <el-icon><CopyDocument /></el-icon>
                        复制
                    </el-button>
                </div>
                <div class="invite-options">
                    <el-form-item label="有效期">
                        <el-select v-model="inviteExpireDays" style="width: 100%">
                            <el-option label="1天" :value="1" />
                            <el-option label="7天" :value="7" />
                            <el-option label="30天" :value="30" />
                            <el-option label="永久有效" :value="0" />
                        </el-select>
                    </el-form-item>
                    <el-button type="primary" @click="generateInviteCode" :loading="generatingCode">
                        生成新邀请码
                    </el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Search, Refresh, Plus, View, Edit, Share, User, OfficeBuilding, Location, Calendar, CopyDocument } from '@element-plus/icons-vue';
import { listCompanies, updateCompany, generateInviteCode as apiGenerateInviteCode } from '@/api';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import type { FormInstance, FormRules } from 'element-plus';

const userStore = useUserStore();
const currentCompanyId = computed(() => userStore.companyId);

const rows = ref<any[]>([]);
const loading = ref(false);
const query = ref({ keyword: '', status: null as number | null });

// 详情抽屉
const showDetailDrawer = ref(false);
const selectedCompany = ref<any>(null);

// 编辑对话框
const showEditDialog = ref(false);
const showCreateDialog = ref(false);
const editFormRef = ref<FormInstance>();
const submitting = ref(false);
const editForm = ref({
    id: '',
    name: '',
    companyAttributes: 1,
    companyBusiness: 1,
    phone: '',
    email: '',
    address: '',
    description: ''
});

const editRules: FormRules = {
    name: [
        { required: true, message: '请输入公司名称', trigger: 'blur' },
        { min: 2, max: 50, message: '公司名称长度2-50个字符', trigger: 'blur' }
    ],
    companyAttributes: [{ required: true, message: '请选择公司类型', trigger: 'change' }],
    companyBusiness: [{ required: true, message: '请选择所属行业', trigger: 'change' }]
};

// 邀请码
const showInviteCodeDialog = ref(false);
const inviteCode = ref('');
const inviteExpireDays = ref(7);
const generatingCode = ref(false);
const inviteCompanyId = ref('');

// 过滤后的数据
const filteredRows = computed(() => {
    const { keyword, status } = query.value;
    return rows.value.filter((r) => {
        const byKw = !keyword || r.name?.toLowerCase().includes(keyword.toLowerCase());
        const bySt = status === null || status === undefined || r.status === status;
        return byKw && bySt;
    });
});

// 权限判断
const canCreateCompany = computed(() => {
    // 未加入公司的用户可以创建公司
    return !userStore.hasJoinedCompany;
});

function canEditCompany(company: any) {
    // 只有公司创始人/负责人可以编辑
    return company?.ownerId === userStore.userId || company?.id === currentCompanyId.value;
}

function canInvite(company: any) {
    // 当前公司的成员可以邀请
    return company?.id === currentCompanyId.value;
}

// 工具函数
function getCompanyColor(name: string) {
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
}

function getCompanyTypeText(type: number) {
    const types: Record<number, string> = {
        1: '有限责任公司',
        2: '股份有限公司',
        3: '个人独资企业',
        4: '合伙企业',
        0: '其他'
    };
    return types[type] || '未知';
}

function getBusinessText(business: number) {
    const businesses: Record<number, string> = {
        1: '互联网/IT',
        2: '金融',
        3: '制造业',
        4: '教育',
        5: '医疗健康',
        6: '零售/电商',
        7: '房地产',
        0: '其他'
    };
    return businesses[business] || '未知';
}

function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// 操作函数
function viewCompany(company: any) {
    selectedCompany.value = company;
    showDetailDrawer.value = true;
}

function editCompany(company: any) {
    editForm.value = {
        id: company.id,
        name: company.name || '',
        companyAttributes: company.companyAttributes || 1,
        companyBusiness: company.companyBusiness || 1,
        phone: company.phone || '',
        email: company.email || '',
        address: company.address || '',
        description: company.description || ''
    };
    showEditDialog.value = true;
    showDetailDrawer.value = false;
}

async function submitEdit() {
    if (!editFormRef.value) return;
    
    await editFormRef.value.validate(async (valid) => {
        if (!valid) return;
        
        submitting.value = true;
        try {
            const resp = await updateCompany(editForm.value);
            if (resp.data.code === 200) {
                ElMessage.success('保存成功');
                showEditDialog.value = false;
                loadData();
            } else {
                ElMessage.error(resp.data.msg || '保存失败');
            }
        } catch (error: any) {
            ElMessage.error('保存失败: ' + (error.message || '未知错误'));
        } finally {
            submitting.value = false;
        }
    });
}

function showInviteDialog(company: any) {
    inviteCompanyId.value = company.id;
    inviteCode.value = '';
    showInviteCodeDialog.value = true;
    generateInviteCode();
}

async function generateInviteCode() {
    generatingCode.value = true;
    try {
        const resp = await apiGenerateInviteCode({ expireDays: inviteExpireDays.value });
        if (resp.data.code === 200) {
            inviteCode.value = resp.data.data?.inviteCode || resp.data.data?.code || '';
        } else {
            ElMessage.error(resp.data.msg || '生成邀请码失败');
        }
    } catch (error: any) {
        ElMessage.error('生成邀请码失败');
    } finally {
        generatingCode.value = false;
    }
}

function copyInviteCode() {
    if (!inviteCode.value) return;
    navigator.clipboard.writeText(inviteCode.value).then(() => {
        ElMessage.success('邀请码已复制到剪贴板');
    }).catch(() => {
        ElMessage.error('复制失败，请手动复制');
    });
}

function resetFilter() {
    query.value = { keyword: '', status: null };
}

async function loadData() {
    loading.value = true;
    try {
        const resp = await listCompanies({ page: 1, pageSize: 100 });
        if (resp.data.code !== 200) {
            rows.value = [];
            return;
        }
        const list = resp.data?.data?.list || [];
        rows.value = list.map((c: any) => ({
            id: c.id || c.Id,
            name: c.name || c.Name || '未命名公司',
            ownerId: c.owner || c.Owner,
            ownerName: c.ownerName || c.OwnerName || '-',
            companyAttributes: c.companyAttributes ?? c.CompanyAttributes ?? 1,
            companyBusiness: c.companyBusiness ?? c.CompanyBusiness ?? 1,
            description: c.description || c.Description || '',
            address: c.address || c.Address || '',
            phone: c.phone || c.Phone || '',
            email: c.email || c.Email || '',
            status: c.status ?? c.Status ?? 1,
            createTime: c.createTime || c.CreateTime || '',
            employeeCount: c.employeeCount || 0,
            departmentCount: c.departmentCount || 0,
            taskCount: c.taskCount || 0
        }));
    } catch (error: any) {
        console.error('加载公司列表失败:', error);
        rows.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadData();
});
</script>


<style scoped>
.companies-page {
    padding: var(--page-padding);
    background: var(--bg-page);
    min-height: calc(100vh - var(--header-height));
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--card-gap);
}

.page-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0;
}

.page-desc {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-top: var(--spacing-xs);
}

.filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--card-gap);
    background: var(--bg-card);
    padding: var(--spacing-lg) var(--spacing-xl);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-card);
}

.filter-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.search-input { width: 260px; }
.filter-select { width: 130px; }

.status-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}
.dot.success { background: var(--color-success); }
.dot.default { background: var(--text-muted); }

/* 公司卡片网格 */
.companies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--card-gap);
}

.company-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--card-padding);
    cursor: pointer;
    transition: all var(--transition-base);
    box-shadow: var(--shadow-card);
}

.company-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
    border-color: var(--color-primary);
}

.company-card.is-current {
    border-color: var(--color-primary);
    background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.02) 0%, rgba(var(--color-primary-rgb), 0.05) 100%);
}

.card-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.company-avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    flex-shrink: 0;
}

.company-avatar.large {
    width: 72px;
    height: 72px;
    font-size: var(--font-size-3xl);
}

.company-info {
    flex: 1;
    min-width: 0;
}

.company-name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.company-type {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
}

.current-tag {
    flex-shrink: 0;
}

.card-body {
    margin-bottom: var(--spacing-lg);
}

.info-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
}

.info-row .el-icon {
    color: var(--text-muted);
    flex-shrink: 0;
}

.info-row:last-child {
    margin-bottom: 0;
}

.card-stats {
    display: flex;
    justify-content: space-around;
    padding: var(--spacing-md) 0;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--spacing-lg);
}

.stat-item {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
}

.stat-label {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
}

.card-footer {
    display: flex;
    gap: var(--spacing-sm);
}

.card-footer .el-button {
    flex: 1;
}

/* 详情抽屉 */
.company-detail {
    padding: var(--spacing-lg);
}

.detail-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.company-meta h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
}

.detail-section h4 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-md) 0;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-light);
}

.detail-item .label {
    color: var(--text-muted);
    font-size: var(--font-size-sm);
}

.detail-item .value {
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
}

.description {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
}

.stat-card {
    background: var(--bg-hover);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    text-align: center;
}

.stat-num {
    display: block;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
}

.stat-text {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
}

/* 邀请码对话框 */
.invite-content {
    text-align: center;
}

.invite-tip {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-xl);
}

.invite-code-box {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    background: var(--bg-hover);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg) var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
}

.invite-code {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-mono);
    color: var(--color-primary);
    letter-spacing: 2px;
}

.invite-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: center;
}

/* 响应式 */
@media (max-width: 768px) {
    .companies-page {
        padding: var(--spacing-lg);
    }
    
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
    }
    
    .filter-bar {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
    }
    
    .filter-left {
        flex-direction: column;
        width: 100%;
    }
    
    .search-input,
    .filter-select {
        width: 100% !important;
    }
    
    .companies-grid {
        grid-template-columns: 1fr;
    }
    
    .card-footer .hide-mobile {
        display: none;
    }
    
    .card-footer .el-button {
        padding: var(--spacing-sm);
    }
    
    .stats-row {
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-sm);
    }
    
    .stat-card {
        padding: var(--spacing-md);
    }
}

@media (max-width: 480px) {
    .company-avatar {
        width: 40px;
        height: 40px;
        font-size: var(--font-size-lg);
    }
    
    .company-name {
        font-size: var(--font-size-base);
    }
    
    .card-stats {
        flex-wrap: wrap;
    }
    
    .stat-item {
        flex: 1;
        min-width: 60px;
    }
}

/* 深色模式 */
html.dark-mode .company-card {
    background: var(--bg-card);
    border-color: var(--border-color);
}

html.dark-mode .company-card:hover {
    border-color: var(--color-primary);
}

html.dark-mode .filter-bar {
    background: var(--bg-card);
    border-color: var(--border-color);
}
</style>
