<template>
    <div class="task-detail-page">
        <!-- 顶部英雄区域 -->
        <div class="hero-section" :style="heroGradient">
            <div class="hero-content">
                <el-button link @click="goBack" class="back-btn">
                            <el-icon><ArrowLeft /></el-icon>
                    <span>返回</span>
                        </el-button>
                <div class="hero-title">
                    <div class="title-row">
                        <h1 class="task-title">{{ taskInfo?.taskTitle || '任务详情' }}</h1>
                        <el-button 
                            v-if="canEditTask" 
                            type="primary" 
                            :icon="Edit"
                            @click="openEditDialog"
                            class="edit-task-btn"
                        >
                            编辑任务
                        </el-button>
                    </div>
                    <div class="hero-meta">
                        <el-tag :type="priorityType" size="large" class="hero-tag" effect="dark">
                            <el-icon class="tag-icon"><WarningFilled v-if="taskInfo?.priority === 1" /><ArrowUp v-else-if="taskInfo?.priority === 2" /><Minus v-else-if="taskInfo?.priority === 3" /><ArrowDown v-else /></el-icon>
                            {{ priorityText }}
                        </el-tag>
                        <el-tag :type="statusType" size="large" class="hero-tag" effect="dark">
                            <el-icon class="tag-icon"><CircleCheck v-if="taskInfo?.status === 2" /><Loading v-else-if="taskInfo?.status === 1" /><Clock v-else /></el-icon>
                            {{ statusText }}
                        </el-tag>
                        <div class="progress-badge">
                            <el-progress 
                                :percentage="taskInfo?.progress || 0" 
                                :status="progressStatus"
                                :stroke-width="8"
                                :show-text="false"
                                class="hero-progress"
                            />
                            <span class="progress-text">{{ taskInfo?.progress || 0 }}%</span>
                    </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="taskInfo" class="content-wrapper">
            <!-- 关键信息卡片 -->
            <div class="key-info-grid">
                <div class="info-card" @mouseenter="showTooltip($event, '任务ID', taskInfo.id)" @mouseleave="hideTooltip">
                    <div class="info-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <el-icon><Document /></el-icon>
                    </div>
                    <div class="info-content">
                        <div class="info-label">任务ID</div>
                        <div class="info-value">{{ formatId(taskInfo.id) }}</div>
                    </div>
                </div>
                <div class="info-card" @mouseenter="showTooltip($event, '截止时间', formatTime(taskInfo.deadline))" @mouseleave="hideTooltip">
                    <div class="info-icon" style="background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);">
                        <el-icon><Calendar /></el-icon>
                    </div>
                    <div class="info-content">
                        <div class="info-label">截止时间</div>
                        <div class="info-value">{{ formatTime(taskInfo.deadline) || '-' }}</div>
                    </div>
                </div>
                <div class="info-card" @mouseenter="showTooltip($event, '预计工时', `${taskInfo.estimatedHours || 0} 小时`)" @mouseleave="hideTooltip">
                    <div class="info-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <el-icon><Timer /></el-icon>
                    </div>
                    <div class="info-content">
                        <div class="info-label">预计工时</div>
                        <div class="info-value">{{ taskInfo.estimatedHours || 0 }}h</div>
                    </div>
                </div>
                <div class="info-card" @mouseenter="showTooltip($event, '实际工时', `${taskInfo.actualHours || 0} 小时`)" @mouseleave="hideTooltip">
                    <div class="info-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                        <el-icon><Clock /></el-icon>
                    </div>
                    <div class="info-content">
                        <div class="info-label">实际工时</div>
                        <div class="info-value">{{ taskInfo.actualHours || 0 }}h</div>
                    </div>
                </div>
            </div>

            <!-- 详细信息区域 -->
            <div class="detail-grid">
                <!-- 左侧：描述和节点 -->
                <div class="detail-left">
                    <!-- 任务描述 -->
                    <el-card shadow="hover" class="detail-card description-card">
                    <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><Document /></el-icon>
                                <span>任务描述</span>
                            </div>
                    </template>
                        <div class="description-content">
                            {{ taskInfo.taskDescription || '暂无描述' }}
                        </div>
                </el-card>

                    <!-- 任务附件 -->
                    <el-card shadow="hover" class="detail-card attachments-card">
                        <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><Folder /></el-icon>
                                <span>任务附件 ({{ filteredAttachments.length }})</span>
                                <!-- 节点筛选 -->
                                <div class="attachment-filter" v-if="taskInfo?.nodes?.length > 0">
                                    <el-select 
                                        v-model="attachmentNodeFilter" 
                                        placeholder="筛选节点" 
                                        clearable 
                                        size="small"
                                        style="width: 150px;"
                                    >
                                        <el-option label="全部附件" value="" />
                                        <el-option 
                                            v-for="node in taskInfo.nodes" 
                                            :key="node.id || node.taskNodeId"
                                            :label="node.nodeName"
                                            :value="node.id || node.taskNodeId"
                                        />
                                    </el-select>
                                </div>
                                <el-button 
                                    type="primary" 
                                    size="small" 
                                    :icon="Upload"
                                    @click="showUploadDialog = true"
                                    style="margin-left: auto;"
                                >
                                    上传附件
                                </el-button>
                            </div>
                        </template>
                        <div v-if="filteredAttachments.length > 0" class="attachments-list">
                            <div 
                                v-for="file in filteredAttachments" 
                                :key="file.fileId" 
                                class="attachment-item"
                                @click="previewFile(file)"
                            >
                                <div class="file-icon" :class="`file-type-${getFileIconType(file.fileType)}`">
                                    <el-icon><Document /></el-icon>
                                </div>
                                <div class="file-info">
                                    <div class="file-name">{{ file.fileName }}</div>
                                    <div class="file-meta">
                                        <span>{{ formatFileSize(file.fileSize) }}</span>
                                        <span>{{ formatTime(file.createTime) }}</span>
                                        <!-- 显示关联节点 -->
                                        <el-tag 
                                            v-if="file.taskNodeId && getNodeName(file.taskNodeId)" 
                                            size="small" 
                                            type="warning"
                                            class="file-node-tag"
                                        >
                                            {{ getNodeName(file.taskNodeId) }}
                                        </el-tag>
                                    </div>
                                </div>
                                <div class="file-actions">
                                    <el-button link type="primary" @click.stop="downloadFile(file)">
                                        <el-icon><Download /></el-icon>
                                    </el-button>
                                    <el-button link type="danger" @click.stop="handleDeleteAttachment(file)">
                                        <el-icon><Delete /></el-icon>
                                    </el-button>
                                </div>
                            </div>
                        </div>
                        <el-empty v-else description="暂无附件" :image-size="60" />
                    </el-card>

                    <!-- 任务评论 -->
                    <el-card shadow="hover" class="detail-card comments-card">
                        <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><ChatDotRound /></el-icon>
                                <span>任务评论 ({{ filteredComments.length }})</span>
                                <!-- 节点筛选 -->
                                <div class="comment-filter" style="margin-left: auto;">
                                    <el-select 
                                        v-model="commentNodeFilter" 
                                        placeholder="筛选节点" 
                                        clearable 
                                        size="small"
                                        style="width: 180px;"
                                    >
                                        <el-option label="全部评论" value="" />
                                        <el-option 
                                            v-for="node in taskInfo?.nodes || []" 
                                            :key="node.id || node.taskNodeId"
                                            :label="node.nodeName"
                                            :value="node.id || node.taskNodeId"
                                        />
                                    </el-select>
                                </div>
                            </div>
                        </template>
                        <div class="comment-input">
                            <!-- 关联节点选择 -->
                            <div class="comment-node-select" v-if="taskInfo?.nodes?.length > 0">
                                <el-select 
                                    v-model="selectedCommentNode" 
                                    placeholder="选择关联节点（可选）" 
                                    clearable 
                                    size="small"
                                    style="width: 100%; margin-bottom: 12px;"
                                >
                                    <el-option 
                                        v-for="node in taskInfo.nodes" 
                                        :key="node.id || node.taskNodeId"
                                        :label="node.nodeName"
                                        :value="node.id || node.taskNodeId"
                                    >
                                        <div class="node-option">
                                            <span class="node-status-dot" :class="`status-${node.status}`"></span>
                                            <span>{{ node.nodeName }}</span>
                                            <el-tag size="small" :type="getNodeStatusType(node.status)" style="margin-left: auto;">
                                                {{ getNodeStatusText(node.status) }}
                                            </el-tag>
                                        </div>
                                    </el-option>
                                </el-select>
                            </div>
                            <div class="comment-input-wrapper">
                                <el-input
                                    ref="commentInputRef"
                                    v-model="newComment"
                                    type="textarea"
                                    :rows="3"
                                    placeholder="写下你的评论... 输入@可以提及成员或节点"
                                    resize="none"
                                    @input="onCommentInput"
                                    @keydown="onCommentKeydown"
                                    @blur="onCommentBlur"
                                />
                            </div>
                            <div class="comment-actions">
                                <el-button 
                                    type="info" 
                                    size="small" 
                                    plain
                                    @click="showMentionSelector('employee')"
                                >
                                    <el-icon><User /></el-icon>
                                    @成员
                                </el-button>
                                <el-button 
                                    type="warning" 
                                    size="small" 
                                    plain
                                    @click="showMentionSelector('node')"
                                >
                                    <el-icon><List /></el-icon>
                                    @节点
                                </el-button>
                                <el-button type="primary" size="small" @click="submitComment" :loading="submittingComment">
                                    发表评论
                                </el-button>
                            </div>
                        </div>
                        <div v-if="filteredComments.length > 0" class="comments-list">
                            <div 
                                v-for="comment in filteredComments" 
                                :key="comment.commentId" 
                                class="comment-item"
                            >
                                <el-avatar :size="36" class="comment-avatar">
                                    {{ comment.employeeName?.[0] || 'U' }}
                                </el-avatar>
                                <div class="comment-content">
                                    <div class="comment-header">
                                        <span class="comment-author">{{ comment.employeeName }}</span>
                                        <!-- 显示关联节点 -->
                                        <el-tag 
                                            v-if="comment.taskNodeId && getNodeName(comment.taskNodeId)" 
                                            size="small" 
                                            type="warning"
                                            class="comment-node-tag"
                                        >
                                            <el-icon><List /></el-icon>
                                            {{ getNodeName(comment.taskNodeId) }}
                                        </el-tag>
                                        <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                                    </div>
                                    <div class="comment-text" v-html="renderCommentContent(comment.content)"></div>
                                    <div class="comment-footer">
                                        <el-button link size="small" @click="handleLikeComment(comment)">
                                            <el-icon><Star /></el-icon>
                                            {{ comment.likeCount || 0 }}
                                        </el-button>
                                        <el-button link size="small" @click="replyToComment(comment)">
                                            回复
                                        </el-button>
                                    </div>
                                    <!-- 回复列表 -->
                                    <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                                        <div v-for="reply in comment.replies" :key="reply.commentId" class="reply-item">
                                            <span class="reply-author">{{ reply.employeeName }}</span>
                                            <span class="reply-to" v-if="reply.replyToName">回复 {{ reply.replyToName }}</span>
                                            <span class="reply-content">{{ reply.content }}</span>
                                            <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <el-empty v-else description="暂无评论，快来抢沙发吧~" :image-size="60" />
                    </el-card>

                    <!-- 任务节点列表 -->
                    <el-card shadow="hover" class="detail-card nodes-card" v-if="taskInfo.nodes && taskInfo.nodes.length > 0">
                    <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><List /></el-icon>
                                <span>任务节点 ({{ taskInfo.nodes.length }})</span>
                                <el-button 
                                    type="primary" 
                                    size="small" 
                                    :icon="Connection"
                                    @click="handleAutoDispatch"
                                    :loading="dispatching"
                                    style="margin-left: auto;"
                                >
                                    AI智能派发
                                </el-button>
                            </div>
                    </template>
                        <div class="nodes-list">
                            <el-collapse v-model="expandedNodes" accordion>
                                <el-collapse-item 
                                    v-for="(node, index) in taskInfo.nodes" 
                                    :key="node.id || index"
                                    :name="node.id || index"
                                    class="node-collapse-item"
                                >
                                    <template #title>
                                        <div class="node-item-header">
                                            <div class="node-status-indicator" :class="`status-${node.status}`"></div>
                                            <div class="node-name">{{ node.nodeName }}</div>
                                            <el-tag :type="getNodeStatusType(node.status)" size="small" class="node-status-tag">
                                                {{ getNodeStatusText(node.status) }}
                                            </el-tag>
                                            <div class="node-progress-mini">
                                                <el-progress 
                                                    :percentage="node.progress || 0" 
                                                    :status="node.progress === 100 ? 'success' : undefined"
                                                    :stroke-width="6"
                                                    :show-text="false"
                                                    style="width: 80px;"
                                                />
                                                <span class="progress-text">{{ node.progress || 0 }}%</span>
                                            </div>
                                        </div>
                                    </template>
                                    <div class="node-detail-content">
                                        <div class="node-meta">
                                            <div class="node-meta-item">
                                                <el-icon><User /></el-icon>
                                                <span>负责人: {{ node.leaderName || formatId(node.leaderId) || '-' }}</span>
                                            </div>
                                            <div class="node-meta-item">
                                                <el-icon><Calendar /></el-icon>
                                                <span>截止: {{ formatTime(node.nodeDeadline) || '-' }}</span>
                                            </div>
                                            <el-button 
                                                v-if="!node.executorId"
                                                type="primary" 
                                                size="small" 
                                                :icon="Connection"
                                                @click.stop="handleAutoDispatchNode(node)"
                                                :loading="dispatchingNodeId === (node.id || node.taskNodeId)"
                                                style="margin-left: auto;"
                                            >
                                                智能派发
                                            </el-button>
                                        </div>
                                        <!-- 任务清单组件 -->
                                        <div class="node-checklist">
                                            <TaskChecklist 
                                                :task-node-id="node.id || node.taskNodeId"
                                                :current-employee-id="currentEmployeeId"
                                                :can-add="canEditNode(node)"
                                                @progress-change="(p) => onNodeProgressChange(node, p)"
                                            />
                                        </div>
                                    </div>
                                </el-collapse-item>
                            </el-collapse>
                        </div>
                    </el-card>
                </div>

                <!-- 右侧：流程图和日志 -->
                <div class="detail-right">
                    <!-- 子任务流转图 -->
                    <el-card shadow="hover" class="detail-card flow-card" v-if="taskInfo.nodes && taskInfo.nodes.length > 0">
                        <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><Connection /></el-icon>
                                <span>流转图</span>
                            </div>
                            </template>
                        <div class="flow-chart-container">
                            <div ref="flowChartRef" class="flow-chart" v-loading="flowChartLoading"></div>
                        </div>
                </el-card>

                <!-- 任务日志 -->
                    <el-card shadow="hover" class="detail-card logs-card" v-if="taskLogs && taskLogs.length > 0">
                    <template #header>
                            <div class="card-header-title">
                                <el-icon class="title-icon"><Clock /></el-icon>
                                <span>任务日志 ({{ taskLogs.length }})</span>
                            </div>
                    </template>
                        <div class="logs-container">
                            <div 
                            v-for="log in paginatedLogs"
                            :key="log.id"
                                class="log-item"
                                @mouseenter="showLogTooltip($event, log)"
                                @mouseleave="hideTooltip"
                        >
                                <div class="log-dot"></div>
                                <div class="log-content-wrapper">
                                <div class="log-header">
                                        <el-tag :type="getLogTypeColor(log.logType)" size="small" class="log-type-tag">
                                            {{ log.logType }}
                                        </el-tag>
                                        <div class="log-operator">
                                            <el-avatar 
                                                :size="24" 
                                                :src="getOperatorAvatar(log.operatorId)" 
                                                class="log-avatar"
                                            >
                                                {{ getOperatorName(log.operatorId)?.[0] || 'U' }}
                                            </el-avatar>
                                            <span class="operator-name">{{ getOperatorName(log.operatorId) || formatId(log.operatorId) || '未知' }}</span>
                                </div>
                                        <div class="log-time">{{ formatTime(log.createTime) }}</div>
                                    </div>
                                    <div class="log-text">{{ log.logContent }}</div>
                                </div>
                            </div>
                        </div>
                    <div class="log-pagination">
                        <el-pagination
                            v-model:current-page="logPage"
                            v-model:page-size="logPageSize"
                            :page-sizes="[10, 20, 50, 100]"
                            :total="taskLogs.length"
                            layout="total, sizes, prev, pager, next, jumper"
                            @size-change="handleLogSizeChange"
                            @current-change="handleLogPageChange"
                        />
                    </div>
                </el-card>
                </div>
            </div>
        </div>

        <!-- 工具提示 -->
        <div v-if="tooltipVisible" class="tooltip" :style="tooltipStyle">
            <div class="tooltip-title">{{ tooltipTitle }}</div>
            <div class="tooltip-content">{{ tooltipContent }}</div>
        </div>

        <!-- 上传附件对话框 -->
        <el-dialog 
            v-model="showUploadDialog" 
            title="上传附件" 
            width="540px"
            class="upload-dialog"
            :close-on-click-modal="false"
        >
            <!-- 关联节点选择（必选） -->
            <div class="upload-node-select">
                <div class="upload-field-label">
                    <span class="required-mark">*</span>
                    关联节点
                </div>
                <el-select 
                    v-model="uploadTargetNode" 
                    placeholder="请选择要关联的任务节点" 
                    style="width: 100%;"
                    :class="{ 'is-error': uploadNodeError }"
                >
                    <el-option 
                        v-for="node in userAccessibleNodes" 
                        :key="node.id || node.taskNodeId"
                        :label="node.nodeName"
                        :value="node.id || node.taskNodeId"
                    >
                        <div class="node-option">
                            <span class="node-status-dot" :class="`status-${node.status}`"></span>
                            <span>{{ node.nodeName }}</span>
                            <el-tag size="small" :type="getNodeStatusType(node.status)" style="margin-left: auto;">
                                {{ getNodeStatusText(node.status) }}
                            </el-tag>
                        </div>
                    </el-option>
                </el-select>
                <div class="upload-field-hint" v-if="!uploadNodeError">
                    附件将关联到选中的节点，只有节点执行人/负责人可以查看
                </div>
                <div class="upload-field-error" v-else>请选择要关联的任务节点</div>
            </div>

            <div class="upload-area">
                <div 
                    class="upload-drop-zone"
                    @click="triggerFileInput"
                    @dragover.prevent="onDragOver"
                    @dragleave.prevent="onDragLeave"
                    @drop.prevent="onFileDrop"
                    :class="{ 'drag-over': isDragOver }"
                >
                    <el-icon class="upload-icon"><Upload /></el-icon>
                    <div class="upload-text">点击或拖拽文件到此区域上传</div>
                    <div class="upload-hint">支持图片、PDF、Word、Excel、代码文件等，单个文件最大50MB</div>
                </div>
                <input 
                    ref="fileInputRef"
                    type="file" 
                    multiple 
                    style="display: none;"
                    @change="onFileSelect"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar,.js,.ts,.vue,.py,.go,.java,.c,.cpp,.h,.css,.scss,.json,.xml,.yaml,.yml"
                />
            </div>
            
            <!-- 已选择的文件列表 -->
            <div v-if="selectedFiles.length > 0" class="selected-files">
                <div class="selected-files-title">待上传文件 ({{ selectedFiles.length }})</div>
                <div 
                    v-for="(file, index) in selectedFiles" 
                    :key="index" 
                    class="selected-file-item"
                >
                    <div class="file-icon" :class="`file-type-${getFileIconTypeByName(file.name)}`">
                        <el-icon><Document /></el-icon>
                    </div>
                    <div class="file-info">
                        <div class="file-name">{{ file.name }}</div>
                        <div class="file-size">{{ formatFileSize(file.size) }}</div>
                    </div>
                    <el-button link type="danger" @click="removeSelectedFile(index)">
                        <el-icon><Close /></el-icon>
                    </el-button>
                </div>
            </div>
            
            <template #footer>
                <el-button @click="showUploadDialog = false">取消</el-button>
                <el-button 
                    type="primary" 
                    @click="handleUploadFiles" 
                    :loading="uploadingFile"
                    :disabled="selectedFiles.length === 0"
                >
                    上传 {{ selectedFiles.length > 0 ? `(${selectedFiles.length})` : '' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- @提及列表（成员/节点） -->
        <div 
            v-if="showMentionList" 
            class="mention-list"
            :style="{ top: mentionListPosition.top + 'px', left: mentionListPosition.left + 'px' }"
        >
            <!-- 选项卡切换 -->
            <div class="mention-tabs">
                <div 
                    class="mention-tab" 
                    :class="{ active: mentionType === 'employee' }"
                    @click="mentionType = 'employee'"
                >
                    <el-icon><User /></el-icon>
                    成员
                </div>
                <div 
                    class="mention-tab" 
                    :class="{ active: mentionType === 'node' }"
                    @click="mentionType = 'node'"
                >
                    <el-icon><List /></el-icon>
                    节点
                </div>
            </div>
            <div class="mention-list-content">
                <!-- 成员列表 -->
                <template v-if="mentionType === 'employee'">
                    <div 
                        v-for="emp in filteredMentionEmployees" 
                        :key="emp.id" 
                        class="mention-item"
                        @click="insertMention(emp, 'employee')"
                    >
                        <el-avatar :size="28" class="mention-avatar">
                            {{ emp.name?.[0] || 'U' }}
                        </el-avatar>
                        <span class="mention-name">{{ emp.name }}</span>
                    </div>
                    <div v-if="filteredMentionEmployees.length === 0" class="mention-empty">
                        没有找到匹配的成员
                    </div>
                </template>
                <!-- 节点列表 -->
                <template v-else>
                    <div 
                        v-for="node in filteredMentionNodes" 
                        :key="node.id || node.taskNodeId" 
                        class="mention-item node-mention"
                        @click="insertMention(node, 'node')"
                    >
                        <div class="mention-node-icon" :class="`status-${node.status}`">
                            <el-icon><List /></el-icon>
                        </div>
                        <div class="mention-node-info">
                            <span class="mention-name">{{ node.nodeName }}</span>
                            <span class="mention-node-meta">
                                {{ getNodeStatusText(node.status) }} · {{ node.progress || 0 }}%
                            </span>
                        </div>
                    </div>
                    <div v-if="filteredMentionNodes.length === 0" class="mention-empty">
                        没有找到匹配的节点
                    </div>
                </template>
            </div>
        </div>

        <el-empty v-if="!loading && !taskInfo" description="任务不存在或已被删除" />

        <!-- 编辑任务对话框 -->
        <el-dialog 
            v-model="showEditDialog" 
            title="编辑任务" 
            width="600px"
            :close-on-click-modal="false"
        >
            <el-form 
                ref="editFormRef"
                :model="editForm" 
                :rules="editRules"
                label-width="100px"
            >
                <el-form-item label="任务标题" prop="taskTitle">
                    <el-input v-model="editForm.taskTitle" placeholder="请输入任务标题" />
                </el-form-item>
                <el-form-item label="任务描述" prop="taskDescription">
                    <el-input 
                        v-model="editForm.taskDescription" 
                        type="textarea" 
                        :rows="4" 
                        placeholder="请输入任务描述" 
                    />
                </el-form-item>
                <el-form-item label="优先级" prop="priority">
                    <el-select v-model="editForm.priority" style="width: 100%">
                        <el-option label="紧急" :value="1" />
                        <el-option label="高" :value="2" />
                        <el-option label="中" :value="3" />
                        <el-option label="低" :value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item label="截止时间" prop="deadline">
                    <el-date-picker 
                        v-model="editForm.deadline" 
                        type="datetime" 
                        placeholder="选择截止时间"
                        format="YYYY-MM-DD HH:mm"
                        value-format="YYYY-MM-DDTHH:mm:ssZ"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-form-item label="预计工时" prop="estimatedHours">
                    <el-input-number 
                        v-model="editForm.estimatedHours" 
                        :min="0" 
                        :max="1000" 
                        style="width: 100%" 
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showEditDialog = false">取消</el-button>
                <el-button type="primary" @click="submitEdit" :loading="submittingEdit">
                    保存修改
                </el-button>
            </template>
        </el-dialog>

        <!-- AI推荐派发对话框 -->
        <el-dialog 
            v-model="showRecommendDialog" 
            title="AI智能推荐" 
            width="800px"
            :close-on-click-modal="false"
        >
            <div v-if="recommendations.length > 0" class="recommendations-container">
                <div v-for="rec in recommendations" :key="rec.taskNodeId" class="recommendation-card">
                    <div class="rec-header">
                        <el-icon><List /></el-icon>
                        <span class="rec-node-name">{{ rec.taskNodeName }}</span>
                    </div>
                    <div class="rec-analysis" v-if="rec.aiAnalysis">
                        <el-icon><ChatDotRound /></el-icon>
                        <span>{{ rec.aiAnalysis }}</span>
                    </div>
                    <div class="rec-candidates">
                        <div 
                            v-for="candidate in rec.candidates" 
                            :key="candidate.employeeId"
                            class="candidate-item"
                            :class="{ selected: selectedCandidates[rec.taskNodeId] === candidate.employeeId }"
                            @click="selectCandidate(rec.taskNodeId, candidate.employeeId)"
                        >
                            <div class="candidate-rank">#{{ candidate.rank }}</div>
                            <div class="candidate-info">
                                <div class="candidate-name">{{ candidate.name }}</div>
                                <div class="candidate-reason">{{ candidate.reason }}</div>
                            </div>
                            <div class="candidate-score">
                                <el-progress 
                                    type="circle" 
                                    :percentage="Math.round(candidate.score)" 
                                    :width="50"
                                    :stroke-width="4"
                                    :color="getScoreColor(candidate.score)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <el-empty v-else description="没有需要派发的节点" />
            <template #footer>
                <el-button @click="showRecommendDialog = false">取消</el-button>
                <el-button 
                    type="primary" 
                    @click="confirmDispatch" 
                    :loading="confirmingDispatch"
                    :disabled="Object.keys(selectedCandidates).length === 0"
                >
                    确认派发 ({{ Object.keys(selectedCandidates).length }})
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
    ArrowLeft, Document, Calendar, Timer, Clock, User, Connection, List,
    WarningFilled, ArrowUp, Minus, ArrowDown, CircleCheck, Loading,
    Folder, Upload, Download, Delete, ChatDotRound, Star, Plus, Close, Edit
} from '@element-plus/icons-vue';
import { 
    getTask, updateTaskProgress, getMyEmployee, listEmployees, autoDispatchTask,
    getTaskAttachments, deleteAttachment, getTaskComments, createTaskComment, likeTaskComment,
    uploadFile, getAttachmentComments, createAttachmentComment, updateTask
} from '@/api';
import type { FormInstance, FormRules } from 'element-plus';
import TaskChecklist from '@/components/TaskChecklist.vue';
import { useUserStore } from '@/store/user';
import { getFileUrl, processFileUrls } from '@/utils/fileUrl';
import request from '@/utils/request';
import * as echarts from 'echarts';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const taskInfo = ref<any>(null);
const taskLogs = ref<any[]>([]);
const currentEmployeeId = ref<string>('');
const flowChartRef = ref<HTMLElement | null>(null);
const flowChartLoading = ref(false);
let flowChartInstance: echarts.ECharts | null = null;
const employeesMap = ref<Record<string, any>>({});
const userStore = useUserStore();
const dispatching = ref(false);
const dispatchingNodeId = ref<string | null>(null);
const expandedNodes = ref<(string | number)[]>([]);

// AI推荐派发相关
const showRecommendDialog = ref(false);
const recommendations = ref<any[]>([]);
const selectedCandidates = ref<Record<string, string>>({});
const confirmingDispatch = ref(false);

// 附件相关
const attachments = ref<any[]>([]);
const showUploadDialog = ref(false);
const uploadingFile = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const uploadTargetNode = ref(''); // 上传时关联的节点（必选）
const uploadNodeError = ref(false); // 节点选择错误提示
const attachmentNodeFilter = ref(''); // 附件节点筛选

// 评论相关
const comments = ref<any[]>([]);
const newComment = ref('');
const submittingComment = ref(false);
const replyingTo = ref<any>(null);
const showMentionList = ref(false);
const mentionFilter = ref('');
const mentionListPosition = ref({ top: 0, left: 0 });
const commentInputRef = ref<HTMLTextAreaElement | null>(null);
const mentionType = ref<'employee' | 'node'>('employee');
const commentNodeFilter = ref(''); // 评论节点筛选
const selectedCommentNode = ref(''); // 发表评论时选择的节点

// 附件预览与评论
const showFilePreviewDialog = ref(false);
const previewingFile = ref<any>(null);
const fileComments = ref<any[]>([]);
const newFileComment = ref('');
const submittingFileComment = ref(false);

// 日志分页
const logPage = ref(1);
const logPageSize = ref(20);

// 编辑任务相关
const showEditDialog = ref(false);
const submittingEdit = ref(false);
const editFormRef = ref<FormInstance>();
const editForm = ref({
    taskId: '',
    taskTitle: '',
    taskDescription: '',
    priority: 3,
    deadline: '',
    estimatedHours: 0
});
const editRules: FormRules = {
    taskTitle: [
        { required: true, message: '请输入任务标题', trigger: 'blur' },
        { min: 2, max: 100, message: '标题长度2-100个字符', trigger: 'blur' }
    ]
};

// 判断是否可以编辑任务（任务负责人）
const canEditTask = computed(() => {
    if (!taskInfo.value || !currentEmployeeId.value) return false;
    const leaderId = taskInfo.value.leaderId || taskInfo.value.LeaderId || '';
    return leaderId === currentEmployeeId.value;
});

// 工具提示
const tooltipVisible = ref(false);
const tooltipStyle = ref({ top: '0px', left: '0px' });
const tooltipTitle = ref('');
const tooltipContent = ref('');

// 英雄区域渐变背景
const heroGradient = computed(() => {
    const priority = taskInfo.value?.priority || 3;
    if (priority === 1) {
        return { background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 50%, #4facfe 100%)' };
    } else if (priority === 2) {
        return { background: 'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #30cfd0 100%)' };
    } else if (priority === 3) {
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' };
    } else {
        return { background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%)' };
    }
});

const priorityText = computed(() => {
    const p = taskInfo.value?.priority || 3;
    return p === 1 ? '紧急' : p === 2 ? '高' : p === 3 ? '中' : '低';
});

const priorityType = computed(() => {
    const p = taskInfo.value?.priority || 3;
    return p === 1 ? 'danger' : p === 2 ? 'warning' : p === 3 ? 'info' : '';
});

const statusText = computed(() => {
    const s = taskInfo.value?.status || 0;
    return s === 1 ? '进行中' : s === 2 ? '已完成' : s === 0 ? '待处理' : '未知';
});

const statusType = computed(() => {
    const s = taskInfo.value?.status || 0;
    return s === 2 ? 'success' : s === 1 ? 'warning' : 'info';
});

const progressStatus = computed(() => {
    const progress = taskInfo.value?.progress || 0;
    const deadline = taskInfo.value?.deadline;
    if (!deadline) return undefined;
    const left = Math.ceil((Date.parse(deadline) - Date.now()) / (24 * 3600 * 1000));
    return left < 0 && progress < 100 ? 'exception' : left <= 1 && progress < 100 ? 'warning' : undefined;
});

// 分页后的日志列表
const paginatedLogs = computed(() => {
    const start = (logPage.value - 1) * logPageSize.value;
    const end = start + logPageSize.value;
    return taskLogs.value.slice(start, end);
});

// 格式化ID，如果是ID格式则返回名字，否则返回原值
function formatId(id: string | number | undefined): string {
    if (!id) return '-';
    const idStr = String(id);
    // 检查是否是ID格式 (dev_xxx_001, emp_xxx_01等)
    if (/^(dev_|emp_|task_|node_)/i.test(idStr)) {
        // 尝试从员工映射中查找
        const emp = employeesMap.value[idStr];
        if (emp) {
            return emp.name;
        }
        // 如果找不到，返回ID的简化版本
        return idStr.replace(/^(dev_|emp_|task_|node_)/i, '').replace(/_/g, ' ');
    }
    // 如果不是ID格式，尝试查找员工
    const emp = employeesMap.value[idStr];
    if (emp) {
        return emp.name;
    }
    return idStr;
}

// 工具提示显示
function showTooltip(event: MouseEvent, title: string, content: string) {
    tooltipVisible.value = true;
    tooltipTitle.value = title;
    tooltipContent.value = content;
    tooltipStyle.value = {
        top: `${event.clientY + 10}px`,
        left: `${event.clientX + 10}px`
    };
}

function showNodeTooltip(event: MouseEvent, node: any) {
    const content = `
        节点ID: ${formatId(node.id)}\n
        负责人: ${node.leaderName || formatId(node.leaderId) || '-'}\n
        执行人: ${node.executorNames || '-'}\n
        类型: ${node.nodeType === 1 ? '任务节点' : node.nodeType === 2 ? '条件节点' : '审批节点'}\n
        详情: ${node.nodeDetail || '-'}
    `.trim();
    showTooltip(event, node.nodeName, content);
}

function showLogTooltip(event: MouseEvent, log: any) {
    const content = `
        日志ID: ${formatId(log.id)}\n
        操作者: ${getOperatorName(log.operatorId) || formatId(log.operatorId) || '未知'}\n
        操作时间: ${formatTime(log.createTime)}\n
        内容: ${log.logContent}
    `.trim();
    showTooltip(event, log.logType, content);
}

function hideTooltip() {
    tooltipVisible.value = false;
}

// 分页变化处理
function handleLogPageChange(page: number) {
    logPage.value = page;
}

function handleLogSizeChange(size: number) {
    logPageSize.value = size;
    logPage.value = 1;
}

function formatTime(time: string) {
    if (!time) return '-';
    try {
        const date = new Date(time);
        return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
        return time;
    }
}

function getNodeStatusText(status: number) {
    return status === 1 ? '进行中' : status === 2 ? '已完成' : status === 0 ? '待处理' : '未知';
}

function getNodeStatusType(status: number) {
    return status === 2 ? 'success' : status === 1 ? 'warning' : 'info';
}

function getLogTypeColor(logType: string) {
    if (logType.includes('创建')) return 'success';
    if (logType.includes('完成')) return 'success';
    if (logType.includes('更新')) return 'info';
    if (logType.includes('删除')) return 'danger';
    return '';
}

function getOperatorAvatar(operatorId: string | number): string {
    if (!operatorId) return '';
    const emp = employeesMap.value[String(operatorId)];
    return emp?.avatar || '';
}

function getOperatorName(operatorId: string | number): string {
    if (!operatorId) return '未知';
    const emp = employeesMap.value[String(operatorId)];
    return emp?.name || formatId(String(operatorId));
}

function goBack() {
    router.go(-1);
}

// 打开编辑对话框
function openEditDialog() {
    if (!taskInfo.value) return;
    editForm.value = {
        taskId: taskInfo.value.id || '',
        taskTitle: taskInfo.value.taskTitle || '',
        taskDescription: taskInfo.value.taskDescription || '',
        priority: taskInfo.value.priority || 3,
        deadline: taskInfo.value.deadline || '',
        estimatedHours: taskInfo.value.estimatedHours || 0
    };
    showEditDialog.value = true;
}

// 提交编辑
async function submitEdit() {
    if (!editFormRef.value) return;
    
    await editFormRef.value.validate(async (valid) => {
        if (!valid) return;
        
        submittingEdit.value = true;
        try {
            const resp = await updateTask({
                taskId: editForm.value.taskId,
                taskTitle: editForm.value.taskTitle,
                taskDescription: editForm.value.taskDescription,
                priority: editForm.value.priority,
                deadline: editForm.value.deadline,
                estimatedHours: editForm.value.estimatedHours
            });
            
            if (resp.data?.code === 200) {
                ElMessage.success('任务更新成功');
                showEditDialog.value = false;
                loadTaskDetail();
            } else {
                ElMessage.error(resp.data?.msg || '更新失败');
            }
        } catch (error: any) {
            console.error('更新任务失败:', error);
            ElMessage.error('更新任务失败');
        } finally {
            submittingEdit.value = false;
        }
    });
}

// 自动派发任务节点 - 使用AI推荐
async function handleAutoDispatch() {
    if (!taskInfo.value?.id) {
        ElMessage.warning('任务ID不存在');
        return;
    }

    try {
        dispatching.value = true;
        const resp = await autoDispatchTask({ taskId: taskInfo.value.id });

        if (resp.data.code === 200) {
            const result = resp.data.data;
            
            // 新的AI推荐响应格式
            if (result.recommendations && result.recommendations.length > 0) {
                recommendations.value = result.recommendations;
                selectedCandidates.value = {};
                showRecommendDialog.value = true;
                ElMessage.success(result.message || 'AI分析完成，请选择执行人');
            } else {
                ElMessage.info('没有需要派发的节点');
            }
        } else {
            ElMessage.error(resp.data.msg || '获取推荐失败');
        }
    } catch (error: any) {
        console.error('获取AI推荐失败:', error);
        ElMessage.error('获取AI推荐失败: ' + (error.message || '未知错误'));
    } finally {
        dispatching.value = false;
    }
}

// 自动派发单个任务节点 - 使用AI推荐
async function handleAutoDispatchNode(node: any) {
    if (!taskInfo.value?.id) {
        ElMessage.warning('任务ID不存在');
        return;
    }

    const nodeId = node.id || node.taskNodeId;
    if (!nodeId) {
        ElMessage.warning('节点ID不存在');
        return;
    }

    try {
        dispatchingNodeId.value = nodeId;
        const resp = await autoDispatchTask({ taskId: taskInfo.value.id, nodeId: nodeId });

        if (resp.data.code === 200) {
            const result = resp.data.data;
            
            // 新的AI推荐响应格式
            if (result.recommendations && result.recommendations.length > 0) {
                recommendations.value = result.recommendations;
                selectedCandidates.value = {};
                showRecommendDialog.value = true;
                ElMessage.success(result.message || 'AI分析完成，请选择执行人');
            } else {
                ElMessage.info('没有候选员工');
            }
        } else {
            ElMessage.error(resp.data.msg || '获取推荐失败');
        }
    } catch (error: any) {
        console.error('获取AI推荐失败:', error);
        ElMessage.error('获取AI推荐失败: ' + (error.message || '未知错误'));
    } finally {
        dispatchingNodeId.value = null;
    }
}

// 选择候选人
function selectCandidate(nodeId: string, employeeId: string) {
    if (selectedCandidates.value[nodeId] === employeeId) {
        delete selectedCandidates.value[nodeId];
    } else {
        selectedCandidates.value[nodeId] = employeeId;
    }
}

// 获取分数颜色
function getScoreColor(score: number): string {
    if (score >= 80) return '#67c23a';
    if (score >= 60) return '#e6a23c';
    return '#f56c6c';
}

// 确认派发
async function confirmDispatch() {
    const selections = Object.entries(selectedCandidates.value);
    if (selections.length === 0) {
        ElMessage.warning('请至少选择一个执行人');
        return;
    }

    confirmingDispatch.value = true;
    let successCount = 0;
    let failCount = 0;

    try {
        for (const [nodeId, employeeId] of selections) {
            try {
                const resp = await request({
                    url: '/tasknode/update',
                    method: 'put',
                    data: {
                        taskNodeId: nodeId,
                        executorId: [employeeId]
                    }
                });
                if (resp.data.code === 200) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (e) {
                failCount++;
            }
        }

        if (successCount > 0) {
            ElMessage.success(`派发完成：成功 ${successCount} 个，失败 ${failCount} 个`);
            showRecommendDialog.value = false;
            await loadTaskDetail();
        } else {
            ElMessage.error('派发失败');
        }
    } finally {
        confirmingDispatch.value = false;
    }
}

// 判断是否可以编辑进度
function canEditProgress(node: any): boolean {
    if (!currentEmployeeId.value) return false;
    const leaderId = node.leaderId || node.leaderID || node.LeaderID;
    const executorId = node.executorId || node.executorID || node.ExecutorID;
    const executorIds = Array.isArray(node.executorIds) ? node.executorIds : [];
    return leaderId === currentEmployeeId.value || 
                    executorId === currentEmployeeId.value || 
                    executorIds.includes(currentEmployeeId.value);
}

// 判断是否是任务节点的执行人（用于清单组件创建权限）
function canEditNode(node: any): boolean {
    if (!currentEmployeeId.value) return false;
    const executorId = node.executorId || node.executorID || node.ExecutorID || '';
    const executorIds = Array.isArray(node.executorIds) ? node.executorIds : [];
    // 检查是否是执行人（executorId可能是逗号分隔的多个ID）
    const executorList = executorId.split(',').map((id: string) => id.trim()).filter(Boolean);
    return executorList.includes(currentEmployeeId.value) || 
           executorIds.includes(currentEmployeeId.value);
}

// 清单进度变化时更新节点进度
function onNodeProgressChange(node: any, progress: number) {
    node.progress = progress;
}

// 更新节点进度
async function updateNodeProgress(node: any, progress: number) {
    if (progress < 0 || progress > 100) {
        ElMessage.warning('进度值必须在0-100之间');
        return;
    }

    const nodeId = node.id || node.nodeId || node.taskNodeId;
    if (!nodeId) {
        ElMessage.error('节点ID不存在');
        return;
    }

    node.updating = true;
    try {
        const resp = await updateTaskProgress({
            taskNodeId: nodeId,
            progress: progress,
        });

        if (resp.data.code !== 200) {
            ElMessage.error(resp.data.msg || '更新进度失败');
            node.progress = node.originalProgress || 0;
            return;
        }

        ElMessage.success('进度更新成功');
        node.originalProgress = progress;
        if (progress >= 100) {
            setTimeout(() => {
                loadTaskDetail();
            }, 1000);
        }
    } catch (error: any) {
        console.error('更新进度失败:', error);
        ElMessage.error('更新进度失败: ' + (error.message || '未知错误'));
        node.progress = node.originalProgress || 0;
    } finally {
        node.updating = false;
    }
}

async function loadTaskDetail() {
    let taskId = route.params.id as string;
    console.log('[loadTaskDetail] 传入的ID:', taskId);
    
    if (!taskId) {
        ElMessage.error('任务ID不能为空');
        router.go(-1);
        return;
    }

    // 检测是否传入的是节点ID（以node_开头），如果是则先获取真正的taskId
    if (taskId.startsWith('node_')) {
        console.log('[loadTaskDetail] 检测到节点ID，开始获取真正的taskId');
        try {
            const nodeResp = await request({ url: '/tasknode/get', method: 'post', data: { taskNodeId: taskId } });
            console.log('[loadTaskDetail] /tasknode/get 响应:', JSON.stringify(nodeResp.data));
            
            if (nodeResp.data.code === 200 && nodeResp.data.data) {
                const data = nodeResp.data.data;
                console.log('[loadTaskDetail] 响应data:', JSON.stringify(data));
                
                // 后端返回的结构是 { taskNode: {...}, approvals: [...] }
                const taskNode = data.taskNode || data;
                console.log('[loadTaskDetail] taskNode:', JSON.stringify(taskNode));
                
                // 后端 TaskNodeInfo 的 JSON 标签是 taskId (小写驼峰)
                const realTaskId = taskNode.taskId || taskNode.TaskId || taskNode.taskID || taskNode.TaskID;
                console.log('[loadTaskDetail] 提取的realTaskId:', realTaskId);
                
                if (realTaskId) {
                    console.log('[loadTaskDetail] 重定向到:', `/tasks/detail/${realTaskId}`);
                    // 使用 push 而不是 replace，确保页面正确导航
                    await router.push(`/tasks/detail/${realTaskId}`);
                    return;
                } else {
                    console.error('[loadTaskDetail] taskNode中没有找到taskId字段，taskNode内容:', taskNode);
                }
            } else {
                console.error('[loadTaskDetail] API返回错误:', nodeResp.data);
            }
            ElMessage.error('无法获取任务节点信息');
            router.go(-1);
            return;
        } catch (error) {
            console.error('[loadTaskDetail] 获取任务节点失败:', error);
            ElMessage.error('获取任务节点信息失败');
            router.go(-1);
            return;
        }
    }

    loading.value = true;
    try {
        const resp = await getTask({ taskId });
        if (resp.data.code !== 200) {
            ElMessage.error(resp.data.msg || '获取任务详情失败');
            return;
        }

        const data = resp.data?.data || {};
        taskInfo.value = data;
        taskLogs.value = data.logs || [];
        logPage.value = 1;

        if (taskInfo.value.nodes) {
            taskInfo.value.nodes = taskInfo.value.nodes.map((node: any) => {
                const leaderId = node.leaderId || node.leaderID || node.LeaderID || '';
                const executorIds = Array.isArray(node.executorIds) ? node.executorIds : (node.executorId ? [node.executorId] : []);
                const leader = leaderId ? employeesMap.value[String(leaderId)] : null;
                const executors = executorIds.map((eid: any) => employeesMap.value[String(eid)]).filter(Boolean);
                
                return {
                ...node,
                    leaderId,
                executorId: node.executorId || node.executorID || node.ExecutorID || '',
                    executorIds,
                    leaderName: leader?.name || formatId(leaderId),
                    leaderAvatar: leader?.avatar || '',
                    executorNames: executors.length > 0 
                        ? executors.map((e: any) => e.name).join(', ') 
                        : executorIds.map((eid: any) => formatId(eid)).join(', '),
                    executorAvatars: executors.map((e: any) => ({ name: e.name, avatar: e.avatar })),
                progress: node.progress || 0,
                    originalProgress: node.progress || 0,
                    updating: false,
                };
            });
            
            nextTick(() => {
                renderFlowChart();
            });
        }
    } catch (error: any) {
        console.error('加载任务详情失败:', error);
        ElMessage.error('加载任务详情失败: ' + (error.message || '未知错误'));
    } finally {
        loading.value = false;
    }
}

async function loadEmployees() {
    try {
        const companyId = userStore.companyId || '';
        if (!companyId) {
        const empRes = await getMyEmployee();
            const emp = empRes?.data?.data || {};
            const cid = emp.companyId || emp.CompanyId || '';
            if (cid) {
                const resp = await listEmployees({ page: 1, pageSize: 200, companyId: cid });
                if (resp.data?.code === 200) {
                    const list = resp.data?.data?.list || [];
                    list.forEach((e: any) => {
                        const empId = e.id || e.employeeId || e.EmployeeId;
                        if (empId) {
                            employeesMap.value[String(empId)] = {
                                id: empId,
                                name: e.realName || e.name || e.RealName || '未知',
                                avatar: e.avatar || '',
                            };
                        }
                    });
                }
            }
        } else {
            const resp = await listEmployees({ page: 1, pageSize: 200, companyId });
            if (resp.data?.code === 200) {
                const list = resp.data?.data?.list || [];
                list.forEach((e: any) => {
                    const empId = e.id || e.employeeId || e.EmployeeId;
                    if (empId) {
                        employeesMap.value[String(empId)] = {
                            id: empId,
                            name: e.realName || e.name || e.RealName || '未知',
                            avatar: e.avatar || '',
                        };
                    }
                });
            }
        }
    } catch (error: any) {
        console.error('加载员工列表失败:', error);
    }
}

// 加载任务附件
async function loadAttachments() {
    const taskId = route.params.id as string;
    if (!taskId) return;

    try {
        const resp = await getTaskAttachments({ taskId });
        if (resp.data?.code === 200) {
            // 处理文件URL，转换为COS域名完整URL
            attachments.value = processFileUrls(resp.data?.data?.list || []);
        }
    } catch (error: any) {
        console.error('加载附件失败:', error);
    }
}

// 加载任务评论
async function loadComments() {
    const taskId = route.params.id as string;
    if (!taskId) return;

    try {
        const resp = await getTaskComments({ taskId, page: 1, pageSize: 50 });
        if (resp.data?.code === 200) {
            comments.value = resp.data?.data?.list || [];
        }
    } catch (error: any) {
        console.error('加载评论失败:', error);
    }
}

// 获取文件图标类型
function getFileIconType(fileType: string): string {
    if (!fileType) return 'other';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('word') || fileType.includes('doc')) return 'word';
    if (fileType.includes('excel') || fileType.includes('xls')) return 'excel';
    if (fileType.includes('ppt') || fileType.includes('powerpoint')) return 'ppt';
    if (fileType.includes('text') || fileType.includes('txt')) return 'text';
    return 'other';
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 预览文件 - 跳转到专门的文件预览页面
function previewFile(file: any) {
    const taskId = route.params.id as string;
    // 跳转到文件预览页面，支持行内评论
    router.push({
        path: `/file/preview/${file.fileId}`,
        query: {
            taskId,
            nodeId: file.taskNodeId || '',
            fileName: file.fileName
        }
    });
}

// 判断是否为图片文件
function isImageFile(file: any): boolean {
    if (!file?.fileType) return false;
    return file.fileType.includes('image');
}

// 判断是否为PDF文件
function isPdfFile(file: any): boolean {
    if (!file?.fileType) return false;
    return file.fileType.includes('pdf');
}

// 加载附件评论
async function loadFileComments(fileId: string) {
    if (!fileId) return;
    try {
        const resp = await getAttachmentComments({ fileId, page: 1, pageSize: 50 });
        if (resp.data?.code === 200) {
            fileComments.value = resp.data?.data?.list || [];
        }
    } catch (error: any) {
        console.error('加载附件评论失败:', error);
        fileComments.value = [];
    }
}

// 提交附件评论
async function submitFileComment() {
    if (!newFileComment.value.trim()) {
        ElMessage.warning('请输入评论内容');
        return;
    }
    if (!previewingFile.value?.fileId) return;

    submittingFileComment.value = true;
    try {
        const taskId = route.params.id as string;
        const resp = await createAttachmentComment({
            fileId: previewingFile.value.fileId,
            taskId,
            content: newFileComment.value,
        });

        if (resp.data?.code === 200) {
            ElMessage.success('评论发表成功');
            newFileComment.value = '';
            await loadFileComments(previewingFile.value.fileId);
        } else {
            ElMessage.error(resp.data?.msg || '评论失败');
        }
    } catch (error: any) {
        console.error('发表附件评论失败:', error);
        ElMessage.error('发表评论失败');
    } finally {
        submittingFileComment.value = false;
    }
}

// 获取标注类型文字
function getAnnotationTypeText(type: string): string {
    const types: Record<string, string> = {
        'highlight': '高亮标注',
        'comment': '批注',
        'arrow': '箭头指示',
        'rect': '区域标注',
    };
    return types[type] || type;
}

// 下载文件
async function downloadFile(file: any) {
    if (!file.fileId && !file.fileUrl) return;
    
    try {
        // 获取认证token
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!token) {
            ElMessage.warning('请先登录');
            return;
        }
        
        // 构建URL（如果有fileId则使用代理接口）
        const url = getFileUrl(file.fileUrl, file.fileId);
        
        // 通过fetch获取文件内容（携带token）
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            ElMessage.error('下载文件失败');
            return;
        }
        
        // 创建blob并下载
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
        console.error('下载文件失败:', error);
        ElMessage.error('下载文件失败');
    }
}

// 删除附件
async function handleDeleteAttachment(file: any) {
    try {
        await ElMessageBox.confirm('确定要删除这个附件吗？', '删除确认', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        });

        const resp = await deleteAttachment({ fileId: file.fileId });
        if (resp.data?.code === 200) {
            ElMessage.success('附件删除成功');
            loadAttachments();
        } else {
            ElMessage.error(resp.data?.msg || '删除失败');
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('删除附件失败:', error);
            ElMessage.error('删除附件失败');
        }
    }
}

