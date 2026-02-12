<template>
  <div class="smart-flow-designer">
    <!-- 头部：任务分析和需求输入 -->
    <div class="designer-header">
      <div class="header-left">
        <div class="task-info-card" v-if="task">
          <div class="task-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="task-details">
            <h3>{{ task.taskTitle || task.name }}</h3>
            <p class="task-meta">
              <el-tag size="small" :type="getTaskTypeType(task.taskType)">
                {{ getTaskTypeLabel(task.taskType) }}
              </el-tag>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(task.taskDeadline) }}
              </span>
              <span class="meta-item" v-if="task.leaderName">
                <el-icon><User /></el-icon>
                负责人: {{ task.leaderName }}
              </span>
            </p>
          </div>
        </div>
        <div v-else class="no-task-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>请先选择一个任务进行分析</span>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button 
          type="primary" 
          @click="startAnalysis" 
          :loading="isAnalyzing"
          :disabled="!selectedTask || existingNodes.length === 0"
          size="large"
        >
          <el-icon v-if="!isAnalyzing"><MagicStick /></el-icon>
          {{ isAnalyzing ? 'AI分析中...' : '智能分析流程' }}
        </el-button>
      </div>
    </div>

    <!-- 分析进度 -->
    <div v-if="isAnalyzing" class="analysis-progress">
      <div class="progress-steps">
        <div 
          v-for="(step, index) in analysisSteps" 
          :key="index"
          class="step-item"
          :class="{ 
            'is-active': currentStep === index,
            'is-completed': currentStep > index 
          }"
        >
          <div class="step-icon">
            <el-icon v-if="currentStep > index"><Check /></el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>
      <el-progress 
        :percentage="analysisProgress" 
        :stroke-width="8"
        :show-text="false"
        class="progress-bar"
      />
      <p class="progress-hint">{{ currentStepHint }}</p>
    </div>

    <!-- 已有节点展示 -->
    <div v-if="existingNodes.length > 0 && !analysisResult" class="existing-nodes-section">
      <div class="section-header">
        <h4>
          <el-icon><List /></el-icon>
          当前节点 ({{ existingNodes.length }}个)
        </h4>
        <el-button text @click="showAllNodes = !showAllNodes">
          {{ showAllNodes ? '收起' : '展开全部' }}
        </el-button>
      </div>
      <div class="nodes-timeline" :class="{ 'is-expanded': showAllNodes }">
        <div 
          v-for="(node, index) in displayedNodes" 
          :key="node.taskNodeId || node.id"
          class="timeline-item"
        >
          <div class="timeline-marker" :class="getNodeStatusClass(node)">
            {{ index + 1 }}
          </div>
          <div class="timeline-content">
            <span class="node-name">{{ node.nodeName }}</span>
            <el-tag size="small" :type="getNodeStatusType(node.nodeStatus)">
              {{ getNodeStatusLabel(node.nodeStatus) }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 需求输入区 -->
    <div v-if="!analysisResult && existingNodes.length > 0" class="requirement-section">
      <h4>
        <el-icon><Edit /></el-icon>
        补充需求说明 (可选)
      </h4>
      <el-input
        v-model="requirementInput"
        type="textarea"
        :rows="3"
        placeholder="描述特殊需求，例如：
- 某些节点需要特定的执行顺序
- 有人员或资源限制
- 部分节点可以并行执行
- 有紧急程度要求"
        class="requirement-input"
      />
    </div>

    <!-- 分析结果展示区 -->
    <div v-if="analysisResult" class="analysis-result">
      <!-- 任务特征分析 -->
      <div class="result-section task-characteristics">
        <h4>
          <el-icon><DataAnalysis /></el-icon>
          任务特征分析
        </h4>
        <div class="characteristics-grid">
          <div class="char-item">
            <span class="char-label">复杂度</span>
            <div class="char-value">
              <el-rate 
                v-model="analysisResult.characteristics.complexity" 
                disabled 
                :max="5"
                :colors="['#67C23A', '#E6A23C', '#F56C6C']"
              />
              <span class="char-text">{{ getComplexityLabel(analysisResult.characteristics.complexity) }}</span>
            </div>
          </div>
          <div class="char-item">
            <span class="char-label">依赖度</span>
            <div class="char-value">
              <el-progress 
                :percentage="analysisResult.characteristics.dependencyLevel * 20" 
                :color="getDependencyColor"
                class="char-progress"
              />
              <span class="char-text">{{ getDependencyLabel(analysisResult.characteristics.dependencyLevel) }}</span>
            </div>
          </div>
          <div class="char-item">
            <span class="char-label">并行潜力</span>
            <div class="char-value">
              <el-progress 
                :percentage="analysisResult.characteristics.parallelPotential * 20" 
                :color="getParallelColor"
                class="char-progress"
              />
              <span class="char-text">{{ getParallelLabel(analysisResult.characteristics.parallelPotential) }}</span>
            </div>
          </div>
          <div class="char-item">
            <span class="char-label">时间压力</span>
            <div class="char-value">
              <el-tag :type="getTimePressureType(analysisResult.characteristics.timePressure)">
                {{ getTimePressureLabel(analysisResult.characteristics.timePressure) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 推荐方案 -->
      <div class="result-section recommended-scheme">
        <div class="section-header-with-badge">
          <h4>
            <el-icon><StarFilled /></el-icon>
            AI推荐方案
          </h4>
          <el-tag type="success" effect="dark" class="recommend-badge">
            <el-icon><Trophy /></el-icon>
            最佳匹配
          </el-tag>
        </div>
        
        <div class="scheme-card recommended">
          <div class="scheme-header">
            <div class="scheme-title">
              <h5>{{ analysisResult.recommendedScheme.name }}</h5>
              <p class="scheme-desc">{{ analysisResult.recommendedScheme.description }}</p>
            </div>
            <div class="scheme-score">
              <div class="score-circle">
                <span class="score-value">{{ analysisResult.recommendedScheme.matchScore }}%</span>
                <span class="score-label">匹配度</span>
              </div>
            </div>
          </div>

          <div class="scheme-flow-preview">
            <FlowPreview
              :nodes="analysisResult.recommendedScheme.nodes"
              :edges="analysisResult.recommendedScheme.edges"
              :scheme-type="analysisResult.recommendedScheme.type"
              large
            />
          </div>

          <div class="scheme-metrics">
            <div class="metric">
              <el-icon><Timer /></el-icon>
              <div class="metric-info">
                <span class="metric-label">预计工期</span>
                <span class="metric-value">{{ analysisResult.recommendedScheme.estimatedDays }} 天</span>
              </div>
            </div>
            <div class="metric">
              <el-icon><User /></el-icon>
              <div class="metric-info">
                <span class="metric-label">建议人数</span>
                <span class="metric-value">{{ analysisResult.recommendedScheme.requiredPeople }} 人</span>
              </div>
            </div>
            <div class="metric">
              <el-icon><Warning /></el-icon>
              <div class="metric-info">
                <span class="metric-label">风险等级</span>
                <span class="metric-value" :class="'risk-' + analysisResult.recommendedScheme.riskLevel">
                  {{ getRiskLabel(analysisResult.recommendedScheme.riskLevel) }}
                </span>
              </div>
            </div>
            <div class="metric">
              <el-icon><TrendCharts /></el-icon>
              <div class="metric-info">
                <span class="metric-label">效率提升</span>
                <span class="metric-value success">+{{ analysisResult.recommendedScheme.efficiencyGain }}%</span>
              </div>
            </div>
          </div>

          <div class="scheme-reasoning">
            <h6>
              <el-icon><InfoFilled /></el-icon>
              推荐理由
            </h6>
            <ul>
              <li v-for="(reason, index) in analysisResult.recommendedScheme.reasons" :key="index">
                {{ reason }}
              </li>
            </ul>
          </div>

          <div class="scheme-actions">
            <el-button @click="previewScheme(analysisResult.recommendedScheme)">
              <el-icon><View /></el-icon>
              详细预览
            </el-button>
            <el-button type="primary" @click="applyScheme(analysisResult.recommendedScheme)">
              <el-icon><Check /></el-icon>
              应用此方案
            </el-button>
            <el-button @click="editInDesigner(analysisResult.recommendedScheme)">
              <el-icon><Edit /></el-icon>
              编辑调整
            </el-button>
          </div>
        </div>
      </div>

      <!-- 备选方案 -->
      <div v-if="analysisResult.alternativeSchemes?.length > 0" class="result-section alternative-schemes">
        <h4>
          <el-icon><Switch /></el-icon>
          备选方案
        </h4>
        <div class="alternative-list">
          <div 
            v-for="scheme in analysisResult.alternativeSchemes" 
            :key="scheme.id"
            class="alternative-card"
            @click="selectAlternative(scheme)"
          >
            <div class="alt-header">
              <h5>{{ scheme.name }}</h5>
              <span class="alt-score">{{ scheme.matchScore }}% 匹配</span>
            </div>
            <p class="alt-desc">{{ scheme.description }}</p>
            <div class="alt-meta">
              <span><el-icon><Timer /></el-icon> {{ scheme.estimatedDays }}天</span>
              <span><el-icon><User /></el-icon> {{ scheme.requiredPeople }}人</span>
              <span :class="'risk-' + scheme.riskLevel">
                <el-icon><Warning /></el-icon> {{ getRiskLabel(scheme.riskLevel) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 关键路径分析 -->
      <div class="result-section critical-path" v-if="analysisResult.criticalPath">
        <h4>
          <el-icon><MapLocation /></el-icon>
          关键路径分析
        </h4>
        <div class="critical-path-content">
          <div class="path-nodes">
            <div 
              v-for="(node, index) in analysisResult.criticalPath.nodes" 
              :key="node.id"
              class="path-node"
            >
              <div class="node-box">{{ node.name }}</div>
              <el-icon v-if="index < analysisResult.criticalPath.nodes.length - 1"><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="path-info">
            <p>
              <strong>关键路径说明：</strong>{{ analysisResult.criticalPath.description }}
            </p>
            <p class="path-hint">
              关键路径上的节点延期将直接导致整个任务延期，建议重点关注这些节点的进度。
            </p>
          </div>
        </div>
      </div>

      <!-- 风险提示与建议 -->
      <div class="result-section risk-suggestions" v-if="analysisResult.risks?.length > 0">
        <h4>
          <el-icon><WarningFilled /></el-icon>
          风险提示与建议
        </h4>
        <div class="risk-list">
          <div 
            v-for="(risk, index) in analysisResult.risks" 
            :key="index"
            class="risk-item"
            :class="'risk-level-' + risk.level"
          >
            <div class="risk-header">
              <el-icon>
                <Warning v-if="risk.level === 'high'" />
                <InfoFilled v-else />
              </el-icon>
              <span class="risk-title">{{ risk.title }}</span>
              <el-tag size="small" :type="risk.level === 'high' ? 'danger' : 'warning'">
                {{ risk.level === 'high' ? '高风险' : '提醒' }}
              </el-tag>
            </div>
            <p class="risk-desc">{{ risk.description }}</p>
            <div class="risk-solution">
              <strong>建议：</strong>{{ risk.suggestion }}
            </div>
          </div>
        </div>
      </div>

      <!-- 重新分析按钮 -->
      <div class="result-actions">
        <el-button @click="resetAnalysis">
          <el-icon><RefreshLeft /></el-icon>
          重新分析
        </el-button>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-if="!selectedTask" class="empty-state">
      <el-icon class="empty-icon"><DocumentAdd /></el-icon>
      <h3>开始智能流程设计</h3>
      <p>选择一个任务后，AI将分析其特征并为您推荐最佳的节点执行流程</p>
    </div>

    <!-- 没有节点的提示 -->
    <div v-else-if="existingNodes.length === 0" class="empty-state">
      <el-icon class="empty-icon"><CirclePlus /></el-icon>
      <h3>暂无节点数据</h3>
      <p>该任务还没有创建节点，请先创建一些节点后再使用流程设计功能</p>
      <el-button type="primary" @click="goToCreateNode">
        <el-icon><Plus /></el-icon>
        创建节点
      </el-button>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="showPreview"
      title="流程方案预览"
      width="900px"
      class="preview-dialog"
    >
      <div v-if="previewingScheme" class="preview-content">
        <div class="preview-header">
          <h3>{{ previewingScheme.name }}</h3>
          <p>{{ previewingScheme.description }}</p>
        </div>
        <div class="preview-flow-large">
          <FlowPreview
            :nodes="previewingScheme.nodes"
            :edges="previewingScheme.edges"
            :scheme-type="previewingScheme.type"
            large
          />
        </div>
        <div class="preview-nodes-detail">
          <h4>节点详情</h4>
          <el-table :data="previewingScheme.nodes.filter(n => n.id !== 'start' && n.id !== 'end')" stripe>
            <el-table-column prop="data.label" label="节点名称" min-width="150" />
            <el-table-column label="前置依赖" min-width="200">
              <template #default="{ row }">
                <el-tag 
                  v-for="prereq in row.data?.prerequisiteNodes" 
                  :key="prereq"
                  size="small"
                  class="prereq-tag"
                >
                  {{ getNodeNameById(prereq, previewingScheme.nodes) }}
                </el-tag>
                <span v-if="!row.data?.prerequisiteNodes?.length" class="no-prereq">无</span>
              </template>
            </el-table-column>
            <el-table-column label="预计工时" width="100" align="center">
              <template #default>
                <span>8h</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Document, MagicStick, Check, List, Edit, DataAnalysis, StarFilled,
  Trophy, Timer, User, Warning, TrendCharts, InfoFilled, View,
  Switch, MapLocation, ArrowRight, WarningFilled, RefreshLeft,
  DocumentAdd, CirclePlus, Plus, Calendar
} from '@element-plus/icons-vue';
import FlowPreview from '@/views/flow-designer/components/FlowPreview.vue';

// 类型定义
interface Task {
  taskId?: string;
  id?: string;
  taskTitle?: string;
  name?: string;
  taskType?: string;
  type?: string;
  taskDeadline?: string;
  deadline?: string;
  leaderName?: string;
  assignee?: string;
}

interface TaskNode {
  taskNodeId?: string;
  id?: string;
  nodeName: string;
  nodeStatus?: number;
  status?: number;
}

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
  matchScore: number;
  efficiencyGain: number;
  reasons: string[];
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface AnalysisResult {
  characteristics: {
    complexity: number;
    dependencyLevel: number;
    parallelPotential: number;
    timePressure: number;
  };
  recommendedScheme: FlowScheme;
  alternativeSchemes: FlowScheme[];
  criticalPath?: {
    nodes: Array<{ id: string; name: string }>;
    description: string;
  };
  risks: Array<{
    level: 'high' | 'medium';
    title: string;
    description: string;
    suggestion: string;
  }>;
}

// Props
const props = defineProps<{
  selectedTask: Task | null;
  existingNodes: TaskNode[];
}>();

// Emits
const emit = defineEmits<{
  (e: 'apply-scheme', scheme: FlowScheme): void;
  (e: 'edit-scheme', scheme: FlowScheme): void;
}>();

// Router
const router = useRouter();

// 状态
const isAnalyzing = ref(false);
const analysisProgress = ref(0);
const currentStep = ref(0);
const requirementInput = ref('');
const showAllNodes = ref(false);
const analysisResult = ref<AnalysisResult | null>(null);
const showPreview = ref(false);
const previewingScheme = ref<FlowScheme | null>(null);

// 分析步骤
const analysisSteps = [
  { label: '数据收集', hint: '正在收集任务和节点数据...' },
  { label: '特征分析', hint: '分析任务复杂度、依赖关系和时间约束...' },
  { label: '方案生成', hint: '基于分析结果生成多种流程方案...' },
  { label: '智能推荐', hint: '评估各方案匹配度并给出最佳建议...' }
];

// 计算属性
const currentStepHint = computed(() => {
  return analysisSteps[currentStep.value]?.hint || '';
});

// 类型安全的任务访问
const task = computed<Task | null>(() => props.selectedTask);

const displayedNodes = computed(() => {
  if (showAllNodes.value) {
    return props.existingNodes;
  }
  return props.existingNodes.slice(0, 5);
});

const getDependencyColor = computed(() => {
  return [
    { color: '#67C23A', percentage: 40 },
    { color: '#E6A23C', percentage: 70 },
    { color: '#F56C6C', percentage: 100 }
  ];
});

const getParallelColor = computed(() => {
  return [
    { color: '#F56C6C', percentage: 40 },
    { color: '#E6A23C', percentage: 70 },
    { color: '#67C23A', percentage: 100 }
  ];
});

// 方法
function getTaskTypeType(type: string): string {
  const map: Record<string, string> = {
    'feature': 'primary',
    'bug': 'danger',
    'doc': 'info',
    'review': 'warning'
  };
  return map[type] || 'info';
}

function getTaskTypeLabel(type: string): string {
  const map: Record<string, string> = {
    'feature': '功能开发',
    'bug': '缺陷修复',
    'doc': '文档任务',
    'review': '评审任务'
  };
  return map[type] || type;
}

function formatDate(date: string): string {
  if (!date) return '无截止日期';
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function getNodeStatusClass(node: TaskNode): string {
  const status = node.nodeStatus ?? node.status ?? 0;
  const map: Record<number, string> = {
    0: 'status-pending',
    1: 'status-progress',
    2: 'status-completed'
  };
  return map[status] || 'status-pending';
}

function getNodeStatusType(status: number): string {
  const map: Record<number, string> = {
    0: 'info',
    1: 'warning',
    2: 'success'
  };
  return map[status ?? 0] || 'info';
}

function getNodeStatusLabel(status: number): string {
  const map: Record<number, string> = {
    0: '待处理',
    1: '进行中',
    2: '已完成'
  };
  return map[status ?? 0] || '待处理';
}

function getComplexityLabel(level: number): string {
  const labels = ['非常简单', '简单', '中等', '复杂', '非常复杂'];
  return labels[level - 1] || '中等';
}

function getDependencyLabel(level: number): string {
  const labels = ['独立性强', '依赖较少', '中等依赖', '高度依赖', '强耦合'];
  return labels[level - 1] || '中等依赖';
}

function getParallelLabel(level: number): string {
  const labels = ['串行为主', '少量并行', '适中并行', '高度并行', '完全并行'];
  return labels[level - 1] || '适中并行';
}

function getTimePressureType(level: number): string {
  const map: Record<number, string> = {
    1: 'success',
    2: 'success',
    3: 'warning',
    4: 'danger',
    5: 'danger'
  };
  return map[level] || 'info';
}

function getTimePressureLabel(level: number): string {
  const labels = ['非常宽松', '时间充裕', '时间适中', '时间紧张', '非常紧急'];
  return labels[level - 1] || '时间适中';
}

function getRiskLabel(level: string): string {
  const map: Record<string, string> = {
    'low': '低风险',
    'medium': '中风险',
    'high': '高风险'
  };
  return map[level] || '未知';
}

function getNodeNameById(id: string, nodes: FlowNode[]): string {
  const node = nodes.find(n => n.id === id);
  return node?.data?.label || id;
}

// 智能分析流程
async function startAnalysis() {
  if (!props.selectedTask || props.existingNodes.length === 0) {
    ElMessage.warning('请先选择任务并确保有节点数据');
    return;
  }

  isAnalyzing.value = true;
  analysisProgress.value = 0;
  currentStep.value = 0;
  analysisResult.value = null;

  // 模拟分析过程
  for (let i = 0; i < analysisSteps.length; i++) {
    currentStep.value = i;
    
    // 每个步骤的进度增长
    for (let p = 0; p < 25; p++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      analysisProgress.value = Math.min(100, analysisProgress.value + 1);
    }
  }

  // 生成分析结果
  analysisResult.value = generateAnalysisResult();
  
  isAnalyzing.value = false;
  analysisProgress.value = 100;
  
  ElMessage.success('AI分析完成！');
}

// 生成分析结果（模拟真实的AI分析）
function generateAnalysisResult(): AnalysisResult {
  const nodes = props.existingNodes;
  const nodeCount = nodes.length;
  const completedCount = nodes.filter(n => (n.nodeStatus ?? n.status) === 2).length;
  const inProgressCount = nodes.filter(n => (n.nodeStatus ?? n.status) === 1).length;
  
  // 基于节点特征计算复杂度
  const complexity = Math.min(5, Math.max(2, Math.ceil(nodeCount / 2)));
  
  // 基于任务类型和节点数计算依赖度
  const dependencyLevel = Math.min(5, Math.max(2, Math.ceil(nodeCount / 1.5)));
  
  // 基于节点数量计算并行潜力
  const parallelPotential = Math.min(5, Math.max(1, Math.floor((nodeCount - completedCount) / 2) + 1));
  
  // 基于截止日期计算时间压力
  let timePressure = 3;
  if (props.selectedTask?.taskDeadline || props.selectedTask?.deadline) {
    const deadline = new Date(props.selectedTask.taskDeadline || props.selectedTask.deadline || '');
    const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline < 3) timePressure = 5;
    else if (daysUntilDeadline < 7) timePressure = 4;
    else if (daysUntilDeadline > 14) timePressure = 2;
  }

  // 生成节点数据
  const nodeNames = nodes.map(n => n.nodeName);
  
  // 生成推荐方案
  const recommendedScheme = generateSmartScheme(
    nodeNames, 
    complexity, 
    parallelPotential, 
    timePressure,
    'recommended'
  );

  // 生成备选方案
  const alternativeSchemes = [
    generateSmartScheme(nodeNames, complexity, 1, timePressure, 'serial'),
    generateSmartScheme(nodeNames, complexity, 5, timePressure, 'parallel')
  ].filter(s => s.id !== recommendedScheme.id);

  // 识别关键路径
  const criticalPath = identifyCriticalPath(recommendedScheme.nodes, recommendedScheme.edges);

  // 生成风险提示
  const risks = generateRisks(complexity, dependencyLevel, timePressure, completedCount, nodeCount);

  return {
    characteristics: {
      complexity,
      dependencyLevel,
      parallelPotential,
      timePressure
    },
    recommendedScheme,
    alternativeSchemes,
    criticalPath,
    risks
  };
}

// 生成智能流程方案
function generateSmartScheme(
  nodeNames: string[], 
  complexity: number, 
  parallelPotential: number,
  timePressure: number,
  schemeType: 'recommended' | 'serial' | 'parallel'
): FlowScheme {
  const nodeCount = nodeNames.length;
  
  let type: 'serial' | 'parallel' | 'mixed';
  let name: string;
  let description: string;
  let matchScore: number;
  let reasons: string[];
  
  if (schemeType === 'serial') {
    type = 'serial';
    name = '保守串行方案';
    description = '所有节点依次执行，最大程度降低风险，适合对稳定性要求极高的场景';
    matchScore = Math.max(60, 100 - parallelPotential * 10);
    reasons = [
      '串行执行避免资源冲突',
      '每一步都有明确的验收标准',
      '风险可控，问题定位简单'
    ];
  } else if (schemeType === 'parallel') {
    type = 'parallel';
    name = '激进并行方案';
    description = '最大化并行度以缩短工期，适合时间压力极大且团队资源充足的场景';
    matchScore = Math.max(60, 70 + parallelPotential * 5);
    reasons = [
      '并行执行大幅缩短总工期',
      '充分利用团队资源',
      '适合经验丰富的团队'
    ];
  } else {
    // 智能推荐方案
    if (timePressure >= 4 && parallelPotential >= 3) {
      type = 'mixed';
      name = '时序优化方案';
      description = '在关键路径上采用并行，非关键路径串行，平衡效率与风险';
      matchScore = 92;
      reasons = [
        '针对时间压力进行优化',
        '关键节点并行以缩短工期',
        '保留适当的串行节点控制风险'
      ];
    } else if (complexity >= 4) {
      type = 'serial';
      name = '稳扎稳打方案';
      description = '考虑到任务复杂度较高，采用保守的串行策略确保质量';
      matchScore = 88;
      reasons = [
        '复杂任务需要充分的评审和验证',
        '串行执行便于问题追溯',
        '降低多线程带来的认知负担'
      ];
    } else {
      type = 'mixed';
      name = '均衡推进方案';
      description = '综合考量任务特征，采用串并结合的混合策略';
      matchScore = 95;
      reasons = [
        '根据节点特征自动分配串并行',
        '在保证质量的前提下提升效率',
        '灵活应对任务变化'
      ];
    }
  }

  // 生成节点和边
  const nodes = generateFlowNodes(nodeNames, type);
  const edges = generateFlowEdges(nodes, type);

  // 计算指标
  const estimatedDays = type === 'serial' ? nodeCount * 2 : 
                        type === 'parallel' ? Math.ceil(nodeCount / 2) + 1 : 
                        Math.ceil(nodeCount * 1.2);
  
  const requiredPeople = type === 'serial' ? 2 :
                         type === 'parallel' ? Math.min(nodeCount, 5) :
                         Math.min(Math.ceil(nodeCount / 2), 4);
  
  const riskLevel: 'low' | 'medium' | 'high' = type === 'serial' ? 'low' : 
                                               type === 'parallel' ? 'high' : 'medium';
  
  const efficiencyGain = type === 'parallel' ? Math.round((1 - (estimatedDays / (nodeCount * 2))) * 100) :
                         type === 'mixed' ? Math.round((1 - (estimatedDays / (nodeCount * 2))) * 50) :
                         0;

  return {
    id: schemeType,
    name,
    type,
    description,
    estimatedDays,
    requiredPeople,
    riskLevel,
    matchScore,
    efficiencyGain,
    reasons,
    nodes,
    edges
  };
}

// 生成流程节点
function generateFlowNodes(nodeNames: string[], type: 'serial' | 'parallel' | 'mixed'): FlowNode[] {
  const nodes: FlowNode[] = [];
  
  if (type === 'serial') {
    // 串行：每个节点依赖前一个
    nodeNames.forEach((name, index) => {
      nodes.push({
        id: `node-${index}`,
        type: 'custom',
        position: { x: 50 + index * 120, y: 40 },
        data: {
          label: name,
          prerequisiteNodes: index > 0 ? [`node-${index - 1}`] : []
        }
      });
    });
  } else if (type === 'parallel') {
    // 并行：所有节点可以同时开始
    const startNode: FlowNode = {
      id: 'start',
      type: 'custom',
      position: { x: 20, y: 40 },
      data: { label: '开始', prerequisiteNodes: [] }
    };
    
    nodeNames.forEach((name, index) => {
      nodes.push({
        id: `node-${index}`,
        type: 'custom',
        position: { x: 100, y: 10 + index * 25 },
        data: {
          label: name,
          prerequisiteNodes: ['start']
        }
      });
    });
    
    const endNode: FlowNode = {
      id: 'end',
      type: 'custom',
      position: { x: 180, y: 40 },
      data: { 
        label: '结束', 
        prerequisiteNodes: nodeNames.map((_, i) => `node-${i}`) 
      }
    };
    
    nodes.unshift(startNode);
    nodes.push(endNode);
  } else {
    // 混合：前1/3串行，中间1/3并行，后1/3串行
    const third = Math.ceil(nodeNames.length / 3);
    
    // 第一阶段：串行
    for (let i = 0; i < Math.min(third, nodeNames.length); i++) {
      nodes.push({
        id: `node-${i}`,
        type: 'custom',
        position: { x: 20 + i * 80, y: 40 },
        data: {
          label: nodeNames[i],
          prerequisiteNodes: i > 0 ? [`node-${i - 1}`] : []
        }
      });
    }
    
    // 第二阶段：并行
    const lastPhase1Index = Math.min(third, nodeNames.length) - 1;
    for (let i = third; i < Math.min(third * 2, nodeNames.length); i++) {
      nodes.push({
        id: `node-${i}`,
        type: 'custom',
        position: { x: 20 + third * 80, y: 10 + (i - third) * 25 },
        data: {
          label: nodeNames[i],
          prerequisiteNodes: lastPhase1Index >= 0 ? [`node-${lastPhase1Index}`] : []
        }
      });
    }
    
    // 第三阶段：汇聚后串行
    const lastPhase2Index = Math.min(third * 2, nodeNames.length) - 1;
    const phase2Prereqs = [];
    for (let i = third; i <= lastPhase2Index && i < nodeNames.length; i++) {
      phase2Prereqs.push(`node-${i}`);
    }
    
    for (let i = third * 2; i < nodeNames.length; i++) {
      nodes.push({
        id: `node-${i}`,
        type: 'custom',
        position: { x: 40 + third * 80 + (i - third * 2) * 80, y: 40 },
        data: {
          label: nodeNames[i],
          prerequisiteNodes: i === third * 2 ? phase2Prereqs : [`node-${i - 1}`]
        }
      });
    }
  }
  
  return nodes;
}

// 生成流程边
function generateFlowEdges(nodes: FlowNode[], type: 'serial' | 'parallel' | 'mixed'): FlowEdge[] {
  const edges: FlowEdge[] = [];
  
  nodes.forEach((node, index) => {
    if (node.data?.prerequisiteNodes) {
      node.data.prerequisiteNodes.forEach((prereq, prereqIndex) => {
        edges.push({
          id: `edge-${prereq}-${node.id}-${prereqIndex}`,
          source: prereq,
          target: node.id
        });
      });
    }
  });
  
  return edges;
}

// 识别关键路径
function identifyCriticalPath(nodes: FlowNode[], edges: FlowEdge[]) {
  // 简化的关键路径识别：找最长依赖链
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const visited = new Set<string>();
  const path: Array<{ id: string; name: string }> = [];
  
  // 找到没有前置依赖的节点作为起点
  const startNodes = nodes.filter(n => !n.data?.prerequisiteNodes?.length);
  
  function dfs(nodeId: string, currentPath: Array<{ id: string; name: string }>) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = nodeMap.get(nodeId);
    if (node) {
      currentPath.push({ id: nodeId, name: node.data.label });
      
      // 找到所有依赖于此节点的后续节点
      const nextNodes = edges
        .filter(e => e.source === nodeId)
        .map(e => e.target);
      
      if (nextNodes.length === 0) {
        // 到达终点，检查是否是当前最长路径
        if (currentPath.length > path.length) {
          path.length = 0;
          path.push(...currentPath);
        }
      } else {
        nextNodes.forEach(nextId => dfs(nextId, [...currentPath]));
      }
    }
  }
  
  startNodes.forEach(node => dfs(node.id, []));
  
  return {
    nodes: path,
    description: path.length > 0 
      ? `从"${path[0].name}"到"${path[path.length - 1].name}"是此流程的关键路径，共${path.length}个节点`
      : '暂无明确的关键路径'
  };
}

// 生成风险提示
function generateRisks(
  complexity: number, 
  dependencyLevel: number, 
  timePressure: number,
  completedCount: number,
  totalCount: number
): Array<{ level: 'high' | 'medium'; title: string; description: string; suggestion: string }> {
  const risks = [];
  
  // 时间压力风险
  if (timePressure >= 4) {
    risks.push({
      level: 'high',
      title: '时间压力较大',
      description: '任务截止日期临近，剩余时间可能不足以完成所有节点',
      suggestion: '考虑增加人力资源或调整部分节点的交付标准，优先保证核心功能完成'
    });
  }
  
  // 复杂度风险
  if (complexity >= 4) {
    risks.push({
      level: 'medium',
      title: '任务复杂度较高',
      description: '节点数量较多，涉及面广，容易出现遗漏或协调困难',
      suggestion: '建议设置里程碑节点进行阶段性验收，定期同步进展'
    });
  }
  
  // 依赖风险
  if (dependencyLevel >= 4) {
    risks.push({
      level: 'medium',
      title: '节点间依赖度较高',
      description: '节点之间存在较多前置依赖关系，一个节点延期可能影响整体进度',
      suggestion: '重点关注关键路径上的节点，提前识别可能的延期风险并制定应对预案'
    });
  }
  
  // 进度风险
  if (completedCount === 0 && totalCount > 0) {
    risks.push({
      level: 'medium',
      title: '尚未开始执行',
      description: '所有节点都处于待处理状态，需要尽快启动',
      suggestion: '建议立即开始第一个节点的执行，并建立定期的进度跟踪机制'
    });
  }
  
  return risks;
}

// 预览方案
function previewScheme(scheme: FlowScheme) {
  previewingScheme.value = scheme;
  showPreview.value = true;
}

// 应用方案
async function applyScheme(scheme: FlowScheme) {
  try {
    await ElMessageBox.confirm(
      `确定要应用"${scheme.name}"吗？这将根据方案重新配置节点间的依赖关系。`,
      '确认应用',
      {
        confirmButtonText: '确认应用',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    emit('apply-scheme', scheme);
    ElMessage.success('方案已应用');
  } catch {
    // 用户取消
  }
}

// 在设计器中编辑
function editInDesigner(scheme: FlowScheme) {
  emit('edit-scheme', scheme);
}

// 选择备选方案
function selectAlternative(scheme: FlowScheme) {
  if (analysisResult.value) {
    // 交换推荐方案和备选方案
    const currentRecommended = analysisResult.value.recommendedScheme;
    analysisResult.value.recommendedScheme = scheme;
    analysisResult.value.alternativeSchemes = analysisResult.value.alternativeSchemes.filter(s => s.id !== scheme.id);
    analysisResult.value.alternativeSchemes.push(currentRecommended);
    
    // 重新计算关键路径
    analysisResult.value.criticalPath = identifyCriticalPath(scheme.nodes, scheme.edges);
    
    ElMessage.success(`已切换至"${scheme.name}"`);
  }
}

// 重新分析
function resetAnalysis() {
  analysisResult.value = null;
  analysisProgress.value = 0;
  currentStep.value = 0;
  requirementInput.value = '';
}

// 前往创建节点
function goToCreateNode() {
  const taskId = props.selectedTask?.taskId || props.selectedTask?.id;
  if (taskId) {
    router.push(`/tasknodes/create?taskId=${taskId}`);
  }
}
</script>

<style scoped>
.smart-flow-designer {
  padding: 24px;
  min-height: 500px;
}

/* 头部样式 */
.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left {
  flex: 1;
}

.task-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  border-radius: 12px;
  border: 1px solid var(--el-color-primary-light-7);
}

.task-icon {
  width: 48px;
  height: 48px;
  background: var(--el-color-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.task-details h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.no-task-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

/* 分析进度 */
.analysis-progress {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--el-fill-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition: all 0.3s;
}

.step-item.is-active .step-icon {
  background: var(--el-color-primary);
  color: white;
}

.step-item.is-completed .step-icon {
  background: var(--el-color-success);
  color: white;
}

.step-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.step-item.is-active .step-label {
  color: var(--el-color-primary);
  font-weight: 500;
}

.progress-bar {
  margin-bottom: 12px;
}

.progress-hint {
  text-align: center;
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 已有节点展示 */
.existing-nodes-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.nodes-timeline {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.nodes-timeline:not(.is-expanded) {
  max-height: 80px;
  overflow: hidden;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.timeline-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-text-color-disabled);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.timeline-marker.status-pending {
  background: var(--el-color-info);
}

.timeline-marker.status-progress {
  background: var(--el-color-warning);
}

.timeline-marker.status-completed {
  background: var(--el-color-success);
}

.timeline-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 需求输入 */
.requirement-section {
  margin-bottom: 24px;
}

.requirement-section h4 {
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.requirement-input {
  font-size: 14px;
}

/* 分析结果 */
.analysis-result {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-section {
  margin-bottom: 24px;
}

.result-section h4 {
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

/* 任务特征 */
.task-characteristics {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 20px;
}

.characteristics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.char-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.char-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.char-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.char-progress {
  width: 120px;
}

.char-text {
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

/* 推荐方案 */
.section-header-with-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header-with-badge h4 {
  margin: 0;
}

.recommend-badge {
  font-size: 13px;
}

.scheme-card {
  background: white;
  border: 2px solid var(--el-border-color);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s;
}

.scheme-card.recommended {
  border-color: var(--el-color-success);
  background: linear-gradient(135deg, var(--el-color-success-light-9) 0%, white 100%);
}

.scheme-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.scheme-title h5 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.scheme-desc {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  max-width: 500px;
}

.scheme-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
}

.score-label {
  font-size: 12px;
  opacity: 0.9;
}

.scheme-flow-preview {
  height: 200px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.scheme-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.metric {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.metric .el-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.metric-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.metric-value.risk-low {
  color: var(--el-color-success);
}

.metric-value.risk-medium {
  color: var(--el-color-warning);
}

.metric-value.risk-high {
  color: var(--el-color-danger);
}

.metric-value.success {
  color: var(--el-color-success);
}

.scheme-reasoning {
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.scheme-reasoning h6 {
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.scheme-reasoning ul {
  margin: 0;
  padding-left: 20px;
}

.scheme-reasoning li {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.scheme-reasoning li:last-child {
  margin-bottom: 0;
}

.scheme-actions {
  display: flex;
  gap: 12px;
}

/* 备选方案 */
.alternative-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.alternative-card {
  background: var(--el-fill-color-light);
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.alternative-card:hover {
  border-color: var(--el-color-primary);
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.alt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alt-header h5 {
  margin: 0;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.alt-score {
  font-size: 13px;
  color: var(--el-color-success);
  font-weight: 500;
}

.alt-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.alt-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.alt-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.alt-meta .risk-low {
  color: var(--el-color-success);
}

.alt-meta .risk-medium {
  color: var(--el-color-warning);
}

.alt-meta .risk-high {
  color: var(--el-color-danger);
}

/* 关键路径 */
.critical-path {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 20px;
}

.path-nodes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.path-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-box {
  padding: 8px 16px;
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.path-node .el-icon {
  color: var(--el-text-color-secondary);
}

.path-info {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.path-info p {
  margin: 0 0 8px 0;
}

.path-hint {
  padding: 8px 12px;
  background: var(--el-color-warning-light-9);
  border-radius: 6px;
  margin: 0;
}

/* 风险提示 */
.risk-suggestions {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 20px;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid var(--el-color-warning);
}

.risk-item.risk-level-high {
  border-left-color: var(--el-color-danger);
}

.risk-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.risk-header .el-icon {
  color: var(--el-color-warning);
}

.risk-item.risk-level-high .risk-header .el-icon {
  color: var(--el-color-danger);
}

.risk-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  flex: 1;
}

.risk-desc {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.risk-solution {
  font-size: 13px;
  color: var(--el-text-color-primary);
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

/* 结果操作 */
.result-actions {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-light);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: var(--el-text-color-disabled);
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  max-width: 400px;
}

/* 预览弹窗 */
.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.preview-content {
  padding: 20px;
}

.preview-header {
  margin-bottom: 20px;
}

.preview-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.preview-header p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.preview-flow-large {
  height: 300px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 20px;
}

.preview-nodes-detail h4 {
  margin: 0 0 12px 0;
}

.prereq-tag {
  margin-right: 4px;
}

.no-prereq {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* 响应式 */
@media (max-width: 768px) {
  .designer-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .characteristics-grid {
    grid-template-columns: 1fr;
  }

  .scheme-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .alternative-list {
    grid-template-columns: 1fr;
  }

  .scheme-actions {
    flex-wrap: wrap;
  }

  /* 移动端隐藏辅助文字 */
  .designer-subtitle,
  .metric-label,
  .alternative-desc,
  .characteristic-desc,
  .node-desc,
  .prereq-label,
  .no-prereq,
  .preview-section h4,
  .scheme-comparison h4,
  .alternatives-section h4 {
    display: none !important;
  }

  .designer-header h3 {
    font-size: 16px;
  }

  .scheme-card {
    padding: 12px;
  }

  .scheme-header h4 {
    font-size: 14px;
  }

  .metric-value {
    font-size: 20px;
  }

  .alternative-item {
    padding: 10px;
  }

  .alternative-name {
    font-size: 13px;
  }

  .alternative-metric {
    font-size: 11px;
  }

  .characteristic-item {
    padding: 10px;
  }

  .characteristic-label {
    font-size: 12px;
  }

  .node-name {
    font-size: 13px;
  }

  .prereq-tag {
    font-size: 11px;
    padding: 2px 6px;
  }
}

@media (max-width: 480px) {
  .designer-header h3 {
    font-size: 15px;
  }

  .scheme-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .metric-value {
    font-size: 18px;
  }

  .scheme-actions {
    flex-direction: column;
    gap: 8px;
  }

  .scheme-actions .el-button {
    width: 100%;
    margin: 0 !important;
  }

  .characteristics-grid {
    gap: 8px;
  }

  .characteristic-item {
    padding: 8px;
  }
}
</style>
