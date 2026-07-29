import { indexedDBManager, STORES, SyncQueueItem } from './indexedDB'

/**
 * 离线同步服务
 * 负责管理离线数据的同步
 */
class OfflineSyncService {
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false
  private listeners: Set<(status: SyncStatus) => void> = new Set()

  constructor() {
    // 监听网络状态变化
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())

    // 定期检查同步队列
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingData()
      }
    }, 30000) // 每30秒检查一次
  }

  /**
   * 获取当前网络状态
   */
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * 订阅网络状态变化
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(status: SyncStatus) {
    this.listeners.forEach(listener => listener(status))
  }

  /**
   * 处理上线事件
   */
  private async handleOnline() {
    this.isOnline = true
    console.log('网络已连接，开始同步离线数据')
    this.notifyListeners({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
    })

    // 延迟1秒后开始同步，确保网络稳定
    setTimeout(() => this.syncPendingData(), 1000)
  }

  /**
   * 处理离线事件
   */
  private handleOffline() {
    this.isOnline = false
    console.log('网络已断开，进入离线模式')
    this.notifyListeners({
      isOnline: false,
      isSyncing: false,
      pendingCount: 0,
    })
  }

  /**
   * 同步待处理数据
   */
  async syncPendingData(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, message: '同步进行中或网络不可用' }
    }

    this.syncInProgress = true
    this.notifyListeners({
      isOnline: true,
      isSyncing: true,
      pendingCount: 0,
    })

    try {
      const unsyncedItems = await indexedDBManager.getUnsyncedItems()

      if (unsyncedItems.length === 0) {
        this.syncInProgress = false
        this.notifyListeners({
          isOnline: true,
          isSyncing: false,
          pendingCount: 0,
        })
        return { success: true, message: '没有待同步的数据' }
      }

      console.log(`开始同步 ${unsyncedItems.length} 条数据`)

      const results: SyncItemResult[] = []
      for (const item of unsyncedItems) {
        const result = await this.syncItem(item)
        results.push(result)

        if (result.success && item.id) {
          await indexedDBManager.markAsSynced(item.id)
        }
      }

      // 清理已同步的项目
      await indexedDBManager.clearSyncedItems()

      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      this.syncInProgress = false
      this.notifyListeners({
        isOnline: true,
        isSyncing: false,
        pendingCount: failCount,
      })

      return {
        success: failCount === 0,
        message: `同步完成: ${successCount} 成功, ${failCount} 失败`,
        details: results,
      }
    } catch (error) {
      console.error('同步失败:', error)
      this.syncInProgress = false
      this.notifyListeners({
        isOnline: true,
        isSyncing: false,
        pendingCount: 0,
      })

      return {
        success: false,
        message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 同步单个数据项
   */
  private async syncItem(item: SyncQueueItem): Promise<SyncItemResult> {
    try {
      // 这里应该调用实际的API
      // 模拟API调用
      const endpoint = this.getApiEndpoint(item.entity, item.action)
      const response = await this.makeApiRequest(endpoint, item.data)

      if (response.ok) {
        return {
          success: true,
          itemId: item.id,
          message: '同步成功',
        }
      } else {
        // 如果失败，增加重试计数
        if (item.id) {
          item.retryCount += 1
          await indexedDBManager.put(STORES.SYNC_QUEUE, item)
        }

        return {
          success: false,
          itemId: item.id,
          message: `API错误: ${response.status}`,
        }
      }
    } catch (error) {
      return {
        success: false,
        itemId: item.id,
        message: error instanceof Error ? error.message : '同步失败',
      }
    }
  }

  /**
   * 获取API端点
   */
  private getApiEndpoint(entity: string, action: string): string {
    const baseUrl = '/api'
    const entityMap: Record<string, string> = {
      patient: 'patients',
      record: 'records',
      attachment: 'attachments',
    }

    const actionMap: Record<string, string> = {
      create: '',
      update: '',
      delete: '',
    }

    return `${baseUrl}/${entityMap[entity] || entity}${actionMap[action] || ''}`
  }

  /**
   * 发送API请求
   */
  private async makeApiRequest(endpoint: string, data: any): Promise<Response> {
    const method = data.id ? 'PUT' : 'POST'
    return await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }

  /**
   * 添加离线操作到队列
   */
  async addOfflineOperation(
    action: SyncQueueItem['action'],
    entity: SyncQueueItem['entity'],
    data: any
  ): Promise<void> {
    // 先保存到本地数据库
    if (action === 'create' || action === 'update') {
      await indexedDBManager.put(entity === 'patient' ? STORES.PATIENTS : STORES.RECORDS, data)
    } else if (action === 'delete') {
      if (data.id) {
        await indexedDBManager.delete(
          entity === 'patient' ? STORES.PATIENTS : STORES.RECORDS,
          data.id
        )
      }
    }

    // 添加到同步队列
    await indexedDBManager.addToSyncQueue(action, entity, data)

    // 如果在线，立即尝试同步
    if (this.isOnline) {
      this.syncPendingData()
    }
  }

  /**
   * 获取离线数据
   */
  async getOfflineData(entity: 'patient' | 'record'): Promise<any[]> {
    return await indexedDBManager.getAll(
      entity === 'patient' ? STORES.PATIENTS : STORES.RECORDS
    )
  }

  /**
   * 获取待同步数据数量
   */
  async getPendingCount(): Promise<number> {
    const items = await indexedDBManager.getUnsyncedItems()
    return items.length
  }
}

// 类型定义
export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
}

export interface SyncResult {
  success: boolean
  message: string
  details?: SyncItemResult[]
}

export interface SyncItemResult {
  success: boolean
  itemId?: number
  message: string
}

// 导出单例实例
export const offlineSyncService = new OfflineSyncService()