// ===== 文件上传功能 =====
const isDragOver = ref(false);

function triggerFileInput() {
    fileInputRef.value?.click();
}

function onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
        addFiles(Array.from(input.files));
    }
    input.value = '';
}

function onDragOver(event: DragEvent) {
    isDragOver.value = true;
}

function onDragLeave(event: DragEvent) {
    isDragOver.value = false;
}

function onFileDrop(event: DragEvent) {
    isDragOver.value = false;
    if (event.dataTransfer?.files) {
        addFiles(Array.from(event.dataTransfer.files));
    }
}

function addFiles(files: File[]) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    for (const file of files) {
        if (file.size > maxSize) {
            ElMessage.warning(`文件 ${file.name} 超过50MB限制`);
            continue;
        }
        if (!selectedFiles.value.find(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.value.push(file);
        }
    }
}

function removeSelectedFile(index: number) {
    selectedFiles.value.splice(index, 1);
}

function getFileIconTypeByName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    if (['txt', 'md'].includes(ext)) return 'text';
    return 'other';
}

async function handleUploadFiles() {
    // 验证必须选择节点
    if (!uploadTargetNode.value) {
        uploadNodeError.value = true;
        ElMessage.warning('请选择要关联的任务节点');
        return;
    }
    uploadNodeError.value = false;

    if (selectedFiles.value.length === 0) {
        ElMessage.warning('请先选择文件');
        return;
    }

    const taskId = route.params.id as string;
    if (!taskId) return;

    uploadingFile.value = true;
    let successCount = 0;
    let failCount = 0;

    try {
        for (const file of selectedFiles.value) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('module', 'task');
            formData.append('category', 'attachment');
            formData.append('relatedId', taskId);
            formData.append('taskNodeId', uploadTargetNode.value);
            formData.append('description', '');

            try {
                const resp = await uploadFile(formData);
                if (resp.data?.code === 200 || resp.data?.fileId) {
                    successCount++;
                } else {
                    failCount++;
                    console.error(`上传 ${file.name} 失败:`, resp.data?.msg);
                }
            } catch (error: any) {
                failCount++;
                console.error(`上传 ${file.name} 失败:`, error);
            }
        }

        if (successCount > 0) {
            ElMessage.success(`成功上传 ${successCount} 个文件${failCount > 0 ? `，${failCount} 个失败` : ''}`);
            selectedFiles.value = [];
            uploadTargetNode.value = '';
            uploadNodeError.value = false;
            showUploadDialog.value = false;
            loadAttachments();
        } else {
            ElMessage.error('所有文件上传失败');
        }
    } catch (error: any) {
        console.error('上传文件失败:', error);
        ElMessage.error('上传文件失败');
    } finally {
        uploadingFile.value = false;
    }
}

