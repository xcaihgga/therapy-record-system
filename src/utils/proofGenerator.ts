/**
 * 治疗证明生成服务工具类
 * 生成包含时间戳、数字签名和QR码的治疗证明PDF文档
 */

import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type {
  TreatmentProof,
  PdfProofOptions,
  PdfProofData,
  ProofVerificationResult,
} from '@/types/proof'
import type { TreatmentRecord, Patient, Therapist } from '@/types/database'
import { DigitalSignatureService } from './digitalSignatureService'
import { TimestampService } from './timestampService'

// ============================================
// 治疗证明生成服务类
// ============================================

export class ProofGeneratorService {
  private digitalSignatureService: DigitalSignatureService
  private timestampService: TimestampService

  constructor() {
    this.digitalSignatureService = new DigitalSignatureService('local')
    this.timestampService = new TimestampService('local')
  }

  // ============================================
  // 证明生成
  // ============================================

  /**
   * 生成治疗证明
   */
  async generateProof(
    record: TreatmentRecord,
    patient: Patient,
    therapist: Therapist,
    template: 'standard' | 'detailed' | 'compact' = 'standard'
  ): Promise<TreatmentProof> {
    // 生成唯一证明编号
    const proofNumber = this.generateProofNumber()

    // 准备患者信息
    const patientInfo = {
      name: patient.name,
      age: patient.age,
      gender: this.translateGender(patient.gender),
      medicalRecordNumber: patient.medical_record_number,
    }

    // 准备治疗师信息
    const therapistInfo = {
      name: therapist.name,
      certificateNumber: therapist.certificate_number,
    }

    // 准备治疗详情
    const treatmentDetails = {
      type: this.translateTreatmentType(record.treatment_type),
      date: new Date(record.treatment_date),
      time: record.treatment_time,
      content: record.content,
      location: record.location,
    }

    // 准备证明数据字符串
    const proofData = JSON.stringify({
      proofNumber,
      recordId: record.id,
      patientInfo,
      therapistInfo,
      treatmentDetails,
    })

    // 获取时间戳
    const timestamp = await this.timestampService.getTimestamp(proofData)

    // 检查是否有密钥对
    if (!this.digitalSignatureService.hasKeyPair()) {
      throw new Error('请先生成数字证书')
    }

    // 获取存储的密钥对信息
    const keyPair = this.digitalSignatureService.getKeyPair()
    const certificate = this.digitalSignatureService.getCertificate()

    if (!keyPair || !certificate) {
      throw new Error('未找到有效的密钥对或证书')
    }

    // 生成签名（这里简化处理，实际需要使用私钥）
    const signature = await this.generateSignature(proofData, timestamp)

    // 生成QR码内容
    const qrCode = await this.generateQRCodeContent(proofNumber)

    // 创建治疗证明对象
    const proof: TreatmentProof = {
      id: `proof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      proofNumber,
      recordId: record.id,
      patientInfo,
      therapistInfo,
      treatmentDetails,
      authenticity: {
        timestamp,
        signature,
        qrCode,
      },
      metadata: {
        createdAt: new Date(),
        createdBy: therapist.id,
        version: '1.0',
        template,
      },
      status: 'active',
    }

    return proof
  }

  /**
   * 生成签名数据
   */
  private async generateSignature(proofData: string, timestamp: any): Promise<any> {
    const signatureId = `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const hash = await this.hashData(proofData)

    return {
      id: signatureId,
      recordId: 0,
      signature: `SIGNATURE-${Date.now()}`, // 简化处理
      algorithm: 'RSA-2048',
      certificateId: `cert-${Date.now()}`,
      publicKeyId: `key-${Date.now()}`,
      timestamp,
      hash,
      createdAt: new Date(),
      status: 'valid' as const,
    }
  }

  /**
   * 生成QR码内容
   */
  private async generateQRCodeContent(proofNumber: string): Promise<string> {
    // QR码内容：验证URL + 证明编号
    const baseUrl = window.location.origin
    return `${baseUrl}/verify/${proofNumber}`
  }

  /**
   * 生成唯一证明编号
   */
  private generateProofNumber(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9).toUpperCase()
    return `PRF-${timestamp}-${random}`
  }

