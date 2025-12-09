<template>
    <div class="departments-page">
        <div class="page-header">
            <div class="header-left">
                <h1 class="page-title">部门管理</h1>
                <p class="page-desc">管理公司组织架构中的部门信息</p>
            </div>
            <el-button type="primary" :icon="Refresh" @click="loadData">刷新</el-button>
        </div>

        <div class="content-area">
            <el-skeleton :rows="3" animated v-if="loading" />
            <template v-else>
                <div class="toolbar">
                    <el-button type="primary" :icon="Plus" @click="openCreate">新建部门</el-button>
                </div>
                <div v-if="rows.length > 0" class="departments-grid">
                    <div v-for="row in rows" :key="row.id" class="dept-card">
                        <div class="card-header">
                            <div class="dept-icon">
                                <el-icon><Folder /></el-icon>
                            </div>
                            <div class="status-tag" :class="row.status === 1 ? 'active' : 'inactive'">
                                {{ row.statusText }}
                            </div>
                        </div>
                        
                        <div class="card-body">
                            <h3 class="dept-name">{{ row.departmentName }}</h3>
                            <el-tag size="small" type="info" effect="plain" class="dept-code">{{ row.departmentCode }}</el-tag>
                        </div>
                        
                        <div class="card-info">
                            <div class="info-row">
                                <span class="info-label">负责人</span>
                                <div class="manager-info">
                                    <el-avatar :size="22" class="manager-avatar">{{ row.manager?.charAt(0) }}</el-avatar>
                                    <span class="manager-name">{{ row.manager || '-' }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="card-footer">
                            <el-button text size="small" @click="viewDepartment(row)"><el-icon><View /></el-icon> 查看</el-button>
                            <el-button text size="small" @click="editDepartment(row)"><el-icon><Edit /></el-icon> 编辑</el-button>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <el-empty description="暂无部门数据" />
                </div>
            </template>
        </div>

        <!-- 查看部门详情抽屉 -->
        <el-drawer
            v-model="viewVisible"
            title="部门详情"
            size="480px"
            class="vben-drawer"
            destroy-on-close
        >
            <div v-if="viewData" class="view-content">
                <div class="view-section">
                    <div class="view-item">
                        <span class="view-label">部门名称</span>
                        <span class="view-value">{{ viewData.departmentName }}</span>
                    </div>
                    <div class="view-item">
                        <span class="view-label">部门编码</span>
                        <span class="view-value">{{ viewData.departmentCode || '-' }}</span>
                    </div>
                    <div class="view-item">
                        <span class="view-label">负责人</span>
                        <div class="view-value">
                            <el-avatar :size="24" class="manager-avatar">{{ viewData.manager?.charAt(0) }}</el-avatar>
                            <span style="margin-left: 8px;">{{ viewData.manager || '-' }}</span>
                        </div>
                    </div>
                    <div class="view-item">
                        <span class="view-label">状态</span>
                        <el-tag :type="viewData.status === 1 ? 'success' : 'info'" size="small">
                            {{ viewData.statusText }}
                        </el-tag>
                    </div>
                    <div class="view-item" v-if="viewData.remark">
                        <span class="view-label">描述</span>
                        <div class="view-value view-textarea">{{ viewData.remark }}</div>
                    </div>
                </div>
            </div>
            <template #footer>
                <el-button @click="viewVisible=false">关闭</el-button>
                <el-button type="primary" @click="editFromView">编辑</el-button>
            </template>
        </el-drawer>

        <!-- 编辑/新建部门抽屉 -->
        <el-drawer
            v-model="visible"
            :title="isEdit ? '编辑部门' : '新建部门'"
            size="480px"
            class="vben-drawer"
            destroy-on-close
        >
            <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
                <el-form-item label="部门名称" prop="departmentName">
                    <el-input v-model="form.departmentName" placeholder="请输入部门名称" />
                </el-form-item>
                <el-form-item label="部门编码" prop="departmentCode">
                    <el-input v-model="form.departmentCode" placeholder="如：dept_ops_001" />
                </el-form-item>
                <el-form-item label="负责人">
                    <el-select v-model="form.managerId" filterable placeholder="选择负责人">
                        <el-option
                            v-for="emp in employeeOptions"
                            :key="emp.id"
                            :label="emp.name"
                            :value="emp.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可填写部门职责、定位等" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="visible=false">取消</el-button>
                <el-button type="primary" :loading="saving" @click="onSubmit">保存</el-button>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Refresh, Folder, View, Edit, Plus } from '@element-plus/icons-vue';
import { listDepartments, getMyEmployee, listEmployees, createDepartment, updateDepartment } from '@/api';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const visible = ref(false);
const viewVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const viewData = ref<any>(null);
const form = ref<any>({
    id: '',
    departmentName: '',
    departmentCode: '',
    managerId: '',
    status: 1,
    remark: '',
});
const rules: FormRules = {
    departmentName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
};
const employeeOptions = ref<{ id: string; name: string }[]>([]);
let companyId = '';

function viewDepartment(row: any) {
    viewData.value = { ...row };
    viewVisible.value = true;
}

function editFromView() {
    if (!viewData.value) return;
    viewVisible.value = false;
    editDepartment(viewData.value);
}
function openCreate() {
    isEdit.value = false;
    form.value = { id: '', departmentName: '', departmentCode: '', managerId: '', status: 1, remark: '' };
    visible.value = true;
}
function editDepartment(row: any) {
    isEdit.value = true;
    form.value = {
        id: row.id,
        departmentName: row.departmentName,
        departmentCode: row.departmentCode !== '-' ? row.departmentCode : '',
        managerId: row.managerId || '',
        status: row.status ?? 1,
        remark: row.remark || '',
    };
    visible.value = true;
}

