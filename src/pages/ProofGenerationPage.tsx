/**
 * 治疗证明生成页面
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useProofStore } from '@/stores/proofStore'
import { useTherapyRecordStore } from '@/stores/therapyRecordStore'
import { usePatientStore } from '@/stores/patientStore'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'
import { 
  FileText, 
  Download, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode
} from 'lucide-react'
import type { TreatmentProof, PdfProofOptions } from '@/types/proof'

export default function ProofGenerationPage() {
  const { recordId } = useParams<{ recordId: string }>()
  const navigate = useNavigate()
  
  const { user } = useAuthStore()
  const { currentRecord, fetchRecordById, isLoading: recordLoading } = useTherapyRecordStore()
  const { patients, fetchPatients } = usePatientStore()
  const {
    generateProof,
    downloadProofPdf,
    hasKeys,
    isLoading: proofLoading,
    error,
    clearError,
  } = useProofStore()

  const [proof, setProof] = useState<TreatmentProof | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<'standard' | 'detailed' | 'compact'>('standard')
  const [successMessage, setSuccessMessage] = useState('')

  // 加载记录详情
  useEffect(() => {
    if (recordId) {
      fetchRecordById(parseInt(recordId))
    }
    fetchPatients()
  }, [recordId, fetchRecordById, fetchPatients])

  // 获取患者信息
  const patient = currentRecord && patients.find(p => p.id === currentRecord.patient_id)

  // 处理生成证明
  const handleGenerateProof = async () => {
    if (!currentRecord || !patient || !user) {
      return
    }

    try {
      clearError()
      setSuccessMessage('')
      
      const newProof = await generateProof(
        currentRecord,
        patient,
        {
          id: user.id,
          name: user.name,
          certificate_number: user.certificate_number || '',
          phone: user.phone,
          email: user.email,
          password_hash: '',
          role: user.role,
          status: user.status,
          created_at: new Date(),
          updated_at: new Date(),
        },
        selectedTemplate
      )
      
      setProof(newProof)
      setSuccessMessage('治疗证明已生成！')
    } catch (error: any) {
      console.error('生成证明失败:', error)
    }
  }

  // 处理下载PDF
  const handleDownloadPdf = async () => {
    if (!proof) return

    try {
      const options: PdfProofOptions = {
        template: selectedTemplate,
        includeQrCode: true,
        includeWatermark: true,
        language: 'zh-CN',
        pageSize: 'A4',
      }
      
      await downloadProofPdf(proof, options)
      setSuccessMessage('PDF证明已下载！')
    } catch (error: any) {
      console.error('下载PDF失败:', error)
    }
  }

  if (recordLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!currentRecord) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>未找到治疗记录</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/records')}>
          返回记录列表
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">生成治疗证明</h1>
        <p className="mt-2 text-gray-600">为治疗记录生成包含数字签名和时间戳的真实性证明</p>
      </div>

      {/* 成功消息 */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* 错误消息 */}
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 记录信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              治疗记录信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">患者姓名</p>
                <p className="font-medium">{patient?.name || '未知'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">年龄</p>
                <p className="font-medium">{patient?.age || '-'}岁</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">治疗日期</p>
                <p className="font-medium">
                  {format(new Date(currentRecord.treatment_date), 'yyyy-MM-dd')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">治疗类型</p>
                <p className="font-medium">{currentRecord.treatment_type}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">治疗内容</p>
              <p className="text-sm bg-gray-50 rounded p-2">{currentRecord.content}</p>
            </div>

            {currentRecord.location && (
              <div>
                <p className="text-xs text-gray-500">治疗地点</p>
                <p className="font-medium">{currentRecord.location}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 证明生成 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              生成证明
            </CardTitle>
            <CardDescription>
              选择证明模板并生成真实性证明
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 检查密钥对 */}
            {!hasKeys && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  您还没有生成数字证书，请先前往{' '}
                  <Button 
                    variant="link" 
                    className="h-auto p-0"
                    onClick={() => navigate('/signatures')}
                  >
                    签名管理
                  </Button>
                  {' '}页面生成密钥对和证书。
                </AlertDescription>
              </Alert>
            )}

            {/* 模板选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择模板</label>
              <div className="space-y-2">
                {[
                  { value: 'standard', label: '标准模板', desc: '包含完整的治疗信息和证明' },
                  { value: 'detailed', label: '详细模板', desc: '包含更多详细信息和水印' },
                  { value: 'compact', label: '简洁模板', desc: '精简信息，适合快速查看' },
                ].map((template) => (
                  <label key={template.value} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="template"
                      value={template.value}
                      checked={selectedTemplate === template.value}
                      onChange={(e) => setSelectedTemplate(e.target.value as any)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{template.label}</p>
                      <p className="text-xs text-gray-500">{template.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 生成按钮 */}
            <Button
              onClick={handleGenerateProof}
              disabled={proofLoading || !hasKeys}
              className="w-full"
            >
              {proofLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  生成证明
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 证明预览和下载 */}
        {proof && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                证明已生成
              </CardTitle>
              <CardDescription>
                治疗证明已成功生成，包含时间戳和数字签名
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 证明信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">证明编号</p>
                  <p className="font-mono font-medium">{proof.proofNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">生成时间</p>
                  <p className="font-medium">
                    {format(new Date(proof.metadata.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </p>
                </div>
              </div>

              {/* 真实性证明信息 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">真实性证明</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-blue-700">时间戳提供者</p>
                    <p className="font-medium text-blue-900">
                      {proof.authenticity.timestamp.provider}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">时间戳</p>
                    <p className="font-medium text-blue-900">
                      {format(
                        new Date(proof.authenticity.timestamp.timestamp),
                        'yyyy-MM-dd HH:mm:ss'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">签名算法</p>
                    <p className="font-medium text-blue-900">
                      {proof.authenticity.signature.algorithm}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">证明状态</p>
                    <Badge variant="default" className="bg-green-600">
                      有效
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4">
                <Button onClick={handleDownloadPdf} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  下载PDF证明
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/verify/${proof.proofNumber}`)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  查看验证页面
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}