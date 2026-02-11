<template>
  <div class="flow-edge" @click.stop="$emit('delete')">
    <div class="edge-label" v-if="edgeData?.label">{{ edgeData.label }}</div>
  </div>
</template>

<script setup lang="ts">
interface EdgeData {
  label?: string;
}

const props = defineProps<{
  id: string;
  data?: EdgeData;
}>();

const edgeData = props.data as EdgeData | undefined;

defineEmits(['delete']);
</script>

<style scoped>
.flow-edge {
  stroke: #c0c4cc;
  stroke-width: 2;
  transition: all 0.3s;
}

.flow-edge:hover {
  stroke: #409eff;
  stroke-width: 3;
}

.edge-label {
  font-size: 12px;
  fill: #606266;
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
