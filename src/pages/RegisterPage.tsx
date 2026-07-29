import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { registerSchema, type RegisterFormData } from '@/lib/validations'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // 监听密码输入，用于密码强度提示
  const password = watch('password', '')
  
  // 清除错误消息
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  // 计算密码强度
  const getPasswordStrength = (pwd: string): { strength: string; color: string; percentage: number } => {
    if (!pwd) return { strength: '', color: '', percentage: 0 }
    
    let strength = 0
    if (pwd.length >= 8) strength += 25
    if (pwd.length >= 12) strength += 10
    if (/[A-Z]/.test(pwd)) strength += 20
    if (/[a-z]/.test(pwd)) strength += 20
    if (/\d/.test(pwd)) strength += 15
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength += 10
    
    if (strength <= 40) return { strength: '弱', color: 'bg-red-500', percentage: strength }
    if (strength <= 70) return { strength: '中等', color: 'bg-yellow-500', percentage: strength }
    return { strength: '强', color: 'bg-green-500', percentage: Math.min(strength, 100) }
  }

  const passwordStrength = getPasswordStrength(password)

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data)
      setRegistrationSuccess(true)
      // 3秒后跳转到登录页
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      // 错误已在store中处理
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">注册成功！</CardTitle>
            <CardDescription>
              您的账户已创建成功，即将跳转到登录页面...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">注册账户</CardTitle>
          <CardDescription className="text-center">
            填写信息创建您的治疗师账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 全局错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                姓名 <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                placeholder="请输入您的真实姓名"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                邮箱 <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                手机号 <span className="text-red-500">*</span>
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入11位手机号"
                {...register('phone')}
                className={errors.phone ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="certificate_number" className="text-sm font-medium text-gray-700">
                执业证书编号 <span className="text-red-500">*</span>
              </label>
              <Input
                id="certificate_number"
                placeholder="请输入执业证书编号"
                {...register('certificate_number')}
                className={errors.certificate_number ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.certificate_number && (
                <p className="text-sm text-red-600">{errors.certificate_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                密码 <span className="text-red-500">*</span>
              </label>
              <Input
                id="password"
                type="password"
                placeholder="8-50位，包含大小写字母和数字"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
              
              {/* 密码强度指示器 */}
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">密码强度</span>
                    <span className="text-xs font-medium">{passwordStrength.strength}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  注册中...
                </span>
              ) : (
                '注册'
              )}
            </Button>

            <div className="text-center text-sm">
              已有账户？{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                立即登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}