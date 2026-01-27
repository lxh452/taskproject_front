<template>
  <div class="flow-designer-page" @contextmenu.prevent="onCanvasContextMenu">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button
          :icon="leftDrawerVisible ? 'Fold' : 'Expand'"
          @click="toggleLeftDrawer"
          circle
          class="drawer-toggle"
          :class="{ active: leftDrawerVisible }"
          title="节点库"
        />
        <div class="toolbar-title">
          <el-icon class="title-icon"><Connection /></el-icon>
          <span>流程设计器</span>
        </div>
        <el-select
          v-model="selectedTaskId"
          placeholder="选择任务"
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
        <el-button :icon="Refresh" @click="refreshFlow" circle title="刷新" />
        <el-button :icon="FullScreen" @click="fitViewFlow" circle title="适应画布" />
        <el-button :icon="MagicStick" @click="autoLayout" circle title="自动布局" />
        <el-button
          type="primary"
          :icon="DocumentChecked"
          @click="saveFlow"
          :loading="saving"
          :disabled="!selectedTaskId"
          title="保存流程"
        >
          保存流程
        </el-button>
        <el-button
          :icon="QuestionFilled"
          @click="startOnboarding"
          circle
          title="帮助引导"
        />
      </div>
    </div>

    <div class="flow-container">
      <!-- 左侧智能面板：节点库 / 节点详情 -->
      <transition name="drawer-slide-left">
        <div
          v-show="leftDrawerVisible"
          class="sidebar-left drawer"
          @mouseenter="panEnabled=false"
          @mouseleave="panEnabled=true"
        >
        <!-- 智能面板头部 -->
        <div class="sidebar-header">
          <el-icon class="header-icon">
            <component :is="selected || selectedEdge ? 'InfoFilled' : 'Box'" />
          </el-icon>
          <span class="header-title">{{ selected || selectedEdge ? '节点详情' : '节点库' }}</span>
          <el-button
            :icon="Fold"
            @click="toggleLeftDrawer"
            circle
            size="small"
            class="collapse-btn"
            title="收起面板"
          />
        </div>

        <!-- 节点库内容（未选中节点时显示） -->
        <transition name="panel-fade" mode="out-in">
          <div v-if="!selected && !selectedEdge" key="node-library" class="panel-content">
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
                @touchstart="onTouchStart($event, node)"
                @touchmove="onTouchMove"
                @touchend="onTouchEnd"
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
                  <p class="tip-text">拖拽节点到画布上进行流程设计</p>
                  <p class="tip-text">点击画布上的节点查看详情</p>
                </template>
              </el-alert>
            </div>
          </div>

          <!-- 节点详情内容（选中节点时显示） -->
          <div v-else key="node-detail" class="panel-content">
            <div class="detail-content">
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
          </div>
        </transition>
        </div>
      </transition>

      <!-- 画布区域 -->
      <div class="canvas-area" ref="canvasTopEl">
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
          :max-zoom="4"
          :default-viewport="{ x: 0, y: 0, zoom: 1 }"
          :nodes-draggable="false"
          :nodes-connectable="true"
          :edges-updatable="false"
          :edges-focusable="true"
          :edges-clickable="true"
          :pan-on-scroll="panEnabled"
          :pan-on-scroll-mode="'free'"
          :pan-on-scroll-speed="1.2"
          @connect="onConnect"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @nodes-change="onNodesChange"
          @edges-change="onEdgesChange"
          @init="onInit"
          @pane-click="onPaneClick"
          @drop="onDrop"
          @dragover="onDragOver"
          @node-context-menu="onNodeContextMenu"
        >
          <Background :gap="20" :size="1" pattern-color="#e5e7eb" />
          <Controls position="bottom-right" />
          <MiniMap zoomable pannable position="bottom-left" />
        </VueFlow>
      </div>
    </div>

    <!-- 右键菜单 -->
    <teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click="closeContextMenu"
      >
        <div v-if="contextMenu.type === 'node'" class="context-menu-content">
          <div class="context-menu-item" @click="handleDeleteNode">
            <el-icon><Delete /></el-icon>
            <span>删除节点</span>
            <span class="shortcut">Del</span>
          </div>
          <div class="context-menu-item" @click="duplicateNode">
            <el-icon><DocumentCopy /></el-icon>
            <span>复制节点</span>
            <span class="shortcut">Ctrl+D</span>
          </div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-item" @click="centerNode">
            <el-icon><Aim /></el-icon>
            <span>居中显示</span>
          </div>
        </div>
        <div v-else-if="contextMenu.type === 'canvas'" class="context-menu-content">
          <div class="context-menu-item" @click="autoLayout">
            <el-icon><MagicStick /></el-icon>
            <span>自动布局</span>
            <span class="shortcut">Ctrl+L</span>
          </div>
          <div class="context-menu-item" @click="fitViewFlow">
            <el-icon><FullScreen /></el-icon>
            <span>适应画布</span>
            <span class="shortcut">Ctrl+F</span>
          </div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-item" @click="selectAllNodes">
            <el-icon><Select /></el-icon>
            <span>全选节点</span>
            <span class="shortcut">Ctrl+A</span>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, defineComponent, onMounted, watch, nextTick, onUnmounted } from 'vue'
import {
  Connection, Refresh, FullScreen, DocumentChecked, Box, DocumentRemove,
  InfoFilled, Document, User, UserFilled, Calendar, DataLine, CircleCheck, CircleCheckFilled, Clock, Check,
  OfficeBuilding, Setting, List, Promotion, Timer, Delete, ArrowRight, MagicStick,
  DocumentCopy, Aim, Select, QuestionFilled, Fold, Expand
} from '@element-plus/icons-vue'
import { VueFlow, Handle, useVueFlow, Position, type Node, type Edge, MarkerType } from '@vue-flow/core'
import { Background, Controls, MiniMap } from '@vue-flow/additional-components'
import '@vue-flow/core/dist/style.css'
import { useFlowStore } from '@/stores/flowStore'
import { listTasks, listTaskNodesByTask, getMyEmployee, listEmployees, updatePrerequisiteNodes, updateTaskNode, listDepartments } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { markRaw } from 'vue'
import { useFlowOnboarding } from '@/composables/useFlowOnboarding'

