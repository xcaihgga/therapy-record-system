/**
 * 真实性证明系统类型定义
 */

// ============================================
// 时间戳服务类型
// ============================================

export interface TimestampProvider {
  id: string
  name: string
  type: 'aliyun' | 'tencent' | 'blockchain' | 'local'
  endpoint?: string
  apiKey?: string
}

export interface TimestampData {
  timestamp: number // 毫秒级时间戳
  provider: string
  proof: string // 时间戳证明（Base64编码）
  hash: string // 数据哈希值
  serialNumber?: string // 时间戳序列号
  verified: boolean
}

export interface TimestampVerification {
  isValid: boolean
  timestamp: number
  provider: string
  verifiedAt: Date
  error?: string
}

// ============================================
// 数字签名类型
// ============================================

export interface KeyPair {
  id: string
  publicKey: string // PEM格式公钥
  privateKey?: string // PEM格式私钥（加密存储）
  algorithm: 'RSA-2048' | 'ECDSA-P256'
  createdAt: Date
  expiresAt?: Date
  status: 'active' | 'expired' | 'revoked'
}

export interface Certificate {
  id: string
  version: number
  serialNumber: string
  subject: CertificateSubject
  issuer: CertificateIssuer
  publicKey: string
  signature: string
  signatureAlgorithm: string
  validity: {
    notBefore: Date
    notAfter: Date
  }
  extensions?: CertificateExtension[]
  fingerprint: string
}

export interface CertificateSubject {
  commonName: string
  organization?: string
  organizationalUnit?: string
  therapistId: number
  certificateNumber: string
}

export interface CertificateIssuer {
  commonName: string
  organization: string
  country: string
}

export interface CertificateExtension {
  id: string
  critical: boolean
  value: string
}

export interface SignatureData {
  id: string
  recordId: number
  signature: string // Base64编码的签名值
  algorithm: string
  certificateId: string
  publicKeyId: string
  timestamp: TimestampData
  hash: string // 原始数据的哈希值
  createdAt: Date
  status: 'valid' | 'invalid' | 'expired' | 'revoked'
}

export interface SignatureVerification {
  isValid: boolean
  signatureData: SignatureData
  verifiedAt: Date
  errors: string[]
}

// ============================================
// 治疗证明类型
// ============================================

export interface TreatmentProof {
  id: string
  proofNumber: string // 唯一证明编号
  recordId: number
  
  // 患者信息
  patientInfo: {
    name: string
    age: number
    gender: string
    medicalRecordNumber: string
  }
  
  // 治疗师信息
  therapistInfo: {
    name: string
    certificateNumber: string
    organization?: string
  }
  
  // 治疗详情
  treatmentDetails: {
    type: string
    date: Date
    time?: string
    content: string
    location?: string
  }
  
  // 真实性证明
  authenticity: {
    timestamp: TimestampData
    signature: SignatureData
    qrCode: string // QR码内容
  }
  
  // 元数据
  metadata: {
    createdAt: Date
    createdBy: number
    version: string
    template: 'standard' | 'detailed' | 'compact'
  }
  
  status: 'active' | 'expired' | 'revoked'
}

export interface ProofVerificationResult {
  isValid: boolean
  proofId: string
  proofNumber: string
  timestamp: {
    isValid: boolean
    timestamp: Date
    provider: string
  }
  signature: {
    isValid: boolean
    signedBy: string
    signedAt: Date
  }
  recordIntegrity: {
    isValid: boolean
    hashMatch: boolean
  }
  verifiedAt: Date
  errors?: string[]
}

// ============================================
// PDF导出类型
// ============================================

export interface PdfProofOptions {
  template: 'standard' | 'detailed' | 'compact'
  includeQrCode: boolean
  includeWatermark: boolean
  language: 'zh-CN' | 'en-US'
  pageSize: 'A4' | 'Letter'
}

export interface PdfProofData {
  proof: TreatmentProof
  organization?: {
    name: string
    logo?: string
    address?: string
    phone?: string
  }
}

// ============================================
// API响应类型
// ============================================

export interface TimestampApiResponse {
  success: boolean
  data?: TimestampData
  error?: string
}

export interface SignatureApiResponse {
  success: boolean
  data?: SignatureData
  error?: string
}

export interface ProofApiResponse {
  success: boolean
  data?: TreatmentProof
  error?: string
}

export interface VerificationApiResponse {
  success: boolean
  data?: ProofVerificationResult
  error?: string
}

// ============================================
// 加密类型
// ============================================

export interface EncryptedKey {
  keyId: string
  encryptedPrivateKey: string // 加密后的私钥
  iv: string // 初始化向量
  salt: string // 盐值
  algorithm: string
  keyDerivation: 'PBKDF2' | 'HKDF'
}

export interface EncryptionResult {
  encryptedData: string
  iv: string
  authTag?: string
}

// ============================================
// 签名管理类型
// ============================================

export interface KeyManagementState {
  keyPair: KeyPair | null
  certificate: Certificate | null
  hasKeys: boolean
  isGenerating: boolean
  lastChecked: Date | null
}

export interface SignatureManagementState {
  signatures: SignatureData[]
  currentSignature: SignatureData | null
  isLoading: boolean
  error: string | null
}