<template>
    <div class="handovers-page">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-left">
                <h1 class="page-title">审批管理</h1>
                <p class="page-desc">管理任务交接申请与审批流程</p>
            </div>
            <el-button type="primary" :icon="Plus" @click="createHandover" class="create-btn">
                发起审批
            </el-button>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-icon warning">
                    <el-icon><User /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.waitingConfirm }}</div>
                    <div class="stat-label">待接收确认</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon primary">
                    <el-icon><Clock /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.pending }}</div>
                    <div class="stat-label">待上级审批</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon success">
                    <el-icon><CircleCheck /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.approved }}</div>
                    <div class="stat-label">已通过</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon default">
                    <el-icon><CircleClose /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.rejected }}</div>
                    <div class="stat-label">已拒绝</div>
                </div>
            </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
            <div class="filter-left">
                <el-input v-model="query.keyword" placeholder="搜索任务 / 人员..." clearable class="search-input" :prefix-icon="Search" />
                <el-select v-model="query.status" placeholder="状态" clearable class="filter-select">
                    <el-option label="待接收" :value="0" />
                    <el-option label="待审批" :value="1" />
                    <el-option label="已通过" :value="2" />
                    <el-option label="已拒绝" :value="3" />
                </el-select>
                <el-select v-model="query.type" placeholder="类型" clearable class="filter-select">
                    <el-option label="我发起的" value="from" />
                    <el-option label="待我审批" value="to" />
                </el-select>
            </div>
            <el-button :icon="Refresh" circle @click="resetFilter" />
        </div>
        
        <!-- 交接卡片列表 -->
        <div class="content-area">
            <el-skeleton :rows="3" animated v-if="loading" />
            <template v-else>
                <div v-if="filteredRows.length > 0" class="handovers-grid">
                    <div v-for="row in filteredRows" :key="row.id" class="handover-card" @click="viewHandover(row)">
                        <div class="card-header">
                            <div class="type-tag" :class="row.isLeaveRequest ? 'leave' : 'task'">
                                {{ row.isLeaveRequest ? '离职' : '任务' }}
                            </div>
                            <div class="status-badge" :class="row.statusType">
                                {{ row.statusText }}
                            </div>
                        </div>
                        
                        <div class="card-body">
                            <h3 class="card-title">{{ row.task }}</h3>
                            
                            <div class="flow-visual">
                                <div class="flow-node">
                                    <el-avatar :size="36" class="flow-avatar from">{{ row.from?.charAt(0) }}</el-avatar>
                                    <span class="flow-name">{{ row.from }}</span>
                                </div>
                                <div class="flow-arrow">
                                    <el-icon><Right /></el-icon>
                                </div>
                                <div class="flow-node">
                                    <template v-if="!row.isLeaveRequest">
                                        <el-avatar :size="36" class="flow-avatar to">{{ row.to?.charAt(0) }}</el-avatar>
                                        <span class="flow-name">{{ row.to }}</span>
                                    </template>
                                    <template v-else>
                                        <div class="audit-badge">审</div>
                                        <span class="flow-name">待审批</span>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <div class="card-footer">
                            <div class="time-info">
                                <el-icon><Calendar /></el-icon>
                                <span>{{ row.time }}</span>
                            </div>
                            <div class="action-btns">
                                <el-button 
                                    v-if="!row.isLeaveRequest && row.status === 0 && row.toEmployeeId === currentEmployeeId" 
                                    size="small" type="success" plain
                                    @click.stop="quickApprove(row)"
                                >确认</el-button>
                                <el-button 
                                    v-if="row.status === 1 && row.approverId === currentEmployeeId" 
                                    size="small" type="warning" plain
                                    @click.stop="quickApprove(row)"
                                >审批</el-button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <el-empty description="暂无交接记录" />
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Plus, Right, Clock, CircleCheck, CircleClose, User, Calendar } from '@element-plus/icons-vue';
import { listHandovers, getMyEmployee } from '@/api';
import { ElMessage } from 'element-plus';

const router = useRouter();
const rows = ref<any[]>([]);
const loading = ref(false);
const query = ref<any>({ keyword: '', status: null, type: null });
const currentEmployeeId = ref('');

