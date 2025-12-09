<template>
  <div class="flow-designer-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="toolbar-title">
          <el-icon class="title-icon"><Connection /></el-icon>
          <span>流程设计器</span>
        </div>
        <el-select 
          v-model="selectedTaskId" 
          placeholder="请选择任务" 
          @change="loadTaskNodes" 
          class="task-selector"
          filterable
          clearable
        >
        <el-option
          v-for="task in taskList"
          :key="task.id || task.taskId"
          :label="task.taskTitle || task.title"
          :value="task.id || task.taskId"
        />
      </el-select>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" @click="refreshFlow" circle />
        <el-button :icon="FullScreen" @click="fitViewFlow" circle />
        <el-button 
          type="primary" 
          :icon="DocumentChecked" 
          @click="saveFlow" 
          :loading="saving"
          :disabled="!selectedTaskId"
        >
          保存流程
        </el-button>
      </div>
    </div>

    <div class="flow-container">
      <!-- 左侧：节点库 -->
      <div class="sidebar-left">
        <div class="sidebar-header">
          <el-icon class="header-icon"><Box /></el-icon>
          <span class="header-title">节点库</span>
        </div>
        <!-- 部门筛选器 -->
        <div class="filter-section">
          <el-select 
            v-model="selectedDepartmentId" 
            placeholder="按部门筛选" 
            clearable
            filterable
            class="department-filter"
            @change="filterNodesByDepartment"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </div>
        <div class="nodes-list" v-loading="loadingNodes">
          <div v-if="filteredAvailableNodes.length === 0" class="empty-nodes">
            <el-icon class="empty-icon"><DocumentRemove /></el-icon>
            <p class="empty-text">{{ selectedDepartmentId ? '该部门暂无节点' : '请先选择任务' }}</p>
            <p class="empty-hint">{{ selectedDepartmentId ? '尝试选择其他部门' : '选择任务后将显示可用的任务节点' }}</p>
          </div>
          <div
            v-for="node in filteredAvailableNodes"
        :key="node.taskNodeId"
            class="node-card"
        :class="{ 
          'draggable': true,
              'readonly': !node.canDrag
        }"
        :draggable="true"
        @dragstart="onDragStart(node)"
        @dragend="onDragEnd"
            @click="selectNodeFromLibrary(node)"
          >
            <div class="node-card-header">
              <div class="node-type-badge" :class="getNodeTypeClass(node.nodeType)">
                <el-icon><component :is="getNodeTypeIcon(node.nodeType)" /></el-icon>
        </div>
              <div class="node-info">
                <div class="node-name">{{ node.nodeName || '未命名节点' }}</div>
                <div class="node-meta">
                  <el-icon><OfficeBuilding /></el-icon>
                  <span>{{ getDepartmentName(node.departmentId) || '-' }}</span>
      </div>
    </div>
            </div>
            <div class="node-card-footer">
              <el-tag 
                v-if="isNodeArranged(node.taskNodeId)" 
                size="small" 
                type="primary" 
                class="prereq-tag"
              >
                <el-icon><DocumentChecked /></el-icon>
                已安排
              </el-tag>
              <el-tag 
                v-else-if="node.prerequisiteNodes && node.prerequisiteNodes.length > 0" 
                size="small" 
                type="warning" 
                class="prereq-tag"
              >
                <el-icon><Connection /></el-icon>
                有前置
              </el-tag>
              <el-tag 
                v-else 
                size="small" 
                type="info" 
                class="prereq-tag"
              >
                <el-icon><Clock /></el-icon>
                未安排
              </el-tag>
              <div class="node-status" v-if="node.status !== undefined">
                <el-tag :type="getStatusType(node.status)" size="small">
                  {{ getStatusText(node.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        <div class="sidebar-footer">
          <el-alert
            title="提示"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p class="tip-text">所有任务节点都会自动显示在画布上</p>
              <p class="tip-text">只有您负责的节点可以移动和编辑</p>
            </template>
          </el-alert>
        </div>
      </div>

      <!-- 中间：画布区域 -->
      <div class="canvas-area">
        <div class="canvas-wrapper" ref="canvasTopEl">
        <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypes"
        :default-edge-options="edgeOptions"
        :connection-radius="50"
        :snap-to-grid="true"
            :snap-grid="[20, 20]"
            connection-line-type="smoothstep"
            :min-zoom="0.1"
            :max-zoom="3"
        :default-viewport="{ x: 0, y: 0, zoom: 1 }"
        :nodes-draggable="true"
        :nodes-connectable="true"
        :edges-updatable="false"
        :edges-focusable="true"
            :edges-clickable="true"
        :pan-on-scroll="panEnabled"
        :pan-on-scroll-mode="'free'"
        :pan-on-scroll-speed="1"
        @connect="onConnect"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @nodes-change="onNodesChange"
        @edges-change="onEdgesChange"
        @init="onInit"
        @pane-click="onPaneClick"
        @drop="onDrop"
        @dragover="onDragOver"
        >
            <Background :gap="20" :size="1" pattern-color="#e5e7eb" />
          <Controls position="bottom-right" />
            <MiniMap zoomable pannable position="bottom-left" />
        </VueFlow>
      </div>
      </div>

      <!-- 右侧：详情面板 -->
      <div
        class="sidebar-right"
        @mouseenter="panEnabled=false"
        @mouseleave="panEnabled=true"
      >
        <div class="sidebar-header">
          <el-icon class="header-icon"><InfoFilled /></el-icon>
          <span class="header-title">节点详情</span>
        </div>
        <div class="detail-content" v-if="selected || selectedEdge">
          <!-- 节点详情 -->
          <div v-if="selected" class="detail-section">
            <div class="section-title">基本信息</div>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><Document /></el-icon>
                  <span>节点名称</span>
        </div>
                <div class="detail-value">{{ selected.data?.label || '-' }}</div>
            </div>
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><User /></el-icon>
                  <span>负责人</span>
            </div>
                <div class="detail-value">
                  <div class="employee-info" v-if="detailAssignee && detailAssignee !== '-'">
                    <el-avatar :size="24" :src="getLeaderAvatar()" class="detail-avatar">
                      {{ detailAssignee[0] }}
                    </el-avatar>
                    <span>{{ detailAssignee }}</span>
            </div>
                  <span v-else>-</span>
          </div>
        </div>
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><UserFilled /></el-icon>
                  <span>执行人</span>
                </div>
                <div class="detail-value">
                  <div class="executors-list" v-if="detailExecutors.length > 0">
                    <div v-for="executor in detailExecutors" :key="executor.id" class="executor-item" :class="{ 'executor-requested': executor.requested }">
                      <el-avatar :size="24" :src="executor.avatar" class="detail-avatar">
                        {{ executor.name ? executor.name[0] : 'E' }}
                      </el-avatar>
                      <span class="executor-name">{{ executor.name || executor.id }}</span>
                      <el-icon v-if="executor.requested" class="requested-check" :size="16">
                        <CircleCheckFilled />
                      </el-icon>
                    </div>
                  </div>
                  <div v-else class="no-data-text">
                    <el-icon><InfoFilled /></el-icon>
                    <span>暂无执行人</span>
                  </div>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><Calendar /></el-icon>
                  <span>截止时间</span>
                </div>
                <div class="detail-value">{{ detailDeadline || '-' }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><DataLine /></el-icon>
                  <span>进度</span>
                </div>
                <div class="detail-value">
                  <el-progress :percentage="detailProgress" :status="getProgressStatus(detailProgress)" />
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><CircleCheck /></el-icon>
                  <span>状态</span>
                </div>
                <div class="detail-value">
                  <el-tag :type="getStatusTypeFromText(detailStatus)" size="small">
                    {{ detailStatus }}
                  </el-tag>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><Clock /></el-icon>
                  <span>预估工时</span>
                </div>
                <div class="detail-value">{{ detailEstimated || '-' }}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">人员分配</div>
            <el-form label-width="80px" size="default" class="role-form">
              <el-form-item label="负责人">
                <el-select 
                  v-model="formLeader" 
                  placeholder="选择负责人" 
                  filterable 
                  style="width: 100%"
                  clearable
                >
                  <el-option 
                    v-for="emp in employees" 
                    :key="emp.id" 
                    :value="emp.id" 
                    :label="emp.realName || emp.name || emp.id"
                  >
                    <div class="employee-option" :class="{
                      'is-leader': employeeRoles[String(emp.id)]?.isLeader || String(formLeader) === String(emp.id),
                      'is-executor': employeeRoles[String(emp.id)]?.isExecutor
                    }">
                      <el-avatar :size="24" :src="emp.avatar" class="option-avatar">
                        {{ (emp.realName || emp.name || 'U')[0] }}
                      </el-avatar>
                      <span class="employee-name">{{ emp.realName || emp.name || emp.id }}</span>
                      <div class="role-badges">
                        <el-icon 
                          v-if="employeeRoles[String(emp.id)]?.isLeader || String(formLeader) === String(emp.id)" 
                          class="role-badge leader-badge"
                          :size="16"
                        >
                          <CircleCheckFilled />
                        </el-icon>
                        <el-icon 
                          v-if="employeeRoles[String(emp.id)]?.isExecutor" 
                          class="role-badge executor-badge"
                          :size="16"
                        >
                          <CircleCheckFilled />
                        </el-icon>
                      </div>
                    </div>
                  </el-option>
                </el-select>
          </el-form-item>
              <el-form-item label="执行人">
                <el-select 
                  v-model="formExecutors" 
                  multiple 
                  placeholder="选择执行人" 
                  filterable 
                  style="width: 100%"
                  collapse-tags
                  collapse-tags-tooltip
                >
                  <el-option 
                    v-for="emp in employees" 
                    :key="emp.id" 
                    :value="emp.id" 
                    :label="emp.realName || emp.name || emp.id"
                  >
                    <div class="employee-option" :class="{
                      'is-leader': employeeRoles[String(emp.id)]?.isLeader,
                      'is-executor': employeeRoles[String(emp.id)]?.isExecutor || formExecutors.some((eid: any) => String(eid) === String(emp.id))
                    }">
                      <el-avatar :size="24" :src="emp.avatar" class="option-avatar">
                        {{ (emp.realName || emp.name || 'U')[0] }}
                      </el-avatar>
                      <span class="employee-name">{{ emp.realName || emp.name || emp.id }}</span>
                      <div class="role-badges">
                        <el-icon 
                          v-if="employeeRoles[String(emp.id)]?.isLeader" 
                          class="role-badge leader-badge"
                          :size="16"
                        >
                          <CircleCheckFilled />
                        </el-icon>
                        <el-icon 
                          v-if="employeeRoles[String(emp.id)]?.isExecutor || formExecutors.some((eid: any) => String(eid) === String(emp.id))" 
                          class="role-badge executor-badge"
                          :size="16"
                        >
                          <CircleCheckFilled />
                        </el-icon>
                      </div>
                    </div>
                  </el-option>
                </el-select>
          </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="saveRoles" 
                  :loading="savingRoles"
                  :disabled="!selected"
                  style="width: 100%"
                >
                  <el-icon><Check /></el-icon>
                  保存分配
                </el-button>
          </el-form-item>
        </el-form>
      </div>

          <div class="detail-section" v-if="detailDescription && detailDescription !== '-'">
            <div class="section-title">节点描述</div>
            <div class="detail-description">{{ detailDescription }}</div>
          </div>

          <!-- 操作按钮 -->
          <div class="detail-section" v-if="selected">
            <div class="section-title">操作</div>
            <div class="action-buttons">
      <el-button 
        type="danger" 
                :icon="Delete" 
                @click="handleDeleteNode"
                :disabled="!canDeleteNode"
                style="width: 100%"
              >
                删除节点
      </el-button>
      </div>
          </div>

          <!-- 边操作 -->
          <div v-if="selectedEdge && !selected" class="detail-section edge-detail-section">
            <div class="section-title">
              <el-icon><Connection /></el-icon>
              <span>连接信息</span>
            </div>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><Document /></el-icon>
                  <span>连接ID</span>
                </div>
                <div class="detail-value">{{ selectedEdge.id || '-' }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><ArrowRight /></el-icon>
                  <span>从节点</span>
                </div>
                <div class="detail-value">{{ selectedEdge.source || '-' }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">
                  <el-icon><ArrowRight /></el-icon>
                  <span>到节点</span>
                </div>
                <div class="detail-value">{{ selectedEdge.target || '-' }}</div>
              </div>
            </div>
            <div class="section-title" style="margin-top: 24px;">
              <el-icon><Setting /></el-icon>
              <span>操作</span>
            </div>
            <div class="action-buttons">
      <el-button 
                type="danger" 
                :icon="Delete" 
                @click="handleDeleteEdge"
                style="width: 100%"
                size="default"
              >
                删除连接
      </el-button>
            </div>
          </div>
        </div>
        <div v-if="!selected && !selectedEdge" class="detail-empty">
          <el-icon class="empty-icon"><InfoFilled /></el-icon>
          <p class="empty-text">选择一个节点查看详情</p>
          <p class="empty-hint">点击画布上的节点或左侧节点库中的节点</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, defineComponent, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { 
  Connection, Refresh, FullScreen, DocumentChecked, Box, DocumentRemove,
  InfoFilled, Document, User, UserFilled, Calendar, DataLine, CircleCheck, CircleCheckFilled, Clock, Check,
  OfficeBuilding, Setting, List, Promotion, Timer, Delete, ArrowRight
} from '@element-plus/icons-vue'
import { VueFlow, Handle, useVueFlow, type Node, type Edge, MarkerType } from '@vue-flow/core'
import { Background, Controls, MiniMap } from '@vue-flow/additional-components'
import '@vue-flow/core/dist/style.css'
import { useFlowStore } from '@/stores/flowStore'
import { listTasks, listTaskNodesByTask, getMyEmployee, listEmployees, updatePrerequisiteNodes, updateTaskNode, listDepartments } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { markRaw } from 'vue'

const store = useFlowStore()

// 任务和节点数据
const taskList = ref<any[]>([])
const selectedTaskId = ref<string>('')
const availableNodes = ref<any[]>([])
const currentEmployeeId = ref<string>('')
const saving = ref<boolean>(false)
const savingRoles = ref<boolean>(false)
const loadingNodes = ref<boolean>(false)

// 部门筛选
const departmentList = ref<any[]>([])
const departmentMap = ref<Record<string, string>>({})
const selectedDepartmentId = ref<string>('')

// 画布节点和边
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

// 控制画布是否随滚轮平移
const panEnabled = ref<boolean>(true)

// 选中的节点 - 从本地 nodes 中查找，因为节点数据在本地
const selected = computed(() => {
  const selectedId = store.selectedNodeId
  if (!selectedId) return null
  return nodes.value.find(n => n.id === selectedId) || null
})

// 详情数据
const detailTitle = computed(() => selected.value?.data?.label || '未选择节点')
const detailId = computed(() => selected.value?.id || '-')
const detailAssignee = computed(() => {
  if (!selected.value?.data) return '-'
  const leaderId = selected.value.data.leaderId
  const leaderName = selected.value.data.leaderName
  if (leaderName) return leaderName
  if (leaderId) {
    const leader = employees.value.find(e => String(e.id) === String(leaderId))
    return leader?.realName || leader?.name || leaderId
  }
  return '-'
})
// 已请求的执行人ID集合（用于显示打勾标记）
const requestedExecutorIds = ref<Set<string>>(new Set())

const detailExecutors = computed(() => {
  if (!selected.value?.data) return []
  // 优先使用executors数组（包含完整信息），如果没有则从executorIds构建
  const executors = selected.value.data.executors || []
  if (executors.length > 0) {
    return executors.map((e: any) => ({
      id: e.id,
      name: e.name || e.realName || e.id,
      avatar: e.avatar || '',
      requested: requestedExecutorIds.value.has(String(e.id))
    }))
  }
  // 如果没有executors，从executorIds构建
  const executorIds = selected.value.data.executorIds || []
  return executorIds.map((eid: any) => {
    const emp = employees.value.find(e => String(e.id) === String(eid))
    if (!emp) return null
    return {
      id: emp.id,
      name: emp.realName || emp.name || emp.id,
      avatar: emp.avatar || '',
      requested: requestedExecutorIds.value.has(String(emp.id))
    }
  }).filter(Boolean)
})
const detailDeadline = computed(() => selected.value?.data?.deadline || selected.value?.data?.nodeDeadline || '-')
const detailProgress = computed(() => selected.value?.data?.progress || 0)
const detailStatus = computed(() => {
  const status = selected.value?.data?.status
  if (status === 2) return '已完成'
  if (status === 1) return '进行中'
  if (status === 0) return '待处理'
  return '未知'
})
const detailEstimated = computed(() => selected.value?.data?.estimatedHours ? `${selected.value.data.estimatedHours} 小时` : '-')
const detailDescription = computed(() => selected.value?.data?.nodeDetail || '-')

// 人员分配表单
const formLeader = ref<string>('')
const formExecutors = ref<string[]>([])
const employees = ref<any[]>([])

// 计算每个员工在当前选中节点中的角色（包括表单中的临时选择）
const employeeRoles = computed(() => {
  const roles: Record<string, { isLeader: boolean; isExecutor: boolean }> = {}
  
  // 获取当前节点数据中的角色
  let leaderId: string | null = null
  let executorIds: string[] = []
  
  if (selected.value?.data) {
    leaderId = selected.value.data.leaderId || null
    executorIds = Array.isArray(selected.value.data.executorIds) 
      ? selected.value.data.executorIds.map((eid: any) => String(eid))
      : []
  }
  
  // 如果表单中有值，优先使用表单值（表示正在编辑）
  if (formLeader.value) {
    leaderId = String(formLeader.value)
  }
  if (formExecutors.value.length > 0) {
    executorIds = formExecutors.value.map((eid: any) => String(eid))
  }
  
  employees.value.forEach(emp => {
    const empId = String(emp.id)
    roles[empId] = {
      isLeader: leaderId ? String(leaderId) === empId : false,
      isExecutor: executorIds.some(eid => String(eid) === empId)
    }
  })
  
  return roles
})

// 画布元素引用
const canvasTopEl = ref<HTMLElement | null>(null)

// 部门颜色映射
const deptColorMap = ref<Record<string, { color: string; bgFrom: string; bgTo: string }>>({})

// 筛选后的节点列表
// 判断节点是否已安排（在画布上显示）
function isNodeArranged(nodeId: string): boolean {
  // 检查节点是否在画布上（nodes.value中）
  return nodes.value.some(n => n.id === nodeId && n.id !== 'start' && n.id !== 'end')
}

const filteredAvailableNodes = computed(() => {
  // 节点库显示所有节点（包括未安排的）
  let nodes = availableNodes.value
  if (selectedDepartmentId.value) {
    nodes = nodes.filter(node => 
      String(node.departmentId) === String(selectedDepartmentId.value)
    )
  }
  return nodes
})

// 获取部门名称
function getDepartmentName(departmentId: string | undefined): string {
  if (!departmentId) return '-'
  return departmentMap.value[String(departmentId)] || departmentId
}

// 筛选节点
function filterNodesByDepartment() {
  // 筛选逻辑已在 computed 中实现
}

function buildPalette(index: number): { color: string; bgFrom: string; bgTo: string } {
  const palette = [
    { color: '#667eea', bgFrom: '#f0f4ff', bgTo: '#e0e9ff' },
    { color: '#4ade80', bgFrom: '#f0fdf4', bgTo: '#dcfce7' },
    { color: '#f59e0b', bgFrom: '#fffbeb', bgTo: '#fef3c7' },
    { color: '#f5576c', bgFrom: '#fff1f2', bgTo: '#ffe4e6' },
    { color: '#a78bfa', bgFrom: '#f5f3ff', bgTo: '#ede9fe' },
    { color: '#f472b6', bgFrom: '#fdf2f8', bgTo: '#fce7f3' },
    { color: '#38bdf8', bgFrom: '#f0f9ff', bgTo: '#e0f2fe' },
    { color: '#84cc16', bgFrom: '#f7fee7', bgTo: '#ecfccb' },
  ]
  return palette[index % palette.length]
}

async function loadDepartments(companyId: string) {
  try {
    const resp = await listDepartments({ page: 1, pageSize: 200, companyId })
    const data = resp?.data?.data || resp?.data || {}
    const list = data.list || data.rows || []
    const map: Record<string, { color: string; bgFrom: string; bgTo: string }> = {}
    const deptMap: Record<string, string> = {}
    
    list.forEach((d: any, idx: number) => {
      const id = d.id || d.departmentId || d.DepartmentId
      const name = d.departmentName || d.name || d.DepartmentName || d.Name || id
      if (!id) return
      map[id] = buildPalette(idx)
      deptMap[String(id)] = name
    })
    
    if (Object.keys(map).length === 0) {
      map['default'] = buildPalette(0)
    }
    
    deptColorMap.value = map
    departmentMap.value = deptMap
    departmentList.value = list.map((d: any) => ({
      id: d.id || d.departmentId || d.DepartmentId,
      name: d.departmentName || d.name || d.DepartmentName || d.Name || d.id || d.departmentId || d.DepartmentId
    })).filter((d: any) => d.id)
  } catch (e) {
    console.warn('加载部门失败', e)
    deptColorMap.value = { default: buildPalette(0) }
    departmentMap.value = {}
    departmentList.value = []
  }
}

const edgeOptions = {
  type: 'smoothstep',
  markerEnd: MarkerType.ArrowClosed,
  style: { strokeWidth: 3, stroke: '#667eea' },
  selectable: true,
  animated: true,
  deletable: false, // 我们通过右侧面板删除，不使用默认删除功能
} as any

const vueFlowInstance = useVueFlow()
const { screenToFlowCoordinate, getNodes, getEdges, fitView, removeEdges, removeNodes, setViewport, viewport } = vueFlowInstance

// 节点类型图标
function getNodeTypeIcon(type: number) {
  if (type === 1) return 'List'
  if (type === 2) return 'Promotion'
  if (type === 3) return 'Timer'
  return 'List'
}

function getNodeTypeClass(type: number) {
  if (type === 1) return 'type-task'
  if (type === 2) return 'type-condition'
  if (type === 3) return 'type-approval'
  return 'type-task'
}

function getStatusType(status: number): string {
  if (status === 2) return 'success'
  if (status === 1) return 'warning'
  if (status === 0) return 'info'
  return ''
}

function getStatusText(status: number): string {
  if (status === 2) return '已完成'
  if (status === 1) return '进行中'
  if (status === 0) return '待处理'
  return '未知'
}

function getStatusTypeFromText(text: string): string {
  if (text === '已完成') return 'success'
  if (text === '进行中') return 'warning'
  if (text === '待处理') return 'info'
  return ''
}

function getProgressStatus(progress: number): string {
  if (progress === 100) return 'success'
  if (progress >= 50) return ''
  return 'exception'
}

// 容器尺寸监听
let resizeObserver: ResizeObserver | null = null

// 初始化
onMounted(async () => {
  try {
    const me = await getMyEmployee()
    const emp = me?.data?.data || {}
    currentEmployeeId.value = emp.employeeId || emp.EmployeeId || emp.id || ''
    const companyId = emp.companyId || emp.CompanyId || ''
    if (companyId) {
      await loadDepartments(companyId)
      await loadEmployees(companyId)
    }
    await loadTasks()
    
    // 从URL参数获取taskId
    const urlParams = new URLSearchParams(window.location.search)
    const taskId = urlParams.get('taskId')
    if (taskId) {
      selectedTaskId.value = taskId
      await loadTaskNodes()
    }
    
    // 等待DOM更新后设置容器尺寸监听
    await nextTick()
    if (canvasTopEl.value) {
      resizeObserver = new ResizeObserver(() => {
        // Vue Flow 会自动处理容器尺寸变化，不需要手动调用 updateDimensions
        // 如果需要强制刷新视图，可以使用 fitView
        nextTick(() => {
          // Vue Flow 会自动响应容器尺寸变化，无需手动处理
        })
      })
      resizeObserver.observe(canvasTopEl.value)
    }
  } catch (error: any) {
    console.error('初始化失败:', error)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

async function loadTasks() {
  try {
    const resp = await listTasks({ page: 1, pageSize: 100 })
    const list = resp.data?.data?.list || resp.data?.data || []
    taskList.value = (Array.isArray(list) ? list : []).map((t: any) => ({
      id: t.taskId || t.id || t.Id,
      taskTitle: t.taskTitle || t.title || t.TaskTitle,
    }))
  } catch (error: any) {
    console.error('加载任务列表失败:', error)
  }
}

async function loadEmployees(companyId: string) {
  try {
    // 分页加载所有员工，每页最多100条
    let allEmployees: any[] = []
    let page = 1
    const pageSize = 100
    
    while (true) {
      const resp = await listEmployees({ page, pageSize, companyId })
      const data = resp?.data?.data || resp?.data || {}
      const list = data.list || data.rows || []
      
      if (list.length === 0) break
      
      allEmployees = allEmployees.concat(list.map((e: any) => ({
        id: e.id || e.employeeId || e.EmployeeId,
        realName: e.realName || e.name || e.RealName,
        name: e.realName || e.name || e.RealName,
        avatar: e.avatar || '',
      })))
      
      // 如果返回的数据少于pageSize，说明已经是最后一页
      if (list.length < pageSize) break
      page++
    }
    
    employees.value = allEmployees
  } catch (error: any) {
    console.error('加载员工列表失败:', error)
  }
}

async function loadTaskNodes() {
  if (!selectedTaskId.value) {
    availableNodes.value = []
    nodes.value = []
    edges.value = []
    return
  }

  loadingNodes.value = true
  try {
    const resp = await listTaskNodesByTask({ taskId: selectedTaskId.value })
    if (resp.data.code !== 200) {
      ElMessage.error(resp.data.msg || '加载节点失败')
      return
    }
    
    const list = resp.data?.data?.list || resp.data?.data || []
    availableNodes.value = (Array.isArray(list) ? list : []).map((n: any) => {
      const nodeId = n.id || n.taskNodeId || n.TaskNodeId
      const leaderId = n.leaderId || n.LeaderId || ''
      const isLeader = String(leaderId) === String(currentEmployeeId.value)
      
      // 打印原始节点数据，用于调试
      console.log('原始节点数据:', {
        nodeId,
        nodeName: n.nodeName || n.NodeName,
        allKeys: Object.keys(n),
        prerequisiteNodes: n.prerequisiteNodes,
        PrerequisiteNodes: n.PrerequisiteNodes,
        prerequisiteNodeIds: n.prerequisiteNodeIds,
        PrerequisiteNodeIds: n.PrerequisiteNodeIds,
        prerequisiteNode: n.prerequisiteNode,
        PrerequisiteNode: n.PrerequisiteNode,
      })
      
      // 解析前置节点（后端字段：ex_node_ids，API返回可能是 prerequisiteNodes 或 exNodeIds）
      // 后端存储格式：逗号分隔的字符串，例如 "start,node_1,node_2"
      const prereqNodes = n.prerequisiteNodes || 
                          n.PrerequisiteNodes || 
                          n.exNodeIds ||
                          n.ExNodeIds ||
                          n.ex_node_ids ||
                          ''
      
      let prereqList: string[] = []
      try {
        if (typeof prereqNodes === 'string') {
          // 后端格式：逗号分隔的字符串，例如 "start,node_1,node_2"
          const trimmed = prereqNodes.trim()
          if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
            prereqList = []
          } else {
            // 按逗号分割，去除空白和无效值
            prereqList = trimmed.split(',')
              .map(id => id.trim())
              .filter(id => id && id !== 'null' && id !== 'undefined')
          }
        } else if (Array.isArray(prereqNodes)) {
          // 如果已经是数组，直接使用
          prereqList = prereqNodes
            .map((id: any) => String(id).trim())
            .filter((id: string) => id && id !== 'null' && id !== 'undefined')
        }
        
        console.log(`节点 ${nodeId} 解析后的前置节点:`, prereqList)
      } catch (e) {
        console.warn('解析前置节点失败:', prereqNodes, e)
        prereqList = []
      }
      
      const deptId = n.departmentId || n.DepartmentId || ''
      const deptName = departmentMap.value[String(deptId)] || n.departmentName || n.DepartmentName || ''
      
        return {
        taskNodeId: nodeId,
        nodeName: n.nodeName || n.NodeName || '未命名',
        nodeType: n.nodeType || n.NodeType || 1,
        departmentId: deptId,
        departmentName: deptName,
        leaderId,
        executorIds: (() => {
          // 处理执行人数据：可能是数组、字符串或不存在
          const execIds = n.executorIds || n.ExecutorIds || n.executorId || n.ExecutorId || []
          if (Array.isArray(execIds)) {
            return execIds.filter(id => id && String(id).trim())
          }
          if (typeof execIds === 'string') {
            // 如果是字符串，可能是逗号分隔的ID列表
            if (execIds.trim() === '') return []
            return execIds.split(',').map(id => id.trim()).filter(id => id)
          }
          return []
        })(),
        status: n.status || n.Status || 0,
        progress: n.progress || n.Progress || 0,
        nodeDeadline: n.nodeDeadline || n.NodeDeadline || '',
        estimatedHours: n.estimatedHours || n.EstimatedHours || 0,
        nodeDetail: n.nodeDetail || n.NodeDetail || '',
        canDrag: isLeader,
        hasNoPrereq: prereqList.length === 0,
        prerequisiteNodes: prereqList,
      }
    })
    
    // 构建画布节点和边
    buildFlowGraph()
  } catch (error: any) {
    console.error('加载任务节点失败:', error)
    ElMessage.error('加载任务节点失败')
  } finally {
    loadingNodes.value = false
  }
}

function buildFlowGraph() {
  console.log('开始构建流程图，可用节点数量:', availableNodes.value.length)
  const nodeMap = new Map<string, any>()
  const nodeIdMap = new Map<string, string>() // 用于ID映射（处理不同格式的ID）
  const newNodes: Node[] = []
  const newEdges: Edge[] = []
  
  // 筛选出已安排的节点（有前置节点关系的节点）
  // 前置节点为空或只包含无效值的节点，视为未安排，不在画布上显示
  const arrangedNodes = availableNodes.value.filter((node) => {
    const prereqList = node.prerequisiteNodes || []
    // 如果前置节点列表为空，或者所有前置节点都是无效值，则视为未安排
    if (prereqList.length === 0) {
      return false // 未安排，不在画布显示
    }
    // 检查是否有有效的前置节点（排除空字符串、null、undefined等）
    const validPrereqs = prereqList.filter((id: any) => {
      const idStr = String(id)
      return idStr && idStr !== 'null' && idStr !== 'undefined' && idStr.trim() !== ''
    })
    // 如果有有效的前置节点（包括 "start"），则视为已安排
    return validPrereqs.length > 0
  })
  
  console.log('已安排的节点数量:', arrangedNodes.length, '未安排的节点数量:', availableNodes.value.length - arrangedNodes.length)
  
  // 构建节点映射（只映射已安排的节点）
  arrangedNodes.forEach((node) => {
    const nodeId = String(node.taskNodeId)
    nodeMap.set(nodeId, node)
    // 同时支持多种ID格式的映射
    nodeIdMap.set(nodeId, nodeId)
    nodeIdMap.set(String(node.id || nodeId), nodeId) // 如果节点有id字段
    console.log(`已安排节点映射: taskNodeId=${nodeId}, prerequisiteNodes=`, node.prerequisiteNodes)
  })
  
  // 计算节点层级（基于前置节点）
  const nodeLevels = new Map<string, number>()
  const visited = new Set<string>()
  
  function calculateLevel(nodeId: string): number {
    if (visited.has(nodeId)) {
      return nodeLevels.get(nodeId) || 0
    }
    visited.add(nodeId)
    
    const node = nodeMap.get(nodeId)
    if (!node) return 0
    
    const prereqList = node.prerequisiteNodes || []
    // 过滤出有效的前置节点（排除 "start" 和无效值）
    const validPrereqs = prereqList.filter((id: any) => {
      const idStr = String(id)
      return idStr && 
             idStr !== 'null' && 
             idStr !== 'undefined' && 
             idStr.trim() !== '' && 
             idStr !== 'start' &&
             nodeMap.has(idStr)
    })
    
    // 如果只有 "start" 作为前置节点，层级为 0
    const hasStartPrereq = prereqList.some((id: any) => String(id) === 'start')
    if (validPrereqs.length === 0) {
      nodeLevels.set(nodeId, hasStartPrereq ? 0 : 0)
      return 0
    }
    
    // 找到所有有效前置节点的最大层级
    let maxLevel = -1
    validPrereqs.forEach((prereqId: any) => {
      const prereqIdStr = String(prereqId)
      if (nodeMap.has(prereqIdStr)) {
        const level = calculateLevel(prereqIdStr)
        maxLevel = Math.max(maxLevel, level)
      }
    })
    
    const level = maxLevel + 1
    nodeLevels.set(nodeId, level)
    return level
  }
  
  // 计算所有已安排节点的层级
  arrangedNodes.forEach((node) => {
    const nodeId = String(node.taskNodeId)
    calculateLevel(nodeId)
  })
  
  // 按层级分组节点（只包含已安排的节点）
  const nodesByLevel = new Map<number, string[]>()
  nodeLevels.forEach((level, nodeId) => {
    if (nodeMap.has(nodeId)) { // 确保节点在已安排列表中
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, [])
      }
      nodesByLevel.get(level)!.push(nodeId)
    }
  })
  
  // 添加开始节点
  newNodes.push({
    id: 'start',
    type: 'start',
    position: { x: 100, y: 200 },
    data: { label: '开始' },
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '16px 24px',
      fontSize: '16px',
      fontWeight: '600',
    },
  })
  
  // 布局参数
  const levelSpacing = 350 // 层级之间的水平间距
  const nodeSpacing = 250 // 同一层级节点之间的垂直间距
  const startX = 300 // 第一层节点的X坐标
  const baseY = 100 // 基础Y坐标
  
  // 按层级添加任务节点
  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b)
  sortedLevels.forEach((level) => {
    const nodeIds = nodesByLevel.get(level) || []
    const levelY = baseY + (level * levelSpacing)
    
    nodeIds.forEach((nodeId, index) => {
          const node = nodeMap.get(nodeId)
          if (!node) return
      
      const deptId = String(node.departmentId || 'default')
      const deptColor = deptColorMap.value[deptId] || deptColorMap.value['default'] || buildPalette(0)
      const status = node.status || 0
      const progress = node.progress || 0
      
      // 同一层级的节点垂直排列
      const nodeCount = nodeIds.length
      const totalHeight = (nodeCount - 1) * nodeSpacing
      const startY = levelY - totalHeight / 2
      const y = startY + index * nodeSpacing
      
      // 获取员工信息
      const leader = employees.value.find(e => String(e.id) === String(node.leaderId))
      const executors = (node.executorIds || []).map((eid: any) => 
        employees.value.find(e => String(e.id) === String(eid))
      ).filter(Boolean)
      
      newNodes.push({
              id: nodeId,
              type: 'task',
        position: { x: startX + level * levelSpacing, y },
              data: {
          label: node.nodeName,
          nodeType: node.nodeType,
          status,
          progress,
          deadline: node.nodeDeadline,
          estimatedHours: node.estimatedHours,
          nodeDetail: node.nodeDetail,
          leaderId: node.leaderId,
          executorIds: node.executorIds,
          assignee: node.leaderId,
          leaderName: leader?.realName || leader?.name || node.leaderId || '-',
          leaderAvatar: leader?.avatar || '',
          executorNames: executors.map((e: any) => e.realName || e.name).join(', ') || '-',
          executors: executors.map((e: any) => ({
            id: e.id,
            name: e.realName || e.name,
            avatar: e.avatar || ''
          })),
          canDrag: node.canDrag,
          styleVars: {
            borderColor: deptColor.color,
            bgFrom: deptColor.bgFrom,
            bgTo: deptColor.bgTo,
          },
        },
        style: {
          background: `linear-gradient(135deg, ${deptColor.bgFrom} 0%, ${deptColor.bgTo} 100%)`,
          border: `2.5px solid ${deptColor.color}`,
          borderRadius: '12px',
          padding: '16px',
          minWidth: '200px',
          color: '#1f2937',
        },
      })
    })
  })
  
  // 添加结束节点
    const maxLevel = sortedLevels.length > 0 ? Math.max(...sortedLevels) : 0
  const endX = startX + (maxLevel + 1) * levelSpacing
  newNodes.push({
    id: 'end',
    type: 'end',
    position: { x: endX, y: 200 },
    data: { label: '结束' },
    style: {
      background: 'linear-gradient(135deg, #f5576c 0%, #ef4444 100%)',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '16px 24px',
      fontSize: '16px',
      fontWeight: '600',
    },
  })
  
  // 构建边（前置依赖关系）- 只处理已安排的节点
  arrangedNodes.forEach((node) => {
    const nodeId = String(node.taskNodeId)
    const prereqList = node.prerequisiteNodes || []
    
    console.log(`处理已安排节点 ${nodeId}，前置节点:`, prereqList)
    
    // 处理每个前置节点（后端存储的是直接前置节点，逗号分隔格式）
    // 逻辑：如果前置节点列表中有其他节点，只连接到那些节点，不连接到start
    // 只有当前置节点列表只有"start"时，才连接到start
    const hasOtherNodes = prereqList.some((id: any) => {
      const idStr = String(id).trim()
      return idStr && idStr !== 'null' && idStr !== 'undefined' && idStr !== 'start' && nodeMap.has(idStr)
    })
    
    prereqList.forEach((prereqId: any) => {
      const prereqIdStr = String(prereqId).trim()
      
      // 跳过无效值
      if (!prereqIdStr || prereqIdStr === 'null' || prereqIdStr === 'undefined') {
        return
      }
      
      // 如果前置节点是 "start"
      if (prereqIdStr === 'start') {
        // 只有当没有其他前置节点时，才连接到start
        // 如果有其他前置节点，说明该节点依赖于其他节点，不应该直接连接到start
        if (!hasOtherNodes) {
          const edgeId = `start->${nodeId}`
          if (!newEdges.find(e => e.id === edgeId)) {
            newEdges.push({
              id: edgeId,
              source: 'start',
              target: nodeId,
              ...edgeOptions,
            })
            console.log(`添加边: start -> ${nodeId} (无其他前置节点)`)
          }
        } else {
          console.log(`节点 ${nodeId} 有其他前置节点，跳过start连接`)
        }
        return
      }
      
      // 尝试匹配已安排的节点
      let matchedNodeId = prereqIdStr
      if (nodeMap.has(prereqIdStr)) {
        matchedNodeId = prereqIdStr
      } else {
        // 尝试通过ID映射查找
        const mappedId = nodeIdMap.get(prereqIdStr)
        if (mappedId && nodeMap.has(mappedId)) {
          matchedNodeId = mappedId
        } else {
          // 尝试在已安排节点中查找匹配的ID
          const foundNode = arrangedNodes.find(n => 
            String(n.taskNodeId) === prereqIdStr || 
            String(n.id || '') === prereqIdStr
          )
          if (foundNode) {
            matchedNodeId = String(foundNode.taskNodeId)
          }
        }
      }
      
      if (nodeMap.has(matchedNodeId)) {
        const edgeId = `${matchedNodeId}->${nodeId}`
        // 避免重复添加边
        if (!newEdges.find(e => e.id === edgeId)) {
          newEdges.push({
            id: edgeId,
            source: matchedNodeId,
            target: nodeId,
            ...edgeOptions,
          })
          console.log(`添加边: ${matchedNodeId} -> ${nodeId}`)
        }
      } else {
        console.warn(`前置节点 ${prereqIdStr} 未找到对应的已安排节点，节点ID: ${nodeId}`)
      }
    })
  })

  // 检查是否有已安排的节点没有连接到结束节点（没有后续节点）
  const nodesWithOutgoing = new Set(newEdges.map(e => e.source))
  arrangedNodes.forEach((node) => {
    const nodeId = String(node.taskNodeId)
    // 如果节点没有作为源节点出现在任何边中，说明它是终端节点，连接到结束节点
    if (!nodesWithOutgoing.has(nodeId)) {
      newEdges.push({
        id: `${nodeId}->end`,
        source: nodeId,
        target: 'end',
        ...edgeOptions,
      })
      console.log(`终端节点 ${nodeId} 连接到结束节点`)
    }
  })
  
  console.log('构建完成，节点数量:', newNodes.length, '边数量:', newEdges.length)
  console.log('所有边:', newEdges.map(e => `${e.source}->${e.target}`))
  
  nodes.value = newNodes
  edges.value = newEdges
  
  // 同步节点到 store（用于选中状态管理）
  store.$patch({
    nodes: newNodes.map(n => ({
      id: n.id,
      type: n.type || 'task',
      position: n.position,
      data: n.data || {}
    }))
  })
  
  // 自动适应视图
  setTimeout(() => {
    try {
      fitView({ padding: 0.2, duration: 400 })
    } catch {}
  }, 100)
}

// 拖拽的节点数据
const draggedNode = ref<any>(null)

// 拖拽开始
function onDragStart(node: any) {
  draggedNode.value = node
  console.log('开始拖拽节点:', node.nodeName)
}

// 拖拽结束（清理状态）
function onDragEnd() {
  // 如果拖拽没有成功放置，清除拖拽数据
  // 注意：如果成功放置，onDrop 会清除 draggedNode
  // 这里延迟清除，确保 onDrop 先执行
  setTimeout(() => {
    if (draggedNode.value) {
      draggedNode.value = null
    }
  }, 100)
}

function selectNodeFromLibrary(node: any) {
  const nodeId = String(node.taskNodeId)
  const foundNode = nodes.value.find(n => n.id === nodeId)
  if (foundNode) {
    store.setSelection(nodeId)
  }
}

// 拖拽悬停（允许放置）
function onDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

// 拖拽放置（在画布上添加节点）
function onDrop(event: DragEvent) {
  event.preventDefault()
  
  if (!draggedNode.value) {
    return
  }
  
  const node = draggedNode.value
  const nodeId = String(node.taskNodeId)
  
  // 检查节点是否已经在画布上
  const existingNode = nodes.value.find(n => n.id === nodeId)
  if (existingNode) {
    ElMessage.warning('该节点已在画布上')
    draggedNode.value = null
    return
  }
  
  // 获取画布坐标
  const { screenToFlowCoordinate } = vueFlowInstance
  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY,
  })
  
  // 获取部门颜色
  const deptId = String(node.departmentId || '')
  const deptColor = deptColorMap.value[deptId] || buildPalette(0)
  
  // 获取员工信息
  const leader = employees.value.find(e => String(e.id) === String(node.leaderId))
  const executors = (node.executorIds || []).map((eid: any) => 
    employees.value.find(e => String(e.id) === String(eid))
  ).filter(Boolean)
  
  const status = node.status || 0
  const progress = node.progress || 0
  
  // 创建新节点
  const newNode: Node = {
    id: nodeId,
    type: 'task',
    position,
    data: {
      label: node.nodeName || '未命名',
      taskNodeId: node.taskNodeId,
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      status,
      progress,
      deadline: node.nodeDeadline,
      estimatedHours: node.estimatedHours,
      nodeDetail: node.nodeDetail,
      leaderId: node.leaderId,
      executorIds: node.executorIds,
      assignee: node.leaderId,
      leaderName: leader?.realName || leader?.name || node.leaderId || '-',
      leaderAvatar: leader?.avatar || '',
      executorNames: executors.map((e: any) => e.realName || e.name).join(', ') || '-',
      executors: executors.map((e: any) => ({
        id: e.id,
        name: e.realName || e.name,
        avatar: e.avatar || ''
      })),
      canDrag: node.canDrag,
      prerequisiteNodes: ['start'], // 默认前置节点为 start
      styleVars: {
        borderColor: deptColor.color,
        bgFrom: deptColor.bgFrom,
        bgTo: deptColor.bgTo,
      },
    },
    style: {
      background: `linear-gradient(135deg, ${deptColor.bgFrom} 0%, ${deptColor.bgTo} 100%)`,
      border: `2.5px solid ${deptColor.color}`,
      borderRadius: '12px',
      padding: '16px',
      minWidth: '200px',
      color: '#1f2937',
    },
  }
  
  // 添加到画布
  nodes.value.push(newNode)
  
  // 添加连接到开始节点的边
  const startEdge: Edge = {
    id: `start->${nodeId}`,
    source: 'start',
    target: nodeId,
    ...edgeOptions,
  }
  edges.value.push(startEdge)
  
  // 更新节点库中的节点数据，标记为已安排
  const nodeInList = availableNodes.value.find(n => String(n.taskNodeId) === nodeId)
  if (nodeInList) {
    nodeInList.prerequisiteNodes = ['start']
  }
  
  // 清除拖拽数据
  draggedNode.value = null
  
  ElMessage.success(`节点 "${node.nodeName}" 已添加到画布`)
  
  // 选中新添加的节点
  store.setSelection(nodeId)
}

