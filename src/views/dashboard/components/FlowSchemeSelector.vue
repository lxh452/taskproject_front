<template>
  <div class="flow-scheme-selector">
    <!-- 任务选择 -->
    <div class="selector-header">
      <el-select
        v-model="selectedTaskId"
        placeholder="选择任务"
        filterable
        class="task-select"
        @change="handleTaskChange"
      >
        <el-option
          v-for="task in taskList"
          :key="task.id"
          :label="task.name"
          :value="task.id"
        />
      </el-select>
    </div>

    <!-- 需求输入 -->
    <div class="requirement-input">
      <el-input
        v-model="requirement"
        type="textarea"
        :rows="3"
        placeholder="描述您的流程需求，例如：需要先完成设计评审，再进行开发，最后测试验收..."
      />
    </div>

    <!-- AI生成按钮 -->
    <div class="generate-actions">
      <el-button
        type="primary"
        @click="generateSchemes"
        :loading="isGenerating"
        :disabled="!selectedTaskId"
      >
        <el-icon v-if="!isGenerating"><MagicStick /></el-icon>
        {{ isGenerating ? '正在生成方案...' : 'AI智能生成' }}
      </el-button>
    </div>

    <!-- 三张方案卡片 -->
    <div v-if="schemes.length > 0" class="schemes-grid">
      <div
        v-for="scheme in schemes"
        :key="scheme.id"
        class="scheme-card"
        :class="{
          'is-selected': selectedScheme?.id === scheme.id,
          'is-recommended': scheme.isRecommended
        }"
        @click="selectScheme(scheme)"
      >
        <!-- 推荐标签 -->
        <div v-if="scheme.isRecommended" class="card-badge">
          <el-icon><Star /></el-icon>
          推荐
        </div>

        <!-- 方案类型图标 -->
        <div class="scheme-type-icon" :class="'type-' + scheme.type">
          <el-icon v-if="scheme.type === 'serial'"><Sort /></el-icon>
          <el-icon v-else-if="scheme.type === 'parallel'"><Grid /></el-icon>
          <el-icon v-else><Share /></el-icon>
        </div>

        <!-- 方案名称 -->
        <h4 class="scheme-name">{{ scheme.name }}</h4>

        <!-- 方案描述 -->
        <p class="scheme-description">{{ scheme.description }}</p>

        <!-- 流程预览图 -->
        <div class="flow-preview-container">
          <FlowPreview
            :nodes="scheme.nodes"
            :edges="scheme.edges"
            :scheme-type="scheme.type"
          />
        </div>

        <!-- 方案元数据 -->
        <div class="card-meta">
          <div class="meta-item">
            <el-icon><Calendar /></el-icon>
            <span>{{ scheme.estimatedDays }} 天</span>
          </div>
          <div class="meta-item">
            <el-icon><User /></el-icon>
            <span>{{ scheme.requiredPeople }} 人</span>
          </div>
          <div class="meta-item" :class="'risk-' + scheme.riskLevel">
            <el-icon><Warning /></el-icon>
            <span>{{ getRiskLabel(scheme.riskLevel) }}</span>
          </div>
        </div>

        <!-- 选中指示器 -->
        <div v-if="selectedScheme?.id === scheme.id" class="selected-indicator">
          <el-icon><Check /></el-icon>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!isGenerating" class="empty-state">
      <el-icon class="empty-icon"><Document /></el-icon>
      <p>选择任务并输入需求，AI将为您生成三种流程方案</p>
    </div>

    <!-- 操作按钮 -->
    <div v-if="selectedScheme" class="actions">
      <el-button @click="previewScheme">
        <el-icon><View /></el-icon>
        预览流程
      </el-button>
      <el-button @click="editScheme">
        <el-icon><Edit /></el-icon>
        编辑流程
      </el-button>
      <el-button type="primary" @click="applyScheme" :loading="isApplying">
        <el-icon><Check /></el-icon>
        应用并保存
      </el-button>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="流程预览"
      width="800px"
      :append-to-body="true"
    >
      <div class="preview-dialog-content">
        <div class="preview-info">
          <h3>{{ selectedScheme?.name }}</h3>
          <p>{{ selectedScheme?.description }}</p>
        </div>
        <div class="preview-flow-large">
          <FlowPreview
            v-if="selectedScheme"
            :nodes="selectedScheme.nodes"
            :edges="selectedScheme.edges"
            :scheme-type="selectedScheme.type"
            large
          />
        </div>
        <div class="preview-nodes-list">
          <h4>节点列表</h4>
          <div v-for="node in selectedScheme?.nodes" :key="node.id" class="preview-node-item">
            <span class="node-name">{{ node.data?.label || node.id }}</span>
            <span class="node-prereq" v-if="node.data?.prerequisiteNodes?.length">
              前置: {{ node.data.prerequisiteNodes.join(', ') }}
            </span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  MagicStick, Star, Sort, Grid, Share, Calendar, User, Warning,
  Check, Document, View, Edit
} from '@element-plus/icons-vue';
import { listTasks, suggestFlowDesigns, listTaskNodesByTask } from '@/api';
import FlowPreview from '@/views/flow-designer/components/FlowPreview.vue';

interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    prerequisiteNodes?: string[];
    [key: string]: any;
  };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

interface FlowScheme {
  id: string;
  name: string;
  type: 'serial' | 'parallel' | 'mixed';
  description: string;
  estimatedDays: number;
  requiredPeople: number;
  riskLevel: 'low' | 'medium' | 'high';
  isRecommended: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface TaskItem {
  id: string;
  name: string;
}

const props = defineProps<{
  taskId?: string;
}>();

const emit = defineEmits<{
  (e: 'scheme-selected', scheme: FlowScheme): void;
  (e: 'edit-scheme', scheme: FlowScheme): void;
  (e: 'apply-scheme', scheme: FlowScheme): void;
}>();

// 状态
const taskList = ref<TaskItem[]>([]);
const selectedTaskId = ref<string>(props.taskId || '');
const requirement = ref('');
const schemes = ref<FlowScheme[]>([]);
const selectedScheme = ref<FlowScheme | null>(null);
const isGenerating = ref(false);
const isApplying = ref(false);
const showPreviewDialog = ref(false);
const existingNodes = ref<any[]>([]);

// 监听props变化
watch(() => props.taskId, (newVal) => {
  if (newVal) {
    selectedTaskId.value = newVal;
    loadExistingNodes();
  }
});

// 加载任务列表
async function loadTasks() {
  try {
    const res = await listTasks({ page: 1, pageSize: 100 });
    if (res?.data?.code === 200) {
      const list = res.data.data?.list || [];
      taskList.value = list.map((t: any) => ({
        id: String(t.id || t.taskId),
        name: t.taskTitle || t.title || t.name || '未命名任务'
      }));
    }
  } catch (e) {
    console.error('加载任务列表失败:', e);
  }
}

// 加载已有节点
async function loadExistingNodes() {
  if (!selectedTaskId.value) return;
  try {
    const res = await listTaskNodesByTask({ taskId: selectedTaskId.value, page: 1, pageSize: 100 });
    if (res?.data?.code === 200) {
      existingNodes.value = res.data.data?.list || [];
    }
  } catch (e) {
    console.error('加载节点失败:', e);
  }
}

// 任务变更处理
function handleTaskChange() {
  schemes.value = [];
  selectedScheme.value = null;
  loadExistingNodes();
}

// 生成方案
async function generateSchemes() {
  if (!selectedTaskId.value) {
    ElMessage.warning('请先选择任务');
    return;
  }

  isGenerating.value = true;
  try {
    // 准备节点名称列表
    const nodeNames = existingNodes.value.map(n => n.nodeName || n.name || '');

    const res = await suggestFlowDesigns({
      tasks: nodeNames.length > 0 ? nodeNames : [requirement.value || '默认流程'],
      constraints: { requirement: requirement.value }
    });

    if (res?.data?.code === 200 && res.data.data?.designs) {
      schemes.value = convertDesignsToSchemes(res.data.data.designs);
    } else {
      // 使用本地生成的默认方案
      schemes.value = generateDefaultSchemes();
    }
  } catch (e) {
    console.error('生成方案失败:', e);
    // 使用本地生成的默认方案
    schemes.value = generateDefaultSchemes();
  } finally {
    isGenerating.value = false;
  }
}

// 转换后端设计方案为前端格式
function convertDesignsToSchemes(designs: any[]): FlowScheme[] {
  return designs.map((design, index) => {
    const type = design.type || ['serial', 'parallel', 'mixed'][index] || 'mixed';
    return {
      id: design.id || `scheme-${index}`,
      name: design.name || getDefaultSchemeName(type),
      type: type as FlowScheme['type'],
      description: design.description || getDefaultSchemeDescription(type),
      estimatedDays: design.estimatedDays || (type === 'parallel' ? 5 : type === 'serial' ? 10 : 7),
      requiredPeople: design.requiredPeople || (type === 'parallel' ? 5 : type === 'serial' ? 2 : 3),
      riskLevel: design.riskLevel || (type === 'parallel' ? 'high' : type === 'serial' ? 'low' : 'medium'),
      isRecommended: design.isRecommended || index === 2, // 默认推荐混合方案
      nodes: design.nodes || generateSchemeNodes(type),
      edges: design.edges || generateSchemeEdges(type)
    };
  });
}

// 生成默认方案
function generateDefaultSchemes(): FlowScheme[] {
  const nodeNames = existingNodes.value.length > 0
    ? existingNodes.value.map(n => n.nodeName || n.name || '节点')
    : ['需求分析', '设计', '开发', '测试', '部署'];

  return [
    {
      id: 'serial',
      name: '串行方案',
      type: 'serial',
      description: '节点依次执行，风险可控，适合依赖性强的任务',
      estimatedDays: nodeNames.length * 2,
      requiredPeople: 2,
      riskLevel: 'low',
      isRecommended: false,
      nodes: generateSerialNodes(nodeNames),
      edges: generateSerialEdges(nodeNames)
    },
    {
      id: 'parallel',
      name: '并行方案',
      type: 'parallel',
      description: '节点并行执行，效率最高，需要更多人力资源',
      estimatedDays: Math.ceil(nodeNames.length / 2),
      requiredPeople: nodeNames.length,
      riskLevel: 'high',
      isRecommended: false,
      nodes: generateParallelNodes(nodeNames),
      edges: generateParallelEdges(nodeNames)
    },
    {
      id: 'mixed',
      name: '混合方案',
      type: 'mixed',
      description: '串并结合，平衡效率与风险，推荐使用',
      estimatedDays: Math.ceil(nodeNames.length * 1.5),
      requiredPeople: 3,
      riskLevel: 'medium',
      isRecommended: true,
      nodes: generateMixedNodes(nodeNames),
      edges: generateMixedEdges(nodeNames)
    }
  ];
}

// 生成串行节点
function generateSerialNodes(names: string[]): FlowNode[] {
  return names.map((name, index) => ({
    id: `node-${index}`,
    type: 'custom',
    position: { x: 50 + index * 120, y: 40 },
    data: {
      label: name,
      prerequisiteNodes: index > 0 ? [`node-${index - 1}`] : []
    }
  }));
}

// 生成串行边
function generateSerialEdges(names: string[]): FlowEdge[] {
  return names.slice(1).map((_, index) => ({
    id: `edge-${index}`,
    source: `node-${index}`,
    target: `node-${index + 1}`
  }));
}

// 生成并行节点
function generateParallelNodes(names: string[]): FlowNode[] {
  const startNode: FlowNode = {
    id: 'start',
    type: 'custom',
    position: { x: 20, y: 40 },
    data: { label: '开始', prerequisiteNodes: [] }
  };

  const endNode: FlowNode = {
    id: 'end',
    type: 'custom',
    position: { x: 180, y: 40 },
    data: { label: '结束', prerequisiteNodes: names.map((_, i) => `node-${i}`) }
  };

  const middleNodes = names.map((name, index) => ({
    id: `node-${index}`,
    type: 'custom',
    position: { x: 100, y: 10 + index * 25 },
    data: {
      label: name,
      prerequisiteNodes: ['start']
    }
  }));

  return [startNode, ...middleNodes, endNode];
}

// 生成并行边
function generateParallelEdges(names: string[]): FlowEdge[] {
  const startEdges = names.map((_, index) => ({
    id: `edge-start-${index}`,
    source: 'start',
    target: `node-${index}`
  }));

  const endEdges = names.map((_, index) => ({
    id: `edge-end-${index}`,
    source: `node-${index}`,
    target: 'end'
  }));

  return [...startEdges, ...endEdges];
}

// 生成混合节点
function generateMixedNodes(names: string[]): FlowNode[] {
  if (names.length <= 2) return generateSerialNodes(names);

  const nodes: FlowNode[] = [];
  const midPoint = Math.floor(names.length / 2);

  // 第一阶段：串行
  nodes.push({
    id: 'node-0',
    type: 'custom',
    position: { x: 20, y: 40 },
    data: { label: names[0], prerequisiteNodes: [] }
  });

  // 第二阶段：并行
  for (let i = 1; i < midPoint + 1 && i < names.length; i++) {
    nodes.push({
      id: `node-${i}`,
      type: 'custom',
      position: { x: 80, y: 20 + (i - 1) * 30 },
      data: { label: names[i], prerequisiteNodes: ['node-0'] }
    });
  }

  // 第三阶段：汇聚后串行
  for (let i = midPoint + 1; i < names.length; i++) {
    const prereqs = i === midPoint + 1
      ? Array.from({ length: midPoint }, (_, j) => `node-${j + 1}`)
      : [`node-${i - 1}`];
    nodes.push({
      id: `node-${i}`,
      type: 'custom',
      position: { x: 140 + (i - midPoint - 1) * 60, y: 40 },
      data: { label: names[i], prerequisiteNodes: prereqs }
    });
  }

  return nodes;
}

// 生成混合边
function generateMixedEdges(names: string[]): FlowEdge[] {
  if (names.length <= 2) return generateSerialEdges(names);

  const edges: FlowEdge[] = [];
  const midPoint = Math.floor(names.length / 2);

  // 从第一个节点到并行节点
  for (let i = 1; i < midPoint + 1 && i < names.length; i++) {
    edges.push({
      id: `edge-0-${i}`,
      source: 'node-0',
      target: `node-${i}`
    });
  }

  // 从并行节点到汇聚点
  if (midPoint + 1 < names.length) {
    for (let i = 1; i < midPoint + 1 && i < names.length; i++) {
      edges.push({
        id: `edge-${i}-merge`,
        source: `node-${i}`,
        target: `node-${midPoint + 1}`
      });
    }
  }

  // 汇聚后的串行边
  for (let i = midPoint + 2; i < names.length; i++) {
    edges.push({
      id: `edge-${i - 1}-${i}`,
      source: `node-${i - 1}`,
      target: `node-${i}`
    });
  }

  return edges;
}

// 辅助函数
function generateSchemeNodes(type: string): FlowNode[] {
  const names = ['节点1', '节点2', '节点3', '节点4'];
  if (type === 'serial') return generateSerialNodes(names);
  if (type === 'parallel') return generateParallelNodes(names);
  return generateMixedNodes(names);
}

function generateSchemeEdges(type: string): FlowEdge[] {
  const names = ['节点1', '节点2', '节点3', '节点4'];
  if (type === 'serial') return generateSerialEdges(names);
  if (type === 'parallel') return generateParallelEdges(names);
  return generateMixedEdges(names);
}

function getDefaultSchemeName(type: string): string {
  const names: Record<string, string> = {
    serial: '串行方案',
    parallel: '并行方案',
    mixed: '混合方案'
  };
  return names[type] || '流程方案';
}

function getDefaultSchemeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    serial: '节点依次执行，风险可控，适合依赖性强的任务',
    parallel: '节点并行执行，效率最高，需要更多人力资源',
    mixed: '串并结合，平衡效率与风险，推荐使用'
  };
  return descriptions[type] || '自定义流程方案';
}