async function onSubmit() {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid) => {
        if (!valid) return;
        saving.value = true;
        try {
            const payload = {
                id: form.value.id,
                companyId,
                departmentName: form.value.departmentName,
                departmentCode: form.value.departmentCode,
                managerId: form.value.managerId,
                status: form.value.status,
                remark: form.value.remark,
            };
            const api = isEdit.value ? updateDepartment : createDepartment;
            const resp = await api(payload);
            if (resp.data.code !== 200) throw new Error(resp.data.msg || '保存失败');
            ElMessage.success('保存成功');
            visible.value = false;
            loadData();
        } catch (e: any) {
            ElMessage.error(e?.message || '保存失败');
        } finally {
            saving.value = false;
        }
    });
}

async function loadData() {
    loading.value = true;
    try {
        const meResp = await getMyEmployee();
        companyId = '';
        if (meResp.data.code === 200 && meResp.data.data) {
            companyId = meResp.data.data.companyId || meResp.data.data.CompanyId || '';
        }
        if (!companyId) { ElMessage.warning('无法获取公司信息'); rows.value = []; return; }
        
        const resp = await listDepartments({ page: 1, pageSize: 100, companyId });
        if (resp.data.code !== 200) { rows.value = []; return; }
        const list = resp.data?.data?.list || [];
        rows.value = list.map((d: any) => ({
            id: d.id || d.Id,
            departmentName: d.departmentName || d.DepartmentName || '未命名部门',
            departmentCode: (d.departmentCode?.String ?? d.departmentCode ?? d.DepartmentCode?.String ?? d.DepartmentCode) || '-',
            manager: d.managerName || d.ManagerName || d.managerId || '-',
            managerId: d.managerId || d.ManagerId || '',
            remark: d.remark || d.Remark || '',
            status: d.status ?? d.Status ?? 1,
            statusText: (d.status ?? d.Status ?? 1) === 1 ? '启用' : '停用'
        }));

        // 员工列表用于负责人下拉
        const empResp = await listEmployees({ page: 1, pageSize: 200, companyId });
        if (empResp.data?.code === 200) {
            const empList = empResp.data?.data?.list || [];
            employeeOptions.value = empList.map((e: any) => ({
                id: e.id || e.employeeId || e.Id,
                name: e.realName || e.name || '未知',
            }));
        }
    } catch (error: any) { console.error('加载部门列表失败:', error); rows.value = []; } 
    finally { loading.value = false; }
}

onMounted(() => { loadData(); });
</script>

<style scoped>
.departments-page { 
    padding: clamp(16px, 1.5vw, 24px); 
    background: var(--bg-page); 
    min-height: calc(100vh - clamp(56px, 4vh, 64px));
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
}
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: clamp(16px, 1.5vw, 24px); }
.page-title { font-size: clamp(20px, 1.5vw, 24px); font-weight: 700; color: var(--text-main); margin: 0 0 clamp(4px, 0.3vw, 8px); }
.page-desc { font-size: clamp(13px, 0.95vw, 15px); color: var(--text-secondary); margin: 0; }

.departments-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 20vw, 320px), 1fr)); 
    gap: clamp(12px, 1.2vw, 20px);
    width: 100%;
}

.dept-card {
    background: var(--bg-card);
    border-radius: clamp(12px, 0.9vw, 14px);
    border: 1px solid var(--border-color);
    padding: clamp(16px, 1.3vw, 20px);
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
}

.dept-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: clamp(12px, 1vw, 16px); }

.dept-icon {
    width: clamp(40px, 3vw, 48px); 
    height: clamp(40px, 3vw, 48px); 
    border-radius: clamp(10px, 0.8vw, 12px);
    background: var(--bg-hover); 
    color: var(--color-danger);
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: clamp(18px, 1.3vw, 22px);
}

.status-tag { font-size: clamp(10px, 0.75vw, 12px); font-weight: 500; padding: clamp(3px, 0.3vw, 5px) clamp(10px, 0.8vw, 12px); border-radius: clamp(16px, 1.3vw, 20px); }
.status-tag.active { background: var(--bg-hover); color: var(--color-success); }
.status-tag.inactive { background: var(--bg-hover); color: var(--text-secondary); }

.card-body { margin-bottom: 16px; }
.dept-name { font-size: 16px; font-weight: 600; color: var(--text-main); margin: 0 0 8px; }
.dept-code { font-family: monospace; }

.card-info { background: var(--bg-hover); border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; }
.info-row { display: flex; justify-content: space-between; align-items: center; }
.info-label { font-size: 13px; color: var(--text-muted); }
.manager-info { display: flex; align-items: center; gap: 8px; }
.manager-avatar { background: var(--bg-hover); color: var(--color-danger); font-size: 10px; font-weight: 600; }
.manager-name { font-size: 13px; font-weight: 500; color: var(--text-main); }

.card-footer { display: flex; justify-content: flex-end; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border-color); }
.empty-state { padding: 60px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); }

/* 查看详情样式 */
.view-content {
    padding: 0;
}

.view-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.view-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.view-label {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
}

.view-value {
    font-size: 14px;
    color: var(--text-main);
    display: flex;
    align-items: center;
}

.view-textarea {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
    padding: 12px;
    background: var(--bg-base);
    border-radius: 8px;
    min-height: 60px;
}

/* 响应式布局 - 保持比例 */
@media (max-width: 1024px) {
    .departments-grid {
        grid-template-columns: repeat(auto-fill, minmax(22vw, 1fr));
    }
}

@media (max-width: 768px) {
    .departments-page {
        padding: 4vw;
    }
    
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 2vw;
    }
    
    .departments-grid {
        grid-template-columns: 1fr;
        gap: 3vw;
    }
}
</style>
