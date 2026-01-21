<template>
  <span class="role-badge" :class="roleClass">{{ roleLabel }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  role: string | number;
}>();

const roleClass = computed(() => {
  const r = String(props.role).toLowerCase();
  if (r === 'admin' || r === '1' || r === 'administrator') return 'role-admin';
  if (r === 'manager' || r === '2' || r === 'leader') return 'role-manager';
  return 'role-employee';
});

const roleLabel = computed(() => {
  const r = String(props.role).toLowerCase();
  if (r === 'admin' || r === '1' || r === 'administrator') return '管理员';
  if (r === 'manager' || r === '2' || r === 'leader') return '经理';
  if (r === 'employee' || r === '3') return '员工';
  return props.role || '员工';
});
</script>

<style scoped>
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm, 6px);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.role-admin {
  background: #FEE2E2;
  color: #DC2626;
}

.role-manager {
  background: #FEF3C7;
  color: #D97706;
}

.role-employee {
  background: #E0F2FE;
  color: #0284C7;
}

/* Dark Mode */
html.dark-mode .role-admin {
  background: rgba(248, 113, 113, 0.15);
  color: #F87171;
}

html.dark-mode .role-manager {
  background: rgba(251, 191, 36, 0.15);
  color: #FBBF24;
}

html.dark-mode .role-employee {
  background: rgba(56, 189, 248, 0.15);
  color: #38BDF8;
}
</style>
