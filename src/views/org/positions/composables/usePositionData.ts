import { ref, computed, reactive, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listPositions,
  createPosition,
  updatePosition,
  deletePosition,
  listDepartments,
  roleList
} from '@/api';
import { useUserStore } from '@/store/user';
import type {
  Position,
  Department,
  FilterState,
  SortState,
  PaginationState,
  PositionStats,
  PositionFormData,
  Role,
  DEFAULT_FILTER,
  DEFAULT_PAGINATION
} from '../types';

export function usePositionData() {
  const userStore = useUserStore();

  // State
  const loading = ref(false);
  const positions = ref<Position[]>([]);
  const departments = ref<Department[]>([]);
  const roles = ref<Role[]>([]);
  const selectedDeptId = ref<string>('');
  const selectedRows = ref<Position[]>([]);

  // Filter state
  const filter = reactive<FilterState>({
    keyword: '',
    levels: [],
    jobType: '',
    status: '',
    salaryMin: null,
    salaryMax: null,
    hasVacancy: false,
  });

  // Sort state
  const sort = reactive<SortState>({
    prop: '',
    order: null,
  });

  // Pagination state
  const pagination = reactive<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  // Computed: filtered positions
  const filteredPositions = computed(() => {
    let result = [...positions.value];

    // Filter by department
    if (selectedDeptId.value) {
      result = result.filter(p => p.departmentId === selectedDeptId.value);
    }

    // Filter by keyword
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase();
      result = result.filter(p =>
        p.positionName.toLowerCase().includes(kw) ||
        p.positionCode.toLowerCase().includes(kw)
      );
    }

    // Filter by levels
    if (filter.levels.length > 0) {
      result = result.filter(p => filter.levels.includes(p.positionLevel));
    }

    // Filter by job type
    if (filter.jobType !== '') {
      result = result.filter(p => p.isManagement === filter.jobType);
    }

    // Filter by status
    if (filter.status !== '') {
      result = result.filter(p => p.status === filter.status);
    }

    // Filter by salary range
    if (filter.salaryMin !== null) {
      result = result.filter(p => (p.salaryMin ?? 0) >= filter.salaryMin!);
    }
    if (filter.salaryMax !== null) {
      result = result.filter(p => (p.salaryMax ?? Infinity) <= filter.salaryMax!);
    }

    // Filter by vacancy
    if (filter.hasVacancy) {
      result = result.filter(p => {
        const current = p.headcountCurrent ?? 0;
        const max = p.headcountMax ?? 0;
        return max > current;
      });
    }

    return result;
  });

  // Computed: sorted positions
  const sortedPositions = computed(() => {
    const result = [...filteredPositions.value];

    if (sort.prop && sort.order) {
      result.sort((a, b) => {
        const aVal = a[sort.prop as keyof Position];
        const bVal = b[sort.prop as keyof Position];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sort.order === 'ascending' ? comparison : -comparison;
      });
    }

    return result;
  });

  // Computed: paginated positions
  const paginatedPositions = computed(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedPositions.value.slice(start, end);
  });

  // Computed: statistics
  const stats = computed<PositionStats>(() => {
    const all = selectedDeptId.value
      ? positions.value.filter(p => p.departmentId === selectedDeptId.value)
      : positions.value;

    return {
      total: all.length,
      enabled: all.filter(p => p.status === 1).length,
      management: all.filter(p => p.isManagement === 1).length,
      vacancy: all.filter(p => {
        const current = p.headcountCurrent ?? 0;
        const max = p.headcountMax ?? 0;
        return max > current;
      }).length,
    };
  });

  // Computed: department tree with position counts
  const departmentTree = computed(() => {
    const deptMap = new Map<string, number>();
    positions.value.forEach(p => {
      const count = deptMap.get(p.departmentId) || 0;
      deptMap.set(p.departmentId, count + 1);
    });

    return departments.value.map(d => ({
      ...d,
      positionCount: deptMap.get(d.id) || 0,
    }));
  });

  // Update pagination total when filtered results change
  watch(filteredPositions, (newVal) => {
    pagination.total = newVal.length;
    // Reset to page 1 if current page is out of range
    const maxPage = Math.ceil(newVal.length / pagination.pageSize) || 1;
    if (pagination.page > maxPage) {
      pagination.page = 1;
    }
  });

  // Load departments
  async function loadDepartments() {
    try {
      const companyId = userStore.companyId || '';
      if (!companyId) return;

      const resp = await listDepartments({ page: 1, pageSize: 1000, companyId });
      if (resp.data.code === 200) {
        const list = resp.data.data?.list || [];
        departments.value = list.map((d: any) => ({
          id: d.id || d.Id,
          name: d.departmentName || d.DepartmentName || '未知部门',
          code: d.departmentCode?.String || d.departmentCode || '',
          parentId: d.parentId || d.ParentId || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  }

  // Load positions
  async function loadPositions() {
    loading.value = true;
    try {
      const resp = await listPositions({
        page: 1,
        pageSize: 1000,
        departmentId: '',
        name: ''
      });

      if (resp.data.code !== 200) {
        ElMessage.error(resp.data.msg || '获取职位列表失败');
        return;
      }

      const list = resp.data.data?.list || resp.data.data?.positions?.list || [];
      const deptMap = new Map(departments.value.map(d => [d.id, d.name]));

      positions.value = list.map((p: any) => ({
        id: p.id,
        departmentId: p.departmentId || p.DepartmentId || '',
        departmentName: deptMap.get(p.departmentId || p.DepartmentId || '') || p.departmentName || '未分配',
        positionName: p.positionName || '未命名职位',
        positionCode: p.positionCode?.String || p.positionCode || '',
        positionLevel: p.positionLevel ?? 1,
        isManagement: p.isManagement ?? 0,
        status: p.status ?? 1,
        salaryMin: p.salaryMin ?? null,
        salaryMax: p.salaryMax ?? null,
        headcountMax: p.headcountMax ?? null,
        headcountCurrent: p.headcountCurrent ?? 0,
        skillRequirements: p.skillRequirements || '',
        description: p.description || '',
        responsibilities: p.responsibilities || '',
        requirements: p.requirements || '',
      }));

      pagination.total = positions.value.length;
    } catch (error) {
      ElMessage.error('系统错误');
      console.error('Failed to load positions:', error);
    } finally {
      loading.value = false;
    }
  }

  // Load roles
  async function loadRoles() {
    if (roles.value.length > 0) return;
    try {
      const resp = await roleList({ page: 1, pageSize: 1000 });
      if (resp.data.code === 200) {
        roles.value = (resp.data.data?.list || []).map((r: any) => ({
          id: r.id || r.Id,
          name: r.roleName || r.RoleName,
        }));
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  }

  // Initialize data
  async function initData() {
    await loadDepartments();
    await loadPositions();
  }

  // Create position
  async function createPositionData(data: PositionFormData): Promise<boolean> {
    try {
      const resp = await createPosition(data);
      if (resp.data.code === 200) {
        ElMessage.success('创建成功');
        await loadPositions();
        return true;
      } else {
        ElMessage.error(resp.data.msg || '创建失败');
        return false;
      }
    } catch (error) {
      ElMessage.error('请求失败');
      return false;
    }
  }

  // Update position
  async function updatePositionData(data: PositionFormData): Promise<boolean> {
    try {
      const resp = await updatePosition(data);
      if (resp.data.code === 200) {
        ElMessage.success('更新成功');
        await loadPositions();
        return true;
      } else {
        ElMessage.error(resp.data.msg || '更新失败');
        return false;
      }
    } catch (error) {
      ElMessage.error('请求失败');
      return false;
    }
  }

  // Delete position
  async function deletePositionData(id: string): Promise<boolean> {
    try {
      await ElMessageBox.confirm('确定要删除该职位吗？', '删除确认', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      });

      const resp = await deletePosition({ id });
      if (resp.data.code === 200) {
        ElMessage.success('删除成功');
        await loadPositions();
        return true;
      } else {
        ElMessage.error(resp.data.msg || '删除失败');
        return false;
      }
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('请求失败');
      }
      return false;
    }
  }

  // Batch delete
  async function batchDelete(ids: string[]): Promise<boolean> {
    if (ids.length === 0) {
      ElMessage.warning('请选择要删除的职位');
      return false;
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${ids.length} 个职位吗？`,
        '批量删除确认',
        { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
      );

      let successCount = 0;
      for (const id of ids) {
        const resp = await deletePosition({ id });
        if (resp.data.code === 200) successCount++;
      }

      if (successCount > 0) {
        ElMessage.success(`成功删除 ${successCount} 个职位`);
        await loadPositions();
        selectedRows.value = [];
      }

      return successCount === ids.length;
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('批量删除失败');
      }
      return false;
    }
  }

  // Batch update status
  async function batchUpdateStatus(ids: string[], status: number): Promise<boolean> {
    if (ids.length === 0) {
      ElMessage.warning('请选择要操作的职位');
      return false;
    }

    const action = status === 1 ? '启用' : '停用';
    try {
      await ElMessageBox.confirm(
        `确定要${action}选中的 ${ids.length} 个职位吗？`,
        `批量${action}确认`,
        { type: 'warning', confirmButtonText: action, cancelButtonText: '取消' }
      );

      let successCount = 0;
      for (const id of ids) {
        const resp = await updatePosition({ id, status });
        if (resp.data.code === 200) successCount++;
      }

      if (successCount > 0) {
        ElMessage.success(`成功${action} ${successCount} 个职位`);
        await loadPositions();
        selectedRows.value = [];
      }

      return successCount === ids.length;
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error(`批量${action}失败`);
      }
      return false;
    }
  }

  // Reset filter
  function resetFilter() {
    filter.keyword = '';
    filter.levels = [];
    filter.jobType = '';
    filter.status = '';
    filter.salaryMin = null;
    filter.salaryMax = null;
    filter.hasVacancy = false;
    pagination.page = 1;
  }

  // Handle sort change
  function handleSortChange({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) {
    sort.prop = prop;
    sort.order = order;
  }

  // Handle page change
  function handlePageChange(page: number) {
    pagination.page = page;
  }

  // Handle page size change
  function handlePageSizeChange(size: number) {
    pagination.pageSize = size;
    pagination.page = 1;
  }

  // Handle selection change
  function handleSelectionChange(rows: Position[]) {
    selectedRows.value = rows;
  }

  // Select department
  function selectDepartment(deptId: string) {
    selectedDeptId.value = selectedDeptId.value === deptId ? '' : deptId;
    pagination.page = 1;
  }

  return {
    // State
    loading,
    positions,
    departments,
    roles,
    selectedDeptId,
    selectedRows,
    filter,
    sort,
    pagination,

    // Computed
    filteredPositions,
    sortedPositions,
    paginatedPositions,
    stats,
    departmentTree,

    // Methods
    initData,
    loadPositions,
    loadDepartments,
    loadRoles,
    createPositionData,
    updatePositionData,
    deletePositionData,
    batchDelete,
    batchUpdateStatus,
    resetFilter,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    handleSelectionChange,
    selectDepartment,
  };
}
