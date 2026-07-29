import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePatientStore } from '@/stores/patientStore'
import { PatientForm } from '@/components/patients/PatientForm'
import type { PatientFormData } from '@/lib/validations'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Gender } from '@/types/database'

export default function PatientEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedPatient, getPatientById, updatePatient, isLoading } = usePatientStore()

  useEffect(() => {
    if (id) {
      getPatientById(parseInt(id))
    }
  }, [id, getPatientById])

  const handleSubmit = async (data: PatientFormData) => {
    if (!id) return

    try {
      await updatePatient(parseInt(id), {
        name: data.name,
        age: data.age,
        gender: data.gender as Gender,
        phone: data.phone,
        medical_record_number: data.medical_record_number,
        diagnosis: data.diagnosis,
      })
      navigate(`/patients/${id}`)
    } catch (error) {
      console.error('更新患者信息失败:', error)
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
        <p className="text-muted-foreground mb-4">未找到患者信息</p>
        <Button onClick={() => navigate('/patients')}>
          返回患者列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/patients/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">编辑患者信息</h1>
          <p className="text-muted-foreground">更新患者的个人信息和诊断资料</p>
        </div>
      </div>

      {/* 编辑表单 */}
      <PatientForm
        patient={selectedPatient}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/patients/${id}`)}
        isLoading={isLoading}
        mode="edit"
      />
    </div>
  )
}