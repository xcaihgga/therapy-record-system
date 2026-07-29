/**
 * 时间戳服务工具类
 * 支持多种时间戳提供者：阿里云、腾讯云、区块链、本地时间戳
 */

import type {
  TimestampProvider,
  TimestampData,
  TimestampVerification,
  TimestampApiResponse,
} from '@/types/proof'

// ============================================
// 时间戳提供者配置
// ============================================

const TIMESTAMP_PROVIDERS: TimestampProvider[] = [
  {
    id: 'local',
    name: '本地时间戳',
    type: 'local',
  },
  {
    id: 'aliyun',
    name: '阿里云时间戳服务',
    type: 'aliyun',
    endpoint: 'https://kms.cn-hangzhou.aliyuncs.com',
  },
  {
    id: 'tencent',
    name: '腾讯云时间戳服务',
    type: 'tencent',
    endpoint: 'https://kms.tencentcloudapi.com',
  },
  {
    id: 'blockchain',
    name: '区块链时间戳',
    type: 'blockchain',
    endpoint: 'https://blockchain-timestamp.example.com',
  },
]

// ============================================
// 时间戳服务类
// ============================================

export class TimestampService {
  private provider: TimestampProvider
  private maxRetries: number = 3
  private retryDelay: number = 1000 // 毫秒

  constructor(providerId: string = 'local') {
    const provider = TIMESTAMP_PROVIDERS.find(p => p.id === providerId)
    if (!provider) {
      throw new Error(`不支持的时间戳提供者: ${providerId}`)
    }
    this.provider = provider
  }

  /**
   * 获取所有可用的时间戳提供者
   */
  static getProviders(): TimestampProvider[] {
    return TIMESTAMP_PROVIDERS
  }

  /**
   * 获取可信时间戳
   * @param data 要加盖时间戳的数据
   * @returns 时间戳数据
   */
  async getTimestamp(data: string): Promise<TimestampData> {
    const hash = await this.hashData(data)
    
    switch (this.provider.type) {
      case 'local':
        return this.getLocalTimestamp(hash)
      case 'aliyun':
        return this.getAliyunTimestamp(hash)
      case 'tencent':
        return this.getTencentTimestamp(hash)
      case 'blockchain':
        return this.getBlockchainTimestamp(hash)
      default:
        throw new Error(`不支持的提供者类型: ${this.provider.type}`)
    }
  }

  /**
   * 验证时间戳有效性
   * @param timestampData 时间戳数据
   * @param originalData 原始数据
   * @returns 验证结果
   */
  async verifyTimestamp(
    timestampData: TimestampData,
    originalData: string
  ): Promise<TimestampVerification> {
    try {
      // 验证数据哈希值是否匹配
      const currentHash = await this.hashData(originalData)
      if (currentHash !== timestampData.hash) {
        return {
          isValid: false,
          timestamp: timestampData.timestamp,
          provider: timestampData.provider,
          verifiedAt: new Date(),
          error: '数据哈希值不匹配，数据可能已被篡改',
        }
      }

      // 根据提供者类型验证时间戳
      let isValid = false
      switch (timestampData.provider) {
        case 'local':
          isValid = await this.verifyLocalTimestamp(timestampData)
          break
        case 'aliyun':
          isValid = await this.verifyAliyunTimestamp(timestampData)
          break
        case 'tencent':
          isValid = await this.verifyTencentTimestamp(timestampData)
          break
        case 'blockchain':
          isValid = await this.verifyBlockchainTimestamp(timestampData)
          break
        default:
          throw new Error(`不支持的提供者: ${timestampData.provider}`)
      }

      return {
        isValid,
        timestamp: timestampData.timestamp,
        provider: timestampData.provider,
        verifiedAt: new Date(),
        error: isValid ? undefined : '时间戳验证失败',
      }
    } catch (error: any) {
      return {
        isValid: false,
        timestamp: timestampData.timestamp,
        provider: timestampData.provider,
        verifiedAt: new Date(),
        error: error.message || '验证过程出错',
      }
    }
  }

  // ============================================
  // 私有方法 - 哈希计算
  // ============================================

  /**
   * 使用SHA-256算法计算数据哈希值
   */
  private async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // ============================================
  // 私有方法 - 本地时间戳
  // ============================================

