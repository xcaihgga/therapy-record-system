/**
 * 加密存储适配器
 * 自动加密 localStorage 和 IndexedDB 中的敏感数据
 */

import { encrypt, decrypt, encryptObject, decryptObject, isEncryptionSupported } from './encryption'

// 敏感字段配置
export const SENSITIVE_FIELDS = {
  patient: ['name', 'phone', 'medical_record_number', 'diagnosis'],
  therapist: ['name', 'phone', 'email', 'certificate_number'],
  record: ['content'],
}

/**
 * 加密的 localStorage 适配器
 */
export class EncryptedLocalStorage {
  private prefix = '__enc_'
  
  /**
   * 设置项目（自动加密）
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (!isEncryptionSupported()) {
        localStorage.setItem(key, value)
        return
      }

      const encryptedValue = await encrypt(value)
      localStorage.setItem(this.prefix + key, encryptedValue)
    } catch (error) {
      console.error(`加密存储失败 [${key}]:`, error)
      // 降级到普通存储
      localStorage.setItem(key, value)
    }
  }

  /**
   * 获取项目（自动解密）
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const encryptedKey = this.prefix + key
      const encryptedValue = localStorage.getItem(encryptedKey)
      
      if (!encryptedValue) {
        // 检查未加密的旧数据
        const oldValue = localStorage.getItem(key)
        if (oldValue) {
          // 自动迁移旧数据
          await this.setItem(key, oldValue)
          localStorage.removeItem(key)
          return oldValue
        }
        return null
      }

      return await decrypt(encryptedValue)
    } catch (error) {
      console.error(`解密失败 [${key}]:`, error)
      return localStorage.getItem(key)
    }
  }

  /**
   * 移除项目
   */
  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key)
    localStorage.removeItem(key)
  }

  /**
   * 设置对象（自动加密）
   */
  async setObject<T>(key: string, obj: T): Promise<void> {
    const jsonStr = JSON.stringify(obj)
    await this.setItem(key, jsonStr)
  }

  /**
   * 获取对象（自动解密）
   */
  async getObject<T>(key: string): Promise<T | null> {
    const jsonStr = await this.getItem(key)
    if (!jsonStr) return null
    
    try {
      return JSON.parse(jsonStr) as T
    } catch (error) {
      console.error(`解析对象失败 [${key}]:`, error)
      return null
    }
  }

  /**
   * 清除所有加密数据
   */
  clearAll(): void {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }
}

/**
 * 加密的 IndexedDB 适配器
 */
export class EncryptedIndexedDB {
  private dbName: string
  private db: IDBDatabase | null = null
  
  constructor(dbName: string = 'therapy_encrypted_db') {
    this.dbName = dbName
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('encrypted_data')) {
          const store = db.createObjectStore('encrypted_data', { keyPath: 'key' })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        // 创建日志存储
        if (!db.objectStoreNames.contains('access_logs')) {
          const logStore = db.createObjectStore('access_logs', { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          logStore.createIndex('user_id', 'user_id', { unique: false })
          logStore.createIndex('timestamp', 'timestamp', { unique: false })
          logStore.createIndex('operation', 'operation', { unique: false })
        }
        
        // 创建备份存储
        if (!db.objectStoreNames.contains('backups')) {
          const backupStore = db.createObjectStore('backups', {
            keyPath: 'id',
            autoIncrement: true
          })
          backupStore.createIndex('timestamp', 'timestamp', { unique: false })
          backupStore.createIndex('type', 'type', { unique: false })
        }
      }
    })
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  /**
   * 存储加密数据
   */
  async put(key: string, value: any, type: string = 'general'): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['encrypted_data'], 'readwrite')
      const store = transaction.objectStore('encrypted_data')
      
      const encryptData = async () => {
        try {
          let encryptedValue: string
          
          if (typeof value === 'object') {
            encryptedValue = await encryptObject(value)
          } else {
            encryptedValue = await encrypt(String(value))
          }
          
          const record = {
            key,
            value: encryptedValue,
            type,
            timestamp: new Date().toISOString(),
          }
          
          const request = store.put(record)
          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()
        } catch (error) {
          reject(error)
        }
      }
      
      encryptData()
    })
  }

  /**
   * 获取解密数据
   */
  async get<T = any>(key: string): Promise<T | null> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['encrypted_data'], 'readonly')
      const store = transaction.objectStore('encrypted_data')
      const request = store.get(key)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = async () => {
        const record = request.result
        
        if (!record) {
          resolve(null)
          return
        }
        
        try {
          const decryptedValue = await decrypt(record.value)
          
          // 尝试解析为对象
          try {
            resolve(JSON.parse(decryptedValue) as T)
          } catch {
            resolve(decryptedValue as any)
          }
        } catch (error) {
          reject(error)
        }
      }
    })
  }

  /**
   * 删除数据
   */
  async delete(key: string): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['encrypted_data'], 'readwrite')
      const store = transaction.objectStore('encrypted_data')
      const request = store.delete(key)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 获取所有数据（按类型）
   */
  async getAllByType<T = any>(type: string): Promise<T[]> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['encrypted_data'], 'readonly')
      const store = transaction.objectStore('encrypted_data')
      const index = store.index('type')
      const request = index.getAll(type)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = async () => {
        const records = request.result
        
        try {
          const decryptedRecords = await Promise.all(
            records.map(async (record) => {
              const decryptedValue = await decrypt(record.value)
              try {
                return JSON.parse(decryptedValue) as T
              } catch {
                return decryptedValue as unknown as T
              }
            })
          ) as T[]
          
          resolve(decryptedRecords)
        } catch (error) {
          reject(error)
        }
      }
    })
  }

  /**
   * 清空所有加密数据
   */
  async clear(): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['encrypted_data'], 'readwrite')
      const store = transaction.objectStore('encrypted_data')
      const request = store.clear()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// 创建全局实例
export const encryptedLocalStorage = new EncryptedLocalStorage()
export const encryptedIndexedDB = new EncryptedIndexedDB()