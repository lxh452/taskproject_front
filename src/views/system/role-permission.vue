<template>
  <div class="role-permission">
    <el-tree
      ref="treeRef"
      :data="permissionTree"
      show-checkbox
      node-key="id"
      :default-checked-keys="checkedKeys"
      :props="{ label: 'name', children: 'children' }"
    />
    <div class="btn-group">
      <el-button type="primary" @click="handleSave">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElTree } from 'element-plus';

interface PermissOptions {
  id?: string;
  permiss?: string[];
}

const props = defineProps<{
  permissOptions: PermissOptions;
}>();

const treeRef = ref<InstanceType<typeof ElTree>>();

// 权限树数据
const permissionTree = ref([
  {
    id: '1',
    name: '系统管理',
    children: [
      { id: '1-1', name: '用户管理' },
      { id: '1-2', name: '角色管理' },
      { id: '1-3', name: '权限管理' },
    ],
  },
  {
    id: '2',
    name: '任务管理',
    children: [
      { id: '2-1', name: '任务列表' },
      { id: '2-2', name: '任务创建' },
      { id: '2-3', name: '任务分配' },
    ],
  },
  {
    id: '3',
    name: '流程管理',
    children: [
      { id: '3-1', name: '流程设计' },
      { id: '3-2', name: '流程审批' },
    ],
  },
]);

const checkedKeys = computed(() => props.permissOptions?.permiss || []);

watch(() => props.permissOptions, (val) => {
  if (val?.permiss && treeRef.value) {
    treeRef.value.setCheckedKeys(val.permiss);
  }
}, { immediate: true });

const handleSave = () => {
  const checkedNodes = treeRef.value?.getCheckedKeys() || [];
  console.log('保存权限:', checkedNodes);
  ElMessage.success('权限保存成功');
};
</script>

<style scoped>
.role-permission {
  padding: 10px;
}

.btn-group {
  margin-top: 20px;
  text-align: right;
}
</style>
