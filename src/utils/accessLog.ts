/**
 * 访问日志记录系统
 * 记录所有数据访问操作，用于审计和安全分析
 */

import { Therapist } from '@/types/database'
import { encryptedIndexedDB } from './encryptedStorage'

// 操作类型
export enum LogOperation {
  // 患者操作
  PATIENT_CREATE = 'patient_create',
  PATIENT_READ = 'patient_read',
  PATIENT_UPDATE = 'patient_update',
  PATIENT_DELETE = 'patient_delete',
  PATIENT_EXPORT = 'patient_export',
  
  // 记录操作
  RECORD_CREATE = 'record_create',
  RECORD_READ = 'record_read',
  RECORD_UPDATE = 'record_update',
  RECORD_DELETE = 'record_delete',
  RECORD_EXPORT = 'record_export',
  
  // 认证操作
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  
  // 数据操作
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',
  DATA_BACKUP = 'data_backup',
  DATA_RESTORE = 'data_restore',
  
  // 安全事件
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACCESS = 'suspicious_access',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
}

// 日志级别
export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// 访问日志接口
export interface AccessLog {
  id?: number
  user_id: number
  user_name: string
  user_role: string
  operation: LogOperation
  resource_type?: string
  resource_id?: number
  details?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
  level: LogLevel
  metadata?: Record<string, any>
}

/**
 * 访问日志记录器
 */
export class AccessLogger {
  private static instance: AccessLogger
  private currentUser: Therapist | null = null
  private isInitialized: boolean = false

  private constructor() {}

  static getInstance(): AccessLogger {
    if (!AccessLogger.instance) {
      AccessLogger.instance = new AccessLogger()
    }
    return AccessLogger.instance
  }

  /**
   * 初始化日志系统
   */
  async init(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      await encryptedIndexedDB.init()
      this.isInitialized = true
    } catch (error) {
      console.error('初始化访问日志系统失败:', error)
    }
  }

  /**
   * 设置当前用户
   */
  setCurrentUser(user: Therapist | null) {
    this.currentUser = user
  }

  /**
   * 记录操作日志
   */
  async log(
    operation: LogOperation,
    options: {
      resourceType?: string
      resourceId?: number
      details?: string
      level?: LogLevel
      metadata?: Record<string, any>
    } = {}
  ): Promise<void> {
    if (!this.currentUser) {
      console.warn('无法记录日志：用户未登录')
      return
    }

    const log: AccessLog = {
      user_id: this.currentUser.id,
      user_name: this.currentUser.name,
      user_role: this.currentUser.role,
      operation,
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      details: options.details,
      timestamp: new Date().toISOString(),
      level: options.level || LogLevel.INFO,
      metadata: options.metadata,
      user_agent: navigator.userAgent,
    }

    try {
      await this.saveLog(log)
    } catch (error) {
      console.error('保存访问日志失败:', error)
    }
  }

  /**
   * 保存日志到 IndexedDB
   */
  private async saveLog(log: AccessLog): Promise<void> {
    const db = await this.getDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['access_logs'], 'readwrite')
      const store = transaction.objectStore('access_logs')
      const request = store.add(log)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 获取数据库实例
   */
  private async getDB(): Promise<IDBDatabase> {
    if (!this.isInitialized) {
      await this.init()
    }
    return (encryptedIndexedDB as any).db
  }

  /**
   * 查询日志
   */
  async queryLogs(options: {
    userId?: number
    operation?: LogOperation
    startDate?: string
    endDate?: string
    level?: LogLevel
    limit?: number
  } = {}): Promise<AccessLog[]> {
    const db = await this.getDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['access_logs'], 'readonly')
      const store = transaction.objectStore('access_logs')
      const request = store.getAll()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        let logs = request.result as AccessLog[]
        
        // 应用过滤条件
        if (options.userId) {
          logs = logs.filter(log => log.user_id === options.userId)
        }
        
        if (options.operation) {
          logs = logs.filter(log => log.operation === options.operation)
        }
        
        if (options.level) {
          logs = logs.filter(log => log.level === options.level)
        }
        
        if (options.startDate) {
          logs = logs.filter(log => log.timestamp >= options.startDate!)
        }
        
        if (options.endDate) {
          logs = logs.filter(log => log.timestamp <= options.endDate!)
        }
        
        // 按时间倒序排列
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        
        // 限制结果数量
        if (options.limit && options.limit > 0) {
          logs = logs.slice(0, options.limit)
        }
        
        resolve(logs)
      }
    })
  }

  /**
   * 获取用户的活动统计
   */
  async getUserActivityStats(userId: number, days: number = 30): Promise<{
    totalOperations: number
    operationsByType: Record<string, number>
    lastActivity: string | null
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const logs = await this.queryLogs({
      userId,
      startDate: startDate.toISOString(),
    })
    
    const operationsByType: Record<string, number> = {}
    logs.forEach(log => {
      operationsByType[log.operation] = (operationsByType[log.operation] || 0) + 1
    })
    
    return {
      totalOperations: logs.length,
      operationsByType,
      lastActivity: logs.length > 0 ? logs[0].timestamp : null,
    }
  }

  /**
   * 导出日志
   */
  async exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = await this.queryLogs({ limit: 10000 })
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2)
    }
    
    // CSV 格式
    const headers = ['timestamp', 'user_id', 'user_name', 'user_role', 'operation', 'resource_type', 'resource_id', 'level', 'details']
    const csvRows = [headers.join(',')]
    
    logs.forEach(log => {
      const row = [
        log.timestamp,
        log.user_id,
        log.user_name,
        log.user_role,
        log.operation,
        log.resource_type || '',
        log.resource_id || '',
        log.level,
        log.details || '',
      ]
      csvRows.push(row.map(cell => `"${cell}"`).join(','))
    })
    
    return csvRows.join('\n')
  }

  /**
   * 清理旧日志
   */
  async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const db = await this.getDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['access_logs'], 'readwrite')
      const store = transaction.objectStore('access_logs')
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(cutoffDate.toISOString())
      
      const request = index.openCursor(range)
      let deletedCount = 0
      
      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }
    })
  }
}

// 导出单例
export const accessLogger = AccessLogger.getInstance()

/**
 * 快速日志记录函数
 */
export async function logAccess(
  operation: LogOperation,
  options?: {
    resourceType?: string
    resourceId?: number
    details?: string
    level?: LogLevel
    metadata?: Record<string, any>
  }
): Promise<void> {
  return accessLogger.log(operation, options)
}