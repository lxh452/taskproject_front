<template>
  <div class="ai-assistant-container">
    <!-- 小圆球触发器 -->
    <button
      class="ai-bubble"
      :class="{ 'has-data': suggestion, 'loading': loading }"
      @click="togglePanel"
      :aria-label="loading ? '正在分析...' : (suggestion ? '点击查看工作建议' : 'AI 助手')"
      :aria-expanded="isExpanded"
      aria-haspopup="dialog"
    >
      <div class="bubble-icon" aria-hidden="true">
        <el-icon v-if="loading" class="loading-spin"><Loading /></el-icon>
        <el-icon v-else><MagicStick /></el-icon>
      </div>
      <div class="bubble-pulse" v-if="suggestion && !isExpanded" aria-hidden="true"></div>
    </button>

    <!-- 展开的面板 -->
    <transition name="panel-slide">
      <div
        v-if="isExpanded"
        class="ai-panel"
        role="dialog"
        aria-labelledby="ai-panel-title"
        aria-describedby="ai-panel-desc"
      >
        <div class="panel-header">
          <div class="header-left">
            <div class="ai-avatar" aria-hidden="true">
              <el-icon><MagicStick /></el-icon>
            </div>
            <div class="header-text">
              <h3 id="ai-panel-title">工作助手</h3>
              <p id="ai-panel-desc">{{ suggestion?.greeting || '为你智能规划今日工作' }}</p>
            </div>
          </div>
          <div class="header-actions">
            <el-button text :icon="Refresh" @click.stop="loadSuggestion" :loading="loading" aria-label="刷新建议" />
            <el-button text :icon="Close" @click.stop="isExpanded = false" aria-label="关闭面板" />
          </div>
        </div>

        <div class="panel-body" v-if="suggestion">
          <!-- AI分析 -->
          <div class="ai-analysis" v-if="suggestion.aiAnalysis">
            <el-icon aria-hidden="true"><InfoFilled /></el-icon>
            <span>{{ suggestion.aiAnalysis }}</span>
          </div>

          <!-- 今日重点 -->
          <section class="section" v-if="suggestion.todayFocus?.length" aria-labelledby="focus-title">
            <div class="section-title" id="focus-title">
              <el-icon aria-hidden="true"><Star /></el-icon>
              <span>今日重点</span>
            </div>
            <ul class="focus-list" role="list">
              <li v-for="(focus, index) in suggestion.todayFocus" :key="index" class="focus-item">
                <span class="focus-number" aria-hidden="true">{{ index + 1 }}</span>
                <span class="focus-text">{{ focus }}</span>
              </li>
            </ul>
          </section>

          <!-- 时间安排 -->
          <section class="section" v-if="suggestion.timeAllocation?.length" aria-labelledby="time-title">
            <div class="section-title" id="time-title">
              <el-icon aria-hidden="true"><Clock /></el-icon>
              <span>建议时间安排</span>
            </div>
            <ul class="time-blocks" role="list">
              <li
                v-for="(block, index) in suggestion.timeAllocation"
                :key="index"
                class="time-block"
              >
                <button
                  class="time-block-btn"
                  @click="goToTask(block.taskNodeId)"
                  :aria-label="`${block.timeRange} - ${block.taskName}`"
                >
                  <div class="time-range">{{ block.timeRange }}</div>
                  <div class="time-content">
                    <div class="task-name">{{ block.taskName }}</div>
                    <div class="task-meta">
                      <el-tag :type="getPriorityType(block.priority)" size="small">{{ block.priority }}</el-tag>
                      <span class="task-reason">{{ block.reason }}</span>
                    </div>
                  </div>
                </button>
              </li>
            </ul>
          </section>

          <!-- 待处理事项 -->
          <section class="section" v-if="suggestion.pendingApprovals?.length || suggestion.unreadNotices?.length" aria-labelledby="pending-title">
            <div class="section-title" id="pending-title">
              <el-icon aria-hidden="true"><Bell /></el-icon>
              <span>待处理</span>
              <el-badge :value="(suggestion.pendingApprovals?.length || 0) + (suggestion.unreadNotices?.length || 0)" class="section-badge" />
            </div>
            <ul class="pending-items" role="list">
              <li v-for="approval in suggestion.pendingApprovals" :key="approval.id" class="pending-item">
                <button class="pending-item-btn" @click="goToApproval(approval)" :aria-label="`待审批: ${approval.title}`">
                  <el-icon aria-hidden="true"><Document /></el-icon>
                  <span>{{ approval.title }}</span>
                  <el-tag type="warning" size="small">待审批</el-tag>
                </button>
              </li>
              <li v-for="notice in suggestion.unreadNotices?.slice(0, 3)" :key="notice.id" class="pending-item">
                <button class="pending-item-btn" @click="goToNotification(notice)" :aria-label="`通知: ${notice.title}`">
                  <el-icon aria-hidden="true"><Message /></el-icon>
                  <span>{{ notice.title }}</span>
                </button>
              </li>
            </ul>
          </section>

          <!-- 建议 -->
          <section class="section" v-if="suggestion.suggestions?.length" aria-labelledby="suggestions-title">
            <div class="section-title" id="suggestions-title">
              <el-icon aria-hidden="true"><Opportunity /></el-icon>
              <span>工作建议</span>
            </div>
            <ul class="suggestions-list" role="list">
              <li v-for="(sug, index) in suggestion.suggestions" :key="index" class="suggestion-item">
                <el-icon aria-hidden="true"><Right /></el-icon>
                <span>{{ sug }}</span>
              </li>
            </ul>
          </section>
        </div>

        <div class="panel-body" v-else-if="loading" aria-live="polite" aria-busy="true">
          <div class="loading-state">
            <el-icon class="loading-spin" aria-hidden="true"><Loading /></el-icon>
            <span>正在分析您的工作…</span>
          </div>
        </div>

        <div class="panel-body" v-else aria-live="polite">
          <div class="empty-state">
            <el-icon aria-hidden="true"><Warning /></el-icon>
            <span>暂无建议数据</span>
            <el-button size="small" @click="loadSuggestion">重新加载</el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <div v-if="isExpanded" class="panel-overlay" @click="isExpanded = false" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
  MagicStick, Loading, Refresh, Close, InfoFilled, Star, Clock,
  Bell, Document, Message, Opportunity, Right, Warning
} from '@element-plus/icons-vue';
import { getAiSuggestion } from '@/api';
import request from '@/utils/request';

