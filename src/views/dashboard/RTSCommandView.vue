<template>
  <div class="command-center">
    <!-- 顶部统计栏 -->
    <header class="command-header">
      <div class="header-metrics">
        <div class="metric-item">
          <span class="metric-value">{{ taskStats.total }}</span>
          <span class="metric-label">总任务</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <span class="metric-value metric-warning">{{ taskStats.pending }}</span>
          <span class="metric-label">待处理</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <span class="metric-value metric-info">{{ taskStats.inProgress }}</span>
          <span class="metric-label">进行中</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <span class="metric-value metric-success">{{ taskStats.completed }}</span>
          <span class="metric-label">已完成</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="router.push({ path: '/ai-task-creator', query: { mode: 'task' } })">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          <span>新建任务</span>
        </button>
        <button class="action-btn action-primary" @click="refreshData">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          <span>刷新</span>
        </button>
      </div>
    </header>

    <div class="command-body">
      <!-- 左侧任务列表面板 -->
      <aside class="task-list-panel" :class="{ collapsed: isTaskListCollapsed }">
        <!-- 加载中状态 -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 无权限状态 -->
        <div v-else-if="!isFounder" class="no-permission">
          <div class="permission-icon">🔒</div>
          <h4>权限不足</h4>
          <p>指挥模式仅对公司创始人开放</p>
        </div>

        <!-- 折叠状态：仅显示统计概览 -->
        <div v-else-if="isTaskListCollapsed" class="collapsed-view" @click="isTaskListCollapsed = false">
          <div class="collapsed-header">
            <h3>任务列表</h3>
            <span class="founder-badge">创始人</span>
            <button class="expand-btn" title="展开任务列表">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          <div class="collapsed-stats">
            <div class="stat-row">
              <span class="stat-dot total"></span>
              <span class="stat-label">总任务</span>
              <span class="stat-value">{{ taskStats.total }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-dot pending"></span>
              <span class="stat-label">待处理</span>
              <span class="stat-value warning">{{ taskStats.pending }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-dot progress"></span>
              <span class="stat-label">进行中</span>
              <span class="stat-value info">{{ taskStats.inProgress }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-dot completed"></span>
              <span class="stat-label">已完成</span>
              <span class="stat-value success">{{ taskStats.completed }}</span>
            </div>
          </div>
          <p class="drag-hint">点击展开查看任务详情</p>
        </div>

        <!-- 展开状态：显示完整任务列表 -->
        <template v-else>
          <div class="panel-header">
            <div class="header-title-row">
              <h3>任务列表</h3>
              <span class="founder-badge">创始人</span>
              <button class="collapse-btn" @click="isTaskListCollapsed = true" title="收起">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
            </div>
            <div class="filter-tabs">
              <button :class="{ active: taskFilter === 'all' }" @click="taskFilter = 'all'">全部</button>
              <button :class="{ active: taskFilter === 'pending' }" @click="taskFilter = 'pending'">待处理</button>
              <button :class="{ active: taskFilter === 'in_progress' }" @click="taskFilter = 'in_progress'">进行中</button>
              <button :class="{ active: taskFilter === 'completed' }" @click="taskFilter = 'completed'">已完成</button>
            </div>
          </div>
          <div class="task-list">
            <div
              v-for="task in filteredTasks"
              :key="task.id"
              class="task-item"
              :class="{ selected: selectedTask?.id === task.id, dragging: draggingTask?.id === task.id }"
              draggable="true"
              @click="selectTask(task)"
              @dragstart="handleDragStart($event, task)"
              @dragend="handleDragEnd"
            >
              <div class="task-item-header">
                <span class="task-status" :class="'status-' + task.status"></span>
                <span class="task-priority" :class="'priority-' + task.priority">{{ getPriorityLabel(task.priority) }}</span>
              </div>
              <h4 class="task-name">{{ task.name }}</h4>
              <div class="task-meta">
                <span v-if="task.assignee" class="task-assignee">{{ task.assignee }}</span>
                <span v-if="task.dueDate" class="task-due" :class="{ overdue: isOverdue(task.dueDate) }">{{ formatDate(task.dueDate) }}</span>
              </div>
              <div class="task-progress-bar" v-if="task.progress > 0">
                <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
              </div>
            </div>
            <div v-if="filteredTasks.length === 0" class="empty-list">
              <p>暂无任务</p>
            </div>
          </div>
        </template>
      </aside>

      <!-- 中间AI分析区域 -->
      <main class="ai-analysis-zone"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        :class="{ 'drag-over': isDragOver, 'has-task': analyzingTask }"
      >
        <!-- 空状态：等待拖入任务 -->
        <div v-if="!analyzingTask && !isAnalyzing" class="drop-zone">
          <div v-if="!isFounder" class="permission-hint">
            <div class="permission-icon-large">👑</div>
            <h3>指挥模式</h3>
            <p class="drop-desc">此模式仅对公司创始人开放</p>
            <p class="drop-features">创始人可查看所有任务并进行AI智能分析</p>
          </div>
          <template v-else>
            <div class="drop-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3>拖拽任务到此处</h3>
            <p class="drop-desc">展开左侧任务列表，拖拽任务到此处</p>
            <p class="drop-features">AI 将智能分析：任务节点 · 执行建议 · 风险评估 · 优化方案</p>
            <div class="quick-actions">
              <button class="quick-action-btn" @click="isTaskListCollapsed = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                展开任务列表
              </button>
            </div>
          </template>
        </div>

        <!-- 分析中状态 -->
        <div v-else-if="isAnalyzing" class="analyzing-state">
          <div class="analyzing-animation">
            <div class="pulse-ring"></div>
            <div class="pulse-ring delay-1"></div>
            <div class="pulse-ring delay-2"></div>
            <svg class="ai-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/>
              <path d="M8 14h8M9 18h6M12 14v8"/>
            </svg>
          </div>
          <h3>AI 正在分析...</h3>
          <p>{{ analyzeStep }}</p>
          <div class="analyze-progress">
            <div class="progress-fill" :style="{ width: analyzeProgress + '%' }"></div>
          </div>
        </div>

        <!-- 分析结果 -->
        <div v-else-if="analyzingTask" class="analysis-result">
          <div class="result-header">
            <div class="task-info">
              <span class="task-type-badge" :class="'type-' + analyzingTask.type">{{ getTypeLabel(analyzingTask.type) }}</span>
              <h2>{{ analyzingTask.name }}</h2>
            </div>
            <button class="close-btn" @click="clearAnalysis">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- 任务概览 -->
          <div class="result-section summary-section">
            <h4>任务概览</h4>
            <div class="summary-content">
              <p>{{ aiAnalysis.summary || '暂无摘要' }}</p>
            </div>
            <div class="summary-tags">
              <span class="tag" :class="'priority-' + analyzingTask.priority">{{ getPriorityLabel(analyzingTask.priority) }}</span>
              <span class="tag">进度 {{ analyzingTask.progress }}%</span>
              <span v-if="analyzingTask.assignee" class="tag">{{ analyzingTask.assignee }}</span>
            </div>
          </div>

          <!-- 当前重点 -->
          <div class="result-section focus-section" v-if="aiAnalysis.focusPoints?.length">
            <h4>当前重点</h4>
            <ul class="focus-list">
              <li v-for="(point, idx) in aiAnalysis.focusPoints" :key="idx">
                <span class="focus-icon">{{ idx + 1 }}</span>
                <span>{{ point }}</span>
              </li>
            </ul>
          </div>

          <!-- 任务节点 -->
          <div class="result-section nodes-section">
            <div class="section-header">
              <h4>任务节点</h4>
              <span class="node-count">{{ taskNodes.length }} 个节点</span>
            </div>
            <div v-if="taskNodes.length > 0" class="nodes-list">
              <div v-for="node in taskNodes" :key="node.id" class="node-item" :class="'status-' + node.status">
                <div class="node-status-indicator"></div>
                <div class="node-content">
                  <span class="node-name">{{ node.name }}</span>
                  <span class="node-assignee" v-if="node.assignee">{{ node.assignee }}</span>
                </div>
                <span class="node-progress">{{ node.progress || 0 }}%</span>
              </div>
            </div>
            <div v-else class="no-nodes">
              <p>该任务暂无节点</p>
              <button class="btn btn-primary" @click="showGenerateNodesDialog = true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                AI 智能生成节点
              </button>
            </div>
          </div>

          <!-- AI建议 -->
          <div class="result-section suggestions-section" v-if="aiAnalysis.suggestions?.length">
            <h4>AI 建议</h4>
            <div class="suggestions-list">
              <div v-for="(suggestion, idx) in aiAnalysis.suggestions" :key="idx" class="suggestion-item">
                <div class="suggestion-icon" :class="suggestion.type">
                  <svg v-if="suggestion.type === 'warning'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <svg v-else-if="suggestion.type === 'tip'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="suggestion-content">
                  <p>{{ suggestion.content }}</p>
                  <button v-if="suggestion.action" class="suggestion-action" @click="executeSuggestion(suggestion)">
                    {{ suggestion.actionLabel || '执行' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 任务清单 -->
          <div class="result-section checklist-section" v-if="taskChecklists.length > 0">
            <div class="section-header">
              <h4>任务清单</h4>
              <span class="checklist-progress">{{ completedChecklists }}/{{ taskChecklists.length }}</span>
            </div>
            <div class="checklist-list">
              <div v-for="item in taskChecklists.slice(0, 5)" :key="item.id" class="checklist-item" :class="{ completed: item.isCompleted }">
                <span class="check-icon">
                  <svg v-if="item.isCompleted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span v-else class="check-empty"></span>
                </span>
                <span class="checklist-content">{{ item.content }}</span>
              </div>
              <div v-if="taskChecklists.length > 5" class="more-items">
                还有 {{ taskChecklists.length - 5 }} 项...
              </div>
            </div>
          </div>

          <!-- 评论分类展示 -->
          <div class="result-section comments-section" v-if="taskComments.length > 0">
            <!-- 任务评论 -->
            <div v-if="taskCommentsCategorized.task.length > 0" class="comment-category">
              <h4 class="category-title">
                <span class="category-icon">📋</span>
                任务评论 ({{ taskCommentsCategorized.task.length }})
              </h4>
              <div class="comments-list">
                <div v-for="comment in taskCommentsCategorized.task.slice(0, 3)" :key="comment.id" class="comment-item">
                  <div class="comment-avatar">{{ getInitials(comment.authorName) }}</div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.authorName }}</span>
                      <span class="comment-time">{{ formatCommentTime(comment.createdAt) }}</span>
                    </div>
                    <p class="comment-text">{{ comment.content }}</p>
                  </div>
                </div>
              </div>
              <div v-if="taskCommentsCategorized.task.length > 3" class="more-comments">
                还有 {{ taskCommentsCategorized.task.length - 3 }} 条任务评论...
              </div>
            </div>

            <!-- 任务节点评论 -->
            <div v-if="taskCommentsCategorized.node.length > 0" class="comment-category">
              <h4 class="category-title">
                <span class="category-icon">📍</span>
                节点评论 ({{ taskCommentsCategorized.node.length }})
              </h4>
              <div class="comments-list">
                <div v-for="comment in taskCommentsCategorized.node.slice(0, 3)" :key="comment.id" class="comment-item">
                  <div class="comment-avatar">{{ getInitials(comment.authorName) }}</div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.authorName }}</span>
                      <span class="comment-time">{{ formatCommentTime(comment.createdAt) }}</span>
                    </div>
                    <p class="comment-text">{{ comment.content }}</p>
                  </div>
                </div>
              </div>
              <div v-if="taskCommentsCategorized.node.length > 3" class="more-comments">
                还有 {{ taskCommentsCategorized.node.length - 3 }} 条节点评论...
              </div>
            </div>

            <!-- 附件评论 -->
            <div v-if="taskCommentsCategorized.attachment.length > 0" class="comment-category">
              <h4 class="category-title">
                <span class="category-icon">📎</span>
                附件评论 ({{ taskCommentsCategorized.attachment.length }})
              </h4>
              <div class="comments-list">
                <div v-for="comment in taskCommentsCategorized.attachment.slice(0, 3)" :key="comment.id" class="comment-item">
                  <div class="comment-avatar">{{ getInitials(comment.authorName) }}</div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.authorName }}</span>
                      <span class="comment-time">{{ formatCommentTime(comment.createdAt) }}</span>
                      <span class="attachment-badge">📎 附件</span>
                    </div>
                    <p class="comment-text">{{ comment.content }}</p>
                  </div>
                </div>
              </div>
              <div v-if="taskCommentsCategorized.attachment.length > 3" class="more-comments">
                还有 {{ taskCommentsCategorized.attachment.length - 3 }} 条附件评论...
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="result-actions">
            <button class="btn btn-secondary" @click="viewTaskDetail">查看详情</button>
            <button class="btn btn-secondary" @click="openFlowDesignDialog" v-if="analyzingTask.status === 'pending'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              AI流程设计
            </button>
            <button class="btn btn-primary" @click="reanalyze">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              重新分析
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- 新建任务弹窗 -->
    <el-dialog v-model="showCreateTaskDialog" title="新建任务" width="600px" :append-to-body="true">
      <div class="create-task-form">
        <el-input v-model="newTaskInput" type="textarea" :rows="4" placeholder="请输入任务描述..." />
        <div class="form-actions">
          <el-button @click="polishNewTask" :loading="isPolishing">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
            AI 润色
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCreateTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="createTask" :disabled="!newTaskInput.trim()">创建</el-button>
      </template>
    </el-dialog>

    <!-- 任务润色弹窗 -->
    <el-dialog v-model="showPolishDialog" title="任务润色" width="700px" :append-to-body="true">
      <div class="polish-form">
        <el-input v-model="polishInput" type="textarea" :rows="6" placeholder="输入任务描述，AI将帮您优化..." />
        <div v-if="polishedResult" class="polished-result">
          <h4>润色结果</h4>
          <div class="result-content">{{ polishedResult }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPolishDialog = false">关闭</el-button>
        <el-button type="primary" @click="doPolish" :loading="isPolishing">开始润色</el-button>
      </template>
    </el-dialog>

    <!-- AI生成节点弹窗 -->
    <el-dialog v-model="showGenerateNodesDialog" title="AI 智能生成节点" width="650px" :append-to-body="true">
      <div class="generate-nodes-content">
        <p class="dialog-desc">AI 将根据任务描述自动生成推荐的任务节点列表</p>
        
        <!-- 节点类型图例 -->
        <div class="node-type-legend">
          <span class="legend-label">节点类型：</span>
          <div class="legend-items">
            <span class="legend-item"><span class="type-tag type-milestone">里程碑</span></span>
            <span class="legend-item"><span class="type-tag type-develop">开发</span></span>
            <span class="legend-item"><span class="type-tag type-test">测试</span></span>
            <span class="legend-item"><span class="type-tag type-doc">文档</span></span>
            <span class="legend-item"><span class="type-tag type-review">评审</span></span>
          </div>
        </div>

        <div v-if="generatedNodes.length > 0" class="generated-nodes-list">
          <div v-for="(node, idx) in generatedNodes" :key="idx" 
               class="generated-node-item" 
               :class="{ 'is-thinking': node.isThinking }">
            <div class="node-header">
              <el-checkbox v-model="node.selected" :disabled="node.isThinking">
                <span class="node-name">{{ node.name }}</span>
              </el-checkbox>
              <el-tag size="small" :type="getNodeTypeTag(node.nodeType).type" effect="light" class="node-type-tag">
                {{ getNodeTypeTag(node.nodeType).label }}
              </el-tag>
            </div>
            <div class="node-body">
              <p class="node-desc">{{ node.description || '暂无描述' }}</p>
              <div class="node-meta" v-if="node.estimatedDays || node.estimatedHours">
                <span class="meta-item">
                  <el-icon><Timer /></el-icon>
                  预计: {{ node.estimatedDays ? node.estimatedDays + '天' : (node.estimatedHours || 8) + '小时' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="isGeneratingNodes" class="generating-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在生成节点...</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showGenerateNodesDialog = false">取消</el-button>
        <el-button v-if="generatedNodes.length === 0" type="primary" @click="generateNodes" :loading="isGeneratingNodes">生成节点</el-button>
        <el-button v-else type="primary" @click="confirmGeneratedNodes">确认创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading, Share, Timer } from '@element-plus/icons-vue';
import {
  getMyTaskNodes, listTaskNodesByTask, getChecklistList,
  getTaskComments, polishTask, generateSubtasks, createTaskNode,
  listTasks, getMyEmployee, streamPolishTask, streamGenerateSubtasks,
  listEmployees
} from '@/api';
import { useUserStore } from '@/store/user';
import type { DashboardData } from './types';

interface TaskUnit {
  id: string;
  name: string;
  type: 'feature' | 'bug' | 'doc' | 'review';
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  assignee?: string;
  assigneeId?: string;
  dueDate?: string;
  taskId?: string;
  originalData?: any;
}

interface TaskNode {
  id: string;
  name: string;
  status: number;
  progress: number;
  assignee?: string;
}

interface AIAnalysis {
  summary: string;
  focusPoints: string[];
  suggestions: Array<{ type: string; content: string; action?: () => void; actionLabel?: string }>;
}

const emit = defineEmits(['refresh']);
const router = useRouter();
const userStore = useUserStore();
const dashboardData = inject<{ value: DashboardData }>('dashboardData');

// 状态
const allTasks = ref<TaskUnit[]>([]);
const taskFilter = ref('all');
const selectedTask = ref<TaskUnit | null>(null);
const draggingTask = ref<TaskUnit | null>(null);
const isDragOver = ref(false);
const isTaskListCollapsed = ref(true); // 默认折叠任务列表
const isFounder = ref(false); // 是否为创始人
const isLoading = ref(false); // 加载状态

// AI分析状态
const analyzingTask = ref<TaskUnit | null>(null);
const isAnalyzing = ref(false);
const analyzeStep = ref('');
const analyzeProgress = ref(0);
const aiAnalysis = ref<AIAnalysis>({ summary: '', focusPoints: [], suggestions: [] });
const taskNodes = ref<TaskNode[]>([]);
const taskChecklists = ref<any[]>([]);
const taskComments = ref<any[]>([]);

// 评论分类
const taskCommentsCategorized = computed(() => {
  const taskLevelComments = taskComments.value.filter(c => !c.taskNodeId && (!c.attachmentIds || c.attachmentIds.length === 0));
  const nodeComments = taskComments.value.filter(c => c.taskNodeId && (!c.attachmentIds || c.attachmentIds.length === 0));
  const attachmentComments = taskComments.value.filter(c => c.attachmentIds && c.attachmentIds.length > 0);
  
  return {
    task: taskLevelComments,
    node: nodeComments,
    attachment: attachmentComments
  };
});

// 弹窗状态
const showCreateTaskDialog = ref(false);
const showPolishDialog = ref(false);
const showGenerateNodesDialog = ref(false);
const newTaskInput = ref('');
const polishInput = ref('');
const polishedResult = ref('');
const isPolishing = ref(false);
const generatedNodes = ref<any[]>([]);
const isGeneratingNodes = ref(false);

// 计算属性 - 指挥官模式使用公司级别的统计数据（基于allTasks）
const taskStats = computed(() => ({
  total: allTasks.value.length,
  pending: allTasks.value.filter(t => t.status === 'pending').length,
  inProgress: allTasks.value.filter(t => t.status === 'in_progress').length,
  completed: allTasks.value.filter(t => t.status === 'completed').length
}));

const filteredTasks = computed(() => {
  if (taskFilter.value === 'all') return allTasks.value;
  return allTasks.value.filter(t => t.status === taskFilter.value);
});

const completedChecklists = computed(() => taskChecklists.value.filter(c => c.isCompleted).length);

// 数据转换 - 适配 Task 数据格式
function convertToTaskUnit(task: any): TaskUnit {
  const statusMap: Record<number, TaskUnit['status']> = { 0: 'pending', 1: 'in_progress', 2: 'completed' };
  const priorityMap: Record<number, TaskUnit['priority']> = { 1: 'critical', 2: 'high', 3: 'medium', 4: 'low' };
  // Task 数据结构字段
  const rawStatus = task.taskStatus ?? task.status ?? 0;
  const rawPriority = task.taskPriority ?? task.priority ?? 3;
  return {
    id: String(task.id || task.taskId || task.ID),
    name: task.taskTitle || task.title || task.name || '未命名任务',
    type: task.taskType || task.type || 'feature',
    status: typeof rawStatus === 'number' ? (statusMap[rawStatus] || 'pending') : rawStatus,
    priority: typeof rawPriority === 'number' ? (priorityMap[rawPriority] || 'medium') : rawPriority,
    progress: task.progress ?? task.taskProgress ?? 0,
    assignee: task.leaderName || task.assignee || task.executorName || '-',
    assigneeId: task.leaderId || task.assigneeId || task.executorId,
    dueDate: task.taskDeadline || task.deadline || task.dueDate,
    taskId: task.id || task.taskId,
    originalData: task
  };
}

// 检查用户权限
const currentEmployeeData = ref<any>(null);

async function checkPermission() {
  try {
    const res = await getMyEmployee();
    if (res?.data?.code === 200 && res.data.data) {
      const emp = res.data.data;
      currentEmployeeData.value = emp;
      // 检查是否为创始人
      isFounder.value = emp.isFounder === 1 ||
                        emp.positionCode === 'FOUNDER' ||
                        emp.roleTags?.includes('创始人') ||
                        false;
      return isFounder.value;
    }
    return false;
  } catch (e) {
    console.error('检查权限失败:', e);
    return false;
  }
}

// 加载任务 - 仅创始人可查看所有任务
async function loadTasks() {
  isLoading.value = true;
  try {
    // 先检查权限
    const hasPermission = await checkPermission();
    if (!hasPermission) {
      ElMessage.warning('指挥模式仅对公司创始人开放');
      allTasks.value = [];
      return;
    }

    // 创始人获取所有任务 - 传入 companyId 以获取公司所有任务
    const companyId = currentEmployeeData.value?.companyId || currentEmployeeData.value?.CompanyId;
    if (!companyId) {
      console.warn('无法获取公司ID，将只显示参与的任务');
    }
    const res = await listTasks({ page: 1, pageSize: 100, companyId });
    if (res?.data?.code === 200) {
      const data = res.data.data || {};
      const list = data.list || [];
      allTasks.value = list.map(convertToTaskUnit);
      console.log('已加载所有任务:', allTasks.value.length);
    }
  } catch (e) {
    console.error('加载任务失败:', e);
    ElMessage.error('加载任务失败');
  } finally {
    isLoading.value = false;
  }
}

// 辅助函数
function getPriorityLabel(p?: string) {
  return { critical: '紧急', high: '高', medium: '中', low: '低' }[p || ''] || '中';
}
function getStatusLabel(s?: string) {
  return { pending: '待处理', in_progress: '进行中', review: '审核中', completed: '已完成' }[s || ''] || '待处理';
}
// 节点类型标签
function getNodeTypeTag(type?: number) {
  const types: Record<number, { label: string; type: '' | 'success' | 'warning' | 'danger' | 'info' }> = {
    1: { label: '里程碑', type: 'danger' },
    2: { label: '开发', type: 'success' },
    3: { label: '测试', type: 'warning' },
    4: { label: '文档', type: 'info' },
    5: { label: '评审', type: '' }
  };
  return types[type || 2] || { label: '开发', type: 'success' };
}
function getTypeLabel(t?: string) {
  return { feature: '功能', bug: '缺陷', doc: '文档', review: '评审' }[t || ''] || '任务';
}
function getInitials(name?: string) { return name ? name.slice(0, 2).toUpperCase() : '?'; }
function formatDate(date?: string) {
  if (!date) return '';
  const d = new Date(date), now = new Date();
  const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '明天';
  if (days < 0) return Math.abs(days) + '天前';
  if (days <= 7) return days + '天后';
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
function formatCommentTime(date?: string) {
  if (!date) return '';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return mins + '分钟前';
  if (mins < 1440) return Math.floor(mins / 60) + '小时前';
  return new Date(date).toLocaleDateString('zh-CN');
}
function isOverdue(date?: string) { return date ? new Date(date) < new Date() : false; }

// 任务选择与拖拽
function selectTask(task: TaskUnit) { selectedTask.value = task; }
function handleDragStart(e: DragEvent, task: TaskUnit) {
  draggingTask.value = task;
  e.dataTransfer?.setData('text/plain', task.id);
}
function handleDragEnd() { draggingTask.value = null; }
function handleDragOver() { isDragOver.value = true; }
function handleDragLeave() { isDragOver.value = false; }
async function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;
  if (draggingTask.value) await analyzeTask(draggingTask.value);
  draggingTask.value = null;
}

// AI分析
async function analyzeTask(task: TaskUnit) {
  analyzingTask.value = task;
  isAnalyzing.value = true;
  analyzeProgress.value = 0;
  const steps = ['获取任务信息...', '加载任务节点...', '获取任务清单...', '获取评论记录...', 'AI 分析中...'];
  try {
    analyzeStep.value = steps[0]; analyzeProgress.value = 10;
    await new Promise(r => setTimeout(r, 200));

    analyzeStep.value = steps[1]; analyzeProgress.value = 30;
    // 使用任务的实际ID查询任务节点
    const taskId = task.id || task.taskId;
    console.log('查询任务节点, taskId:', taskId, '任务名称:', task.name);
    if (taskId) {
      try {
        const nodesRes = await listTaskNodesByTask({ taskId, page: 1, pageSize: 50 });
        console.log('任务节点查询结果:', nodesRes?.data);
        // 后端直接返回数组在 data 字段
        const nodeList = Array.isArray(nodesRes?.data?.data) ? nodesRes.data.data : [];
        console.log('原始任务节点数据:', nodeList);
        taskNodes.value = nodeList.map((n: any) => ({
          id: n.TaskNodeId || n.taskNodeId || n.id || n.task_node_id,
          name: n.NodeName || n.nodeName || n.name || n.node_name,
          status: n.NodeStatus ?? n.nodeStatus ?? n.status ?? n.node_status ?? 0,
          progress: n.Progress ?? n.progress ?? 0,
          assignee: n.ExecutorId || n.executorId || n.leaderId || n.LeaderId || n.executorName || n.leaderName || '-'
        }));
        console.log('解析后的任务节点:', taskNodes.value);
      } catch (e) { 
        console.error('查询任务节点失败:', e);
        taskNodes.value = []; 
      }
    }

    analyzeStep.value = steps[2]; analyzeProgress.value = 50;
    try {
      // 使用 taskId 查询任务清单（现在显示的是 Task 而非 TaskNode）
      const taskId = task.id || task.taskId;
      console.log('查询任务清单, taskId:', taskId);
      const checkRes = await getChecklistList({ taskNodeId: taskId, page: 1, pageSize: 50 });
      console.log('任务清单查询结果:', checkRes?.data);
      // 后端直接返回数组在 data 字段
      const checklistList = Array.isArray(checkRes?.data?.data) ? checkRes.data.data : [];
      console.log('原始清单数据:', checklistList);
      // 适配后端字段名（Go字段名首字母大写）
      taskChecklists.value = checklistList.map((c: any) => ({
        checklistId: c.ChecklistId || c.checklistId || c.checklist_id,
        taskNodeId: c.TaskNodeId || c.taskNodeId || c.task_node_id,
        content: c.Content || c.content,
        isCompleted: c.IsCompleted ?? c.isCompleted ?? c.is_completed ?? 0,
        completeTime: c.CompleteTime || c.completeTime || c.complete_time,
        sortOrder: c.SortOrder ?? c.sortOrder ?? c.sort_order ?? 0,
        createTime: c.CreateTime || c.createTime || c.create_time,
        creatorId: c.CreatorId || c.creatorId || c.creator_id
      }));
    } catch (e) {
      console.error('查询任务清单失败:', e);
      taskChecklists.value = [];
    }

    analyzeStep.value = steps[3]; analyzeProgress.value = 70;
    try {
      // 使用 taskId 查询任务评论（现在显示的是 Task 而非 TaskNode）
      const taskId = task.id || task.taskId;
      console.log('查询任务评论, taskId:', taskId);
      const commRes = await getTaskComments({ taskId, page: 1, pageSize: 10 });
      console.log('任务评论查询结果:', commRes?.data);
      const commentList = commRes?.data?.data?.list || commRes?.data?.list || [];
      console.log('原始评论数据:', commentList);
      // 适配后端字段名
      taskComments.value = commentList.map((c: any) => ({
        id: c.id || c.commentId || c.CommentID,
        authorName: c.employeeName || c.EmployeeName || c.authorName || c.userName || '匿名',
        content: c.content || c.Content,
        createdAt: c.createAt || c.CreateAt || c.createdAt || c.CreateTime,
        taskNodeId: c.taskNodeId || c.TaskNodeID || c.TaskNodeId,
        attachmentIds: c.attachmentIds || c.AttachmentIDs || c.AttachmentIds || []
      }));
    } catch (e) {
      console.error('查询任务评论失败:', e);
      taskComments.value = [];
    }

    analyzeStep.value = steps[4]; analyzeProgress.value = 90;
    generateAIAnalysis(task);
    analyzeProgress.value = 100;
  } catch (e) {
    console.error('Analysis failed:', e);
    ElMessage.error('分析失败');
  } finally { isAnalyzing.value = false; }
}

function generateAIAnalysis(task: TaskUnit) {
  const st = getStatusLabel(task.status), pr = getPriorityLabel(task.priority);
  let summary = '该任务状态为"' + st + '"，优先级"' + pr + '"，进度' + task.progress + '%。';
  if (taskNodes.value.length > 0) {
    const done = taskNodes.value.filter(n => n.status === 2).length;
    summary += '共' + taskNodes.value.length + '个节点，已完成' + done + '个。';
  }
  if (taskChecklists.value.length > 0) {
    summary += '清单' + completedChecklists.value + '/' + taskChecklists.value.length + '。';
  }
  aiAnalysis.value.summary = summary;

  const focus: string[] = [];
  if (task.status === 'pending') focus.push('任务尚未开始，建议尽快启动');
  if (task.priority === 'critical' || task.priority === 'high') focus.push('高优先级任务，需优先处理');
  if (isOverdue(task.dueDate)) focus.push('任务已逾期，需立即关注');
  if (taskNodes.value.length === 0 && task.status !== 'completed') focus.push('建议拆分任务节点');
  aiAnalysis.value.focusPoints = focus;

  const sugg: AIAnalysis['suggestions'] = [];
  if (task.status === 'pending' && taskNodes.value.length === 0) {
    sugg.push({ type: 'tip', content: '该任务暂无节点，建议AI智能生成', actionLabel: '生成节点', action: () => { showGenerateNodesDialog.value = true; } });
  }
  if (!task.assignee) {
    sugg.push({ type: 'warning', content: '任务未分配负责人', actionLabel: '分配', action: () => { router.push('/task/' + (task.taskId || task.id)); } });
  }
  if (task.progress > 80 && task.status !== 'completed') {
    sugg.push({ type: 'success', content: '任务即将完成，请检查是否可提交审核' });
  }
  aiAnalysis.value.suggestions = sugg;
}

function analyzeSelectedTask() { if (selectedTask.value) analyzeTask(selectedTask.value); }
function clearAnalysis() {
  analyzingTask.value = null;
  aiAnalysis.value = { summary: '', focusPoints: [], suggestions: [] };
  taskNodes.value = []; taskChecklists.value = []; taskComments.value = [];
}
function reanalyze() { if (analyzingTask.value) analyzeTask(analyzingTask.value); }
function executeSuggestion(s: any) { if (s.action) s.action(); }
function viewTaskDetail() {
  const t = analyzingTask.value || selectedTask.value;
  if (t) router.push('/task/' + (t.taskId || t.id));
}
function refreshData() { loadTasks(); emit('refresh'); }

// 新建任务
async function createTask() {
  if (!newTaskInput.value.trim()) return;
  router.push({ path: '/ai-task-creator', query: { desc: newTaskInput.value } });
  showCreateTaskDialog.value = false;
  newTaskInput.value = '';
}
async function polishNewTask() {
  if (!newTaskInput.value.trim()) return;
  isPolishing.value = true;
  let polishedContent = '';
  
  try {
    await new Promise<void>((resolve, reject) => {
      streamPolishTask(
        { rawDescription: newTaskInput.value },
        (event, data) => {
          if (event === 'chunk') {
            polishedContent += data.content || '';
            // 实时显示生成的内容
            newTaskInput.value = polishedContent;
          } else if (event === 'complete') {
            const result = data.result;
            if (result?.polishedTitle || result?.polishedDetail) {
              newTaskInput.value = result.polishedTitle + '\n' + (result.polishedDetail || '');
            }
            ElMessage.success('润色完成');
            resolve();
          } else if (event === 'error') {
            reject(new Error(data.message || '润色失败'));
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  } catch { 
    ElMessage.error('润色失败'); 
  } finally { 
    isPolishing.value = false; 
  }
}

// 任务润色
async function doPolish() {
  if (!polishInput.value.trim()) return;
  isPolishing.value = true;
  polishedResult.value = '';
  let contentBuffer = '';
  
  try {
    await new Promise<void>((resolve, reject) => {
      streamPolishTask(
        { rawDescription: polishInput.value },
        (event, data) => {
          if (event === 'chunk') {
            contentBuffer += data.content || '';
            polishedResult.value = contentBuffer;
          } else if (event === 'complete') {
            const result = data.result;
            polishedResult.value = result?.polishedDetail || result?.polishedTitle || contentBuffer || '润色完成';
            ElMessage.success('润色完成');
            resolve();
          } else if (event === 'error') {
            reject(new Error(data.message || '润色失败'));
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  } catch { 
    ElMessage.error('润色失败'); 
  } finally { 
    isPolishing.value = false; 
  }
}

// 生成节点 - 流式实时显示
async function generateNodes() {
  if (!analyzingTask.value) return;
  isGeneratingNodes.value = true;
  generatedNodes.value = [];
  let rawContent = '';
  let partialNodes: any[] = [];
  
  try {
    await new Promise<void>((resolve, reject) => {
      streamGenerateSubtasks(
        { taskDescription: analyzingTask.value.name },
        (event, data) => {
          if (event === 'chunk') {
            // 流式接收中，实时解析并显示
            rawContent += data.content || '';
            
            // 尝试从累积的内容中解析已完整的节点
            const parsed = tryParsePartialSubtasks(rawContent);
            if (parsed.length > partialNodes.length) {
              partialNodes = parsed;
            }
            
            // 实时更新显示，包括思考中的节点
            const displayNodes = partialNodes.map((n: any) => ({ 
              name: n.nodeName || n.title || '生成中...', 
              description: n.nodeDetail || n.description || '', 
              nodeType: n.nodeType || 2,
              selected: true 
            }));
            
            // 如果还没有生成完，显示一个"思考中"的占位节点
            if (displayNodes.length === 0 || !rawContent.includes(']')) {
              displayNodes.push({ 
                name: 'AI思考中...', 
                description: '正在拆解任务节点，请稍候', 
                nodeType: 1,
                selected: false,
                isThinking: true
              } as any);
            }
            
            generatedNodes.value = displayNodes;
          } else if (event === 'complete') {
            const subtasks = data.subtasks || [];
            if (subtasks.length > 0) {
              generatedNodes.value = subtasks.map((n: any) => ({ 
                name: n.nodeName || n.title || n.nodeName, 
                description: n.nodeDetail || n.description || '', 
                nodeType: n.nodeType || 2,
                estimatedHours: n.estimatedHours || 8,
                selected: true 
              }));
            } else if (partialNodes.length > 0) {
              // 使用已解析的部分节点
              generatedNodes.value = partialNodes.map((n: any) => ({ 
                name: n.nodeName || n.title, 
                description: n.nodeDetail || n.description || '', 
                nodeType: n.nodeType || 2,
                estimatedHours: n.estimatedHours || 8,
                selected: true 
              }));
            } else {
              // 使用默认节点
              generatedNodes.value = [
                { name: '需求分析', description: '分析任务需求', nodeType: 1, selected: true },
                { name: '方案设计', description: '设计实现方案', nodeType: 2, selected: true },
                { name: '开发实现', description: '编码实现功能', nodeType: 2, selected: true },
                { name: '测试验收', description: '测试并验收', nodeType: 3, selected: true }
              ];
            }
            resolve();
          } else if (event === 'error') {
            reject(new Error(data.message || '生成失败'));
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  } catch { 
    // 失败时使用默认节点
    if (generatedNodes.value.length === 0) {
      generatedNodes.value = [
        { name: '需求分析', description: '分析任务需求', selected: true },
        { name: '方案设计', description: '设计实现方案', selected: true },
        { name: '开发实现', description: '编码实现功能', selected: true },
        { name: '测试验收', description: '测试并验收', selected: true }
      ];
    }
    ElMessage.error('生成失败'); 
  } finally { 
    isGeneratingNodes.value = false; 
  }
}

// 尝试从部分JSON中解析子任务
function tryParsePartialSubtasks(content: string): any[] {
  try {
    // 尝试提取包含nodeName的完整对象
    const nodeMatches = content.match(/\{\s*"nodeName"[^}]+\}/g);
    if (nodeMatches) {
      return nodeMatches.map((match, index) => {
        try {
          const jsonStr = '{' + match.substring(1);
          const obj = JSON.parse(jsonStr);
          return { ...obj, id: index };
        } catch {
          return null;
        }
      }).filter(Boolean);
    }
    
    // 尝试提取包含 title 的完整对象（兼容旧格式）
    const titleMatches = content.match(/\{\s*"title"[^}]+\}/g);
    if (titleMatches) {
      return titleMatches.map((match, index) => {
        try {
          const jsonStr = '{' + match.substring(1);
          const obj = JSON.parse(jsonStr);
          return { 
            nodeName: obj.title,
            nodeDetail: obj.description,
            nodeType: 2,
            estimatedHours: obj.estimatedHours || 8,
            nodePriority: obj.nodePriority || obj.priority ? (obj.priority >= 4 ? 0 : obj.priority === 3 ? 1 : obj.priority === 2 ? 2 : 3) : 2,
            id: index 
          };
        } catch {
          return null;
        }
      }).filter(Boolean);
    }
    
    // 尝试匹配完整的 subtasks 数组
    const arrayMatch = content.match(/"subtasks"\s*:\s*(\[[\s\S]*?\])/);
    if (arrayMatch) {
      try {
        const jsonStr = '{"subtasks":' + arrayMatch[1] + '}';
        const parsed = JSON.parse(jsonStr);
        return (parsed.subtasks || []).map((s: any, index: number) => ({
          nodeName: s.nodeName || s.title,
          nodeDetail: s.nodeDetail || s.description,
          nodeType: s.nodeType || 2,
          estimatedHours: s.estimatedHours || 8,
          nodePriority: s.nodePriority || (s.priority ? (s.priority >= 4 ? 0 : s.priority === 3 ? 1 : s.priority === 2 ? 2 : 3) : 2),
          id: index
        }));
      } catch {
        // 数组可能不完整
      }
    }
  } catch (e) {
    // 解析失败，返回空数组
  }
  return [];
}
async function confirmGeneratedNodes() {
  // 过滤掉思考中的节点和未选中的节点
  const selected = generatedNodes.value.filter(n => n.selected && !n.isThinking);
  if (selected.length === 0) { ElMessage.warning('请至少选择一个节点'); return; }
  const taskId = analyzingTask.value?.taskId || analyzingTask.value?.originalData?.taskId;
  if (!taskId) { ElMessage.error('无法获取任务ID'); return; }
  
  // 获取当前用户信息和部门员工列表
  let departmentId = '';
  let leaderId = '';
  try {
    const empRes = await getMyEmployee();
    const emp = empRes?.data?.data;
    departmentId = emp?.departmentId || emp?.DepartmentId || '';
    leaderId = emp?.id || emp?.employeeId || '';
    
    // 获取部门员工列表，找到合适的leader
    const companyId = emp?.companyId || emp?.CompanyId || '';
    if (companyId && departmentId) {
      const empListRes = await listEmployees({ 
        page: 1, 
        pageSize: 100, 
        companyId, 
        departmentId 
      });
      const empList = empListRes?.data?.data?.list || empListRes?.data?.data || [];
      
      // 找部门经理作为leader，如果没有则使用当前用户
      const manager = empList.find((e: any) => 
        e.positionCode === 'MANAGER' || 
        e.positionCode === 'DEPT_MANAGER' ||
        e.positionLevel >= 5
      );
      if (manager) {
        leaderId = manager.id || manager.employeeId || leaderId;
      }
    }
  } catch (e) {
    console.error('获取部门员工信息失败:', e);
  }
  
  try {
    // 计算日期
    const now = new Date();
    const startTime = now.toISOString().split('T')[0];
    const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    for (const node of selected) {
      await createTaskNode({ 
        taskId, 
        nodeType: node.nodeType || 2, // 默认为开发任务
        nodeName: node.name, 
        nodeDetail: node.description || node.name,
        estimatedHours: node.estimatedHours || 8,
        nodePriority: node.nodePriority || 2, // 默认为中优先级
        departmentId: departmentId || undefined,
        leaderId: leaderId || undefined,
        nodeStartTime: startTime,
        nodeDeadline: deadline
      });
    }
    ElMessage.success('节点创建成功');
    showGenerateNodesDialog.value = false;
    generatedNodes.value = [];
    if (analyzingTask.value) analyzeTask(analyzingTask.value);
  } catch (error) { 
    console.error('创建节点失败:', error);
    ElMessage.error('创建失败'); 
  }
}

// AI 流程设计相关函数
async function openFlowDesignDialog() {
  ElMessage.info('流程设计器功能已移除');
}

function handleSchemeSelected(scheme: any) {
  console.log('选中方案:', scheme);
}

function navigateToDesigner(scheme: any) {
  ElMessage.info('流程设计器功能已移除');
}

// 智能流程设计器的新处理方法
async function handleApplySmartScheme(scheme: any) {
  ElMessage.info('流程设计器功能已移除');
}

function navigateToDesignerFromSmart(scheme: any) {
  ElMessage.info('流程设计器功能已移除');
}

async function handleApplyScheme(scheme: any) {
  ElMessage.info('流程设计器功能已移除');
}

onMounted(() => { loadTasks(); });
</script>

<style scoped>
.command-center { display: flex; flex-direction: column; height: 100%; min-height: calc(100vh - 120px); background: var(--bg-primary, #f8fafc); }
.command-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #fff; border-bottom: 1px solid var(--border-subtle, #e2e8f0); }
.header-metrics { display: flex; align-items: center; gap: 24px; }
.metric-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.metric-value { font-size: 24px; font-weight: 600; color: var(--text-primary, #1e293b); }
.metric-value.metric-warning { color: #f59e0b; }
.metric-value.metric-info { color: #3b82f6; }
.metric-value.metric-success { color: #10b981; }
.metric-label { font-size: 12px; color: var(--text-secondary, #64748b); }
.metric-divider { width: 1px; height: 32px; background: var(--border-subtle, #e2e8f0); }
.header-actions { display: flex; gap: 8px; }
.action-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid var(--border-subtle, #e2e8f0); background: #fff; border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--text-primary); transition: all 0.15s; }
.action-btn:hover { background: var(--bg-hover, #f1f5f9); }
.action-btn.action-primary { background: var(--color-primary, #3b82f6); color: #fff; border-color: transparent; }
.action-btn.action-primary:hover { background: #2563eb; }

.command-body { flex: 1; display: flex; gap: 20px; padding: 20px; overflow: hidden; }

/* 左侧任务列表 */
.task-list-panel { width: 320px; background: #fff; border-radius: 12px; border: 1px solid var(--border-subtle, #e2e8f0); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; transition: width 0.3s ease; }
.task-list-panel.collapsed { width: 180px; cursor: pointer; }
.task-list-panel.collapsed:hover { border-color: var(--color-primary, #3b82f6); }

/* 折叠视图样式 */
.collapsed-view { padding: 16px; display: flex; flex-direction: column; height: 100%; }
.collapsed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.collapsed-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
.expand-btn, .collapse-btn { padding: 4px; border: none; background: transparent; cursor: pointer; color: var(--text-secondary); border-radius: 4px; transition: all 0.15s; }
.expand-btn:hover, .collapse-btn:hover { background: var(--bg-hover, #f1f5f9); color: var(--color-primary, #3b82f6); }
.expand-btn svg { transform: rotate(0deg); }
.collapse-btn svg { transform: rotate(180deg); }

.collapsed-stats { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.stat-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.stat-dot.total { background: #3b82f6; }
.stat-dot.pending { background: #f59e0b; }
.stat-dot.progress { background: #3b82f6; }
.stat-dot.completed { background: #10b981; }
.stat-row .stat-label { flex: 1; color: var(--text-secondary); }
.stat-row .stat-value { font-weight: 600; color: var(--text-primary); }
.stat-row .stat-value.warning { color: #f59e0b; }
.stat-row .stat-value.info { color: #3b82f6; }
.stat-row .stat-value.success { color: #10b981; }
.drag-hint { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-subtle, #e2e8f0); font-size: 12px; color: var(--text-muted); text-align: center; }

/* 创始人徽章 */
.founder-badge { font-size: 10px; padding: 2px 6px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #fff; border-radius: 4px; font-weight: 500; }

/* 加载状态 */
.loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; color: var(--text-secondary); }
.loading-spinner { width: 32px; height: 32px; border: 3px solid var(--border-subtle, #e2e8f0); border-top-color: var(--color-primary, #3b82f6); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-state p { margin: 0; font-size: 13px; }

/* 权限不足状态 */
.no-permission { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; }
.permission-icon { font-size: 48px; margin-bottom: 16px; }
.no-permission h4 { margin: 0 0 8px 0; font-size: 15px; color: var(--text-primary); }
.no-permission p { margin: 0; font-size: 13px; color: var(--text-secondary); }

/* 展开视图头部 */
.header-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.header-title-row h3 { margin: 0; font-size: 15px; font-weight: 600; }

.panel-header { padding: 16px; border-bottom: 1px solid var(--border-subtle, #e2e8f0); }
.filter-tabs { display: flex; gap: 4px; }
.filter-tabs button { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; font-size: 12px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; }
.filter-tabs button:hover { background: var(--bg-hover, #f1f5f9); }
.filter-tabs button.active { background: var(--color-primary, #3b82f6); color: #fff; }
.task-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.task-item { padding: 12px; background: #fff; border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 8px; cursor: pointer; transition: all 0.15s; }
.task-item:hover { border-color: var(--color-primary, #3b82f6); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.task-item.selected { border-color: var(--color-primary, #3b82f6); background: #eff6ff; }
.task-item.dragging { opacity: 0.5; }
.task-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.task-status { width: 8px; height: 8px; border-radius: 50%; }
.task-status.status-pending { background: #f59e0b; }
.task-status.status-in_progress { background: #3b82f6; }
.task-status.status-completed { background: #10b981; }
.task-priority { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 500; }
.task-priority.priority-critical { background: #fef2f2; color: #dc2626; }
.task-priority.priority-high { background: #fffbeb; color: #d97706; }
.task-priority.priority-medium { background: #f0fdf4; color: #16a34a; }
.task-priority.priority-low { background: #f8fafc; color: #64748b; }
.task-name { margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: var(--text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.task-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); }
.task-due.overdue { color: #dc2626; }
.task-progress-bar { height: 3px; background: #e2e8f0; border-radius: 2px; margin-top: 8px; overflow: hidden; }
.task-progress-bar .progress-fill { height: 100%; background: var(--color-primary, #3b82f6); border-radius: 2px; }
.empty-list { padding: 40px 20px; text-align: center; color: var(--text-secondary); }

/* 中间AI分析区域 */
.ai-analysis-zone { flex: 1; background: #fff; border-radius: 12px; border: 2px dashed var(--border-subtle, #e2e8f0); display: flex; flex-direction: column; overflow: hidden; transition: all 0.2s; min-height: 500px; }
.ai-analysis-zone.drag-over { border-color: var(--color-primary, #3b82f6); background: #eff6ff; }
.ai-analysis-zone.has-task { border-style: solid; }
.drop-zone { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); padding: 40px; }
.drop-icon { margin-bottom: 24px; color: #cbd5e1; }
.drop-zone h3 { margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: var(--text-primary); }
.drop-zone .drop-desc { margin: 0 0 8px 0; font-size: 14px; color: var(--text-secondary); }
.drop-zone .drop-features { margin: 0 0 24px 0; font-size: 13px; color: var(--text-muted); }

.quick-actions { display: flex; gap: 12px; }
.quick-action-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: #fff; border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer; transition: all 0.15s; }
.quick-action-btn:hover { background: var(--bg-hover, #f1f5f9); border-color: var(--color-primary, #3b82f6); color: var(--color-primary, #3b82f6); }
.quick-action-btn svg { color: currentColor; }

/* 权限提示 */
.permission-hint { text-align: center; }
.permission-icon-large { font-size: 64px; margin-bottom: 20px; }
.permission-hint h3 { margin: 0 0 12px 0; font-size: 22px; color: var(--text-primary); }
.permission-hint .drop-desc { margin: 0 0 8px 0; font-size: 14px; color: var(--text-secondary); }
.permission-hint .drop-features { margin: 0; font-size: 13px; color: var(--text-muted); }

/* 分析中状态 */
.analyzing-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.analyzing-animation { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
.pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid var(--color-primary, #3b82f6); opacity: 0; animation: pulse 2s ease-out infinite; }
.pulse-ring.delay-1 { animation-delay: 0.5s; }
.pulse-ring.delay-2 { animation-delay: 1s; }
@keyframes pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
.ai-icon { color: var(--color-primary, #3b82f6); }
.analyzing-state h3 { margin: 0 0 8px 0; font-size: 18px; }
.analyzing-state p { margin: 0 0 16px 0; color: var(--text-secondary); }
.analyze-progress { width: 200px; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
.analyze-progress .progress-fill { height: 100%; background: var(--color-primary, #3b82f6); transition: width 0.3s; }

/* 分析结果 */
.analysis-result { flex: 1; overflow-y: auto; padding: 20px; }
.result-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-subtle); }
.task-info h2 { margin: 8px 0 0 0; font-size: 20px; font-weight: 600; }
.task-type-badge { font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 500; }
.task-type-badge.type-feature { background: #dbeafe; color: #1d4ed8; }
.task-type-badge.type-bug { background: #fee2e2; color: #dc2626; }
.close-btn { padding: 8px; border: none; background: transparent; cursor: pointer; color: var(--text-secondary); border-radius: 6px; }
.close-btn:hover { background: var(--bg-hover); }

.result-section { margin-bottom: 20px; padding: 16px; background: var(--bg-secondary, #f8fafc); border-radius: 8px; }
.result-section h4 { margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: var(--text-primary); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-header h4 { margin: 0; }

.summary-content p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-primary); }
.summary-tags { display: flex; gap: 8px; margin-top: 12px; }
.tag { font-size: 11px; padding: 4px 8px; border-radius: 4px; background: #e2e8f0; color: var(--text-secondary); }
.tag.priority-critical { background: #fef2f2; color: #dc2626; }
.tag.priority-high { background: #fffbeb; color: #d97706; }

.focus-list { margin: 0; padding: 0; list-style: none; }
.focus-list li { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; }
.focus-icon { width: 20px; height: 20px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.nodes-list { display: flex; flex-direction: column; gap: 8px; }
.node-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #fff; border-radius: 6px; border: 1px solid var(--border-subtle); }
.node-status-indicator { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
.node-item.status-0 .node-status-indicator { background: #f59e0b; }
.node-item.status-1 .node-status-indicator { background: #3b82f6; }
.node-item.status-2 .node-status-indicator { background: #10b981; }
.node-content { flex: 1; }
.node-name { font-size: 13px; font-weight: 500; }
.node-assignee { font-size: 11px; color: var(--text-secondary); margin-left: 8px; }
.node-progress { font-size: 12px; color: var(--text-secondary); }
.node-count { font-size: 12px; color: var(--text-secondary); }
.no-nodes { text-align: center; padding: 20px; }
.no-nodes p { margin: 0 0 12px 0; color: var(--text-secondary); }

.suggestions-list { display: flex; flex-direction: column; gap: 10px; }
.suggestion-item { display: flex; gap: 12px; padding: 12px; background: #fff; border-radius: 6px; }
.suggestion-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.suggestion-icon.warning { background: #fef3c7; color: #d97706; }
.suggestion-icon.tip { background: #dbeafe; color: #3b82f6; }
.suggestion-icon.success { background: #d1fae5; color: #059669; }
.suggestion-content { flex: 1; }
.suggestion-content p { margin: 0 0 8px 0; font-size: 13px; }
.suggestion-action { padding: 4px 12px; border: 1px solid var(--color-primary); background: transparent; color: var(--color-primary); border-radius: 4px; font-size: 12px; cursor: pointer; }
.suggestion-action:hover { background: var(--color-primary); color: #fff; }

.checklist-list { display: flex; flex-direction: column; gap: 6px; }
.checklist-item { display: flex; align-items: center; gap: 10px; padding: 8px; background: #fff; border-radius: 4px; }
.checklist-item.completed { opacity: 0.6; }
.checklist-item.completed .checklist-content { text-decoration: line-through; }
.check-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; color: #10b981; }
.check-empty { width: 14px; height: 14px; border: 2px solid #cbd5e1; border-radius: 3px; }
.checklist-content { font-size: 13px; }
.checklist-progress { font-size: 12px; color: var(--text-secondary); }
.more-items { font-size: 12px; color: var(--text-secondary); padding: 8px; text-align: center; }

.comments-list { display: flex; flex-direction: column; gap: 12px; }
.comment-item { display: flex; gap: 10px; }
.comment-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.comment-content { flex: 1; }
.comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center; }
.comment-author { font-size: 13px; font-weight: 500; }
.comment-time { font-size: 11px; color: var(--text-secondary); }
.comment-text { margin: 0; font-size: 13px; color: var(--text-secondary); }

/* 评论分类样式 */
.comment-category { margin-bottom: 16px; }
.comment-category:last-child { margin-bottom: 0; }
.category-title { display: flex; align-items: center; gap: 6px; margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.category-icon { font-size: 14px; }
.attachment-badge { font-size: 10px; padding: 2px 6px; background: #dbeafe; color: #1d4ed8; border-radius: 4px; margin-left: 8px; }
.more-comments { font-size: 12px; color: var(--text-secondary); padding: 8px; text-align: center; background: #fff; border-radius: 4px; margin-top: 8px; }

.result-actions { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid var(--border-subtle); margin-top: 20px; }

/* 右侧快捷操作 */
.quick-actions-panel { width: 280px; display: flex; flex-direction: column; gap: 16px; flex-shrink: 0; }
.panel-section { background: #fff; border-radius: 12px; border: 1px solid var(--border-subtle); padding: 16px; }
.panel-section h4 { margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.action-buttons { display: flex; flex-direction: column; gap: 8px; }
.quick-btn { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid var(--border-subtle); background: #fff; border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--text-primary); transition: all 0.15s; }
.quick-btn:hover { background: var(--bg-hover, #f1f5f9); border-color: var(--color-primary); }
.quick-btn svg { color: var(--color-primary); }

.selected-task-info h5 { margin: 0 0 12px 0; font-size: 14px; font-weight: 500; }
.task-details { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.detail-row { display: flex; justify-content: space-between; font-size: 12px; }
.detail-row .label { color: var(--text-secondary); }
.detail-row .value { font-weight: 500; }
.detail-row .value.overdue { color: #dc2626; }
.status-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; }
.status-badge.status-pending { background: #fef3c7; color: #d97706; }
.status-badge.status-in_progress { background: #dbeafe; color: #1d4ed8; }
.status-badge.status-completed { background: #d1fae5; color: #059669; }
.priority-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; }
.priority-badge.priority-critical { background: #fef2f2; color: #dc2626; }
.priority-badge.priority-high { background: #fffbeb; color: #d97706; }
.priority-badge.priority-medium { background: #f0fdf4; color: #16a34a; }
.priority-badge.priority-low { background: #f8fafc; color: #64748b; }
.task-actions { display: flex; gap: 8px; }

.ai-tips { background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); }
.tips-content p { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

/* 按钮 */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 16px; font-size: 13px; font-weight: 500; border-radius: 8px; border: none; cursor: pointer; transition: all 0.15s; }
.btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-primary { background: var(--color-primary, #3b82f6); color: #fff; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { background: var(--bg-secondary, #f1f5f9); color: var(--text-primary); }
.btn-secondary:hover { background: #e2e8f0; }

/* 弹窗 */
.create-task-form, .polish-form { display: flex; flex-direction: column; gap: 16px; }
.form-actions { display: flex; justify-content: flex-end; }
.polished-result { padding: 16px; background: var(--bg-secondary); border-radius: 8px; }
.polished-result h4 { margin: 0 0 8px 0; font-size: 13px; }
.result-content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
.generate-nodes-content .dialog-desc { margin: 0 0 12px 0; color: var(--text-secondary); font-size: 14px; }

/* 节点类型图例 */
.node-type-legend { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
.node-type-legend .legend-label { font-size: 12px; color: #64748b; font-weight: 500; }
.node-type-legend .legend-items { display: flex; gap: 8px; flex-wrap: wrap; }
.node-type-legend .legend-item { font-size: 11px; }
.type-tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.type-tag.type-milestone { background: #fef2f2; color: #dc2626; }
.type-tag.type-develop { background: #f0fdf4; color: #16a34a; }
.type-tag.type-test { background: #fffbeb; color: #d97706; }
.type-tag.type-doc { background: #f1f5f9; color: #475569; }
.type-tag.type-review { background: #eff6ff; color: #2563eb; }

/* 生成节点列表 */
.generated-nodes-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; }
.generated-node-item { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; transition: all 0.2s; }
.generated-node-item:hover { background: #f1f5f9; border-color: #cbd5e1; }
.generated-node-item.is-thinking { background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border-style: dashed; }
.generated-node-item .node-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.generated-node-item .node-name { font-weight: 500; color: #1e293b; }
.generated-node-item .node-type-tag { flex-shrink: 0; }
.generated-node-item .node-body { padding-left: 24px; }
.generated-node-item .node-desc { font-size: 12px; color: #64748b; margin: 0 0 6px 0; line-height: 1.4; }
.generated-node-item .node-meta { display: flex; gap: 12px; }
.generated-node-item .meta-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #94a3b8; }
.node-desc { font-size: 12px; color: var(--text-secondary); margin-left: auto; }
.generating-state { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 40px; color: var(--text-secondary); }

/* AI流程设计按钮 */
.quick-btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #fff; border-color: transparent; }
.quick-btn-primary:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-color: transparent; }
.quick-btn-primary .el-icon { color: #fff; }

/* AI流程设计弹窗 */
.flow-design-dialog :deep(.el-dialog__body) { padding: 0; }

/* 响应式 */
@media (max-width: 1200px) {
  .quick-actions-panel { width: 240px; }
}
@media (max-width: 992px) {
  .command-body { flex-direction: column; }
  .task-list-panel { width: 100%; max-height: 300px; }
  .quick-actions-panel { width: 100%; flex-direction: row; flex-wrap: wrap; }
  .panel-section { flex: 1; min-width: 200px; }
}
</style>
