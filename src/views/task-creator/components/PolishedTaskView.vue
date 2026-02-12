<template>
  <div class="polished-task-view">
    <div class="header">
      <h4>✨ AI 润色结果</h4>
      <div class="confidence-badge" v-if="task.aiConfidence">
        置信度 {{ task.aiConfidence }}%
      </div>
    </div>

    <div class="content">
      <div class="field-group">
        <label>任务标题</label>
        <div class="field-value title">{{ task.title }}</div>
        <div class="improvement-tag">优化后</div>
      </div>

      <div class="field-group">
        <label>任务描述</label>
        <div class="field-value description">{{ task.description }}</div>
      </div>

      <div class="field-row">
        <div class="field-group half">
          <label>建议截止日期</label>
          <div class="field-value">
            <span class="icon">📅</span>
            {{ formatDate(task.suggestedDueDate) }}
          </div>
        </div>

        <div class="field-group half">
          <label>优先级</label>
          <div class="field-value">
            <span :class="['priority-badge', task.suggestedPriority]">
              {{ getPriorityLabel(task.suggestedPriority) }}
            </span>
          </div>
        </div>
      </div>

      <div class="field-group">
        <label>标签</label>
        <div class="tags-list">
          <span v-for="tag in task.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <div class="field-group">
        <label>复杂度评估</label>
        <div class="complexity-bar">
          <div 
            class="complexity-fill" 
            :class="task.complexity"
            :style="{ width: getComplexityPercent(task.complexity) }"
          ></div>
          <span class="complexity-label">{{ getComplexityLabel(task.complexity) }}</span>
        </div>
      </div>

      <div class="field-group" v-if="task.keyPoints?.length">
        <label>关键要点</label>
        <ul class="key-points-list">
          <li v-for="(point, index) in task.keyPoints" :key="index">
            <span class="point-icon">✓</span>
            {{ point }}
          </li>
        </ul>
      </div>

      <div class="field-group" v-if="task.subtasks?.length">
        <label>建议子任务 ({{ task.subtasks.length }}个)</label>
        <div class="subtasks-list">
          <div 
            v-for="subtask in task.subtasks" 
            :key="subtask.id || subtask.order"
            class="subtask-card"
          >
            <div class="subtask-order">{{ subtask.order }}</div>
            <div class="subtask-content">
              <div class="subtask-title">{{ subtask.title }}</div>
              <div class="subtask-desc" v-if="subtask.description">
                {{ subtask.description }}
              </div>
            </div>
            <div class="subtask-time" v-if="subtask.estimatedHours">
              {{ subtask.estimatedHours }}h
            </div>
          </div>
        </div>
      </div>

      <div class="field-group" v-if="task.suggestedAssignee">
        <label>推荐负责人</label>
        <div class="assignee-card">
          <img 
            :src="task.suggestedAssignee.avatar || '/default-avatar.png'" 
            class="assignee-avatar" 
          />
          <div class="assignee-info">
            <div class="assignee-name">{{ task.suggestedAssignee.name }}</div>
            <div class="assignee-dept" v-if="task.suggestedAssignee.department">
              {{ task.suggestedAssignee.department }}
            </div>
          </div>
          <div class="match-indicator">
            <div class="match-score">{{ task.suggestedAssignee.matchScore }}%</div>
            <div class="match-label">匹配度</div>
          </div>
        </div>
        <div class="match-reason" v-if="task.suggestedAssignee.matchReason">
          💡 {{ task.suggestedAssignee.matchReason }}
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn secondary" @click="$emit('edit', task)">
        ✏️ 调整内容
      </button>
      <button class="btn primary" @click="$emit('create', task)">
        ✅ 确认创建
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PolishedTask {
  title: string;
  description: string;
  aiConfidence?: number;
  suggestedDueDate: string;
  suggestedPriority: 'high' | 'medium' | 'low';
  tags: string[];
  complexity: 'simple' | 'medium' | 'complex';
  keyPoints?: string[];
  subtasks?: Array<{
    id?: string;
    order: number;
    title: string;
    description?: string;
    estimatedHours?: number;
  }>;
  suggestedAssignee?: {
    name: string;
    avatar?: string;
    department?: string;
    matchScore: number;
    matchReason?: string;
  };
}

defineProps<{
  task: PolishedTask;
}>();

defineEmits(['create', 'edit']);

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  };
  return labels[priority] || priority;
};

const getComplexityLabel = (complexity: string): string => {
  const labels: Record<string, string> = {
    simple: '简单',
    medium: '中等',
    complex: '复杂'
  };
  return labels[complexity] || complexity;
};

const getComplexityPercent = (complexity: string): string => {
  const percents: Record<string, string> = {
    simple: '33%',
    medium: '66%',
    complex: '100%'
  };
  return percents[complexity] || '50%';
};
</script>

<style scoped>
.polished-task-view {
  background: linear-gradient(135deg, #fff 0%, #f5f7fa 100%);
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ecf5ff;
  border-bottom: 1px solid #d9ecff;
}

.header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  margin: 0;
}

.confidence-badge {
  padding: 4px 12px;
  background: #409eff;
  color: #fff;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.content {
  padding: 20px;
}

