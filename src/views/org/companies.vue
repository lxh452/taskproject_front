<template>
    <div class="companies-page">
        <div class="toolbar">
            <div class="toolbar-left">
                <el-input 
                    v-model="query.keyword" 
                    placeholder="搜索公司名称/负责人" 
                    clearable 
                    class="search-input"
                    :prefix-icon="Search"
                />
                <el-select v-model="query.status" placeholder="状态" clearable class="filter-select">
                    <el-option label="正常" :value="1">
                        <span class="status-dot success"></span>正常
                    </el-option>
                    <el-option label="停用" :value="0">
                        <span class="status-dot info"></span>停用
                    </el-option>
                </el-select>
            </div>
            <div class="toolbar-right">
                <el-button type="primary" :icon="Search" @click="applyFilter">搜索</el-button>
                <el-button @click="resetFilter" :icon="Refresh">重置</el-button>
            </div>
        </div>

        <div class="table-container">
            <el-table :data="filteredRows" style="width: 100%" v-loading="loading" class="companies-table" :header-cell-style="{ background: '#f9fafb', color: '#6b7280', fontWeight: '600' }">
                <el-table-column prop="name" label="公司名称" min-width="240">
                    <template #default="{ row }">
                        <div class="company-cell">
                            <div class="company-icon">
                                {{ row.name?.charAt(0) || 'C' }}
                            </div>
                            <span class="company-name">{{ row.name }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="owner" label="负责人" width="180">
                    <template #default="{ row }">
                        <div class="owner-cell">
                            <el-avatar :size="24" class="owner-avatar">{{ row.owner?.charAt(0) }}</el-avatar>
                            <span>{{ row.owner || '-' }}</span>
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
                <el-table-column prop="createTime" label="创建时间" width="200">
                    <template #default="{ row }">
                        <div class="time-cell">
                            <span>{{ row.createTime || '-' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" align="right" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="viewCompany(row)">查看</el-button>
                        <el-button link type="primary" @click="editCompany(row)">编辑</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import { listCompanies } from '@/api';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
const loading = ref(false);
const query = ref<any>({ keyword: '', status: null });

const filteredRows = computed(() => {
    const { keyword, status } = query.value;
    return rows.value.filter((r) => {
        const byKw = !keyword || 
            (r.name && r.name.toLowerCase().includes(keyword.toLowerCase())) ||
            (r.owner && r.owner.toLowerCase().includes(keyword.toLowerCase()));
        const bySt = (status === '' || status === null || status === undefined) || r.status === status;
        return byKw && bySt;
    });
});

const applyFilter = () => { /* computed实时生效 */ };
const resetFilter = () => { query.value = { keyword: '', status: null }; };

function viewCompany(row: any) {
    ElMessage.info('查看公司: ' + row.name);
}

function editCompany(row: any) {
    ElMessage.info('编辑公司: ' + row.name);
}

onMounted(async () => {
    loading.value = true;
    try {
        const resp = await listCompanies({ page: 1, pageSize: 100 });
        if (resp.data.code !== 200) {
            console.error('API返回错误:', resp.data.msg);
            rows.value = [];
            return;
        }
        const responseData = resp.data?.data || resp.data || {};
        const list = responseData.list || [];
        rows.value = list.map((c: any) => ({
            id: c.id || c.Id,
            name: c.name || c.Name || '未命名公司',
            owner: c.owner || c.Owner || '-',
            status: c.status ?? c.Status ?? 1,
            createTime: c.createTime || c.CreateTime || '-',
            statusText: (c.status ?? c.Status ?? 1) === 1 ? '正常' : '停用'
        }));
    } catch (error: any) {
        console.error('加载公司列表失败:', error);
        rows.value = [];
    } finally {
        loading.value = false;
    }
});

function loadData() {
    onMounted();
}
</script>

<style scoped>
.companies-page {
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
    flex-wrap: wrap;
    gap: 16px;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.search-input { width: 260px; }
.filter-select { width: 140px; }

.table-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 4px;
}

.companies-table {
    --el-table-border-color: #f3f4f6;
    --el-table-header-bg-color: #f9fafb;
}

.company-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.company-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
    box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.2);
}

.company-name {
    font-weight: 600;
    font-size: 15px;
    color: #1f2937;
}

.owner-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4b5563;
    font-size: 14px;
}

.owner-avatar {
    background: #eff6ff;
    color: #3b82f6;
    font-size: 12px;
    font-weight: 600;
}

.time-cell {
    color: #6b7280;
    font-size: 13px;
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

.status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}
.status-dot.success { background: #10b981; }
.status-dot.info { background: #6b7280; }
</style>
