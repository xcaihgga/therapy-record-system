/**
 * 真实性证明状态管理 Store
 */

import { create } from 'zustand'
import type {
  SignatureData,
  TreatmentProof,
  ProofVerificationResult,
  KeyManagementState,
  SignatureManagementState,
} from '@/types/proof'
import { digitalSignatureService } from '@/utils/digitalSignatureService'
import { proofGeneratorService } from '@/utils/proofGenerator'
import type { TreatmentRecord, Patient, Therapist } from '@/types/database'

// ============================================
// Store 接口定义
// ============================================

interface ProofState extends KeyManagementState, SignatureManagementState {
  // 证明状态
  proofs: TreatmentProof[]
  currentProof: TreatmentProof | null
  verificationResult: ProofVerificationResult | null
  
  // 操作方法 - 密钥管理
  generateKeyPair: (algorithm: 'RSA-2048' | 'ECDSA-P256', password?: string) => Promise<void>
  generateCertificate: (therapistId: number, therapistName: string, certificateNumber: string) => Promise<void>
  deleteKeyPair: () => void
  loadKeyPair: () => void
  exportKeyPair: () => Promise<string>
  importKeyPair: (keyPairJson: string) => Promise<void>
  
  // 操作方法 - 签名管理
  signRecord: (recordId: number, recordData: string) => Promise<SignatureData>
  verifySignature: (recordData: string, signatureData: SignatureData) => Promise<boolean>
  
  // 操作方法 - 证明管理
  generateProof: (
    record: TreatmentRecord,
    patient: Patient,
    therapist: Therapist,
    template?: 'standard' | 'detailed' | 'compact'
  ) => Promise<TreatmentProof>
  verifyProof: (proof: TreatmentProof) => Promise<ProofVerificationResult>
  downloadProofPdf: (proof: TreatmentProof, options?: any) => Promise<void>
  
  // 辅助方法
  clearError: () => void
  reset: () => void
}

// ============================================
// Store 实现
// ============================================

export const useProofStore = create<ProofState>((set, get) => ({
  // 初始状态
  keyPair: null,
  certificate: null,
  hasKeys: false,
  isGenerating: false,
  lastChecked: null,
  signatures: [],
  currentSignature: null,
  isLoading: false,
  error: null,
  proofs: [],
  currentProof: null,
  verificationResult: null,

  // ============================================
  // 密钥管理方法
  // ============================================

  generateKeyPair: async (algorithm, password) => {
    set({ isGenerating: true, error: null })
    try {
      const { keyPair } = await digitalSignatureService.generateAndStoreKeyPair(
        algorithm,
        password
      )

      set({
        keyPair,
        hasKeys: true,
        isGenerating: false,
        lastChecked: new Date(),
      })
    } catch (error: any) {
      set({
        isGenerating: false,
        error: error.message || '生成密钥对失败',
      })
      throw error
    }
  },

  generateCertificate: async (therapistId, therapistName, certificateNumber) => {
    set({ isGenerating: true, error: null })
    try {
      // 检查是否已有密钥对
      if (!digitalSignatureService.hasKeyPair()) {
        throw new Error('请先生成密钥对')
      }

      // 这里简化处理，实际应该从存储中加载密钥对
      const cryptoKeyPair = await digitalSignatureService.generateRSAKeyPair()

      const certificate = await digitalSignatureService.generateCertificate({
        commonName: therapistName,
        therapistId,
        certificateNumber,
      }, cryptoKeyPair)

      set({
        certificate,
        isGenerating: false,
        lastChecked: new Date(),
      })
    } catch (error: any) {
      set({
        isGenerating: false,
        error: error.message || '生成证书失败',
      })
      throw error
    }
  },

  deleteKeyPair: () => {
    digitalSignatureService.clearKeyPairAndCertificate()
    set({
      keyPair: null,
      certificate: null,
      hasKeys: false,
      lastChecked: null,
      signatures: [],
      currentSignature: null,
    })
  },

  loadKeyPair: () => {
    const keyPair = digitalSignatureService.getKeyPair()
    const certificate = digitalSignatureService.getCertificate()
    set({
      keyPair,
      certificate,
      hasKeys: keyPair !== null,
      lastChecked: new Date(),
    })
  },

  exportKeyPair: async () => {
    const { keyPair } = get()
    if (!keyPair) {
      throw new Error('没有可导出的密钥对')
    }
    return await digitalSignatureService.exportKeyPair(keyPair)
  },

  importKeyPair: async (keyPairJson) => {
    try {
      const keyPair = await digitalSignatureService.importKeyPair(keyPairJson)
      set({
        keyPair,
        hasKeys: true,
        lastChecked: new Date(),
      })
    } catch (error: any) {
      set({ error: error.message || '导入密钥对失败' })
      throw error
    }
  },

  // ============================================
  // 签名管理方法
  // ============================================

  signRecord: async (recordId, recordData) => {
    set({ isLoading: true, error: null })
    try {
      // 这里简化处理，实际应该使用存储的私钥
      const cryptoKeyPair = await digitalSignatureService.generateRSAKeyPair()
      const signatureData = await digitalSignatureService.signRecord(recordData, cryptoKeyPair.privateKey)
      signatureData.recordId = recordId

      set(state => ({
        signatures: [...state.signatures, signatureData],
        currentSignature: signatureData,
        isLoading: false,
      }))

      return signatureData
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '签名失败',
      })
      throw error
    }
  },

  verifySignature: async (recordData, signatureData) => {
    set({ isLoading: true, error: null })
    try {
      const result = await digitalSignatureService.verifySignature(recordData, signatureData)

      set({
        isLoading: false,
      })

      return result.isValid
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '验证失败',
      })
      return false
    }
  },

  // ============================================
  // 证明管理方法
  // ============================================

  generateProof: async (record, patient, therapist, template = 'standard') => {
    set({ isLoading: true, error: null })
    try {
      const proof = await proofGeneratorService.generateProof(record, patient, therapist, template)

      set(state => ({
        proofs: [...state.proofs, proof],
        currentProof: proof,
        isLoading: false,
      }))

      return proof
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '生成证明失败',
      })
      throw error
    }
  },

  verifyProof: async (proof) => {
    set({ isLoading: true, error: null })
    try {
      const result = await proofGeneratorService.verifyProof(proof)

      set({
        verificationResult: result,
        isLoading: false,
      })

      return result
    } catch (error: any) {
      const result: ProofVerificationResult = {
        isValid: false,
        proofId: proof.id,
        proofNumber: proof.proofNumber,
        timestamp: {
          isValid: false,
          timestamp: new Date(),
          provider: 'unknown',
        },
        signature: {
          isValid: false,
          signedBy: 'unknown',
          signedAt: new Date(),
        },
        recordIntegrity: {
          isValid: false,
          hashMatch: false,
        },
        verifiedAt: new Date(),
        errors: [error.message || '验证失败'],
      }

      set({
        verificationResult: result,
        isLoading: false,
      })

      return result
    }
  },

  downloadProofPdf: async (proof, options) => {
    try {
      const pdfBlob = await proofGeneratorService.generatePdfProof({ proof }, options)
      
      // 创建下载链接
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `治疗证明_${proof.proofNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      set({ error: error.message || '导出PDF失败' })
      throw error
    }
  },

  // ============================================
  // 辅助方法
  // ============================================

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set({
      keyPair: null,
      certificate: null,
      hasKeys: false,
      isGenerating: false,
      lastChecked: null,
      signatures: [],
      currentSignature: null,
      isLoading: false,
      error: null,
      proofs: [],
      currentProof: null,
      verificationResult: null,
    })
  },
}))