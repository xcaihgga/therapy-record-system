import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  FileSpreadsheet, 
  FileJson, 
  FileText, 
  Calendar,
  TrendingUp,
  Users,
  Activity,
  RefreshCw
} from 'lucide-react'
import { useStatisticsStore } from '@/stores/statisticsStore'
import { StatsOverviewCards } from '@/components/statistics/StatisticsOverviewCards'
import { LineChart, BarChart, PieChart } from '@/components/statistics/Charts'
import { exportService } from '@/utils/exportService'
import { format, subDays, subMonths } from 'date-fns'

// Mock data generator (will be replaced by real API data)
const generateMockData = () => {
  const treatmentTypes = [
    { name: '物理治疗', value: 45 },
    { name: '作业治疗', value: 32 },
    { name: '言语治疗', value: 28 },
    { name: '心理治疗', value: 25 },
    { name: '中医治疗', value: 20 },
    { name: '按摩', value: 18 },
    { name: '针灸', value: 15 },
    { name: '康复治疗', value: 30 },
  ]

  const ageGroups = [
    { name: '0-18岁', value: 15 },
    { name: '19-30岁', value: 35 },
    { name: '31-50岁', value: 45 },
    { name: '51-65岁', value: 30 },
    { name: '65岁以上', value: 25 },
  ]

  const genders = [
    { name: '男', value: 75 },
    { name: '女', value: 70 },
    { name: '其他', value: 10 },
  ]

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    name: `${i + 1}月`,
    value: Math.floor(Math.random() * 50) + 30
  }))

  return { treatmentTypes, ageGroups, genders, monthlyData }
}

export default function StatisticsPage() {
  const {
    overview,
    treatmentCount,
    patientDistribution,
    treatmentTypeDistribution,
    timeTrend,
    isLoading,
    fetchOverview,
    fetchTreatmentCount,
    fetchPatientDistribution,
    fetchTreatmentTypeDistribution,
    fetchTimeTrend,
  } = useStatisticsStore()

  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'treatment' | 'patient' | 'trend'>('overview')

  // Mock data for demonstration
  const mockData = generateMockData()

  useEffect(() => {
    // Load all statistics on mount
    Promise.all([
      fetchOverview(),
      fetchPatientDistribution(),
      fetchTreatmentCount({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
      fetchTreatmentTypeDistribution({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
      fetchTimeTrend({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
    ]).catch(console.error)
  }, [dateRange])

  const handleRefresh = async () => {
    await Promise.all([
      fetchOverview(),
      fetchPatientDistribution(),
      fetchTreatmentCount({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
      fetchTreatmentTypeDistribution({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
      fetchTimeTrend({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
    ])
  }

  // Export handlers
  const handleExportPDF = async () => {
    if (!overview || !patientDistribution || !treatmentCount) {
      alert('数据加载中，请稍后再试')
      return
    }

    await exportService.exportStatisticsReportToPDF(
      overview,
      treatmentCount,
      patientDistribution,
      {
        title: '治疗记录统计报告',
        subtitle: `${dateRange.startDate} 至 ${dateRange.endDate}`,
        author: '治疗记录系统',
        includeWatermark: true,
        watermarkText: '治疗记录系统'
      }
    )
  }

  const handleExportExcel = async () => {
    if (!overview || !patientDistribution || !treatmentCount) {
      alert('数据加载中，请稍后再试')
      return
    }

    await exportService.exportFullDataToExcel(
      [], // Will be replaced with real records
      overview,
      treatmentCount,
      patientDistribution,
      '治疗记录统计报告'
    )
  }

  const handleExportJSON = async () => {
    const data = {
      overview,
      treatmentCount,
      patientDistribution,
      treatmentTypeDistribution,
      timeTrend,
      exportDate: new Date().toISOString(),
      dateRange
    }

    await exportService.exportRawDataToJSON(data, '治疗记录数据备份')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">统计分析</h1>
          <p className="text-muted-foreground">查看和分析治疗记录统计数据</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <FileJson className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">日期范围:</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-40"
              />
              <span className="text-muted-foreground">至</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDateRange({
                  startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                  endDate: format(new Date(), 'yyyy-MM-dd')
                })}
              >
                近7天
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDateRange({
                  startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                  endDate: format(new Date(), 'yyyy-MM-dd')
                })}
              >
                近30天
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDateRange({
                  startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
                  endDate: format(new Date(), 'yyyy-MM-dd')
                })}
              >
                近3个月
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <StatsOverviewCards overview={overview} isLoading={isLoading} />

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'overview', label: '概览', icon: Activity },
          { id: 'treatment', label: '治疗统计', icon: TrendingUp },
          { id: 'patient', label: '患者分布', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Treatment Type Distribution */}
        {(activeTab === 'overview' || activeTab === 'treatment') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                治疗类型分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart 
                data={mockData.treatmentTypes}
                title="各治疗类型占比"
                height="350px"
              />
            </CardContent>
          </Card>
        )}

        {/* Treatment Count Trend */}
        {(activeTab === 'overview' || activeTab === 'treatment') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                治疗次数趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={mockData.monthlyData}
                title="月度治疗次数"
                height="350px"
              />
            </CardContent>
          </Card>
        )}

        {/* Patient Age Distribution */}
        {(activeTab === 'overview' || activeTab === 'patient') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                患者年龄分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={mockData.ageGroups}
                title="各年龄段患者数量"
                color="#10b981"
                height="350px"
              />
            </CardContent>
          </Card>
        )}

        {/* Patient Gender Distribution */}
        {(activeTab === 'overview' || activeTab === 'patient') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                患者性别分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart
                data={mockData.genders}
                title="性别分布"
                height="350px"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Treatments Table */}
      {(activeTab === 'overview' || activeTab === 'treatment') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              热门治疗类型排名
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.treatmentTypes
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(item.value / mockData.treatmentTypes[0].value) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {item.value}次
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {overview && (
        <Card>
          <CardHeader>
            <CardTitle>数据摘要</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">
                  {overview.recordsThisWeek}
                </div>
                <div className="text-sm text-muted-foreground">本周新增</div>
              </div>
              <div className="p-4 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">
                  {overview.recordsThisMonth}
                </div>
                <div className="text-sm text-muted-foreground">本月新增</div>
              </div>
              <div className="p-4 rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-600">
                  {overview.averageRecordsPerDay.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">日均记录</div>
              </div>
              <div className="p-4 rounded-lg bg-orange-50">
                <div className="text-2xl font-bold text-orange-600">
                  +{overview.patientGrowthRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">患者增长率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}