// ===== @提及功能 =====
const filteredMentionEmployees = computed(() => {
    const employees = Object.values(employeesMap.value) as any[];
    if (!mentionFilter.value) {
        return employees.slice(0, 10);
    }
    return employees.filter((emp: any) => 
        emp.name?.toLowerCase().includes(mentionFilter.value.toLowerCase())
    ).slice(0, 10);
});

const filteredMentionNodes = computed(() => {
    const nodes = taskInfo.value?.nodes || [];
    if (!mentionFilter.value) {
        return nodes.slice(0, 10);
    }
    return nodes.filter((node: any) => 
        node.nodeName?.toLowerCase().includes(mentionFilter.value.toLowerCase())
    ).slice(0, 10);
});

// 筛选后的评论列表
const filteredComments = computed(() => {
    if (!commentNodeFilter.value) {
        return comments.value;
    }
    return comments.value.filter((c: any) => c.taskNodeId === commentNodeFilter.value);
});

// 筛选后的附件列表
const filteredAttachments = computed(() => {
    if (!attachmentNodeFilter.value) {
        return attachments.value;
    }
    return attachments.value.filter((f: any) => f.taskNodeId === attachmentNodeFilter.value);
});

// 用户可以上传附件的节点（执行人或负责人的节点）
const userAccessibleNodes = computed(() => {
    if (!taskInfo.value?.nodes || !currentEmployeeId.value) return [];
    return taskInfo.value.nodes.filter((node: any) => {
        const leaderId = node.leaderId || node.leaderID || '';
        const executorId = node.executorId || node.executorID || '';
        const executorIds = Array.isArray(node.executorIds) ? node.executorIds : [];
        const executorList = executorId ? executorId.split(',').map((id: string) => id.trim()) : [];
        
        return leaderId === currentEmployeeId.value || 
               executorList.includes(currentEmployeeId.value) || 
               executorIds.includes(currentEmployeeId.value);
    });
});

