<template>
    <div class="handovers-page">
        <!-- 页面标题 -->
        <div class="page-title-section">
            <div class="title-left">
                <h1>交接管理</h1>
                <span class="subtitle">管理任务交接申请与审批</span>
            </div>
            <el-button type="primary" :icon="Plus" @click="createHandover">发起交接</el-button>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
            <div class="stat-card waiting-confirm">
                <div class="stat-icon">
                    <el-icon><User /></el-icon>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ stats.waitingConfirm }}</span>
                    <span class="stat-label">待接收确认</span>
                </div>
            </div>
            <div class="stat-card pending">
                <div class="stat-icon">
                    <el-icon><Clock /></el-icon>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ stats.pending }}</span>
                    <span class="stat-label">待上级审批</span>
                </div>
            </div>
            <div class="stat-card approved">
                <div class="stat-icon">
                    <el-icon><CircleCheck /></el-icon>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ stats.approved }}</span>
                    <span class="stat-label">已通过</span>
                </div>
            </div>
            <div class="stat-card rejected">
                <div class="stat-icon">
                    <el-icon><CircleClose /></el-icon>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ stats.rejected }}</span>
                    <span class="stat-label">已拒绝</span>
                </div>
            </div>
        </div>

        <!-- 工具栏 -->
        <div class="toolbar">
            <div class="toolbar-left">
                <el-input 
                    v-model="query.keyword" 
                    placeholder="搜索任务/交出人/接收人" 
                    clearable 
                    class="search-input"
                    :prefix-icon="Search"
                />
                <el-select v-model="query.status" placeholder="状态筛选" clearable class="filter-select">
                    <el-option label="待接收确认" :value="0">
                        <span class="status-dot info"></span>待接收确认
                    </el-option>
                    <el-option label="待上级审批" :value="1">
                        <span class="status-dot warning"></span>待上级审批
                    </el-option>
                    <el-option label="已通过" :value="2">
                        <span class="status-dot success"></span>已通过
                    </el-option>
                    <el-option label="已拒绝" :value="3">
                        <span class="status-dot danger"></span>已拒绝
                    </el-option>
                </el-select>
                <el-select v-model="query.type" placeholder="类型筛选" clearable class="filter-select">
                    <el-option label="我发起的" value="from" />
                    <el-option label="待我审批" value="to" />
                </el-select>
            </div>
            <div class="toolbar-right">
                <el-button @click="resetFilter" plain :icon="Refresh">重置</el-button>
            </div>
        </div>
        
        <!-- 表格容器 -->
        <div class="table-container">
            <el-table 
                :data="filteredRows" 
                style="width: 100%" 
                v-loading="loading" 
                class="handovers-table" 
                :header-cell-style="{ background: '#f9fafb', color: '#6b7280', fontWeight: '600' }"
                @row-click="viewHandover"
            >
                <el-table-column prop="task" label="任务" min-width="220">
                    <template #default="{ row }">
                        <div class="task-cell">
                            <div class="task-icon-wrapper">
                                <el-icon><Document /></el-icon>
                            </div>
                            <span class="task-name">{{ row.task }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="from" label="交出人" width="160">
                    <template #default="{ row }">
                        <div class="employee-cell">
                            <el-avatar :size="28" class="employee-avatar from">{{ row.from?.charAt(0) }}</el-avatar>
                            <span>{{ row.from || '-' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column width="50" align="center">
                    <template #default>
                        <el-icon class="arrow-icon"><Right /></el-icon>
                    </template>
                </el-table-column>
                <el-table-column prop="to" label="接收人/审批人" width="160">
                    <template #default="{ row }">
                        <div class="employee-cell">
                            <el-avatar v-if="!row.isLeaveRequest" :size="28" class="employee-avatar to">{{ row.to?.charAt(0) }}</el-avatar>
                            <el-avatar v-else :size="28" class="employee-avatar to" style="background: #f59e0b;">审</el-avatar>
                            <span>{{ row.to || '-' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="statusText" label="状态" width="120" align="center">
                    <template #default="{ row }">
                        <div class="status-badge" :class="row.statusType">
                            {{ row.statusText }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="time" label="申请时间" width="170">
                    <template #default="{ row }">
                        <div class="time-cell">
                            <el-icon><Calendar /></el-icon>
                            <span>{{ row.time || '-' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="reason" label="原因" min-width="180" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span class="reason-text">{{ row.reason || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="140" align="right" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click.stop="viewHandover(row)">查看</el-button>
                        <el-button 
                            v-if="!row.isLeaveRequest && row.status === 0 && row.toEmployeeId === currentEmployeeId" 
                            link 
                            type="success" 
                            @click.stop="quickApprove(row)"
                        >
                            确认
                        </el-button>
                        <el-button 
                            v-if="row.status === 1 && row.approverId === currentEmployeeId" 
                            link 
                            type="warning" 
                            @click.stop="quickApprove(row)"
                        >
                            审批
                        </el-button>
                        <el-button 
                            v-if="row.isLeaveRequest && row.status === 0 && row.fromEmployeeId === currentEmployeeId" 
                            link 
                            type="primary" 
                            @click.stop="quickApprove(row)"
                        >
                            确认离职
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 空状态 -->
            <div v-if="!loading && filteredRows.length === 0" class="empty-state">
                <el-icon class="empty-icon"><FolderOpened /></el-icon>
                <p>暂无交接记录</p>
                <el-button type="primary" @click="createHandover">发起交接</el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
    Search, Refresh, Document, Right, Plus, 
    Clock, CircleCheck, CircleClose, User,
    Calendar, FolderOpened
} from '@element-plus/icons-vue';
import { listHandovers, getMyEmployee } from '@/api';
import { ElMessage } from 'element-plus';

const router = useRouter();
const rows = ref<any[]>([]);
const loading = ref(false);
const query = ref<any>({ keyword: '', status: null, type: null });
const currentEmployeeId = ref('');

const stats = computed(() => {
    const waitingConfirm = rows.value.filter(r => r.status === 0).length;
    const pending = rows.value.filter(r => r.status === 1).length;
    const approved = rows.value.filter(r => r.status === 2).length;
    const rejected = rows.value.filter(r => r.status === 3).length;
    return {
        waitingConfirm,
        pending,
        approved,
        rejected,
        total: rows.value.length
    };
});

const filteredRows = computed(() => {
    const { keyword, status, type } = query.value;
    return rows.value.filter((r) => {
        const byKw = !keyword || 
            (r.task && r.task.toLowerCase().includes(keyword.toLowerCase())) || 
            (r.from && r.from.toLowerCase().includes(keyword.toLowerCase())) || 
            (r.to && r.to.toLowerCase().includes(keyword.toLowerCase()));
        const bySt = (status === '' || status === null || status === undefined) || r.status === status;
        let byType = true;
        if (type === 'from') {
            byType = r.fromEmployeeId === currentEmployeeId.value;
        } else if (type === 'to') {
            byType = r.toEmployeeId === currentEmployeeId.value;
        }
        return byKw && bySt && byType;
    });
});

const resetFilter = () => { query.value = { keyword: '', status: null, type: null }; };

const createHandover = () => {
    router.push('/handovers/create');
};

function viewHandover(row: any) {
    router.push(`/handovers/detail/${row.id}`);
}

function quickApprove(row: any) {
    router.push(`/handovers/detail/${row.id}`);
}

async function loadData() {
    loading.value = true;
    try {
        // 获取当前用户（使用id而不是employeeId，id是员工主键）
        const meResp = await getMyEmployee();
        if (meResp.data.code === 200 && meResp.data.data) {
            currentEmployeeId.value = meResp.data.data.id || meResp.data.data.Id || meResp.data.data.ID;
        }

        const resp = await listHandovers({ page: 1, pageSize: 100 });
        if (resp.data.code !== 200) {
            ElMessage.error(resp.data.msg || '加载交接列表失败');
            rows.value = [];
            return;
        }
        const responseData = resp.data?.data || resp.data || {};
        const list = responseData.list || [];
        rows.value = list.map((h: any) => {
            const handoverStatus = h.handoverStatus ?? h.HandoverStatus ?? h.status ?? h.Status ?? 0;
            // 状态映射: 0=待接收确认, 1=待上级审批, 2=已通过, 3=已拒绝
            const statusMap: Record<number, { text: string; type: string }> = {
                0: { text: '待接收确认', type: 'info' },
                1: { text: '待上级审批', type: 'warning' },
                2: { text: '已通过', type: 'success' },
                3: { text: '已拒绝', type: 'danger' },
            };
            const statusInfo = statusMap[handoverStatus] || { text: '未知', type: 'default' };
            // 判断是否是离职申请（taskId为空或taskTitle为"离职审批"）
            const isLeaveRequest = !h.taskId && !h.TaskId || h.taskTitle === '离职审批' || h.TaskTitle === '离职审批';
            const taskDisplay = isLeaveRequest ? '离职审批' : (h.taskTitle || h.TaskTitle || h.taskId || h.TaskId || '-');
            
            return {
                id: h.handoverId || h.HandoverId || h.id || h.Id,
                task: taskDisplay,
                from: h.fromEmployeeName || h.FromEmployeeName || h.fromEmployeeId || h.FromEmployeeId || '-',
                fromEmployeeId: h.fromEmployeeId || h.FromEmployeeId,
                to: isLeaveRequest ? '待审批' : (h.toEmployeeName || h.ToEmployeeName || h.toEmployeeId || h.ToEmployeeId || '-'),
                toEmployeeId: h.toEmployeeId || h.ToEmployeeId || '',
                approverId: h.approverId || h.ApproverId || '',
                status: handoverStatus,
                statusText: statusInfo.text,
                statusType: statusInfo.type,
                time: h.handoverTime || h.HandoverTime || h.createTime || h.CreateTime || '-',
                reason: h.handoverReason || h.HandoverReason || h.handoverNote || h.HandoverNote || '-',
                isLeaveRequest: isLeaveRequest, // 标记是否是离职申请
            };
        });
    } catch (error: any) {
        console.error('加载交接列表失败:', error);
        ElMessage.error('加载交接列表失败');
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
.handovers-page {
    padding: 24px;
    background: #f5f7fa;
    min-height: calc(100vh - 64px);
}

/* 页面标题 */
.page-title-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.title-left h1 {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
}

.subtitle {
    font-size: 14px;
    color: #6b7280;
}

/* 统计卡片 */
.stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.stat-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.stat-card.pending .stat-icon {
    background: #fef3c7;
    color: #f59e0b;
}

.stat-card.approved .stat-icon {
    background: #d1fae5;
    color: #10b981;
}

.stat-card.rejected .stat-icon {
    background: #fee2e2;
    color: #ef4444;
}

.stat-card.waiting-confirm .stat-icon {
    background: #e0f2fe;
    color: #0284c7;
}

.stat-info {
    display: flex;
    flex-direction: column;
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

/* 工具栏 */
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

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-input {
    width: 260px;
}

.filter-select {
    width: 140px;
}

/* 表格容器 */
.table-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 4px;
}

.handovers-table {
    --el-table-border-color: #f3f4f6;
    --el-table-header-bg-color: #f9fafb;
}

.handovers-table :deep(.el-table__row) {
    cursor: pointer;
}

.handovers-table :deep(.el-table__row:hover) {
    background-color: #f8fafc;
}

.task-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.task-icon-wrapper {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6366f1;
}

.task-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
}

.employee-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #4b5563;
    font-size: 14px;
}

.employee-avatar {
    font-size: 12px;
    font-weight: 600;
}

.employee-avatar.from { 
    background: linear-gradient(135deg, #fca5a5, #f87171);
    color: #fff;
}

.employee-avatar.to { 
    background: linear-gradient(135deg, #6ee7b7, #34d399);
    color: #fff;
}

.arrow-icon {
    color: #9ca3af;
    font-size: 16px;
}

.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
}

.status-badge.success { background: #ecfdf5; color: #10b981; }
.status-badge.warning { background: #fffbeb; color: #f59e0b; }
.status-badge.danger { background: #fef2f2; color: #ef4444; }
.status-badge.info { background: #e0f2fe; color: #0284c7; }
.status-badge.default { background: #f3f4f6; color: #6b7280; }

.status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}
.status-dot.success { background: #10b981; }
.status-dot.warning { background: #f59e0b; }
.status-dot.danger { background: #ef4444; }
.status-dot.info { background: #0284c7; }

.time-cell {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #6b7280;
    font-size: 13px;
}

.time-cell .el-icon {
    font-size: 14px;
    color: #9ca3af;
}

.reason-text {
    color: #6b7280;
    font-size: 13px;
}

/* 空状态 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #9ca3af;
}

.empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    color: #d1d5db;
}

.empty-state p {
    margin: 0 0 20px;
    font-size: 15px;
}

:deep(.el-button--primary) {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
}

:deep(.el-button--primary:hover) {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
}
</style>