// 连接节点
function onConnect(c: any) {
  if (!c.source || !c.target) return
  if (c.target === 'start' || c.source === 'end') {
    ElMessage.warning('连接规则错误')
    return
  }
  const existingEdge = edges.value.find(e => e.source === c.source && e.target === c.target)
  if (existingEdge) {
    ElMessage.warning('该连接已存在')
    return
  }
  const id = `${c.source}->${c.target}`
  edges.value.push({
    id,
    source: c.source!,
    target: c.target!,
    ...edgeOptions,
  } as Edge)
}

// 获取负责人头像
function getLeaderAvatar() {
  if (!selected.value?.data?.leaderId) return ''
  const leader = employees.value.find(e => String(e.id) === String(selected.value.data.leaderId))
  return leader?.avatar || ''
}

// 节点点击
function onNodeClick({ node }: any) {
  store.setSelection(node?.id || null)
  edges.value.forEach(e => { e.selected = false })
  selectedEdge.value = null
  
  // 更新表单
  if (node?.data) {
    formLeader.value = node.data.leaderId || ''
    formExecutors.value = Array.isArray(node.data.executorIds) ? node.data.executorIds : []
  }
}

// 选中的边
const selectedEdge = ref<Edge | null>(null)

// 边点击
function onEdgeClick(event: any) {
  // VueFlow 的边点击事件可能传递不同的格式
  let edge = null
  if (event && event.edge) {
    edge = event.edge
  } else if (event && event.id) {
    edge = event
  } else {
    edge = event
  }
  
  if (!edge || !edge.id) {
    console.warn('边点击事件：无效的边对象', event)
    return
  }
  
  console.log('边被点击:', edge.id, edge)
  
  // 清除节点选中状态
  store.setSelection(null)
  
  // 设置边选中状态
  edges.value.forEach(e => {
    e.selected = e.id === edge.id 
  })
  
  // 保存选中的边 - 确保保存完整的边对象
  const fullEdge = edges.value.find(e => e.id === edge.id) || edge
  selectedEdge.value = fullEdge
  
  // 强制触发响应式更新
  nextTick(() => {
    console.log('选中的边:', selectedEdge.value)
  })
}

