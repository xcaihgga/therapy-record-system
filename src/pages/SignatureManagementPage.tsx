/**
 * 签名管理页面
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useProofStore } from '@/stores/proofStore'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'
import { 
  Key, 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react'

export default function SignatureManagementPage() {
  const { user } = useAuthStore()
  const {
    keyPair,
    certificate,
    hasKeys,
    isGenerating,
    error,
    signatures,
    generateKeyPair,
    generateCertificate,
    deleteKeyPair,
    loadKeyPair,
    exportKeyPair,
    importKeyPair,
    clearError,
  } = useProofStore()

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'RSA-2048' | 'ECDSA-P256'>('RSA-2048')
  const [password, setPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // 加载已有密钥对
  useEffect(() => {
    loadKeyPair()
  }, [loadKeyPair])

  // 处理生成密钥对
  const handleGenerateKeyPair = async () => {
    try {
      clearError()
      setSuccessMessage('')
      await generateKeyPair(selectedAlgorithm, password || undefined)
      setSuccessMessage('密钥对生成成功！')
      setPassword('')
      setShowPasswordInput(false)
    } catch (error: any) {
      console.error('生成密钥对失败:', error)
    }
  }

  // 处理生成证书
  const handleGenerateCertificate = async () => {
    if (!user || !user.id || !user.name) {
      setSuccessMessage('')
      return
    }

    try {
      clearError()
      setSuccessMessage('')
      await generateCertificate(user.id, user.name, user.certificate_number || 'CERT-UNKNOWN')
      setSuccessMessage('证书生成成功！')
    } catch (error: any) {
      console.error('生成证书失败:', error)
    }
  }

  // 处理导出密钥对
  const handleExportKeyPair = async () => {
    try {
      const keyPairJson = await exportKeyPair()
      const blob = new Blob([keyPairJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `therapy-system-keypair-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSuccessMessage('密钥对已导出！')
    } catch (error: any) {
      console.error('导出密钥对失败:', error)
    }
  }

  // 处理导入密钥对
  const handleImportKeyPair = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await importKeyPair(text)
      setSuccessMessage('密钥对已导入！')
    } catch (error: any) {
      console.error('导入密钥对失败:', error)
    }
  }

  // 处理删除密钥对
  const handleDeleteKeyPair = () => {
    if (confirm('确定要删除密钥对和证书吗？此操作不可恢复。')) {
      deleteKeyPair()
      setSuccessMessage('密钥对已删除！')
    }
  }

  // 复制公钥到剪贴板
  const copyPublicKeyToClipboard = () => {
    if (keyPair?.publicKey) {
      navigator.clipboard.writeText(keyPair.publicKey)
      setSuccessMessage('公钥已复制到剪贴板！')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">数字签名管理</h1>
        <p className="mt-2 text-gray-600">管理您的数字证书、密钥对和签名记录</p>
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
        {/* 密钥对管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              密钥对管理
            </CardTitle>
            <CardDescription>
              生成和管理您的数字签名密钥对
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 密钥对状态 */}
            {hasKeys && keyPair ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">
                    已生成
                  </Badge>
                  <Badge variant="outline">{keyPair.algorithm}</Badge>
                  <Badge variant="outline">
                    创建于 {format(new Date(keyPair.createdAt), 'yyyy-MM-dd HH:mm')}
                  </Badge>
                </div>

                {/* 公钥显示 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">公钥</label>
                  <div className="bg-gray-50 border rounded-lg p-3 max-h-32 overflow-y-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
                      {keyPair.publicKey}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={copyPublicKeyToClipboard}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    复制公钥
                  </Button>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleExportKeyPair} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    导出密钥对
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportKeyPair}
                      className="hidden"
                      id="import-keypair"
                    />
                    <Button variant="outline" asChild>
                      <label htmlFor="import-keypair" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        导入密钥对
                      </label>
                    </Button>
                  </div>
                  <Button onClick={handleDeleteKeyPair} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除密钥对
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    您还没有生成密钥对，请先生成密钥对以使用数字签名功能。
                  </AlertDescription>
                </Alert>

                {/* 算法选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择算法</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="algorithm"
                        value="RSA-2048"
                        checked={selectedAlgorithm === 'RSA-2048'}
                        onChange={(e) => setSelectedAlgorithm(e.target.value as 'RSA-2048')}
                        className="mr-2"
                      />
                      RSA-2048
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="algorithm"
                        value="ECDSA-P256"
                        checked={selectedAlgorithm === 'ECDSA-P256'}
                        onChange={(e) => setSelectedAlgorithm(e.target.value as 'ECDSA-P256')}
                        className="mr-2"
                      />
                      ECDSA P-256
                    </label>
                  </div>
                </div>

                {/* 密码输入（可选） */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="use-password"
                      checked={showPasswordInput}
                      onChange={(e) => setShowPasswordInput(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="use-password" className="text-sm text-gray-700">
                      使用密码保护私钥（推荐）
                    </label>
                  </div>
                  {showPasswordInput && (
                    <input
                      type="password"
                      placeholder="输入加密密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  )}
                </div>

                {/* 生成按钮 */}
                <Button
                  onClick={handleGenerateKeyPair}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      生成密钥对
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 证书管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              数字证书
            </CardTitle>
            <CardDescription>
              查看和管理您的数字证书信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {certificate ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-600">
                    有效
                  </Badge>
                </div>

                {/* 证书信息 */}
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">序列号</p>
                      <p className="text-sm font-medium">{certificate.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">算法</p>
                      <p className="text-sm font-medium">{certificate.signatureAlgorithm}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">签发者</p>
                      <p className="text-sm font-medium">{certificate.issuer.commonName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">主题</p>
                      <p className="text-sm font-medium">{certificate.subject.commonName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">生效时间</p>
                      <p className="text-sm font-medium">
                        {format(new Date(certificate.validity.notBefore), 'yyyy-MM-dd HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">过期时间</p>
                      <p className="text-sm font-medium">
                        {format(new Date(certificate.validity.notAfter), 'yyyy-MM-dd HH:mm')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">指纹</p>
                    <p className="text-xs font-mono bg-white px-2 py-1 rounded break-all">
                      {certificate.fingerprint}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {hasKeys
                      ? '密钥对已生成，请点击下方按钮生成数字证书。'
                      : '请先生成密钥对，然后生成数字证书。'}
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleGenerateCertificate}
                  disabled={isGenerating || !hasKeys}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      生成数字证书
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 签名记录 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              签名记录
            </CardTitle>
            <CardDescription>
              查看您的治疗记录签名历史
            </CardDescription>
          </CardHeader>
          <CardContent>
            {signatures.length > 0 ? (
              <div className="space-y-4">
                {signatures.map((signature) => (
                  <div key={signature.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={signature.status === 'valid' ? 'default' : 'destructive'}>
                        {signature.status === 'valid' ? '有效' : '无效'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(signature.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">记录ID</p>
                        <p className="font-medium">{signature.recordId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">签名算法</p>
                        <p className="font-medium">{signature.algorithm}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  暂无签名记录。您可以在治疗记录详情页面生成签名和证明。
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}