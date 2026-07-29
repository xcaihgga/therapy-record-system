import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, Video, X, FileText } from 'lucide-react'
import { useTherapyRecordStore } from '@/stores/therapyRecordStore'
import { useAttachmentStore } from '@/stores/attachmentStore'
import { usePatientStore } from '@/stores/patientStore'
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
]

export default function RecordCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { createRecord, isLoading, error } = useTherapyRecordStore()
  const { uploadAttachment } = useAttachmentStore()
  const { patients, fetchPatients } = usePatientStore()

  const [showCamera, setShowCamera] = useState(false)
  const [showVideoRecorder, setShowVideoRecorder] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const initialType = searchParams.get('type')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TherapyRecordFormData>({
    resolver: zodResolver(therapyRecordSchema) as any,
    defaultValues: {
      treatment_type: 'physiotherapy',
      status: 'draft',
      treatment_date: new Date().toISOString().split('T')[0],
      treatment_time: new Date().toTimeString().slice(0, 5),
    }
  })

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  useEffect(() => {
    if (initialType === 'photo') {
      setShowCamera(true)
    } else if (initialType === 'video') {
      setShowVideoRecorder(true)
    }
  }, [initialType])

  const handlePhotoCapture = (files: { original: File; watermarked: File }) => {
    // 保存原图和水印图
    setMediaFiles(prev => [...prev, files.original, files.watermarked])
    setShowCamera(false)
  }

  const handleVideoRecord = (file: File) => {
    setMediaFiles(prev => [...prev, file])
    setShowVideoRecorder(false)
  }

  const handleFileUpload = (files: File[]) => {
    setMediaFiles(prev => [...prev, ...files])
  }

  const handleRemoveFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: TherapyRecordFormData) => {
    try {
      const formData = new FormData()
      formData.append('patient_id', data.patient_id.toString())
      formData.append('treatment_type', data.treatment_type)
      formData.append('treatment_date', data.treatment_date)
      formData.append('treatment_time', data.treatment_time)
      formData.append('content', data.content)
      formData.append('status', data.status)
      if (data.location) {
        formData.append('location', data.location)
      }

      // 创建治疗记录
      const record = await createRecord(formData)

      // 上传附件
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i]
        try {
          await uploadAttachment(record.id, file, (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [i]: progress
            }))
          })
        } catch (err) {
          console.error('上传附件失败:', err)
        }
      }

      navigate(`/records/${record.id}`)
    } catch (err) {
      console.error('创建失败:', err)
    }
  }

  const patientOptions = patients.map(p => ({
    value: p.id.toString(),
    label: `${p.name} (${p.medical_record_number})`
  }))

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">新建治疗记录</h1>
          <p className="text-muted-foreground">填写治疗过程详情</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/records')}>
          取消
        </Button>
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
                  options={[{ value: '', label: '请选择患者' }, ...patientOptions]}
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
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message}</p>
                )}
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

        {/* 多媒体附件 */}
        <Card>
          <CardHeader>
            <CardTitle>多媒体附件</CardTitle>
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

            {/* 已选文件列表 */}
            {mediaFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">已选择文件</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="relative border rounded-lg p-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
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
                        ) : file.type.startsWith('video/') ? (
                          <Video className="h-8 w-8" />
                        ) : (
                          <FileText className="h-8 w-8" />
                        )}
                      </div>
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      {uploadProgress[index] && (
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress[index]}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 文件上传 */}
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
            onClick={() => navigate('/records')}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '提交中...' : '保存记录'}
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