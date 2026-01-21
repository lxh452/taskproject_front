<template>
  <div class="handovers-page">
    <!-- 页面头部 - Swiss Minimalism -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">审批管理</h1>
        <p class="page-desc">管理任务交接申请与审批流程</p>
      </div>
      <button class="btn-primary" @click="createHandover">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        发起审批
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.waitingConfirm }}</span>
          <span class="stat-label">待接收确认</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.pending }}</span>
          <span class="stat-label">待上级审批</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.approved }}</span>
          <span class="stat-label">已通过</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.rejected }}</span>
          <span class="stat-label">已拒绝</span>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input v-model="query.keyword" placeholder="搜索任务 / 人员..." class="search-input" />
        </div>
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
      <button class="btn-icon" @click="resetFilter">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/>
          <path d="M8 16H3v5"/>
        </svg>
      </button>
    </div>

    <!-- 交接卡片列表 -->
    <div class="content-area">
      <div v-if="loading" class="skeleton-grid">
        <div v-for="i in 4" :key="i" class="skeleton-card">
          <div class="skeleton-header"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w-70"></div>
            <div class="skeleton-line w-100"></div>
          </div>
        </div>
      </div>
      <template v-else>
        <div v-if="filteredRows.length > 0" class="handovers-grid">
          <div 
            v-for="row in filteredRows" 
            :key="row.id" 
            class="handover-card"
            :class="'status-' + row.statusType"
            @click="viewHandover(row)"
          >
            <div class="card-header">
              <span class="type-tag" :class="row.isNodeCompletion ? 'node' : (row.isLeaveRequest ? 'leave' : 'task')">
                {{ row.isNodeCompletion ? '节点审批' : (row.isLeaveRequest ? '离职' : '任务') }}
              </span>
              <span class="status-badge" :class="row.statusType">{{ row.statusText }}</span>
            </div>

            <h3 class="card-title">{{ row.task }}</h3>

            <div class="flow-visual">
              <div class="flow-node">
                <div class="flow-avatar from">{{ row.from?.charAt(0) }}</div>
                <span class="flow-name">{{ row.from }}</span>
              </div>
              <svg class="flow-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <div class="flow-node">
                <template v-if="row.isNodeCompletion">
                  <div class="flow-avatar audit node">审</div>
                  <span class="flow-name">{{ row.to || '待审批' }}</span>
                </template>
                <template v-else-if="!row.isLeaveRequest">
                  <div class="flow-avatar to">{{ row.to?.charAt(0) }}</div>
                  <span class="flow-name">{{ row.to }}</span>
                </template>
                <template v-else>
                  <div class="flow-avatar audit">审</div>
                  <span class="flow-name">待审批</span>
                </template>
              </div>
            </div>

            <div class="card-footer">
              <span class="time-info">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ row.time }}
              </span>
              <div class="action-btns">
                <button
                  v-if="!row.isLeaveRequest && !row.isNodeCompletion && row.status === 0 && row.toEmployeeId === currentEmployeeId"
                  class="action-btn success"
                  @click.stop="quickApprove(row)"
                >确认</button>
                <button
                  v-if="row.isNodeCompletion && row.status === 1"
                  class="action-btn success"
                  @click.stop="handleNodeApprove(row, true)"
                >通过</button>
                <button
                  v-if="row.isNodeCompletion && row.status === 1"
                  class="action-btn danger"
                  @click.stop="handleNodeApprove(row, false)"
                >拒绝</button>
                <button
                  v-if="!row.isNodeCompletion && row.status === 1 && row.approverId === currentEmployeeId"
                  class="action-btn warning"
                  @click.stop="quickApprove(row)"
                >审批</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 14l2 2 4-4"/>
          </svg>
          <p>暂无交接记录</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { listHandovers, getMyEmployee, approveTaskNodeCompletion } from '@/api';
import request from '@/utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';

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
    else if (type === 'to') byType = r.toEmployeeId === currentEmployeeId.value || r.approverId === currentEmployeeId.value;
    return byKw && bySt && byType;
  });
});

const resetFilter = () => { query.value = { keyword: '', status: null, type: null }; };
const createHandover = () => { router.push('/handovers/create'); };

async function navigateToTaskNode(taskNodeId: string) {
  try {
    const resp = await request({ url: '/tasknode/get', method: 'post', data: { taskNodeId } });
    if (resp.data.code === 200 && resp.data.data) {
      const taskNode = resp.data.data.taskNode || resp.data.data;
      const taskId = taskNode.taskId || taskNode.TaskID || taskNode.taskID;
      if (taskId) { router.push(`/tasks/detail/${taskId}`); return; }
    }
    ElMessage.warning('无法获取任务节点信息');
  } catch { ElMessage.error('获取任务节点信息失败'); }
}

