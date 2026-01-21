<template>
  <div class="my-approvals-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">待我审批</h1>
      <p class="page-subtitle">查看和处理需要我审批的事项</p>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="approval-tabs">
      <el-tab-pane name="handover">
        <template #label>
          <span class="tab-label">
            <el-icon><Switch /></el-icon>
            任务交接
            <el-badge v-if="handoverCount > 0" :value="handoverCount" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
      
      <el-tab-pane name="join">
        <template #label>
          <span class="tab-label">
            <el-icon><UserFilled /></el-icon>
            加入申请
            <el-badge v-if="joinCount > 0" :value="joinCount" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
      
      <el-tab-pane name="leave">
        <template #label>
          <span class="tab-label">
            <el-icon><Remove /></el-icon>
            离职审批
            <el-badge v-if="leaveCount > 0" :value="leaveCount" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
      
      <el-tab-pane name="completion">
        <template #label>
          <span class="tab-label">
            <el-icon><CircleCheck /></el-icon>
            任务完成
            <el-badge v-if="completionCount > 0" :value="completionCount" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- Content -->
    <div class="approval-content" v-loading="loading">
      <!-- Handover Approvals -->
      <div v-if="activeTab === 'handover'" class="approval-list">
        <div 
          v-for="item in handoverList" 
          :key="item.id" 
          class="approval-card"
        >
          <div class="approval-header">
            <div class="header-left">
              <h3 class="approval-title">{{ item.taskNodeName || item.taskTitle || '任务交接' }}</h3>
              <div class="approval-meta">
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(item.createTime) }}
                </span>
              </div>
            </div>
            <el-tag :type="getStatusType(item.status || item.handoverStatus)">
              {{ getStatusText(item.status || item.handoverStatus) }}
            </el-tag>
          </div>
          <div class="approval-body">
            <div class="approval-info">
              <div class="info-row">
                <span class="info-label">
                  <el-icon><User /></el-icon>
                  交接人：
                </span>
                <span class="info-value">{{ item.fromEmployeeName || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <el-icon><UserFilled /></el-icon>
                  接收人：
                </span>
                <span class="info-value">{{ item.toEmployeeName || '-' }}</span>
              </div>
              <div class="info-row" v-if="item.handoverReason || item.reason">
                <span class="info-label">
                  <el-icon><Document /></el-icon>
                  交接原因：
                </span>
                <span class="info-value">{{ item.handoverReason || item.reason || '-' }}</span>
              </div>
              <div class="info-row" v-if="item.handoverNote">
                <span class="info-label">
                  <el-icon><Memo /></el-icon>
                  备注：
                </span>
                <span class="info-value">{{ item.handoverNote }}</span>
              </div>
            </div>
          </div>
          <div v-if="(item.status === 0 || item.handoverStatus === 0)" class="approval-actions">
            <el-button type="success" @click="approveHandover(item, true)" :icon="Check">
              同意
            </el-button>
            <el-button type="danger" @click="approveHandover(item, false)" :icon="Close">
              拒绝
            </el-button>
          </div>
        </div>
        <el-empty v-if="handoverList.length === 0" description="暂无待审批的任务交接">
          <template #description>
            <p style="color: var(--text-secondary);">
              当前没有需要您审批的任务交接申请
            </p>
          </template>
        </el-empty>
      </div>

      <!-- Join Approvals -->
      <div v-if="activeTab === 'join'" class="approval-list">
        <div 
          v-for="item in joinList" 
          :key="item.id" 
          class="approval-card"
        >
          <div class="approval-header">
            <div class="header-left">
              <h3 class="approval-title">{{ item.realName || item.username }} 申请加入</h3>
              <div class="approval-meta">
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(item.createTime) }}
                </span>
              </div>
            </div>
            <el-tag :type="getStatusType(item.status)">
              {{ getStatusText(item.status) }}
            </el-tag>
          </div>
          <div class="approval-body">
            <div class="approval-info">
              <div class="info-row">
                <span class="info-label">
                  <el-icon><User /></el-icon>
                  用户名：
                </span>
                <span class="info-value">{{ item.username || '-' }}</span>
              </div>
              <div class="info-row" v-if="item.realName">
                <span class="info-label">
                  <el-icon><UserFilled /></el-icon>
                  真实姓名：
                </span>
                <span class="info-value">{{ item.realName }}</span>
              </div>
              <div class="info-row" v-if="item.inviteCode">
                <span class="info-label">
                  <el-icon><Key /></el-icon>
                  邀请码：
                </span>
                <span class="info-value">{{ item.inviteCode }}</span>
              </div>
              <div class="info-row" v-if="item.applyReason">
                <span class="info-label">
                  <el-icon><Document /></el-icon>
                  申请理由：
                </span>
                <span class="info-value">{{ item.applyReason }}</span>
              </div>
            </div>
          </div>
          <div v-if="item.status === 0" class="approval-actions">
            <el-button type="success" @click="showJoinApprovalDialog(item)" :icon="Check">
              同意
            </el-button>
            <el-button type="danger" @click="approveJoin(item, false)" :icon="Close">
              拒绝
            </el-button>
          </div>
        </div>
        <el-empty v-if="joinList.length === 0" description="暂无待审批的加入申请">
          <template #description>
            <p style="color: var(--text-secondary);">
              当前没有需要您审批的加入申请
            </p>
          </template>
        </el-empty>
      </div>

      <!-- Leave Approvals -->
      <div v-if="activeTab === 'leave'" class="approval-list">
        <el-empty description="离职审批功能即将上线" />
      </div>

      <!-- Completion Approvals -->
      <div v-if="activeTab === 'completion'" class="approval-list">
        <div 
          v-for="item in completionList" 
          :key="item.id" 
          class="approval-card"
        >
          <div class="approval-header">
            <div class="header-left">
              <h3 class="approval-title">{{ item.taskNodeName || '任务节点完成' }}</h3>
              <div class="approval-meta">
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(item.createTime) }}
                </span>
              </div>
            </div>
            <el-tag :type="getStatusType(item.status)">
              {{ getStatusText(item.status) }}
            </el-tag>
          </div>
          <div class="approval-body">
            <div class="approval-info">
              <div class="info-row" v-if="item.taskTitle">
                <span class="info-label">
                  <el-icon><Document /></el-icon>
                  所属任务：
                </span>
                <span class="info-value">{{ item.taskTitle }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <el-icon><User /></el-icon>
                  提交人：
                </span>
                <span class="info-value">{{ item.submitterName || '-' }}</span>
              </div>
              <div class="info-row" v-if="item.comment">
                <span class="info-label">
                  <el-icon><Memo /></el-icon>
                  备注：
                </span>
                <span class="info-value">{{ item.comment }}</span>
              </div>
            </div>
          </div>
          <div v-if="item.status === 0" class="approval-actions">
            <el-button type="success" @click="approveCompletion(item, true)" :icon="Check">
              同意
            </el-button>
            <el-button type="danger" @click="approveCompletion(item, false)" :icon="Close">
              拒绝
            </el-button>
          </div>
        </div>
        <el-empty v-if="completionList.length === 0" description="暂无待审批的任务完成">
          <template #description>
            <p style="color: var(--text-secondary);">
              当前没有需要您审批的任务完成申请
            </p>
          </template>
        </el-empty>
      </div>
    </div>

    <!-- Join Approval Dialog -->
    <el-dialog
      v-model="joinDialogVisible"
      title="审批加入申请"
      width="500px"
    >
      <el-form :model="joinForm" label-width="80px">
        <el-form-item label="部门">
          <el-select v-model="joinForm.departmentId" placeholder="请选择部门" style="width: 100%">
            <el-option 
              v-for="dept in departments" 
              :key="dept.id" 
              :label="dept.name" 
              :value="dept.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职位">
          <el-select v-model="joinForm.positionId" placeholder="请选择职位" style="width: 100%">
            <el-option 
              v-for="pos in positions" 
              :key="pos.id" 
              :label="pos.name" 
              :value="pos.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="joinForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="joinDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmJoinApproval">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Switch, UserFilled, Remove, CircleCheck, Clock, User, Document, Memo, Check, Close, Key } from '@element-plus/icons-vue';
