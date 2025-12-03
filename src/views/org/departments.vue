<template>
    <div class="departments-page">
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="page-title">部门列表</div>
            </div>
            <div class="toolbar-right">
                <el-button @click="loadData" :icon="Refresh" circle plain />
            </div>
        </div>

        <div class="table-container">
            <el-table :data="rows" style="width: 100%" v-loading="loading" class="departments-table" :header-cell-style="{ background: '#f9fafb', color: '#6b7280', fontWeight: '600' }">
                <el-table-column prop="departmentName" label="部门名称" min-width="220">
                    <template #default="{ row }">
                        <div class="department-cell">
                            <div class="department-icon">
                                <el-icon><Folder /></el-icon>
                            </div>
                            <span class="department-name">{{ row.departmentName }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="departmentCode" label="编码" width="140">
                    <template #default="{ row }">
                        <span class="code-text">{{ row.departmentCode }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="manager" label="负责人" width="180">
                    <template #default="{ row }">
                        <div class="manager-cell">
                            <el-avatar :size="24" class="manager-avatar">{{ row.manager?.charAt(0) }}</el-avatar>
                            <span>{{ row.manager || '-' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="statusText" label="状态" width="140" align="center">
                    <template #default="{ row }">
                        <div class="status-badge" :class="row.status === 1 ? 'success' : 'default'">
                            {{ row.statusText }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" align="right" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="viewDepartment(row)">查看</el-button>
                        <el-button link type="primary" @click="editDepartment(row)">编辑</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Refresh, Folder } from '@element-plus/icons-vue';
import { listDepartments, getMyEmployee } from '@/api';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
const loading = ref(false);

function viewDepartment(row: any) {
    ElMessage.info('查看部门: ' + row.departmentName);
}

function editDepartment(row: any) {
    ElMessage.info('编辑部门: ' + row.departmentName);
}

async function loadData() {
    loading.value = true;
    try {
        // 先获取当前用户的公司ID
        const meResp = await getMyEmployee();
        let companyId = '';
        if (meResp.data.code === 200 && meResp.data.data) {
            companyId = meResp.data.data.companyId || meResp.data.data.CompanyId || '';
        }
        if (!companyId) {
            ElMessage.warning('无法获取公司信息');
            rows.value = [];
            return;
        }
        
        const resp = await listDepartments({ page: 1, pageSize: 100, companyId });
        if (resp.data.code !== 200) {
            console.error('API返回错误:', resp.data.msg);
            rows.value = [];
            return;
        }
        const responseData = resp.data?.data || resp.data || {};
        const list = responseData.list || [];
        rows.value = list.map((d: any) => ({
            id: d.id || d.Id,
            departmentName: d.departmentName || d.DepartmentName || '未命名部门',
            departmentCode: (d.departmentCode?.String ?? d.departmentCode ?? d.DepartmentCode?.String ?? d.DepartmentCode) || '-',
            manager: d.managerName || d.ManagerName || d.managerId || d.ManagerId || '-',
            status: d.status ?? d.Status ?? 1,
            statusText: (d.status ?? d.Status ?? 1) === 1 ? '启用' : '停用'
        }));
    } catch (error: any) {
        console.error('加载部门列表失败:', error);
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
.departments-page {
    padding: 24px;
    background: #f9fafb;
    min-height: calc(100vh - 64px);
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: #ffffff;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.table-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 4px;
}

.departments-table {
    --el-table-border-color: #f3f4f6;
    --el-table-header-bg-color: #f9fafb;
}

.department-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.department-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #f0fdf4;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #16a34a;
    font-size: 18px;
    flex-shrink: 0;
}

.department-name {
    font-weight: 600;
    font-size: 15px;
    color: #1f2937;
}

.code-text {
    font-family: monospace;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
}

.manager-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4b5563;
    font-size: 14px;
}

.manager-avatar {
    background: #eff6ff;
    color: #3b82f6;
    font-size: 12px;
    font-weight: 600;
}

.status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.status-badge.success { background: #ecfdf5; color: #10b981; }
.status-badge.default { background: #f3f4f6; color: #6b7280; }
</style>