// 删除边
function deleteEdge(edgeId: string) {
  const edgeIndex = edges.value.findIndex(e => e.id === edgeId)
  if (edgeIndex !== -1) {
    edges.value.splice(edgeIndex, 1)
    if (selectedEdge.value?.id === edgeId) {
      selectedEdge.value = null
    }
    ElMessage.success('连接已删除')
  }
}

// 处理删除边
async function handleDeleteEdge() {
  if (!selectedEdge.value) return
  
  const edge = selectedEdge.value
  
  // 检查是否可以删除（不能删除start和end之间的直接连接）
  if (edge.source === 'start' && edge.target === 'end') {
    ElMessage.warning('不能删除开始和结束节点之间的连接')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要删除这条连接路线吗？',
      '删除连接',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    deleteEdge(edge.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除连接失败:', error)
    }
  }
}

// 是否可以删除节点
const canDeleteNode = computed(() => {
  if (!selected.value) return false
  const nodeId = selected.value.id
  if (nodeId === 'start' || nodeId === 'end') return false
  // 只有负责人可以删除节点
  const node = availableNodes.value.find(n => String(n.taskNodeId) === String(nodeId))
  return node?.canDrag || false
})

// 删除节点
async function handleDeleteNode() {
  if (!selected.value) return
  
  const nodeId = selected.value.id
  if (nodeId === 'start' || nodeId === 'end') {
      ElMessage.warning('不能删除开始或结束节点')
      return
    }

  try {
    await ElMessageBox.confirm(
      '确定要删除这个节点吗？删除后无法恢复。',
      '删除节点',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false,
      }
    )
    
    // 删除节点相关的边
    const edgesToRemove = edges.value.filter(
      e => e.source === nodeId || e.target === nodeId
    )
    edgesToRemove.forEach(e => {
      const index = edges.value.findIndex(edge => edge.id === e.id)
      if (index !== -1) {
        edges.value.splice(index, 1)
      }
    })
    
    // 删除节点
    const nodeIndex = nodes.value.findIndex(n => n.id === nodeId)
    if (nodeIndex !== -1) {
      nodes.value.splice(nodeIndex, 1)
    }
    
    // 从可用节点列表中移除
    const availableIndex = availableNodes.value.findIndex(
      n => String(n.taskNodeId) === String(nodeId)
    )
    if (availableIndex !== -1) {
      availableNodes.value.splice(availableIndex, 1)
    }
    
    // 清除选中状态
  store.setSelection(null)
  
    ElMessage.success('节点已删除')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除节点失败:', error)
      ElMessage.error('删除节点失败')
    }
  }
}

