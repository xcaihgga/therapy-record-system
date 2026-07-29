import React, { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, Image, Video, File } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUpload: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // MB
  maxFiles?: number
  className?: string
}

interface FilePreview {
  file: File
  preview?: string
  error?: string | null
}

export function FileUpload({
  onUpload,
  accept = '*',
  multiple = true,
  maxSize = 50,
  maxFiles = 10,
  className
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<FilePreview[]>([])
  const [uploading, setUploading] = useState(false)

  const validateFile = (file: File): string | null => {
    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      return `文件大小超过 ${maxSize}MB 限制`
    }

    // 检查文件类型（如果指定了accept）
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim())
      const fileType = file.type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase()
        }
        if (type.endsWith('*')) {
          return fileType.startsWith(type.replace('*', ''))
        }
        return fileType === type
      })

      if (!isAccepted) {
        return `不支持的文件类型`
      }
    }

    return null
  }

  const generatePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          resolve(result ? result as string : undefined)
        }
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      })
    } else if (file.type.startsWith('video/')) {
      return new Promise((resolve) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadeddata = () => {
          video.currentTime = 1
        }
        video.onseeked = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(video, 0, 0)
          resolve(canvas.toDataURL())
          URL.revokeObjectURL(video.src)
        }
        video.onerror = () => resolve(undefined)
        video.src = URL.createObjectURL(file)
      })
    } else {
      return undefined
    }
  }

  const processFiles = async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList)
    const currentCount = files.length
    const allowedCount = Math.min(fileArray.length, maxFiles - currentCount)

    const newFiles: FilePreview[] = []

    for (let i = 0; i < allowedCount; i++) {
      const file = fileArray[i]
      const error = validateFile(file)
      let preview: string | undefined = undefined
      
      if (!error) {
        const result = await generatePreview(file)
        preview = result || undefined
      }

      newFiles.push({
        file,
        preview,
        error
      })
    }

    setFiles(prev => [...prev, ...newFiles])
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [files, maxFiles])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const handleRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    const validFiles = files.filter(f => !f.error).map(f => f.file)
    if (validFiles.length === 0) return

    setUploading(true)
    try {
      await onUpload(validFiles)
      setFiles([])
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (error) {
      console.error('上传失败:', error)
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8" />
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8" />
    if (file.type === 'application/pdf') return <FileText className="h-8 w-8" />
    return <File className="h-8 w-8" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 拖拽上传区域 */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300",
          "hover:border-primary hover:bg-primary/5"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />

        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">
          拖拽文件到此处或点击上传
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          支持 {accept === '*' ? '所有文件类型' : accept.replace(/\./g, '').toUpperCase()}，
          单个文件最大 {maxSize}MB
          {multiple && `，最多 ${maxFiles} 个文件`}
        </p>
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          选择文件
        </Button>
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((filePreview, index) => (
              <div
                key={index}
                className="relative border rounded-lg p-3 group"
              >
                {/* 删除按钮 */}
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* 预览或图标 */}
                <div className="aspect-square flex items-center justify-center mb-2 bg-gray-100 rounded">
                  {filePreview.preview ? (
                    <img
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  ) : (
                    getFileIcon(filePreview.file)
                  )}
                </div>

                {/* 文件信息 */}
                <p className="text-sm font-medium truncate" title={filePreview.file.name}>
                  {filePreview.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(filePreview.file.size)}
                </p>

                {/* 错误提示 */}
                {filePreview.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {filePreview.error}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 上传按钮 */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              清空
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.filter(f => !f.error).length === 0}
            >
              {uploading ? '上传中...' : `上传 ${files.filter(f => !f.error).length} 个文件`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}