const store = useFlowStore()

// 新手引导
const { startOnboarding, initOnboarding } = useFlowOnboarding()

// 抽屉状态
const leftDrawerVisible = ref(true)

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  type: '' as 'node' | 'canvas' | '',
  nodeId: ''
})

// 批量选择状态
const selectedNodes = ref<Set<string>>(new Set())
const isMultiSelecting = ref(false)

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
    { color: '#3B82F6', bgFrom: '#EFF6FF', bgTo: '#DBEAFE' },
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
  style: { strokeWidth: 3, stroke: '#3B82F6' },
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

// 点击外部关闭右键菜单
function handleClickOutside(event: MouseEvent) {
  if (contextMenu.value.visible) {
    const target = event.target as HTMLElement
    if (!target.closest('.context-menu')) {
      closeContextMenu()
    }
  }
}

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

    // 添加快捷键监听
    window.addEventListener('keydown', handleKeyDown)

    // 添加点击外部关闭菜单监听
    document.addEventListener('click', handleClickOutside)

    // 初始化新手引导（首次进入自动触发）
    initOnboarding()
  } catch (error: any) {
    console.error('初始化失败:', error)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  // 移除事件监听
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleClickOutside)
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
  console.log('开始构建流程图，可用节点数:', availableNodes.value.length)
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
    draggable: false, // Start node should not be draggable
    style: {
      background: '#1E3A5F',
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
        draggable: node.canDrag, // Enable drag only for nodes where user is leader
        style: {
          background: deptColor.bgFrom || '#FFFFFF',
          border: `2px solid ${deptColor.color || '#E2E8F0'}`,
          borderRadius: '12px',
          padding: '16px',
          minWidth: '200px',
          color: '#0F172A',
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
    draggable: false, // End node should not be draggable
    style: {
      background: '#DC2626',
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

// ========== 移动端触摸拖拽支持 ==========
const touchDragElement = ref<HTMLElement | null>(null)
const touchStartPos = ref<{ x: number; y: number } | null>(null)
const isTouchDragging = ref(false)

// 设备类型检测：只有触摸设备才启用触摸拖拽
const isTouchDevice = computed(() => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
})

function onTouchStart(event: TouchEvent, node: any) {
  // PC端跳过触摸事件，避免卡片随意移动
  if (!isTouchDevice.value) return

  const touch = event.touches[0]
  touchStartPos.value = { x: touch.clientX, y: touch.clientY }
  draggedNode.value = node
  isTouchDragging.value = false

  // 创建拖拽预览元素
  const target = event.currentTarget as HTMLElement
  touchDragElement.value = target.cloneNode(true) as HTMLElement
  touchDragElement.value.classList.add('touch-drag-preview')
  touchDragElement.value.style.cssText = `
    position: fixed;
    left: ${touch.clientX - 60}px;
    top: ${touch.clientY - 30}px;
    width: 120px;
    z-index: 9999;
    pointer-events: none;
    opacity: 0.9;
    transform: scale(0.9);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  `
  document.body.appendChild(touchDragElement.value)
}

function onTouchMove(event: TouchEvent) {
  // PC端跳过触摸事件
  if (!isTouchDevice.value) return
  if (!draggedNode.value || !touchDragElement.value) return

  const touch = event.touches[0]

  // 检测是否开始拖拽（移动超过10px）
  if (touchStartPos.value) {
    const dx = Math.abs(touch.clientX - touchStartPos.value.x)
    const dy = Math.abs(touch.clientY - touchStartPos.value.y)
    if (dx > 10 || dy > 10) {
      isTouchDragging.value = true
      event.preventDefault() // 阻止滚动
    }
  }

  if (isTouchDragging.value) {
    // 更新预览元素位置
    touchDragElement.value.style.left = `${touch.clientX - 60}px`
    touchDragElement.value.style.top = `${touch.clientY - 30}px`
  }
}

function onTouchEnd(event: TouchEvent) {
  // PC端跳过触摸事件
  if (!isTouchDevice.value) return
  if (!draggedNode.value) return

  // 清理预览元素
  if (touchDragElement.value && touchDragElement.value.parentNode) {
    touchDragElement.value.parentNode.removeChild(touchDragElement.value)
    touchDragElement.value = null
  }

  // 如果是拖拽操作，执行放置逻辑
  if (isTouchDragging.value) {
    const touch = event.changedTouches[0]
    handleTouchDrop(touch.clientX, touch.clientY)
  }

  // 重置状态
  touchStartPos.value = null
  isTouchDragging.value = false
  draggedNode.value = null
}

function handleTouchDrop(clientX: number, clientY: number) {
  if (!draggedNode.value) return
  
  const node = draggedNode.value
  const nodeId = String(node.taskNodeId)
  
  // 检查节点是否已经在画布上
  const existingNode = nodes.value.find(n => n.id === nodeId)
  if (existingNode) {
    ElMessage.warning('该节点已在画布上')
    return
  }
  
  // 检查放置位置是否在画布区域内
  const canvasEl = canvasTopEl.value
  if (!canvasEl) return
  
  const rect = canvasEl.getBoundingClientRect()
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    // 不在画布区域内，不执行放置
    return
  }
  
  // 获取画布坐标
  const position = screenToFlowCoordinate({
    x: clientX,
    y: clientY,
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
      departmentId: node.departmentId,
      departmentName: getDepartmentName(node.departmentId),
      deptColor: deptColor.color,
      deptBgFrom: deptColor.bgFrom,
      deptBgTo: deptColor.bgTo,
      prerequisiteNodes: node.prerequisiteNodes || [],
      canDrag: String(node.leaderId) === String(currentEmployeeId.value),
    },
    draggable: String(node.leaderId) === String(currentEmployeeId.value),
  }
  
  nodes.value.push(newNode)
  ElMessage.success('节点已添加到画布')
  
  // 选中新添加的节点
  store.setSelection(nodeId)
}

function selectNodeFromLibrary(node: any) {
  const nodeId = String(node.taskNodeId)
  const foundNode = nodes.value.find(n => n.id === nodeId)
  if (foundNode) {
    store.setSelection(nodeId)
  }
}

// ========== 抽屉切换功能 ==========
function toggleLeftDrawer() {
  leftDrawerVisible.value = !leftDrawerVisible.value
}

// ========== 右键菜单功能 ==========
function onNodeContextMenu(nodeMouseEvent: any) {
  const event = nodeMouseEvent.event as MouseEvent
  event.preventDefault()

  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    type: 'node',
    nodeId: nodeMouseEvent.node.id
  }
  // 选中右键点击的节点
  store.setSelection(nodeMouseEvent.node.id)
}