function getRiskLabel(level: string): string {
  const labels: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  };
  return labels[level] || '未知';
}

// 选择方案
function selectScheme(scheme: FlowScheme) {
  selectedScheme.value = scheme;
  emit('scheme-selected', scheme);
}

// 预览方案
function previewScheme() {
  showPreviewDialog.value = true;
}

// 编辑方案
function editScheme() {
  if (selectedScheme.value) {
    emit('edit-scheme', selectedScheme.value);
  }
}

// 应用方案
async function applyScheme() {
  if (!selectedScheme.value || !selectedTaskId.value) return;

  isApplying.value = true;
  try {
    emit('apply-scheme', selectedScheme.value);
    ElMessage.success('方案已应用');
  } catch (e) {
    console.error('应用方案失败:', e);
    ElMessage.error('应用方案失败');
  } finally {
    isApplying.value = false;
  }
}

onMounted(() => {
  loadTasks();
  if (props.taskId) {
    selectedTaskId.value = props.taskId;
    loadExistingNodes();
  }
});
</script>

<style scoped>
.flow-scheme-selector {
  padding: 20px;
}

.selector-header {
  margin-bottom: 16px;
}

.task-select {
  width: 100%;
}

.requirement-input {
  margin-bottom: 16px;
}

.generate-actions {
  margin-bottom: 24px;
  text-align: center;
}

