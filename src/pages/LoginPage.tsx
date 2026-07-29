import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { loginSchema, type LoginFormData } from '@/lib/validations'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError, isAuthenticated, checkAuth } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // 如果已经登录，重定向到目标页面或仪表板
  useEffect(() => {
    checkAuth()
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location, checkAuth])

  // 清除错误消息
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (error) {
      // 错误已在store中处理
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">登录系统</CardTitle>
          <CardDescription className="text-center">
            输入您的账户信息登录治疗记录系统
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
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                邮箱 / 手机号
              </label>
              <Input
                id="email"
                type="text"
                placeholder="请输入邮箱或手机号"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
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
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </Button>

            <div className="text-center text-sm">
              还没有账户？{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                立即注册
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}