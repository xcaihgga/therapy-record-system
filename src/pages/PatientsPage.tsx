import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, X, User } from 'lucide-react'
import { usePatientStore } from '@/stores/patientStore'
import { PatientForm } from '@/components/patients/PatientForm'
import type { PatientSearchParams } from '@/lib/validations'
import type { PatientFormData } from '@/lib/validations'
import type { Patient } from '@/types/database'
import { Gender } from '@/types/database'

export default function PatientsPage() {
  const navigate = useNavigate()
  const {
    patients,
    isLoading,
    error,
    totalCount,
    currentPage,
    pageSize,
    fetchPatients,
    addPatient,
    deletePatient,
    clearError,
  } = usePatientStore()

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<PatientSearchParams>({
    query: '',
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  // 初始化加载
  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // 搜索处理
  const handleSearch = () => {
    const searchParams: PatientSearchParams = {
      ...filters,
      query: searchQuery,
      page: 1,
    }
    setFilters(searchParams)
  }

  // 重置筛选
  const handleResetFilters = () => {
    setSearchQuery('')
    setFilters({
      query: '',
      page: 1,
      pageSize: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    })
    setShowFilters(false)
    fetchPatients()
  }

  // 分页处理
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // 添加患者
  const handleAddPatient = async (data: PatientFormData) => {
    try {
      await addPatient({
        name: data.name,
        age: data.age,
        gender: data.gender as Gender,
        phone: data.phone,
        medical_record_number: data.medical_record_number,
        diagnosis: data.diagnosis || '',
        therapist_id: 1, // TODO: 从当前用户获取
      })
      setShowAddModal(false)
      setShowQuickAdd(false)
    } catch (error) {
      console.error('添加患者失败:', error)
    }
  }

  // 删除患者
  const handleDeletePatient = async (id: number) => {
    if (!window.confirm('确定要删除此患者吗？此操作不可恢复。')) {
      return
    }
    try {
      await deletePatient(id)
    } catch (error) {
      console.error('删除患者失败:', error)
    }
  }

  // 查看患者详情
  const handleViewPatient = (patientId: number) => {
    navigate(`/patients/${patientId}`)
  }

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

  // 格式化日期
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // 渲染患者卡片
  const renderPatientCard = (patient: Patient) => (
    <Card key={patient.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm truncate">{patient.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {patient.medical_record_number}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">年龄：</span>
                <span>{patient.age}岁</span>
              </div>
              <div>
                <span className="text-muted-foreground">性别：</span>
                <span>{getGenderText(patient.gender)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">电话：</span>
                <span className="break-all">{patient.phone}</span>
              </div>
              {patient.diagnosis && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">诊断：</span>
                  <span className="text-xs line-clamp-2">{patient.diagnosis}</span>
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              创建时间：{formatDate(patient.created_at)}
            </div>
          </div>

          <div className="flex flex-col gap-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewPatient(patient.id)}
              title="查看详情"
              className="min-w-[44px] min-h-[44px] touch-manipulation"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(`/patients/${patient.id}/edit`)}
              title="编辑"
              className="min-w-[44px] min-h-[44px] touch-manipulation"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px] touch-manipulation"
              onClick={() => handleDeletePatient(patient.id)}
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // 渲染分页
  const renderPagination = () => {
    const totalPages = Math.ceil(totalCount / pageSize)

    if (totalPages <= 1) return null

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
        <p className="text-sm text-muted-foreground">
          共 {totalCount} 条记录，第 {currentPage} / {totalPages} 页
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="min-h-[44px] px-4"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">上一页</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="min-h-[44px] px-4"
          >
            <span className="hidden sm:inline">下一页</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">患者管理</h1>
          <p className="text-sm md:text-base text-muted-foreground">管理患者信息和档案</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowQuickAdd(true)}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            快速添加
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加患者
          </Button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索患者姓名、病历号..."
            className="pl-10 min-h-[44px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSearch}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            搜索
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            <Filter className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">筛选</span>
          </Button>
        </div>
      </div>

      {/* 高级筛选面板 */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg">高级筛选</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="min-w-[44px] min-h-[44px] touch-manipulation"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {/* 年龄范围 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">年龄范围</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="最小"
                    min="0"
                    max="150"
                    value={filters.ageMin || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      ageMin: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="min-h-[44px]"
                  />
                  <span className="flex-shrink-0">-</span>
                  <Input
                    type="number"
                    placeholder="最大"
                    min="0"
                    max="150"
                    value={filters.ageMax || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      ageMax: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="min-h-[44px]"
                  />
                </div>
              </div>

              {/* 性别 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">性别</label>
                <select
                  className="w-full h-11 px-3 rounded-md border border-input bg-background min-h-[44px]"
                  value={filters.gender || 'all'}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    gender: e.target.value as 'male' | 'female' | 'other' | 'all'
                  }))}
                >
                  <option value="all">全部</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他</option>
                </select>
              </div>

              {/* 排序 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">排序方式</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-11 px-3 rounded-md border border-input bg-background min-h-[44px]"
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      sortBy: e.target.value as 'name' | 'age' | 'created_at' | 'updated_at'
                    }))}
                  >
                    <option value="created_at">创建时间</option>
                    <option value="updated_at">更新时间</option>
                    <option value="name">姓名</option>
                    <option value="age">年龄</option>
                  </select>
                  <select
                    className="w-20 md:w-24 h-11 px-2 md:px-3 rounded-md border border-input bg-background min-h-[44px]"
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      sortOrder: e.target.value as 'asc' | 'desc'
                    }))}
                  >
                    <option value="desc">降序</option>
                    <option value="asc">升序</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full sm:w-auto min-h-[44px]"
              >
                重置
              </Button>
              <Button
                onClick={() => {
                  handleSearch()
                  setShowFilters(false)
                }}
                className="w-full sm:w-auto min-h-[44px]"
              >
                应用筛选
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 患者列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">患者列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">加载中...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">暂无患者数据</p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="min-h-[48px]"
              >
                添加第一位患者
              </Button>
            </div>
          ) : (
            <>
              {/* 桌面端表格视图 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">姓名</th>
                      <th className="text-left py-3 px-4 font-medium">病历号</th>
                      <th className="text-left py-3 px-4 font-medium">年龄</th>
                      <th className="text-left py-3 px-4 font-medium">性别</th>
                      <th className="text-left py-3 px-4 font-medium">联系方式</th>
                      <th className="text-left py-3 px-4 font-medium">诊断</th>
                      <th className="text-left py-3 px-4 font-medium">创建时间</th>
                      <th className="text-right py-3 px-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{patient.name}</td>
                        <td className="py-3 px-4">{patient.medical_record_number}</td>
                        <td className="py-3 px-4">{patient.age}岁</td>
                        <td className="py-3 px-4">{getGenderText(patient.gender)}</td>
                        <td className="py-3 px-4">{patient.phone}</td>
                        <td className="py-3 px-4 max-w-xs truncate">{patient.diagnosis || '-'}</td>
                        <td className="py-3 px-4">{formatDate(patient.created_at)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewPatient(patient.id)}
                              title="查看详情"
                              className="min-w-[44px] min-h-[44px]"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/patients/${patient.id}/edit`)}
                              title="编辑"
                              className="min-w-[44px] min-h-[44px]"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px]"
                              onClick={() => handleDeletePatient(patient.id)}
                              title="删除"
                            >
              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 移动端卡片视图 */}
              <div className="md:hidden grid gap-4">
                {patients.map(renderPatientCard)}
              </div>

              {/* 分页 */}
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      {/* 添加患者弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-background w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-lg overflow-y-auto sm:max-w-2xl">
            <PatientForm
              onSubmit={handleAddPatient}
              onCancel={() => setShowAddModal(false)}
              isLoading={isLoading}
              mode="create"
            />
          </div>
        </div>
      )}

      {/* 快速添加弹窗 */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-background w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-lg overflow-y-auto sm:max-w-2xl">
            <PatientForm
              onSubmit={handleAddPatient}
              onCancel={() => setShowQuickAdd(false)}
              isLoading={isLoading}
              mode="quick"
            />
          </div>
        </div>
      )}
    </div>
  )
}