const stats = computed(() => ({
    waitingConfirm: rows.value.filter(r => r.status === 0).length,
    pending: rows.value.filter(r => r.status === 1).length,
    approved: rows.value.filter(r => r.status === 2).length,
    rejected: rows.value.filter(r => r.status === 3).length,
}));

const filteredRows = computed(() => {
    const { keyword, status, type } = query.value;
    return rows.value.filter((r) => {
        const byKw = !keyword || 
            (r.task && r.task.toLowerCase().includes(keyword.toLowerCase())) || 
            (r.from && r.from.toLowerCase().includes(keyword.toLowerCase())) || 
            (r.to && r.to.toLowerCase().includes(keyword.toLowerCase()));
        const bySt = (status === '' || status === null || status === undefined) || r.status === status;
        let byType = true;
        if (type === 'from') byType = r.fromEmployeeId === currentEmployeeId.value;
        else if (type === 'to') byType = r.toEmployeeId === currentEmployeeId.value;
        return byKw && bySt && byType;
    });
});

const resetFilter = () => { query.value = { keyword: '', status: null, type: null }; };
const createHandover = () => { router.push('/handovers/create'); };
function viewHandover(row: any) { router.push(`/handovers/detail/${row.id}`); }
function quickApprove(row: any) { router.push(`/handovers/detail/${row.id}`); }

async function loadData() {
    loading.value = true;
    try {
        const meResp = await getMyEmployee();
        if (meResp.data.code === 200 && meResp.data.data) {
            currentEmployeeId.value = meResp.data.data.id || meResp.data.data.Id || meResp.data.data.ID;
        }

        const resp = await listHandovers({ page: 1, pageSize: 100 });
        if (resp.data.code !== 200) { ElMessage.error(resp.data.msg || '加载交接列表失败'); rows.value = []; return; }
        const list = resp.data?.data?.list || [];
        rows.value = list.map((h: any) => {
            const handoverStatus = h.handoverStatus ?? h.status ?? 0;
            const statusMap: Record<number, { text: string; type: string }> = {
                0: { text: '待接收确认', type: 'info' },
                1: { text: '待上级审批', type: 'warning' },
                2: { text: '已通过', type: 'success' },
                3: { text: '已拒绝', type: 'danger' },
            };
            const statusInfo = statusMap[handoverStatus] || { text: '未知', type: 'default' };
            const isLeaveRequest = !h.taskId || h.taskTitle === '离职审批';
            return {
                id: h.handoverId || h.id,
                task: isLeaveRequest ? '离职审批' : (h.taskTitle || h.taskId || '-'),
                from: h.fromEmployeeName || h.fromEmployeeId || '-',
                fromEmployeeId: h.fromEmployeeId,
                to: isLeaveRequest ? '待审批' : (h.toEmployeeName || h.toEmployeeId || '-'),
                toEmployeeId: h.toEmployeeId || '',
                approverId: h.approverId || '',
                status: handoverStatus,
                statusText: statusInfo.text,
                statusType: statusInfo.type,
                time: h.handoverTime || h.createTime || '-',
                isLeaveRequest,
            };
        });
    } catch (error: any) { console.error('加载交接列表失败:', error); rows.value = []; } 
    finally { loading.value = false; }
}

onMounted(() => { loadData(); });
</script>

<style scoped>
.handovers-page {
    padding: clamp(16px, 1.5vw, 24px);
    background: var(--bg-page);
    min-height: calc(100vh - clamp(56px, 8vh, 64px));
    width: 100%;
    box-sizing: border-box;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: clamp(16px, 1.5vw, 24px);
}

.page-title { font-size: clamp(20px, 1.5vw, 24px); font-weight: 700; color: var(--text-main); margin: 0 0 clamp(4px, 0.3vw, 8px); }
.page-desc { font-size: clamp(13px, 0.95vw, 15px); color: var(--text-secondary); margin: 0; }

.create-btn {
    height: clamp(36px, 2.5vw, 40px);
    padding: 0 clamp(16px, 1.3vw, 20px);
    border-radius: clamp(8px, 0.7vw, 10px);
    font-weight: 500;
    background: linear-gradient(135deg, var(--color-danger) 0%, #b91c1c 100%);
    border: none;
    box-shadow: 0 clamp(3px, 0.3vw, 4px) clamp(10px, 0.8vw, 12px) rgba(220, 38, 38, 0.25);
    color: #fff;
}

.stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(180px, 15vw, 240px), 1fr));
    gap: clamp(12px, 1.2vw, 20px);
    margin-bottom: clamp(16px, 1.5vw, 24px);
    width: 100%;
}