function showMentionSelector(type: 'employee' | 'node' = 'employee') {
    // 获取评论输入框的位置
    const inputEl = document.querySelector('.comment-input-wrapper');
    if (inputEl) {
        const rect = inputEl.getBoundingClientRect();
        mentionListPosition.value = {
            top: rect.bottom + 8,
            left: rect.left
        };
    }
    mentionFilter.value = '';
    mentionType.value = type;
    showMentionList.value = true;
}

// 获取节点名称
function getNodeName(nodeId: string): string {
    if (!nodeId || !taskInfo.value?.nodes) return '';
    const node = taskInfo.value.nodes.find((n: any) => 
        (n.id || n.taskNodeId) === nodeId
    );
    return node?.nodeName || '';
}

function onCommentInput(event: any) {
    const value = newComment.value;
    const cursorPos = event.target?.selectionStart || value.length;
    
    // 检查光标前是否有@字符
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ' || textBeforeCursor[atIndex - 1] === '\n')) {
        const filterText = textBeforeCursor.substring(atIndex + 1);
        if (!filterText.includes(' ') && !filterText.includes('\n')) {
            mentionFilter.value = filterText;
            showMentionSelector();
            return;
        }
    }
    
    showMentionList.value = false;
}

function onCommentKeydown(event: KeyboardEvent) {
    if (showMentionList.value && event.key === 'Escape') {
        showMentionList.value = false;
        event.preventDefault();
    }
}