  private async getLocalTimestamp(hash: string): Promise<TimestampData> {
    const timestamp = Date.now()
    const proofData = `${timestamp}-${hash}-local-timestamp`
    const proofProof = await this.hashData(proofData)
    
    return {
      timestamp,
      provider: 'local',
      proof: btoa(proofProof), // Base64编码
      hash,
      serialNumber: `LOCAL-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      verified: true,
    }
  }

  private async verifyLocalTimestamp(timestampData: TimestampData): Promise<boolean> {
    // 本地时间戳验证：检查证明是否有效
    try {
      const proofDecoded = atob(timestampData.proof)
      const expectedData = `${timestampData.timestamp}-${timestampData.hash}-local-timestamp`
      const expectedProof = await this.hashData(expectedData)
      return proofDecoded === expectedProof
    } catch {
      return false
    }
  }

  // ============================================
  // 私有方法 - 阿里云时间戳
  // ============================================

  private async getAliyunTimestamp(hash: string): Promise<TimestampData> {
    try {
      // 实际集成时需要配置阿里云API密钥
      const response = await this.fetchWithRetry<TimestampApiResponse>(
        `${this.provider.endpoint}/api/timestamp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hash }),
        }
      )

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取阿里云时间戳失败')
      }

      return response.data
    } catch (error) {
      // 如果API调用失败，回退到本地时间戳
      console.warn('阿里云时间戳服务不可用，使用本地时间戳:', error)
      return this.getLocalTimestamp(hash)
    }
  }

  private async verifyAliyunTimestamp(timestampData: TimestampData): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry<TimestampApiResponse>(
        `${this.provider.endpoint}/api/timestamp/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: timestampData.timestamp,
            proof: timestampData.proof,
            hash: timestampData.hash,
          }),
        }
      )

      return response.success
    } catch {
      // 如果验证API不可用，回退到本地验证
      return this.verifyLocalTimestamp(timestampData)
    }
  }

  // ============================================
  // 私有方法 - 腾讯云时间戳
  // ============================================

  private async getTencentTimestamp(hash: string): Promise<TimestampData> {
    try {
      const response = await this.fetchWithRetry<TimestampApiResponse>(
        `${this.provider.endpoint}/api/timestamp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hash }),
        }
      )

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取腾讯云时间戳失败')
      }

      return response.data
    } catch (error) {
      console.warn('腾讯云时间戳服务不可用，使用本地时间戳:', error)
      return this.getLocalTimestamp(hash)
    }
  }

  private async verifyTencentTimestamp(timestampData: TimestampData): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry<TimestampApiResponse>(
        `${this.provider.endpoint}/api/timestamp/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: timestampData.timestamp,
            proof: timestampData.proof,
            hash: timestampData.hash,
          }),
        }
      )

      return response.success
    } catch {
      return this.verifyLocalTimestamp(timestampData)
    }
  }

  // ============================================
  // 私有方法 - 区块链时间戳
  // ============================================

  private async getBlockchainTimestamp(hash: string): Promise<TimestampData> {
    try {
      const response = await this.fetchWithRetry<TimestampApiResponse>(
        `${this.provider.endpoint}/api/timestamp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hash }),
        }
      )

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取区块链时间戳失败')
      }

      return response.data
    } catch (error) {
      console.warn('区块链时间戳服务不可用，使用本地时间戳:', error)
      return this.getLocalTimestamp(hash)
    }
  }

  private async verifyBlockchainTimestamp(timestampData: TimestampData): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry<TimestampApiResponse>(
        `${this.provider.endpoint}/api/timestamp/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: timestampData.timestamp,
            proof: timestampData.proof,
            hash: timestampData.hash,
          }),
        }
      )

      return response.success
    } catch {
      return this.verifyLocalTimestamp(timestampData)
    }
  }

  // ============================================
  // 私有方法 - 辅助函数
  // ============================================

  /**
   * 带重试机制的fetch请求
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number = this.maxRetries
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000), // 10秒超时
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
      } catch (error: any) {
        if (attempt === retries) {
          throw error
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }

    throw new Error('所有重试均失败')
  }
}

// ============================================
// 导出默认实例
// ============================================

export const timestampService = new TimestampService('local')