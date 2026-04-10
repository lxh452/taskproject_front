<template>
  <div class="flow-designer">
    <div class="designer-layout">
      <!-- 左侧：任务输入与AI分析 -->
      <aside class="input-panel">
        <div class="panel-section">
          <div class="section-header">
            <h3>任务列表</h3>
            <button class="btn-icon" @click="clearInput" title="清空">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
          <p class="section-desc">每行输入一个任务，AI将自动分析依赖关系</p>
          <textarea
              v-model="taskListInput"
              class="task-input"
              placeholder="例如：
1. 需求分析
2. 数据库设计
3. 后端开发
4. 前端开发
5. 测试验收"
              rows="10"
          />
          <div class="input-stats" v-if="extractedTasks.length > 0">
            <span>{{ extractedTasks.length }} 个任务</span>
          </div>
        </div>

        <div class="panel-section">
          <h3>约束条件</h3>
          <div class="form-grid">
            <div class="form-item">
              <label>最大并行数</label>
              <input type="number" v-model.number="constraints.maxParallel" min="1" max="10" />
            </div>
            <div class="form-item">
              <label>优化目标</label>
              <select v-model="constraints.priority">
                <option value="speed">最快速度</option>
                <option value="quality">最高质量</option>
                <option value="balanced">平衡</option>
              </select>
            </div>
          </div>
        </div>

        <div class="panel-actions">
          <button class="btn btn-primary btn-block" @click="analyzeTasks" :disabled="extractedTasks.length === 0 || isAnalyzing">
            <svg v-if="isAnalyzing" class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M8 14h8M9 18h6M12 14v8"/></svg>
            {{ isAnalyzing ? 'AI 分析中...' : 'AI 分析流程' }}
          </button>
        </div>
      </aside>

      <!-- 中间：流程图区域 -->
      <main class="flow-area">
        <!-- 空状态 -->
        <div v-if="!hasDesign && !isAnalyzing" class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M10 6.5h4M17.5 10v4M14 17.5h-4M6.5 14v-4"/>
            </svg>
          </div>
          <h3>开始设计流程</h3>
          <p>在左侧输入任务列表，AI 将自动分析依赖关系并生成流程图</p>
        </div>

        <!-- 分析中 -->
        <div v-else-if="isAnalyzing" class="analyzing-state">
          <div class="analyzing-animation">
            <div class="pulse-ring"></div>
            <div class="pulse-ring delay-1"></div>
            <svg class="ai-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/>
              <path d="M8 14h8M9 18h6M12 14v8"/>
            </svg>
          </div>
          <h3>AI 正在分析...</h3>
          <p>{{ analyzeStep }}</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: analysisProgress + '%' }"></div>
          </div>
        </div>

        <!-- 设计方案选择 -->
        <div v-else-if="designOptions.length > 0 && !selectedDesign" class="designs-view">
          <div class="designs-header">
            <h3>选择设计方案</h3>
            <div class="header-tags">
              <span class="ai-badge" v-if="isAIGenerated">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/>
                  <path d="M8 14h8M9 18h6M12 14v8"/>
                </svg>
                AI 智能生成
              </span>
              <span class="designs-count">{{ designOptions.length }} 种方案</span>
            </div>
          </div>
          <div class="designs-grid">
            <div
                v-for="design in designOptions"
                :key="design.id"
                class="design-card"
                :class="{ recommended: design.isRecommended }"
                @click="selectDesign(design)"
            >
              <div class="card-badge" v-if="design.isRecommended">推荐</div>
              <div class="card-header">
                <h4>{{ design.name }}</h4>
                <div class="confidence-badge" v-if="design.confidence" :title="'AI置信度: ' + roundConfidence(design.confidence) + '%'">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                  </svg>
                  {{ roundConfidence(design.confidence) }}%
                </div>
              </div>
              <p>{{ design.description }}</p>
              <div class="card-meta">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  {{ design.estimatedDays }} 天
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {{ design.requiredPeople }} 人
                </span>
                <span :class="'risk-badge risk-' + design.riskLevel">
                  {{ getRiskLabel(design.riskLevel) }}
                </span>
              </div>
              <!-- 方案优缺点 -->
              <div class="pros-cons" v-if="design.pros?.length || design.cons?.length">
                <div class="pros" v-if="design.pros?.length">
                  <span class="label">优势</span>
                  <span class="items">{{ design.pros.slice(0, 2).join('、') }}</span>
                </div>
                <div class="cons" v-if="design.cons?.length">
                  <span class="label">劣势</span>
                  <span class="items">{{ design.cons.slice(0, 2).join('、') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 流程图展示 -->
        <div v-else-if="selectedDesign" class="flow-view">
          <div class="flow-toolbar">
            <button class="btn-icon" @click="backToDesigns" title="返回方案选择">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <span class="toolbar-title">{{ selectedDesign.name }}</span>
            <div class="toolbar-actions">
              <button class="btn btn-sm btn-secondary" @click="autoLayout">自动布局</button>
              <button class="btn btn-sm btn-primary" @click="applyDesign">应用设计</button>
            </div>
          </div>
          <div class="flow-canvas" ref="flowCanvas">
            <VueFlow
                :nodes="flowNodes"
                :edges="flowEdges"
                :default-viewport="{ zoom: 0.8 }"
                fit-view-on-init
                @node-click="onNodeClick"
            >
              <template #node-custom="nodeProps">
                <div class="flow-node" :class="'status-' + (nodeProps.data?.status || 'pending')">
                  <div class="node-content">
                    <span class="node-label">{{ nodeProps.data?.label }}</span>
                    <span class="node-assignee" v-if="nodeProps.data?.assignee">{{ nodeProps.data.assignee }}</span>
                  </div>
                </div>
              </template>
            </VueFlow>
          </div>
        </div>
      </main>

      <!-- 右侧：节点详情与操作 -->
      <aside class="detail-panel" v-if="selectedDesign">
        <div class="panel-section" v-if="selectedNode">
          <h3>节点详情</h3>
          <div class="node-detail">
            <div class="detail-row">
              <label>名称</label>
              <input type="text" v-model="selectedNode.data.label" />
            </div>
            <div class="detail-row">
              <label>负责人</label>
              <select v-model="selectedNode.data.assignee">
                <option value="">未分配</option>
                <option v-for="user in availableUsers" :key="user.id" :value="user.name">{{ user.name }}</option>
              </select>
            </div>
            <div class="detail-row">
              <label>预计天数</label>
              <input type="number" v-model.number="selectedNode.data.days" min="1" />
            </div>
            <div class="detail-row">
              <label>优先级</label>
              <select v-model="selectedNode.data.priority">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>
        </div>

        <div class="panel-section" v-else>
          <h3>流程概览</h3>
          <div class="overview-stats">
            <div class="stat-item">
              <span class="stat-value">{{ flowNodes.length }}</span>
              <span class="stat-label">节点数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ selectedDesign.estimatedDays }}</span>
              <span class="stat-label">预计天数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ selectedDesign.requiredPeople }}</span>
              <span class="stat-label">所需人数</span>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>AI 建议</h3>
          <div class="ai-suggestions">
            <div v-for="(tip, idx) in aiTips" :key="idx" class="suggestion-item">
              <div class="suggestion-icon" :class="tip.type">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </div>
              <span>{{ tip.content }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- AI流程助手浮窗 -->
    <FlowAIAssistant
        :tasks="extractedTasks"
        @apply-flow="applyAIFlow"
        @clear-tasks="clearInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import { ElMessage } from 'element-plus';
import { suggestFlowDesigns, createTaskNode } from '@/api';
import FlowAIAssistant from './components/FlowAIAssistant.vue';

interface DesignOption {
  id: string;
  name: string;
  description: string;
  estimatedDays: number;
  requiredPeople: number;
  riskLevel: 'low' | 'medium' | 'high';
  isRecommended?: boolean;
  type?: string;
  steps?: string[];
  pros?: string[];
  cons?: string[];
  confidence?: number;
  nodes?: any[];
  edges?: any[];
}

const { fitView } = useVueFlow();

// 状态
const taskListInput = ref('');
const extractedTasks = ref<string[]>([]);
const isAnalyzing = ref(false);
const analysisProgress = ref(0);
const analyzeStep = ref('');
const designOptions = ref<DesignOption[]>([]);
const selectedDesign = ref<DesignOption | null>(null);
const flowNodes = ref<any[]>([]);
const flowEdges = ref<any[]>([]);
const selectedNode = ref<any>(null);
const flowCanvas = ref<HTMLElement | null>(null);
const isAIGenerated = ref(false); // 标记是否使用AI生成的方案

const constraints = ref({ maxParallel: 5, priority: 'balanced' });
const availableUsers = ref([
  { id: '1', name: '张三' },
  { id: '2', name: '李四' },
  { id: '3', name: '王五' }
]);

const aiTips = ref([
  { type: 'info', content: '建议将相关任务分配给同一负责人' },
  { type: 'warning', content: '注意关键路径上的任务不要延期' }
]);

// 计算属性
const hasDesign = computed(() => selectedDesign.value !== null || designOptions.value.length > 0);

// 监听输入
watch(taskListInput, (val) => {
  extractedTasks.value = val.split('\n').map(l => l.trim()).filter(l => l).map(l => l.replace(/^\d+[.、]\s*/, ''));
});

function clearInput() {
  taskListInput.value = '';
  designOptions.value = [];
  selectedDesign.value = null;
  flowNodes.value = [];
  flowEdges.value = [];
}

function getRiskLabel(level: string) {
  return { low: '低风险', medium: '中风险', high: '高风险' }[level] || '未知';
}

// 辅助函数：在模板中使用
function roundConfidence(confidence: number): number {
  return Math.round((confidence || 0) * 100);
}

async function analyzeTasks() {
  if (extractedTasks.value.length === 0) return;
  isAnalyzing.value = true;
  analysisProgress.value = 0;

  const steps = ['解析任务列表...', '分析依赖关系...', '生成设计方案...', '优化流程结构...'];

  try {
    for (let i = 0; i < steps.length; i++) {
      analyzeStep.value = steps[i];
      analysisProgress.value = (i + 1) * 25;
      await new Promise(r => setTimeout(r, 500));
    }

    // 调用AI API生成设计方案
    isAIGenerated.value = false;
    try {
      const res = await suggestFlowDesigns({ tasks: extractedTasks.value, constraints: constraints.value });
      console.log('AI设计方案响应:', res);

      if (res?.data?.code === 0 && res?.data?.data?.designs && res.data.data.designs.length > 0) {
        // 使用AI生成的设计方案
        designOptions.value = res.data.data.designs.map((design: any) => ({
          id: design.id || String(Math.random()),
          name: design.name || '未命名方案',
          description: design.description || '',
          estimatedDays: design.estimatedDays || 7,
          requiredPeople: design.requiredPeople || 2,
          riskLevel: design.riskLevel || 'medium',
          isRecommended: design.isRecommended || false,
          type: design.type || 'hybrid',
          steps: design.steps || [],
          pros: design.pros || [],
          cons: design.cons || [],
          confidence: design.confidence || 0.8
        }));
        isAIGenerated.value = true;
        console.log('✅ 成功加载AI生成的设计方案:', designOptions.value);
      } else {
        console.warn('⚠️ AI返回数据异常，使用默认方案');
        generateMockDesigns();
      }
    } catch (error) {
      console.error('❌ 调用AI设计API失败:', error);
      generateMockDesigns();
    }
  } finally {
    isAnalyzing.value = false;
  }
}

function generateMockDesigns() {
  const taskCount = extractedTasks.value.length;
  isAIGenerated.value = false;
  designOptions.value = [
    {
      id: 'sequential-' + Date.now(),
      name: '串行执行方案',
      description: '任务按顺序依次执行，风险最低但耗时较长。适合对稳定性要求高的项目。',
      estimatedDays: taskCount * 2,
      requiredPeople: 1,
      riskLevel: 'low',
      isRecommended: false,
      type: 'sequential',
      steps: ['需求分析', '设计', '开发', '测试', '部署'],
      pros: ['风险可控', '质量有保障', '易于管理'],
      cons: ['工期较长', '资源利用率低'],
      confidence: 0.75
    },
    {
      id: 'parallel-' + Date.now(),
      name: '并行优化方案',
      description: '最大化并行执行，缩短整体工期。适合时间紧迫、团队资源充足的项目。',
      estimatedDays: Math.ceil(taskCount * 0.8),
      requiredPeople: Math.min(taskCount, constraints.value.maxParallel),
      riskLevel: 'high',
      isRecommended: true,
      type: 'parallel',
      steps: ['任务分解', '并行开发', '集成测试', '部署上线'],
      pros: ['工期最短', '效率高', '资源利用率高'],
      cons: ['协调复杂', '需要更多人力', '风险较高'],
      confidence: 0.8
    },
    {
      id: 'hybrid-' + Date.now(),
      name: '分阶段混合方案',
      description: '按阶段分批执行，关键路径串行，非关键路径并行，平衡效率与风险。',
      estimatedDays: Math.ceil(taskCount * 1.2),
      requiredPeople: Math.ceil(taskCount / 3),
      riskLevel: 'medium',
      isRecommended: false,
      type: 'hybrid',
      steps: ['关键路径分析', '阶段划分', '组内并行', '阶段集成', '最终验收'],
      pros: ['兼顾效率和质量', '灵活可控', '适合大多数项目'],
      cons: ['需要精确规划', '管理复杂度中等'],
      confidence: 0.85
    }
  ];
  console.log('📝 使用默认设计方案（AI服务不可用）');
}

function selectDesign(design: DesignOption) {
  selectedDesign.value = design;
  generateFlowFromDesign(design);
}

function generateFlowFromDesign(design: DesignOption) {
  const nodes: any[] = [];
  const edges: any[] = [];
  const tasks = extractedTasks.value;

  // 生成节点
  tasks.forEach((task, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    nodes.push({
      id: `node-${idx}`,
      type: 'custom',
      position: { x: 50 + col * 200, y: 50 + row * 120 },
      data: { label: task, status: 'pending', assignee: '', days: 1, priority: 'medium' }
    });
  });

  // 生成边（简单的顺序连接）
  if (design.id === '1') {
    // 串行
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ id: `edge-${i}`, source: `node-${i}`, target: `node-${i + 1}`, animated: true });
    }
  } else {
    // 并行/分阶段
    const groups = Math.ceil(nodes.length / 3);
    for (let g = 0; g < groups - 1; g++) {
      const startIdx = g * 3;
      const endIdx = Math.min((g + 1) * 3, nodes.length);
      const nextStartIdx = (g + 1) * 3;
      if (nextStartIdx < nodes.length) {
        for (let i = startIdx; i < endIdx; i++) {
          edges.push({ id: `edge-${i}-${nextStartIdx}`, source: `node-${i}`, target: `node-${nextStartIdx}`, animated: true });
        }
      }
    }
  }

  flowNodes.value = nodes;
  flowEdges.value = edges;
}

