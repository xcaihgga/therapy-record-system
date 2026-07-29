import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { FileText, Users, Calendar, User, Home, Settings, LogOut, Droplets, BarChart3, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, isAdmin } from '@/stores/authStore'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '工作台', href: '/dashboard', icon: Calendar },
    { name: '患者管理', href: '/patients', icon: Users },
    { name: '治疗记录', href: '/records', icon: FileText },
    { name: '统计分析', href: '/statistics', icon: BarChart3 },
  ]

  // 仅管理员可见的用户管理链接
  if (isAdmin(user)) {
    navigation.push({ name: '用户管理', href: '/users', icon: Settings })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-40">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h1 className="text-base md:text-xl font-bold text-primary">治疗记录系统</h1>
          </div>

          {/* Desktop user menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                {user?.name || '用户'}
              </span>
              <Link
                to="/watermark-settings"
                className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px]"
                title="水印配置"
              >
                <Droplets className="h-5 w-5" />
              </Link>
              <Link
                to="/profile"
                className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px]"
                title="个人资料"
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px]"
                title="退出登录"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px]"
            aria-label="菜单"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 right-0 w-64 h-full bg-background border-l shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="p-4 space-y-2">
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {user?.name || '用户'}
              </div>
              <Link
                to="/watermark-settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors min-h-[44px]"
              >
                <Droplets className="h-5 w-5" />
                <span>水印配置</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors min-h-[44px]"
              >
                <User className="h-5 w-5" />
                <span>个人资料</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-3 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors min-h-[44px] w-full"
              >
                <LogOut className="h-5 w-5" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b bg-muted/50">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-1 overflow-x-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors min-h-[48px]",
                      isActive
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-4 md:py-6">
        <Outlet />
      </main>

      {/* Footer - Desktop only */}
      <footer className="hidden md:block border-t py-6 text-center text-sm text-muted-foreground">
        <p>治疗师治疗记录系统 © 2024 - 专业、可靠的治疗记录管理平台</p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40">
        <div className="flex justify-around items-center h-16">
          {navigation.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-[44px] min-h-[44px] touch-manipulation",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}