function onCanvasContextMenu(event: MouseEvent) {
  // 只有在点击画布空白区域时才显示画布菜单
  const target = event.target as HTMLElement
  if (target.classList.contains('vue-flow__pane') || target.classList.contains('canvas-area')) {
    contextMenu.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: 'canvas',
      nodeId: ''
    }
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

// ========== 自动布局功能 ==========
function autoLayout() {
  closeContextMenu()

  if (nodes.value.length <= 2) {
    ElMessage.info('节点数量太少，无需自动布局')
    return
  }

  // 重新构建流程图，会自动计算布局
  buildFlowGraph()

  // 适应视图
  setTimeout(() => {
    fitViewFlow()
  }, 100)

  ElMessage.success('自动布局完成')
}

// ========== 节点操作功能 ==========
function duplicateNode() {
  closeContextMenu()

  if (!contextMenu.value.nodeId) return

  const sourceNode = nodes.value.find(n => n.id === contextMenu.value.nodeId)
  if (!sourceNode || sourceNode.type === 'start' || sourceNode.type === 'end') {
    ElMessage.warning('无法复制该节点')
    return
  }

  // 创建新节点ID
  const newId = `${sourceNode.id}_copy_${Date.now()}`

  // 复制节点数据
  const newNode: Node = {
    ...sourceNode,
    id: newId,
    position: {
      x: sourceNode.position.x + 50,
      y: sourceNode.position.y + 50
    },
    data: {
      ...sourceNode.data,
      label: `${sourceNode.data.label} (副本)`
    }
  }

  nodes.value.push(newNode)
  store.setSelection(newId)
  ElMessage.success('节点已复制')
}

function centerNode() {
  closeContextMenu()

  if (!contextMenu.value.nodeId) return

  const node = nodes.value.find(n => n.id === contextMenu.value.nodeId)
  if (!node) return

  // 将节点居中显示
  const { x, y } = node.position
  const zoom = viewport.value.zoom

  setViewport({
    x: -x * zoom + window.innerWidth / 2,
    y: -y * zoom + window.innerHeight / 2,
    zoom
  }, { duration: 400 })
}

function selectAllNodes() {
  closeContextMenu()

  const taskNodes = nodes.value.filter(n => n.type === 'task')
  if (taskNodes.length === 0) {
    ElMessage.info('没有可选择的节点')
    return
  }

  selectedNodes.value = new Set(taskNodes.map(n => n.id))
  ElMessage.success(`已选择 ${taskNodes.length} 个节点`)
}

// ========== 快捷键支持 ==========
function handleKeyDown(event: KeyboardEvent) {
  // Ctrl/Cmd + A: 全选
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    event.preventDefault()
    selectAllNodes()
    return
  }

  // Ctrl/Cmd + D: 复制节点
  if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
    event.preventDefault()
    if (selected.value && selected.value.type === 'task') {
      contextMenu.value.nodeId = selected.value.id
      duplicateNode()
    }
    return
  }

  // Ctrl/Cmd + L: 自动布局
  if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
    event.preventDefault()
    autoLayout()
    return
  }

  // Ctrl/Cmd + F: 适应画布
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault()
    fitViewFlow()
    return
  }

  // Delete/Backspace: 删除选中节点
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selected.value && selected.value.type === 'task') {
      event.preventDefault()
      handleDeleteNode()
    }
    return
  }

  // Escape: 取消选择/关闭菜单
  if (event.key === 'Escape') {
    if (contextMenu.value.visible) {
      closeContextMenu()
    } else if (selected.value) {
      store.setSelection(null)
    }
    return
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
    draggable: node.canDrag, // Enable drag based on permission
    style: {
      background: deptColor.bgFrom || '#FFFFFF',
      border: `2px solid ${deptColor.color || '#E2E8F0'}`,
      borderRadius: '12px',
      padding: '16px',
      minWidth: '200px',
      color: '#0F172A',
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
  edges.value.forEach(e => { (e as any).selected = false })
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
    (e as any).selected = e.id === edge.id 
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
  edges.value.forEach(e => { (e as any).selected = false })
  selectedEdge.value = null
}

// Drag control state
const dragState = ref({
  isDragging: false,
  draggedNodeId: null as string | null,
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 },
  dragThreshold: 5, // pixels before drag starts
  hasMoved: false
})

