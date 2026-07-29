import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  User, 
  Phone, 
  FileText, 
  Stethoscope,
  Calendar,
  Plus,
  Activity
} from 'lucide-react'
import { usePatientStore } from '@/stores/patientStore'
import { Gender, TreatmentType, RecordStatus } from '@/types/database'
import type { TreatmentRecord } from '@/types/database'

// 模拟治疗记录数据
const mockTreatmentRecords: TreatmentRecord[] = [
  {
    id: 1,
    patient_id: 1,
    therapist_id: 1,
    treatment_type: TreatmentType.PHYSIOTHERAPY,
    treatment_date: new Date('2024-01-15'),
    content: '第一次物理治疗，患者状态良好',
    status: RecordStatus.COMPLETED,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
  },
  {
    id: 2,
    patient_id: 1,
    therapist_id: 1,
    treatment_type: TreatmentType.MASSAGE,
    treatment_date: new Date('2024-01-22'),
    content: '按摩治疗，缓解肌肉紧张',
    status: RecordStatus.COMPLETED,
    created_at: new Date('2024-01-22'),
    updated_at: new Date('2024-01-22'),
  },
]

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedPatient, getPatientById, deletePatient, isLoading } = usePatientStore()
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (id) {
      getPatientById(parseInt(id))
    }
  }, [id, getPatientById])

  // 获取性别显示文本
  const getGenderText = (gender: Gender) => {
    switch (gender) {
      case Gender.MALE:
        return '男'
      case Gender.FEMALE:
        return '女'
      case Gender.OTHER:
        return '其他'
      default:
        return '未知'
    }
  }

  // 获取治疗类型显示文本
  const getTreatmentTypeText = (type: string) => {
    const types: Record<string, string> = {
      physiotherapy: '物理治疗',
      occupational_therapy: '职业治疗',
      speech_therapy: '言语治疗',
      psychotherapy: '心理治疗',
      traditional_chinese: '中医治疗',
      massage: '按摩',
      acupuncture: '针灸',
      rehabilitation: '康复训练',
      other: '其他',
    }
    return types[type] || type
  }

  // 获取记录状态显示文本
  const getRecordStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      draft: '草稿',
      completed: '已完成',
      reviewed: '已审核',
      archived: '已归档',
    }
    return statuses[status] || status
  }

  // 格式化日期
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // 格式化日期时间
  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 删除患者
  const handleDelete = async () => {
    if (!id) return
    
    try {
      await deletePatient(parseInt(id))
      navigate('/patients')
    } catch (error) {
      console.error('删除患者失败:', error)
    }
  }

  if (isLoading && !selectedPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">未找到患者信息</p>
        <Button onClick={() => navigate('/patients')}>
          返回患者列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedPatient.name}</h1>
            <p className="text-muted-foreground">病历号：{selectedPatient.medical_record_number}</p>
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/patients/${id}/edit`)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            编辑信息
          </Button>
          <Button
            variant="outline"
            className="text-red-500 hover:text-red-700"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除患者
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">姓名</p>
                <p className="font-medium">{selectedPatient.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">年龄</p>
                <p className="font-medium">{selectedPatient.age} 岁</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">性别</p>
                <p className="font-medium">{getGenderText(selectedPatient.gender)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">联系方式</p>
                <p className="font-medium">{selectedPatient.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">病历号</p>
                <p className="font-medium">{selectedPatient.medical_record_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">创建时间</p>
                <p className="font-medium">{formatDate(selectedPatient.created_at)}</p>
              </div>
            </div>
          </div>

          {/* 诊断信息 */}
          {selectedPatient.diagnosis && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">诊断信息</p>
                  <p className="text-sm leading-relaxed">{selectedPatient.diagnosis}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 治疗历史记录 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              治疗历史记录
            </CardTitle>
            <Button onClick={() => navigate(`/records/new?patientId=${id}`)}>
              <Plus className="h-4 w-4 mr-2" />
              新建治疗记录
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mockTreatmentRecords.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">暂无治疗记录</p>
              <Button onClick={() => navigate(`/records/new?patientId=${id}`)}>
                创建第一条治疗记录
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mockTreatmentRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/records/${record.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {getTreatmentTypeText(record.treatment_type)}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                            {getRecordStatusText(record.status)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {record.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(record.treatment_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            {formatDateTime(record.created_at)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/records/${record.id}/edit`)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 移动端底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:hidden">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/patients/${id}/edit`)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            编辑
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-red-500 hover:text-red-700"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>确认删除</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                确定要删除患者 <span className="font-medium">{selectedPatient.name}</span> 吗？
                此操作不可恢复，患者相关的所有治疗记录也将被删除。
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? '删除中...' : '确认删除'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}