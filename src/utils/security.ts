/**
 * 数据安全服务
 * 统一导出所有安全相关的功能
 */

// 加密服务
export {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  encryptField,
  decryptField,
  encryptFields,
  decryptFields,
  hash,
  generateSalt,
  clearEncryptionKey,
  isEncryptionSupported,
} from './encryption'

// 加密存储
export {
  EncryptedLocalStorage,
  EncryptedIndexedDB,
  encryptedLocalStorage,
  encryptedIndexedDB,
  SENSITIVE_FIELDS,
} from './encryptedStorage'

// 访问控制
export {
  AccessControl,
  accessControl,
  canAccess,
  filterFields,
} from './accessControl'
export type {
  ResourceType,
  ActionType,
  PermissionRule,
  PermissionCondition,
} from './accessControl'

// 访问日志
export {
  AccessLogger,
  accessLogger,
  LogOperation,
  LogLevel,
  logAccess,
} from './accessLog'
export type { AccessLog } from './accessLog'

// 异常检测
export {
  AnomalyDetector,
  anomalyDetector,
  detectAnomalies,
  ThreatLevel,
} from './anomalyDetection'
export type {
  AnomalyType,
  AnomalyEvent,
} from './anomalyDetection'

// 备份服务
export {
  BackupService,
  backupService,
  AutoBackupScheduler,
  autoBackupScheduler,
  BackupType,
  BackupStatus,
} from './backupService'
export type {
  BackupMetadata,
  BackupData,
} from './backupService'

/**
 * 初始化安全服务
 */
export async function initializeSecurity(_userId?: number): Promise<void> {
  try {
    // 初始化加密存储
    const { encryptedIndexedDB } = await import('./encryptedStorage')
    await encryptedIndexedDB.init()
    
    // 初始化访问日志
    const { accessLogger } = await import('./accessLog')
    await accessLogger.init()
    
    // 启动自动备份（可选）
    // autoBackupScheduler.start(24) // 每24小时自动备份
    
    console.log('安全服务初始化完成')
  } catch (error) {
    console.error('安全服务初始化失败:', error)
    throw error
  }
}

/**
 * 设置当前用户
 */
export function setCurrentUser(user: any): void {
  import('./accessControl').then(({ accessControl }) => {
    accessControl.setUser(user)
  })
  import('./accessLog').then(({ accessLogger }) => {
    accessLogger.setCurrentUser(user)
  })
  import('./anomalyDetection').then(({ anomalyDetector }) => {
    anomalyDetector.setCurrentUser(user)
  })
  
  if (user?.id) {
    import('./backupService').then(({ backupService }) => {
      backupService.setCurrentUser(user.id)
    })
  }
}

/**
 * 清除安全数据（用于登出）
 */
export async function clearSecurityData(): Promise<void> {
  // 停止自动备份
  const { autoBackupScheduler } = await import('./backupService')
  autoBackupScheduler.stop()
  
  // 清除用户上下文
  setCurrentUser(null)
  
  // 清除加密密钥
  const { clearEncryptionKey } = await import('./encryption')
  clearEncryptionKey()
  
  console.log('安全数据已清除')
}

/**
 * 执行安全审计
 */
export async function performSecurityAudit(userId: number): Promise<{
  anomalies: any[]
  recommendations: string[]
}> {
  const recommendations: string[] = []
  
  // 检测异常
  const { detectAnomalies } = await import('./anomalyDetection')
  const anomalies = await detectAnomalies(userId)
  
  // 生成建议
  if (anomalies.length > 0) {
    recommendations.push('发现异常访问行为，建议检查账户安全')
  }
  
  // 检查备份
  const { backupService } = await import('./backupService')
  const backups = await backupService.listBackups()
  if (backups.length === 0) {
    recommendations.push('建议创建数据备份')
  } else {
    const lastBackup = backups[0]
    const daysSinceBackup = Math.floor(
      (Date.now() - new Date(lastBackup.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceBackup > 7) {
      recommendations.push('距上次备份已超过7天，建议创建新备份')
    }
  }
  
  return {
    anomalies,
    recommendations,
  }
}