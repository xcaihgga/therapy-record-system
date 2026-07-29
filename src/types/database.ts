/**
 * 治疗师治疗记录系统 - 数据库类型定义
 */

// ============================================
// 枚举类型定义
// ============================================

export enum UserRole {
  ADMIN = 'admin',
  THERAPIST = 'therapist',
  ASSISTANT = 'assistant',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum TreatmentType {
  PHYSIOTHERAPY = 'physiotherapy',
  OCCUPATIONAL_THERAPY = 'occupational_therapy',
  SPEECH_THERAPY = 'speech_therapy',
  PSYCHOTHERAPY = 'psychotherapy',
  TRADITIONAL_CHINESE = 'traditional_chinese',
  MASSAGE = 'massage',
  ACUPUNCTURE = 'acupuncture',
  REHABILITATION = 'rehabilitation',
  OTHER = 'other'
}

export enum RecordStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  ARCHIVED = 'archived'
}

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other'
}

// ============================================
// 数据库表类型定义
// ============================================

export interface Therapist {
  id: number
  name: string
  certificate_number: string
  phone: string
  email: string
  password_hash: string
  role: UserRole
  status: UserStatus
  created_at: Date
  updated_at: Date
}

export interface Patient {
  id: number
  name: string
  age: number
  gender: Gender
  phone: string
  medical_record_number: string
  diagnosis: string
  therapist_id: number
  created_at: Date
  updated_at: Date
}

export interface TreatmentRecord {
  id: number
  patient_id: number
  therapist_id: number
  treatment_type: TreatmentType
  treatment_date: Date
  treatment_time?: string
  content: string
  status: RecordStatus
  location?: string
  latitude?: number
  longitude?: number
  created_at: Date
  updated_at: Date
}

export interface Attachment {
  id: number
  record_id: number
  file_type: FileType
  file_path: string
  file_name: string
  file_size: number
  watermark_data?: string
  created_at: Date
}

// ============================================
// 输入类型定义
// ============================================

export type CreateTherapistInput = Omit<Therapist, 'id' | 'created_at' | 'updated_at'>
export type UpdateTherapistInput = Partial<Omit<Therapist, 'id' | 'created_at' | 'updated_at'>>

export type CreatePatientInput = Omit<Patient, 'id' | 'created_at' | 'updated_at'>
export type UpdatePatientInput = Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>

export type CreateTreatmentRecordInput = Omit<TreatmentRecord, 'id' | 'created_at' | 'updated_at'>
export type UpdateTreatmentRecordInput = Partial<Omit<TreatmentRecord, 'id' | 'created_at' | 'updated_at'>>

export type CreateAttachmentInput = Omit<Attachment, 'id' | 'created_at'>
export type UpdateAttachmentInput = Partial<Omit<Attachment, 'id' | 'created_at'>>