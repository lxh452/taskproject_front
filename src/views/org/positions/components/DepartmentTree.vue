<template>
  <div class="dept-tree-container" :class="{ collapsed: isCollapsed }">
    <div class="tree-header">
      <div class="header-content" v-show="!isCollapsed">
        <el-icon class="header-icon"><OfficeBuilding /></el-icon>
        <span class="header-title">部门导航</span>
      </div>
      <el-button
        :icon="isCollapsed ? Expand : Fold"
        text
        circle
        class="collapse-btn"
        @click="toggleCollapse"
        :title="isCollapsed ? '展开' : '收起'"
      />
    </div>

    <div class="tree-content" v-show="!isCollapsed">
      <el-skeleton :rows="5" animated v-if="loading" />
      <template v-else>
        <!-- 全部部门选项 -->
        <div
          class="tree-item all-dept"
          :class="{ active: !selectedId }"
          @click="handleSelect('')"
        >
          <div class="item-content">
            <el-icon class="item-icon"><Grid /></el-icon>
            <span class="item-label">全部部门</span>
          </div>
          <el-badge :value="totalCount" :max="999" type="info" class="item-badge" />
        </div>

        <!-- 部门树 -->
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="treeProps"
          node-key="id"
          :highlight-current="true"
          :expand-on-click-node="false"
          :current-node-key="selectedId"
          @node-click="handleNodeClick"
          class="dept-tree"
        >
          <template #default="{ node, data }">
            <div class="tree-node">
              <div class="node-content">
                <el-icon class="node-icon"><Folder /></el-icon>
                <span class="node-label" :title="data.name">{{ data.name }}</span>
              </div>
              <el-badge
                :value="data.positionCount || 0"
                :max="99"
                type="info"
                class="node-badge"
                v-if="data.positionCount > 0"
              />
            </div>
          </template>
        </el-tree>

        <div v-if="departments.length === 0" class="empty-tree">
          <el-icon><FolderOpened /></el-icon>
          <span>暂无部门</span>
        </div>
      </template>
    </div>

    <!-- 收起状态下的图标列表 -->
    <div class="collapsed-icons" v-show="isCollapsed">
      <div
        class="collapsed-item"
        :class="{ active: !selectedId }"
        @click="handleSelect('')"
        title="全部部门"
      >
        <el-icon><Grid /></el-icon>
      </div>
      <div
        v-for="dept in departments.slice(0, 8)"
        :key="dept.id"
        class="collapsed-item"
        :class="{ active: selectedId === dept.id }"
        @click="handleSelect(dept.id)"
        :title="dept.name"
      >
        <el-icon><Folder /></el-icon>
      </div>
      <div v-if="departments.length > 8" class="collapsed-more">
        <el-icon><MoreFilled /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { OfficeBuilding, Folder, FolderOpened, Grid, Expand, Fold, MoreFilled } from '@element-plus/icons-vue';
import type { Department } from '../types';

interface Props {
  departments: Department[];
  selectedId: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'collapse-change', collapsed: boolean): void;
}>();

const treeRef = ref();
const isCollapsed = ref(false);

const treeProps = {
  children: 'children',
  label: 'name',
};

// Build tree data from flat departments
const treeData = computed(() => {
  const map = new Map<string, Department & { children: Department[] }>();
  const roots: (Department & { children: Department[] })[] = [];

  // First pass: create nodes
  props.departments.forEach(dept => {
    map.set(dept.id, { ...dept, children: [] });
  });

  // Second pass: build tree
  props.departments.forEach(dept => {
    const node = map.get(dept.id)!;
    if (dept.parentId && map.has(dept.parentId)) {
      map.get(dept.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
});

// Total position count
const totalCount = computed(() => {
  return props.departments.reduce((sum, d) => sum + (d.positionCount || 0), 0);
});

function handleSelect(id: string) {
  emit('select', id);
}

function handleNodeClick(data: Department) {
  emit('select', data.id);
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  emit('collapse-change', isCollapsed.value);
}

// Sync tree selection when selectedId changes
watch(() => props.selectedId, (newId) => {
  if (treeRef.value && newId) {
    treeRef.value.setCurrentKey(newId);
  }
});
</script>

<style scoped>
.dept-tree-container {
  width: clamp(220px, 18vw, 280px);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  transition: width var(--transition-base);
}

.dept-tree-container.collapsed {
  width: 56px;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  min-height: 52px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: var(--color-primary);
  font-size: 18px;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.collapse-btn {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.collapse-btn:hover {
  color: var(--color-primary);
  background: var(--bg-hover);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* All departments item */
.tree-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 8px;
}

.tree-item:hover {
  background: var(--bg-hover);
}

.tree-item.active {
  background: var(--color-primary-light);
}

.tree-item.active .item-label {
  color: var(--color-primary);
  font-weight: 600;
}

.tree-item.active .item-icon {
  color: var(--color-primary);
}

.item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.item-icon {
  font-size: 16px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.item-label {
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-badge :deep(.el-badge__content) {
  font-size: 11px;
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: none;
}

/* Tree styles */
.dept-tree {
  --el-tree-node-hover-bg-color: var(--bg-hover);
  background: transparent;
}

.dept-tree :deep(.el-tree-node__content) {
  height: 40px;
  border-radius: var(--radius-md);
  padding: 0 8px;
}

.dept-tree :deep(.el-tree-node__content:hover) {
  background: var(--bg-hover);
}

.dept-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: var(--color-primary-light);
}

.dept-tree :deep(.el-tree-node__expand-icon) {
  color: var(--text-muted);
  font-size: 14px;
}

.dept-tree :deep(.el-tree-node__expand-icon.is-leaf) {
  color: transparent;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  padding-right: 4px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.node-icon {
  font-size: 15px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.is-current .node-icon {
  color: var(--color-primary);
}

.node-label {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-current .node-label {
  color: var(--color-primary);
  font-weight: 600;
}

.node-badge :deep(.el-badge__content) {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 5px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: none;
}

/* Empty state */
.empty-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
  gap: 8px;
}

.empty-tree .el-icon {
  font-size: 32px;
  opacity: 0.5;
}

/* Collapsed state icons */
.collapsed-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  gap: 8px;
}

.collapsed-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.collapsed-item:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.collapsed-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.collapsed-more {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 1024px) {
  .dept-tree-container {
    width: 100%;
    max-height: 200px;
    border-radius: var(--radius-lg);
  }

  .dept-tree-container.collapsed {
    width: 100%;
    max-height: 56px;
  }

  .tree-content {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
  }

  .tree-item {
    margin-bottom: 0;
    padding: 8px 12px;
  }

  .dept-tree {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .dept-tree :deep(.el-tree-node) {
    display: inline-block;
  }

  .dept-tree :deep(.el-tree-node__content) {
    height: 36px;
    padding: 0 12px;
  }

  .collapsed-icons {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .dept-tree-container {
    max-height: none;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 999;
    border-radius: 0;
    transform: translateX(-100%);
    transition: transform var(--transition-slow);
  }

  .dept-tree-container.mobile-open {
    transform: translateX(0);
  }
}
</style>