import { getMyHandoverApprovals, approveHandover as approveHandoverAPI, getPendingJoinApplications, approveJoinApplication, getDepartmentList, getPositionList, getMyEmployee, getMyTaskNodeApprovals, approveTaskNodeCompletion } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';

// State
const activeTab = ref('handover');
const loading = ref(false);
const handoverList = ref<any[]>([]);
const joinList = ref<any[]>([]);
const leaveList = ref<any[]>([]);
const completionList = ref<any[]>([]);
const departments = ref<any[]>([]);
const positions = ref<any[]>([]);
const currentCompanyId = ref('');

// Join approval dialog
const joinDialogVisible = ref(false);
const currentJoinItem = ref<any>(null);
const joinForm = ref({
  departmentId: '',
  positionId: '',
  remark: '',
});

// Computed
const handoverCount = computed(() => handoverList.value.length); // Backend already filters
const joinCount = computed(() => joinList.value.filter(item => item.status === 0).length);
const leaveCount = computed(() => leaveList.value.filter(item => item.status === 0).length);
const completionCount = computed(() => completionList.value.length); // Backend already filters

// Methods
function getStatusType(status: number): string {
  if (status === 1) return 'success';
  if (status === 2) return 'danger';
  return 'warning';
}

function getStatusText(status: number): string {
  if (status === 1) return '已通过';
  if (status === 2) return '已拒绝';
  return '待审批';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

async function loadHandovers() {
  try {
    console.log('========== 开始加载交接审批 ==========');
    console.log('API路径: /api/handover/my-approvals');
    console.log('请求参数:', { page: 1, pageSize: 100 });
    
    const resp = await getMyHandoverApprovals({ page: 1, pageSize: 100 });
    
    console.log('========== 交接审批API完整响应 ==========');
    console.log('响应状态码:', resp.status);
    console.log('响应数据:', JSON.stringify(resp.data, null, 2));
    
    if (resp.data?.code === 200) {
      const data = resp.data?.data;
      // Backend already filters, no need for frontend filtering
      handoverList.value = data?.list || [];
      
      console.log('========== 交接审批数据 ==========');
      console.log('待审批数量:', handoverList.value.length);
      console.log('待审批详情:', JSON.stringify(handoverList.value, null, 2));
    } else {
      console.error('API返回错误:', resp.data?.msg || '未知错误');
    }
  } catch (error: any) {
    console.error('========== 加载交接审批失败 ==========');
    console.error('错误类型:', error?.name);
    console.error('错误信息:', error?.message);
    console.error('错误详情:', error);
    console.error('响应状态:', error?.response?.status);
    console.error('响应数据:', error?.response?.data);
    handoverList.value = [];
  }
}

async function loadJoinApplications() {
  try {
    console.log('========== 开始加载加入申请 ==========');
    console.log('API路径: /api/join/pending');
    console.log('请求参数:', { page: 1, pageSize: 100 });
    
    const resp = await getPendingJoinApplications({ page: 1, pageSize: 100 });
    
    console.log('========== 加入申请API完整响应 ==========');
    console.log('响应状态码:', resp.status);
    console.log('响应数据:', JSON.stringify(resp.data, null, 2));
    
    if (resp.data?.code === 200) {
      const data = resp.data?.data;
      joinList.value = data?.list || [];
      console.log('========== 加入申请数据解析 ==========');
      console.log('总记录数:', data?.total || 0);
      console.log('数据数量:', joinList.value.length);
      console.log('数据详情:', JSON.stringify(joinList.value, null, 2));
    } else {
      console.error('API返回错误:', resp.data?.msg || '未知错误');
    }
  } catch (error: any) {
    console.error('========== 加载加入申请失败 ==========');
    console.error('错误类型:', error?.name);
    console.error('错误信息:', error?.message);
    console.error('错误详情:', error);
    console.error('响应状态:', error?.response?.status);
    console.error('响应数据:', error?.response?.data);
    
    // Check if endpoint not implemented
    if (error?.response?.status === 404) {
      console.warn('⚠️ 加入申请接口未实现 (404)');
    }
    joinList.value = [];
  }
}

async function loadCompletionApprovals() {
  try {
    console.log('========== 开始加载任务完成审批 ==========');
    console.log('API路径: /api/checklist/my-approvals');
    console.log('请求参数:', { page: 1, pageSize: 100 });
    
    const resp = await getMyTaskNodeApprovals({ page: 1, pageSize: 100 });
    
    console.log('========== 任务完成审批API完整响应 ==========');
    console.log('响应状态码:', resp.status);
    console.log('响应数据:', JSON.stringify(resp.data, null, 2));
    
    if (resp.data?.code === 200) {
      const data = resp.data?.data;
      const allApprovals = data?.list || [];
      console.log('========== 任务完成审批数据解析 ==========');
      console.log('总记录数:', data?.total || 0);
      console.log('原始数据数量:', allApprovals.length);
      console.log('原始数据详情:', JSON.stringify(allApprovals, null, 2));
      
      // Filter only pending approvals (status === 0)
      completionList.value = allApprovals.filter((item: any) => item.status === 0);
      
      console.log('========== 筛选结果 ==========');
      console.log('待审批数量:', completionList.value.length);
      console.log('待审批详情:', JSON.stringify(completionList.value, null, 2));
      console.log('已完成/已拒绝数量:', allApprovals.length - completionList.value.length);
    } else {
      console.error('API返回错误:', resp.data?.msg || '未知错误');
    }
  } catch (error: any) {
    console.error('========== 加载任务完成审批失败 ==========');
    console.error('错误类型:', error?.name);
    console.error('错误信息:', error?.message);
    console.error('错误详情:', error);
    console.error('响应状态:', error?.response?.status);
    console.error('响应数据:', error?.response?.data);
    
    if (error?.response?.status === 404) {
      console.warn('⚠️ 任务完成审批接口未实现 (404)');
    }
    completionList.value = [];
  }
}

async function loadDepartments() {
  if (!currentCompanyId.value) {
    console.warn('没有公司ID，无法加载部门列表');
    return;
  }
  try {
    const resp = await getDepartmentList({ page: 1, pageSize: 100, companyId: currentCompanyId.value });
    console.log('部门列表API响应:', resp.data);
    if (resp.data?.code === 200) {
      const data = resp.data?.data;
      departments.value = (data?.list || []).map((dept: any) => ({
        id: dept.id,
        name: dept.departmentName || dept.name,
      }));
      console.log('部门列表:', departments.value);
    }
  } catch (error) {
    console.error('加载部门列表失败:', error);
    departments.value = [];
  }
}

async function loadPositions() {
  if (!currentCompanyId.value) {
    console.warn('没有公司ID，无法加载职位列表');
    return;
  }
  try {
    const resp = await getPositionList({ page: 1, pageSize: 100, departmentId: '' });
    console.log('职位列表API响应:', resp.data);
    if (resp.data?.code === 200) {
      const data = resp.data?.data;
      positions.value = (data?.list || []).map((pos: any) => ({
        id: pos.id,
        name: pos.positionName || pos.name,
      }));
      console.log('职位列表:', positions.value);
    }
  } catch (error) {
    console.error('加载职位列表失败:', error);
    positions.value = [];
  }
}

async function approveHandover(item: any, approved: boolean) {
  try {
    const action = approved ? '同意' : '拒绝';
    await ElMessageBox.confirm(`确定${action}此交接申请吗？`, '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const resp = await approveHandoverAPI({
      handoverId: item.id || item.handoverId,
      approved: approved ? 1 : 2,
    });

    if (resp.data.code === 200) {
      ElMessage.success(`${action}成功`);
      loadHandovers();
    } else {
      ElMessage.error(resp.data.msg || `${action}失败`);
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('审批交接失败:', error);
      ElMessage.error('网络错误，请稍后重试');
    }
  }
}