function onCommentBlur() {
    // 延迟关闭，以便能够点击选择
    setTimeout(() => {
        showMentionList.value = false;
    }, 200);
}

function insertMention(item: any, type: 'employee' | 'node' = 'employee') {
    const value = newComment.value;
    const atIndex = value.lastIndexOf('@');
    
    // 获取要插入的名称
    const name = type === 'employee' ? item.name : `节点:${item.nodeName}`;
    
    if (atIndex !== -1) {
        // 替换@后面的内容
        const before = value.substring(0, atIndex);
        const after = value.substring(atIndex).replace(/@[^\s]*/, '');
        newComment.value = `${before}@${name} ${after}`;
    } else {
        newComment.value += `@${name} `;
    }
    
    // 如果@的是节点，自动选择该节点作为关联节点
    if (type === 'node') {
        selectedCommentNode.value = item.id || item.taskNodeId;
    }
    
    showMentionList.value = false;
}

// 提交评论
async function submitComment() {
    if (!newComment.value.trim()) {
        ElMessage.warning('请输入评论内容');
        return;
    }

    const taskId = route.params.id as string;
    if (!taskId) return;

    submittingComment.value = true;
    try {
        // 解析@提及
        const atMatches = newComment.value.match(/@(\S+)/g);
        const atEmployeeIds: string[] = [];
        if (atMatches) {
            for (const match of atMatches) {
                const name = match.substring(1);
                // 跳过节点提及
                if (name.startsWith('节点:')) continue;
                const emp = Object.values(employeesMap.value).find((e: any) => e.name === name);
                if (emp) {
                    atEmployeeIds.push((emp as any).id);
                }
            }
        }

        const resp = await createTaskComment({
            taskId,
            taskNodeId: selectedCommentNode.value || undefined,
            content: newComment.value,
            atEmployeeIds,
            parentId: replyingTo.value?.commentId,
        });

        if (resp.data?.code === 200) {
            ElMessage.success('评论发表成功');
            newComment.value = '';
            selectedCommentNode.value = '';
            replyingTo.value = null;
            loadComments();
        } else {
            ElMessage.error(resp.data?.msg || '评论失败');
        }
    } catch (error: any) {
        console.error('发表评论失败:', error);
        ElMessage.error('发表评论失败');
    } finally {
        submittingComment.value = false;
    }
}

