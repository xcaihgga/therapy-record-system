import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useWatermarkStore } from '@/stores/watermarkStore'
import { createWatermarkPreview } from '@/utils/watermarkGenerator'
import { 
  WatermarkPosition, 
  WatermarkFieldType,
  WatermarkData
} from '@/types/watermark'
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw,
  Eye,
  Check,
  X
} from 'lucide-react'

export default function WatermarkSettingsPage() {
  const { config, updateConfig, updateField, toggleField, resetConfig, exportConfig, importConfig } = useWatermarkStore()
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [importJson, setImportJson] = useState<string>('')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 创建示例水印数据用于预览
  const sampleWatermarkData: WatermarkData = {
    timestamp: new Date(),
    location: {
      latitude: 31.2304,
      longitude: 121.4737,
      accuracy: 10,
      timestamp: Date.now()
    },
    address: {
      formatted_address: '上海市浦东新区世纪大道100号',
      country: '中国',
      province: '上海市',
      city: '上海市',
      district: '浦东新区'
    },
    therapistName: '张医生',
    therapistCertificate: 'CERT-2024-001234',
    patientName: '李患者',
    patientMedicalNumber: 'MR-2024-567890',
    treatmentType: '物理治疗'
  }

  // 更新预览
  useEffect(() => {
    const url = createWatermarkPreview(config, sampleWatermarkData)
    setPreviewUrl(url)
  }, [config])

  const handleExport = () => {
    const jsonStr = exportConfig()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `watermark-config-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    if (importJson.trim()) {
      const success = importConfig(importJson)
      if (success) {
        setShowImportDialog(false)
        setImportJson('')
      } else {
        alert('配置格式无效，请检查JSON格式')
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (content) {
          setImportJson(content)
          setShowImportDialog(true)
        }
      }
      reader.readAsText(file)
    }
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReset = () => {
    if (confirm('确定要恢复默认配置吗？')) {
      resetConfig()
    }
  }

  const positionOptions = [
    { value: WatermarkPosition.TOP_LEFT, label: '左上角' },
    { value: WatermarkPosition.TOP_RIGHT, label: '右上角' },
    { value: WatermarkPosition.BOTTOM_LEFT, label: '左下角' },
    { value: WatermarkPosition.BOTTOM_RIGHT, label: '右下角' },
    { value: WatermarkPosition.CENTER, label: '居中' }
  ]

  const fieldOptions = [
    { type: WatermarkFieldType.TIMESTAMP, label: '拍摄时间' },
    { type: WatermarkFieldType.LOCATION, label: '地理位置' },
    { type: WatermarkFieldType.THERAPIST_NAME, label: '治疗师姓名' },
    { type: WatermarkFieldType.THERAPIST_CERTIFICATE, label: '证书编号' },
    { type: WatermarkFieldType.PATIENT_NAME, label: '患者姓名' },
    { type: WatermarkFieldType.PATIENT_MEDICAL_NUMBER, label: '病历号' },
    { type: WatermarkFieldType.TREATMENT_TYPE, label: '治疗类型' }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="h-8 w-8 mr-3" />
          水印配置
        </h1>
        <p className="text-gray-600 mt-2">
          自定义拍照水印的样式、位置和显示字段
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：配置选项 */}
        <div className="space-y-6">
          {/* 基本设置 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">基本设置</h2>
            
            <div className="space-y-4">
              {/* 启用水印 */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  启用水印
                </label>
                <button
                  onClick={() => updateConfig({ enabled: !config.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 水印位置 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  水印位置
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {positionOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateConfig({ position: option.value })}
                      className={`px-3 py-2 text-xs rounded border transition-colors ${
                        config.position === option.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 透明度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  透明度: {(config.opacity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={config.opacity}
                  onChange={(e) => updateConfig({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 字体大小 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  字体大小: {config.fontSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={config.fontSize}
                  onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 字体颜色 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  字体颜色
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.fontColor}
                    onChange={(e) => updateConfig({ fontColor: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.fontColor}
                    onChange={(e) => updateConfig({ fontColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              {/* 背景颜色 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  背景颜色（可选）
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.backgroundColor || '#000000'}
                    onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.backgroundColor || ''}
                    onChange={(e) => updateConfig({ backgroundColor: e.target.value || undefined })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="透明"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 字段配置 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">显示字段</h2>
            <div className="space-y-3">
              {fieldOptions.map((field) => {
                const configField = config.fields.find(f => f.type === field.type)
                if (!configField) return null
                
                return (
                  <div key={field.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleField(field.type)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          configField.enabled 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {configField.enabled && <Check className="h-3 w-3" />}
                      </button>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {field.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={configField.label || ''}
                        onChange={(e) => updateField(field.type, { label: e.target.value })}
                        className="px-2 py-1 text-sm border border-gray-300 rounded w-24"
                        placeholder="自定义标签"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* 导入导出 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">导入导出</h2>
            <div className="flex gap-3">
              <Button onClick={handleExport} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                导出配置
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline"
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                导入配置
              </Button>
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                恢复默认
              </Button>
            </div>
          </Card>
        </div>

        {/* 右侧：预览 */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              实时预览
            </h2>
            
            <div className="relative">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="水印预览"
                  className="w-full rounded-lg shadow-lg"
                />
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">当前配置：</p>
              <ul className="space-y-1">
                <li>• 水印位置：{positionOptions.find(p => p.value === config.position)?.label}</li>
                <li>• 透明度：{(config.opacity * 100).toFixed(0)}%</li>
                <li>• 字体大小：{config.fontSize}px</li>
                <li>• 显示字段：{config.fields.filter(f => f.enabled).length} 个</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* 导入配置对话框 */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4 p-6">
            <h3 className="text-xl font-semibold mb-4">导入配置</h3>
            <p className="text-sm text-gray-600 mb-4">
              请检查以下配置内容，确认无误后点击导入
            </p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-lg text-sm font-mono"
              placeholder="配置JSON内容..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false)
                  setImportJson('')
                }}
              >
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button onClick={handleImport}>
                <Check className="h-4 w-4 mr-2" />
                确认导入
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}