// 节点变化
function onNodesChange(changes: any[]) {
  changes.forEach((change: any) => {
    if (change.type === 'position') {
      const node = nodes.value.find(n => n.id === change.id)
      if (!node) return
      
      // Check if node can be dragged
      const canDrag = node.data?.canDrag !== false
      
      if (!canDrag) {
        // Prevent movement for readonly nodes
        console.log('Node is readonly, preventing drag')
        return
      }
      
      // Allow position update for draggable nodes
      if (change.position) {
        node.position = change.position
      }
    } else if (change.type === 'select') {
      // Handle selection changes
      const node = nodes.value.find(n => n.id === change.id)
      if (node) {
        (node as any).selected = change.selected
      }
    }
  })
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
      executorIds: Array.isArray(formExecutors.value) ? formExecutors.value : [],
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
        background: '#1E3A5F',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '16px',
        textAlign: 'center',
        boxShadow: props.selected ? '0 4px 16px rgba(30, 58, 95, 0.35)' : '0 2px 8px rgba(30, 58, 95, 0.15)',
        position: 'relative',
        overflow: 'visible',
        border: props.selected ? '2px solid #3B82F6' : '2px solid transparent',
        transition: 'all 0.2s ease',
      }
    }, [
      h('div', { style: { marginBottom: '8px' } }, [
        h('el-icon', { style: { fontSize: '24px' } }, [h('Check')])
      ]),
      h('div', props.data?.label || '开始'),
      h(Handle, { 
        type: 'source', 
        position: Position.Right, 
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
        background: '#DC2626',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '16px',
        textAlign: 'center',
        boxShadow: props.selected ? '0 4px 16px rgba(220, 38, 38, 0.35)' : '0 2px 8px rgba(220, 38, 38, 0.15)',
        position: 'relative',
        overflow: 'visible',
        border: props.selected ? '2px solid #EF4444' : '2px solid transparent',
        transition: 'all 0.2s ease',
      }
    }, [
      h('div', { style: { marginBottom: '8px' } }, [
        h('el-icon', { style: { fontSize: '24px' } }, [h('CircleCheck')])
      ]),
      h('div', props.data?.label || '结束'),
      h(Handle, { 
        type: 'target', 
        position: Position.Left, 
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
    const statusColor = status === 2 ? '#059669' : status === 1 ? '#D97706' : status === 0 ? '#0284C7' : '#64748B'
    const sv = props.data?.styleVars || {}
    
    // 获取负责人和执行人信息
    const leaderName = props.data?.leaderName || '-'
    const leaderAvatar = props.data?.leaderAvatar || ''
    const executors = props.data?.executors || []
    
    return h('div', {
      class: ['custom-task-node', props.selected ? 'selected' : '', !isLeader ? 'readonly' : ''].filter(Boolean).join(' '),
      style: {
        background: sv.bgFrom || '#FFFFFF',
        border: `2px solid ${sv.borderColor || '#E2E8F0'}`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '200px',
        boxShadow: props.selected ? '0 4px 16px rgba(0, 0, 0, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.2s ease',
      }
    }, [
      // 状态指示器
      h('div', {
        style: {
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: statusColor,
          border: '2px solid #fff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }
      }),
      // 节点名称
      h('div', {
        style: {
          fontSize: '14px',
          fontWeight: '600',
          color: '#0F172A',
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
            background: leaderAvatar ? `url(${leaderAvatar}) center/cover` : '#1E3A5F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '600',
            color: '#fff',
            flexShrink: 0,
            border: '2px solid #fff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }
        }, leaderAvatar ? '' : (leaderName !== '-' ? leaderName[0].toUpperCase() : 'L')),
        h('div', {
          style: {
            fontSize: '12px',
            color: '#475569',
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
              background: executor.avatar ? `url(${executor.avatar}) center/cover` : '#059669',
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
            color: '#64748B',
            fontWeight: '500',
          }
        }, `+${executors.length - 2}`)
      ]),
      // 进度条
      h('div', {
        style: {
          width: '100%',
          height: '4px',
          background: '#E2E8F0',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '8px',
        }
      }, [
        h('div', {
          style: {
            width: `${progress}%`,
            height: '100%',
            background: statusColor,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }
        })
      ]),
      h(Handle, { 
        type: 'target', 
        position: Position.Left, 
        class: 'h-left'
      }),
      h(Handle, { 
        type: 'source', 
        position: Position.Right, 
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
/* ==================== Swiss Minimalism Flow Designer ==================== */
.flow-designer-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: var(--bg-secondary);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.title-icon {
  font-size: 20px;
  color: var(--color-primary);
}

.task-selector {
  width: 280px;
}

.task-selector :deep(.el-input__wrapper) {
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 1px var(--border-color) inset;
  transition: all var(--transition-base);
}

.task-selector :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--border-dark) inset;
}

.task-selector :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--color-primary) inset;
}

.toolbar-right {
  display: flex;
  gap: var(--space-2);
}

.toolbar-right :deep(.el-button) {
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.toolbar-right :deep(.el-button:hover) {
  /* 移除 transform 保持按钮稳定 */
}

.flow-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Flow Container - Full Screen Canvas with Drawers */
.flow-container {
  position: relative;
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-canvas);
}

/* Drawer Styles */
.drawer {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 10;
  background: var(--bg-primary);
  box-shadow: var(--shadow-lg);
}

.sidebar-left.drawer {
  left: 0;
  width: 340px;
  border-right: 1px solid var(--border-color);
}

.sidebar-right.drawer {
  right: 0;
  width: 360px;
  border-left: 1px solid var(--border-color);
}

/* Drawer Animations */
.drawer-slide-left-enter-active,
.drawer-slide-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-slide-left-enter-from {
  transform: translateX(-100%);
}

.drawer-slide-left-leave-to {
  transform: translateX(-100%);
}

.drawer-slide-right-enter-active,
.drawer-slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-slide-right-enter-from {
  transform: translateX(100%);
}

.drawer-slide-right-leave-to {
  transform: translateX(100%);
}

/* Panel Content Fade Transition */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.panel-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Panel Content Styles */
.panel-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* Drawer Toggle Button */
.drawer-toggle {
  transition: all 0.3s ease;
}

.drawer-toggle.active {
  background: var(--color-primary);
  color: white;
}

.drawer-toggle:hover {
  /* 移除 transform 保持按钮稳定 */
}

.sidebar-left {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.sidebar-header .header-title {
  flex: 1;
}

.collapse-btn {
  margin-left: auto;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.collapse-btn:hover {
  opacity: 1;
}

.filter-section {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.department-filter {
  width: 100%;
}

.department-filter :deep(.el-input__wrapper) {
  border-radius: var(--radius-md);
}

.header-icon {
  font-size: 18px;
  color: var(--color-primary);
}

.header-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.nodes-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.nodes-list::-webkit-scrollbar {
  width: 5px;
}

.nodes-list::-webkit-scrollbar-track {
  background: transparent;
}

.nodes-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.nodes-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

.empty-nodes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--space-5);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.empty-text {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* Node Card - Swiss Minimalism */
.node-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  position: relative;
}

.node-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.node-card.draggable {
  cursor: grab;
  border-left: 3px solid var(--color-primary);
}

.node-card.draggable:active {
  cursor: grabbing;
  /* 移除 transform 避免拖拽时卡片缩放 */
}

.node-card.readonly {
  opacity: 0.6;
  cursor: not-allowed;
}

.node-card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.node-type-badge {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.node-type-badge.type-task {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.node-type-badge.type-condition {
  background: var(--color-success-light);
  color: var(--color-success);
}

.node-type-badge.type-approval {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.node-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-light);
}

.prereq-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.tip-text {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: var(--space-1) 0;
  line-height: 1.5;
}

/* Canvas Area - Full Screen */
.canvas-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fafafa;
}

/* Context Menu */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: var(--space-2);
  min-width: 200px;
  animation: contextMenuFadeIn 0.15s ease-out;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  user-select: none;
}

.context-menu-item:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.context-menu-item .el-icon {
  font-size: 16px;
}

.context-menu-item .shortcut {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.context-menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: var(--space-1) 0;
}

.canvas-wrapper :deep(.vue-flow) {
  width: 100% !important;
  height: 100% !important;
}

.canvas-wrapper :deep(.vue-flow__viewport) {
  width: 100% !important;
  height: 100% !important;
}

/* Detail Panel */
.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.detail-content::-webkit-scrollbar {
  width: 5px;
}

.detail-content::-webkit-scrollbar-track {
  background: transparent;
}

.detail-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.detail-section {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--color-primary-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  transition: all var(--transition-base);
}

.detail-item:hover {
  background: var(--bg-tertiary);
}

.detail-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
}

.detail-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.detail-description {
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.action-buttons :deep(.el-button) {
  border-radius: var(--radius-md);
}

.employee-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.detail-avatar {
  flex-shrink: 0;
}

.executors-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.executor-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  transition: all var(--transition-base);
}

.executor-item:hover {
  background: var(--bg-tertiary);
}

.executor-item.executor-requested {
  background: var(--color-success-light);
  border-color: var(--color-success);
}

.executor-name {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.requested-check {
  color: var(--color-success);
  flex-shrink: 0;
}

.no-data-text {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.role-form {
  margin-top: var(--space-3);
}

.role-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-secondary);
}

.role-form :deep(.el-select .el-input__wrapper) {
  border-radius: var(--radius-md);
}

.employee-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-1) 0;
}

.employee-name {
  flex: 1;
  font-size: var(--font-size-sm);
}

.role-badges {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.role-badge {
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.leader-badge {
  color: var(--color-success) !important;
  background: var(--color-success-light);
}

.executor-badge {
  color: var(--color-primary) !important;
  background: var(--color-primary-light);
}

.employee-option.is-leader {
  background: var(--color-success-light);
  border-left: 3px solid var(--color-success);
  padding-left: var(--space-2);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.employee-option.is-executor {
  background: var(--color-primary-light);
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-2);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.employee-option.is-leader.is-executor {
  background: linear-gradient(90deg, var(--color-success-light) 0%, var(--color-primary-light) 100%);
  border-left: 3px solid var(--color-success);
  padding-left: var(--space-2);
}

.option-avatar {
  flex-shrink: 0;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--space-5);
  text-align: center;
}

.detail-empty .empty-icon {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.detail-empty .empty-text {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.detail-empty .empty-hint {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.node-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.node-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.node-card.draggable {
  cursor: grab;
  border-color: var(--color-primary);
  background: var(--bg-card);
}

.node-card.draggable:active {
  cursor: grabbing;
  /* 移除 transform 避免拖拽时卡片缩放 */
}

/* 触摸拖拽预览样式 */
.touch-drag-preview {
  background: rgba(255, 255, 255, 0.95) !important;
  border: 2px solid #3B82F6 !important;
  border-radius: 12px !important;
  padding: 12px !important;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3) !important;
}

.touch-drag-preview .node-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.touch-drag-preview .node-name {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.touch-drag-preview .node-card-footer,
.touch-drag-preview .node-meta {
  display: none;
}

.node-card.readonly {
  opacity: 0.6;
  cursor: not-allowed;
}

.node-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.node-type-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
  transition: all 0.3s ease;
}

.node-card:hover .node-type-badge {
  /* No transform on hover to prevent layout shift */
}

.node-type-badge.type-task {
  background: var(--color-primary-light);
  color: var(--color-primary);
  box-shadow: none;
}

.node-type-badge.type-condition {
  background: var(--color-success-light);
  color: var(--color-success);
  box-shadow: none;
}

.node-type-badge.type-approval {
  background: var(--color-danger-light);
  color: var(--color-danger);
  box-shadow: none;
}

.node-info {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.node-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
}

.prereq-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.prereq-tag :deep(.el-tag) {
  border-radius: 8px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(248, 250, 252, 0.8);
}

.tip-text {
  font-size: 12px;
  color: #64748b;
  margin: 4px 0;
  line-height: 1.5;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-secondary);
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
  width: 5px;
}

.detail-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
}

.detail-content::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.2);
  border-radius: 10px;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #3B82F6;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(99, 102, 241, 0.1);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  transition: all 0.2s ease;
}

.detail-item:hover {
  background: var(--bg-tertiary);
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.detail-description {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-buttons :deep(.el-button) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.action-buttons :deep(.el-button:hover) {
  /* 移除 transform 保持按钮稳定 */
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 10px;
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
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-light);
  transition: all 0.2s ease;
}

.executor-item:hover {
  background: var(--bg-tertiary);
}

.executor-item.executor-requested {
  background: var(--color-success-light);
  border-color: var(--color-success);
}

.executor-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.requested-check {
  color: #22c55e;
  flex-shrink: 0;
}

.no-data-text {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  color: #94a3b8;
  font-size: 13px;
}

.role-form {
  margin-top: 12px;
}

.role-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
}

.role-form :deep(.el-select .el-input__wrapper) {
  border-radius: 10px;
}

.employee-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 0;
}

.employee-name {
  flex: 1;
  font-size: 13px;
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
  padding: 3px;
}

.executor-badge {
  color: #3b82f6 !important;
  background: rgba(59, 130, 246, 0.1);
  padding: 3px;
}

.employee-option.is-leader {
  background: var(--color-success-light);
  border-left: 3px solid var(--color-success);
  padding-left: 10px;
  border-radius: 0 8px 8px 0;
}

.employee-option.is-executor {
  background: var(--color-primary-light);
  border-left: 3px solid var(--color-primary);
  padding-left: 10px;
  border-radius: 0 8px 8px 0;
}

.employee-option.is-leader.is-executor {
  background: var(--color-success-light);
  border-left: 3px solid var(--color-success);
  padding-left: 10px;
}

.option-avatar {
  flex-shrink: 0;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
}

.detail-empty .empty-icon {
  font-size: 48px;
  color: #94a3b8;
  margin-bottom: 16px;
}

.detail-empty .empty-text {
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.detail-empty .empty-hint {
  font-size: 13px;
  color: #94a3b8;
}

/* Vue Flow Handle Styles - Modern Flat Design */
:deep(.vue-flow__handle) {
  width: 12px !important;
  height: 12px !important;
  border-radius: 50% !important;
  background: var(--color-primary) !important;
  border: 3px solid white !important;
  opacity: 0 !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
  cursor: crosshair !important;
  z-index: 100 !important;
}

:deep(.vue-flow__node:hover .vue-flow__handle) {
  opacity: 1 !important;
  transform: scale(1.2) !important;
}

:deep(.vue-flow__node.selected .vue-flow__handle) {
  opacity: 1 !important;
}

:deep(.vue-flow__handle:hover) {
  transform: scale(1.4) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5) !important;
}

/* Vue Flow Edge Styles - Modern Flat Design */
:deep(.vue-flow__edge-path) {
  stroke: var(--color-primary) !important;
  stroke-width: 2.5px !important;
  transition: all 0.2s ease !important;
}

:deep(.vue-flow__edge:hover .vue-flow__edge-path) {
  stroke: var(--color-primary) !important;
  stroke-width: 3.5px !important;
  filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3)) !important;
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: var(--color-primary) !important;
  stroke-width: 3.5px !important;
  filter: drop-shadow(0 2px 6px rgba(59, 130, 246, 0.4)) !important;
}

