/**
 * 异常访问检测系统
 * 检测异常访问模式并触发安全告警
 */

import { accessLogger, LogOperation, LogLevel } from './accessLog'
import { Therapist } from '@/types/database'

// 威胁级别
export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 异常类型
export enum AnomalyType {
  EXCESSIVE_ACCESS = 'excessive_access',           // 过度访问
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',     // 暴力破解尝试
  UNUSUAL_TIME_ACCESS = 'unusual_time_access',     // 异常时间访问
  BULK_EXPORT = 'bulk_export',                     // 批量导出
  PERMISSION_ABUSE = 'permission_abuse',           // 权限滥用
  SUSPICIOUS_PATTERN = 'suspicious_pattern',       // 可疑模式
  MULTIPLE_FAILED_LOGINS = 'multiple_failed_logins', // 多次登录失败
}

// 异常事件接口
export interface AnomalyEvent {
  id: string
  type: AnomalyType
  threatLevel: ThreatLevel
  userId: number
  userName: string
  timestamp: string
  details: string
  metadata?: Record<string, any>
  resolved: boolean
}

// 检测规则配置
interface DetectionRule {
  type: AnomalyType
  threshold: number
  timeWindow: number // 分钟
  threatLevel: ThreatLevel
  description: string
}

// 检测规则列表
const DETECTION_RULES: DetectionRule[] = [
  {
    type: AnomalyType.EXCESSIVE_ACCESS,
    threshold: 100, // 100次操作
    timeWindow: 60, // 1小时内
    threatLevel: ThreatLevel.MEDIUM,
    description: '短时间内大量数据访问',
  },
  {
    type: AnomalyType.BRUTE_FORCE_ATTEMPT,
    threshold: 5, // 5次失败
    timeWindow: 15, // 15分钟内
    threatLevel: ThreatLevel.HIGH,
    description: '疑似暴力破解尝试',
  },
  {
    type: AnomalyType.BULK_EXPORT,
    threshold: 3, // 3次导出
    timeWindow: 60, // 1小时内
    threatLevel: ThreatLevel.MEDIUM,
    description: '频繁数据导出操作',
  },
  {
    type: AnomalyType.MULTIPLE_FAILED_LOGINS,
    threshold: 5, // 5次失败
    timeWindow: 30, // 30分钟内
    threatLevel: ThreatLevel.HIGH,
    description: '多次登录失败',
  },
]

/**
 * 异常检测器
 */
export class AnomalyDetector {
  private static instance: AnomalyDetector
  private currentUser: Therapist | null = null
  private anomalyEvents: AnomalyEvent[] = []
  private alertCallbacks: ((event: AnomalyEvent) => void)[] = []

  private constructor() {}

  static getInstance(): AnomalyDetector {
    if (!AnomalyDetector.instance) {
      AnomalyDetector.instance = new AnomalyDetector()
    }
    return AnomalyDetector.instance
  }

  /**
   * 设置当前用户
   */
  setCurrentUser(user: Therapist | null) {
    this.currentUser = user
  }

  /**
   * 注册告警回调
   */
  onAlert(callback: (event: AnomalyEvent) => void) {
    this.alertCallbacks.push(callback)
  }