function viewHandover(row: any) {
  if (row.isNodeCompletion && row.taskNodeId) navigateToTaskNode(row.taskNodeId);
  else router.push(`/handovers/detail/${row.id}`);
}

function quickApprove(row: any) { router.push(`/handovers/detail/${row.id}`); }

async function handleNodeApprove(row: any, approved: boolean) {
  try {
    const { value: comment } = await ElMessageBox.prompt(
      approved ? '确定要通过此任务节点的完成审批吗？' : '确定要拒绝此任务节点的完成审批吗？',
      approved ? '审批通过' : '审批拒绝',
      { confirmButtonText: '确定', cancelButtonText: '取消', inputType: 'textarea', inputPlaceholder: '请输入审批意见（可选）', inputValidator: () => true }
    ).catch(() => ({ value: '' }));

    let approvalId = row.approvalId || row.id;
    if (!approvalId && row.taskNodeId) {
      try {
        const nodeResp = await request({ url: '/tasknode/get', method: 'post', data: { taskNodeId: row.taskNodeId } });
        if (nodeResp.data.code === 200) {
          const approvals = nodeResp.data.data?.approvals || [];
          const pendingApproval = approvals.find((a: any) => a.approvalType === 0);
          if (pendingApproval) approvalId = pendingApproval.approvalId;
        }
      } catch { console.error('获取审批记录失败'); }
    }

    if (!approvalId) { ElMessage.error('无法找到审批记录，请刷新页面重试'); return; }

    const resp = await approveTaskNodeCompletion({ approvalId, approved: approved ? 1 : 2, comment: comment || '' });
    if (resp.data.code === 200) { ElMessage.success(approved ? '审批通过' : '审批已拒绝'); await loadData(); }
    else ElMessage.error(resp.data.msg || '审批失败');
  } catch (error: any) { if (error !== 'cancel') ElMessage.error('审批失败'); }
}

async function loadData() {
  loading.value = true;
  try {
    const meResp = await getMyEmployee();
    if (meResp.data.code === 200 && meResp.data.data) currentEmployeeId.value = meResp.data.data.id || meResp.data.data.Id || meResp.data.data.ID;

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
      const isNodeCompletion = h.approvalType === 'node_completion';
      let toName = h.toEmployeeName || h.toEmployeeId || '-';
      let toId = h.toEmployeeId || '';
      if (isLeaveRequest && h.approverId) { toName = h.approverName || h.approverId || '待审批'; toId = h.approverId; }
      return {
        id: h.handoverId || h.id,
        task: isLeaveRequest ? '离职审批' : (h.taskTitle || h.taskId || '-'),
        from: h.fromEmployeeName || h.fromEmployeeId || '-',
        fromEmployeeId: h.fromEmployeeId,
        to: isLeaveRequest ? toName : (h.toEmployeeName || h.toEmployeeId || '-'),
        toEmployeeId: isLeaveRequest ? toId : (h.toEmployeeId || ''),
        approverId: h.approverId || '',
        status: handoverStatus,
        statusText: statusInfo.text,
        statusType: statusInfo.type,
        time: h.handoverTime || h.createTime || '-',
        isLeaveRequest, isNodeCompletion,
        taskNodeId: h.taskNodeId || '',
      };
    });
  } catch { rows.value = []; }
  finally { loading.value = false; }
}

onMounted(() => { loadData(); });
</script>


<style scoped>
.handovers-page {
  padding: var(--space-6);
  background: var(--bg-secondary);
  min-height: 100vh;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.header-left { display: flex; flex-direction: column; gap: var(--space-1); }

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
}

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover { background: var(--color-primary-hover); }

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover { background: var(--bg-tertiary); color: var(--text-primary); }

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.warning { background: #FEF3C7; color: #D97706; }
.stat-icon.primary { background: var(--color-primary-light); color: var(--color-primary); }
.stat-icon.success { background: #D1FAE5; color: #059669; }
.stat-icon.danger { background: #FEE2E2; color: #DC2626; }

.stat-content { display: flex; flex-direction: column; gap: 2px; }
.stat-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary); line-height: 1; }
.stat-label { font-size: var(--font-size-xs); color: var(--text-muted); }

/* Filter Bar */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: var(--space-5);
}

.filter-left { display: flex; gap: var(--space-3); align-items: center; }

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  height: 36px;
}

.search-box svg { color: var(--text-muted); flex-shrink: 0; }

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  width: 180px;
}

.search-input::placeholder { color: var(--text-muted); }
.filter-select { width: 110px; }

/* Skeleton */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
}

.skeleton-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: var(--space-5);
}

