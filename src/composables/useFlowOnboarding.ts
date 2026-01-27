import { ref, onMounted, nextTick } from 'vue'
import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

const ONBOARDING_KEY = 'flow_onboarding_completed'

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
  }

  // 重置引导状态（用于测试或重新触发）
  function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY)
    hasCompletedOnboarding.value = false
  }

  // 引导步骤配置
  const steps: DriveStep[] = [
    {
      element: '.task-selector',
      popover: {
        title: '选择任务',
        description: '首先选择一个任务，查看该任务下的所有节点',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '.sidebar-right',
      popover: {
        title: '智能面板',
        description: '这里显示节点库和节点详情。未选中节点时显示节点库，选中节点后自动切换为详情面板',
        side: 'left',
        align: 'start'
      }
    },
    {
      element: '.canvas-area',
      popover: {
        title: '流程画布',
        description: '将节点从右侧面板拖拽到画布上，建立流程关系。点击节点可查看详情',
        side: 'left',
        align: 'center'
      }
    },
    {
      element: '.vue-flow__controls',
      popover: {
        title: '画布控制',
        description: '使用这些按钮可以缩放、居中和全屏显示画布',
        side: 'top',
        align: 'end'
      }
    },
    {
      element: '[title="保存流程"]',
      popover: {
        title: '保存流程',
        description: '完成流程设计后，点击此按钮保存流程配置',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '[title="帮助引导"]',
      popover: {
        title: '帮助引导',
        description: '随时点击此按钮可以重新查看引导教程',
        side: 'bottom',
        align: 'end'
      }
    }
  ]

  // 创建 driver 实例
  function createDriver() {
    return driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      stagePadding: 10,
      stageRadius: 8,
      popoverClass: 'flow-onboarding-popover',
      progressText: '{{current}} / {{total}}',
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '完成',
      onDestroyStarted: () => {
        isOnboardingActive.value = false
        markOnboardingComplete()
      },
      steps
    })
  }

  // 启动引导
  function startOnboarding() {
    // 等待 DOM 更新
    nextTick(() => {
      const driverObj = createDriver()
      isOnboardingActive.value = true
      driverObj.drive()
    })
  }

  // 首次进入自动触发引导
  function initOnboarding() {
    if (!checkOnboardingStatus()) {
      // 延迟启动，确保页面完全加载
      setTimeout(() => {
        startOnboarding()
      }, 1000)
    }
  }

  return {
    isOnboardingActive,
    hasCompletedOnboarding,
    startOnboarding,
    resetOnboarding,
    initOnboarding,
    checkOnboardingStatus
  }
}
