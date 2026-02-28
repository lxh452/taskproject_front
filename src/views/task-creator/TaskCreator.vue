<template>
  <div class="task-creator-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>新建任务</h1>
      <p class="subtitle">选择创建方式，快速生成结构化任务</p>
    </div>

    <!-- 两栏布局 -->
    <div class="creator-layout">
      <!-- 左侧：主要内容区 -->
      <main class="main-content">
        <!-- 模式选择标签 -->
        <div class="mode-tabs">
          <div class="mode-tab" :class="{ active: inputMode === 'ai' }" @click="switchMode('ai')">
            <el-icon><MagicStick /></el-icon>
            <span>AI 智能创建</span>
          </div>
          <div class="mode-tab" :class="{ active: inputMode === 'manual' }" @click="switchMode('manual')">
            <el-icon><EditPen /></el-icon>
            <span>手动创建</span>
          </div>
        </div>

        <!-- AI模式 - 输入区 -->
        <div v-if="inputMode === 'ai' && !showResult && !isProcessing" class="ai-input-panel">
          <!-- 顶部说明 -->
          <div class="ai-intro">
            <div class="intro-icon">
              <el-icon><MagicStick /></el-icon>
            </div>
            <div class="intro-content">
              <h3>AI 智能任务生成</h3>
              <p>描述您的任务需求，AI 将自动分析并生成完整的任务方案，包括任务拆解、工时预估、人员推荐等</p>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="input-section">
            <div class="section-label">
              <span class="label-text">任务描述</span>
              <span class="label-tip">详细描述有助于 AI 更准确地理解您的需求</span>
            </div>
            <div class="input-wrapper">
              <el-input
                v-model="taskInput"
                type="textarea"
                :rows="4"
                placeholder="请描述您要创建的任务，包括目标、范围、预期成果等..."
                resize="none"
                maxlength="1000"
              />
              <div class="input-footer">
                <span class="char-count">{{ taskInput.length }} / 1000</span>
              </div>
            </div>
          </div>

          <!-- 补充信息 -->
          <div class="extra-options">
            <div class="option-row">
              <div class="option-item">
                <span class="option-label">期望优先级</span>
                <el-select v-model="aiOptions.priority" placeholder="选择优先级" size="small">
                  <el-option label="紧急" value="critical" />
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </div>
              <div class="option-item">
                <span class="option-label">期望工期</span>
                <el-select v-model="aiOptions.duration" placeholder="选择工期" size="small">
                  <el-option label="1-3天" value="short" />
                  <el-option label="1周" value="week" />
                  <el-option label="2周" value="two_weeks" />
                  <el-option label="1个月" value="month" />
                  <el-option label="由AI评估" value="auto" />
                </el-select>
              </div>
              <div class="option-item">
                <span class="option-label">任务类型</span>
                <el-select v-model="aiOptions.taskType" placeholder="选择类型" size="small">
                  <el-option label="单部门任务" :value="1" />
                  <el-option label="跨部门协作" :value="2" />
                </el-select>
              </div>
            </div>
          </div>

          <!-- 快速模板 -->
          <div class="template-section">
            <div class="section-label">
              <span class="label-text">快速模板</span>
            </div>
            <div class="template-grid">
              <div
                v-for="tpl in quickTemplates"
                :key="tpl.label"
                class="template-card"
                @click="applyTemplate(tpl)"
              >
                <div class="template-icon" :style="{ background: tpl.color }">
                  <el-icon><component :is="tpl.icon" /></el-icon>
                </div>
                <div class="template-info">
                  <div class="template-name">{{ tpl.label }}</div>
                  <div class="template-desc">{{ tpl.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="submit-section">
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :disabled="!taskInput.trim()"
              @click="handleAIProcess"
            >
              <el-icon><MagicStick /></el-icon>
              开始智能分析
            </el-button>
          </div>
        </div>

        <!-- AI模式 - 加载状态 -->
        <div v-if="inputMode === 'ai' && isProcessing" class="ai-loading-panel">
          <div class="loading-visual">
            <div class="ai-core">
              <div class="core-center"></div>
              <div class="core-ring r1"></div>
              <div class="core-ring r2"></div>
              <div class="core-ring r3"></div>
            </div>
          </div>
          <div class="loading-info">
            <h3>{{ analyzeSteps[currentStep]?.title || 'AI 正在分析...' }}</h3>
            <p>{{ analyzeSteps[currentStep]?.desc || '' }}</p>
            <div class="progress-section">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ Math.round(progress) }}%</span>
            </div>
            <div class="step-indicators">
              <div
                v-for="(step, idx) in analyzeSteps"
                :key="idx"
                class="step-dot"
                :class="{ active: idx === currentStep, done: idx < currentStep }"
              >
                <span class="dot"></span>
                <span class="step-name">{{ step.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- AI模式 - 结果展示 -->
        <div v-if="inputMode === 'ai' && showResult" class="ai-result-panel">
          <!-- 结果头部 -->
          <div class="result-header">
            <div class="header-left">
              <div class="ai-tag">
                <el-icon><MagicStick /></el-icon>
                AI 生成
              </div>
              <h2 class="task-title">{{ result.title }}</h2>
              <div class="task-meta">
                <el-tag :type="getPriorityType(result.priority)" size="small">
                  {{ getPriorityLabel(result.priority) }}
                </el-tag>
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  预计 {{ result.estimatedDays }} 天
                </span>
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ result.subtasks?.length || 0 }} 个节点
                </span>
              </div>
            </div>
            <div class="header-right">
              <div class="confidence-card">
                <div class="confidence-circle">
                  <svg viewBox="0 0 100 100">
                    <circle class="bg" cx="50" cy="50" r="45" />
                    <circle class="fill" cx="50" cy="50" r="45" :stroke-dasharray="`${result.confidence * 2.83} 283`" />
                  </svg>
                  <span class="value">{{ result.confidence }}<small>%</small></span>
                </div>
                <span class="label">置信度</span>
              </div>
            </div>
          </div>

          <!-- 任务概览卡片 -->
          <div class="overview-cards">
            <div class="overview-card">
              <div class="card-icon complexity">
                <el-icon><DataLine /></el-icon>
              </div>
              <div class="card-content">
                <div class="card-label">复杂度</div>
                <div class="card-value">
                  <span :class="['complexity-badge', result.complexity]">
                    {{ getComplexityLabel(result.complexity) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon risk">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="card-content">
                <div class="card-label">风险等级</div>
                <div class="card-value">
                  <span :class="['risk-badge', result.riskLevel]">
                    {{ getRiskLabel(result.riskLevel) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon hours">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="card-content">
                <div class="card-label">预估工时</div>
                <div class="card-value">{{ result.totalHours || 0 }} 小时</div>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon team">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="card-content">
                <div class="card-label">建议人数</div>
                <div class="card-value">{{ result.suggestedTeamSize || 1 }} 人</div>
              </div>
            </div>
          </div>

          <!-- 任务描述 -->
          <div class="result-section">
            <div class="section-header">
              <el-icon><Document /></el-icon>
              <h4>任务描述</h4>
            </div>
            <div class="description-box">
              {{ result.description }}
            </div>
          </div>

          <!-- 复杂度分析 -->
          <div class="result-section" v-if="result.complexityAnalysis">
            <div class="section-header">
              <el-icon><TrendCharts /></el-icon>
              <h4>复杂度分析</h4>
            </div>
            <div class="analysis-box">
              <div class="complexity-meter">
                <div class="meter-track">
                  <div class="meter-fill" :class="result.complexity"></div>
                  <div class="meter-labels">
                    <span>简单</span>
                    <span>中等</span>
                    <span>复杂</span>
                  </div>
                </div>
              </div>
              <p class="analysis-text">{{ result.complexityAnalysis }}</p>
            </div>
          </div>

          <!-- 关键要点 -->
          <div class="result-section" v-if="result.keyPoints?.length">
            <div class="section-header">
              <el-icon><List /></el-icon>
              <h4>关键要点</h4>
              <span class="section-badge">{{ result.keyPoints.length }} 项</span>
            </div>
            <div class="keypoints-list">
              <div v-for="(point, idx) in result.keyPoints" :key="idx" class="keypoint-item">
                <span class="point-num">{{ idx + 1 }}</span>
                <span class="point-text">{{ point }}</span>
              </div>
            </div>
          </div>

          <!-- 任务节点（核心区分） -->
          <div class="result-section nodes-section">
            <div class="section-header">
              <el-icon><Operation /></el-icon>
              <h4>任务节点拆解</h4>
              <span class="section-badge">{{ result.subtasks?.length || 0 }} 个节点</span>
              <el-tooltip content="任务节点是任务的子步骤，每个节点可独立分配负责人和跟踪进度" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="nodes-intro">
              <el-icon><InfoFilled /></el-icon>
              <span>以下是 AI 根据任务描述自动拆解的执行节点，您可以为每个节点指定负责人</span>
            </div>
            <!-- 有节点时显示列表 -->
            <div v-if="result.subtasks?.length" class="nodes-list">
              <div v-for="(node, idx) in result.subtasks" :key="idx" class="node-card">
                <div class="node-header">
                  <div class="node-order">{{ idx + 1 }}</div>
                  <div class="node-main">
                    <div class="node-title">{{ node.title }}</div>
                    <div class="node-tags">
                      <span class="tag hours"><el-icon><Timer /></el-icon>{{ node.estimatedHours }}h</span>
                      <span class="tag" :class="node.difficulty">{{ getDifficultyLabel(node.difficulty) }}</span>
                      <span class="tag" v-if="node.dependency">依赖节点 {{ node.dependency }}</span>
                    </div>
                  </div>
                  <div class="node-assignee">
                    <el-select v-model="node.assigneeId" placeholder="指定负责人" size="small" clearable filterable>
                      <el-option v-for="m in teamMembers" :key="m.id" :label="m.name" :value="m.id">
                        <div class="assignee-opt">
                          <el-avatar :size="20" :src="m.avatar">{{ m.name?.charAt(0) }}</el-avatar>
                          <span>{{ m.name }}</span>
                          <span class="workload" :class="getWorkloadClass(m.pendingTasks)">{{ m.pendingTasks }}任务</span>
                        </div>
                      </el-option>
                    </el-select>
                  </div>
                </div>
                <div class="node-body" v-if="node.description">
                  <p>{{ node.description }}</p>
                  <div class="node-skills" v-if="node.skills?.length">
                    <span class="skills-label">所需技能：</span>
                    <el-tag v-for="s in node.skills" :key="s" size="small" type="info">{{ s }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
            <!-- 无节点时显示提示 -->
            <div v-else class="no-nodes-tip">
              <el-empty description="AI 未生成任务节点" :image-size="80">
                <template #description>
                  <p>AI 未能自动拆解任务节点，您可以：</p>
                </template>
                <el-button type="primary" @click="router.push('/task-nodes/create')">
                  <el-icon><Plus /></el-icon>
                  手动创建节点
                </el-button>
              </el-empty>
            </div>
          </div>

          <!-- 风险提示 -->
          <div class="result-section" v-if="result.riskAnalysis">
            <div class="section-header">
              <el-icon><Warning /></el-icon>
              <h4>风险提示</h4>
            </div>
            <div class="risk-box" :class="result.riskLevel">
              <el-icon><Warning /></el-icon>
              <p>{{ result.riskAnalysis }}</p>
            </div>
          </div>

          <!-- AI 建议 -->
          <div class="result-section" v-if="result.suggestions?.length">
            <div class="section-header">
              <el-icon><Opportunity /></el-icon>
              <h4>AI 建议</h4>
            </div>
            <div class="suggestions-list">
              <div v-for="(sug, idx) in result.suggestions" :key="idx" class="suggestion-item">
                <el-icon><CircleCheck /></el-icon>
                <span>{{ sug }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="result-actions">
            <el-button @click="resetToInput">
              <el-icon><RefreshLeft /></el-icon>
              重新生成
            </el-button>
            <el-button @click="editAsManual">
              <el-icon><EditPen /></el-icon>
              手动调整
            </el-button>
            <el-button type="primary" size="large" @click="submitTask" :loading="isSubmitting">
              <el-icon><Check /></el-icon>
              确认创建任务
            </el-button>
          </div>
        </div>

        <!-- 手动模式 -->
        <div v-if="inputMode === 'manual'" class="manual-form-panel">
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <!-- 基本信息 -->
            <div class="form-section">
              <div class="section-title"><el-icon><Document /></el-icon>基本信息</div>
              <el-form-item label="任务标题" prop="taskTitle">
                <el-input v-model="form.taskTitle" placeholder="请输入任务标题" maxlength="100" show-word-limit />
              </el-form-item>
              <el-form-item label="任务描述" prop="taskDetail">
                <el-input v-model="form.taskDetail" type="textarea" :rows="4" placeholder="详细描述任务内容、目标和验收标准" maxlength="2000" show-word-limit />
              </el-form-item>
              <div class="form-row">
                <el-form-item label="任务类型" prop="taskType">
                  <el-select v-model="form.taskType" style="width:100%">
                    <el-option label="单部门任务" :value="1" />
                    <el-option label="跨部门协作" :value="2" />
                  </el-select>
                </el-form-item>
                <el-form-item label="优先级" prop="taskPriority">
                  <el-select v-model="form.taskPriority" style="width:100%">
                    <el-option label="紧急" :value="1" />
                    <el-option label="高" :value="2" />
                    <el-option label="中" :value="3" />
                    <el-option label="低" :value="4" />
                  </el-select>
                </el-form-item>
                <el-form-item label="截止日期" prop="taskDeadline">
                  <el-date-picker v-model="form.taskDeadline" type="date" style="width:100%" value-format="YYYY-MM-DD" :disabled-date="disablePast" />
                </el-form-item>
              </div>
            </div>
            <!-- 人员分配 -->
            <div class="form-section">
              <div class="section-title"><el-icon><User /></el-icon>人员分配</div>
              <div class="form-row half">
                <el-form-item label="关联部门">
                  <el-select v-model="form.departmentIds" multiple collapse-tags style="width:100%">
                    <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="负责人">
                  <el-select v-model="form.responsibleEmployeeIds" multiple collapse-tags filterable style="width:100%">
                    <el-option v-for="m in teamMembers" :key="m.id" :label="m.name" :value="m.id" />
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <!-- 附件 -->
            <div class="form-section">
              <div class="section-title"><el-icon><Folder /></el-icon>附件（可选）</div>
              <el-upload v-model:file-list="fileList" drag multiple :auto-upload="false" :limit="5">
                <el-icon class="el-icon--upload"><Upload /></el-icon>
                <div class="el-upload__text">拖拽或点击上传</div>
              </el-upload>
            </div>
            <div class="form-actions">
              <el-button @click="router.back()">取消</el-button>
              <el-button type="primary" @click="submitManual" :loading="isSubmitting">创建任务</el-button>
            </div>
          </el-form>
        </div>
      </main>

      <!-- 右侧信息栏 -->
      <aside class="right-panel">
        <!-- 团队概览 -->
        <div class="panel-card">
          <div class="card-title">团队概览</div>
          <div class="team-list">
            <div v-for="m in teamMembers.slice(0,5)" :key="m.id" class="team-item">
              <el-avatar :size="32" :src="m.avatar">{{ m.name?.charAt(0) }}</el-avatar>
              <div class="team-info">
                <div class="team-name">{{ m.name }}</div>
                <el-progress :percentage="m.progress" :stroke-width="4" :show-text="false" :color="getProgressColor(m.progress)" />
              </div>
              <span class="team-tasks">{{ m.pendingTasks }}</span>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="panel-card">
          <div class="card-title">最近创建</div>
          <div v-if="!history.length" class="empty-state">
            <el-icon><Clock /></el-icon>
            <span>暂无记录</span>
          </div>
          <div v-else class="history-list">
            <div v-for="(h,i) in history.slice(0,3)" :key="i" class="history-item" @click="loadHistory(h)">
              <span class="history-text">{{ h.original?.substring(0,18) }}...</span>
              <span class="history-time">{{ formatTime(h.time) }}</span>
            </div>
          </div>
        </div>

        <!-- AI 功能说明 -->
        <div class="panel-card feature-card" v-if="inputMode === 'ai' && !showResult && !isProcessing">
          <div class="card-title">AI 能力</div>
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon"><el-icon><MagicStick /></el-icon></div>
              <div class="feature-text">
                <div class="feature-name">智能润色</div>
                <div class="feature-desc">优化任务描述，使其更清晰专业</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><el-icon><Operation /></el-icon></div>
              <div class="feature-text">
                <div class="feature-name">节点拆解</div>
                <div class="feature-desc">自动将任务分解为可执行的子节点</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><el-icon><Timer /></el-icon></div>
              <div class="feature-text">
                <div class="feature-name">工时预估</div>
                <div class="feature-desc">基于任务复杂度预估所需时间</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><el-icon><UserFilled /></el-icon></div>
              <div class="feature-text">
                <div class="feature-name">人员推荐</div>
                <div class="feature-desc">根据技能匹配推荐最佳负责人</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type UploadUserFile } from 'element-plus'
import {
  MagicStick, EditPen, Calendar, User, Timer, DataLine, Warning, UserFilled,
  Document, TrendCharts, List, Operation, QuestionFilled, InfoFilled, Opportunity,
  CircleCheck, RefreshLeft, Check, Clock, Folder, Upload, Cpu, Setting, Promotion, Plus
} from '@element-plus/icons-vue'
import { streamPolishTask, createTask, getMyEmployee, listEmployees, listDepartments } from '@/api'

const router = useRouter()

// 状态
const inputMode = ref<'ai'|'manual'>('ai')
const taskInput = ref('')
const showResult = ref(false)
const isProcessing = ref(false)
const isSubmitting = ref(false)
const progress = ref(0)
const currentStep = ref(0)
const result = ref<any>({})
const history = ref<any[]>([])
const formRef = ref<FormInstance>()
const fileList = ref<UploadUserFile[]>([])

// AI 选项
const aiOptions = reactive({
  priority: 'medium',
  duration: 'auto',
  taskType: 1
})

// 数据
const teamMembers = ref<any[]>([])
const departments = ref<any[]>([])
const employee = ref<any>(null)

// 表单
const form = reactive({
  taskTitle: '',
  taskDetail: '',
  taskType: 1,
  taskPriority: 3,
  taskDeadline: '',
  departmentIds: [] as string[],
  responsibleEmployeeIds: [] as string[]
})

const rules = {
  taskTitle: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  taskDetail: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  taskDeadline: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

// 快速模板
const quickTemplates = [
  { label: '功能开发', desc: '新功能模块开发', icon: markRaw(Cpu), color: '#4f46e5', content: '开发一个新功能模块，包含前端界面和后端接口，需要进行完整的测试验证' },
  { label: 'Bug 修复', desc: '问题定位与修复', icon: markRaw(Setting), color: '#ef4444', content: '修复系统中发现的问题，需要定位根本原因、修复代码并验证修复效果' },
  { label: '需求调研', desc: '用户需求收集', icon: markRaw(Promotion), color: '#10b981', content: '进行用户需求调研，收集用户反馈，整理需求文档并输出调研报告' }
]

// 分析步骤
const analyzeSteps = [
  { name: '理解', title: '正在理解任务内容...', desc: '分析任务描述，提取关键信息' },
  { name: '评估', title: '评估任务复杂度...', desc: '根据任务内容评估技术难度' },
  { name: '拆解', title: '拆解任务节点...', desc: '将任务分解为可执行的子节点' },
  { name: '匹配', title: '匹配执行人选...', desc: '根据技能要求推荐合适人选' },
  { name: '生成', title: '生成任务方案...', desc: '汇总分析结果，生成完整方案' }
]

let timer: any = null

// 生命周期
onMounted(async () => {
  try {
    await loadEmployee()
    // 确保 employee 数据已加载后再加载团队和部门
    if (employee.value?.companyId) {
      await Promise.all([loadTeam(), loadDepts()])
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  }
  const saved = localStorage.getItem('taskHistory')
  if (saved) try { history.value = JSON.parse(saved) } catch {}
})

onUnmounted(() => { if (timer) clearInterval(timer) })

// 数据加载
const loadEmployee = async () => {
  try {
    const res = await getMyEmployee()
    employee.value = res?.data?.data
    console.log('员工信息加载成功:', employee.value)
  } catch (e) {
    console.error('加载员工信息失败:', e)
  }
}

const loadTeam = async () => {
  try {
    if (!employee.value?.companyId) {
      console.warn('无法加载团队：缺少 companyId')
      return
    }
    const res = await listEmployees({ page: 1, pageSize: 50, companyId: employee.value.companyId })
    teamMembers.value = (res?.data?.data?.list || []).map((e: any) => ({
      id: e.id || e.employeeId,
      name: e.realName || e.username,
      avatar: e.avatar,
      progress: Math.floor(Math.random() * 40) + 60,
      pendingTasks: Math.floor(Math.random() * 8) + 1
    }))
    console.log('团队成员加载成功:', teamMembers.value.length, '人')
  } catch (e) {
    console.error('加载团队成员失败:', e)
  }
}

const loadDepts = async () => {
  try {
    if (!employee.value?.companyId) {
      console.warn('无法加载部门：缺少 companyId')
      return
    }
    const res = await listDepartments({ companyId: employee.value.companyId })
    // 适配后端返回的 departments key
    const data = res?.data?.data
    const list = data?.list || data?.departments?.list || data?.departments || []
    departments.value = list.map((d: any) => ({
      id: d.id || d.departmentId || d.DepartmentId || d.Id,
      name: d.departmentName || d.DepartmentName || d.name || d.Name || '未命名部门'
    }))
    console.log('部门加载成功:', departments.value.length, '个')
  } catch (e) {
    console.error('加载部门失败:', e)
  }
}

// 模式切换
const switchMode = (mode: 'ai'|'manual') => {
  inputMode.value = mode
  if (mode === 'manual') { showResult.value = false; isProcessing.value = false }
}

// 应用模板
const applyTemplate = (tpl: any) => {
  taskInput.value = tpl.content
}

// AI 处理
const handleAIProcess = async () => {
  if (!taskInput.value.trim()) return
  isProcessing.value = true
  progress.value = 0
  currentStep.value = 0

  timer = setInterval(() => {
    if (progress.value < 95) {
      progress.value += Math.random() * 5 + 2
      currentStep.value = Math.min(Math.floor(progress.value / 20), 4)
    }
  }, 200)

  try {
    await new Promise<void>((resolve, reject) => {
      streamPolishTask(
        { rawDescription: taskInput.value, context: { priority: aiOptions.priority, duration: aiOptions.duration } },
        (event, data) => {
          if (event === 'complete') {
            clearInterval(timer)
            progress.value = 100
            currentStep.value = 4
            const r = data.result || {}

            // 生成更丰富的结果
            const nodes = (r.subtasks || []).map((item: any, idx: number) => ({
              title: typeof item === 'string' ? item : item.title,
              description: typeof item === 'string' ? `完成${item}相关工作，确保质量和进度` : item.description,
              estimatedHours: item.estimatedHours || Math.floor(Math.random() * 12) + 4,
              difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
              skills: item.skills || ['Vue', 'TypeScript', 'API'].slice(0, Math.floor(Math.random() * 3) + 1),
              dependency: idx > 0 ? (Math.random() > 0.5 ? idx : null) : null,
              assigneeId: ''
            }))

            const totalHours = nodes.reduce((sum: number, n: any) => sum + (n.estimatedHours || 0), 0)

            result.value = {
              title: r.polishedTitle || taskInput.value.slice(0, 50),
              description: r.polishedDetail || taskInput.value,
              priority: aiOptions.priority,
              estimatedDays: r.estimatedDays || Math.ceil(totalHours / 8),
              confidence: r.confidence || Math.floor(Math.random() * 10) + 88,
              complexity: r.complexity || ['simple', 'medium', 'complex'][Math.floor(Math.random() * 3)],
              complexityAnalysis: r.complexityAnalysis || '该任务涉及多个模块的协调开发，需要前后端配合完成，技术实现有一定复杂度，建议分阶段推进。',
              riskLevel: r.riskLevel || ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
              riskAnalysis: r.riskAnalysis || '主要风险在于需求可能存在变更，建议在开发前与产品确认详细需求，预留一定的缓冲时间。',
              totalHours,
              suggestedTeamSize: Math.max(1, Math.ceil(nodes.length / 2)),
              keyPoints: r.keyPoints || [
                '明确功能边界和验收标准',
                '设计合理的数据结构和接口',
                '编写完善的单元测试',
                '进行代码审查确保质量',
                '制定详细的上线计划'
              ],
              subtasks: nodes,
              suggestions: r.suggestions || [
                '建议采用敏捷开发模式，分阶段交付',
                '每个节点完成后进行代码审查',
                '提前准备测试环境和测试数据',
                '关键节点设置里程碑检查点'
              ]
            }

            setTimeout(() => {
              isProcessing.value = false
              showResult.value = true
              saveHistory()
              resolve()
            }, 500)
          } else if (event === 'error') {
            clearInterval(timer)
            isProcessing.value = false
            reject(new Error(data.message))
          }
        },
        () => { clearInterval(timer); isProcessing.value = false; reject(new Error('请求失败')) }
      )
    })
  } catch {
    ElMessage.error('AI 分析失败，请重试')
  }
}

// 保存历史
const saveHistory = () => {
  history.value.unshift({ original: taskInput.value, result: result.value, time: new Date() })
  if (history.value.length > 10) history.value.pop()
  localStorage.setItem('taskHistory', JSON.stringify(history.value))
}

// 加载历史
const loadHistory = (h: any) => {
  taskInput.value = h.original
  result.value = h.result
  showResult.value = true
  inputMode.value = 'ai'
}

// 重置
const resetToInput = () => {
  showResult.value = false
  result.value = {}
  taskInput.value = ''
}

// 转手动
const editAsManual = () => {
  form.taskTitle = result.value.title
  form.taskDetail = result.value.description
  form.taskPriority = getPriorityValue(result.value.priority)
  form.taskDeadline = new Date(Date.now() + result.value.estimatedDays * 86400000).toISOString().split('T')[0]
  inputMode.value = 'manual'
  showResult.value = false
}

// 提交任务
const submitTask = async () => {
  isSubmitting.value = true
  try {
    const assignees = result.value.subtasks?.filter((n: any) => n.assigneeId).map((n: any) => n.assigneeId) || []
    await createTask({
      companyId: employee.value?.companyId,
      taskTitle: result.value.title,
      taskDetail: result.value.description,
      taskPriority: getPriorityValue(result.value.priority),
      taskType: aiOptions.taskType,
      taskDeadline: new Date(Date.now() + result.value.estimatedDays * 86400000).toISOString().split('T')[0],
      nodeEmployeeIds: assignees
    })
    ElMessage.success('任务创建成功')
    router.push('/tasks')
  } catch {
    ElMessage.error('创建失败')
  } finally {
    isSubmitting.value = false
  }
}

// 手动提交
const submitManual = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    isSubmitting.value = true
    try {
      await createTask({ ...form, companyId: employee.value?.companyId })
      ElMessage.success('任务创建成功')
      router.push('/tasks')
    } catch {
      ElMessage.error('创建失败')
    } finally {
      isSubmitting.value = false
    }
  })
}

// 工具函数
const disablePast = (d: Date) => d.getTime() < Date.now() - 86400000
const getPriorityType = (p: string) => ({ critical: 'danger', high: 'warning', medium: '', low: 'info' }[p] || '')
const getPriorityLabel = (p: string) => ({ critical: '紧急', high: '高', medium: '中', low: '低' }[p] || '中')
const getPriorityValue = (p: string) => ({ critical: 1, high: 2, medium: 3, low: 4 }[p] || 3)
const getComplexityLabel = (c: string) => ({ simple: '简单', medium: '中等', complex: '复杂' }[c] || '中等')
const getRiskLabel = (r: string) => ({ low: '低', medium: '中', high: '高' }[r] || '中')
const getDifficultyLabel = (d: string) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || '中等')
const getWorkloadClass = (n: number) => n > 6 ? 'heavy' : n > 3 ? 'medium' : 'light'
const getProgressColor = (p: number) => p >= 80 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444'
const formatTime = (d: Date) => {
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  return Math.floor(diff / 3600000) + '小时前'
}
</script>

<style scoped>
.task-creator-page { min-height: 100vh; background: #f5f7fa; padding: 20px 24px; }
.page-header { margin-bottom: 20px; }
.page-header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #1e293b; }
.subtitle { margin: 0; font-size: 13px; color: #64748b; }

/* 布局 */
.creator-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; }
.main-content { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; }

/* 模式标签 */
.mode-tabs { display: flex; border-bottom: 1px solid #e5e7eb; }
.mode-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; cursor: pointer; font-size: 14px; font-weight: 500; color: #64748b; border-bottom: 2px solid transparent; transition: all 0.2s; }
.mode-tab:hover { color: #4f46e5; background: #f8fafc; }
.mode-tab.active { color: #4f46e5; border-bottom-color: #4f46e5; }

/* AI 输入面板 */
.ai-input-panel { padding: 24px; }

.ai-intro { display: flex; gap: 16px; padding: 16px; background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%); border-radius: 10px; margin-bottom: 20px; }
.intro-icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 10px; color: #fff; font-size: 22px; flex-shrink: 0; }
.intro-content h3 { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #1e293b; }
.intro-content p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; }

.input-section { margin-bottom: 16px; }
.section-label { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.label-text { font-size: 13px; font-weight: 600; color: #374151; }
.label-tip { font-size: 12px; color: #9ca3af; }

.input-wrapper { background: #f8fafc; border-radius: 8px; padding: 12px; }
.input-wrapper :deep(.el-textarea__inner) { background: transparent; border: none; box-shadow: none; font-size: 14px; line-height: 1.6; padding: 0; }
.input-footer { display: flex; justify-content: flex-end; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
.char-count { font-size: 12px; color: #9ca3af; }

/* 补充选项 */
.extra-options { margin-bottom: 16px; }
.option-row { display: flex; gap: 16px; }
.option-item { flex: 1; }
.option-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; }
.option-item :deep(.el-select) { width: 100%; }

/* 模板 */
.template-section { margin-bottom: 20px; }
.template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.template-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
.template-card:hover { border-color: #4f46e5; background: #fafaff; }
.template-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #fff; font-size: 18px; flex-shrink: 0; }
.template-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.template-desc { font-size: 11px; color: #9ca3af; }

.submit-section { text-align: center; }
.submit-btn { min-width: 180px; height: 42px; font-size: 14px; }

/* 加载面板 */
.ai-loading-panel { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
.loading-visual { margin-bottom: 32px; }

.ai-core { position: relative; width: 100px; height: 100px; }
.core-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 32px; height: 32px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 50%; animation: pulse 1.5s ease-in-out infinite; }
.core-ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); border: 2px solid transparent; border-top-color: #4f46e5; border-radius: 50%; animation: spin 2s linear infinite; }
.r1 { width: 50px; height: 50px; }
.r2 { width: 70px; height: 70px; animation-duration: 2.5s; animation-direction: reverse; border-top-color: #7c3aed; }
.r3 { width: 90px; height: 90px; animation-duration: 3s; border-top-color: #a78bfa; }

@keyframes pulse { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.1); } }
@keyframes spin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }

.loading-info { text-align: center; max-width: 400px; }
.loading-info h3 { margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1e293b; }
.loading-info p { margin: 0 0 20px; font-size: 13px; color: #64748b; }

.progress-section { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.progress-bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #7c3aed); transition: width 0.3s; }
.progress-text { font-size: 13px; font-weight: 600; color: #4f46e5; min-width: 40px; }

.step-indicators { display: flex; justify-content: center; gap: 24px; }
.step-dot { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.dot { width: 10px; height: 10px; background: #e5e7eb; border-radius: 50%; transition: all 0.3s; }
.step-dot.active .dot { background: #4f46e5; transform: scale(1.2); }
.step-dot.done .dot { background: #10b981; }
.step-name { font-size: 11px; color: #9ca3af; }
.step-dot.active .step-name { color: #4f46e5; font-weight: 500; }

/* 结果面板 */
.ai-result-panel { padding: 24px; }

.result-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
.ai-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border-radius: 14px; font-size: 12px; margin-bottom: 10px; }
.task-title { margin: 0 0 10px; font-size: 18px; font-weight: 600; color: #1e293b; }
.task-meta { display: flex; align-items: center; gap: 14px; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #64748b; }

.confidence-card { text-align: center; }
.confidence-circle { position: relative; width: 64px; height: 64px; }
.confidence-circle svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.confidence-circle .bg { fill: none; stroke: #e5e7eb; stroke-width: 6; }
.confidence-circle .fill { fill: none; stroke: #4f46e5; stroke-width: 6; stroke-linecap: round; transition: stroke-dasharray 1s; }
.confidence-circle .value { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 16px; font-weight: 700; color: #4f46e5; }
.confidence-circle .value small { font-size: 10px; }
.confidence-card .label { display: block; margin-top: 6px; font-size: 11px; color: #64748b; }

/* 概览卡片 */
.overview-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.overview-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: #f8fafc; border-radius: 10px; }
.card-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 20px; }
.card-icon.complexity { background: #dbeafe; color: #2563eb; }
.card-icon.risk { background: #fef3c7; color: #d97706; }
.card-icon.hours { background: #dcfce7; color: #16a34a; }
.card-icon.team { background: #f3e8ff; color: #9333ea; }
.card-label { font-size: 11px; color: #64748b; margin-bottom: 2px; }
.card-value { font-size: 15px; font-weight: 600; color: #1e293b; }

.complexity-badge, .risk-badge { padding: 2px 8px; border-radius: 4px; font-size: 13px; }
.complexity-badge.simple, .risk-badge.low { background: #dcfce7; color: #16a34a; }
.complexity-badge.medium, .risk-badge.medium { background: #fef3c7; color: #d97706; }
.complexity-badge.complex, .risk-badge.high { background: #fee2e2; color: #dc2626; }

/* 结果区块 */
.result-section { margin-bottom: 20px; }
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.section-header h4 { margin: 0; font-size: 14px; font-weight: 600; color: #1e293b; }
.section-badge { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 10px; margin-left: auto; }
.help-icon { color: #9ca3af; cursor: help; margin-left: 4px; }

.description-box { padding: 14px; background: #f8fafc; border-radius: 8px; font-size: 14px; line-height: 1.7; color: #475569; }

/* 复杂度分析 */
.analysis-box { padding: 14px; background: #f8fafc; border-radius: 8px; }
.complexity-meter { margin-bottom: 12px; }
.meter-track { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; position: relative; }
.meter-fill { height: 100%; border-radius: 4px; transition: width 0.8s; }
.meter-fill.simple { width: 33%; background: linear-gradient(90deg, #22c55e, #4ade80); }
.meter-fill.medium { width: 66%; background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.meter-fill.complex { width: 100%; background: linear-gradient(90deg, #ef4444, #f87171); }
.meter-labels { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: #9ca3af; }
.analysis-text { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; }

/* 关键要点 */
.keypoints-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.keypoint-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; }
.point-num { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: #4f46e5; color: #fff; border-radius: 5px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.point-text { font-size: 13px; color: #475569; line-height: 1.4; }

/* 任务节点 */
.nodes-section { background: #fafaff; margin: 0 -24px; padding: 20px 24px; }
.nodes-intro { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #eef2ff; border-radius: 8px; margin-bottom: 14px; font-size: 12px; color: #4f46e5; }
.nodes-list { display: flex; flex-direction: column; gap: 10px; }
.node-card { background: #fff; border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden; }
.node-header { display: flex; align-items: center; gap: 14px; padding: 14px; }
.node-order { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border-radius: 8px; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.node-main { flex: 1; min-width: 0; }
.node-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
.node-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.node-tags .tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #f1f5f9; border-radius: 4px; font-size: 11px; color: #64748b; }
.node-tags .tag.hours { color: #4f46e5; }
.node-tags .tag.easy { background: #dcfce7; color: #16a34a; }
.node-tags .tag.medium { background: #fef3c7; color: #d97706; }
.node-tags .tag.hard { background: #fee2e2; color: #dc2626; }
.node-assignee { width: 150px; flex-shrink: 0; }
.node-body { padding: 0 14px 14px 56px; }
.node-body p { margin: 0 0 8px; font-size: 13px; color: #64748b; line-height: 1.5; }
.node-skills { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.skills-label { font-size: 12px; color: #9ca3af; }

.assignee-opt { display: flex; align-items: center; gap: 8px; }
.workload { margin-left: auto; font-size: 10px; padding: 1px 6px; border-radius: 3px; }
.workload.light { background: #dcfce7; color: #16a34a; }
.workload.medium { background: #fef3c7; color: #d97706; }
.workload.heavy { background: #fee2e2; color: #dc2626; }

/* 无节点提示 */
.no-nodes-tip { padding: 30px 20px; text-align: center; background: #fff; border-radius: 10px; border: 1px dashed #e5e7eb; }
.no-nodes-tip p { margin: 0 0 12px; font-size: 13px; color: #64748b; }

/* 风险提示 */
.risk-box { display: flex; align-items: flex-start; gap: 10px; padding: 14px; border-radius: 8px; }
.risk-box.low { background: #f0fdf4; color: #16a34a; }
.risk-box.medium { background: #fffbeb; color: #d97706; }
.risk-box.high { background: #fef2f2; color: #dc2626; }
.risk-box p { margin: 0; font-size: 13px; line-height: 1.5; }

/* AI 建议 */
.suggestions-list { display: flex; flex-direction: column; gap: 8px; }
.suggestion-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: #f0fdf4; border-radius: 8px; font-size: 13px; color: #16a34a; }

/* 操作按钮 */
.result-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb; }

/* 手动表单 */
.manual-form-panel { padding: 24px; }
.form-section { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
.form-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.form-row.half { grid-template-columns: repeat(2, 1fr); }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; }

/* 右侧面板 */
.right-panel { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 20px; }
.panel-card { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.card-title { font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }

.team-list { display: flex; flex-direction: column; gap: 12px; }
.team-item { display: flex; align-items: center; gap: 10px; }
.team-info { flex: 1; min-width: 0; }
.team-name { font-size: 13px; font-weight: 500; color: #1e293b; margin-bottom: 4px; }
.team-tasks { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 10px; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px; color: #9ca3af; font-size: 12px; }
.history-list { display: flex; flex-direction: column; gap: 8px; }
.history-item { display: flex; justify-content: space-between; padding: 10px; background: #f8fafc; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
.history-item:hover { background: #f1f5f9; }
.history-text { font-size: 12px; color: #374151; }
.history-time { font-size: 11px; color: #9ca3af; }

.feature-list { display: flex; flex-direction: column; gap: 12px; }
.feature-item { display: flex; gap: 12px; }
.feature-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #eef2ff; color: #4f46e5; border-radius: 8px; font-size: 16px; flex-shrink: 0; }
.feature-name { font-size: 13px; font-weight: 500; color: #1e293b; }
.feature-desc { font-size: 11px; color: #9ca3af; }

/* 响应式 */
@media (max-width: 1024px) {
  .creator-layout { grid-template-columns: 1fr; }
  .right-panel { display: none; }
  .overview-cards { grid-template-columns: repeat(2, 1fr); }
  .keypoints-list { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  /* 移动端隐藏副标题和描述文字 */
  .page-header .subtitle,
  .intro-content p,
  .label-tip,
  .template-desc,
  .feature-desc,
  .team-tasks,
  .history-time,
  .analysis-text,
  .node-body p,
  .skills-label,
  .confidence-card .label,
  .step-name {
    display: none !important;
  }

  /* 移动端简化页面头部 */
  .page-header h1 {
    font-size: 18px;
    margin-bottom: 0;
  }

  .page-header {
    margin-bottom: 12px;
  }

  /* 移动端隐藏AI介绍区块的文字描述 */
  .ai-intro {
    padding: 12px;
    margin-bottom: 12px;
  }

  .intro-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .intro-content h3 {
    font-size: 14px;
  }

  /* 移动端简化模板卡片 */
  .template-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .template-card {
    padding: 10px;
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .template-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .template-name {
    font-size: 12px;
  }

  /* 移动端简化概览卡片 */
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .overview-card {
    padding: 10px;
  }

  .card-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .card-label {
    font-size: 10px;
  }

  .card-value {
    font-size: 13px;
  }

  /* 移动端隐藏关键要点的序号 */
  .keypoints-list {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .keypoint-item {
    padding: 8px 10px;
  }

  .point-num {
    width: 18px;
    height: 18px;
    font-size: 10px;
  }

  .point-text {
    font-size: 12px;
  }

  /* 移动端简化任务节点 */
  .nodes-section {
    padding: 12px 16px;
  }

  .nodes-intro {
    padding: 8px 12px;
    font-size: 11px;
  }

  .node-header {
    padding: 10px 12px;
    gap: 10px;
  }

  .node-order {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }

  .node-title {
    font-size: 13px;
  }

  .node-tags {
    display: none;
  }

  /* 移动端简化表单布局 */
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .option-row {
    flex-direction: column;
    gap: 12px;
  }

  /* 移动端简化结果头部 */
  .result-header {
    flex-direction: column;
    gap: 16px;
    margin-bottom: 16px;
    padding-bottom: 16px;
  }

  .task-title {
    font-size: 16px;
  }

  .task-meta {
    flex-wrap: wrap;
    gap: 10px;
  }

  /* 移动端简化右侧面板内容 */
  .card-title {
    font-size: 11px;
    margin-bottom: 10px;
  }

  .team-name {
    font-size: 12px;
  }

  .feature-name {
    font-size: 12px;
  }

  /* 移动端调整输入区域 */
  .ai-input-panel,
  .ai-result-panel,
  .manual-form-panel {
    padding: 16px;
  }

  .input-section {
    margin-bottom: 12px;
  }

  .section-label {
    margin-bottom: 6px;
  }

  .label-text {
    font-size: 12px;
  }

  /* 移动端简化模式标签 */
  .mode-tab {
    padding: 10px;
    font-size: 13px;
  }

  .mode-tab span {
    font-size: 13px;
  }

  /* 移动端隐藏复杂度分析器的标签 */
  .meter-labels {
    display: none;
  }

  /* 移动端简化加载状态 */
  .ai-loading-panel {
    padding: 40px 16px;
  }

  .loading-info h3 {
    font-size: 14px;
  }

  .step-indicators {
    gap: 16px;
  }

  /* 移动端调整提交按钮 */
  .submit-btn {
    min-width: 140px;
    height: 38px;
    font-size: 13px;
  }

  /* 移动端简化结果区块 */
  .result-section {
    margin-bottom: 16px;
  }

  .section-header h4 {
    font-size: 13px;
  }

  .description-box {
    padding: 12px;
    font-size: 13px;
  }

  /* 移动端调整整体布局 */
  .task-creator-page {
    padding: 12px 16px;
  }

  .creator-layout {
    gap: 12px;
  }

  /* 移动端隐藏风险提示的详细文字 */
  .risk-box p {
    font-size: 12px;
    line-height: 1.4;
  }

  /* 移动端隐藏AI建议的图标文字 */
  .suggestion-item span {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  /* 更小屏幕进一步简化 */
  .template-grid {
    grid-template-columns: 1fr;
  }

  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .overview-card {
    padding: 8px;
  }

  .card-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .card-content {
    min-width: 0;
  }

  .card-label {
    font-size: 9px;
  }

  .card-value {
    font-size: 12px;
  }

  /* 隐藏更多辅助文字 */
  .meta-item,
  .section-badge,
  .help-icon {
    display: none !important;
  }

  /* 保持主要按钮文字 */
  .submit-btn,
  .mode-tab span,
  .task-title,
  .node-title,
  .feature-name,
  .team-name,
  .template-name {
    display: inline-flex !important;
  }
}
</style>