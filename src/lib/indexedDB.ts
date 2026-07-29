/**
 * IndexedDB 数据库管理
 * 用于离线数据存储和同步
 */

const DB_NAME = 'therapy-record-db'
const DB_VERSION = 1

// 数据库存储对象名称
export const STORES = {
  PATIENTS: 'patients',
  RECORDS: 'records',
  SYNC_QUEUE: 'syncQueue',
  ATTACHMENTS: 'attachments',
} as const

// 同步队列项类型
export interface SyncQueueItem {
  id?: number
  action: 'create' | 'update' | 'delete'
  entity: 'patient' | 'record' | 'attachment'
  data: any
  timestamp: number
  retryCount: number
  synced: boolean
}

class IndexedDBManager {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  /**
   * 初始化数据库
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('IndexedDB打开失败:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB成功打开')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建患者存储对象
        if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
          const patientStore = db.createObjectStore(STORES.PATIENTS, {
            keyPath: 'id',
            autoIncrement: true,
          })
          patientStore.createIndex('name', 'name', { unique: false })
          patientStore.createIndex('medical_record_number', 'medical_record_number', { unique: true })
          patientStore.createIndex('created_at', 'created_at', { unique: false })
        }

        // 创建记录存储对象
        if (!db.objectStoreNames.contains(STORES.RECORDS)) {
          const recordStore = db.createObjectStore(STORES.RECORDS, {
            keyPath: 'id',
            autoIncrement: true,
          })
          recordStore.createIndex('patient_id', 'patient_id', { unique: false })
          recordStore.createIndex('therapist_id', 'therapist_id', { unique: false })
          recordStore.createIndex('created_at', 'created_at', { unique: false })
        }

        // 创建同步队列存储对象
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
            autoIncrement: true,
          })
          syncStore.createIndex('synced', 'synced', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // 创建附件存储对象
        if (!db.objectStoreNames.contains(STORES.ATTACHMENTS)) {
          const attachmentStore = db.createObjectStore(STORES.ATTACHMENTS, {
            keyPath: 'id',
            autoIncrement: true,
          })
          attachmentStore.createIndex('record_id', 'record_id', { unique: false })
          attachmentStore.createIndex('type', 'type', { unique: false })
        }

        console.log('IndexedDB数据库升级完成')
      }
    })

    return this.initPromise
  }

  /**
   * 添加数据
   */
  async add<T>(storeName: string, data: T): Promise<number> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 更新数据
   */
  async put<T>(storeName: string, data: T): Promise<number> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取数据
   */
  async get<T>(storeName: string, id: number): Promise<T | undefined> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取所有数据
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 通过索引获取数据
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除数据
   */
  async delete(storeName: string, id: number): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清空存储对象
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 添加到同步队列
   */
  async addToSyncQueue(
    action: SyncQueueItem['action'],
    entity: SyncQueueItem['entity'],
    data: any
  ): Promise<number> {
    const syncItem: SyncQueueItem = {
      action,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      synced: false,
    }

    return await this.add(STORES.SYNC_QUEUE, syncItem)
  }

  /**
   * 获取未同步的队列项
   */
  async getUnsyncedItems(): Promise<SyncQueueItem[]> {
    const allItems = await this.getAll<SyncQueueItem>(STORES.SYNC_QUEUE)
    return allItems.filter(item => !item.synced)
  }

  /**
   * 标记为已同步
   */
  async markAsSynced(id: number): Promise<void> {
    const item = await this.get<SyncQueueItem>(STORES.SYNC_QUEUE, id)
    if (item) {
      item.synced = true
      await this.put(STORES.SYNC_QUEUE, item)
    }
  }

  /**
   * 清理已同步的项
   */
  async clearSyncedItems(): Promise<void> {
    const allItems = await this.getAll<SyncQueueItem>(STORES.SYNC_QUEUE)
    const syncedItems = allItems.filter(item => item.synced)

    for (const item of syncedItems) {
      if (item.id) {
        await this.delete(STORES.SYNC_QUEUE, item.id)
      }
    }
  }
}

// 导出单例实例
export const indexedDBManager = new IndexedDBManager()