:deep(.vue-flow__edge-textwrapper) {
  pointer-events: all !important;
}

:deep(.vue-flow__edge-text) {
  fill: var(--text-primary) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

/* Vue Flow Node Styles - Modern Flat Design */
:deep(.vue-flow__node) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  cursor: move !important;
}

:deep(.vue-flow__node:hover) {
  /* 移除 transform 避免节点悬停时移动 */
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08)) !important;
}

:deep(.vue-flow__node.selected) {
  filter: drop-shadow(0 8px 20px rgba(59, 130, 246, 0.3)) !important;
}

:deep(.vue-flow__node.dragging) {
  opacity: 0.8 !important;
  /* 移除 transform 避免拖拽时节点缩放 */
}

/* Vue Flow Controls - Modern Flat Design */
:deep(.vue-flow__controls) {
  background: white !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid var(--border-color) !important;
  padding: var(--space-2) !important;
  gap: var(--space-1) !important;
}

:deep(.vue-flow__controls-button) {
  width: 36px !important;
  height: 36px !important;
  background: white !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  transition: all 0.2s ease !important;
  color: var(--text-primary) !important;
}

:deep(.vue-flow__controls-button:hover) {
  background: var(--color-primary) !important;
  color: white !important;
  border-color: var(--color-primary) !important;
  /* 移除 transform 保持按钮稳定 */
}

