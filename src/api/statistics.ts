import { api } from '@/utils'

// 统计概览
export interface StatisticsOverview {
  totalPatients: number
  totalRecords: number
  totalTherapists: number
  recordsThisMonth: number
  recordsThisWeek: number
  recordsToday: number
  averageRecordsPerDay: number
  patientGrowthRate: number
}

// 治疗次数统计
export interface TreatmentCountStatistics {
  byDateRange: {
    startDate: string
    endDate: string
    count: number
  }[]
  byTherapist: {
    therapistId: number
    therapistName: string
    count: number
  }[]
  byTreatmentType: {
    treatmentType: string
    count: number
  }[]
}

// 患者分布统计
export interface PatientDistributionStatistics {
  byAgeGroup: {
    ageRange: string
    count: number
    percentage: number
  }[]
  byGender: {
    gender: string
    count: number
    percentage: number
  }[]
  byDiagnosis: {
    diagnosis: string
    count: number
    percentage: number
  }[]
}

// 治疗类型分布
export interface TreatmentTypeDistribution {
  types: {
    type: string
    count: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }[]
  trends: {
    month: string
    types: { type: string; count: number }[]
  }[]
  topTreatments: {
    type: string
    count: number
    growth: number
  }[]
}

// 时间趋势分析
export interface TimeTrendAnalysis {
  daily: { date: string; count: number }[]
  weekly: { week: string; count: number }[]
  monthly: { month: string; count: number }[]
  yearly: { year: string; count: number }[]
  patientGrowth: { date: string; total: number; new: number }[]
  treatmentEffectTrend: { period: string; averageEffect: number }[]
}

export interface StatisticsParams {
  startDate?: string
  endDate?: string
  therapistId?: number
  treatmentType?: string
  groupBy?: 'day' | 'week' | 'month' | 'year'
}

export const statisticsApi = {
  // 获取统计概览
  getOverview: () =>
    api.get<StatisticsOverview>('/api/statistics/overview'),

  // 获取治疗次数统计
  getTreatmentCount: (params?: StatisticsParams) => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.therapistId) queryParams.append('therapistId', params.therapistId.toString())
    if (params?.treatmentType) queryParams.append('treatmentType', params.treatmentType)
    return api.get<TreatmentCountStatistics>(`/api/statistics/treatment-count?${queryParams.toString()}`)
  },

  // 获取患者分布统计
  getPatientDistribution: () =>
    api.get<PatientDistributionStatistics>('/api/statistics/patient-distribution'),

  // 获取治疗类型分布
  getTreatmentTypeDistribution: (params?: StatisticsParams) => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    return api.get<TreatmentTypeDistribution>(`/api/statistics/treatment-type?${queryParams.toString()}`)
  },

  // 获取时间趋势分析
  getTimeTrend: (params?: StatisticsParams) => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.groupBy) queryParams.append('groupBy', params.groupBy)
    return api.get<TimeTrendAnalysis>(`/api/statistics/time-trend?${queryParams.toString()}`)
  },

  // 导出统计数据
  exportData: async (format: 'pdf' | 'excel' | 'json', params?: StatisticsParams): Promise<Blob> => {
    const queryParams = new URLSearchParams()
    queryParams.append('format', format)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const token = localStorage.getItem('auth_token')
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/statistics/export?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    
    if (!response.ok) {
      throw new Error('导出数据失败')
    }
    
    return response.blob()
  },
}