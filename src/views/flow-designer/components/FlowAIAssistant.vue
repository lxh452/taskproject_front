<template>
  <div class="flow-ai-assistant">
    <!-- AI助手按钮 - 点击直接生成 -->
    <button
      class="fab-button"
      :class="{ 
        'analyzing': isAnalyzing,
        'generated': hasGenerated
      }"
      @click="generateFlow"
      :disabled="tasks.length === 0 || isAnalyzing"
      :title="getButtonTitle()"
    >
      <el-icon v-if="isAnalyzing" class="analyzing-icon"><Loading /></el-icon>
      <el-icon v-else-if="hasGenerated"><CircleCheck /></el-icon>
      <el-icon v-else><MagicStick /></el-icon>
      <span class="fab-text">
        {{ isAnalyzing ? '分析中...' : (hasGenerated ? '已生成' : 'AI生成流程') }}
      </span>
    </button>

    <!-- 提示消息 -->
    <transition name="fade">
      <div v-if="showTip" class="tip-message" :class="tipType">
        <el-icon v-if="tipType === 'success'"><CircleCheck /></el-icon>
        <el-icon v-else-if="tipType === 'error'"><CircleClose /></el-icon>
        <el-icon v-else><InfoFilled /></el-icon>
        <span>{{ tipMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  MagicStick, Loading, CircleCheck, CircleClose, InfoFilled
} from '@element-plus/icons-vue';
import { streamPolishTask } from '@/api';

const props = defineProps<{
  tasks: string[];
}>();

const emit = defineEmits<{
  (e: 'apply-flow', nodes: any[], edges: any[]): void;
}>();

const isAnalyzing = ref(false);
const hasGenerated = ref(false);
const showTip = ref(false);
const tipMessage = ref('');
const tipType = ref<'success' | 'error' | 'info'>('info');

function getButtonTitle() {
  if (props.tasks.length === 0) return '请先添加任务';
  if (isAnalyzing.value) return 'AI分析中...';
  if (hasGenerated.value) return '流程已生成';
  return '点击AI自动生成流程图';
}

function showTipMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
  tipMessage.value = message;
  tipType.value = type;
  showTip.value = true;
  setTimeout(() => {
    showTip.value = false;
  }, 3000);
}

async function generateFlow() {
  if (props.tasks.length === 0) {
    showTipMessage('请先添加任务列表', 'error');
    return;
  }
  
  if (isAnalyzing.value) return;
  
  isAnalyzing.value = true;
  hasGenerated.value = false;
  
  try {
    // 构建GLM提示词
    const prompt = `作为流程设计专家，请分析以下任务，识别依赖关系并确定执行顺序。

任务列表：
${props.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

请返回JSON格式：
{
  "analysis": "简要分析",
  "dependencies": [
    {"index": 0, "dependsOn": []},
    {"index": 1, "dependsOn": [0]},
    ...
  ],
  "levels": [[0], [1,2], [3]]
}`;

    // 调用GLM
    let aiResponse = '';
    await streamPolishTask(
      { rawDescription: prompt },
      (chunk) => { aiResponse += chunk; }
    );

    // 解析响应
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI响应格式错误');
    
    const result = JSON.parse(jsonMatch[0]);
    const dependencies = result.dependencies || [];
    const levels = result.levels || [];

    // 生成节点 - 遵循手动拖拽格式
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // 计算位置
    const levelYMap = new Map<number, number>();
    let currentY = 100;
    levels.forEach((level: number[], idx: number) => {
      levelYMap.set(idx, currentY);
      currentY += Math.max(140, level.length * 100) + 40;
    });

    // 创建节点
    props.tasks.forEach((taskName, idx) => {
      const depInfo = dependencies.find((d: any) => d.index === idx);
      const prereqIndices = depInfo?.dependsOn || [];
      
      // 逻辑：第一个前置节点始终是 'start'
      let prerequisiteNodes: string[];
      if (prereqIndices.length > 0) {
        // 有依赖，转换为节点ID
        prerequisiteNodes = prereqIndices.map((i: number) => `node-${i}`);
      } else {
        // 无依赖，连接到 start
        prerequisiteNodes = ['start'];
      }

      // 查找层级
      let nodeLevel = 0;
      levels.forEach((level: number[], lIdx: number) => {
        if (level.includes(idx)) nodeLevel = lIdx;
      });
      
      const levelNodes = levels[nodeLevel] || [idx];
      const indexInLevel = levelNodes.indexOf(idx);

      const nodeId = `node-${idx}`;
      
      nodes.push({
        id: nodeId,
        type: 'custom',
        position: {
          x: 150 + nodeLevel * 320,
          y: (levelYMap.get(nodeLevel) || 100) + indexInLevel * 120
        },
        data: {
          label: taskName,
          nodeName: taskName,
          status: 'pending',
          assignee: '',
          days: 2,
          priority: 'medium',
          prerequisiteNodes: prerequisiteNodes,
          styleVars: {
            borderColor: '#E2E8F0',
            bgFrom: '#FFFFFF',
            bgTo: '#FFFFFF',
          },
        },
        draggable: true,
        style: {
          background: '#FFFFFF',
          border: '2px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '200px',
          color: '#0F172A',
        },
      });

      // 创建边 - 第一个前置节点始终是 start 的逻辑
      if (prerequisiteNodes.includes('start')) {
        edges.push({
          id: `start->${nodeId}`,
          source: 'start',
          target: nodeId,
          type: 'smoothstep',
          animated: true,
        });
      }
      
      // 其他依赖边
      prereqIndices.forEach((prereqIdx: number) => {
        if (prereqIdx >= 0 && prereqIdx < props.tasks.length) {
          const prereqId = `node-${prereqIdx}`;
          if (prereqId !== 'start') {
            edges.push({
              id: `${prereqId}->${nodeId}`,
              source: prereqId,
              target: nodeId,
              type: 'smoothstep',
              animated: true,
            });
          }
        }
      });
    });

    emit('apply-flow', nodes, edges);
    hasGenerated.value = true;
    showTipMessage(`已生成${nodes.length}个节点的流程图`, 'success');
    
  } catch (error) {
    console.error('AI生成失败:', error);
    showTipMessage('AI生成失败，请重试', 'error');
  } finally {
    isAnalyzing.value = false;
  }
}

watch(() => props.tasks, () => {
  hasGenerated.value = false;
}, { deep: true });
</script>

<style scoped>
.flow-ai-assistant {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
}

.fab-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.fab-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5);
}

.fab-button:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.fab-button.analyzing {
  animation: pulse 1.5s infinite;
}

.fab-button.generated {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.analyzing-icon {
  animation: spin 1s linear infinite;
}

.tip-message {
  position: absolute;
  right: 0;
  bottom: 70px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  min-width: 280px;
}

.tip-message.success {
  border-left: 4px solid #67c23a;
  color: #67c23a;
}

.tip-message.error {
  border-left: 4px solid #f56c6c;
  color: #f56c6c;
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@media (max-width: 768px) {
  .fab-text {
    display: none;
  }
  .fab-button {
    padding: 14px;
    border-radius: 50%;
  }
}
</style>