  /**
   * 触发告警
   */
  private triggerAlert(event: AnomalyEvent) {
    this.anomalyEvents.push(event)
    
    // 调用所有回调
    this.alertCallbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('告警回调执行失败:', error)
      }
    })
  }

  /**
   * 检查异常访问
   */
  async checkAnomalies(userId: number): Promise<AnomalyEvent[]> {
    const events: AnomalyEvent[] = []

    for (const rule of DETECTION_RULES) {
      const event = await this.checkRule(userId, rule)
      if (event) {
        events.push(event)
        this.triggerAlert(event)
      }
    }

    return events
  }

  /**
   * 检查单个规则
   */
  private async checkRule(userId: number, rule: DetectionRule): Promise<AnomalyEvent | null> {
    const startTime = new Date()
    startTime.setMinutes(startTime.getMinutes() - rule.timeWindow)

    // 查询指定时间窗口内的日志
    const logs = await accessLogger.queryLogs({
      userId,
      startDate: startTime.toISOString(),
    })

    // 根据规则类型筛选日志
    let count = 0
    let relevantLogs = logs

    switch (rule.type) {
      case AnomalyType.EXCESSIVE_ACCESS:
        count = logs.length
        break

      case AnomalyType.BRUTE_FORCE_ATTEMPT:
        count = logs.filter(log => log.operation === LogOperation.LOGIN_FAILED).length
        break

      case AnomalyType.BULK_EXPORT:
        count = logs.filter(log => 
          log.operation === LogOperation.PATIENT_EXPORT ||
          log.operation === LogOperation.RECORD_EXPORT ||
          log.operation === LogOperation.DATA_EXPORT
        ).length
        break

      case AnomalyType.MULTIPLE_FAILED_LOGINS:
        count = logs.filter(log => log.operation === LogOperation.LOGIN_FAILED).length
        break

      default:
        count = logs.length
    }

    // 检查是否超过阈值
    if (count >= rule.threshold) {
      const user = logs.length > 0 ? logs[0] : null

      return {
        id: `${rule.type}_${userId}_${Date.now()}`,
        type: rule.type,
        threatLevel: rule.threatLevel,
        userId,
        userName: user?.user_name || '未知用户',
        timestamp: new Date().toISOString(),
        details: `${rule.description} (检测到 ${count} 次操作，阈值: ${rule.threshold})`,
        metadata: {
          rule,
          count,
          timeWindow: rule.timeWindow,
          logs: relevantLogs.slice(0, 10), // 只保留前10条日志
        },
        resolved: false,
      }
    }

    return null
  }

  /**
   * 检测异常时间访问
   */
  async checkUnusualTimeAccess(userId: number): Promise<boolean> {
    const now = new Date()
    const hour = now.getHours()
    
    // 定义正常工作时间（9:00-18:00）
    const isUnusualTime = hour < 9 || hour >= 18
    
    if (isUnusualTime) {
      const event: AnomalyEvent = {
        id: `${AnomalyType.UNUSUAL_TIME_ACCESS}_${userId}_${Date.now()}`,
        type: AnomalyType.UNUSUAL_TIME_ACCESS,
        threatLevel: ThreatLevel.LOW,
        userId,
        userName: this.currentUser?.name || '未知用户',
        timestamp: now.toISOString(),
        details: `非工作时间访问 (当前时间: ${hour}:00)`,
        resolved: false,
      }
      
      this.triggerAlert(event)
      return true
    }
    
    return false
  }

  /**
   * 获取所有异常事件
   */
  getAnomalyEvents(resolved?: boolean): AnomalyEvent[] {
    if (resolved === undefined) {
      return this.anomalyEvents
    }
    
    return this.anomalyEvents.filter(event => event.resolved === resolved)
  }

  /**
   * 标记异常事件为已解决
   */
  resolveAnomaly(eventId: string): boolean {
    const event = this.anomalyEvents.find(e => e.id === eventId)
    if (event) {
      event.resolved = true
      return true
    }
    return false
  }

  /**
   * 清除已解决的异常事件
   */
  clearResolvedEvents(): number {
    const initialLength = this.anomalyEvents.length
    this.anomalyEvents = this.anomalyEvents.filter(e => !e.resolved)
    return initialLength - this.anomalyEvents.length
  }

  /**
   * 获取威胁级别统计
   */
  getThreatLevelStats(): Record<ThreatLevel, number> {
    const stats: Record<ThreatLevel, number> = {
      [ThreatLevel.LOW]: 0,
      [ThreatLevel.MEDIUM]: 0,
      [ThreatLevel.HIGH]: 0,
      [ThreatLevel.CRITICAL]: 0,
    }

    this.anomalyEvents.forEach(event => {
      stats[event.threatLevel]++
    })

    return stats
  }

  /**
   * 限制可疑账户
   */
  async restrictSuspiciousAccount(userId: number): Promise<void> {
    // 记录安全事件
    await accessLogger.log(LogOperation.SUSPICIOUS_ACCESS, {
      resourceType: 'user',
      resourceId: userId,
      details: '账户因异常行为被临时限制',
      level: LogLevel.WARNING,
      metadata: {
        action: 'account_restricted',
      },
    })

    // 在实际应用中，这里应该调用API来禁用账户
    console.warn(`账户 ${userId} 已被临时限制`)
  }
}

// 导出单例
export const anomalyDetector = AnomalyDetector.getInstance()

/**
 * 快速异常检测函数
 */
export async function detectAnomalies(userId: number): Promise<AnomalyEvent[]> {
  return anomalyDetector.checkAnomalies(userId)
}