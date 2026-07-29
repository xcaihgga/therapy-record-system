import { useState, useEffect } from 'react'
import { offlineSyncService, SyncStatus } from '@/lib/offlineSync'
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 离线状态指示器组件
 */
export function OfflineIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
  })
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    // 订阅网络状态变化
    const unsubscribe = offlineSyncService.subscribe((newStatus) => {
      setStatus(newStatus)

      // 离线时显示提示
      if (!newStatus.isOnline) {
        setShowMessage(true)
        setTimeout(() => setShowMessage(false), 3000)
      }
    })

    // 获取待同步数量
    offlineSyncService.getPendingCount().then(count => {
      setStatus(prev => ({ ...prev, pendingCount: count }))
    })

    return unsubscribe
  }, [])

  // 在线且无待同步数据时不显示
  if (status.isOnline && status.pendingCount === 0 && !status.isSyncing) {
    return null
  }

  return (
    <>
      {/* 固定在顶部的状态栏 */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 px-4 text-sm text-white transition-all duration-300',
          status.isOnline
            ? 'bg-blue-500'
            : 'bg-orange-500',
          showMessage ? 'opacity-100' : 'opacity-90'
        )}
        style={{ marginTop: status.isOnline ? 0 : '0' }}
      >
        {status.isOnline ? (
          <>
            {status.isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span>正在同步数据...</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                <span>
                  已连接
                  {status.pendingCount > 0 && ` - ${status.pendingCount} 条数据待同步`}
                </span>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 mr-2" />
            <span>离线模式 - 数据将在连接后自动同步</span>
          </>
        )}
      </div>

      {/* 离线提示Toast */}
      {showMessage && !status.isOnline && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CloudOff className="h-5 w-5" />
            <div>
              <p className="font-medium">您已离线</p>
              <p className="text-sm opacity-90">
                数据将保存在本地，联网后自动同步
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * 离线状态提示卡片
 */
export function OfflineStatusCard() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
  })

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe(setStatus)
    return unsubscribe
  }, [])

  return (
    <div
      className={cn(
        'rounded-lg p-4 mb-4',
        status.isOnline
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-orange-50 border border-orange-200'
      )}
    >
      <div className="flex items-start space-x-3">
        {status.isOnline ? (
          <Wifi className="h-5 w-5 text-blue-500 mt-0.5" />
        ) : (
          <WifiOff className="h-5 w-5 text-orange-500 mt-0.5" />
        )}
        <div className="flex-1">
          <h3
            className={cn(
              'font-medium',
              status.isOnline ? 'text-blue-800' : 'text-orange-800'
            )}
          >
            {status.isOnline ? '在线模式' : '离线模式'}
          </h3>
          <p
            className={cn(
              'text-sm mt-1',
              status.isOnline ? 'text-blue-600' : 'text-orange-600'
            )}
          >
            {status.isOnline
              ? status.isSyncing
                ? '正在同步数据...'
                : status.pendingCount > 0
                  ? `${status.pendingCount} 条数据待同步`
                  : '所有数据已同步'
              : '您的数据将保存在本地，连接网络后将自动同步到服务器'}
          </p>

          {!status.isOnline && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => offlineSyncService.syncPendingData()}
                className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors min-h-[44px] touch-manipulation"
              >
                手动同步
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 同步进度组件
 */
export function SyncProgressBar() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
  })
  const [totalItems, setTotalItems] = useState(0)
  const [processedItems, setProcessedItems] = useState(0)

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((newStatus) => {
      setStatus(newStatus)

      if (newStatus.isSyncing) {
        offlineSyncService.getPendingCount().then(count => {
          setTotalItems(count)
        })
      } else {
        setProcessedItems(0)
        setTotalItems(0)
      }
    })

    return unsubscribe
  }, [])

  if (!status.isSyncing || totalItems === 0) {
    return null
  }

  const progress = (processedItems / totalItems) * 100

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-lg shadow-lg p-4 z-40">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">同步进度</span>
        <span className="text-sm text-muted-foreground">
          {processedItems} / {totalItems}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}