:deep(.vue-flow__controls-button svg) {
  width: 18px !important;
  height: 18px !important;
}

/* Vue Flow MiniMap - Modern Flat Design */
:deep(.vue-flow__minimap) {
  background: white !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid var(--border-color) !important;
  overflow: hidden !important;
}

:deep(.vue-flow__minimap-mask) {
  fill: rgba(59, 130, 246, 0.1) !important;
  stroke: var(--color-primary) !important;
  stroke-width: 2px !important;
}

:deep(.vue-flow__minimap-node) {
  fill: var(--color-primary-light) !important;
  stroke: var(--color-primary) !important;
  stroke-width: 1px !important;
}

/* Vue Flow Background - Modern Flat Design */
:deep(.vue-flow__background) {
  background-color: #fafafa !important;
}

:deep(.vue-flow__background-pattern) {
  stroke: #e5e7eb !important;
  stroke-width: 1px !important;
}

:deep(.vue-flow__handle.connecting) {
  opacity: 1 !important;
  background: var(--color-success) !important;
  box-shadow: 0 0 0 4px var(--color-success-light) !important;
}

:deep(.vue-flow__handle.h-left) {
  left: -7px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

:deep(.vue-flow__handle.h-right) {
  right: -7px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

:deep(.vue-flow__node) {
  overflow: visible !important;
}

:deep(.vue-flow__edge) {
  transition: all var(--transition-base);
}

:deep(.vue-flow__edge:hover) {
  stroke-width: 3 !important;
}

:deep(.vue-flow__edge.selected) {
  stroke-width: 3 !important;
}

:deep(.vue-flow__controls) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-1);
  overflow: hidden;
}

:deep(.vue-flow__controls-button) {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-bottom: 1px solid var(--border-light);
  background-color: transparent;
  border-radius: var(--radius-md);
  margin: 2px;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.vue-flow__controls-button svg) {
  width: 16px;
  height: 16px;
}

