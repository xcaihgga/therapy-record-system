import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Users, Camera, FileText, BarChart3, Droplets,
  Settings as SettingsIcon, QrCode, MapPin, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  // 拍照记录专用底部 Tab（借鉴巡查相机 + 今日水印相机）
  const bottomTabs = [
    { name: '首页', href: '/', icon: Home },
    { name: '客户', href: '/patients', icon: Users },
    {
      name: '拍照记录',
      href: '/records/new',
      icon: Camera,
      highlight: true,
    },
    { name: '记录', href: '/records', icon: FileText },
    { name: '统计', href: '/statistics', icon: BarChart3 },
  ]

  // 顶部快捷入口（工作台）
  const quickActions = [
    { name: '二维码签到', href: '/verify', icon: QrCode, tint: 'bg-blue-500' },
    { name: '定位打卡', href: '/records/new', icon: MapPin, tint: 'bg-emerald-500' },
    { name: '水印设置', href: '/watermark-settings', icon: Droplets, tint: 'bg-purple-500' },
    { name: '偏好设置', href: '/profile', icon: SettingsIcon, tint: 'bg-amber-500' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* 顶部固定条 */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm">
        <div className="h-14 md:h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur">
              <Camera className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-wide">治疗拍照记录</div>
              <div className="text-[11px] opacity-80">一拍即一记录 · 实时水印存证</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.name}
                to={a.href}
                className="flex items-center gap-2 px-3 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                <a.icon className="w-4 h-4" />
                <span>{a.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* 移动端：首页快捷行动栏（仅首页显示，参考巡检打卡 App） */}
      {location.pathname === '/' && (
        <section className="md:hidden bg-white border-b border-slate-200">
          <div className="grid grid-cols-4 gap-1 p-3">
            {quickActions.map((a) => (
              <Link
                key={a.name}
                to={a.href}
                className="flex flex-col items-center gap-1 py-2 active:scale-95 transition-transform"
              >
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm text-white",
                  a.tint,
                )}>
                  <a.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-slate-700">{a.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 主内容区 */}
      <main className="max-w-3xl mx-auto md:max-w-6xl md:px-4 py-4 md:py-6">
        <Outlet />
      </main>

      {/* 桌面底栏 */}
      <footer className="hidden md:block border-t py-5 text-center text-xs text-slate-400">
        治疗师拍照记录系统 · 借鉴自：巡查相机(filecamera) / 今日水印相机 / 草料留痕相机 / 橙子巡检 / Immich
      </footer>

      {/* 移动端底部 Tab */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 safe-area-bottom">
        <div className="flex items-end h-16">
          {bottomTabs.map((item) => {
            const active = item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href)
            if (item.highlight) {
              // 中间凸起大按钮（主流打卡 App 风格）
              return (
                <div key={item.name} className="flex-1 flex justify-center relative">
                  <Link
                    to={item.href}
                    className={cn(
                      "-mt-7 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg",
                      active ? "bg-teal-700" : "bg-gradient-to-br from-teal-500 to-emerald-500",
                    )}
                  >
                    <Camera className="w-7 h-7" strokeWidth={2.2} />
                    <span className="text-[10px] mt-0.5">拍照</span>
                  </Link>
                </div>
              )
            }
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center h-16 gap-0.5 transition-colors",
                  active ? "text-teal-600" : "text-slate-500",
                )}
              >
                <item.icon className="w-5 h-5" strokeWidth={active ? 2.3 : 1.9} />
                <span className="text-[11px]">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
