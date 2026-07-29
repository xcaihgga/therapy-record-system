/**
 * 安全管理页面
 * 提供数据安全与隐私保护的可视化界面
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  Lock,
  FileText,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import {
  backupService,
  autoBackupScheduler,
  BackupType,
  BackupStatus,
} from '@/utils/security'
import type { BackupMetadata } from '@/utils/security'
import {
  accessLogger,
  LogOperation,
  LogLevel,
  anomalyDetector,
  ThreatLevel,
} from '@/utils/security'
import type { AnomalyEvent } from '@/utils/security'
import {
  initializeSecurity,
  performSecurityAudit,
  encryptedLocalStorage,
} from '@/utils/security'
import { useAuthStore } from '@/stores/authStore'

export default function SecurityManagementPage() {
  const { user } = useAuthStore()
  const [backups, setBackups] = useState<BackupMetadata[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [auditResult, setAuditResult] = useState<any>(null)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRunningAudit, setIsRunningAudit] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 初始化安全服务
      await initializeSecurity()
      setIsInitialized(true)

      // 加载备份数据
      const backupList = await backupService.listBackups()
      setBackups(backupList)

      // 加载异常事件
      const anomalyEvents = anomalyDetector.getAnomalyEvents()
      setAnomalies(anomalyEvents)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleCreateBackup = async () => {
    if (!user) return

    setIsCreatingBackup(true)
    try {
      backupService.setCurrentUser(user.id)
      const metadata = await backupService.createBackup(BackupType.FULL, {
        description: '手动创建备份',
      })
      
      // 刷新备份列表
      const backupList = await backupService.listBackups()
      setBackups(backupList)
      
      alert(`备份创建成功！\nID: ${metadata.id}\n大小: ${(metadata.size / 1024).toFixed(2)} KB\n项目数: ${metadata.itemCount}`)
    } catch (error) {
      alert(`备份创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleVerifyBackup = async (backupId: string) => {
    try {
      const result = await backupService.verifyBackup(backupId)
      
      if (result.valid) {
        alert('备份验证成功！数据完整性良好。')
      } else {
        alert(`备份验证失败:\n${result.errors.join('\n')}`)
      }
      
      // 刷新备份列表
      const backupList = await backupService.listBackups()
      setBackups(backupList)
    } catch (error) {
      alert(`验证失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    const confirmed = window.confirm('确定要恢复此备份吗？当前数据将被覆盖。')
    if (!confirmed) return

    try {
      const result = await backupService.restoreBackup(backupId)
      
      if (result.success) {
        alert(`备份恢复成功！\n恢复了 ${result.restoredItems} 项数据`)
        
        // 重新加载数据
        await loadData()
      } else {
        alert(`备份恢复失败:\n${result.errors.join('\n')}`)
      }
    } catch (error) {
      alert(`恢复失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleExportBackup = async (backupId: string) => {
    try {
      const backupJson = await backupService.exportBackup(backupId)
      
      // 创建下载链接
      const blob = new Blob([backupJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${backupId}_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    const confirmed = window.confirm('确定要删除此备份吗？')
    if (!confirmed) return

    try {
      await backupService.deleteBackup(backupId)
      
      // 刷新备份列表
      const backupList = await backupService.listBackups()
      setBackups(backupList)
      
      alert('备份已删除')
    } catch (error) {
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleRunAudit = async () => {
    if (!user) return

    setIsRunningAudit(true)
    try {
      const result = await performSecurityAudit(user.id)
      setAuditResult(result)
      
      // 刷新异常事件
      const anomalyEvents = anomalyDetector.getAnomalyEvents()
      setAnomalies(anomalyEvents)
    } catch (error) {
      console.error('安全审计失败:', error)
    } finally {
      setIsRunningAudit(false)
    }
  }

  const handleExportLogs = async () => {
    try {
      const logsJson = await accessLogger.exportLogs('json')
      
      // 创建下载链接
      const blob = new Blob([logsJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `access_logs_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`导出日志失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const getThreatLevelBadge = (level: ThreatLevel) => {
    const variants: Record<ThreatLevel, string> = {
      [ThreatLevel.LOW]: 'bg-green-100 text-green-800',
      [ThreatLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [ThreatLevel.HIGH]: 'bg-orange-100 text-orange-800',
      [ThreatLevel.CRITICAL]: 'bg-red-100 text-red-800',
    }
    
    return (
      <Badge className={variants[level]}>
        {level === ThreatLevel.LOW && '低'}
        {level === ThreatLevel.MEDIUM && '中'}
        {level === ThreatLevel.HIGH && '高'}
        {level === ThreatLevel.CRITICAL && '严重'}
      </Badge>
    )
  }

  const getBackupStatusBadge = (status: BackupStatus) => {
    const variants: Record<BackupStatus, string> = {
      [BackupStatus.PENDING]: 'bg-gray-100 text-gray-800',
      [BackupStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [BackupStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [BackupStatus.FAILED]: 'bg-red-100 text-red-800',
      [BackupStatus.VERIFIED]: 'bg-emerald-100 text-emerald-800',
    }
    
    return (
      <Badge className={variants[status]}>
        {status === BackupStatus.PENDING && '等待中'}
        {status === BackupStatus.IN_PROGRESS && '进行中'}
        {status === BackupStatus.COMPLETED && '已完成'}
        {status === BackupStatus.FAILED && '失败'}
        {status === BackupStatus.VERIFIED && '已验证'}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">安全管理中心</h1>
          <p className="text-gray-600 mt-1">数据安全与隐私保护控制台</p>
        </div>
        <div className="flex items-center gap-2">
          {isInitialized ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              安全服务已初始化
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800">
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              初始化中...
            </Badge>
          )}
        </div>
      </div>

      {/* 安全概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">数据加密</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">已启用</div>
            <p className="text-xs text-muted-foreground">
              AES-256-GCM 加密算法
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">备份状态</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground">
              个备份文件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">安全告警</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {anomalies.filter(a => !a.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              未处理的异常事件
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 安全审计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            安全审计
          </CardTitle>
          <CardDescription>
            执行全面的安全审计，检测潜在的安全风险
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleRunAudit} disabled={isRunningAudit}>
              {isRunningAudit ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              执行安全审计
            </Button>
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="w-4 h-4 mr-2" />
              导出访问日志
            </Button>
          </div>

          {auditResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">检测结果</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>检测到的异常:</span>
                      <span className="font-bold">{auditResult.anomalies.length}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">安全建议</h4>
                  <ul className="space-y-1">
                    {auditResult.recommendations.length > 0 ? (
                      auditResult.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          {rec}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        系统安全状况良好
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 异常事件列表 */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              异常事件 ({anomalies.filter(a => !a.resolved).length} 未处理)
            </CardTitle>
            <CardDescription>
              检测到的异常访问行为和安全事件
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${
                    event.resolved ? 'bg-gray-50 opacity-60' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getThreatLevelBadge(event.threatLevel)}
                      <span className="font-semibold">{event.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm">{event.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 数据备份 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            数据备份
          </CardTitle>
          <CardDescription>
            管理数据备份，确保数据安全可恢复
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
              {isCreatingBackup ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              创建备份
            </Button>
          </div>

          {backups.length > 0 ? (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="p-4 rounded-lg border bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getBackupStatusBadge(backup.status)}
                      <span className="font-mono text-sm">{backup.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {new Date(backup.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500">大小:</span>
                      <span className="ml-1 font-medium">{formatFileSize(backup.size)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">项目数:</span>
                      <span className="ml-1 font-medium">{backup.itemCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">类型:</span>
                      <span className="ml-1 font-medium">
                        {backup.type === BackupType.FULL ? '完整备份' : '部分备份'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">耗时:</span>
                      <span className="ml-1 font-medium">{backup.duration}ms</span>
                    </div>
                  </div>
                  
                  {backup.description && (
                    <p className="text-sm text-gray-600 mb-3">{backup.description}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerifyBackup(backup.id)}
                    >
                      验证
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreBackup(backup.id)}
                    >
                      恢复
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportBackup(backup.id)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      导出
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteBackup(backup.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                暂无备份文件。建议立即创建备份以确保数据安全。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 安全功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>安全功能说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                数据加密
              </h4>
              <ul className="text-sm space-y-1">
                <li>✓ AES-256-GCM 加密算法</li>
                <li>✓ 自动加密敏感字段</li>
                <li>✓ 加密 localStorage 和 IndexedDB</li>
                <li>✓ Web Crypto API 安全实现</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                访问控制
              </h4>
              <ul className="text-sm space-y-1">
                <li>✓ 细粒度权限控制</li>
                <li>✓ 资源+操作级别权限</li>
                <li>✓ 数据范围限制</li>
                <li>✓ 字段级权限</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                访问日志
              </h4>
              <ul className="text-sm space-y-1">
                <li>✓ 记录所有数据访问</li>
                <li>✓ 时间、用户、操作追踪</li>
                <li>✓ 日志导出功能</li>
                <li>✓ 安全审计支持</li>
              </ul>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                异常检测
              </h4>
              <ul className="text-sm space-y-1">
                <li>✓ 实时异常检测</li>
                <li>✓ 暴力破解检测</li>
                <li>✓ 批量导出检测</li>
                <li>✓ 非正常时间访问检测</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}