const router = useRouter();
const isExpanded = ref(false);
const loading = ref(false);
const suggestion = ref<any>(null);

function togglePanel() {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value && !suggestion.value && !loading.value) {
    loadSuggestion();
  }
}

async function loadSuggestion() {
  loading.value = true;
  try {
    const resp = await getAiSuggestion();
    if (resp.data.code === 200) {
      suggestion.value = resp.data.data;
    } else {
      ElMessage.error(resp.data.msg || '获取建议失败');
    }
  } catch (error: any) {
    console.error('获取AI建议失败:', error);
  } finally {
    loading.value = false;
  }
}

function getPriorityType(priority: string) {
  const map: Record<string, string> = { '紧急': 'danger', '高': 'warning', '中': 'primary', '低': 'info' };
  return map[priority] || 'info';
}

function goToTask(taskNodeId: string) {
  if (taskNodeId) {
    isExpanded.value = false;
    navigateToTaskNode(taskNodeId);
  }
}

// 跳转到任务节点所属的任务详情
async function navigateToTaskNode(taskNodeId: string) {
  try {
    const resp = await request({ url: '/tasknode/get', method: 'post', data: { taskNodeId } });
    if (resp.data.code === 200 && resp.data.data) {
      const data = resp.data.data;
      const taskNode = data.taskNode || data;
      const taskId = taskNode.taskId || taskNode.TaskId || taskNode.taskID;
      if (taskId) {
        router.push(`/tasks/detail/${taskId}`);
        return;
      }
    }
    ElMessage.warning('无法获取任务节点信息');
  } catch (error) {
    console.error('获取任务节点失败:', error);
    ElMessage.error('获取任务节点信息失败');
  }
}

function goToApproval(approval: any) {
  isExpanded.value = false;
  router.push('/handovers');
}

function goToNotification(notice: any) {
  isExpanded.value = false;
  router.push('/notifications');
}

onMounted(() => {
  // 自动加载数据
  loadSuggestion();
});
</script>


<style scoped>
.ai-assistant-container {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* 小圆球 - 改为 button */
.ai-bubble {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  border: none;
  padding: 0;
}

.ai-bubble:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.ai-bubble:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

.ai-bubble.loading {
  animation: bubble-pulse 1.5s ease-in-out infinite;
}

/* 尊重用户的动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .ai-bubble.loading {
    animation: none;
  }

  .loading-spin {
    animation: none;
  }

  .bubble-pulse {
    animation: none;
    display: none;
  }

  .panel-slide-enter-active,
  .panel-slide-leave-active {
    transition: none;
  }

  .time-block-btn:hover,
  .pending-item-btn:hover {
    transform: none;
  }
}

@keyframes bubble-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.bubble-icon {
  color: #fff;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 脉冲动画 - 有数据时提示 */
.bubble-pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.4);
  animation: pulse-ring 2s ease-out infinite;
  pointer-events: none;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
}

/* 遮罩层 */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

/* 展开面板 */
.ai-panel {
  position: fixed;
  top: 80px;
  right: 24px;
  width: 400px;
  max-height: calc(100vh - 120px);
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  border-bottom: 1px solid var(--border-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.header-text h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.header-text p {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 4px;
}

/* 面板内容 */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

/* AI分析 */
.ai-analysis {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(124, 58, 237, 0.06) 100%);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.ai-analysis .el-icon {
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

/* 区块 */
.section {
  margin-bottom: 16px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.section-title .el-icon {
  color: var(--color-primary);
}

.section-badge {
  margin-left: auto;
}

/* 今日重点 */
.focus-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.focus-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-radius: 6px;
}

.focus-number {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.focus-text {
  font-size: 13px;
  color: var(--text-primary);
}

/* 时间安排 */
.time-blocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.time-block {
  list-style: none;
}

.time-block-btn {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-hover);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
  border: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.time-block-btn:hover {
  background: var(--bg-active);
  transform: translateX(4px);
}

.time-block-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.time-range {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
  min-width: 85px;
}

.time-content {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.task-reason {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 待处理 */
.pending-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.pending-item {
  list-style: none;
}

.pending-item-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 13px;
  color: var(--text-primary);
  border: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.pending-item-btn:hover {
  background: var(--bg-active);
}

.pending-item-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.pending-item-btn .el-icon {
  color: var(--text-muted);
}

.pending-item-btn span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 建议 */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.suggestion-item .el-icon {
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 3px;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--text-muted);
}

.loading-state .el-icon,
.empty-state .el-icon {
  font-size: 32px;
}

/* 面板动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 响应式 */
@media (max-width: 480px) {
  .ai-panel {
    right: 12px;
    left: 12px;
    width: auto;
    top: 70px;
    max-height: calc(100vh - 100px);
  }
}

/* 暗色模式 */
html.dark-mode .ai-panel {
  background: var(--bg-card);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

html.dark-mode .panel-header {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%);
}

html.dark-mode .ai-analysis {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%);
}
</style>
