import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Camera, Video, FileText, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTherapyRecordStore } from '@/stores/therapyRecordStore'
import { useAuthStore, canManageRecords } from '@/stores/authStore'
import { Dialog } from '@/components/ui/dialog'

const TREATMENT_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
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
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'completed', label: '已完成' },
  { value: 'reviewed', label: '已审核' },
  { value: 'archived', label: '已归档' },
]

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

export default function RecordsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { records, pagination, filters, isLoading, fetchRecords, deleteRecord, setFilters } = useTherapyRecordStore()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleSearch = () => {
    setFilters({ search: searchQuery })
    fetchRecords({ ...filters, search: searchQuery })
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    fetchRecords(newFilters)
  }

  const handlePageChange = (page: number) => {
    fetchRecords({ ...filters, page })
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteRecord(id)
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('zh-CN')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">治疗记录</h1>
          <p className="text-muted-foreground">记录和管理治疗过程</p>
        </div>
        {canManageRecords(user) && (
          <Button onClick={() => navigate('/records/new')}>
            <Plus className="h-4 w-4 mr-2" />
            新建记录
          </Button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/records/new?type=photo')}>
          <CardHeader>
            <Camera className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">拍照记录</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              拍摄治疗过程，自动添加水印
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/records/new?type=video')}>
          <CardHeader>
            <Video className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">视频记录</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              录制治疗视频，记录完整过程
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/records/new?type=text')}>
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">文字记录</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              撰写治疗过程文字描述
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Input
                placeholder="搜索患者姓名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                size="sm"
                className="absolute right-0 top-0"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select
              options={TREATMENT_TYPE_OPTIONS}
              value={filters.treatment_type || ''}
              onChange={(e) => handleFilterChange('treatment_type', e.target.value)}
              placeholder="治疗类型"
            />
            <Select
              options={STATUS_OPTIONS}
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              placeholder="记录状态"
            />
            <Input
              type="date"
              placeholder="开始日期"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
            <Input
              type="date"
              placeholder="结束日期"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>历史记录</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无治疗记录
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">患者姓名</th>
                      <th className="text-left py-3 px-4">治疗类型</th>
                      <th className="text-left py-3 px-4">治疗日期</th>
                      <th className="text-left py-3 px-4">状态</th>
                      <th className="text-left py-3 px-4">治疗师</th>
                      <th className="text-right py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{record.patient_name || `患者${record.patient_id}`}</td>
                        <td className="py-3 px-4">
                          {TREATMENT_TYPE_MAP[record.treatment_type] || record.treatment_type}
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(record.treatment_date)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={STATUS_MAP[record.status]?.variant || 'default'}>
                            {STATUS_MAP[record.status]?.label || record.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{record.therapist_name || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/records/${record.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageRecords(user) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => navigate(`/records/${record.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setShowDeleteConfirm(record.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  共 {pagination.total} 条记录
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <span className="text-sm">
                    第 {pagination.page} / {pagination.total_pages || 1} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        title="确认删除"
        size="sm"
      >
        <div className="space-y-4">
          <p>确定要删除这条治疗记录吗？此操作无法撤销。</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            >
              确认删除
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}