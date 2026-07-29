import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Edit, Trash2, Download, Eye, Calendar, Clock, MapPin, User, FileText } from 'lucide-react'
import { useTherapyRecordStore } from '@/stores/therapyRecordStore'
import { useAttachmentStore } from '@/stores/attachmentStore'
import { useAuthStore, canManageRecords } from '@/stores/authStore'
import { Dialog } from '@/components/ui/dialog'
import { FilePreview } from '@/components/media/FilePreview'

const TREATMENT_TYPE_MAP: Record<string, string> = {
  physiotherapy: '物理治疗',
  occupational_therapy: '作业治疗',
  speech_therapy: '言语治疗',
  psychotherapy: '心理治疗',
  traditional_chinese: '中医治疗',
  massage: '按摩',
  acupuncture: '针灸',
  rehabilitation: '康复训练',
  other: '其他',
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  completed: { label: '已完成', variant: 'success' },
  reviewed: { label: '已审核', variant: 'default' },
  archived: { label: '已归档', variant: 'warning' },
}

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentRecord, fetchRecordById, deleteRecord, isLoading, error } = useTherapyRecordStore()
  const { attachments, fetchAttachments, getAttachmentUrl, deleteAttachment } = useAttachmentStore()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ name: string; type: string; url: string } | null>(null)

  useEffect(() => {
    if (id) {
      fetchRecordById(parseInt(id))
      fetchAttachments(parseInt(id))
    }
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteRecord(parseInt(id))
      navigate('/records')
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId)
    } catch (error) {
      console.error('删除附件失败:', error)
    }
  }

  const handlePreview = async (attachment: any) => {
    try {
      const url = await getAttachmentUrl(attachment.id)
      setPreviewFile({
        name: attachment.file_name,
        type: attachment.file_type,
        url
      })
    } catch (error) {
      console.error('获取文件URL失败:', error)
    }
  }

  const handleDownload = async (attachment: any) => {
    try {
      const url = await getAttachmentUrl(attachment.id)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('下载失败:', error)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('zh-CN')
  }

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('zh-CN')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canEdit = canManageRecords(user) && currentRecord?.therapist_id === user?.id

  if (isLoading && !currentRecord) {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/records')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">治疗记录详情</h1>
            <p className="text-muted-foreground">查看治疗记录完整信息</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/records/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            基本信息
            <Badge variant={STATUS_MAP[currentRecord.status]?.variant || 'default'}>
              {STATUS_MAP[currentRecord.status]?.label || currentRecord.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">患者姓名</p>
                  <p className="font-medium">{currentRecord.patient_name || `患者 ${currentRecord.patient_id}`}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">治疗类型</p>
                  <p className="font-medium">
                    {TREATMENT_TYPE_MAP[currentRecord.treatment_type] || currentRecord.treatment_type}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">治疗日期</p>
                  <p className="font-medium">{formatDate(currentRecord.treatment_date)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">治疗时间</p>
                  <p className="font-medium">{currentRecord.treatment_time || '-'}</p>
                </div>
              </div>

              {currentRecord.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">治疗地点</p>
                    <p className="font-medium">{currentRecord.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">治疗师</p>
                  <p className="font-medium">{currentRecord.therapist_name || `治疗师 ${currentRecord.therapist_id}`}</p>
                </div>
              </div>
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
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{currentRecord.content}</p>
          </div>
        </CardContent>
      </Card>

      {/* 多媒体附件 */}
      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>多媒体附件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="relative border rounded-lg p-3 group">
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}

                  <div
                    className="aspect-square flex items-center justify-center mb-2 bg-gray-100 rounded cursor-pointer"
                    onClick={() => handlePreview(attachment)}
                  >
                    {attachment.file_type === 'image' ? (
                      <img
                        src={attachment.file_path}
                        alt={attachment.file_name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : attachment.file_type === 'video' ? (
                      <div className="text-center">
                        <Eye className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">视频</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">文档</p>
                      </div>
                    )}
                  </div>

                  <p className="text-sm truncate" title={attachment.file_name}>
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                  </p>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-2"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    下载
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 时间信息 */}
      <Card>
        <CardHeader>
          <CardTitle>记录信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">创建时间</p>
              <p>{formatDateTime(currentRecord.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">更新时间</p>
              <p>{formatDateTime(currentRecord.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除"
        size="sm"
      >
        <div className="space-y-4">
          <p>确定要删除这条治疗记录吗？此操作无法撤销。</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              确认删除
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 文件预览 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={() => {
            const a = document.createElement('a')
            a.href = previewFile.url
            a.download = previewFile.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }}
        />
      )}
    </div>
  )
}