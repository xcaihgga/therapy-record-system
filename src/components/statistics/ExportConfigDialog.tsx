import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileText, FileSpreadsheet, FileJson, X } from 'lucide-react'
import { format } from 'date-fns'

interface ExportConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (config: ExportConfig) => void
  totalRecords: number
}

export interface ExportConfig {
  format: 'pdf' | 'excel' | 'json'
  fields: string[]
  dateRange: {
    startDate: string
    endDate: string
  }
  includeWatermark: boolean
  watermarkText?: string
}

const availableFields = [
  { id: 'id', label: '记录ID' },
  { id: 'patient_id', label: '患者ID' },
  { id: 'therapist_id', label: '治疗师ID' },
  { id: 'treatment_date', label: '治疗日期' },
  { id: 'treatment_time', label: '治疗时间' },
  { id: 'treatment_type', label: '治疗类型' },
  { id: 'content', label: '治疗内容' },
  { id: 'status', label: '状态' },
  { id: 'location', label: '地点' },
  { id: 'created_at', label: '创建时间' },
  { id: 'updated_at', label: '更新时间' },
]

export function ExportConfigDialog({ 
  open, 
  onOpenChange, 
  onExport,
  totalRecords 
}: ExportConfigDialogProps) {
  const [format_type, setFormatType] = useState<'pdf' | 'excel' | 'json'>('excel')
  const [selectedFields, setSelectedFields] = useState<string[]>(availableFields.map(f => f.id))
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })
  const [includeWatermark, setIncludeWatermark] = useState(false)
  const [watermarkText, setWatermarkText] = useState('治疗记录系统')

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    )
  }

  const handleSelectAll = () => {
    if (selectedFields.length === availableFields.length) {
      setSelectedFields([])
    } else {
      setSelectedFields(availableFields.map(f => f.id))
    }
  }

  const handleExport = () => {
    onExport({
      format: format_type,
      fields: selectedFields,
      dateRange,
      includeWatermark,
      watermarkText: includeWatermark ? watermarkText : undefined
    })
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-[600px] bg-background rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Download className="h-5 w-5" />
            导出数据
          </h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="rounded-sm opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 p-6">
          {/* 导出格式 */}
          <div className="space-y-2">
            <Label>导出格式</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={format_type === 'pdf' ? 'default' : 'outline'}
                className="flex items-center gap-2"
                onClick={() => setFormatType('pdf')}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant={format_type === 'excel' ? 'default' : 'outline'}
                className="flex items-center gap-2"
                onClick={() => setFormatType('excel')}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant={format_type === 'json' ? 'default' : 'outline'}
                className="flex items-center gap-2"
                onClick={() => setFormatType('json')}
              >
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>

          {/* 日期范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">开始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">结束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* 导出字段选择 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>导出字段</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedFields.length === availableFields.length ? '取消全选' : '全选'}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 border rounded-lg max-h-48 overflow-y-auto">
              {availableFields.map(field => (
                <label 
                  key={field.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={() => handleFieldToggle(field.id)}
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 水印选项（仅PDF） */}
          {format_type === 'pdf' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={includeWatermark}
                  onCheckedChange={(checked) => setIncludeWatermark(checked as boolean)}
                />
                <span className="text-sm font-medium">添加水印</span>
              </label>
              {includeWatermark && (
                <div className="space-y-2">
                  <Label htmlFor="watermarkText">水印文字</Label>
                  <Input
                    id="watermarkText"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="请输入水印文字"
                  />
                </div>
              )}
            </div>
          )}

          {/* 提示信息 */}
          <div className="text-sm text-muted-foreground">
            预计导出 {totalRecords} 条记录
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={selectedFields.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            开始导出
          </Button>
        </div>
      </div>
    </div>
  )
}