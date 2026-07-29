import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, SwitchCamera, X, Check, MapPin, AlertCircle } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { useWatermarkStore } from '@/stores/watermarkStore'
import { useAuthStore } from '@/stores/authStore'
import { addWatermarkToCanvas } from '@/utils/watermarkGenerator'
import { getFullLocation } from '@/utils/geoLocation'
import type { WatermarkData, GeoLocation, AddressInfo } from '@/types/watermark'

interface CameraCaptureProps {
  onCapture: (files: { original: File; watermarked: File }) => void
  onClose: () => void
  isOpen: boolean
  patientName?: string
  patientMedicalNumber?: string
  treatmentType?: string
}

export function CameraCapture({ 
  onCapture, 
  onClose, 
  isOpen,
  patientName,
  patientMedicalNumber,
  treatmentType 
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  
  // 水印相关状态
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [address, setAddress] = useState<AddressInfo | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  
  // 从Store获取水印配置和用户信息
  const { config } = useWatermarkStore()
  const { user } = useAuthStore()

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 先停止之前的流
      stopStream()

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err: any) {
      console.error('摄像头访问失败:', err)
      setError(err.message || '无法访问摄像头，请检查权限设置')
    } finally {
      setIsLoading(false)
    }
  }, [facingMode, stopStream])

  // 获取地理位置
  const getLocation = useCallback(async () => {
    if (!config.enabled) return
    
    setIsGettingLocation(true)
    setLocationError(null)
    
    try {
      const result = await getFullLocation()
      setLocation(result.location)
      setAddress(result.address)
      
      // 显示验证警告
      if (result.validation.warnings.length > 0) {
        console.warn('位置验证警告:', result.validation.warnings)
      }
    } catch (error: any) {
      console.error('获取位置失败:', error)
      setLocationError(error.message)
    } finally {
      setIsGettingLocation(false)
    }
  }, [config.enabled])

  useEffect(() => {
    if (isOpen) {
      startCamera()
      getLocation()
    } else {
      stopStream()
      setPreviewImage(null)
      setLocation(null)
      setAddress(null)
      setLocationError(null)
    }

    return () => {
      stopStream()
    }
  }, [isOpen, startCamera, stopStream, getLocation])

  useEffect(() => {
    if (isOpen && streamRef.current === null) {
      startCamera()
    }
  }, [facingMode, isOpen, startCamera])

  const handleSwitchCamera = async () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !originalCanvasRef.current) return

    setIsCapturing(true)
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const originalCanvas = originalCanvasRef.current
      const context = canvas.getContext('2d')
      const originalContext = originalCanvas.getContext('2d')

      if (!context || !originalContext) return

      // 设置Canvas尺寸
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      originalCanvas.width = video.videoWidth
      originalCanvas.height = video.videoHeight

      // 绘制原始图像
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      originalContext.drawImage(video, 0, 0, originalCanvas.width, originalCanvas.height)

      // 准备水印数据
      const watermarkData: WatermarkData = {
        timestamp: new Date(),
        location: location || undefined,
        address: address || undefined,
        therapistName: user?.name,
        therapistCertificate: user?.certificate_number,
        patientName,
        patientMedicalNumber,
        treatmentType
      }

      // 保存原图Blob
      const originalBlob = await new Promise<Blob>((resolve, reject) => {
        originalCanvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('创建原图Blob失败'))
        }, 'image/jpeg', 0.9)
      })

      // 添加水印并获取水印图Blob
      const watermarkedBlob = await addWatermarkToCanvas(canvas, config, watermarkData)

      // 显示预览
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setPreviewImage(dataUrl)

      // 存储Blob供后续使用
      canvas.dataset.hasBlobs = 'true'
      ;(canvas as any).originalBlob = originalBlob
      ;(canvas as any).watermarkedBlob = watermarkedBlob
      
    } catch (error) {
      console.error('拍照失败:', error)
      setError('拍照失败，请重试')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleConfirm = () => {
    if (!canvasRef.current || !previewImage) return

    const canvas = canvasRef.current
    const originalBlob = (canvas as any).originalBlob as Blob
    const watermarkedBlob = (canvas as any).watermarkedBlob as Blob

    if (!originalBlob || !watermarkedBlob) {
      setError('图片数据丢失，请重新拍摄')
      return
    }

    // 创建File对象
    const timestamp = Date.now()
    const originalFile = new File(
      [originalBlob],
      `original-${timestamp}.jpg`,
      { type: 'image/jpeg' }
    )
    
    const watermarkedFile = new File(
      [watermarkedBlob],
      `watermarked-${timestamp}.jpg`,
      { type: 'image/jpeg' }
    )

    onCapture({ original: originalFile, watermarked: watermarkedFile })
    handleClose()
  }

  const handleRetake = () => {
    setPreviewImage(null)
    if (canvasRef.current) {
      delete (canvasRef.current as any).originalBlob
      delete (canvasRef.current as any).watermarkedBlob
    }
    startCamera()
    getLocation()
  }

  const handleClose = () => {
    stopStream()
    setPreviewImage(null)
    setError(null)
    setLocation(null)
    setAddress(null)
    setLocationError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="拍照记录" size="lg">
      <div className="relative">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 位置信息提示 */}
        {locationError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">位置获取失败: {locationError}。水印将不包含位置信息。</span>
          </div>
        )}

        {/* 正在获取位置 */}
        {isGettingLocation && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 animate-pulse" />
            <span className="text-sm">正在获取地理位置...</span>
          </div>
        )}

        {/* 加载中 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded">
            <div className="text-white">正在启动摄像头...</div>
          </div>
        )}

        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* 视频预览 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-[60vh] object-contain"
            style={{ display: previewImage ? 'none' : 'block' }}
          />

          {/* 拍照预览 */}
          {previewImage && (
            <img
              src={previewImage}
              alt="拍照预览"
              className="w-full h-auto max-h-[60vh] object-contain"
            />
          )}

          {/* 隐藏的画布用于拍照 */}
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={originalCanvasRef} className="hidden" />
        </div>

        {/* 位置信息显示 */}
        {!previewImage && location && (
          <div className="mt-2 text-xs text-gray-600 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            <span>
              {address?.formatted_address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
            </span>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {!previewImage ? (
            <>
              <Button
                variant="outline"
                onClick={handleSwitchCamera}
                disabled={isLoading}
              >
                <SwitchCamera className="h-4 w-4 mr-2" />
                切换摄像头
              </Button>
              <Button
                onClick={handleCapture}
                disabled={isLoading || !!error || isCapturing}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isCapturing ? '拍摄中...' : '拍照'}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleRetake}>
                重新拍摄
              </Button>
              <Button onClick={handleConfirm}>
                <Check className="h-4 w-4 mr-2" />
                确认使用
              </Button>
            </>
          )}
        </div>

        {/* 水印说明 */}
        {!previewImage && config.enabled && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            拍摄的照片将自动添加时间、位置、治疗师等信息水印
          </div>
        )}
      </div>
    </Dialog>
  )
}