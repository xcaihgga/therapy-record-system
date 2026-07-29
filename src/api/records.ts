import { api } from '@/utils'
import type { TreatmentRecord } from '@/types/database'

export const recordApi = {
  getAll: () =>
    api.get<TreatmentRecord[]>('/api/records'),

  getById: (id: number) =>
    api.get<TreatmentRecord>(`/api/records/${id}`),

  create: (data: FormData) =>
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/records`, {
      method: 'POST',
      body: data,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    }).then(res => res.json()),

  update: (id: number, data: Partial<TreatmentRecord>) =>
    api.put<TreatmentRecord>(`/api/records/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/api/records/${id}`),

  getByPatientId: (patientId: number) =>
    api.get<TreatmentRecord[]>(`/api/records/patient/${patientId}`),
}