function showJoinApprovalDialog(item: any) {
  currentJoinItem.value = item;
  joinForm.value = {
    departmentId: '',
    positionId: '',
    remark: '',
  };
  joinDialogVisible.value = true;
}

async function confirmJoinApproval() {
  if (!joinForm.value.departmentId || !joinForm.value.positionId) {
    ElMessage.warning('请选择部门和职位');
    return;
  }

  try {
    const resp = await approveJoinApplication({
      applicationId: currentJoinItem.value.id,
      approved: true,
      departmentId: joinForm.value.departmentId,
      positionId: joinForm.value.positionId,
      remark: joinForm.value.remark,
    });

    if (resp.data.code === 200) {
      ElMessage.success('审批成功');
      joinDialogVisible.value = false;
      loadJoinApplications();
    } else {
      ElMessage.error(resp.data.msg || '审批失败');
    }
  } catch (error) {
    console.error('审批加入申请失败:', error);
    ElMessage.error('网络错误，请稍后重试');
  }
}

async function approveJoin(item: any, approved: boolean) {
  try {
    await ElMessageBox.confirm('确定拒绝此加入申请吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const resp = await approveJoinApplication({
      applicationId: item.id,
      approved: false,
    });

    if (resp.data.code === 200) {
      ElMessage.success('已拒绝');
      loadJoinApplications();
    } else {
      ElMessage.error(resp.data.msg || '操作失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('审批加入申请失败:', error);
      ElMessage.error('网络错误，请稍后重试');
    }
  }
}

