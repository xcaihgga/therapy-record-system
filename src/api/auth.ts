import { api } from '@/utils'
import type { Therapist } from '@/types/database'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  certificate_number: string
  phone: string
}

export interface AuthResponse {
  user: Therapist
  token: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/api/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/api/auth/register', data),

  logout: () =>
    api.post<void>('/api/auth/logout', {}),

  getCurrentUser: () =>
    api.get<Therapist>('/api/auth/me'),
}