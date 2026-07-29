import { api } from '@/utils'
import type { Patient } from '@/types/database'
import type { PatientSearchParams } from '@/lib/validations'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const patientApi = {
  // 获取所有患者（简单列表）
  getAll: () =>
    api.get<Patient[]>('/api/patients'),

  // 获取患者详情
  getById: (id: number) =>
    api.get<Patient>(`/api/patients/${id}`),

  // 创建患者
  create: (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Patient>('/api/patients', data),

  // 更新患者信息
  update: (id: number, data: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>) =>
    api.put<Patient>(`/api/patients/${id}`, data),

  // 删除患者
  delete: (id: number) =>
    api.delete<void>(`/api/patients/${id}`),

  // 模糊搜索（姓名、病历号）
  search: (query: string) =>
    api.get<Patient[]>(`/api/patients/search?q=${encodeURIComponent(query)}`),

  // 高级筛选和分页
  searchAdvanced: (params: PatientSearchParams): Promise<PaginatedResponse<Patient>> => {
    const queryParams = new URLSearchParams()
    
    if (params.query) queryParams.append('q', params.query)
    if (params.ageMin !== undefined) queryParams.append('ageMin', params.ageMin.toString())
    if (params.ageMax !== undefined) queryParams.append('ageMax', params.ageMax.toString())
    if (params.gender && params.gender !== 'all') queryParams.append('gender', params.gender)
    if (params.diagnosis) queryParams.append('diagnosis', params.diagnosis)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    return api.get<PaginatedResponse<Patient>>(`/api/patients/search/advanced?${queryParams.toString()}`)
  },

  // 检查病历号唯一性
  checkMedicalRecordNumber: (medicalRecordNumber: string): Promise<{ exists: boolean }> =>
    api.get<{ exists: boolean }>(`/api/patients/check-mrn/${encodeURIComponent(medicalRecordNumber)}`),
}