async function approveCompletion(item: any, approved: boolean) {
  try {
    const action = approved ? '同意' : '拒绝';
    await ElMessageBox.confirm(`确定${action}此任务完成审批吗？`, '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const resp = await approveTaskNodeCompletion({
      approvalId: item.id || item.approvalId,
      approved: approved ? 1 : 2,
    });

    if (resp.data.code === 200) {
      ElMessage.success(`${action}成功`);
      loadCompletionApprovals();
    } else {
      ElMessage.error(resp.data.msg || `${action}失败`);
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('审批任务完成失败:', error);
      ElMessage.error('网络错误，请稍后重试');
    }
  }
}

async function loadData() {
  loading.value = true;
  try {
    console.log('========================================');
    console.log('========== 待我审批页面初始化 ==========');
    console.log('========================================');
    
    // 首先获取当前员工信息以获取公司ID
    console.log('========== 获取当前员工信息 ==========');
    console.log('API路径: /api/employee/me');
    
    const meResp = await getMyEmployee();
    
    console.log('员工信息响应:', JSON.stringify(meResp.data, null, 2));
    
    if (meResp.data?.code === 200) {
      const emp = meResp.data?.data || {};
      currentCompanyId.value = emp.companyId || emp.CompanyId || '';
      console.log('========== 员工信息解析 ==========');
      console.log('员工ID:', emp.id || emp.Id);
      console.log('员工姓名:', emp.realName || emp.RealName);
      console.log('公司ID:', currentCompanyId.value);
      console.log('部门ID:', emp.departmentId || emp.DepartmentId);
    }

    console.log('\n========== 开始并行加载所有审批数据 ==========\n');
    
    await Promise.all([
      loadHandovers(),
      loadJoinApplications(),
      loadCompletionApprovals(),
      loadDepartments(),
      loadPositions(),
    ]);
    
    console.log('\n========================================');
    console.log('========== 所有数据加载完成 ==========');
    console.log('========================================');
    console.log('交接审批待审批数:', handoverCount.value);
    console.log('加入申请待审批数:', joinCount.value);
    console.log('任务完成待审批数:', completionCount.value);
    console.log('========================================\n');
  } catch (error) {
    console.error('========== 加载数据失败 ==========');
    console.error('错误详情:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.my-approvals-page {
  padding: var(--space-6);
  background: var(--bg-page);
  min-height: calc(100vh - var(--header-height));
}

/* Header */
.page-header {
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.page-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Tabs */
.approval-tabs {
  margin-bottom: var(--space-4);
}

.tab-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tab-badge {
  margin-left: var(--space-1);
}

/* Content */
.approval-content {
  min-height: 400px;
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.approval-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
  cursor: default;
}

.approval-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  flex: 1;
}

.approval-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.approval-meta {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.meta-item .el-icon {
  font-size: 14px;
}

.approval-body {
  margin-bottom: var(--space-4);
}

.approval-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.info-row {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
}

.info-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  min-width: 100px;
  flex-shrink: 0;
}

.info-label .el-icon {
  font-size: 14px;
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  flex: 1;
  word-break: break-word;
}

.approval-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-color);
}

/* Responsive */
@media (max-width: 768px) {
  .my-approvals-page {
    padding: var(--space-4);
  }

  .approval-actions {
    flex-direction: column;
  }

  .approval-actions .el-button {
    width: 100%;
  }
}
</style>
