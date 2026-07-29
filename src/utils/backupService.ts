/**
 * 数据备份系统
 * 提供自动备份、备份验证和数据恢复功能
 */

import { encryptedLocalStorage, encryptedIndexedDB } from './encryptedStorage'
import { accessLogger, LogOperation } from './accessLog'
import { encrypt, decrypt, hash } from './encryption'

// 备份类型
export enum BackupType {
  FULL = 'full',           // 完整备份
  PARTIAL = 'partial',     // 部分备份
  INCREMENTAL = 'incremental', // 增量备份
}

// 备份状态
export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  VERIFIED = 'verified',
}

// 备份元数据
export interface BackupMetadata {
  id: string
  type: BackupType
  status: BackupStatus
  timestamp: string
  size: number
  checksum: string
  itemCount: number
  tables?: string[]
  description?: string
  createdBy: number
  duration: number // 毫秒
}

// 备份数据结构
export interface BackupData {
  metadata: BackupMetadata
  localStorage: Record<string, string>
  indexedDB: Record<string, any>
  checksum: string
}

/**
 * 备份服务
 */
export class BackupService {
  private static instance: BackupService
  private isBackupRunning: boolean = false
  private currentUserId: number = 0

  private constructor() {}

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  /**
   * 设置当前用户ID
   */
  setCurrentUser(userId: number) {
    this.currentUserId = userId
  }