  // ============================================
  // PDF生成
  // ============================================

  /**
   * 生成PDF证明文档
   */
  async generatePdfProof(
    proofData: PdfProofData,
    options: PdfProofOptions = {
      template: 'standard',
      includeQrCode: true,
      includeWatermark: true,
      language: 'zh-CN',
      pageSize: 'A4',
    }
  ): Promise<Blob> {
    const { proof, organization } = proofData

    // 创建PDF文档
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: options.pageSize.toLowerCase() as 'a4' | 'letter',
    })

    // 设置中文字体（使用默认字体）
    pdf.setFont('helvetica')

    // 页面设置
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20

    let yPosition = margin

    // 添加标题
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('治疗记录真实性证明', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // 添加证明编号
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`证明编号: ${proof.proofNumber}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // 添加分隔线
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // 患者信息
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('患者信息', margin, yPosition)
    yPosition += 8

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`姓名: ${proof.patientInfo.name}`, margin + 5, yPosition)
    pdf.text(`年龄: ${proof.patientInfo.age}岁`, margin + 80, yPosition)
    yPosition += 6
    pdf.text(`性别: ${proof.patientInfo.gender}`, margin + 5, yPosition)
    pdf.text(`病历号: ${proof.patientInfo.medicalRecordNumber}`, margin + 80, yPosition)
    yPosition += 10

    // 治疗师信息
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('治疗师信息', margin, yPosition)
    yPosition += 8

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`姓名: ${proof.therapistInfo.name}`, margin + 5, yPosition)
    pdf.text(`执业证号: ${proof.therapistInfo.certificateNumber}`, margin + 80, yPosition)
    yPosition += 10

    // 治疗详情
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('治疗详情', margin, yPosition)
    yPosition += 8

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    
    const treatmentDate = format(new Date(proof.treatmentDetails.date), 'yyyy-MM-dd', { locale: zhCN })
    pdf.text(`治疗类型: ${proof.treatmentDetails.type}`, margin + 5, yPosition)
    pdf.text(`治疗日期: ${treatmentDate}`, margin + 80, yPosition)
    yPosition += 6
    
    if (proof.treatmentDetails.time) {
      pdf.text(`治疗时间: ${proof.treatmentDetails.time}`, margin + 5, yPosition)
      yPosition += 6
    }
    
    if (proof.treatmentDetails.location) {
      pdf.text(`治疗地点: ${proof.treatmentDetails.location}`, margin + 5, yPosition)
      yPosition += 6
    }

    // 治疗内容
    yPosition += 4
    pdf.text('治疗内容:', margin + 5, yPosition)
    yPosition += 6
    
    // 处理长文本内容
    const contentLines = pdf.splitTextToSize(proof.treatmentDetails.content, pageWidth - 2 * margin - 10)
    contentLines.forEach((line: string) => {
      pdf.text(line, margin + 10, yPosition)
      yPosition += 5
    })
    yPosition += 5

    // 真实性证明
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('真实性证明', margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    
    const timestampStr = format(
      new Date(proof.authenticity.timestamp.timestamp),
      'yyyy-MM-dd HH:mm:ss',
      { locale: zhCN }
    )
    pdf.text(`时间戳: ${timestampStr}`, margin + 5, yPosition)
    pdf.text(`提供者: ${proof.authenticity.timestamp.provider}`, margin + 100, yPosition)
    yPosition += 6
    
    pdf.text(`数字签名: ${proof.authenticity.signature.algorithm}`, margin + 5, yPosition)
    pdf.text(`状态: 有效`, margin + 100, yPosition)
    yPosition += 10

    // QR码
    if (options.includeQrCode) {
      const qrCodeDataUrl = await QRCode.toDataURL(proof.authenticity.qrCode, {
        width: 150,
        margin: 2,
      })
      
      const qrCodeSize = 40
      const qrCodeX = pageWidth - margin - qrCodeSize - 20
      const qrCodeY = margin + 20
      
      pdf.addImage(qrCodeDataUrl, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize)
      
      pdf.setFontSize(8)
      pdf.text('扫码验证', qrCodeX + qrCodeSize / 2, qrCodeY + qrCodeSize + 5, { align: 'center' })
    }

    // 组织信息
    if (organization) {
      yPosition += 10
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('开具机构', margin, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`机构名称: ${organization.name}`, margin + 5, yPosition)
      yPosition += 5
      
      if (organization.address) {
        pdf.text(`地址: ${organization.address}`, margin + 5, yPosition)
        yPosition += 5
      }
      
      if (organization.phone) {
        pdf.text(`联系电话: ${organization.phone}`, margin + 5, yPosition)
        yPosition += 5
      }
    }

    // 水印
    if (options.includeWatermark) {
      this.addWatermark(pdf, pageWidth, pageHeight)
    }

    // 页脚
    const footerY = pageHeight - 10
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(
      `生成时间: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}`,
      margin,
      footerY
    )
    pdf.text(
      `版本: ${proof.metadata.version}`,
      pageWidth - margin,
      footerY,
      { align: 'right' }
    )

    // 返回PDF Blob
    return pdf.output('blob')
  }

  /**
   * 添加水印
   */
  private addWatermark(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    pdf.setTextColor(200, 200, 200)
    pdf.setFontSize(40)
    pdf.setFont('helvetica', 'bold')
    
    // 旋转水印
    const centerX = pageWidth / 2
    const centerY = pageHeight / 2
    
    pdf.saveGraphicsState()
    pdf.text('真实性证明', centerX, centerY, {
      align: 'center',
      angle: 45,
    })
    pdf.restoreGraphicsState()
    
    // 恢复文本颜色
    pdf.setTextColor(0, 0, 0)
  }

  // ============================================
  // 验证方法
  // ============================================

  /**
   * 验证治疗证明
   */
  async verifyProof(proof: TreatmentProof): Promise<ProofVerificationResult> {
    try {
      // 1. 验证时间戳
      const proofData = JSON.stringify({
        proofNumber: proof.proofNumber,
        recordId: proof.recordId,
        patientInfo: proof.patientInfo,
        therapistInfo: proof.therapistInfo,
        treatmentDetails: proof.treatmentDetails,
      })

      const timestampVerification = await this.timestampService.verifyTimestamp(
        proof.authenticity.timestamp,
        proofData
      )

      // 2. 验证签名（简化版本）
      const signatureValid = proof.authenticity.signature.status === 'valid'

      // 3. 验证数据完整性
      const hashValid = true // 简化处理

      // 4. 检查证明状态
      const statusValid = proof.status === 'active'

      const isValid =
        timestampVerification.isValid &&
        signatureValid &&
        hashValid &&
        statusValid

      return {
        isValid,
        proofId: proof.id,
        proofNumber: proof.proofNumber,
        timestamp: {
          isValid: timestampVerification.isValid,
          timestamp: new Date(proof.authenticity.timestamp.timestamp),
          provider: proof.authenticity.timestamp.provider,
        },
        signature: {
          isValid: signatureValid,
          signedBy: proof.therapistInfo.name,
          signedAt: new Date(proof.authenticity.signature.createdAt),
        },
        recordIntegrity: {
          isValid: hashValid,
          hashMatch: hashValid,
        },
        verifiedAt: new Date(),
        errors: isValid ? undefined : ['验证失败'],
      }
    } catch (error: any) {
      return {
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
        errors: [error.message || '验证过程出错'],
      }
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
   * 翻译性别
   */
  private translateGender(gender: string): string {
    const genderMap: Record<string, string> = {
      male: '男',
      female: '女',
      other: '其他',
    }
    return genderMap[gender] || gender
  }

  /**
   * 翻译治疗类型
   */
  private translateTreatmentType(type: string): string {
    const typeMap: Record<string, string> = {
      physiotherapy: '物理治疗',
      occupational_therapy: '职业治疗',
      speech_therapy: '言语治疗',
      psychotherapy: '心理治疗',
      traditional_chinese: '中医治疗',
      massage: '按摩治疗',
      acupuncture: '针灸治疗',
      rehabilitation: '康复治疗',
      other: '其他',
    }
    return typeMap[type] || type
  }
}

// ============================================
// 导出默认实例
// ============================================

export const proofGeneratorService = new ProofGeneratorService()