// 应用AI助手生成的流程
function applyAIFlow(flowData: any) {
  // 转换AI生成的数据为VueFlow格式
  const nodes = flowData.nodes.map((node: any) => ({
    id: node.id,
    type: 'custom',
    position: { x: node.x, y: node.y },
    data: {
      label: node.label,
      status: 'pending',
      assignee: '',
      days: 1,
      priority: 'medium'
    }
  }));

  const edges = flowData.edges.map((edge: any) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: true
  }));

  flowNodes.value = nodes;
  flowEdges.value = edges;

  // 创建一个AI生成的设计方案
  const aiDesign: DesignOption = {
    id: 'ai-generated',
    name: 'AI智能生成方案',
    description: '基于AI分析任务依赖关系自动生成的流程方案',
    estimatedDays: Math.ceil(nodes.length * 0.8),
    requiredPeople: Math.min(Math.ceil(nodes.length / 3), 5),
    riskLevel: 'medium',
    isRecommended: true,
    type: 'hybrid',
    confidence: 0.9
  };

  selectedDesign.value = aiDesign;

  ElMessage.success('AI流程图已应用，可以在此基础上继续编辑');

  // 自动调整视图
  nextTick(() => {
    fitView({ padding: 0.2 });
  });
}

function backToDesigns() {
  selectedDesign.value = null;
  selectedNode.value = null;
}