  /**
   * 创建备份
   */
  async createBackup(
    type: BackupType = BackupType.FULL,
    options: {
      tables?: string[]
      description?: string
    } = {}
  ): Promise<BackupMetadata> {
    if (this.isBackupRunning) {
      throw new Error('备份正在进行中，请稍候')
    }

    this.isBackupRunning = true
    const startTime = Date.now()
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // 记录备份开始
      await accessLogger.log(LogOperation.DATA_BACKUP, {
        resourceType: 'backup',
        details: `开始创建${type === BackupType.FULL ? '完整' : '部分'}备份`,
        metadata: { backupId, type },
      })

      // 收集 localStorage 数据
      const localStorageData = await this.collectLocalStorageData()

      // 收集 IndexedDB 数据
      const indexedDBData = await this.collectIndexedDBData()

      // 计算数据大小和项目数
      const localStorageSize = JSON.stringify(localStorageData).length
      const indexedDBSize = JSON.stringify(indexedDBData).length
      const totalSize = localStorageSize + indexedDBSize
      const itemCount = Object.keys(localStorageData).length + Object.keys(indexedDBData).length

      // 创建备份数据
      const backupData: BackupData = {
        metadata: {
          id: backupId,
          type,
          status: BackupStatus.COMPLETED,
          timestamp: new Date().toISOString(),
          size: totalSize,
          checksum: '',
          itemCount,
          tables: options.tables,
          description: options.description,
          createdBy: this.currentUserId,
          duration: Date.now() - startTime,
        },
        localStorage: localStorageData,
        indexedDB: indexedDBData,
        checksum: '',
      }

      // 计算校验和
      backupData.checksum = await this.calculateChecksum(backupData)
      backupData.metadata.checksum = backupData.checksum

      // 加密备份数据
      const encryptedBackup = await encrypt(JSON.stringify(backupData))

      // 保存备份到 IndexedDB
      await this.saveBackupToIndexedDB(backupId, encryptedBackup, backupData.metadata)

      // 记录备份完成
      await accessLogger.log(LogOperation.DATA_BACKUP, {
        resourceType: 'backup',
        details: `备份创建成功，共 ${itemCount} 项数据`,
        metadata: { backupId, size: totalSize, itemCount },
      })

      return backupData.metadata
    } catch (error) {
      console.error('备份失败:', error)

      // 记录备份失败
      await accessLogger.log(LogOperation.DATA_BACKUP, {
        resourceType: 'backup',
        details: `备份失败: ${error instanceof Error ? error.message : '未知错误'}`,
        metadata: { backupId, error: true },
      })

      throw error
    } finally {
      this.isBackupRunning = false
    }
  }

  /**
   * 收集 localStorage 数据
   */
  private async collectLocalStorageData(): Promise<Record<string, string>> {
    const data: Record<string, string> = {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && !key.startsWith('backup_')) {
        const value = localStorage.getItem(key)
        if (value) {
          data[key] = value
        }
      }
    }

    return data
  }

  /**
   * 收集 IndexedDB 数据
   */
  private async collectIndexedDBData(): Promise<Record<string, any>> {
    const data: Record<string, any> = {}

    try {
      // 获取所有加密数据
      const allData = await encryptedIndexedDB.getAllByType('general')
      data['encrypted_data'] = allData
    } catch (error) {
      console.warn('收集 IndexedDB 数据失败:', error)
    }

    return data
  }

  /**
   * 计算校验和
   */
  private async calculateChecksum(data: BackupData): Promise<string> {
    const dataToHash = JSON.stringify({
      localStorage: data.localStorage,
      indexedDB: data.indexedDB,
      timestamp: data.metadata.timestamp,
    })
    
    return await hash(dataToHash)
  }

  /**
   * 保存备份到 IndexedDB
   */
  private async saveBackupToIndexedDB(
    backupId: string,
    encryptedData: string,
    metadata: BackupMetadata
  ): Promise<void> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['backups'], 'readwrite')
      const store = transaction.objectStore('backups')

      const record = {
        id: backupId,
        data: encryptedData,
        metadata,
        timestamp: new Date().toISOString(),
      }

      const request = store.add(record)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 获取数据库实例
   */
  private async getDB(): Promise<IDBDatabase> {
    await encryptedIndexedDB.init()
    return (encryptedIndexedDB as any).db
  }

  /**
   * 验证备份
   */
  async verifyBackup(backupId: string): Promise<{
    valid: boolean
    errors: string[]
    metadata?: BackupMetadata
  }> {
    const errors: string[] = []

    try {
      // 获取备份数据
      const backup = await this.getBackup(backupId)
      
      if (!backup) {
        errors.push('备份不存在')
        return { valid: false, errors }
      }

      // 验证校验和
      const currentChecksum = await this.calculateChecksum(backup)
      if (currentChecksum !== backup.checksum) {
        errors.push('校验和不匹配，数据可能已损坏')
      }

      // 验证数据完整性
      if (!backup.localStorage || typeof backup.localStorage !== 'object') {
        errors.push('localStorage 数据损坏')
      }

      if (!backup.indexedDB || typeof backup.indexedDB !== 'object') {
        errors.push('IndexedDB 数据损坏')
      }

      // 验证元数据
      if (!backup.metadata || !backup.metadata.timestamp) {
        errors.push('元数据损坏')
      }

      const valid = errors.length === 0

      // 更新备份状态
      if (valid) {
        await this.updateBackupStatus(backupId, BackupStatus.VERIFIED)
      }

      return {
        valid,
        errors,
        metadata: backup.metadata,
      }
    } catch (error) {
      errors.push(`验证失败: ${error instanceof Error ? error.message : '未知错误'}`)
      return { valid: false, errors }
    }
  }

  /**
   * 获取备份数据
   */
  private async getBackup(backupId: string): Promise<BackupData | null> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['backups'], 'readonly')
      const store = transaction.objectStore('backups')
      const request = store.get(backupId)

      request.onerror = () => reject(request.error)
      request.onsuccess = async () => {
        const record = request.result

        if (!record) {
          resolve(null)
          return
        }

        try {
          // 解密备份数据
          const decryptedData = await decrypt(record.data)
          const backupData: BackupData = JSON.parse(decryptedData)
          resolve(backupData)
        } catch (error) {
          reject(error)
        }
      }
    })
  }

  /**
   * 更新备份状态
   */
  private async updateBackupStatus(
    backupId: string,
    status: BackupStatus
  ): Promise<void> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['backups'], 'readwrite')
      const store = transaction.objectStore('backups')
      const getRequest = store.get(backupId)

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.metadata.status = status
          const putRequest = store.put(record)
          putRequest.onerror = () => reject(putRequest.error)
          putRequest.onsuccess = () => resolve()
        } else {
          resolve()
        }
      }
    })
  }

  /**
   * 恢复备份
   */
  async restoreBackup(
    backupId: string,
    options: {
      restoreLocalStorage?: boolean
      restoreIndexedDB?: boolean
      tables?: string[]
    } = {}
  ): Promise<{
    success: boolean
    restoredItems: number
    errors: string[]
  }> {
    const errors: string[] = []
    let restoredItems = 0

    try {
      // 验证备份
      const verification = await this.verifyBackup(backupId)
      if (!verification.valid) {
        return {
          success: false,
          restoredItems: 0,
          errors: verification.errors,
        }
      }

      // 获取备份数据
      const backup = await this.getBackup(backupId)
      if (!backup) {
        return {
          success: false,
          restoredItems: 0,
          errors: ['备份不存在'],
        }
      }

      // 记录恢复开始
      await accessLogger.log(LogOperation.DATA_RESTORE, {
        resourceType: 'backup',
        details: '开始恢复备份数据',
        metadata: { backupId },
      })

      // 恢复 localStorage
      if (options.restoreLocalStorage !== false) {
        const restored = await this.restoreLocalStorage(backup.localStorage)
        restoredItems += restored
      }

      // 恢复 IndexedDB
      if (options.restoreIndexedDB !== false) {
        const restored = await this.restoreIndexedDB(backup.indexedDB, options.tables)
        restoredItems += restored
      }

      // 记录恢复完成
      await accessLogger.log(LogOperation.DATA_RESTORE, {
        resourceType: 'backup',
        details: `备份恢复成功，共恢复 ${restoredItems} 项数据`,
        metadata: { backupId, restoredItems },
      })

      return {
        success: true,
        restoredItems,
        errors,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      errors.push(`恢复失败: ${errorMsg}`)

      await accessLogger.log(LogOperation.DATA_RESTORE, {
        resourceType: 'backup',
        details: `备份恢复失败: ${errorMsg}`,
        metadata: { backupId, error: true },
      })

      return {
        success: false,
        restoredItems,
        errors,
      }
    }
  }

  /**
   * 恢复 localStorage 数据
   */
  private async restoreLocalStorage(data: Record<string, string>): Promise<number> {
    let count = 0

    for (const [key, value] of Object.entries(data)) {
      try {
        localStorage.setItem(key, value)
        count++
      } catch (error) {
        console.error(`恢复 localStorage 错误 [${key}]:`, error)
      }
    }

    return count
  }

  /**
   * 恢复 IndexedDB 数据
   */
  private async restoreIndexedDB(
    data: Record<string, any>,
    tables?: string[]
  ): Promise<number> {
    let count = 0

    for (const [tableName, tableData] of Object.entries(data)) {
      if (tables && !tables.includes(tableName)) {
        continue
      }

      try {
        if (Array.isArray(tableData)) {
          for (const item of tableData) {
            await encryptedIndexedDB.put(`${tableName}_${Date.now()}`, item, tableName)
            count++
          }
        }
      } catch (error) {
        console.error(`恢复 IndexedDB 错误 [${tableName}]:`, error)
      }
    }

    return count
  }

  /**
   * 列出所有备份
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['backups'], 'readonly')
      const store = transaction.objectStore('backups')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const records = request.result
        const metadata = records.map(record => record.metadata)
        
        // 按时间倒序排列
        metadata.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        
        resolve(metadata)
      }
    })
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['backups'], 'readwrite')
      const store = transaction.objectStore('backups')
      const request = store.delete(backupId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(true)
    })
  }

  /**
   * 导出备份文件
   */
  async exportBackup(backupId: string): Promise<string> {
    const backup = await this.getBackup(backupId)
    
    if (!backup) {
      throw new Error('备份不存在')
    }

    return JSON.stringify(backup, null, 2)
  }

  /**
   * 导入备份文件
   */
  async importBackup(backupJson: string): Promise<BackupMetadata> {
    try {
      const backup: BackupData = JSON.parse(backupJson)

      // 验证备份格式
      if (!backup.metadata || !backup.localStorage || !backup.indexedDB) {
        throw new Error('备份格式无效')
      }

      // 重新生成备份ID
      const newBackupId = `backup_imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      backup.metadata.id = newBackupId
      backup.metadata.timestamp = new Date().toISOString()
      backup.metadata.status = BackupStatus.COMPLETED

      // 计算新的校验和
      backup.checksum = await this.calculateChecksum(backup)
      backup.metadata.checksum = backup.checksum

      // 加密并保存
      const encryptedBackup = await encrypt(JSON.stringify(backup))
      await this.saveBackupToIndexedDB(newBackupId, encryptedBackup, backup.metadata)

      return backup.metadata
    } catch (error) {
      throw new Error(`导入备份失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}

// 导出单例
export const backupService = BackupService.getInstance()

/**
 * 自动备份调度器
 */
export class AutoBackupScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning: boolean = false

  /**
   * 启动自动备份
   */
  start(intervalHours: number = 24) {
    if (this.isRunning) {
      console.warn('自动备份已在运行')
      return
    }

    const intervalMs = intervalHours * 60 * 60 * 1000

    this.intervalId = setInterval(async () => {
      try {
        console.log('开始自动备份...')
        await backupService.createBackup(BackupType.FULL, {
          description: '自动备份',
        })
        console.log('自动备份完成')
      } catch (error) {
        console.error('自动备份失败:', error)
      }
    }, intervalMs)

    this.isRunning = true
    console.log(`自动备份已启动，间隔: ${intervalHours} 小时`)
  }

  /**
   * 停止自动备份
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('自动备份已停止')
  }

  /**
   * 检查是否正在运行
   */
  isActive(): boolean {
    return this.isRunning
  }
}

// 导出自动备份调度器实例
export const autoBackupScheduler = new AutoBackupScheduler()