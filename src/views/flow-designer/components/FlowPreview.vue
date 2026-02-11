<template>
  <div class="flow-preview" :class="{ 'is-large': large }">
    <svg :viewBox="svgViewBox" class="preview-svg">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" :fill="arrowColor" />
        </marker>
        <!-- 渐变定义 -->
        <linearGradient id="serial-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#67c23a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#85ce61;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="parallel-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#409eff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#66b1ff;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="mixed-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#e6a23c;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f5a623;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- 渲染边（曲线路径） -->
      <path
        v-for="edge in scaledEdges"
        :key="edge.id"
        :d="getEdgePath(edge)"
        :stroke="edgeColor"
        stroke-width="2"
        fill="none"
        marker-end="url(#arrowhead)"
      />

      <!-- 渲染节点 -->
      <g
        v-for="node in scaledNodes"
        :key="node.id"
        :transform="`translate(${node.position.x}, ${node.position.y})`"
      >
        <rect
          :width="nodeWidth"
          :height="nodeHeight"
          rx="4"
          :fill="getNodeFill()"
          opacity="0.9"
        />
        <!-- 节点标签（大尺寸模式） -->
        <text
          v-if="large"
          :x="nodeWidth / 2"
          :y="nodeHeight / 2 + 4"
          text-anchor="middle"
          fill="#fff"
          font-size="10"
        >
          {{ truncateLabel(node.data?.label || node.id) }}
        </text>
      </g>

      <!-- 方案类型指示器 -->
      <g v-if="schemeType" class="scheme-indicator">
        <rect
          x="2"
          y="2"
          width="40"
          height="14"
          rx="3"
          :fill="getIndicatorColor()"
          opacity="0.9"
        />
        <text
          x="22"
          y="12"
          text-anchor="middle"
          fill="#fff"
          font-size="8"
          font-weight="500"
        >
          {{ getSchemeLabel() }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FlowNode, FlowEdge } from '../../../agents/types/agent.types';

const props = withDefaults(defineProps<{
  nodes: FlowNode[];
  edges: FlowEdge[];
  schemeType?: 'serial' | 'parallel' | 'mixed';
  large?: boolean;
}>(), {
  large: false
});

// 根据尺寸调整参数
const nodeWidth = computed(() => props.large ? 50 : 30);
const nodeHeight = computed(() => props.large ? 24 : 20);
const svgViewBox = computed(() => props.large ? '0 0 300 150' : '0 0 200 100');

// 颜色配置
const edgeColor = computed(() => {
  const colors: Record<string, string> = {
    serial: '#67c23a',
    parallel: '#409eff',
    mixed: '#e6a23c'
  };
  return colors[props.schemeType || ''] || '#c0c4cc';
});

const arrowColor = computed(() => edgeColor.value);

// 缩放节点位置以适应预览区域
const scaledNodes = computed(() => {
  if (!props.nodes.length) return [];

  const bounds = getBounds(props.nodes);
  const maxWidth = props.large ? 260 : 160;
  const maxHeight = props.large ? 120 : 80;

  const scale = Math.min(
    maxWidth / (bounds.maxX - bounds.minX + nodeWidth.value),
    maxHeight / (bounds.maxY - bounds.minY + nodeHeight.value),
    props.large ? 2 : 1.5
  );

  const offsetX = props.large ? 30 : 20;
  const offsetY = props.large ? 20 : 10;

  return props.nodes.map(node => ({
    ...node,
    position: {
      x: offsetX + (node.position.x - bounds.minX) * scale,
      y: offsetY + (node.position.y - bounds.minY) * scale
    }
  }));
});

const scaledEdges = computed(() => props.edges);

const getBounds = (nodes: FlowNode[]) => {
  if (!nodes.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  const xs = nodes.map(n => n.position.x);
  const ys = nodes.map(n => n.position.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
};

const getNodePosition = (nodeId: string) => {
  const node = scaledNodes.value.find(n => n.id === nodeId);
  return node?.position || { x: 0, y: 0 };
};

// 生成曲线路径
const getEdgePath = (edge: FlowEdge) => {
  const sourcePos = getNodePosition(edge.source);
  const targetPos = getNodePosition(edge.target);

  const startX = sourcePos.x + nodeWidth.value / 2;
  const startY = sourcePos.y + nodeHeight.value / 2;
  const endX = targetPos.x + nodeWidth.value / 2;
  const endY = targetPos.y + nodeHeight.value / 2;

  // 计算控制点以创建平滑曲线
  const dx = endX - startX;
  const dy = endY - startY;

  // 如果是水平连接，使用简单的贝塞尔曲线
  if (Math.abs(dy) < 10) {
    const cx = startX + dx / 2;
    return `M ${startX} ${startY} Q ${cx} ${startY - 10} ${endX} ${endY}`;
  }

  // 垂直或斜向连接
  const cx1 = startX + dx * 0.3;
  const cy1 = startY;
  const cx2 = endX - dx * 0.3;
  const cy2 = endY;

  return `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
};

// 获取节点填充色
const getNodeFill = () => {
  const fills: Record<string, string> = {
    serial: 'url(#serial-gradient)',
    parallel: 'url(#parallel-gradient)',
    mixed: 'url(#mixed-gradient)'
  };
  return fills[props.schemeType || ''] || '#409eff';
};

// 获取指示器颜色
const getIndicatorColor = () => {
  const colors: Record<string, string> = {
    serial: '#67c23a',
    parallel: '#409eff',
    mixed: '#e6a23c'
  };
  return colors[props.schemeType || ''] || '#909399';
};

// 获取方案标签
const getSchemeLabel = () => {
  const labels: Record<string, string> = {
    serial: '串行',
    parallel: '并行',
    mixed: '混合'
  };
  return labels[props.schemeType || ''] || '';
};

// 截断标签
const truncateLabel = (label: string) => {
  return label.length > 6 ? label.slice(0, 5) + '...' : label;
};
</script>

<style scoped>
.flow-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flow-preview.is-large {
  min-height: 150px;
}

.preview-svg {
  width: 100%;
  height: 100%;
}
</style>
