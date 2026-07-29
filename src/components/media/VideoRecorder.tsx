import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Video, SwitchCamera, X, Check, Square } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'

interface VideoRecorderProps {
  onRecord: (file: File) => void
  onClose: () => void
  isOpen: boolean
  maxDuration?: number // 最大录制时长（秒）
}

export function VideoRecorder({ onRecord, onClose, isOpen, maxDuration = 60 }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
      stopStream()

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err: any) {
      console.error('摄像头访问失败:', err)
      setError(err.message || '无法访问摄像头和麦克风，请检查权限设置')
    } finally {
      setIsLoading(false)
    }
  }, [facingMode, stopStream])

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopStream()
      setRecordedBlob(null)
      setRecordedUrl(null)
      setRecordingTime(0)
      setIsRecording(false)
    }

    return () => {
      stopStream()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isOpen, startCamera, stopStream])

  useEffect(() => {
    if (isOpen && streamRef.current === null) {
      startCamera()
    }
  }, [facingMode, isOpen, startCamera])

  const handleSwitchCamera = async () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const startRecording = () => {
    if (!streamRef.current) return

    chunksRef.current = []
    setRecordingTime(0)
    setIsRecording(true)

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000)

      // 计时器
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err: any) {
      console.error('录制失败:', err)
      setError(err.message || '录制失败')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const handleConfirm = () => {
    if (!recordedBlob) return

    const file = new File(
      [recordedBlob],
      `therapy-video-${Date.now()}.webm`,
      { type: 'video/webm' }
    )
    onRecord(file)
    handleClose()
  }

  const handleRetake = () => {
    setRecordedBlob(null)
    setRecordedUrl(null)
    setRecordingTime(0)
    startCamera()
  }

  const handleClose = () => {
    stopStream()
    setRecordedBlob(null)
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedUrl(null)
    setError(null)
    setIsRecording(false)
    setRecordingTime(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="视频录制" size="lg">
      <div className="relative">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-white">正在启动摄像头...</div>
          </div>
        )}

        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* 录制中的摄像头预览 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-[60vh] object-contain"
            style={{ display: recordedUrl ? 'none' : 'block' }}
          />

          {/* 录制预览 */}
          {recordedUrl && (
            <video
              ref={previewRef}
              src={recordedUrl}
              controls
              className="w-full h-auto max-h-[60vh] object-contain"
            />
          )}

          {/* 录制时长显示 */}
          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <span className="animate-pulse">●</span>
              {formatTime(recordingTime)}
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {!recordedUrl ? (
            <>
              <Button
                variant="outline"
                onClick={handleSwitchCamera}
                disabled={isLoading || isRecording}
              >
                <SwitchCamera className="h-4 w-4 mr-2" />
                切换摄像头
              </Button>
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={isLoading || !!error}
                >
                  <Video className="h-4 w-4 mr-2" />
                  开始录制
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={stopRecording}
                >
                  <Square className="h-4 w-4 mr-2" />
                  停止录制
                </Button>
              )}
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleRetake}>
                重新录制
              </Button>
              <Button onClick={handleConfirm}>
                <Check className="h-4 w-4 mr-2" />
                确认使用
              </Button>
            </>
          )}
        </div>

        {maxDuration && !recordedUrl && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            最长录制时间: {Math.floor(maxDuration / 60)}分钟
          </p>
        )}
      </div>
    </Dialog>
  )
}