function autoLayout() {
  fitView({ padding: 0.2 });
}

function onNodeClick(event: any) {
  selectedNode.value = flowNodes.value.find(n => n.id === event.node.id) || null;
}

async function applyDesign() {
  ElMessage.success('设计方案已应用');
}
</script>

<style scoped>
.flow-designer { height: 100%; display: flex; flex-direction: column; background: var(--bg-primary, #f8fafc); }
.designer-layout { flex: 1; display: flex; gap: 0; overflow: hidden; }

/* 左侧面板 */
.input-panel { width: 300px; background: #fff; border-right: 1px solid var(--border-subtle, #e2e8f0); display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0; }
.panel-section { padding: 20px; border-bottom: 1px solid var(--border-subtle, #e2e8f0); }
.panel-section:last-child { border-bottom: none; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.panel-section h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary, #1e293b); }
.section-desc { margin: 0 0 12px 0; font-size: 12px; color: var(--text-secondary, #64748b); }
.task-input { width: 100%; padding: 12px; border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 8px; font-size: 13px; resize: none; font-family: inherit; }
.task-input:focus { outline: none; border-color: var(--color-primary, #3b82f6); }
.input-stats { margin-top: 8px; font-size: 12px; color: var(--text-secondary); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-item { display: flex; flex-direction: column; gap: 4px; }
.form-item label { font-size: 12px; color: var(--text-secondary); }
.form-item input, .form-item select { padding: 8px; border: 1px solid var(--border-subtle); border-radius: 6px; font-size: 13px; }
.panel-actions { padding: 20px; margin-top: auto; }

/* 中间区域 */
.flow-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #fff; }
.empty-state, .analyzing-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); }
.empty-icon { margin-bottom: 16px; color: #94a3b8; }
.empty-state h3, .analyzing-state h3 { margin: 0 0 8px 0; font-size: 18px; color: var(--text-primary); }
.empty-state p, .analyzing-state p { margin: 0; font-size: 14px; }

.analyzing-animation { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid var(--color-primary, #3b82f6); opacity: 0; animation: pulse 2s ease-out infinite; }
.pulse-ring.delay-1 { animation-delay: 0.5s; }
@keyframes pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
.ai-icon { color: var(--color-primary, #3b82f6); }
.progress-bar { width: 200px; height: 4px; background: #e2e8f0; border-radius: 2px; margin-top: 16px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-primary, #3b82f6); transition: width 0.3s; }

/* 设计方案 */
.designs-view { flex: 1; padding: 24px; overflow-y: auto; }
.designs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.designs-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.header-tags { display: flex; align-items: center; gap: 12px; }
.ai-badge { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-size: 12px; font-weight: 500; border-radius: 20px; }
.ai-badge svg { animation: pulse 2s infinite; }
.designs-count { font-size: 13px; color: var(--text-secondary); }
.designs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.design-card { position: relative; padding: 24px; background: #fff; border: 2px solid var(--border-subtle); border-radius: 16px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; }
.design-card:hover { border-color: var(--color-primary); box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
.design-card.recommended { border-color: var(--color-primary); background: linear-gradient(135deg, rgba(59,130,246,0.03) 0%, rgba(147,51,234,0.03) 100%); }
.card-badge { position: absolute; top: 16px; right: 16px; padding: 4px 10px; background: var(--color-primary); color: #fff; font-size: 11px; font-weight: 600; border-radius: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.design-card h4 { margin: 0; font-size: 16px; font-weight: 600; flex: 1; }
.confidence-badge { display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--bg-secondary); border-radius: 12px; font-size: 11px; color: var(--color-primary); font-weight: 500; }
.design-card p { margin: 0 0 16px 0; font-size: 13px; color: var(--text-secondary); line-height: 1.6; flex: 1; }
.card-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-secondary); margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-subtle); }
.card-meta span { display: flex; align-items: center; gap: 4px; }
.risk-badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; }
.risk-badge.risk-low { background: #dcfce7; color: #166534; }
.risk-badge.risk-medium { background: #fef3c7; color: #92400e; }
.risk-badge.risk-high { background: #fee2e2; color: #991b1b; }
.pros-cons { display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
.pros-cons .pros, .pros-cons .cons { display: flex; gap: 8px; }
.pros-cons .label { font-weight: 500; min-width: 36px; }
.pros-cons .pros .label { color: #16a34a; }
.pros-cons .cons .label { color: #dc2626; }
.pros-cons .items { color: var(--text-secondary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 流程图 */
.flow-view { flex: 1; display: flex; flex-direction: column; }
.flow-toolbar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); background: #fff; }
.toolbar-title { flex: 1; font-size: 14px; font-weight: 500; }
.toolbar-actions { display: flex; gap: 8px; }
.flow-canvas { flex: 1; }
.flow-node { padding: 12px 16px; background: #fff; border: 1px solid var(--border-subtle); border-radius: 8px; min-width: 140px; }
.flow-node.status-pending { border-left: 3px solid #f59e0b; }
.flow-node.status-in_progress { border-left: 3px solid #3b82f6; }
.flow-node.status-completed { border-left: 3px solid #10b981; }
.node-content { display: flex; flex-direction: column; gap: 4px; }
.node-label { font-size: 13px; font-weight: 500; }
.node-assignee { font-size: 11px; color: var(--text-secondary); }

/* 右侧面板 */
.detail-panel { width: 280px; background: #fff; border-left: 1px solid var(--border-subtle); overflow-y: auto; flex-shrink: 0; }
.node-detail { display: flex; flex-direction: column; gap: 12px; }
.detail-row { display: flex; flex-direction: column; gap: 4px; }
.detail-row label { font-size: 12px; color: var(--text-secondary); }
.detail-row input, .detail-row select { padding: 8px; border: 1px solid var(--border-subtle); border-radius: 6px; font-size: 13px; }
.overview-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.stat-item { text-align: center; padding: 12px; background: var(--bg-secondary, #f8fafc); border-radius: 8px; }
.stat-value { display: block; font-size: 20px; font-weight: 600; color: var(--text-primary); }
.stat-label { font-size: 11px; color: var(--text-secondary); }
.ai-suggestions { display: flex; flex-direction: column; gap: 10px; }
.suggestion-item { display: flex; gap: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 6px; font-size: 12px; }
.suggestion-icon { flex-shrink: 0; }
.suggestion-icon.info { color: #3b82f6; }
.suggestion-icon.warning { color: #f59e0b; }

/* 按钮 */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 16px; font-size: 13px; font-weight: 500; border-radius: 8px; border: none; cursor: pointer; transition: all 0.15s; }
.btn-primary { background: var(--color-primary, #3b82f6); color: #fff; }
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: var(--bg-secondary, #f1f5f9); color: var(--text-primary); }
.btn-secondary:hover { background: #e2e8f0; }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-block { width: 100%; }
.btn-icon { padding: 8px; border: none; background: transparent; cursor: pointer; color: var(--text-secondary); border-radius: 6px; }
.btn-icon:hover { background: var(--bg-hover, #f1f5f9); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* 响应式 */
@media (max-width: 1200px) {
  .detail-panel { width: 240px; }
}

@media (max-width: 992px) {
  .designer-layout { flex-direction: column; }
  .input-panel, .detail-panel { width: 100%; max-height: 300px; }
}

@media (max-width: 768px) {
  /* 移动端隐藏描述文字和辅助信息 */
  .section-desc,
  .input-stats,
  .design-card p,
  .pros-cons .items,
  .stat-label,
  .ai-suggestions span,
  .node-assignee,
  .toolbar-actions .btn-secondary,
  .empty-state p,
  .analyzing-state p,
  .progress-bar,
  .designs-count,
  .ai-suggestions .suggestion-item span {
    display: none !important;
  }

  /* 移动端简化左侧面板 */
  .input-panel {
    width: 100%;
    max-height: none;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }

  .panel-section {
    padding: 12px 16px;
  }

  .panel-section h3 {
    font-size: 13px;
  }

  .task-input {
    font-size: 14px;
    padding: 10px;
  }

  .form-grid {
    gap: 10px;
  }

  .form-item label {
    font-size: 11px;
  }

  .panel-actions {
    padding: 12px 16px;
  }

  .btn-block {
    font-size: 13px;
    padding: 10px;
  }

  /* 移动端简化设计方案卡片 */
  .designs-view {
    padding: 16px;
  }

  .designs-header {
    margin-bottom: 16px;
  }

  .designs-header h3 {
    font-size: 15px;
  }

  .designs-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .design-card {
    padding: 16px;
  }

  .design-card h4 {
    font-size: 14px;
  }

  .card-header {
    margin-bottom: 8px;
  }

  .card-meta {
    margin-bottom: 12px;
    padding-bottom: 12px;
    font-size: 11px;
    gap: 12px;
  }

  .confidence-badge {
    font-size: 10px;
    padding: 3px 6px;
  }

  .card-badge {
    font-size: 10px;
    padding: 3px 8px;
    top: 12px;
    right: 12px;
  }

  /* 移动端简化优缺点展示 */
  .pros-cons {
    gap: 6px;
    font-size: 11px;
  }

  .pros-cons .label {
    min-width: 30px;
    font-size: 11px;
  }

  /* 移动端简化右侧面板 */
  .detail-panel {
    width: 100%;
    max-height: none;
    border-left: none;
    border-top: 1px solid var(--border-subtle);
  }

  .overview-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-item {
    padding: 10px;
  }

  .stat-value {
    font-size: 18px;
  }

  .node-detail {
    gap: 10px;
  }

  .detail-row input,
  .detail-row select {
    font-size: 14px;
    padding: 8px;
  }

  /* 移动端简化流程图工具栏 */
  .flow-toolbar {
    padding: 10px 12px;
    gap: 8px;
  }

  .toolbar-title {
    font-size: 13px;
  }

  .btn-sm {
    padding: 6px 10px;
    font-size: 12px;
  }

  /* 移动端简化空状态和分析状态 */
  .empty-state h3,
  .analyzing-state h3 {
    font-size: 16px;
  }

  .analyzing-animation {
    width: 80px;
    height: 80px;
  }

  /* 移动端简化流程节点 */
  .flow-node {
    padding: 8px 12px;
    min-width: 100px;
  }

  .node-label {
    font-size: 12px;
  }

  /* 移动端简化AI提示 */
  .ai-suggestions {
    gap: 8px;
  }

  .suggestion-item {
    padding: 8px;
  }

  /* 移动端整体布局调整 */
  .flow-designer {
    height: auto;
    min-height: 100vh;
  }

  .designer-layout {
    flex-direction: column;
  }

  .flow-area {
    min-height: 400px;
  }
}

@media (max-width: 480px) {
  /* 更小屏幕进一步简化 */
  .header-tags {
    display: none !important;
  }

  .card-meta {
    flex-wrap: wrap;
    gap: 8px;
  }

  .risk-badge {
    font-size: 10px;
    padding: 2px 6px;
  }

  .overview-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .stat-item {
    padding: 8px;
  }

  .stat-value {
    font-size: 16px;
  }

  .pros-cons {
    display: none !important;
  }

  /* 保持必要的文字 */
  .btn,
  .design-card h4,
  .toolbar-title,
  .node-label,
  .panel-section h3 {
    display: block !important;
  }
}
</style>
