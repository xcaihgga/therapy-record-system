import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore, hasPermission, isAdmin, isTherapist, canManageRecords } from '@/stores/authStore'
import { UserRole } from '@/types/database'
import { Therapist } from '@/types/database'

// Mock the auth API
vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

// Mock security utils
vi.mock('@/utils/security', () => ({
  initializeSecurity: vi.fn(),
  setCurrentUser: vi.fn(),
  clearSecurityData: vi.fn(),
  logAccess: vi.fn(),
  LogOperation: {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',
  },
  LogLevel: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
  },
  detectAnomalies: vi.fn(),
}))

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState()
      
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('Permission Functions', () => {
    const mockAdminUser: Therapist = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      certificate_number: 'CERT001',
      phone: '1234567890',
      department: 'Department 1',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const mockTherapistUser: Therapist = {
      id: '2',
      email: 'therapist@example.com',
      name: 'Therapist User',
      role: UserRole.THERAPIST,
      certificate_number: 'CERT002',
      phone: '1234567891',
      department: 'Department 2',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    describe('hasPermission', () => {
      it('should return false when user is null', () => {
        expect(hasPermission(null, [UserRole.ADMIN])).toBe(false)
      })

      it('should return true when user has required role', () => {
        expect(hasPermission(mockAdminUser, [UserRole.ADMIN])).toBe(true)
        expect(hasPermission(mockTherapistUser, [UserRole.THERAPIST])).toBe(true)
      })

      it('should return false when user lacks required role', () => {
        expect(hasPermission(mockTherapistUser, [UserRole.ADMIN])).toBe(false)
      })
    })

    describe('isAdmin', () => {
      it('should return true for admin user', () => {
        expect(isAdmin(mockAdminUser)).toBe(true)
      })

      it('should return false for non-admin user', () => {
        expect(isAdmin(mockTherapistUser)).toBe(false)
      })

      it('should return false for null user', () => {
        expect(isAdmin(null)).toBe(false)
      })
    })

    describe('isTherapist', () => {
      it('should return true for therapist user', () => {
        expect(isTherapist(mockTherapistUser)).toBe(true)
      })

      it('should return true for admin user', () => {
        expect(isTherapist(mockAdminUser)).toBe(true)
      })

      it('should return false for null user', () => {
        expect(isTherapist(null)).toBe(false)
      })
    })

    describe('canManageRecords', () => {
      it('should return true for admin user', () => {
        expect(canManageRecords(mockAdminUser)).toBe(true)
      })

      it('should return true for therapist user', () => {
        expect(canManageRecords(mockTherapistUser)).toBe(true)
      })

      it('should return false for null user', () => {
        expect(canManageRecords(null)).toBe(false)
      })
    })
  })

  describe('Actions', () => {
    describe('setUser', () => {
      it('should update user and authentication status', () => {
        const { setUser } = useAuthStore.getState()
        const mockUser: Therapist = {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.THERAPIST,
          certificate_number: 'CERT001',
          phone: '1234567890',
          department: 'Department 1',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setUser(mockUser)
        
        const state = useAuthStore.getState()
        expect(state.user).toEqual(mockUser)
        expect(state.isAuthenticated).toBe(true)
      })

      it('should clear user when setting to null', () => {
        const { setUser } = useAuthStore.getState()
        
        setUser(null)
        
        const state = useAuthStore.getState()
        expect(state.user).toBeNull()
        expect(state.isAuthenticated).toBe(false)
      })
    })

    describe('setToken', () => {
      it('should update token', () => {
        const { setToken } = useAuthStore.getState()
        const mockToken = 'test-token-123'

        setToken(mockToken)
        
        const state = useAuthStore.getState()
        expect(state.token).toBe(mockToken)
      })

      it('should clear token when setting to null', () => {
        const { setToken } = useAuthStore.getState()
        
        setToken(null)
        
        const state = useAuthStore.getState()
        expect(state.token).toBeNull()
      })
    })

    describe('clearError', () => {
      it('should clear error message', () => {
        useAuthStore.setState({ error: 'Test error' })
        
        const { clearError } = useAuthStore.getState()
        clearError()
        
        const state = useAuthStore.getState()
        expect(state.error).toBeNull()
      })
    })
  })
})