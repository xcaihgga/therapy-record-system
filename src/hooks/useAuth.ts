import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    checkAuth,
    clearError,
  } = useAuthStore()

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    checkAuth,
    clearError,
  }
}