// 点赞评论
async function handleLikeComment(comment: any) {
    try {
        const isLike = !comment.isLiked;
        const resp = await likeTaskComment({ commentId: comment.commentId, isLike: isLike ? 1 : 0 });
        if (resp.data?.code === 200) {
            comment.isLiked = isLike;
            comment.likeCount = (comment.likeCount || 0) + (isLike ? 1 : -1);
        }
    } catch (error: any) {
        console.error('点赞失败:', error);
    }
}

// 回复评论
function replyToComment(comment: any) {
    replyingTo.value = comment;
    newComment.value = `@${comment.employeeName} `;
}

// 渲染评论内容（处理@提及）
function renderCommentContent(content: string): string {
    if (!content) return '';
    return content.replace(/@(\S+)/g, '<span class="mention">@$1</span>');
}

// 渲染子任务流转图
function renderFlowChart() {
    if (!flowChartRef.value || !taskInfo.value?.nodes || taskInfo.value.nodes.length === 0) {
        return;
    }

    flowChartLoading.value = true;
    
    try {
        if (flowChartInstance) {
            flowChartInstance.dispose();
        }

        flowChartInstance = echarts.init(flowChartRef.value);

        const nodes: any[] = [];
        const edges: any[] = [];
        const nodeMap = new Map<string, any>();

        nodes.push({
            id: 'start',
            name: '开始',
            symbolSize: 60,
            itemStyle: { color: '#667eea' },
            label: { fontSize: 14, fontWeight: 'bold' }
        });

        taskInfo.value.nodes.forEach((node: any, index: number) => {
            const nodeId = node.id || node.taskNodeId || `node_${index}`;
            const status = node.status || 0;
            const progress = node.progress || 0;
            
            let color = '#9ca3af';
            if (status === 2) color = '#22c55e';
            else if (status === 1) color = '#eab308';
            else if (status === 0) color = '#3b82f6';

            const leader = node.leaderId ? employeesMap.value[String(node.leaderId)] : null;
            const leaderName = leader?.name || formatId(node.leaderId) || '-';
            
            nodes.push({
                id: nodeId,
                name: node.nodeName || '未命名节点',
                symbolSize: 100,
                itemStyle: { 
                    color: color,
                    borderColor: '#fff',
                    borderWidth: 3
                },
                label: { 
                    fontSize: 12, 
                    fontWeight: '600',
                    formatter: (params: any) => {
                        const name = params.name;
                        const maxLen = 10;
                        return name.length > maxLen ? name.substring(0, maxLen) + '...' : name;
                    },
                    position: 'inside',
                    color: '#1f2937'
                },
                nodeData: {
                    status,
                    progress,
                    leader: leaderName,
                    leaderId: node.leaderId,
                    executor: node.executorNames,
                    deadline: node.nodeDeadline
                }
            });

            nodeMap.set(nodeId, node);
        });

        nodes.push({
            id: 'end',
            name: '结束',
            symbolSize: 60,
            itemStyle: { color: '#f5576c' },
            label: { fontSize: 14, fontWeight: 'bold' }
        });

        taskInfo.value.nodes.forEach((node: any, index: number) => {
            const nodeId = node.id || node.taskNodeId || `node_${index}`;
            const prerequisiteNodes = node.prerequisiteNodes || node.exNodeIds || '';
            
            if (prerequisiteNodes && prerequisiteNodes !== '' && prerequisiteNodes !== 'null') {
                const prereqIds = prerequisiteNodes.split(',').map((id: string) => id.trim()).filter(Boolean);
                prereqIds.forEach((prereqId: string) => {
                    const sourceId = prereqId === 'start' ? 'start' : prereqId;
                    if (nodeMap.has(sourceId) || sourceId === 'start') {
                        edges.push({
                            source: sourceId,
                            target: nodeId,
                            lineStyle: {
                                color: '#6366f1',
                                width: 2,
                                curveness: 0.2
                            }
                        });
                    }
                });
            } else {
                edges.push({
                    source: 'start',
                    target: nodeId,
                    lineStyle: {
                        color: '#6366f1',
                        width: 2,
                        curveness: 0.2
                    }
                });
            }
        });

        const hasOutgoing = new Set(edges.map(e => e.source));
        taskInfo.value.nodes.forEach((node: any, index: number) => {
            const nodeId = node.id || node.taskNodeId || `node_${index}`;
            if (!hasOutgoing.has(nodeId)) {
                edges.push({
                    source: nodeId,
                    target: 'end',
                    lineStyle: {
                        color: '#6366f1',
                        width: 2,
                        curveness: 0.2
                    }
                });
            }
        });

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(31, 41, 55, 0.95)',
                borderColor: '#667eea',
                borderWidth: 1,
                textStyle: {
                    color: '#f9fafb',
                    fontSize: 13
                },
                padding: [12, 16],
                formatter: (params: any) => {
                    if (params.dataType === 'node') {
                        const nodeData = params.data.nodeData;
                        if (nodeData) {
                            const statusColor = nodeData.status === 2 ? '#22c55e' : 
                                              nodeData.status === 1 ? '#eab308' : 
                                              nodeData.status === 0 ? '#3b82f6' : '#9ca3af';
                            return `
                                <div style="padding: 4px 0;">
                                    <div style="font-weight: 700; font-size: 15px; margin-bottom: 10px; color: #ffffff;">
                                        ${params.data.name}
                                    </div>
                                    <div style="font-size: 12px; line-height: 1.8; color: #e5e7eb;">
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></span>
                                            <span>状态: <strong style="color: ${statusColor};">${getNodeStatusText(nodeData.status)}</strong></span>
                                        </div>
                                        <div style="margin-bottom: 6px;">📊 进度: <strong>${nodeData.progress}%</strong></div>
                                        <div style="margin-bottom: 6px;">👤 负责人: <strong>${nodeData.leader || '-'}</strong></div>
                                        <div style="margin-bottom: 6px;">👥 执行人: ${nodeData.executor || '-'}</div>
                                        <div>📅 截止: ${nodeData.deadline || '-'}</div>
                                    </div>
                                </div>
                            `;
                        }
                        return params.data.name;
                    }
                    return `<div style="color: #e5e7eb;">${params.data.source} → ${params.data.target}</div>`;
                }
            },
            series: [{
                type: 'graph',
                layout: 'force',
                data: nodes,
                links: edges,
                roam: true,
                draggable: true,
                symbolSize: (value: number, params: any) => {
                    if (params.data.id === 'start' || params.data.id === 'end') {
                        return 70;
                    }
                    return 110;
                },
                label: {
                    show: true,
                    position: 'inside',
                    fontSize: 13,
                    fontWeight: '600',
                    color: '#1f2937'
                },
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 3
                },
                symbol: 'circle',
                lineStyle: {
                    color: '#6366f1',
                    width: 2.5,
                    curveness: 0.3,
                    opacity: 0.8
                },
                emphasis: {
                    focus: 'adjacency',
                    scale: true,
                    lineStyle: {
                        width: 4,
                        color: '#2563eb'
                    },
                    itemStyle: {
                        shadowBlur: 15,
                        shadowColor: 'rgba(37, 99, 235, 0.4)',
                        borderWidth: 3
                    }
                },
                force: {
                    repulsion: 2500,
                    gravity: 0.15,
                    edgeLength: 180,
                    layoutAnimation: true,
                    friction: 0.8
                },
                animation: true,
                animationDuration: 1000,
                animationEasing: 'cubicOut'
            }]
        };

        flowChartInstance.setOption(option);

        window.addEventListener('resize', () => {
            flowChartInstance?.resize();
        });

    } catch (error: any) {
        console.error('渲染流转图失败:', error);
        ElMessage.error('渲染流转图失败');
    } finally {
        flowChartLoading.value = false;
    }
}

