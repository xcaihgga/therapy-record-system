import { create } from 'zustand'
import { Patient } from '@/types/database'
import { patientApi, type PaginatedResponse } from '@/api/patients'
import type { PatientSearchParams } from '@/lib/validations'

interface PatientState {
  // 状态
  patients: Patient[]
  selectedPatient: Patient | null
  isLoading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  pageSize: number
  
  // 操作
  fetchPatients: () => Promise<void>
  searchPatients: (params: PatientSearchParams) => Promise<PaginatedResponse<Patient>>
  addPatient: (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => Promise<Patient>
  updatePatient: (id: number, data: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>) => Promise<Patient>
  deletePatient: (id: number) => Promise<void>
  selectPatient: (patient: Patient | null) => void
  getPatientById: (id: number) => Promise<Patient>
  clearError: () => void
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  selectedPatient: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,

  // 获取所有患者
  fetchPatients: async () => {
    set({ isLoading: true, error: null })
    try {
      const patients = await patientApi.getAll()
      set({ 
        patients, 
        isLoading: false,
        totalCount: patients.length,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取患者列表失败'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  // 高级搜索
  searchPatients: async (params: PatientSearchParams) => {
    set({ isLoading: true, error: null })
    try {
      const result = await patientApi.searchAdvanced(params)
      set({ 
        patients: result.data,
        totalCount: result.total,
        currentPage: result.page,
        pageSize: result.pageSize,
        isLoading: false,
      })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索患者失败'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  // 添加患者（乐观更新）
  addPatient: async (patientData) => {
    set({ isLoading: true, error: null })
    
    // 乐观更新：临时添加一个本地ID
    const tempId = Date.now()
    const optimisticPatient = {
      ...patientData,
      id: tempId,
      created_at: new Date(),
      updated_at: new Date(),
    } as Patient
    
    // 立即更新UI
    set(state => ({
      patients: [optimisticPatient, ...state.patients],
      totalCount: state.totalCount + 1,
    }))
    
    try {
      const newPatient = await patientApi.create(patientData)
      
      // 用真实数据替换临时数据
      set(state => ({
        patients: state.patients.map(p => 
          p.id === tempId ? newPatient : p
        ),
        isLoading: false,
      }))
      
      return newPatient
    } catch (error) {
      // 回滚：移除临时添加的数据
      set(state => ({
        patients: state.patients.filter(p => p.id !== tempId),
        totalCount: state.totalCount - 1,
        isLoading: false,
        error: error instanceof Error ? error.message : '添加患者失败',
      }))
      throw error
    }
  },

  // 更新患者（乐观更新）
  updatePatient: async (id, data) => {
    set({ isLoading: true, error: null })
    
    // 保存原始数据用于回滚
    const originalPatient = get().patients.find(p => p.id === id)
    
    // 乐观更新：立即更新UI
    set(state => ({
      patients: state.patients.map(p =>
        p.id === id ? { ...p, ...data, updated_at: new Date() } : p
      ),
    }))
    
    try {
      const updatedPatient = await patientApi.update(id, data)
      
      // 更新为服务器返回的真实数据
      set(state => ({
        patients: state.patients.map(p =>
          p.id === id ? updatedPatient : p
        ),
        selectedPatient: state.selectedPatient?.id === id ? updatedPatient : state.selectedPatient,
        isLoading: false,
      }))
      
      return updatedPatient
    } catch (error) {
      // 回滚：恢复原始数据
      if (originalPatient) {
        set(state => ({
          patients: state.patients.map(p =>
            p.id === id ? originalPatient : p
          ),
          isLoading: false,
          error: error instanceof Error ? error.message : '更新患者失败',
        }))
      }
      throw error
    }
  },

  // 删除患者（乐观更新）
  deletePatient: async (id) => {
    set({ isLoading: true, error: null })
    
    // 保存被删除的数据用于回滚
    const deletedPatient = get().patients.find(p => p.id === id)
    
    // 乐观更新：立即从列表中移除
    set(state => ({
      patients: state.patients.filter(p => p.id !== id),
      totalCount: state.totalCount - 1,
      selectedPatient: state.selectedPatient?.id === id ? null : state.selectedPatient,
    }))
    
    try {
      await patientApi.delete(id)
      set({ isLoading: false })
    } catch (error) {
      // 回滚：恢复被删除的数据
      if (deletedPatient) {
        set(state => ({
          patients: [...state.patients, deletedPatient],
          totalCount: state.totalCount + 1,
          isLoading: false,
          error: error instanceof Error ? error.message : '删除患者失败',
        }))
      }
      throw error
    }
  },

  // 选择患者
  selectPatient: (patient) => {
    set({ selectedPatient: patient })
  },

  // 获取患者详情
  getPatientById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const patient = await patientApi.getById(id)
      set({ 
        selectedPatient: patient,
        isLoading: false,
      })
      return patient
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取患者详情失败'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  },
}))