// 画布点击
function onPaneClick() {
  store.setSelection(null)
  edges.value.forEach(e => { e.selected = false })
  selectedEdge.value = null
}

// 节点变化
function onNodesChange(changes: any[]) {
  // 同步节点位置变化
}

// 边变化
function onEdgesChange(changes: any[]) {
  // 同步边变化
}

// 初始化完成
function onInit() {
  setTimeout(() => {
    try {
      fitView({ padding: 0.2, duration: 400 })
    } catch {}
  }, 100)
}

// 注意：根据后端逻辑，只保存直接前置节点，不计算间接前置节点
// 后端存储格式：ex_node_ids 字段，逗号分隔的字符串，例如 "start,node_1"
// 只记录与当前节点直接连接的节点（通过边连接）

// 保存流程
async function saveFlow() {
  if (!selectedTaskId.value) {
    ElMessage.warning('请先选择任务')
    return
  }

  saving.value = true
  try {
    // 构建直接前置节点关系（只记录直接连接的节点）
    const directPrereqMap: Record<string, string[]> = {}
    
    console.log('当前所有边:', edges.value)
    
    // 遍历所有边，构建直接前置节点映射
    edges.value.forEach(edge => {
      // 忽略start和end节点之间的边
      if (edge.source === 'start' && edge.target === 'end') return
      
      const target = String(edge.target)
      const source = String(edge.source)
      
      // 如果目标是end节点，跳过
      if (target === 'end') return
      
      // 如果源是end节点，跳过
      if (source === 'end') return
      
      // 初始化直接前置节点列表
      if (!directPrereqMap[target]) directPrereqMap[target] = []
      
      // 记录直接前置节点
      // 逻辑：如果节点有其他前置节点，不记录start；只有当只有start时，才记录start
      if (source === 'start') {
        // 检查该节点是否还有其他前置节点（非start的边）
        const hasOtherPrereqs = edges.value.some(e => 
          String(e.target) === target && 
          String(e.source) !== 'start' && 
          String(e.source) !== 'end'
        )
        
        // 只有当没有其他前置节点时，才记录start
        if (!hasOtherPrereqs && !directPrereqMap[target].includes('start')) {
          directPrereqMap[target].push('start')
        }
      } else {
        // 如果是其他节点，添加节点ID（只记录直接前置节点）
        if (!directPrereqMap[target].includes(source)) {
          directPrereqMap[target].push(source)
        }
      }
    })
    
    console.log('构建的直接前置节点映射:', directPrereqMap)
    
    // 获取所有任务节点ID（排除start和end）
    const allNodeIds = nodes.value
      .filter(n => n.id !== 'start' && n.id !== 'end')
      .map(n => String(n.id))
    
    console.log('需要更新的节点ID列表:', allNodeIds)
    
    if (allNodeIds.length === 0) {
      ElMessage.warning('没有可更新的节点')
      return
    }
    
    // 更新所有已安排节点的前置节点（只更新画布上的节点）
    // 注意：只保存直接前置节点，不计算间接前置节点（与后端逻辑一致）
    const updateResults = []
    for (const nodeId of allNodeIds) {
      try {
        // 获取该节点的直接前置节点列表（只包含直接连接的节点）
        const directPrereqList = directPrereqMap[nodeId] || []
        
        // 过滤掉start：如果节点有其他前置节点，不应该包含start
        // 只有当节点只有start作为前置节点时，才保存start
        const hasOtherPrereqs = directPrereqList.some(id => id !== 'start')
        const finalPrereqList = hasOtherPrereqs 
          ? directPrereqList.filter(id => id !== 'start')  // 有其他前置节点，移除start
          : directPrereqList  // 只有start，保留start
        
        // 排序：start 在前（如果有），其他节点按ID排序
        finalPrereqList.sort((a, b) => {
          if (a === 'start') return -1
          if (b === 'start') return 1
          return a.localeCompare(b)
        })
        
        // 将前置节点ID数组转换为逗号分隔的字符串（后端存储格式）
        // 如果前置节点列表为空，说明节点没有前置节点（这种情况不应该出现在已安排节点中）
        const prereqStr = finalPrereqList.length > 0 ? finalPrereqList.join(',') : ''
        
        console.log(`更新节点 ${nodeId} 的直接前置节点为:`, prereqStr, '前置节点列表:', directPrereqList)
        
        const response = await updatePrerequisiteNodes({
          nodeId: nodeId,
          prerequisiteNodes: prereqStr,
        })
        
        if (response.data?.code === 200) {
          updateResults.push({ nodeId, success: true })
          console.log(`节点 ${nodeId} 更新成功`)
        } else {
          updateResults.push({ nodeId, success: false, error: response.data?.msg || '未知错误' })
          console.error(`节点 ${nodeId} 更新失败:`, response.data?.msg)
        }
      } catch (error: any) {
        console.error(`更新节点 ${nodeId} 的前置节点失败:`, error)
        updateResults.push({ nodeId, success: false, error: error.message || '未知错误' })
      }
    }
    
    const successCount = updateResults.filter(r => r.success).length
    const failCount = updateResults.filter(r => !r.success).length
    
    if (failCount === 0) {
      ElMessage.success(`流程保存成功，已更新 ${successCount} 个节点的前置节点`)
    } else {
      ElMessage.warning(`部分节点更新失败：成功 ${successCount} 个，失败 ${failCount} 个`)
      console.error('更新失败的节点:', updateResults.filter(r => !r.success))
    }
    
    // 重新加载节点数据以同步最新状态
    await loadTaskNodes()
  } catch (error: any) {
    console.error('保存流程失败:', error)
    ElMessage.error('保存流程失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// 保存角色分配
async function saveRoles() {
  if (!selected.value) {
    ElMessage.warning('请先选择节点')
    return
  }
  
  savingRoles.value = true
  try {
    const nodeId = selected.value.id
    // API期望的字段名是executorId（数组），不是executorIds
    await updateTaskNode({
      nodeId: nodeId,
      leaderId: formLeader.value,
      executorId: Array.isArray(formExecutors.value) ? formExecutors.value : [],
    })
    
    // 更新节点数据
    const nodeIndex = nodes.value.findIndex(n => n.id === nodeId)
    if (nodeIndex !== -1) {
      nodes.value[nodeIndex].data = {
        ...nodes.value[nodeIndex].data,
        leaderId: formLeader.value,
        executorIds: formExecutors.value,
      }
    }
    
    // 更新可用节点列表
    const nodeInList = availableNodes.value.find(n => String(n.taskNodeId) === String(nodeId))
    if (nodeInList) {
      nodeInList.leaderId = formLeader.value
      nodeInList.executorIds = formExecutors.value
    }
    
    // 更新已请求的执行人标记
    const executorIds = Array.isArray(formExecutors.value) ? formExecutors.value : []
    executorIds.forEach((eid: any) => {
      requestedExecutorIds.value.add(String(eid))
    })
    
    ElMessage.success('角色分配保存成功')
  } catch (error: any) {
    console.error('保存角色分配失败:', error)
    ElMessage.error('保存角色分配失败')
  } finally {
    savingRoles.value = false
  }
}

// 刷新流程
function refreshFlow() {
  if (selectedTaskId.value) {
    loadTaskNodes()
  } else {
    ElMessage.warning('请先选择任务')
  }
}

// 适应视图
function fitViewFlow() {
  try {
    fitView({ padding: 0.2, duration: 400 })
  } catch {}
}

// 自定义节点组件
const StartNode = defineComponent({
  props: ['data', 'selected'],
  setup: (props: any) => () => {
    return h('div', {
      class: 'custom-start-node',
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '16px 24px',
      borderRadius: '12px',
        fontWeight: '600',
        fontSize: '16px',
      textAlign: 'center',
        boxShadow: props.selected ? '0 8px 20px rgba(102, 126, 234, 0.4)' : '0 4px 12px rgba(102, 126, 234, 0.2)',
        position: 'relative',
        overflow: 'visible', // 确保连接点可以显示在节点外部
      }
    }, [
      h('div', { style: { marginBottom: '8px' } }, [
        h('el-icon', { style: { fontSize: '24px' } }, [h('Check')])
      ]),
      h('div', props.data?.label || '开始'),
      h(Handle, { 
        type: 'source', 
        position: 'right', 
        class: 'h-right'
      })
    ])
  }
})

const EndNode = defineComponent({
  props: ['data', 'selected'],
  setup: (props: any) => () => {
    return h('div', {
      class: 'custom-end-node',
      style: {
        background: 'linear-gradient(135deg, #f5576c 0%, #ef4444 100%)',
        color: '#fff',
        padding: '16px 24px',
      borderRadius: '12px',
        fontWeight: '600',
        fontSize: '16px',
      textAlign: 'center',
        boxShadow: props.selected ? '0 8px 20px rgba(245, 87, 108, 0.4)' : '0 4px 12px rgba(245, 87, 108, 0.2)',
        position: 'relative',
        overflow: 'visible', // 确保连接点可以显示在节点外部
      }
    }, [
      h('div', { style: { marginBottom: '8px' } }, [
        h('el-icon', { style: { fontSize: '24px' } }, [h('CircleCheck')])
      ]),
      h('div', props.data?.label || '结束'),
      h(Handle, { 
        type: 'target', 
        position: 'left', 
        class: 'h-left'
      })
    ])
  }
})

const TaskNode = defineComponent({
  props: ['data', 'selected'],
  setup: (props: any) => () => {
    const isLeader = props.data?.canDrag !== false
    const status = props.data?.status ?? 0
    const progress = props.data?.progress ?? 0
    const statusColor = status === 2 ? '#22c55e' : status === 1 ? '#eab308' : status === 0 ? '#3b82f6' : '#9ca3af'
    const sv = props.data?.styleVars || {}
    
    // 获取负责人和执行人信息
    const leaderName = props.data?.leaderName || '-'
    const leaderAvatar = props.data?.leaderAvatar || ''
    const executors = props.data?.executors || []
    
    return h('div', {
      class: ['custom-task-node', props.selected ? 'selected' : '', !isLeader ? 'readonly' : ''].filter(Boolean).join(' '),
      style: {
      background: `linear-gradient(135deg, ${sv.bgFrom || '#ffffff'} 0%, ${sv.bgTo || '#f9fafb'} 100%)`,
        border: `2.5px solid ${sv.borderColor || '#4ade80'}`,
      borderRadius: '12px',
        padding: '16px',
        minWidth: '200px',
        boxShadow: props.selected ? '0 8px 20px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'visible', // 确保连接点可以显示在节点外部
      }
    }, [
      // 状态指示器
      h('div', {
        style: {
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: statusColor,
          border: '2px solid #fff',
          boxShadow: `0 0 0 2px ${statusColor}40`,
        }
      }),
      // 节点名称
      h('div', {
        style: {
          fontSize: '15px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '12px',
          letterSpacing: '-0.01em',
        }
      }, props.data?.label || '任务节点'),
      // 负责人信息
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: executors.length > 0 ? '8px' : '12px',
        }
      }, [
        h('div', {
          style: {
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: leaderAvatar ? `url(${leaderAvatar}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '600',
            color: '#fff',
            flexShrink: 0,
            border: '2px solid #fff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }
        }, leaderAvatar ? '' : (leaderName !== '-' ? leaderName[0].toUpperCase() : 'L')),
        h('div', {
          style: {
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }
        }, leaderName !== '-' ? leaderName : '未分配')
      ]),
      // 执行人信息（最多显示2个）
      executors.length > 0 && h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }
      }, [
        ...executors.slice(0, 2).map((executor: any) => 
          h('div', {
            style: {
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: executor.avatar ? `url(${executor.avatar}) center/cover` : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '600',
              color: '#fff',
              flexShrink: 0,
              border: '2px solid #fff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }
          }, executor.avatar ? '' : (executor.name ? executor.name[0].toUpperCase() : 'E'))
        ),
        executors.length > 2 && h('div', {
          style: {
            fontSize: '11px',
            color: '#9ca3af',
            fontWeight: '500',
          }
        }, `+${executors.length - 2}`)
      ]),
      // 进度条
      h('div', {
        style: {
          width: '100%',
          height: '4px',
          background: '#e5e7eb',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '8px',
        }
      }, [
        h('div', {
          style: {
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}dd 100%)`,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }
        })
      ]),
      h(Handle, { 
        type: 'target', 
        position: 'left', 
        class: 'h-left'
      }),
      h(Handle, { 
        type: 'source', 
        position: 'right', 
        class: 'h-right'
      })
    ])
  }
})

