import { z } from 'zod'

// 登录表单验证schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱或手机号')
    .refine(
      (val) => {
        // 验证是邮箱还是手机号
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const phoneRegex = /^1[3-9]\d{9}$/
        return emailRegex.test(val) || phoneRegex.test(val)
      },
      { message: '请输入有效的邮箱或手机号' }
    ),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(6, '密码至少6个字符'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// 注册表单验证schema
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, '请输入姓名')
    .min(2, '姓名至少2个字符')
    .max(20, '姓名最多20个字符'),
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(8, '密码至少8个字符')
    .max(50, '密码最多50个字符')
    .refine(
      (val) => {
        // 密码强度验证：至少包含大小写字母和数字
        const hasUpperCase = /[A-Z]/.test(val)
        const hasLowerCase = /[a-z]/.test(val)
        const hasNumber = /\d/.test(val)
        return hasUpperCase && hasLowerCase && hasNumber
      },
      { message: '密码必须包含大小写字母和数字' }
    ),
  confirmPassword: z
    .string()
    .min(1, '请确认密码'),
  certificate_number: z
    .string()
    .min(1, '请输入执业证书编号')
    .min(6, '证书编号至少6个字符')
    .max(20, '证书编号最多20个字符')
    .regex(/^[A-Za-z0-9]+$/, '证书编号只能包含字母和数字'),
  phone: z
    .string()
    .min(1, '请输入手机号')
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次密码输入不一致',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

// 用户编辑验证schema
export const userEditSchema = z.object({
  name: z
    .string()
    .min(2, '姓名至少2个字符')
    .max(20, '姓名最多20个字符')
    .optional(),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号')
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'therapist', 'assistant', 'viewer']).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
})

export type UserEditFormData = z.infer<typeof userEditSchema>

// 治疗记录验证schema
export const therapyRecordSchema = z.object({
  patient_id: z
    .number()
    .min(1, '请选择患者'),
  treatment_type: z
    .enum([
      'physiotherapy',
      'occupational_therapy',
      'speech_therapy',
      'psychotherapy',
      'traditional_chinese',
      'massage',
      'acupuncture',
      'rehabilitation',
      'other'
    ]),
  treatment_date: z
    .string()
    .min(1, '请选择治疗日期'),
  treatment_time: z
    .string()
    .min(1, '请选择治疗时间'),
  content: z
    .string()
    .min(10, '治疗过程描述至少10个字符')
    .max(5000, '治疗过程描述最多5000个字符'),
  location: z
    .string()
    .max(100, '地点最多100个字符')
    .optional()
    .or(z.literal('')),
  status: z
    .enum(['draft', 'completed', 'reviewed', 'archived'])
    .default('draft'),
})

export type TherapyRecordFormData = z.infer<typeof therapyRecordSchema>

// 治疗记录筛选验证schema
export const therapyRecordFilterSchema = z.object({
  patient_id: z.number().optional(),
  treatment_type: z.enum([
    'physiotherapy',
    'occupational_therapy',
    'speech_therapy',
    'psychotherapy',
    'traditional_chinese',
    'massage',
    'acupuncture',
    'rehabilitation',
    'other'
  ]).optional(),
  status: z.enum(['draft', 'completed', 'reviewed', 'archived']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
})

export type TherapyRecordFilterFormData = z.infer<typeof therapyRecordFilterSchema>

// 患者表单验证schema
export const patientSchema = z.object({
  name: z
    .string()
    .min(1, '请输入患者姓名')
    .min(2, '姓名至少2个字符')
    .max(50, '姓名最多50个字符'),
  age: z
    .number()
    .min(0, '年龄不能小于0岁')
    .max(150, '年龄不能超过150岁'),
  gender: z.enum(['male', 'female', 'other']),
  phone: z
    .string()
    .min(1, '请输入联系方式')
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  medical_record_number: z
    .string()
    .min(1, '请输入病历号')
    .min(3, '病历号至少3个字符')
    .max(20, '病历号最多20个字符')
    .regex(/^[A-Za-z0-9\-_]+$/, '病历号只能包含字母、数字、横线和下划线'),
  diagnosis: z
    .string()
    .max(500, '诊断信息最多500个字符')
    .optional()
    .or(z.literal('')),
})

export type PatientFormData = z.infer<typeof patientSchema>

// 患者搜索验证schema
export const patientSearchSchema = z.object({
  query: z.string().optional(),
  ageMin: z.number().min(0).max(150).optional(),
  ageMax: z.number().min(0).max(150).optional(),
  gender: z.enum(['male', 'female', 'other', 'all']).optional(),
  diagnosis: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'age', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PatientSearchParams = z.infer<typeof patientSearchSchema>