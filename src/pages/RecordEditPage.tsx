import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Camera, Video, X } from 'lucide-react'
import { useTherapyRecordStore } from '@/stores/therapyRecordStore'
import { useAttachmentStore } from '@/stores/attachmentStore'
import { usePatientStore } from '@/stores/patientStore'
import { useAuthStore } from '@/stores/authStore'
import { therapyRecordSchema, TherapyRecordFormData } from '@/lib/validations'
import { CameraCapture } from '@/components/media/CameraCapture'
import { VideoRecorder } from '@/components/media/VideoRecorder'
import { FileUpload } from '@/components/media/FileUpload'
import { TreatmentType, RecordStatus } from '@/types/database'

const TREATMENT_TYPE_OPTIONS = [
  { value: 'physiotherapy', label: '物理治疗' },
  { value: 'occupational_therapy', label: '作业治疗' },
  { value: 'speech_therapy', label: '言语治疗' },
  { value: 'psychotherapy', label: '心理治疗' },
  { value: 'traditional_chinese', label: '中医治疗' },
  { value: 'massage', label: '按摩' },
  { value: 'acupuncture', label: '针灸' },
  { value: 'rehabilitation', label: '康复训练' },
  { value: 'other', label: '其他' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'completed', label: '已完成' },
  { value: 'reviewed', label: '已审核' },
  { value: 'archived', label: '已归档' },
]