const nodeTypes = {
  start: markRaw(StartNode),
  end: markRaw(EndNode),
  task: markRaw(TaskNode),
}
</script>

<style scoped>
.flow-designer-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: var(--bg-page);
  font-family: var(--font-family-primary, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.title-icon {
  font-size: 24px;
  color: var(--color-primary);
}

.task-selector {
  width: 300px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.flow-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-left,
.sidebar-right {
  width: 320px;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-right {
  border-right: none;
  border-left: 1px solid var(--border-color);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
}

.filter-section {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-hover);
}

.department-filter {
  width: 100%;
}

.header-icon {
  font-size: 20px;
  color: var(--color-primary);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.nodes-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nodes-list::-webkit-scrollbar {
  width: 6px;
}

.nodes-list::-webkit-scrollbar-track {
  background: var(--bg-hover);
  border-radius: 3px;
}

.nodes-list::-webkit-scrollbar-thumb {
  background: var(--text-muted);
  border-radius: 3px;
}

.nodes-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.empty-nodes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.empty-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.node-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.node-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.node-card.draggable {
  cursor: grab;
  border-color: var(--color-primary);
}

.node-card.draggable:active {
  cursor: grabbing;
}

.node-card.readonly {
  opacity: 0.7;
  cursor: not-allowed;
}

.node-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.node-type-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
}

.node-type-badge.type-task {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.node-type-badge.type-condition {
  background: #dcfce7;
  color: #4ade80;
}

.node-type-badge.type-approval {
  background: #ffe4e6;
  color: #f5576c;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.node-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.prereq-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.tip-text {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 4px 0;
  line-height: 1.5;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  min-width: 400px;
  min-height: 400px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.canvas-wrapper :deep(.vue-flow) {
  width: 100% !important;
  height: 100% !important;
}

.canvas-wrapper :deep(.vue-flow__viewport) {
  width: 100% !important;
  height: 100% !important;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-content::-webkit-scrollbar {
  width: 6px;
}

.detail-content::-webkit-scrollbar-track {
  background: var(--bg-hover);
  border-radius: 3px;
}

.detail-content::-webkit-scrollbar-thumb {
  background: var(--text-muted);
  border-radius: 3px;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
  letter-spacing: -0.01em;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--bg-hover);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.detail-description {
  padding: 16px;
  background: var(--bg-hover);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-main);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-avatar {
  flex-shrink: 0;
}

.executors-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.executor-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-hover);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.executor-item:hover {
  background: var(--bg-card);
  border-color: var(--border-color);
}

.executor-item.executor-requested {
  background: #ecfdf5;
  border-color: #86efac;
}

.executor-name {
  flex: 1;
}

.requested-check {
  color: #22c55e;
  flex-shrink: 0;
}

.no-data-text {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: var(--text-muted);
  font-size: 13px;
  font-style: italic;
}

.role-form {
  margin-top: 12px;
}

.employee-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 4px 0;
}

.employee-name {
  flex: 1;
}

.role-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.role-badge {
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.leader-badge {
  color: #22c55e !important;
  background: rgba(34, 197, 94, 0.1);
  padding: 2px;
}

.executor-badge {
  color: #3b82f6 !important;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px;
}

.employee-option.is-leader {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.05) 0%, transparent 100%);
  border-left: 3px solid #22c55e;
  padding-left: 8px;
}

.employee-option.is-executor {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%);
  border-left: 3px solid #3b82f6;
  padding-left: 8px;
}

.employee-option.is-leader.is-executor {
  background: linear-gradient(90deg, 
    rgba(34, 197, 94, 0.05) 0%, 
    rgba(59, 130, 246, 0.05) 50%, 
    transparent 100%);
  border-left: 3px solid;
  border-image: linear-gradient(180deg, #22c55e 0%, #3b82f6 100%) 1;
  padding-left: 8px;
}

.option-avatar {
  flex-shrink: 0;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.detail-empty .empty-icon {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.detail-empty .empty-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.detail-empty .empty-hint {
  font-size: 13px;
  color: var(--text-muted);
}

/* ============================================
   Vue Flow 连接点优化设计
   ============================================ */

/* 基础连接点样式 */
:deep(.vue-flow__handle) {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
  min-height: 24px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%) !important;
  border: 4px solid #ffffff !important;
  opacity: 0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5), 
              0 0 0 4px rgba(102, 126, 234, 0.1) !important;
  cursor: grab !important;
  z-index: 100 !important;
  position: absolute !important;
  margin: 0 !important;
  top: auto !important;
  bottom: auto !important;
}

:deep(.vue-flow__handle::after) {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: transparent;
  cursor: grab;
  z-index: -1;
}

:deep(.vue-flow__node:hover .vue-flow__handle) {
  opacity: 1 !important;
  transform: scale(1);
}

:deep(.vue-flow__node.selected .vue-flow__handle) {
  opacity: 1 !important;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6), 
              0 0 0 6px rgba(102, 126, 234, 0.2) !important;
  animation: handlePulse 2s ease-in-out infinite;
}

:deep(.vue-flow__handle:hover) {
  width: 28px !important;
  height: 28px !important;
  background: linear-gradient(135deg, #5568d3 0%, #6a3fa3 100%) !important;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.7), 
              0 0 0 8px rgba(102, 126, 234, 0.15) !important;
  transform: scale(1.2) !important;
  cursor: grabbing !important;
}

:deep(.vue-flow__handle.connecting) {
  opacity: 1 !important;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
  box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.4) !important;
  width: 32px !important;
  height: 32px !important;
  animation: handleConnecting 1.5s ease-in-out infinite;
}

/* 连接点位置优化 */
:deep(.vue-flow__handle.h-left) {
  left: -12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  margin: 0 !important;
  margin-top: 0 !important;
  margin-left: 0 !important;
}

:deep(.vue-flow__handle.h-right) {
  right: -12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  margin: 0 !important;
  margin-top: 0 !important;
  margin-right: 0 !important;
}

:deep(.vue-flow__handle.h-left:hover),
:deep(.vue-flow__handle.h-right:hover) {
  transform: translateY(-50%) scale(1.2) !important;
}

:deep(.vue-flow__handle.h-left.connecting),
:deep(.vue-flow__handle.h-right.connecting) {
  transform: translateY(-50%) !important;
}

:deep(.vue-flow__node) {
  overflow: visible !important;
}

:deep(.custom-start-node),
:deep(.custom-end-node),
:deep(.custom-task-node) {
  overflow: visible !important;
}

/* 连接点脉冲动画 */
@keyframes handlePulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5), 
                0 0 0 4px rgba(102, 126, 234, 0.1);
  }
  50% {
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.7), 
                0 0 0 8px rgba(102, 126, 234, 0.2);
  }
}

/* 连接中动画 */
@keyframes handleConnecting {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.4);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 0 12px rgba(34, 197, 94, 0.2);
  }
}

:deep(.vue-flow__node.selected .vue-flow__handle) {
  animation: handlePulse 2s ease-in-out infinite;
}

:deep(.vue-flow__edge) {
  transition: all 0.3s ease;
}

:deep(.vue-flow__edge:hover) {
  stroke-width: 4 !important;
  filter: drop-shadow(0 0 6px rgba(102, 126, 234, 0.4));
}

:deep(.vue-flow__edge.selected) {
  stroke-width: 4 !important;
  filter: drop-shadow(0 0 8px rgba(102, 126, 234, 0.6));
  animation: edgePulse 2s ease-in-out infinite;
}

:deep(.vue-flow__controls) {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  padding: 4px;
}

:deep(.vue-flow__controls-button) {
  border-bottom: 1px solid var(--border-color);
  transition: all 0.2s ease;
  background-color: var(--bg-card);
}

:deep(.vue-flow__controls-button:hover) {
  background: var(--bg-hover);
}

:deep(.vue-flow__minimap) {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

@keyframes handlePulse {
  0%, 100% {
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
  }
}

@keyframes edgePulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>


