/**
 * 监控和日志配置
 * 提供错误监控、性能监控和日志记录功能
 */

// 初始化错误监控（Sentry）
export function initErrorMonitoring() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN
  
  if (sentryDsn && import.meta.env.PROD) {
    // 实际项目中应使用 Sentry SDK
    console.log('错误监控已初始化:', sentryDsn)
  }
}

// 初始化性能监控
export function initPerformanceMonitoring() {
  if (import.meta.env.PROD && 'performance' in window) {
    // Web Vitals 监控
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('Performance metric:', entry.name, entry.duration)
      }
    })
    
    observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] })
  }
}

// 初始化分析工具
export function initAnalytics() {
  const analyticsId = import.meta.env.VITE_ANALYTICS_ID
  
  if (analyticsId && import.meta.env.PROD) {
    // 实际项目中应使用 Google Analytics 或其他分析工具
    console.log('分析工具已初始化:', analyticsId)
  }
}

// 记录性能指标
export function trackPerformance(metric: string, value: number) {
  console.log(`[Performance] ${metric}: ${value}ms`)
  
  if (import.meta.env.PROD) {
    // 发送到监控服务
    // track({ type: 'performance', metric, value })
  }
}

// 记录用户行为
export function trackEvent(category: string, action: string, label?: string) {
  console.log(`[Event] ${category} - ${action}`, label)
  
  if (import.meta.env.PROD) {
    // 发送到分析服务
    // track({ type: 'event', category, action, label })
  }
}

// 记录错误
export function trackError(error: Error, context?: Record<string, any>) {
  console.error('[Error]', error, context)
  
  if (import.meta.env.PROD) {
    // 发送到错误监控服务
    // captureException(error, { extra: context })
  }
}

// 记录页面访问
export function trackPageView(page: string) {
  console.log(`[Page View] ${page}`)
  
  if (import.meta.env.PROD) {
    // 发送到分析服务
    // track({ type: 'pageview', page })
  }
}

// 性能计时器
export class PerformanceTimer {
  private startTime: number
  private metric: string
  
  constructor(metric: string) {
    this.metric = metric
    this.startTime = performance.now()
  }
  
  end() {
    const duration = performance.now() - this.startTime
    trackPerformance(this.metric, duration)
    return duration
  }
}

// 初始化所有监控服务
export function initializeMonitoring() {
  initErrorMonitoring()
  initPerformanceMonitoring()
  initAnalytics()
  
  console.log('监控系统初始化完成')
}

// 导出统一的监控接口
export const monitoring = {
  init: initializeMonitoring,
  trackPerformance,
  trackEvent,
  trackError,
  trackPageView,
  PerformanceTimer,
}