.stat-card {
    background: var(--bg-card);
    border-radius: clamp(10px, 0.8vw, 14px);
    padding: clamp(14px, 1.2vw, 20px);
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: clamp(12px, 1vw, 16px);
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
}

.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

.stat-icon {
    width: clamp(40px, 3vw, 48px);
    height: clamp(40px, 3vw, 48px);
    border-radius: clamp(8px, 0.7vw, 10px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(18px, 1.3vw, 22px);
}

.stat-icon.warning { background: var(--bg-hover); color: var(--color-warning); }
.stat-icon.primary { background: var(--bg-hover); color: var(--color-danger); }
.stat-icon.success { background: var(--bg-hover); color: var(--color-success); }
.stat-icon.default { background: var(--bg-hover); color: var(--text-muted); }

.stat-value { 
    font-size: clamp(20px, 1.7vw, 28px);
    font-weight: 700; 
    color: var(--text-main); 
    line-height: 1; 
}
.stat-label { 
    font-size: clamp(12px, 0.9vw, 14px);
    color: var(--text-secondary); 
    margin-top: clamp(3px, 0.3vw, 6px); 
}

.filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: clamp(12px, 1vw, 16px) clamp(16px, 1.3vw, 20px);
    background: var(--bg-card);
    border-radius: clamp(10px, 0.8vw, 12px);
    border: 1px solid var(--border-color);
    margin-bottom: clamp(16px, 1.5vw, 24px);
}

.filter-left { display: flex; gap: clamp(10px, 0.8vw, 12px); align-items: center; }
.search-input { width: clamp(180px, 13vw, 220px); }
.filter-select { width: clamp(100px, 8vw, 140px); }

.handovers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(clamp(300px, 22vw, 360px), 1fr));
    gap: clamp(12px, 1.2vw, 20px);
    width: 100%;
}

.handover-card {
    background: var(--bg-card);
    border-radius: clamp(12px, 0.9vw, 14px);
    border: 1px solid var(--border-color);
    padding: clamp(16px, 1.3vw, 20px);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
}

.handover-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.type-tag {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
}

.type-tag.task { background: var(--bg-hover); color: var(--color-danger); }
.type-tag.leave { background: var(--bg-hover); color: var(--color-warning); }

.status-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 20px;
}

.status-badge.info { background: var(--bg-hover); color: var(--text-secondary); }
.status-badge.warning { background: var(--bg-hover); color: var(--color-warning); }
.status-badge.success { background: var(--bg-hover); color: var(--color-success); }
.status-badge.danger { background: var(--bg-hover); color: var(--color-danger); }

.card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 16px;
    line-height: 1.4;
}

.flow-visual {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-hover);
    padding: 14px;
    border-radius: 10px;
}

.flow-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.flow-avatar.from { background: var(--text-muted); color: #fff; font-weight: 600; }
.flow-avatar.to { background: var(--color-danger); color: #fff; font-weight: 600; }

.audit-badge {
    width: 36px;
    height: 36px;
    background: var(--color-warning);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
}

.flow-name { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
.flow-arrow { color: var(--text-muted); font-size: 18px; }

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
}

.time-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
}

.empty-state {
    padding: 60px;
    background: var(--bg-card);
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

/* 响应式布局 - 保持比例 */
@media (max-width: 1024px) {
    .stats-row {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .handovers-grid {
        grid-template-columns: repeat(auto-fill, minmax(25vw, 1fr));
    }
}

@media (max-width: 768px) {
    .handovers-page {
        padding: 4vw;
    }
    
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 2vw;
    }
    
    .stats-row {
        grid-template-columns: 1fr;
        gap: 2vw;
    }
    
    .filter-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5vw;
    }
    
    .filter-left {
        flex-direction: column;
        width: 100%;
    }
    
    .search-input,
    .filter-select {
        width: 100%;
    }
    
    .handovers-grid {
        grid-template-columns: 1fr;
        gap: 3vw;
    }
}
</style>
