<template>
  <el-drawer
    v-model="visible"
    :title="isEdit ? '编辑职位' : '新增职位'"
    size="520px"
    class="position-form-drawer"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="position-form"
    >
      <!-- Basic Info Section -->
      <div class="form-section">
        <div class="section-title">基本信息</div>

        <el-form-item label="所属部门" prop="departmentId">
          <el-select
            v-model="form.departmentId"
            placeholder="请选择部门"
            filterable
            style="width: 100%"
            :disabled="isEdit"
          >
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="职位名称" prop="positionName">
          <el-input v-model="form.positionName" placeholder="请输入职位名称" />
        </el-form-item>

        <el-form-item label="职位编码" prop="positionCode">
          <el-input
            v-model="form.positionCode"
            placeholder="请输入职位编码（如 DEV、PM）"
            @input="handleCodeInput"
          />
          <template #extra>
            <span class="form-tip">建议使用大写字母和数字组合</span>
          </template>
        </el-form-item>
      </div>

      <!-- Classification Section -->
      <div class="form-section">
        <div class="section-title">分类设置</div>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="职位级别" prop="positionLevel">
              <el-input-number
                v-model="form.positionLevel"
                :min="1"
                :max="20"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位类型">
              <el-switch
                v-model="form.isManagement"
                :active-value="1"
                :inactive-value="0"
                active-text="管理岗"
                inactive-text="普通岗"
                inline-prompt
                style="--el-switch-on-color: var(--color-warning)"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Compensation Section -->
      <div class="form-section">
        <div class="section-title">薪酬编制</div>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="薪资范围 (K)">
              <div class="salary-range-input">
                <el-input-number
                  v-model="form.salaryMin"
                  :min="0"
                  :max="form.salaryMax || 999"
                  placeholder="最低"
                  controls-position="right"
                />
                <span class="range-sep">-</span>
                <el-input-number
                  v-model="form.salaryMax"
                  :min="form.salaryMin || 0"
                  :max="999"
                  placeholder="最高"
                  controls-position="right"
                />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大编制人数">
              <el-input-number
                v-model="form.headcountMax"
                :min="0"
                :max="999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Description Section (Collapsible) -->
      <el-collapse v-model="activeCollapse" class="form-collapse">
        <el-collapse-item title="职位描述" name="description">
          <el-form-item label="技能要求">
            <el-input
              v-model="form.skillRequirements"
              type="textarea"
              :rows="2"
              placeholder="请输入技能要求"
            />
          </el-form-item>

          <el-form-item label="职位描述">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入职位描述"
            />
          </el-form-item>

          <el-form-item label="工作职责">
            <el-input
              v-model="form.responsibilities"
              type="textarea"
              :rows="3"
              placeholder="请输入工作职责"
            />
          </el-form-item>

          <el-form-item label="任职要求">
            <el-input
              v-model="form.requirements"
              type="textarea"
              :rows="3"
              placeholder="请输入任职要求"
            />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <!-- Role Binding (Only for new position) -->
      <div class="form-section" v-if="!isEdit">
        <div class="section-title">角色绑定</div>

        <el-form-item label="绑定角色">
          <el-select
            v-model="form.roleIds"
            placeholder="可选，绑定角色权限"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%"
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
          <template #extra>
            <span class="form-tip">绑定角色后，该职位的员工将自动获得对应权限</span>
          </template>
        </el-form-item>
      </div>

      <!-- Status Section -->
      <div class="form-section">
        <div class="section-title">状态</div>

        <el-form-item>
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { Department, Role, PositionFormData, Position } from '../types';

interface Props {
  modelValue: boolean;
  position?: Position | null;
  departments: Department[];
  roles: Role[];
  defaultDepartmentId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  position: null,
  defaultDepartmentId: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', data: PositionFormData): void;
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const activeCollapse = ref<string[]>([]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const isEdit = computed(() => !!props.position?.id);

const form = reactive<PositionFormData>({
  id: '',
  departmentId: '',
  positionName: '',
  positionCode: '',
  positionLevel: 1,
  isManagement: 0,
  status: 1,
  salaryMin: undefined,
  salaryMax: undefined,
  headcountMax: undefined,
  skillRequirements: '',
  description: '',
  responsibilities: '',
  requirements: '',
  roleIds: [],
});

const rules: FormRules = {
  departmentId: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
  positionName: [{ required: true, message: '请输入职位名称', trigger: 'blur' }],
  positionCode: [
    { required: true, message: '请输入职位编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9_-]+$/, message: '编码只能包含大写字母、数字、下划线和连字符', trigger: 'blur' },
  ],
  positionLevel: [{ required: true, message: '请选择职位级别', trigger: 'change' }],
};

// Reset form when position changes
watch(() => props.position, (newPosition) => {
  if (newPosition) {
    Object.assign(form, {
      id: newPosition.id,
      departmentId: newPosition.departmentId,
      positionName: newPosition.positionName,
      positionCode: newPosition.positionCode,
      positionLevel: newPosition.positionLevel,
      isManagement: newPosition.isManagement,
      status: newPosition.status,
      salaryMin: newPosition.salaryMin,
      salaryMax: newPosition.salaryMax,
      headcountMax: newPosition.headcountMax,
      skillRequirements: newPosition.skillRequirements || '',
      description: newPosition.description || '',
      responsibilities: newPosition.responsibilities || '',
      requirements: newPosition.requirements || '',
      roleIds: [],
    });
  } else {
    resetForm();
  }
}, { immediate: true });

// Set default department when opening for new position
watch(visible, (isVisible) => {
  if (isVisible && !props.position) {
    form.departmentId = props.defaultDepartmentId || '';
  }
});

function resetForm() {
  Object.assign(form, {
    id: '',
    departmentId: props.defaultDepartmentId || '',
    positionName: '',
    positionCode: '',
    positionLevel: 1,
    isManagement: 0,
    status: 1,
    salaryMin: undefined,
    salaryMax: undefined,
    headcountMax: undefined,
    skillRequirements: '',
    description: '',
    responsibilities: '',
    requirements: '',
    roleIds: [],
  });
  activeCollapse.value = [];
}

function handleCodeInput(value: string) {
  form.positionCode = value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function handleClose() {
  visible.value = false;
  resetForm();
  formRef.value?.resetFields();
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data: PositionFormData = { ...form };
      if (isEdit.value) {
        delete data.roleIds;
      }
      emit('submit', data);
    } finally {
      submitting.value = false;
    }
  });
}

// Expose methods
defineExpose({
  resetForm,
  setSubmitting: (val: boolean) => { submitting.value = val; },
});
</script>

<style scoped>
.position-form-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.position-form-drawer :deep(.el-drawer__title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.position-form-drawer :deep(.el-drawer__body) {
  padding: 0;
  background: var(--bg-card);
}

.position-form-drawer :deep(.el-drawer__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.position-form {
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}

.form-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.salary-range-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.salary-range-input .el-input-number {
  flex: 1;
}

.range-sep {
  color: var(--text-muted);
}

/* Collapse styles */
.form-collapse {
  border: none;
  margin-bottom: 24px;
}

.form-collapse :deep(.el-collapse-item__header) {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-secondary);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.form-collapse :deep(.el-collapse-item__wrap) {
  border: none;
}

.form-collapse :deep(.el-collapse-item__content) {
  padding: 16px 0 0;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Form item styles */
.position-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-secondary);
}

.position-form :deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>