:deep(.vue-flow__controls-button:hover) {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

:deep(.vue-flow__controls-button:last-child) {
  border-bottom: none;
}

:deep(.vue-flow__minimap) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

/* Dark Mode */
html.dark-mode .flow-designer-page {
  background: var(--bg-page);
}

html.dark-mode .toolbar,
html.dark-mode .sidebar-left,
html.dark-mode .sidebar-right {
  background: var(--bg-card);
  border-color: var(--border-color);
}

html.dark-mode .sidebar-header,
html.dark-mode .filter-section,
html.dark-mode .sidebar-footer {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

html.dark-mode .node-card {
  background: var(--bg-card);
  border-color: var(--border-color);
}

html.dark-mode .node-card:hover {
  border-color: var(--color-primary);
}

html.dark-mode .node-name {
  color: var(--text-primary);
}

html.dark-mode .detail-item,
html.dark-mode .executor-item,
html.dark-mode .detail-description {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

html.dark-mode :deep(.vue-flow__controls) {
  background: var(--bg-card);
  border-color: var(--border-color);
}

html.dark-mode :deep(.vue-flow__minimap) {
  background: var(--bg-card);
  border-color: var(--border-color);
}

/* ==================== Responsive - Modern Flat Design ==================== */

/* Tablet (768px - 1024px) */
@media (max-width: 1024px) {
  .toolbar {
    padding: var(--space-3) var(--space-4);
  }

  .toolbar-title span {
    font-size: var(--font-size-sm);
  }

  .task-selector {
    max-width: 200px;
  }

  .sidebar-left.drawer {
    width: 280px;
  }

  .sidebar-right.drawer {
    width: 320px;
  }

  .node-card {
    padding: var(--space-3);
  }

  .detail-content {
    padding: var(--space-4);
  }
}

/* Mobile (< 768px) */
@media (max-width: 768px) {
  .toolbar {
    padding: var(--space-2) var(--space-3);
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .toolbar-left,
  .toolbar-right {
    flex: 1;
    min-width: 0;
  }

  .toolbar-title span {
    display: none;
  }

  .task-selector {
    max-width: 150px;
  }

  .sidebar-left.drawer {
    width: 85vw;
    max-width: 320px;
  }

  .sidebar-right.drawer {
    width: 85vw;
    max-width: 360px;
  }

  /* 移动端隐藏按钮文字，只显示图标 */
  .toolbar-right :deep(.el-button span) {
    display: none;
  }

  .toolbar-right :deep(.el-button) {
    min-width: 40px;
    padding: var(--space-2);
  }

  /* 右键菜单适配移动端 */
  .context-menu {
    min-width: 180px;
    max-width: 90vw;
  }

  .context-menu-item {
    padding: var(--space-3);
  }

  /* 节点卡片适配移动端 */
  .node-card {
    padding: var(--space-3);
  }

  .node-type-badge {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  /* 详情面板适配移动端 */
  .detail-content {
    padding: var(--space-4);
  }

  .detail-item {
    padding: var(--space-3);
  }

  /* Vue Flow 控制按钮适配移动端 */
  :deep(.vue-flow__controls) {
    bottom: var(--space-3) !important;
    right: var(--space-3) !important;
  }

  :deep(.vue-flow__controls-button) {
    width: 40px !important;
    height: 40px !important;
  }

  :deep(.vue-flow__controls-button svg) {
    width: 20px !important;
    height: 20px !important;
  }

  /* 小地图在移动端缩小 */
  :deep(.vue-flow__minimap) {
    width: 120px !important;
    height: 80px !important;
  }
}

/* Extra small (< 480px) */
@media (max-width: 480px) {
  .toolbar-title {
    padding: var(--space-3);
    gap: var(--space-2);
  }

  .node-card {
    min-width: 160px;
    padding: var(--space-3);
  }

  .node-type-badge {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .node-name {
    font-size: var(--font-size-sm);
  }

  .node-meta {
    font-size: 11px;
  }

  .detail-content {
    padding: var(--space-4);
  }

  .detail-section {
    margin-bottom: var(--space-4);
  }

  .section-title {
    font-size: 11px;
    margin-bottom: var(--space-2);
    padding-bottom: var(--space-2);
  }

  .detail-item {
    padding: var(--space-2);
  }

  .detail-label {
    font-size: 10px;
  }

  .detail-value {
    font-size: var(--font-size-sm);
  }

  .role-form :deep(.el-form-item) {
    margin-bottom: var(--space-3);
  }

  .role-form :deep(.el-form-item__label) {
    font-size: var(--font-size-xs);
  }

  .empty-nodes {
    padding: var(--space-6) var(--space-4);
  }

  .empty-icon {
    font-size: 36px;
  }

  .empty-text {
    font-size: var(--font-size-sm);
  }

  .empty-hint {
    font-size: var(--font-size-xs);
  }

  .detail-empty {
    padding: var(--space-6) var(--space-4);
  }

  .detail-empty .empty-icon {
    font-size: 36px;
  }

  .detail-empty .empty-text {
    font-size: var(--font-size-sm);
  }

  /* Hide minimap on mobile */
  :deep(.vue-flow__minimap) {
    display: none;
  }

  :deep(.vue-flow__controls) {
    bottom: var(--space-2) !important;
    right: var(--space-2) !important;
    padding: var(--space-1);
  }

  :deep(.vue-flow__controls-button) {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
  }
}

/* Extra small (< 480px) */
@media (max-width: 480px) {
  .toolbar {
    padding: var(--space-2);
  }

  .toolbar-title {
    font-size: var(--font-size-sm);
  }

  .title-icon {
    font-size: 16px;
  }

  .drawer-toggle {
    width: 36px;
    height: 36px;
  }

  .sidebar-left.drawer,
  .sidebar-right.drawer {
    width: 90vw;
  }

  .task-selector {
    max-width: 120px;
    font-size: var(--font-size-xs);
  }

  /* 节点卡片进一步缩小 */
  .node-card {
    padding: var(--space-2);
  }

  .node-card-header {
    gap: var(--space-2);
  }

  .node-type-badge {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .node-name {
    font-size: var(--font-size-xs);
  }

  /* 右键菜单适配小屏 */
  .context-menu {
    min-width: 160px;
  }

  .context-menu-item {
    padding: var(--space-2);
    font-size: var(--font-size-xs);
  }

  .context-menu-item .shortcut {
    display: none;
  }

  /* 隐藏小地图在小屏设备 */
  :deep(.vue-flow__minimap) {
    display: none !important;
  }

  /* 控制按钮进一步优化 */
  :deep(.vue-flow__controls) {
    bottom: var(--space-2) !important;
    right: var(--space-2) !important;
  }

  :deep(.vue-flow__controls-button) {
    width: 36px !important;
    height: 36px !important;
  }

  :deep(.vue-flow__controls-button svg) {
    width: 16px !important;
    height: 16px !important;
  }
}

/* Landscape Mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .sidebar-left.drawer,
  .sidebar-right.drawer {
    width: 40vw;
    max-width: 360px;
  }

  .toolbar {
    padding: var(--space-2) var(--space-3);
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  /* 增大触摸目标 */
  .node-card {
    padding: var(--space-4);
    min-height: 80px;
  }

  .context-menu-item {
    min-height: 44px;
    padding: var(--space-3) var(--space-4);
  }

  :deep(.vue-flow__controls-button) {
    min-width: 44px !important;
    min-height: 44px !important;
  }

  :deep(.vue-flow__handle) {
    width: 16px !important;
    height: 16px !important;
    opacity: 1 !important;
  }

  /* 触摸设备上始终显示连接点 */
  :deep(.vue-flow__node .vue-flow__handle) {
    opacity: 0.6 !important;
  }

  :deep(.vue-flow__node:active .vue-flow__handle) {
    opacity: 1 !important;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .drawer-slide-left-enter-active,
  .drawer-slide-left-leave-active,
  .drawer-slide-right-enter-active,
  .drawer-slide-right-leave-active {
    transition: none !important;
  }

  .node-card:hover {
    transform: none !important;
  }

  :deep(.vue-flow__node:hover) {
    transform: none !important;
  }
}

/* Print Styles */
@media print {
  .toolbar,
  .sidebar-left,
  .sidebar-right,
  .context-menu,
  :deep(.vue-flow__controls),
  :deep(.vue-flow__minimap) {
    display: none !important;
  }

  .canvas-area {
    position: static !important;
    width: 100% !important;
    height: auto !important;
  }

  :deep(.vue-flow__background) {
    display: none !important;
  }
}

/* Extra small (< 480px) */
@media (max-width: 480px) {
  .toolbar-title {
    font-size: var(--font-size-sm);
    gap: var(--space-1);
  }

  .title-icon {
    font-size: 16px;
  }

  .toolbar-right :deep(.el-button span) {
    display: none;
  }

  .toolbar-right :deep(.el-button) {
    min-width: 40px;
    padding: var(--space-2);
  }

  .sidebar-left {
    min-height: 240px;
    max-height: 280px;
  }

  .nodes-list {
    min-height: 140px;
    max-height: 160px;
  }

  .canvas-area {
    min-height: 280px;
    height: 40vh;
  }

  .node-card {
    min-width: 140px;
    padding: var(--space-2);
  }

  .node-card-header {
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .node-type-badge {
    width: 28px;
    height: 28px;
    font-size: 12px;
    border-radius: var(--radius-md);
  }

  .node-name {
    font-size: var(--font-size-xs);
  }

  .node-card-footer {
    padding-top: var(--space-2);
  }

  .prereq-tag :deep(.el-tag) {
    font-size: 10px;
    padding: 2px 6px;
  }

  .sidebar-footer {
    padding: var(--space-2);
  }

  .tip-text {
    font-size: 11px;
  }

  .detail-item {
    padding: var(--space-2);
  }

  .executor-item {
    padding: var(--space-2);
  }

  .executor-name {
    font-size: var(--font-size-xs);
  }

  :deep(.vue-flow__controls-button) {
    width: 30px;
    height: 30px;
    min-width: 30px;
    min-height: 30px;
  }

  :deep(.vue-flow__controls-button svg) {
    width: 14px;
    height: 14px;
  }
}

/* Landscape mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .flow-container {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .sidebar-left {
    width: 35%;
    max-height: none;
    height: calc(100vh - 120px);
    order: 1;
  }

  .canvas-area {
    width: 65%;
    height: calc(100vh - 120px);
    order: 2;
  }

  .sidebar-right {
    width: 100%;
    max-height: 280px;
    order: 3;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .node-card,
  .detail-item,
  .executor-item,
  :deep(.vue-flow__handle),
  :deep(.vue-flow__edge) {
    transition: none !important;
  }

  .node-card:hover {
    transform: none;
  }
}
</style>

<!-- Global styles for driver.js onboarding -->
<style>
/* Driver.js Onboarding Popover Styles */
.flow-onboarding-popover {
  --driver-popover-bg: #ffffff;
  --driver-popover-text: #1f2937;
  --driver-popover-title: #111827;
  --driver-popover-description: #4b5563;
  --driver-popover-progress: #3b82f6;
}

.flow-onboarding-popover .driver-popover {
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.flow-onboarding-popover .driver-popover-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--driver-popover-title);
  margin-bottom: 8px;
}

.flow-onboarding-popover .driver-popover-description {
  font-size: 14px;
  line-height: 1.6;
  color: var(--driver-popover-description);
}

.flow-onboarding-popover .driver-popover-progress-text {
  font-size: 12px;
  color: #9ca3af;
}

.flow-onboarding-popover .driver-popover-navigation-btns {
  gap: 8px;
}

.flow-onboarding-popover .driver-popover-prev-btn,
.flow-onboarding-popover .driver-popover-next-btn {
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.flow-onboarding-popover .driver-popover-prev-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.flow-onboarding-popover .driver-popover-prev-btn:hover {
  background: #e5e7eb;
}

.flow-onboarding-popover .driver-popover-next-btn {
  background: #3b82f6;
  color: white;
  border: none;
}

.flow-onboarding-popover .driver-popover-next-btn:hover {
  background: #2563eb;
}

.flow-onboarding-popover .driver-popover-close-btn {
  color: #9ca3af;
}

.flow-onboarding-popover .driver-popover-close-btn:hover {
  color: #374151;
}
</style>