export default function RecordEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentRecord, fetchRecordById, updateRecord, isLoading, error } = useTherapyRecordStore()
  const { attachments, fetchAttachments, uploadAttachment, deleteAttachment } = useAttachmentStore()
  const { patients, fetchPatients } = usePatientStore()

  const [showCamera, setShowCamera] = useState(false)
  const [showVideoRecorder, setShowVideoRecorder] = useState(false)
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<TherapyRecordFormData>({
    resolver: zodResolver(therapyRecordSchema) as any,
  })

  useEffect(() => {
    if (id) {
      fetchRecordById(parseInt(id))
      fetchAttachments(parseInt(id))
      fetchPatients()
    }
  }, [id])

  useEffect(() => {
    if (currentRecord) {
      reset({
        patient_id: currentRecord.patient_id,
        treatment_type: currentRecord.treatment_type,
        treatment_date: new Date(currentRecord.treatment_date).toISOString().split('T')[0],
        treatment_time: currentRecord.treatment_time || new Date().toTimeString().slice(0, 5),
        content: currentRecord.content,
        location: currentRecord.location || '',
        status: currentRecord.status,
      } as TherapyRecordFormData)
    }
  }, [currentRecord, reset])

  const handlePhotoCapture = (files: { original: File; watermarked: File }) => {
    // 保存原图和水印图
    setNewMediaFiles(prev => [...prev, files.original, files.watermarked])
    setShowCamera(false)
  }

  const handleVideoRecord = (file: File) => {
    setNewMediaFiles(prev => [...prev, file])
    setShowVideoRecorder(false)
  }

  const handleFileUpload = (files: File[]) => {
    setNewMediaFiles(prev => [...prev, ...files])
  }

  const handleRemoveNewFile = (index: number) => {
    setNewMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId)
    } catch (error) {
      console.error('删除附件失败:', error)
    }
  }

  const onSubmit = async (data: TherapyRecordFormData) => {
    if (!id) return

    try {
      // 更新治疗记录
      await updateRecord(parseInt(id), {
        patient_id: data.patient_id,
        treatment_type: data.treatment_type as TreatmentType,
        treatment_date: new Date(data.treatment_date),
        content: data.content,
        status: data.status as RecordStatus,
        location: data.location,
      })

      // 上传新附件
      for (const file of newMediaFiles) {
        try {
          await uploadAttachment(parseInt(id), file)
        } catch (err) {
          console.error('上传附件失败:', err)
        }
      }

      navigate(`/records/${id}`)
    } catch (err) {
      console.error('更新失败:', err)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!currentRecord && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  if (!currentRecord) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">治疗记录不存在</p>
        <Button className="mt-4" onClick={() => navigate('/records')}>
          返回列表
        </Button>
      </div>
    )
  }

  // 权限检查
  if (currentRecord.therapist_id !== user?.id && user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">您没有权限编辑此记录</p>
        <Button className="mt-4" onClick={() => navigate(`/records/${id}`)}>
          返回详情
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/records/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">编辑治疗记录</h1>
            <p className="text-muted-foreground">修改治疗过程详情</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 患者选择 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">患者 *</label>
                <Select
                  options={patients.map(p => ({
                    value: p.id.toString(),
                    label: `${p.name} (${p.medical_record_number})`
                  }))}
                  {...register('patient_id')}
                  onChange={(e) => setValue('patient_id', parseInt(e.target.value))}
                />
                {errors.patient_id && (
                  <p className="text-sm text-red-500">{errors.patient_id.message}</p>
                )}
              </div>

              {/* 治疗类型 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">治疗类型 *</label>
                <Select
                  options={TREATMENT_TYPE_OPTIONS}
                  {...register('treatment_type')}
                  onChange={(e) => setValue('treatment_type', e.target.value as TreatmentType)}
                />
                {errors.treatment_type && (
                  <p className="text-sm text-red-500">{errors.treatment_type.message}</p>
                )}
              </div>

              {/* 治疗日期 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">治疗日期 *</label>
                <Input type="date" {...register('treatment_date')} />
                {errors.treatment_date && (
                  <p className="text-sm text-red-500">{errors.treatment_date.message}</p>
                )}
              </div>

              {/* 治疗时间 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">治疗时间 *</label>
                <Input type="time" {...register('treatment_time')} />
                {errors.treatment_time && (
                  <p className="text-sm text-red-500">{errors.treatment_time.message}</p>
                )}
              </div>

              {/* 治疗地点 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">治疗地点</label>
                <Input {...register('location')} placeholder="例如: 北京康复中心" />
              </div>

              {/* 状态 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">状态</label>
                <Select
                  options={STATUS_OPTIONS}
                  {...register('status')}
                  onChange={(e) => setValue('status', e.target.value as RecordStatus)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 治疗内容 */}
        <Card>
          <CardHeader>
            <CardTitle>治疗内容</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">治疗过程描述 *</label>
              <Textarea
                {...register('content')}
                placeholder="请详细描述治疗过程、使用的治疗方法、患者反应等..."
                rows={8}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 现有附件 */}
        {attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>现有附件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative border rounded-lg p-3 group">
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="aspect-square flex items-center justify-center mb-2 bg-gray-100 rounded">
                      {attachment.file_type === 'image' ? (
                        <img
                          src={attachment.file_path}
                          alt={attachment.file_name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {attachment.file_type}
                        </div>
                      )}
                    </div>
                    <p className="text-sm truncate">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 添加新附件 */}
        <Card>
          <CardHeader>
            <CardTitle>添加新附件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                拍照
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVideoRecorder(true)}
              >
                <Video className="h-4 w-4 mr-2" />
                录制视频
              </Button>
            </div>

            {/* 新增文件列表 */}
            {newMediaFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">待上传文件</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newMediaFiles.map((file, index) => (
                    <div key={index} className="relative border rounded-lg p-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="aspect-square flex items-center justify-center mb-2 bg-gray-100 rounded">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {file.type}
                          </div>
                        )}
                      </div>
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FileUpload
              onUpload={handleFileUpload}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.mp4,.webm"
              maxSize={50}
              maxFiles={5}
            />
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/records/${id}`)}
          >
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '保存中...' : '保存更改'}
          </Button>
        </div>
      </form>

      {/* 拍照组件 */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handlePhotoCapture}
      />

      {/* 视频录制组件 */}
      <VideoRecorder
        isOpen={showVideoRecorder}
        onClose={() => setShowVideoRecorder(false)}
        onRecord={handleVideoRecord}
        maxDuration={120}
      />
    </div>
  )
}