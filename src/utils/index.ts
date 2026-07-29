// API工具函数
// 用于与后端API进行交互

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // 添加认证token（如果存在）
  const token = localStorage.getItem('auth_token')
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.statusText}`)
  }

  return response.json()
}

// 常用的HTTP方法封装
export const api = {
  get: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
}

// 导出真实性证明相关工具类
export { TimestampService, timestampService } from './timestampService'
export { DigitalSignatureService, digitalSignatureService } from './digitalSignatureService'
export { ProofGeneratorService, proofGeneratorService } from './proofGenerator'

// 导出安全相关功能
export * from './security'