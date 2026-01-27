declare module 'driver.js' {
  export interface PopoverConfig {
    title?: string
    description?: string
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
  }

  export interface DriveStep {
    element?: string | HTMLElement
    popover?: PopoverConfig
  }

  export interface DriverConfig {
    showProgress?: boolean
    animate?: boolean
    allowClose?: boolean
    overlayColor?: string
    stagePadding?: number
    stageRadius?: number
    popoverClass?: string
    progressText?: string
    nextBtnText?: string
    prevBtnText?: string
    doneBtnText?: string
    onDestroyStarted?: () => void
    onDestroyed?: () => void
    onHighlightStarted?: (element: HTMLElement | undefined, step: DriveStep, options: { config: DriverConfig; state: any }) => void
    onHighlighted?: (element: HTMLElement | undefined, step: DriveStep, options: { config: DriverConfig; state: any }) => void
    onDeselected?: (element: HTMLElement | undefined, step: DriveStep, options: { config: DriverConfig; state: any }) => void
    steps?: DriveStep[]
  }

  export interface Driver {
    drive: (stepIndex?: number) => void
    moveNext: () => void
    movePrevious: () => void
    moveTo: (stepIndex: number) => void
    hasNextStep: () => boolean
    hasPreviousStep: () => boolean
    isFirstStep: () => boolean
    isLastStep: () => boolean
    getActiveIndex: () => number | undefined
    getActiveStep: () => DriveStep | undefined
    getActiveElement: () => HTMLElement | undefined
    getPreviousElement: () => HTMLElement | undefined
    getPreviousStep: () => DriveStep | undefined
    isActive: () => boolean
    refresh: () => void
    destroy: () => void
  }

  export function driver(config?: DriverConfig): Driver
}

declare module 'driver.js/dist/driver.css' {
  const content: string
  export default content
}
