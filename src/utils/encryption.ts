/**
 * 数据加密服务
 * 使用 Web Crypto API 实现 AES-GCM 加密
 */

// 加密算法配置
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16

// 加密密钥缓存
let cachedKey: CryptoKey | null = null

/**
 * 生成加密密钥
 */
async function generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 获取或创建加密密钥
 */
async function getOrCreateKey(): Promise<CryptoKey> {
  if (cachedKey) {
    return cachedKey
  }

  // 从 localStorage 获取或生成密钥
  let keyData = localStorage.getItem('encryption_key')
  
  if (!keyData) {
    // 生成新的随机密钥
    const key = await crypto.subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    )
    
    // 导出密钥并存储
    const exportedKey = await crypto.subtle.exportKey('raw', key)
    keyData = btoa(String.fromCharCode(...new Uint8Array(exportedKey)))
    localStorage.setItem('encryption_key', keyData)
    cachedKey = key
    return key
  }

  // 从存储恢复密钥
  const keyBytes = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
  cachedKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )

  return cachedKey
}

/**
 * 加密数据
 * @param data 要加密的数据
 * @returns 加密后的Base64字符串
 */
export async function encrypt(data: string): Promise<string> {
  try {
    const key = await getOrCreateKey()
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(data)

    // 生成随机IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    // 加密数据
    const encryptedData = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      dataBytes
    )

    // 组合 IV + 加密数据
    const result = new Uint8Array(iv.length + encryptedData.byteLength)
    result.set(iv, 0)
    result.set(new Uint8Array(encryptedData), iv.length)

    // 返回 Base64 编码
    return btoa(String.fromCharCode(...result))
  } catch (error) {
    console.error('加密失败:', error)
    throw new Error('数据加密失败')
  }
}

/**
 * 解密数据
 * @param encryptedData 加密的Base64字符串
 * @returns 解密后的原始数据
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = await getOrCreateKey()
    
    // 解码 Base64
    const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

    // 提取 IV 和加密数据
    const iv = data.slice(0, IV_LENGTH)
    const ciphertext = data.slice(IV_LENGTH)

    // 解密数据
    const decryptedData = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    )

    // 返回原始字符串
    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  } catch (error) {
    console.error('解密失败:', error)
    throw new Error('数据解密失败')
  }
}

/**
 * 加密对象
 */
export async function encryptObject<T>(obj: T): Promise<string> {
  const jsonStr = JSON.stringify(obj)
  return encrypt(jsonStr)
}

/**
 * 解密对象
 */
export async function decryptObject<T>(encryptedData: string): Promise<T> {
  const jsonStr = await decrypt(encryptedData)
  return JSON.parse(jsonStr)
}

/**
 * 加密字段级数据
 */
export async function encryptField(value: string): Promise<string> {
  return encrypt(value)
}

/**
 * 解密字段级数据
 */
export async function decryptField(encryptedValue: string): Promise<string> {
  return decrypt(encryptedValue)
}

/**
 * 批量加密字段
 */
export async function encryptFields(data: Record<string, any>, fields: string[]): Promise<Record<string, any>> {
  const result = { ...data }
  
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = await encryptField(String(result[field]))
    }
  }
  
  return result
}

/**
 * 批量解密字段
 */
export async function decryptFields(data: Record<string, any>, fields: string[]): Promise<Record<string, any>> {
  const result = { ...data }
  
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = await decryptField(result[field])
    }
  }
  
  return result
}

/**
 * 生成安全哈希
 */
export async function hash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBytes = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成随机盐值
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return btoa(String.fromCharCode(...salt))
}

/**
 * 清除缓存的密钥（用于登出时）
 */
export function clearEncryptionKey(): void {
  cachedKey = null
  localStorage.removeItem('encryption_key')
}

/**
 * 检查是否支持加密
 */
export function isEncryptionSupported(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof TextEncoder !== 'undefined'
}