onMounted(async () => {
    try {
        const empRes = await getMyEmployee();
        const emp = empRes?.data?.data || empRes?.data?.employee || {};
        currentEmployeeId.value = emp.id || emp.employeeId || emp.Id || emp.EmployeeId || '';
    } catch (error: any) {
        console.error('获取当前用户信息失败:', error);
    }
    
    await loadEmployees();
    await loadTaskDetail();
    loadAttachments();
    loadComments();
    
    // 检查URL参数，如果有edit参数则自动打开编辑对话框
    if (route.query.edit === 'true' && canEditTask.value) {
        openEditDialog();
    }
});

watch(() => taskInfo.value?.nodes, () => {
    nextTick(() => {
        renderFlowChart();
    });
}, { deep: true });
</script>

<style scoped>
.task-detail-page {
    min-height: 100vh;
    background: var(--bg-page);
}

/* 英雄区域 */
.hero-section {
    position: relative;
    padding: 40px 24px;
    color: white;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
}

.hero-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
}

.hero-content {
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
}

.back-btn {
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 14px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

.back-btn:hover {
    color: white !important;
    transform: translateX(-4px);
}

.hero-title {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.task-title {
    font-size: 36px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    line-height: 1.2;
}

.edit-task-btn {
    background: rgba(255, 255, 255, 0.2) !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    color: white !important;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.edit-task-btn:hover {
    background: rgba(255, 255, 255, 0.3) !important;
    border-color: rgba(255, 255, 255, 0.6) !important;
    transform: translateY(-2px);
}

.hero-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.hero-tag {
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.2) !important;
}

.tag-icon {
    font-size: 16px;
}

.progress-badge {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 16px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
}

.hero-progress {
    width: 120px;
}

.progress-text {
    font-weight: 700;
    font-size: 16px;
    min-width: 50px;
}

/* 内容区域 */
.content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
}

/* 关键信息网格 */
.key-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

.info-card {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    border: 1px solid var(--border-color);
}

.info-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
}

.info-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.info-content {
    flex: 1;
    min-width: 0;
}

.info-label {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
    margin-bottom: 6px;
}

.info-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
    letter-spacing: -0.01em;
    word-break: break-word;
}

/* 详细信息网格 */
.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
}

@media (max-width: 1200px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }
}

.detail-left,
.detail-right {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.detail-card {
    background: var(--bg-card);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
    overflow: hidden;
}

.detail-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.detail-card :deep(.el-card__header) {
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    padding: 20px 24px;
}

.card-header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
    width: 100%;
}

.title-icon {
    font-size: 20px;
    color: var(--color-primary);
}

/* 描述卡片 */
.description-content {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-main);
    padding: 16px;
    background: var(--bg-hover);
    border-radius: 12px;
    border-left: 4px solid var(--color-primary);
}

/* 节点列表 */
.nodes-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.node-item {
    background: var(--bg-card);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid var(--border-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}

.node-item:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    transform: translateX(4px);
}

.node-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.node-status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.node-status-indicator.status-0 {
    background: #3b82f6;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}

.node-status-indicator.status-1 {
    background: #eab308;
    box-shadow: 0 0 8px rgba(234, 179, 8, 0.5);
    animation: pulse 2s ease-in-out infinite;
}

.node-status-indicator.status-2 {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.node-name {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
}

.node-status-tag {
    font-weight: 500;
}

.node-meta {
    display: flex;
    gap: 20px;
    margin-bottom: 12px;
    font-size: 13px;
    color: var(--text-secondary);
}

.node-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.node-progress {
    margin-top: 8px;
}

/* 节点折叠面板样式 */
.node-collapse-item {
    margin-bottom: 12px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
}

.node-collapse-item:hover {
    border-color: var(--color-primary-light);
}

.node-collapse-item :deep(.el-collapse-item__header) {
    background: var(--bg-card);
    padding: 16px 20px;
    height: auto;
    line-height: 1.5;
    border-bottom: none;
    color: var(--text-main);
}

.node-collapse-item :deep(.el-collapse-item__content) {
    padding: 0;
    background: var(--bg-hover);
}

.node-collapse-item :deep(.el-collapse-item__wrap) {
    border-top: 1px solid var(--border-color);
}

.node-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding-right: 16px;
}

.node-progress-mini {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
}

.node-progress-mini .progress-text {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
    min-width: 36px;
}

.node-detail-content {
    padding: 16px 20px;
}

.node-detail-content .node-meta {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px dashed var(--border-color);
}

.node-checklist {
    margin-top: 8px;
}

/* 流程图 */
.flow-chart-container {
    width: 100%;
    min-height: 500px;
    background: var(--bg-card);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid var(--border-color);
}

.flow-chart {
    width: 100%;
    height: 500px;
    border-radius: 8px;
}

/* 日志 */
.logs-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 600px;
    overflow-y: auto;
    padding-right: 8px;
}

