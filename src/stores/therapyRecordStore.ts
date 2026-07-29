import { create } from 'zustand'
import { TreatmentRecord, RecordStatus, TreatmentType, Attachment } from '@/types/database'

export interface TherapyRecordWithAttachments extends TreatmentRecord {
  attachments?: Attachment[]
  patient_name?: string
  therapist_name?: string
}

export interface TherapyRecordFilters {
  patient_id?: number
  therapist_id?: number
  treatment_type?: TreatmentType
  status?: RecordStatus
  date_from?: string
  date_to?: string
  search?: string
}

export interface PaginationState {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface SortState {
  field: string
  order: 'asc' | 'desc'
}

interface TherapyRecordState {
  records: TherapyRecordWithAttachments[]
  currentRecord: TherapyRecordWithAttachments | null
  filters: TherapyRecordFilters
  pagination: PaginationState
  sort: SortState
  isLoading: boolean
  error: string | null

  // Actions
  fetchRecords: (params?: TherapyRecordFilters & { page?: number; page_size?: number }) => Promise<void>
  fetchRecordById: (id: number) => Promise<void>
  createRecord: (data: FormData) => Promise<TherapyRecordWithAttachments>
  updateRecord: (id: number, data: Partial<TreatmentRecord>) => Promise<void>
  deleteRecord: (id: number) => Promise<void>
  setFilters: (filters: Partial<TherapyRecordFilters>) => void
  clearFilters: () => void
  setPagination: (pagination: Partial<PaginationState>) => void
  setSort: (sort: SortState) => void
  setCurrentRecord: (record: TherapyRecordWithAttachments | null) => void
  clearError: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const useTherapyRecordStore = create<TherapyRecordState>((set, get) => ({
  records: [],
  currentRecord: null,
  filters: {},
  pagination: {
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  },
  sort: {
    field: 'treatment_date',
    order: 'desc',
  },
  isLoading: false,
  error: null,

  fetchRecords: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const state = get()

      // 构建查询参数
      const queryParams = new URLSearchParams()
      const filters = params || state.filters

      if (filters.patient_id) queryParams.append('patient_id', filters.patient_id.toString())
      if (filters.therapist_id) queryParams.append('therapist_id', filters.therapist_id.toString())
      if (filters.treatment_type) queryParams.append('treatment_type', filters.treatment_type)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.date_from) queryParams.append('date_from', filters.date_from)
      if (filters.date_to) queryParams.append('date_to', filters.date_to)
      if (filters.search) queryParams.append('search', filters.search)

      const page = params?.page || state.pagination.page
      const pageSize = params?.page_size || state.pagination.page_size
      queryParams.append('page', page.toString())
      queryParams.append('page_size', pageSize.toString())
      queryParams.append('sort_field', state.sort.field)
      queryParams.append('sort_order', state.sort.order)

      const response = await fetch(
        `${API_BASE_URL}/api/therapy-records?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('获取治疗记录失败')
      }

      const result = await response.json()

      set({
        records: result.data || result.records || [],
        pagination: {
          page: result.page || page,
          page_size: result.page_size || pageSize,
          total: result.total || 0,
          total_pages: result.total_pages || Math.ceil((result.total || 0) / pageSize),
        },
        isLoading: false,
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '获取治疗记录失败',
      })
      throw error
    }
  },

  fetchRecordById: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${API_BASE_URL}/api/therapy-records/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('获取治疗记录详情失败')
      }

      const record = await response.json()
      set({
        currentRecord: record,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '获取治疗记录详情失败',
      })
      throw error
    }
  },

  createRecord: async (data: FormData) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${API_BASE_URL}/api/therapy-records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: data,
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '创建治疗记录失败')
      }

      const newRecord = await response.json()

      // 乐观更新：立即添加到列表
      set(state => ({
        records: [newRecord, ...state.records],
        isLoading: false,
      }))

      return newRecord
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '创建治疗记录失败',
      })
      throw error
    }
  },

  updateRecord: async (id: number, data: Partial<TreatmentRecord>) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${API_BASE_URL}/api/therapy-records/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '更新治疗记录失败')
      }

      const updatedRecord = await response.json()

      // 乐观更新：立即更新列表中的记录
      set(state => ({
        records: state.records.map(r => r.id === id ? { ...r, ...updatedRecord } : r),
        currentRecord: state.currentRecord?.id === id ? { ...state.currentRecord, ...updatedRecord } : state.currentRecord,
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '更新治疗记录失败',
      })
      throw error
    }
  },

  deleteRecord: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${API_BASE_URL}/api/therapy-records/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '删除治疗记录失败')
      }

      // 乐观更新：立即从列表中移除
      set(state => ({
        records: state.records.filter(r => r.id !== id),
        currentRecord: state.currentRecord?.id === id ? null : state.currentRecord,
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '删除治疗记录失败',
      })
      throw error
    }
  },

  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // 重置到第一页
    }))
  },

  clearFilters: () => {
    set({
      filters: {},
      pagination: { page: 1, page_size: 10, total: 0, total_pages: 0 },
    })
  },

  setPagination: (pagination) => {
    set(state => ({
      pagination: { ...state.pagination, ...pagination },
    }))
  },

  setSort: (sort) => {
    set({ sort })
  },

  setCurrentRecord: (record) => {
    set({ currentRecord: record })
  },

  clearError: () => {
    set({ error: null })
  },
}))