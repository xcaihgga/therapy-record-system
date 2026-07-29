import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore, isAdmin } from '@/stores/authStore'
import { UserRole, UserStatus } from '@/types/database'
import { userEditSchema, type UserEditFormData } from '@/lib/validations'
import { api } from '@/utils'

interface User {
  id: number
  name: string
  email: string
  phone: string
  certificate_number: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
  })

  // 检查权限
  useEffect(() => {
    if (!isAdmin(currentUser)) {
      console.error('权限不足：只有管理员可以访问此页面')
      return
    }
    fetchUsers()
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get<User[]>('/api/users')
      setUsers(response)
    } catch (error) {
      console.error('获取用户列表失败:', error)
      // 使用模拟数据
      setUsers([
        {
          id: 1,
          name: '管理员',
          email: 'admin@example.com',
          phone: '13800138000',
          certificate_number: 'ADMIN001',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: '治疗师A',
          email: 'therapistA@example.com',
          phone: '13800138001',
          certificate_number: 'CERT123456',
          role: UserRole.THERAPIST,
          status: UserStatus.ACTIVE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: '实习生B',
          email: 'assistant@example.com',
          phone: '13800138002',
          certificate_number: 'INT001',
          role: UserRole.ASSISTANT,
          status: UserStatus.PENDING,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditing(true)
    reset({
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
    })
  }

  const handleUpdateUser = async (data: UserEditFormData) => {
    if (!selectedUser) return

    try {
      await api.put(`/api/users/${selectedUser.id}`, data)
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...data, role: data.role as UserRole, status: data.status as UserStatus }
          : u
      ))
      setIsEditing(false)
      setSelectedUser(null)
      reset()
    } catch (error) {
      console.error('更新用户失败:', error)
      // 模拟更新
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...data, role: data.role as UserRole, status: data.status as UserStatus }
          : u
      ))
      setIsEditing(false)
      setSelectedUser(null)
      reset()
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除此用户吗？此操作不可恢复。')) return

    try {
      await api.delete(`/api/users/${userId}`)
      setUsers(users.filter(u => u.id !== userId))
    } catch (error) {
      console.error('删除用户失败:', error)
      // 模拟删除
      setUsers(users.filter(u => u.id !== userId))
    }
  }

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: '管理员',
      [UserRole.THERAPIST]: '治疗师',
      [UserRole.ASSISTANT]: '实习生',
      [UserRole.VIEWER]: '观察员',
    }
    return labels[role] || role
  }

  const getStatusLabel = (status: UserStatus): string => {
    const labels: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: '活跃',
      [UserStatus.INACTIVE]: '停用',
      [UserStatus.PENDING]: '待审核',
      [UserStatus.SUSPENDED]: '已暂停',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: UserStatus): string => {
    const colors: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [UserStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
      [UserStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [UserStatus.SUSPENDED]: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.includes(searchTerm) || 
                         user.email.includes(searchTerm) ||
                         user.phone.includes(searchTerm)
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  if (!isAdmin(currentUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">权限不足</h1>
          <p className="text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
          <CardDescription>管理系统用户、分配权限和角色</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜索用户（姓名、邮箱、手机号）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">所有角色</option>
              <option value={UserRole.ADMIN}>管理员</option>
              <option value={UserRole.THERAPIST}>治疗师</option>
              <option value={UserRole.ASSISTANT}>实习生</option>
              <option value={UserRole.VIEWER}>观察员</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">所有状态</option>
              <option value={UserStatus.ACTIVE}>活跃</option>
              <option value={UserStatus.INACTIVE}>停用</option>
              <option value={UserStatus.PENDING}>待审核</option>
              <option value={UserStatus.SUSPENDED}>已暂停</option>
            </select>
          </div>

          {/* 用户列表 */}
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">姓名</th>
                    <th className="text-left py-3 px-4">邮箱</th>
                    <th className="text-left py-3 px-4">手机号</th>
                    <th className="text-left py-3 px-4">执业证书</th>
                    <th className="text-left py-3 px-4">角色</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{user.name}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.phone}</td>
                      <td className="py-3 px-4">{user.certificate_number}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑用户对话框 */}
      {isEditing && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>编辑用户</CardTitle>
              <CardDescription>修改用户信息和权限</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleUpdateUser)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">姓名</label>
                  <Input
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">手机号</label>
                  <Input
                    {...register('phone')}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">角色</label>
                  <select
                    {...register('role')}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value={UserRole.ADMIN}>管理员</option>
                    <option value={UserRole.THERAPIST}>治疗师</option>
                    <option value={UserRole.ASSISTANT}>实习生</option>
                    <option value={UserRole.VIEWER}>观察员</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">状态</label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value={UserStatus.ACTIVE}>活跃</option>
                    <option value={UserStatus.INACTIVE}>停用</option>
                    <option value={UserStatus.PENDING}>待审核</option>
                    <option value={UserStatus.SUSPENDED}>已暂停</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    保存
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsEditing(false)
                      setSelectedUser(null)
                      reset()
                    }}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}