.skeleton-header {
  height: 16px;
  width: 40%;
  background: linear-gradient(90deg, var(--border-light) 25%, var(--bg-secondary) 50%, var(--border-light) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: var(--space-4);
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-body { display: flex; flex-direction: column; gap: var(--space-3); }

.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, var(--border-light) 25%, var(--bg-secondary) 50%, var(--border-light) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-line.w-70 { width: 70%; }
.skeleton-line.w-100 { width: 100%; }

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Handovers Grid */
.handovers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
}

/* Handover Card with Status Left Line */
.handover-card {
  position: relative;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: var(--space-5);
  padding-left: calc(var(--space-5) + 3px);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.handover-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
}

.handover-card.status-info::before { background: #94A3B8; }
.handover-card.status-warning::before { background: #D97706; }
.handover-card.status-success::before { background: #059669; }
.handover-card.status-danger::before { background: #DC2626; }

.handover-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.type-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.type-tag.task { background: var(--color-primary-light); color: var(--color-primary); }
.type-tag.leave { background: #FEF3C7; color: #D97706; }
.type-tag.node { background: #D1FAE5; color: #059669; }

.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.status-badge.info { background: var(--bg-tertiary); color: var(--text-muted); }
.status-badge.warning { background: #FEF3C7; color: #D97706; }
.status-badge.success { background: #D1FAE5; color: #059669; }
.status-badge.danger { background: #FEE2E2; color: #DC2626; }

.card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-4) 0;
  line-height: 1.4;
}

/* Flow Visual */
.flow-visual {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.flow-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.flow-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.flow-avatar.from { background: #64748B; }
.flow-avatar.to { background: var(--color-primary); }
.flow-avatar.audit { background: #D97706; }
.flow-avatar.audit.node { background: #059669; }

.flow-name { font-size: var(--font-size-xs); color: var(--text-muted); }
.flow-arrow { color: var(--text-muted); opacity: 0.5; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-light);
}

.time-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.time-info svg { opacity: 0.6; }

.action-btns { display: flex; gap: var(--space-2); }

.action-btn {
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn.success { background: #D1FAE5; color: #059669; }
.action-btn.success:hover { background: #059669; color: #fff; }
.action-btn.warning { background: #FEF3C7; color: #D97706; }
.action-btn.warning:hover { background: #D97706; color: #fff; }
.action-btn.danger { background: #FEE2E2; color: #DC2626; }
.action-btn.danger:hover { background: #DC2626; color: #fff; }

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-12);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
}

.empty-state svg { opacity: 0.4; }
.empty-state p { font-size: var(--font-size-sm); margin: 0; }

/* Responsive */
@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .handovers-page { padding: var(--space-4); }

  .page-header {
    flex-direction: column;
    gap: var(--space-4);
    align-items: stretch;
  }

  .btn-primary { width: 100%; justify-content: center; }

  .stats-row { grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }

  .filter-bar {
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .filter-left {
    flex-direction: column;
    width: 100%;
  }

  .search-box, .filter-select { width: 100%; }
  .search-input { width: 100%; }

  .handovers-grid { grid-template-columns: 1fr; }

  .card-footer { flex-direction: column; gap: var(--space-3); align-items: stretch; }
  .action-btns { width: 100%; }
  .action-btn { flex: 1; text-align: center; }
}

/* Dark Mode */
html.dark-mode .stat-icon.warning { background: rgba(251, 191, 36, 0.15); color: #FBBF24; }
html.dark-mode .stat-icon.success { background: rgba(52, 211, 153, 0.15); color: #34D399; }
html.dark-mode .stat-icon.danger { background: rgba(248, 113, 113, 0.15); color: #F87171; }

html.dark-mode .type-tag.leave { background: rgba(251, 191, 36, 0.15); color: #FBBF24; }
html.dark-mode .type-tag.node { background: rgba(52, 211, 153, 0.15); color: #34D399; }

html.dark-mode .status-badge.warning { background: rgba(251, 191, 36, 0.15); color: #FBBF24; }
html.dark-mode .status-badge.success { background: rgba(52, 211, 153, 0.15); color: #34D399; }
html.dark-mode .status-badge.danger { background: rgba(248, 113, 113, 0.15); color: #F87171; }

html.dark-mode .action-btn.success { background: rgba(52, 211, 153, 0.15); color: #34D399; }
html.dark-mode .action-btn.warning { background: rgba(251, 191, 36, 0.15); color: #FBBF24; }
html.dark-mode .action-btn.danger { background: rgba(248, 113, 113, 0.15); color: #F87171; }

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .handover-card, .skeleton-header, .skeleton-line { animation: none; transition: none; }
}
</style>
