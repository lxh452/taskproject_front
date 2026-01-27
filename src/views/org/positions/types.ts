// Position Management Types

export interface Position {
  id: string;
  departmentId: string;
  departmentName: string;
  positionName: string;
  positionCode: string;
  positionLevel: number;
  isManagement: number; // 1: 管理岗, 0: 普通岗
  status: number; // 1: 启用, 0: 停用
  salaryMin?: number;
  salaryMax?: number;
  headcountMax?: number;
  headcountCurrent?: number;
  skillRequirements?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  children?: Department[];
  positionCount?: number;
}

export interface FilterState {
  keyword: string;
  levels: number[];
  jobType: '' | 0 | 1; // '': 全部, 0: 普通岗, 1: 管理岗
  status: '' | 0 | 1; // '': 全部, 0: 停用, 1: 启用
  salaryMin: number | null;
  salaryMax: number | null;
  hasVacancy: boolean;
}

export interface SortState {
  prop: string;
  order: 'ascending' | 'descending' | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface PositionStats {
  total: number;
  enabled: number;
  management: number;
  vacancy: number;
}

export interface PositionFormData {
  id?: string;
  departmentId: string;
  positionName: string;
  positionCode: string;
  positionLevel: number;
  isManagement: number;
  status: number;
  salaryMin?: number;
  salaryMax?: number;
  headcountMax?: number;
  skillRequirements?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  roleIds?: string[];
}

export interface Role {
  id: string;
  name: string;
}

export interface BatchOperation {
  type: 'delete' | 'enable' | 'disable' | 'changeDepartment' | 'export';
  label: string;
  icon: string;
  danger?: boolean;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface ExportOptions {
  format: 'xlsx' | 'csv';
  scope: 'all' | 'filtered' | 'selected';
  columns: string[];
}

// Table column definition
export interface TableColumn {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  sortable?: boolean | 'custom';
  fixed?: 'left' | 'right' | boolean;
  align?: 'left' | 'center' | 'right';
  showOverflowTooltip?: boolean;
}

// Level badge config
export const LEVEL_CONFIG: Record<number, { class: string; label: string }> = {
  1: { class: 'level-1', label: 'L1' },
  2: { class: 'level-2', label: 'L2' },
  3: { class: 'level-3', label: 'L3' },
  4: { class: 'level-4', label: 'L4' },
  5: { class: 'level-5', label: 'L5' },
};

// Default filter state
export const DEFAULT_FILTER: FilterState = {
  keyword: '',
  levels: [],
  jobType: '',
  status: '',
  salaryMin: null,
  salaryMax: null,
  hasVacancy: false,
};

// Default pagination
export const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 20,
  total: 0,
};
