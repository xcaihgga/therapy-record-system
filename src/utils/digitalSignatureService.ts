/**
 * 数字签名服务工具类
 * 使用 Web Crypto API 实现数字签名和验证
 */

import type {
  KeyPair,
  Certificate,
  SignatureData,
  SignatureVerification,
  CertificateSubject,
  EncryptedKey,
} from '@/types/proof'
import { TimestampService } from './timestampService'

// ============================================
// 密钥存储常量
// ============================================

const STORAGE_KEYS = {
  KEY_PAIR: 'therapy_system_keypair',
  CERTIFICATE: 'therapy_system_certificate',
  ENCRYPTED_PRIVATE_KEY: 'therapy_system_encrypted_private_key',
}

// ============================================
// 数字签名服务类
// ============================================

export class DigitalSignatureService {
  private timestampService: TimestampService

  constructor(timestampServiceProvider: string = 'local') {
    this.timestampService = new TimestampService(timestampServiceProvider)
  }

  // ============================================
  // 密钥对生成和管理
  // ============================================

  /**
   * 生成 RSA-2048 密钥对
   */
  async generateRSAKeyPair(): Promise<CryptoKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true, // 可导出
      ['sign', 'verify']
    )

    return keyPair
  }

  /**
   * 生成 ECDSA P-256 密钥对
   */
  async generateECDSAKeyPair(): Promise<CryptoKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // 可导出
      ['sign', 'verify']
    )

    return keyPair
  }

  /**
   * 生成密钥对并存储
   */
  async generateAndStoreKeyPair(
    algorithm: 'RSA-2048' | 'ECDSA-P256' = 'RSA-2048',
    password?: string
  ): Promise<{ keyPair: KeyPair; cryptoKeyPair: CryptoKeyPair }> {
    const cryptoKeyPair =
      algorithm === 'RSA-2048'
        ? await this.generateRSAKeyPair()
        : await this.generateECDSAKeyPair()

    // 导出公钥
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', cryptoKeyPair.publicKey)
    const publicKeyBase64 = this.arrayBufferToBase64(publicKeyBuffer)

    // 导出私钥
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', cryptoKeyPair.privateKey)
    const privateKeyBase64 = this.arrayBufferToBase64(privateKeyBuffer)

    // 生成密钥对ID
    const keyPairId = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 创建密钥对对象
    const keyPair: KeyPair = {
      id: keyPairId,
      publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`,
      algorithm,
      createdAt: new Date(),
      status: 'active',
    }

    // 加密并存储私钥（如果提供了密码）
    if (password) {
      const encryptedKey = await this.encryptPrivateKey(privateKeyBase64, password)
      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY, JSON.stringify(encryptedKey))
    } else {
      // 不加密存储（仅用于演示，实际应用中应该加密）
      keyPair.privateKey = privateKeyBase64
    }

    // 存储密钥对信息
    localStorage.setItem(STORAGE_KEYS.KEY_PAIR, JSON.stringify(keyPair))

    return { keyPair, cryptoKeyPair }
  }

  /**
   * 加密私钥
   */
  private async encryptPrivateKey(
    privateKeyBase64: string,
    password: string
  ): Promise<EncryptedKey> {
    // 生成加密密钥
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    
    // 导入密码作为密钥
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    )

    // 派生加密密钥
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    // 加密私钥
    const privateKeyBuffer = encoder.encode(privateKeyBase64)
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      encryptionKey,
      privateKeyBuffer
    )

    return {
      keyId: `enc-${Date.now()}`,
      encryptedPrivateKey: this.arrayBufferToBase64(encryptedBuffer),
      iv: this.arrayBufferToBase64(iv.buffer),
      salt: this.arrayBufferToBase64(salt.buffer),
      algorithm: 'AES-GCM',
      keyDerivation: 'PBKDF2',
    }
  }

  /**
   * 解密私钥（用于后续功能）
   */
  async decryptPrivateKey(
    encryptedKey: EncryptedKey,
    password: string
  ): Promise<string> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    
    // 导入密码作为密钥
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    )

    // 派生解密密钥
    const encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.base64ToArrayBuffer(encryptedKey.salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    // 解密私钥
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.base64ToArrayBuffer(encryptedKey.iv) },
      encryptionKey,
      this.base64ToArrayBuffer(encryptedKey.encryptedPrivateKey)
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  }

  // ============================================
  // 证书生成
  // ============================================

  /**
   * 生成自签名证书
   */
  async generateCertificate(
    subject: CertificateSubject,
    cryptoKeyPair: CryptoKeyPair,
    validityYears: number = 1
  ): Promise<Certificate> {
    const now = new Date()
    const notBefore = now
    const notAfter = new Date(now.getTime() + validityYears * 365 * 24 * 60 * 60 * 1000)

    // 生成序列号
    const serialNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 导出公钥
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', cryptoKeyPair.publicKey)
    const publicKeyBase64 = this.arrayBufferToBase64(publicKeyBuffer)

    // 计算证书指纹
    const certData = `${serialNumber}|${subject.commonName}|${subject.therapistId}|${notBefore.getTime()}|${notAfter.getTime()}`
    const fingerprint = await this.hashData(certData)

    // 创建证书对象（简化版本，实际应用应该生成X.509格式的证书）
    const certificate: Certificate = {
      id: `cert-${Date.now()}`,
      version: 3,
      serialNumber,
      subject,
      issuer: {
        commonName: 'Therapy Record System CA',
        organization: 'Therapy Record System',
        country: 'CN',
      },
      publicKey: publicKeyBase64,
      signature: '', // 稍后签名
      signatureAlgorithm: 'SHA256withRSA',
      validity: {
        notBefore,
        notAfter,
      },
      extensions: [
        {
          id: 'basicConstraints',
          critical: true,
          value: 'CA:FALSE',
        },
        {
          id: 'keyUsage',
          critical: true,
          value: 'digitalSignature,nonRepudiation',
        },
      ],
      fingerprint,
    }

    // 对证书进行签名
    const certificateHash = await this.hashData(JSON.stringify(certificate))
    const signature = await this.signData(certificateHash, cryptoKeyPair.privateKey)
    certificate.signature = signature

    // 存储证书
    localStorage.setItem(STORAGE_KEYS.CERTIFICATE, JSON.stringify(certificate))

    return certificate
  }

  // ============================================
  // 签名和验证
  // ============================================

  /**
   * 对数据进行签名
   */
  async signRecord(
    recordData: string,
    privateKey: CryptoKey
  ): Promise<SignatureData> {
    // 计算数据哈希
    const hash = await this.hashData(recordData)

    // 获取时间戳
    const timestamp = await this.timestampService.getTimestamp(recordData)

    // 签名数据
    const signature = await this.signData(hash, privateKey)

    // 获取存储的密钥对和证书
    const keyPairJson = localStorage.getItem(STORAGE_KEYS.KEY_PAIR)
    const certJson = localStorage.getItem(STORAGE_KEYS.CERTIFICATE)

    if (!keyPairJson || !certJson) {
      throw new Error('未找到密钥对或证书')
    }

    const keyPair = JSON.parse(keyPairJson) as KeyPair
    const certificate = JSON.parse(certJson) as Certificate

    // 创建签名数据对象
    const signatureData: SignatureData = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recordId: 0, // 需要在外部设置
      signature,
      algorithm: keyPair.algorithm,
      certificateId: certificate.id,
      publicKeyId: keyPair.id,
      timestamp,
      hash,
      createdAt: new Date(),
      status: 'valid',
    }

    return signatureData
  }

  /**
   * 使用私钥签名数据
   */
  private async signData(data: string, privateKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    const signatureBuffer = await crypto.subtle.sign(
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      privateKey,
      dataBuffer
    )

    return this.arrayBufferToBase64(signatureBuffer)
  }

  /**
   * 验证签名
   */
  async verifySignature(
    recordData: string,
    signatureData: SignatureData
  ): Promise<SignatureVerification> {
    const errors: string[] = []

    try {
      // 1. 验证数据完整性（哈希比对）
      const currentHash = await this.hashData(recordData)
      if (currentHash !== signatureData.hash) {
        errors.push('数据哈希值不匹配，数据可能已被篡改')
      }

      // 2. 验证时间戳
      const timestampVerification = await this.timestampService.verifyTimestamp(
        signatureData.timestamp,
        recordData
      )
      if (!timestampVerification.isValid) {
        errors.push(timestampVerification.error || '时间戳验证失败')
      }

      // 3. 验证签名
      // 获取存储的证书和公钥
      const certJson = localStorage.getItem(STORAGE_KEYS.CERTIFICATE)
      if (!certJson) {
        errors.push('未找到证书')
        return {
          isValid: false,
          signatureData,
          verifiedAt: new Date(),
          errors,
        }
      }

      const certificate = JSON.parse(certJson) as Certificate
      
      // 导入公钥
      const publicKey = await this.importPublicKey(certificate.publicKey)

      // 验证签名
      const isValidSignature = await this.verifySignatureWithPublicKey(
        signatureData.hash,
        signatureData.signature,
        publicKey
      )

      if (!isValidSignature) {
        errors.push('签名验证失败')
      }

      // 4. 验证证书有效期
      const now = new Date()
      if (now < new Date(certificate.validity.notBefore)) {
        errors.push('证书尚未生效')
      }
      if (now > new Date(certificate.validity.notAfter)) {
        errors.push('证书已过期')
      }

      return {
        isValid: errors.length === 0,
        signatureData,
        verifiedAt: new Date(),
        errors,
      }
    } catch (error: any) {
      errors.push(error.message || '验证过程出错')
      return {
        isValid: false,
        signatureData,
        verifiedAt: new Date(),
        errors,
      }
    }
  }

  /**
   * 使用公钥验证签名
   */
  private async verifySignatureWithPublicKey(
    data: string,
    signature: string,
    publicKey: CryptoKey
  ): Promise<boolean> {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const signatureBuffer = this.base64ToArrayBuffer(signature)

      return await crypto.subtle.verify(
        {
          name: 'RSASSA-PKCS1-v1_5',
        },
        publicKey,
        signatureBuffer,
        dataBuffer
      )
    } catch (error) {
      console.error('签名验证失败:', error)
      return false
    }
  }

  // ============================================
  // 密钥导入导出
  // ============================================

  /**
   * 导入公钥
   */
  private async importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64)
    
    return await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['verify']
    )
  }

  /**
   * 导出密钥对为PEM格式
   */
  async exportKeyPair(keyPair: KeyPair): Promise<string> {
    return JSON.stringify({
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      algorithm: keyPair.algorithm,
      createdAt: keyPair.createdAt,
    })
  }

  /**
   * 从PEM格式导入密钥对
   */
  async importKeyPair(keyPairJson: string): Promise<KeyPair> {
    const data = JSON.parse(keyPairJson)
    return {
      ...data,
      createdAt: new Date(data.createdAt),
    }
  }

  // ============================================
  // 辅助方法
  // ============================================

  /**
   * 计算数据哈希值
   */
  private async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * ArrayBuffer转Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Base64转ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  // ============================================
  // 状态检查方法
  // ============================================

  /**
   * 检查是否已有密钥对
   */
  hasKeyPair(): boolean {
    return localStorage.getItem(STORAGE_KEYS.KEY_PAIR) !== null
  }

  /**
   * 获取当前密钥对
   */
  getKeyPair(): KeyPair | null {
    const keyPairJson = localStorage.getItem(STORAGE_KEYS.KEY_PAIR)
    if (!keyPairJson) return null
    return JSON.parse(keyPairJson) as KeyPair
  }

  /**
   * 获取当前证书
   */
  getCertificate(): Certificate | null {
    const certJson = localStorage.getItem(STORAGE_KEYS.CERTIFICATE)
    if (!certJson) return null
    return JSON.parse(certJson) as Certificate
  }

  /**
   * 删除密钥对和证书
   */
  clearKeyPairAndCertificate(): void {
    localStorage.removeItem(STORAGE_KEYS.KEY_PAIR)
    localStorage.removeItem(STORAGE_KEYS.CERTIFICATE)
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY)
  }
}

// ============================================
// 导出默认实例
// ============================================

export const digitalSignatureService = new DigitalSignatureService('local')