.field-group {
  margin-bottom: 20px;
}

.field-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-row {
  display: flex;
  gap: 16px;
}

.field-group.half {
  flex: 1;
}

.field-value {
  padding: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  font-size: 14px;
  color: #303133;
}

.field-value.title {
  font-size: 16px;
  font-weight: 600;
  position: relative;
}

.improvement-tag {
  position: absolute;
  top: -8px;
  right: 8px;
  background: #67c23a;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.field-value.description {
  line-height: 1.6;
  min-height: 60px;
}

.field-value .icon {
  margin-right: 6px;
}

.priority-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.priority-badge.high {
  background: #fde2e2;
  color: #c45656;
}

.priority-badge.medium {
  background: #faecd8;
  color: #a16215;
}

.priority-badge.low {
  background: #e1f3d8;
  color: #529b2e;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 12px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 16px;
  font-size: 13px;
}

.complexity-bar {
  height: 32px;
  background: #f5f7fa;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.complexity-fill {
  height: 100%;
  border-radius: 16px;
  transition: width 0.5s ease;
}

.complexity-fill.simple {
  background: linear-gradient(90deg, #67c23a, #85ce61);
}

.complexity-fill.medium {
  background: linear-gradient(90deg, #e6a23c, #ebb563);
}

.complexity-fill.complex {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.complexity-label {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.key-points-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.key-points-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: #606266;
  border-bottom: 1px solid #f0f0f0;
}

.key-points-list li:last-child {
  border-bottom: none;
}

.point-icon {
  color: #67c23a;
  font-weight: 600;
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.subtask-order {
  width: 28px;
  height: 28px;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.subtask-content {
  flex: 1;
  min-width: 0;
}

.subtask-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.subtask-desc {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subtask-time {
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.assignee-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.assignee-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.assignee-info {
  flex: 1;
}

.assignee-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.assignee-dept {
  font-size: 12px;
  color: #909399;
}

.match-indicator {
  text-align: center;
}

.match-score {
  font-size: 20px;
  font-weight: 700;
  color: #67c23a;
}

.match-label {
  font-size: 11px;
  color: #909399;
}

.match-reason {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f9eb;
  border-radius: 6px;
  font-size: 12px;
  color: #67c23a;
}

.actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
}

.btn {
  flex: 1;
  padding: 10px 20px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn.secondary:hover {
  border-color: #409eff;
  color: #409eff;
}

.btn.primary {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.btn.primary:hover {
  background: #66b1ff;
}

/* 移动端适配 */
@media (max-width: 768px) {
  /* 隐藏辅助描述文字 */
  .field-group label,
  .improvement-tag,
  .subtask-desc,
  .assignee-dept,
  .match-label,
  .match-reason,
  .key-points-list li,
  .confidence-badge,
  .complexity-label {
    display: none !important;
  }

  .polished-task-view {
    border-radius: 8px;
  }

  .header {
    padding: 12px 16px;
  }

  .header h4 {
    font-size: 14px;
  }

  .content {
    padding: 16px;
  }

  .field-group {
    margin-bottom: 16px;
  }

  .field-row {
    flex-direction: column;
    gap: 12px;
  }

  .field-value {
    padding: 10px;
    font-size: 13px;
  }

  .field-value.title {
    font-size: 14px;
  }

  .priority-badge {
    padding: 3px 10px;
    font-size: 12px;
  }

  .tags-list {
    gap: 6px;
  }

  .tag {
    padding: 4px 10px;
    font-size: 12px;
  }

  .complexity-bar {
    height: 24px;
  }

  .subtask-card {
    padding: 10px;
    gap: 10px;
  }

  .subtask-order {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }

  .subtask-title {
    font-size: 13px;
  }

  .subtask-time {
    padding: 3px 6px;
    font-size: 11px;
  }

  .assignee-card {
    padding: 10px;
    gap: 10px;
  }

  .assignee-avatar {
    width: 40px;
    height: 40px;
  }

  .assignee-name {
    font-size: 14px;
  }

  .match-score {
    font-size: 18px;
  }

  .actions {
    padding: 12px 16px;
    gap: 10px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 10px 12px;
  }

  .header h4 {
    font-size: 13px;
  }

  .content {
    padding: 12px;
  }

  .field-group {
    margin-bottom: 12px;
  }

  .field-value {
    padding: 8px;
    font-size: 12px;
  }

  .field-value.title {
    font-size: 13px;
  }

  .subtask-card {
    padding: 8px;
  }

  .subtask-order {
    width: 22px;
    height: 22px;
    font-size: 10px;
  }

  .subtask-title {
    font-size: 12px;
  }

  .assignee-avatar {
    width: 36px;
    height: 36px;
  }

  .assignee-name {
    font-size: 13px;
  }

  .match-score {
    font-size: 16px;
  }

  .actions {
    padding: 10px 12px;
    flex-direction: column;
  }

  .btn {
    font-size: 12px;
    padding: 8px 12px;
  }

  /* 隐藏更多辅助信息 */
  .subtask-time,
  .match-indicator {
    display: none !important;
  }
}
</style>
