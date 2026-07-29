/**
 * 水印配置类型定义
 */

export enum WatermarkPosition {
  TOP_LEFT = 'top_left',
  TOP_RIGHT = 'top_right',
  BOTTOM_LEFT = 'bottom_left',
  BOTTOM_RIGHT = 'bottom_right',
  CENTER = 'center'
}

export enum WatermarkFieldType {
  TIMESTAMP = 'timestamp',
  LOCATION = 'location',
  THERAPIST_NAME = 'therapist_name',
  THERAPIST_CERTIFICATE = 'therapist_certificate',
  PATIENT_NAME = 'patient_name',
  PATIENT_MEDICAL_NUMBER = 'patient_medical_number',
  TREATMENT_TYPE = 'treatment_type',
  CUSTOM_TEXT = 'custom_text'
}

export interface WatermarkField {
  type: WatermarkFieldType
  enabled: boolean
  label?: string
  order: number
  value?: string
}

export interface WatermarkConfig {
  // 基本设置
  enabled: boolean
  position: WatermarkPosition
  opacity: number // 0.1 - 1.0
  fontSize: number // 10 - 30
  fontColor: string
  fontFamily: string
  
  // 字段配置
  fields: WatermarkField[]
  
  // 图片水印设置
  logoEnabled: boolean
  logoPath?: string
  logoSize?: number // 宽度和高度相同
  logoOpacity?: number
  
  // 其他设置
  backgroundColor?: string
  padding: number
  borderRadius: number
  
  // 时间戳
  lastUpdated?: string
}

export interface GeoLocation {
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: number
}

export interface AddressInfo {
  formatted_address: string
  country?: string
  province?: string
  city?: string
  district?: string
  street?: string
  streetNumber?: string
}

export interface WatermarkData {
  timestamp: Date
  location?: GeoLocation
  address?: AddressInfo
  therapistName?: string
  therapistCertificate?: string
  patientName?: string
  patientMedicalNumber?: string
  treatmentType?: string
  customText?: string
}

// 默认水印配置
export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true,
  position: WatermarkPosition.BOTTOM_LEFT,
  opacity: 0.8,
  fontSize: 14,
  fontColor: '#FFFFFF',
  fontFamily: 'Arial, sans-serif',
  
  fields: [
    {
      type: WatermarkFieldType.TIMESTAMP,
      enabled: true,
      label: '拍摄时间',
      order: 1
    },
    {
      type: WatermarkFieldType.LOCATION,
      enabled: true,
      label: '位置',
      order: 2
    },
    {
      type: WatermarkFieldType.THERAPIST_NAME,
      enabled: true,
      label: '治疗师',
      order: 3
    },
    {
      type: WatermarkFieldType.THERAPIST_CERTIFICATE,
      enabled: true,
      label: '证书编号',
      order: 4
    },
    {
      type: WatermarkFieldType.PATIENT_NAME,
      enabled: true,
      label: '患者',
      order: 5
    },
    {
      type: WatermarkFieldType.PATIENT_MEDICAL_NUMBER,
      enabled: true,
      label: '病历号',
      order: 6
    },
    {
      type: WatermarkFieldType.TREATMENT_TYPE,
      enabled: true,
      label: '治疗类型',
      order: 7
    }
  ],
  
  logoEnabled: false,
  padding: 10,
  borderRadius: 5
}

// 地理定位验证结果
export interface GeoValidationResult {
  isValid: boolean
  accuracy: number
  timestamp: number
  warnings: string[]
  errors: string[]
}