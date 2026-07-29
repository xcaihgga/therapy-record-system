/**
 * 治疗证明在线验证页面
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { proofApi } from '@/api/proof'
import { format } from 'date-fns'
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Clock,
  Key,
  FileCheck,
} from 'lucide-react'
import type { TreatmentProof, ProofVerificationResult } from '@/types/proof'

export default function ProofVerificationPage() {
  const { proofNumber } = useParams<{ proofNumber: string }>()
  const navigate = useNavigate()

  const [proof, setProof] = useState<TreatmentProof | null>(null)
  const [verificationResult, setVerificationResult] = useState<ProofVerificationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputProofNumber, setInputProofNumber] = useState(proofNumber || '')

  // 验证证明
  const verifyProof = async (proofNum: string) => {
    if (!proofNum) {
      setError('请输入证明编号')
      return
    }

    setIsLoading(true)
    setError(null)
    setProof(null)
    setVerificationResult(null)

    try {
      // 获取证明详情
      const proofData = await proofApi.getProofByNumber(proofNum)
      setProof(proofData)

      // 验证证明
      const result = await proofApi.verifyProof(proofNum)
      setVerificationResult(result)
    } catch (err: any) {
      setError(err.message || '验证失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    if (proofNumber) {
      verifyProof(proofNumber)
    }
  }, [proofNumber])

  // 处理验证
  const handleVerify = () => {
    if (inputProofNumber) {
      navigate(`/verify/${inputProofNumber}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">治疗证明验证</h1>
          <p className="text-gray-600">验证治疗记录的真实性证明</p>
        </div>

        {/* 输入框 */}
        {!proofNumber && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="请输入证明编号（例如：PRF-1234567890-ABC123）"
                  value={inputProofNumber}
                  onChange={(e) => setInputProofNumber(e.target.value)}
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVerify()
                    }
                  }}
                />
                <Button onClick={handleVerify} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    '验证'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 错误消息 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center h-40">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">正在验证证明...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 验证结果 */}
        {!isLoading && verificationResult && (
          <div className="space-y-6">
            {/* 验证状态卡片 */}
            <Card className={verificationResult.isValid ? 'border-green-500' : 'border-red-500'}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {verificationResult.isValid ? (
                      <>
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <span className="text-green-700">验证通过</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-red-600" />
                        <span className="text-red-700">验证失败</span>
                      </>
                    )}
                  </CardTitle>
                  <Badge
                    variant={verificationResult.isValid ? 'default' : 'destructive'}
                    className={verificationResult.isValid ? 'bg-green-600' : ''}
                  >
                    {verificationResult.isValid ? '有效证明' : '无效证明'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">证明编号</p>
                  <p className="font-mono font-medium text-lg">{verificationResult.proofNumber}</p>
                </div>

                {verificationResult.errors && verificationResult.errors.length > 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside">
                        {verificationResult.errors.map((err, index) => (
                          <li key={index}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* 详细验证信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 时间戳验证 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className={`h-5 w-5 ${verificationResult.timestamp.isValid ? 'text-green-600' : 'text-red-600'}`} />
                    时间戳验证
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">验证结果</p>
                      <Badge variant={verificationResult.timestamp.isValid ? 'default' : 'destructive'} className={verificationResult.timestamp.isValid ? 'bg-green-600' : ''}>
                        {verificationResult.timestamp.isValid ? '有效' : '无效'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">时间戳</p>
                      <p className="text-sm font-medium">
                        {format(new Date(verificationResult.timestamp.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">提供者</p>
                      <p className="text-sm font-medium">{verificationResult.timestamp.provider}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 签名验证 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Key className={`h-5 w-5 ${verificationResult.signature.isValid ? 'text-green-600' : 'text-red-600'}`} />
                    数字签名
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">验证结果</p>
                      <Badge variant={verificationResult.signature.isValid ? 'default' : 'destructive'} className={verificationResult.signature.isValid ? 'bg-green-600' : ''}>
                        {verificationResult.signature.isValid ? '有效' : '无效'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">签名人</p>
                      <p className="text-sm font-medium">{verificationResult.signature.signedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">签名时间</p>
                      <p className="text-sm font-medium">
                        {format(new Date(verificationResult.signature.signedAt), 'yyyy-MM-dd HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 数据完整性 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileCheck className={`h-5 w-5 ${verificationResult.recordIntegrity.isValid ? 'text-green-600' : 'text-red-600'}`} />
                    数据完整性
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">验证结果</p>
                      <Badge variant={verificationResult.recordIntegrity.isValid ? 'default' : 'destructive'} className={verificationResult.recordIntegrity.isValid ? 'bg-green-600' : ''}>
                        {verificationResult.recordIntegrity.isValid ? '完整' : '已损坏'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">哈希匹配</p>
                      <Badge variant={verificationResult.recordIntegrity.hashMatch ? 'default' : 'destructive'} className={verificationResult.recordIntegrity.hashMatch ? 'bg-green-600' : ''}>
                        {verificationResult.recordIntegrity.hashMatch ? '匹配' : '不匹配'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 证明详情 */}
            {proof && (
              <Card>
                <CardHeader>
                  <CardTitle>证明详情</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 患者信息 */}
                    <div>
                      <h4 className="font-medium mb-3 text-gray-900">患者信息</h4>
                      <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">姓名</p>
                            <p className="font-medium">{proof.patientInfo.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">年龄</p>
                            <p className="font-medium">{proof.patientInfo.age}岁</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">性别</p>
                            <p className="font-medium">{proof.patientInfo.gender}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">病历号</p>
                            <p className="font-medium">{proof.patientInfo.medicalRecordNumber}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 治疗师信息 */}
                    <div>
                      <h4 className="font-medium mb-3 text-gray-900">治疗师信息</h4>
                      <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">姓名</p>
                            <p className="font-medium">{proof.therapistInfo.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">执业证号</p>
                            <p className="font-medium">{proof.therapistInfo.certificateNumber}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 治疗详情 */}
                    <div className="md:col-span-2">
                      <h4 className="font-medium mb-3 text-gray-900">治疗详情</h4>
                      <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">治疗类型</p>
                            <p className="font-medium">{proof.treatmentDetails.type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">治疗日期</p>
                            <p className="font-medium">
                              {format(new Date(proof.treatmentDetails.date), 'yyyy-MM-dd')}
                            </p>
                          </div>
                          {proof.treatmentDetails.time && (
                            <div>
                              <p className="text-xs text-gray-500">治疗时间</p>
                              <p className="font-medium">{proof.treatmentDetails.time}</p>
                            </div>
                          )}
                          {proof.treatmentDetails.location && (
                            <div>
                              <p className="text-xs text-gray-500">治疗地点</p>
                              <p className="font-medium">{proof.treatmentDetails.location}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">治疗内容</p>
                          <p className="text-sm">{proof.treatmentDetails.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 返回按钮 */}
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    </div>
  )
}