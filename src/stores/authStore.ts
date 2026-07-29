import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Therapist, UserRole } from '@/types/database'
import { authApi, type RegisterRequest } from '@/api/auth'
import { 
  initializeSecurity, 
  setCurrentUser, 
  clearSecurityData,
  logAccess,
  LogOperation,
  LogLevel,
  detectAnomalies,
} from '@/utils/security'

interface AuthState {
  user: Therapist | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (data: Omit<RegisterRequest, 'password'> & { password: string; confirmPassword: string }) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  setUser: (user: Therapist | null) => void
  setToken: (token: string | null) => void
  clearError: () => void
}

// 权限检查函数
export const hasPermission = (user: Therapist | null, requiredRoles: UserRole[]): boolean => {
  if (!user) return false
  return requiredRoles.includes(user.role)
}

export const isAdmin = (user: Therapist | null): boolean => {
  return user?.role === UserRole.ADMIN
}

export const isTherapist = (user: Therapist | null): boolean => {
  return user?.role === UserRole.THERAPIST || user?.role === UserRole.ADMIN
}

export const canManageRecords = (user: Therapist | null): boolean => {
  if (!user) return false
  return [UserRole.ADMIN, UserRole.THERAPIST].includes(user.role)
}

export const canViewAllRecords = (user: Therapist | null): boolean => {
  return isAdmin(user)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login({ email, password })
          const { user, token } = response
          
          // 存储token到localStorage
          localStorage.setItem('auth_token', token)
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          // 初始化安全服务
          await initializeSecurity(user.id)
          setCurrentUser(user)
          
          // 记录登录日志（使用安全日志系统）
          await logAccess(LogOperation.LOGIN, {
            resourceType: 'user',
            resourceId: user.id,
            details: `用户 ${user.name} 登录成功`,
            level: LogLevel.INFO,
          })
          
          // 检查异常访问
          await detectAnomalies(user.id)
          
          console.log(`[登录日志] 用户 ${user.name} (${user.email}) 于 ${new Date().toLocaleString()} 登录成功`)
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || '登录失败，请检查您的凭证'
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
          })
          localStorage.removeItem('auth_token')
          
          // 记录登录失败
          await logAccess(LogOperation.LOGIN_FAILED, {
            details: `登录失败: ${email}`,
            level: LogLevel.WARNING,
            metadata: { email, error: errorMessage },
          })
          
          throw new Error(errorMessage)
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const { confirmPassword, ...registerData } = data
          const response = await authApi.register(registerData)
          const { user } = response
          
          // 注册成功后不自动登录，提示用户去登录
          set({ isLoading: false, error: null })
          
          console.log(`[注册日志] 新用户 ${user.name} (${user.email}) 于 ${new Date().toLocaleString()} 注册成功`)
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || '注册失败，请稍后重试'
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw new Error(errorMessage)
        }
      },

      logout: () => {
        const user = get().user
        
        // 记录登出日志
        if (user) {
          logAccess(LogOperation.LOGOUT, {
            resourceType: 'user',
            resourceId: user.id,
            details: `用户 ${user.name} 登出`,
            level: LogLevel.INFO,
          })
        }
        
        console.log(`[登出日志] 用户 ${user?.name} (${user?.email}) 于 ${new Date().toLocaleString()} 登出`)
        
        // 清除安全数据
        clearSecurityData()
        
        localStorage.removeItem('auth_token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null })
          return
        }

        set({ isLoading: true })
        try {
          const user = await authApi.getCurrentUser()
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          localStorage.removeItem('auth_token')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      setToken: (token) => {
        if (token) {
          localStorage.setItem('auth_token', token)
        } else {
          localStorage.removeItem('auth_token')
        }
        set({ token })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        // 不持久化user对象，每次从API获取最新数据
      }),
    }
  )
)