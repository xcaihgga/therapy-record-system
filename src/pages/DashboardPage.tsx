import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText, Users, TrendingUp } from 'lucide-react'

const stats = [
  { name: '今日治疗', value: '12', icon: Calendar },
  { name: '本月记录', value: '156', icon: FileText },
  { name: '患者总数', value: '48', icon: Users },
  { name: '治疗效果', value: '92%', icon: TrendingUp },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">工作台</h1>
        <p className="text-muted-foreground">欢迎回来，查看今日工作概况</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            暂无最近活动记录
          </p>
        </CardContent>
      </Card>
    </div>
  )
}