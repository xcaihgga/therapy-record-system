/**
 * 真实性证明 API 接口
 */

import type {
  TreatmentProof,
  ProofVerificationResult,
  TimestampData,
  SignatureData,
  ProofApiResponse,
  VerificationApiResponse,
} from '@/types/proof'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ============================================
// 真实性证明 API
// ============================================

export const proofApi = {
  /**
   * 生成治疗证明
   */
  generateProof: async (recordId: number, template: string = 'standard'): Promise<TreatmentProof> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/proofs/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ recordId, template }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '生成证明失败')
    }

    const result: ProofApiResponse = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || '生成证明失败')
    }

    return result.data
  },

  /**
   * 获取证明详情
   */
  getProof: async (proofId: string): Promise<TreatmentProof> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/proofs/${proofId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '获取证明失败')
    }

    const result: ProofApiResponse = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || '获取证明失败')
    }

    return result.data
  },

  /**
   * 通过证明编号获取证明
   */
  getProofByNumber: async (proofNumber: string): Promise<TreatmentProof> => {
    const response = await fetch(`${API_BASE_URL}/api/proofs/number/${proofNumber}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '获取证明失败')
    }

    const result: ProofApiResponse = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || '获取证明失败')
    }

    return result.data
  },

  /**
   * 验证证明
   */
  verifyProof: async (proofNumber: string): Promise<ProofVerificationResult> => {
    const response = await fetch(`${API_BASE_URL}/api/proofs/verify/${proofNumber}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '验证失败')
    }

    const result: VerificationApiResponse = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || '验证失败')
    }

    return result.data
  },

  /**
   * 获取记录的证明列表
   */
  getProofsByRecord: async (recordId: number): Promise<TreatmentProof[]> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/proofs/record/${recordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '获取证明列表失败')
    }

    const data = await response.json()
    return data.proofs || []
  },

  /**
   * 下载证明PDF
   */
  downloadProofPdf: async (proofId: string, options?: {
    template?: string
    includeQrCode?: boolean
    includeWatermark?: boolean
  }): Promise<Blob> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/proofs/${proofId}/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(options || {}),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '下载PDF失败')
    }

    return await response.blob()
  },
}

// ============================================
// 时间戳 API
// ============================================

export const timestampApi = {
  /**
   * 获取时间戳
   */
  getTimestamp: async (data: string): Promise<TimestampData> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/timestamp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '获取时间戳失败')
    }

    return await response.json()
  },

  /**
   * 验证时间戳
   */
  verifyTimestamp: async (timestampData: TimestampData, originalData: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/api/timestamp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timestampData, originalData }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '验证时间戳失败')
    }

    const result = await response.json()
    return result.isValid
  },
}

// ============================================
// 数字签名 API
// ============================================

export const signatureApi = {
  /**
   * 上传公钥
   */
  uploadPublicKey: async (publicKey: string, certificateNumber: string): Promise<void> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/signatures/public-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ publicKey, certificateNumber }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '上传公钥失败')
    }
  },

  /**
   * 签名记录
   */
  signRecord: async (recordId: number): Promise<SignatureData> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/signatures/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ recordId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '签名失败')
    }

    return await response.json()
  },

  /**
   * 验证签名
   */
  verifySignature: async (signatureId: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/api/signatures/verify/${signatureId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '验证签名失败')
    }

    const result = await response.json()
    return result.isValid
  },

  /**
   * 获取签名记录
   */
  getSignature: async (signatureId: string): Promise<SignatureData> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/signatures/${signatureId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '获取签名记录失败')
    }

    return await response.json()
  },

  /**
   * 获取记录的签名历史
   */
  getSignatureHistory: async (recordId: number): Promise<SignatureData[]> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/signatures/record/${recordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '获取签名历史失败')
    }

    const data = await response.json()
    return data.signatures || []
  },
}