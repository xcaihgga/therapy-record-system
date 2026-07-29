import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Calendar, Activity } from 'lucide-react'
import type { StatisticsOverview } from '@/api/statistics'

interface StatsOverviewCardsProps {
  overview: StatisticsOverview | null
  isLoading?: boolean
}

export function StatsOverviewCards({ overview, isLoading }: StatsOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!overview) return null

  const stats = [
    {
      title: '患者总数',
      value: overview.totalPatients,
      description: `增长率 ${overview.patientGrowthRate.toFixed(1)}%`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: '治疗记录总数',
      value: overview.totalRecords,
      description: `日均 ${overview.averageRecordsPerDay.toFixed(1)} 条`,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: '本月记录',
      value: overview.recordsThisMonth,
      description: `本周 ${overview.recordsThisWeek} 条`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: '今日记录',
      value: overview.recordsToday,
      description: `治疗师 ${overview.totalTherapists} 人`,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}