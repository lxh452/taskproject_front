import { ref, nextTick } from 'vue'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const ONBOARDING_KEY = 'flow_onboarding_completed'

// 单例状态
let driverInstance: ReturnType<typeof driver> | null = null

export function useFlowOnboarding() {
  const isOnboardingActive = ref(false)
  const hasCompletedOnboarding = ref(false)

  // 检查是否已完成引导
  function checkOnboardingStatus(): boolean {
    const completed = localStorage.getItem(ONBOARDING_KEY)
    hasCompletedOnboarding.value = completed === 'true'
    return hasCompletedOnboarding.value
  }

  // 标记引导已完成
  function markOnboardingComplete() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    hasCompletedOnboarding.value = true
    isOnboardingActive.value = false
  }

  // 重置引导状态
  function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY)
    hasCompletedOnboarding.value = false
  }

  // 停止引导
  function stopOnboarding() {
    if (driverInstance) {
      driverInstance.destroy()
      driverInstance = null
    }
    isOnboardingActive.value = false
  }

  // 动态获取引导步骤
  function getSteps() {
    const steps: any[] = []

    // 任务选择器
    if (document.querySelector('.task-selector')) {
      steps.push({
        element: '.task-selector',
        popover: {
          title: '选择任务',
          description: '首先选择一个任务，查看该任务下的所有节点',
          side: 'bottom',
          align: 'start'
        }
      })
    }

    // 左侧面板
    if (document.querySelector('.sidebar-left')) {
      steps.push({
        element: '.sidebar-left',
        popover: {
          title: '节点面板',
          description: '这里显示节点库和节点详情。未选中节点时显示节点库，选中节点后自动切换为详情面板',
          side: 'right',
          align: 'start'
        }
      })
    }

    // 画布区域
    if (document.querySelector('.canvas-area')) {
      steps.push({
        element: '.canvas-area',
        popover: {
          title: '流程画布',
          description: '将节点从左侧面板拖拽到画布上，建立流程关系。点击节点可查看详情',
          side: 'left',
          align: 'center'
        }
      })
    }

    // 画布控制
    if (document.querySelector('.vue-flow__controls')) {
      steps.push({
        element: '.vue-flow__controls',
        popover: {
          title: '画布控制',
          description: '使用这些按钮可以缩放、居中和全屏显示画布',
          side: 'top',
          align: 'end'
        }
      })
    }

    // 保存按钮
    if (document.querySelector('[title="保存流程"]')) {
      steps.push({
        element: '[title="保存流程"]',
        popover: {
          title: '保存流程',
          description: '完成流程设计后，点击此按钮保存流程配置',
          side: 'bottom',
          align: 'end'
        }
      })
    }

    // 帮助按钮
    if (document.querySelector('[title="帮助引导"]')) {
      steps.push({
        element: '[title="帮助引导"]',
        popover: {
          title: '帮助引导',
          description: '随时点击此按钮可以重新查看引导教程',
          side: 'bottom',
          align: 'end'
        }
      })
    }

    return steps
  }

  // 启动引导
  function startOnboarding() {
    // 如果已经在运行，先停止
    stopOnboarding()

    nextTick(() => {
      const steps = getSteps()

      if (steps.length === 0) {
        console.warn('没有找到可引导的元素')
        return
      }

      driverInstance = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        stagePadding: 10,
        stageRadius: 8,
        popoverClass: 'flow-onboarding-popover',
        progressText: '{{current}} / {{total}}',
        nextBtnText: '下一步',
        prevBtnText: '上一步',
        doneBtnText: '完成',
        onCloseClick: () => {
          stopOnboarding()
          markOnboardingComplete()
        },
        onDestroyStarted: () => {
          isOnboardingActive.value = false
        },
        onDestroyed: () => {
          markOnboardingComplete()
          driverInstance = null
        },
        steps
      })

      isOnboardingActive.value = true
      driverInstance.drive()
    })
  }

  // 首次进入自动触发引导
  function initOnboarding() {
    if (!checkOnboardingStatus()) {
      setTimeout(() => {
        startOnboarding()
      }, 1000)
    }
  }

  return {
    isOnboardingActive,
    hasCompletedOnboarding,
    startOnboarding,
    stopOnboarding,
    resetOnboarding,
    initOnboarding,
    checkOnboardingStatus
  }
}
