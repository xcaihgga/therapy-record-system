import { Therapist, UserRole, UserStatus } from '@/types/database'

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

// 生成 mock token
const genToken = () => 'local-token-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)

// 本地已知用户（注册后会追加到 localStorage）
interface LocalUser {
  id: number
  name: string
  email: string
  password: string
  certificate_number: string
  phone: string
  role: UserRole
  status: UserStatus
}

const DEMO_USER: LocalUser = {
  id: 1,
  name: '演示治疗师',
  email: 'demo@therapy.local',
  password: 'demo',
  certificate_number: 'DEMO-001',
  phone: '13800000000',
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
}

function loadUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem('local_users')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {}
  return [DEMO_USER]
}

function saveUsers(users: LocalUser[]) {
  localStorage.setItem('local_users', JSON.stringify(users))
}

function toTherapist(u: LocalUser): Therapist {
  return {
    id: u.id,
    name: u.name,
    certificate_number: u.certificate_number,
    phone: u.phone,
    email: u.email,
    password_hash: u.password,
    role: u.role,
    status: u.status,
    created_at: new Date(),
    updated_at: new Date(),
  }
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const users = loadUsers()
    const user = users.find(
      (u) => (u.email === data.email || u.phone === data.email) && u.password === data.password,
    )
    if (!user) {
      throw new Error('邮箱或密码错误')
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('账户已被停用')
    }
    const token = genToken()
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user_id', String(user.id))
    return { user: toTherapist(user), token }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const users = loadUsers()
    if (users.some((u) => u.email === data.email)) {
      throw new Error('此邮箱已注册')
    }
    const newUser: LocalUser = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      password: data.password,
      certificate_number: data.certificate_number,
      phone: data.phone,
      role: UserRole.THERAPIST,
      status: UserStatus.ACTIVE,
    }
    users.push(newUser)
    saveUsers(users)
    const token = genToken()
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user_id', String(newUser.id))
    return { user: toTherapist(newUser), token }
  },

  async logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user_id')
  },

  async getCurrentUser(): Promise<Therapist> {
    const userId = localStorage.getItem('auth_user_id')
    if (!userId) {
      throw new Error('未登录')
    }
    const users = loadUsers()
    const user = users.find((u) => String(u.id) === userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    return toTherapist(user)
  },
}