.schemes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.scheme-card {
  position: relative;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.scheme-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.scheme-card.is-selected {
  border-color: #409eff;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
}

.scheme-card.is-recommended {
  border-color: #e6a23c;
}

.scheme-card.is-recommended.is-selected {
  border-color: #409eff;
}

.card-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  background: linear-gradient(135deg, #e6a23c 0%, #f5a623 100%);
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.scheme-type-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 24px;
}

.scheme-type-icon.type-serial {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: #fff;
}

.scheme-type-icon.type-parallel {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
}

.scheme-type-icon.type-mixed {
  background: linear-gradient(135deg, #e6a23c 0%, #f5a623 100%);
  color: #fff;
}

.scheme-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.scheme-description {
  font-size: 13px;
  color: #909399;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.flow-preview-container {
  height: 100px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.meta-item .el-icon {
  font-size: 14px;
}

.meta-item.risk-low {
  color: #67c23a;
}

.meta-item.risk-medium {
  color: #e6a23c;
}

.meta-item.risk-high {
  color: #f56c6c;
}

.selected-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

/* 预览弹窗样式 */
.preview-dialog-content {
  padding: 16px;
}

.preview-info {
  margin-bottom: 20px;
}

.preview-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.preview-info p {
  margin: 0;
  color: #909399;
}

.preview-flow-large {
  height: 200px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.preview-nodes-list h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.preview-node-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.node-name {
  font-weight: 500;
  color: #303133;
}

.node-prereq {
  font-size: 12px;
  color: #909399;
}

/* 响应式 */
@media (max-width: 900px) {
  .schemes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
