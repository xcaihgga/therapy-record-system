import React from 'react'
import { Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface FilePreviewProps {
  file: {
    name: string
    type: string
    url: string
  }
  isOpen: boolean
  onClose: () => void
  onDownload?: () => void
}

export function FilePreview({ file, isOpen, onClose, onDownload }: FilePreviewProps) {
  const [scale, setScale] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  const isPDF = file.type === 'application/pdf'

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="relative flex items-center justify-center min-h-[400px]">
          <img
            src={file.url}
            alt={file.name}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      )
    }

    if (isVideo) {
      return (
        <video
          src={file.url}
          controls
          className="w-full max-h-[70vh]"
        >
          您的浏览器不支持视频播放
        </video>
      )
    }

    if (isPDF) {
      return (
        <iframe
          src={file.url}
          className="w-full h-[70vh]"
          title={file.name}
        />
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          该文件类型不支持在线预览
        </p>
        {onDownload && (
          <Button className="mt-4" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            下载文件
          </Button>
        )}
      </div>
    )
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={file.name} size="xl">
      {/* 工具栏 */}
      {isImage && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            重置
          </Button>
        </div>
      )}

      {/* 预览内容 */}
      {renderPreview()}

      {/* 下载按钮 */}
      {onDownload && !isPDF && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            下载文件
          </Button>
        </div>
      )}
    </Dialog>
  )
}