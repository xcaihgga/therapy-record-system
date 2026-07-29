import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">个人中心</h1>
        <p className="text-muted-foreground">查看和管理您的账户信息</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>您的账户基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">姓名</p>
              <p className="text-lg">{user?.name || '未设置'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">邮箱</p>
              <p className="text-lg">{user?.email || '未设置'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">手机号</p>
              <p className="text-lg">{user?.phone || '未设置'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">执业证书编号</p>
              <p className="text-lg">{user?.certificate_number || '未设置'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">角色</p>
              <p className="text-lg">{user?.role || '未设置'}</p>
            </div>
          </div>
          <Button>编辑信息</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>安全设置</CardTitle>
          <CardDescription>管理您的账户安全</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">修改密码</Button>
        </CardContent>
      </Card>
    </div>
  )
}