.logs-container::-webkit-scrollbar {
    width: 6px;
}

.logs-container::-webkit-scrollbar-track {
    background: var(--bg-hover);
    border-radius: 3px;
}

.logs-container::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 3px;
}

.log-item {
    display: flex;
    gap: 16px;
    position: relative;
    transition: all 0.3s ease;
    cursor: pointer;
}

.log-item:hover {
    transform: translateX(4px);
}

.log-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    flex-shrink: 0;
    margin-top: 6px;
    box-shadow: 0 0 8px rgba(102, 126, 234, 0.5);
    position: relative;
}

.log-dot::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-primary-light);
    animation: ripple 2s ease-in-out infinite;
}

@keyframes ripple {
    0% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 1;
    }
    100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
    }
}

.log-content-wrapper {
    flex: 1;
    background: var(--bg-card);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
}

.log-item:hover .log-content-wrapper {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
}

.log-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.log-type-tag {
    font-weight: 500;
}

.log-operator {
    display: flex;
    align-items: center;
    gap: 8px;
}

.log-avatar {
    border: 2px solid var(--border-color);
}

.operator-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-main);
}

.log-time {
    font-size: 12px;
    color: var(--text-muted);
    margin-left: auto;
}

.log-text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-secondary);
}

.log-pagination {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: center;
}

/* 工具提示 */
.tooltip {
    position: fixed;
    background: linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    pointer-events: none;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 300px;
    white-space: pre-line;
    animation: tooltipFadeIn 0.2s ease;
}

@keyframes tooltipFadeIn {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.tooltip-title {
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 6px;
    color: #f9fafb;
}

.tooltip-content {
    font-size: 12px;
    line-height: 1.6;
    color: #e5e7eb;
}

/* 附件列表 */
.attachments-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.attachment-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--bg-hover);
    border-radius: 10px;
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
}

.attachment-item:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
    transform: translateX(4px);
}

.file-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
    flex-shrink: 0;
}

.file-icon.file-type-image { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.file-icon.file-type-pdf { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.file-icon.file-type-word { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.file-icon.file-type-excel { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.file-icon.file-type-ppt { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.file-icon.file-type-text { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.file-icon.file-type-other { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }

.file-info {
    flex: 1;
    min-width: 0;
}

.file-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.file-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
}

.file-actions {
    display: flex;
    gap: 8px;
}

/* 评论区 */
.comment-input {
    margin-bottom: 20px;
}

.comment-input :deep(.el-textarea__inner) {
    border-radius: 12px;
    border: 2px solid var(--border-color);
    transition: all 0.3s ease;
    background-color: var(--bg-card);
    color: var(--text-main);
}

.comment-input :deep(.el-textarea__inner):focus {
    border-color: var(--color-primary);
}

.comment-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comment-item {
    display: flex;
    gap: 12px;
}

.comment-avatar {
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    color: white;
    font-weight: 600;
}

.comment-content {
    flex: 1;
    min-width: 0;
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
}

.comment-author {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
}

.comment-time {
    font-size: 12px;
    color: var(--text-muted);
}

.comment-text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-main);
    background: var(--bg-hover);
    padding: 12px 16px;
    border-radius: 0 12px 12px 12px;
    border: 1px solid var(--border-color);
}

.comment-text :deep(.mention) {
    color: var(--color-primary);
    font-weight: 500;
    background: var(--color-primary-light);
    padding: 2px 6px;
    border-radius: 4px;
}

.comment-footer {
    display: flex;
    gap: 16px;
    margin-top: 8px;
}

.replies-list {
    margin-top: 12px;
    padding-left: 16px;
    border-left: 2px solid var(--border-color);
}

.reply-item {
    font-size: 13px;
    color: var(--text-secondary);
    padding: 8px 0;
}

.reply-author {
    font-weight: 600;
    color: var(--color-primary);
}

.reply-to {
    color: var(--text-muted);
    margin: 0 4px;
}

.reply-content {
    margin-left: 4px;
}

.reply-time {
    font-size: 11px;
    color: var(--text-muted);
    margin-left: 8px;
}

/* 上传对话框 */
.upload-dialog :deep(.el-dialog__body) {
    padding: 20px 24px;
}

.upload-drop-zone {
    border: 2px dashed var(--border-color);
    border-radius: 16px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--bg-hover);
}

.upload-drop-zone:hover,
.upload-drop-zone.drag-over {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
}

.upload-icon {
    font-size: 48px;
    color: var(--color-primary);
    margin-bottom: 16px;
}

.upload-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 8px;
}

.upload-hint {
    font-size: 13px;
    color: var(--text-muted);
}

.upload-node-select {
    margin-bottom: 20px;
}

.upload-field-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 8px;
}

.upload-field-hint {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 6px;
}

.upload-field-error {
    font-size: 12px;
    color: var(--color-danger);
    margin-top: 6px;
}

.required-mark {
    color: var(--color-danger);
    margin-right: 4px;
}

.upload-node-select :deep(.el-select.is-error .el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--color-danger) inset;
}

.attachment-filter {
    margin-left: 16px;
}

.file-node-tag {
    margin-left: 8px;
}

.selected-files {
    margin-top: 20px;
}

.selected-files-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 12px;
}

.selected-file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--bg-hover);
    border-radius: 10px;
    margin-bottom: 8px;
    border: 1px solid var(--border-color);
}

.selected-file-item .file-info {
    flex: 1;
    min-width: 0;
}

.selected-file-item .file-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.selected-file-item .file-size {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
}

.selected-file-item .file-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
}

/* @提及列表 */
.mention-list {
    position: fixed;
    z-index: 2000;
    width: 300px;
    max-height: 350px;
    background: var(--bg-card);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border-color);
    overflow: hidden;
    animation: mentionListFadeIn 0.2s ease;
}

@keyframes mentionListFadeIn {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.mention-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-hover);
}

.mention-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;
}

.mention-tab:hover {
    color: var(--color-primary);
    background: var(--color-primary-light);
}

.mention-tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    background: var(--bg-card);
}

.mention-list-content {
    max-height: 280px;
    overflow-y: auto;
}

.mention-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mention-item:hover {
    background: var(--bg-hover);
}

.mention-avatar {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    color: white;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
}

.mention-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);
}

.mention-empty {
    padding: 24px 16px;
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
}

/* 节点提及样式 */
.mention-node-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: white;
    flex-shrink: 0;
}

.mention-node-icon.status-0 { background: #3b82f6; }
.mention-node-icon.status-1 { background: #eab308; }
.mention-node-icon.status-2 { background: #22c55e; }

.mention-node-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mention-node-meta {
    font-size: 12px;
    color: var(--text-muted);
}

/* 节点选择下拉框样式 */
.node-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.node-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.node-status-dot.status-0 { background: #3b82f6; }
.node-status-dot.status-1 { background: #eab308; }
.node-status-dot.status-2 { background: #22c55e; }

/* 评论中的节点标签 */
.comment-node-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;
}

.comment-node-tag .el-icon {
    font-size: 12px;
}

.comment-input-wrapper {
    position: relative;
}

.comment-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
    gap: 8px;
}

/* 附件预览对话框 */
.file-preview-dialog :deep(.el-dialog__body) {
    padding: 0;
}

.file-preview-container {
    display: flex;
    height: 600px;
}

.preview-left {
    flex: 1;
    background: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow: hidden;
}

.preview-area {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.preview-pdf {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 8px;
}

.preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: white;
}

.preview-placeholder .file-icon.large {
    width: 80px;
    height: 80px;
    font-size: 36px;
}

.preview-file-name {
    font-size: 18px;
    font-weight: 600;
    max-width: 300px;
    text-align: center;
    word-break: break-word;
}

.preview-file-meta {
    font-size: 14px;
    color: #9ca3af;
}

.preview-right {
    width: 320px;
    background: var(--bg-card);
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--border-color);
}

.preview-comments-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
    border-bottom: 1px solid var(--border-color);
}

.file-comment-input {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
}

.file-comment-input :deep(.el-textarea__inner) {
    border-radius: 10px;
}

.file-comments-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
}

.file-comment-item {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
}

.file-comment-avatar {
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    color: white;
    font-size: 11px;
    font-weight: 600;
}

.file-comment-content {
    flex: 1;
    min-width: 0;
}

.file-comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.file-comment-author {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-main);
}

.file-comment-time {
    font-size: 11px;
    color: var(--text-muted);
}

.file-comment-text {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-secondary);
    background: var(--bg-hover);
    padding: 8px 12px;
    border-radius: 0 10px 10px 10px;
}

.file-comment-annotation {
    margin-top: 6px;
}

/* 响应式 */
@media (max-width: 768px) {
    .task-title {
        font-size: 24px;
    }
    
    .key-info-grid {
        grid-template-columns: 1fr;
    }
    
    .detail-grid {
        grid-template-columns: 1fr;
    }
    
    .hero-meta {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .file-preview-container {
        flex-direction: column;
        height: auto;
    }
    
    .preview-left {
        height: 300px;
    }
    
    .preview-right {
        width: 100%;
        height: 400px;
    }
    
    .comment-filter {
        width: 100%;
        margin-top: 12px;
    }
    
    .comment-filter .el-select {
        width: 100% !important;
    }
}

/* AI推荐派发对话框样式 */
.recommendations-container {
    max-height: 60vh;
    overflow-y: auto;
}

.recommendation-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
}

.rec-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
}

.rec-header .el-icon {
    color: var(--color-primary);
}

.rec-analysis {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--bg-hover);
    border-radius: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: var(--text-secondary);
}

.rec-analysis .el-icon {
    color: var(--color-primary);
    flex-shrink: 0;
    margin-top: 2px;
}

.rec-candidates {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.candidate-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--bg-page);
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.candidate-item:hover {
    background: var(--bg-hover);
    border-color: var(--color-primary-light);
}

.candidate-item.selected {
    background: rgba(var(--color-primary-rgb), 0.1);
    border-color: var(--color-primary);
}

.candidate-rank {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
}

.candidate-info {
    flex: 1;
    min-width: 0;
}

.candidate-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.candidate-reason {
    font-size: 12px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.candidate-score {
    flex-shrink: 0;
}
</style>
