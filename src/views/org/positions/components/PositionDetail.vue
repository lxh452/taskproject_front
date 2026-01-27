<template>
  <el-drawer
    v-model="visible"
    title="职位详情"
    size="480px"
    class="position-detail-drawer"
    destroy-on-close
  >
    <div v-if="position" class="detail-content">
      <!-- Header -->
      <div class="detail-header">
        <div class="header-icon">
          <el-icon><Briefcase /></el-icon>
        </div>
        <div class="header-info">
          <h3 class="position-name">{{ position.positionName }}</h3>
          <div class="header-tags">
            <el-tag size="small" effect="plain" class="code-tag" v-if="position.positionCode">
              {{ position.positionCode }}
            </el-tag>
            <el-tag
              size="small"
              :type="position.status === 1 ? 'success' : 'info'"
              effect="light"
            >
              {{ position.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- Basic Info -->
      <div class="detail-section">
        <div class="section-title">基本信息</div>
        <el-descriptions :column="1" border class="detail-desc">
          <el-descriptions-item label="所属部门">
            <div class="dept-cell">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ position.departmentName }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="职位级别">
            <el-tag
              size="small"
              :type="getLevelType(position.positionLevel)"
              effect="light"
            >
              L{{ position.positionLevel }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="岗位类型">
            <el-tag
              size="small"
              :type="position.isManagement === 1 ? 'warning' : 'info'"
              effect="light"
            >
              {{ position.isManagement === 1 ? '管理岗' : '普通岗' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- Description -->
      <div class="detail-section" v-if="hasDescription">
        <div class="section-title">职位描述</div>

        <div class="desc-item" v-if="position.skillRequirements">
          <div class="desc-label">技能要求</div>
          <div class="desc-content">{{ position.skillRequirements }}</div>
        </div>

        <div class="desc-item" v-if="position.description">
          <div class="desc-label">职位描述</div>
          <div class="desc-content">{{ position.description }}</div>
        </div>

        <div class="desc-item" v-if="position.responsibilities">
          <div class="desc-label">工作职责</div>
          <div class="desc-content">{{ position.responsibilities }}</div>
        </div>

        <div class="desc-item" v-if="position.requirements">
          <div class="desc-label">任职要求</div>
          <div class="desc-content">{{ position.requirements }}</div>
        </div>
      </div>

      <!-- Empty description state -->
      <div class="detail-section" v-else>
        <div class="section-title">职位描述</div>
        <div class="empty-desc">
          <el-icon><Document /></el-icon>
          <span>暂无职位描述</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" @click="handleEdit">编辑</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Briefcase, OfficeBuilding, Document } from '@element-plus/icons-vue';
import type { Position } from '../types';

interface Props {
  modelValue: boolean;
  position: Position | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'edit', position: Position): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const hasDescription = computed(() => {
  if (!props.position) return false;
  return (
    props.position.skillRequirements ||
    props.position.description ||
    props.position.responsibilities ||
    props.position.requirements
  );
});

function getLevelType(level: number): '' | 'success' | 'warning' | 'danger' | 'info' {
  if (level >= 15) return 'danger';
  if (level >= 10) return 'warning';
  if (level >= 5) return 'success';
  return 'info';
}

function handleEdit() {
  if (props.position) {
    emit('edit', props.position);
    visible.value = false;
  }
}
</script>

<style scoped>
.position-detail-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.position-detail-drawer :deep(.el-drawer__title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.position-detail-drawer :deep(.el-drawer__body) {
  padding: 0;
  background: var(--bg-card);
}

.position-detail-drawer :deep(.el-drawer__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.detail-content {
  padding: 24px;
}

/* Header */
.detail-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.position-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 10px;
  line-height: 1.3;
}

.header-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.code-tag {
  font-family: var(--font-family-mono);
  background: var(--bg-tertiary);
  border: none;
}

/* Sections */
.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

/* Descriptions */
.detail-desc {
  margin: 0;
}

.detail-desc :deep(.el-descriptions__label) {
  width: 100px;
  font-weight: 500;
  color: var(--text-secondary);
}

.dept-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dept-cell .el-icon {
  color: var(--text-muted);
}

/* Description items */
.desc-item {
  margin-bottom: 16px;
}

.desc-item:last-child {
  margin-bottom: 0;
}

.desc-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.desc-content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

/* Empty state */
.empty-desc {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--text-muted);
  gap: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-color);
}

.empty-desc .el-icon {
  font-size: 32px;
  opacity: 0.5;
}

/* Footer */
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
