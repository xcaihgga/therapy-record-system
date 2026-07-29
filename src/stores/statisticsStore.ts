import { create } from 'zustand'
import {
  StatisticsOverview,
  TreatmentCountStatistics,
  PatientDistributionStatistics,
  TreatmentTypeDistribution,
  TimeTrendAnalysis,
  StatisticsParams,
} from '@/api/statistics'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface StatisticsState {
  overview: StatisticsOverview | null
  treatmentCount: TreatmentCountStatistics | null
  patientDistribution: PatientDistributionStatistics | null
  treatmentTypeDistribution: TreatmentTypeDistribution | null
  timeTrend: TimeTrendAnalysis | null
  params: StatisticsParams
  isLoading: boolean
  error: string | null

  // Actions
  fetchOverview: () => Promise<void>
  fetchTreatmentCount: (params?: StatisticsParams) => Promise<void>
  fetchPatientDistribution: () => Promise<void>
  fetchTreatmentTypeDistribution: (params?: StatisticsParams) => Promise<void>
  fetchTimeTrend: (params?: StatisticsParams) => Promise<void>
  setParams: (params: Partial<StatisticsParams>) => void
  clearError: () => void
  refreshAll: (params?: StatisticsParams) => Promise<void>
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  overview: null,
  treatmentCount: null,
  patientDistribution: null,
  treatmentTypeDistribution: null,
  timeTrend: null,
  params: {},
  isLoading: false,
  error: null,

  fetchOverview: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/api/statistics/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('获取统计概览失败')
      }

      const data = await response.json()
      set({ overview: data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  fetchTreatmentCount: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const queryParams = new URLSearchParams()
      const searchParams = params || get().params

      if (searchParams.startDate) queryParams.append('startDate', searchParams.startDate)
      if (searchParams.endDate) queryParams.append('endDate', searchParams.endDate)
      if (searchParams.therapistId) queryParams.append('therapistId', searchParams.therapistId.toString())
      if (searchParams.treatmentType) queryParams.append('treatmentType', searchParams.treatmentType)

      const response = await fetch(
        `${API_BASE_URL}/api/statistics/treatment-count?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('获取治疗次数统计失败')
      }

      const data = await response.json()
      set({ treatmentCount: data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  fetchPatientDistribution: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/api/statistics/patient-distribution`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('获取患者分布统计失败')
      }

      const data = await response.json()
      set({ patientDistribution: data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  fetchTreatmentTypeDistribution: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const queryParams = new URLSearchParams()
      const searchParams = params || get().params

      if (searchParams.startDate) queryParams.append('startDate', searchParams.startDate)
      if (searchParams.endDate) queryParams.append('endDate', searchParams.endDate)

      const response = await fetch(
        `${API_BASE_URL}/api/statistics/treatment-type?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('获取治疗类型分布失败')
      }

      const data = await response.json()
      set({ treatmentTypeDistribution: data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  fetchTimeTrend: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const queryParams = new URLSearchParams()
      const searchParams = params || get().params

      if (searchParams.startDate) queryParams.append('startDate', searchParams.startDate)
      if (searchParams.endDate) queryParams.append('endDate', searchParams.endDate)
      if (searchParams.groupBy) queryParams.append('groupBy', searchParams.groupBy)

      const response = await fetch(
        `${API_BASE_URL}/api/statistics/time-trend?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('获取时间趋势分析失败')
      }

      const data = await response.json()
      set({ timeTrend: data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  setParams: (params) => {
    set(state => ({ params: { ...state.params, ...params } }))
  },

  clearError: () => {
    set({ error: null })
  },

  refreshAll: async (params) => {
    const state = get()
    set({ params: params || state.params })
    
    await Promise.all([
      state.fetchOverview(),
      state.fetchTreatmentCount(params),
      state.fetchPatientDistribution(),
      state.fetchTreatmentTypeDistribution(params),
      state.fetchTimeTrend(params),
    ])
  },
}))