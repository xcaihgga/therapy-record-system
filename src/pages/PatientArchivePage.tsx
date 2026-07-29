import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  Image, 
  Video,
  Search,
  ExternalLink
} from 'lucide-react'
import { patientApi } from '@/api/patients'
import { useTherapyRecordStore } from '@/stores/therapyRecordStore'
import { TreatmentTimeline, VerticalTimeline } from '@/components/patients/TreatmentTimeline'
import type { Patient, Attachment } from '@/types/database'
import { format } from 'date-fns'

const genderMap: Record<string, string> = {
  male: '男',
  female: '女',
  other: '其他'
}

export default function PatientArchivePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'media' | 'records'>('overview')

  const { records, fetchRecords } = useTherapyRecordStore()

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load patient info
        const patientData = await patientApi.getById(parseInt(id))
        setPatient(patientData)

        // Load treatment records
        await fetchRecords({ patient_id: parseInt(id) })
      } catch (error) {
        console.error('Failed to load patient archive:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  // Get all attachments from records
  const allAttachments = records.reduce<Attachment[]>((acc, record) => {
    if (record.attachments) {
      acc.push(...record.attachments)
    }
    return acc
  }, [])

  // Filter records based on search and filter
  const filteredRecords = records.filter(record => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesContent = record.content.toLowerCase().includes(query)
      const matchesType = record.treatment_type.toLowerCase().includes(query)
      if (!matchesContent && !matchesType) return false
    }
    
    if (filterType !== 'all' && record.treatment_type !== filterType) {
      return false
    }
    
    return true
  })

  // Calculate statistics
  const stats = {
    totalRecords: records.length,
    totalAttachments: allAttachments.length,
    images: allAttachments.filter(a => a.file_type === 'image').length,
    videos: allAttachments.filter(a => a.file_type === 'video').length,
    documents: allAttachments.filter(a => a.file_type === 'document').length,
    firstRecord: records.length > 0 
      ? format(new Date(Math.min(...records.map(r => new Date(r.treatment_date).getTime()))), 'yyyy-MM-dd')
      : '-',
    lastRecord: records.length > 0 
      ? format(new Date(Math.max(...records.map(r => new Date(r.treatment_date).getTime()))), 'yyyy-MM-dd')
      : '-'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-muted-foreground">未找到患者信息</div>
        <Button variant="outline" onClick={() => navigate('/patients')}>
          返回患者列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{patient.name} 的档案</h1>
            <p className="text-muted-foreground">
              病历号: {patient.medical_record_number}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/patients/${patient.id}/edit`}>
            编辑患者信息
          </Link>
        </Button>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">姓名</div>
              <div className="text-lg font-medium">{patient.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">年龄</div>
              <div className="text-lg font-medium">{patient.age} 岁</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">性别</div>
              <div className="text-lg font-medium">{genderMap[patient.gender] || patient.gender}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">联系电话</div>
              <div className="text-lg font-medium">{patient.phone || '-'}</div>
            </div>
            <div className="col-span-2 md:col-span-4">
              <div className="text-sm text-muted-foreground mb-1">诊断</div>
              <div className="text-lg font-medium">{patient.diagnosis || '-'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalRecords}</div>
                <div className="text-xs text-muted-foreground">治疗记录</div>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.images}</div>
                <div className="text-xs text-muted-foreground">图片</div>
              </div>
              <Image className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.videos}</div>
                <div className="text-xs text-muted-foreground">视频</div>
              </div>
              <Video className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.documents}</div>
                <div className="text-xs text-muted-foreground">文档</div>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'overview', label: '概览', icon: User },
          { id: 'timeline', label: '时间线', icon: Calendar },
          { id: 'media', label: '多媒体', icon: Image },
          { id: 'records', label: '记录列表', icon: FileText },
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

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>最近治疗记录</span>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('records')}>
                  查看全部
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VerticalTimeline 
                records={records.slice(0, 5)} 
                maxItems={5}
                onRecordClick={(record) => navigate(`/records/${record.id}`)}
              />
            </CardContent>
          </Card>

          {/* Recent Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>最近多媒体</span>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('media')}>
                  查看全部
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {allAttachments.slice(0, 6).map(attachment => (
                  <div 
                    key={attachment.id}
                    className="aspect-square rounded border overflow-hidden bg-muted flex items-center justify-center"
                  >
                    {attachment.file_type === 'image' ? (
                      <img 
                        src={attachment.file_path} 
                        alt={attachment.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : attachment.file_type === 'video' ? (
                      <Video className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                ))}
                {allAttachments.length === 0 && (
                  <div className="col-span-3 text-center text-muted-foreground py-8">
                    暂无多媒体文件
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'timeline' && (
        <TreatmentTimeline
          records={records}
          onEventClick={(event) => navigate(`/records/${event.id}`)}
          height="450px"
        />
      )}

      {activeTab === 'media' && (
        <Card>
          <CardHeader>
            <CardTitle>多媒体档案</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allAttachments.map(attachment => (
                <div 
                  key={attachment.id}
                  className="aspect-square rounded-lg border overflow-hidden bg-muted flex items-center justify-center group relative"
                >
                  {attachment.file_type === 'image' ? (
                    <img 
                      src={attachment.file_path} 
                      alt={attachment.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : attachment.file_type === 'video' ? (
                    <div className="flex flex-col items-center gap-2">
                      <Video className="h-12 w-12 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center px-2">
                        {attachment.file_name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center px-2">
                        {attachment.file_name}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" asChild>
                      <a href={attachment.file_path} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        查看
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
              {allAttachments.length === 0 && (
                <div className="col-span-4 text-center text-muted-foreground py-12">
                  暂无多媒体文件
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'records' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <CardTitle>治疗记录列表</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">全部类型</option>
                  <option value="physiotherapy">物理治疗</option>
                  <option value="occupational_therapy">作业治疗</option>
                  <option value="speech_therapy">言语治疗</option>
                  <option value="psychotherapy">心理治疗</option>
                  <option value="traditional_chinese">中医治疗</option>
                  <option value="massage">按摩</option>
                  <option value="acupuncture">针灸</option>
                  <option value="rehabilitation">康复治疗</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <VerticalTimeline
              records={filteredRecords}
              onRecordClick={(record) => navigate(`/records/${record.id}`)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}