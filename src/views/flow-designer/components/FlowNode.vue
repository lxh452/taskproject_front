<template>
  <div class="flow-node" :class="[data.status || 'pending', { selected: isSelected }]">
    <div class="node-header">
      <div class="node-handle source" data-handlepos="top"></div>
    </div>
    
    <div class="node-content">
      <div class="node-icon">{{ getStatusIcon(data.status) }}</div>
      <div class="node-info">
        <div class="node-label" :title="data.label">{{ data.label }}</div>
        <div class="node-meta" v-if="data.assignee || data.dueDate">
          <span v-if="data.assignee" class="meta-item">
            <small>👤 {{ data.assignee }}</small>
          </span>
          <span v-if="data.dueDate" class="meta-item">
            <small>📅 {{ formatDate(data.dueDate) }}</small>
          </span>
        </div>
      </div>
      <div class="node-priority" :class="data.priority" v-if="data.priority">
        {{ getPriorityIcon(data.priority) }}
      </div>
    </div>

    <div class="node-actions" v-if="isSelected">
      <button class="action-btn" @click.stop="$emit('edit')" title="编辑">
        ✏️
      </button>
      <button class="action-btn delete" @click.stop="$emit('delete')" title="删除">
        🗑️
      </button>
    </div>

    <div class="node-handles">
      <div class="node-handle target" data-handlepos="left"></div>
      <div class="node-handle source" data-handlepos="right"></div>
      <div class="node-handle target" data-handlepos="bottom"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string;
  data: {
    label: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    status?: string;
    priority?: string;
  };
  isSelected?: boolean;
}>();

defineEmits(['edit', 'delete']);

const getStatusIcon = (status?: string): string => {
  const icons: Record<string, string> = {
    pending: '⏳',
    in_progress: '🔄',
    completed: '✅',
    blocked: '⛔',
    cancelled: '❌'
  };
  return icons[status || 'pending'];
};

const getPriorityIcon = (priority?: string): string => {
  const icons: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };
  return icons[priority || 'medium'];
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};
</script>

<style scoped>
.flow-node {
  min-width: 150px;
  max-width: 200px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  position: relative;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.flow-node:hover {
  border-color: #c0c4cc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.flow-node.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.flow-node.pending {
  border-left: 3px solid #909399;
}

.flow-node.in_progress {
  border-left: 3px solid #e6a23c;
}

.flow-node.completed {
  border-left: 3px solid #67c23a;
}

.flow-node.blocked {
  border-left: 3px solid #f56c6c;
}

.node-header {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.node-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.node-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.meta-item {
  font-size: 11px;
  color: #909399;
}

.node-priority {
  font-size: 12px;
  flex-shrink: 0;
}

.node-actions {
  position: absolute;
  top: -10px;
  right: -10px;
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #f5f7fa;
}

.action-btn.delete:hover {
  background: #fde2e2;
}

.node-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.node-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 2px solid #c0c4cc;
  border-radius: 50%;
  pointer-events: all;
  cursor: crosshair;
  transition: all 0.3s;
}

.node-handle:hover {
  border-color: #409eff;
  transform: scale(1.2);
}

.node-handle[data-handlepos="top"] {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
}

.node-handle[data-handlepos="bottom"] {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
}

.node-handle[data-handlepos="left"] {
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
}

.node-handle[data-handlepos="right"] {
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
