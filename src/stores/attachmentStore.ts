import { create } from 'zustand'
import { Attachment } from '@/types/database'

export interface UploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface AttachmentState {
  attachments: Attachment[]
  uploadProgress: Map<string, UploadProgress>
  isLoading: boolean
  error: string | null

  // Actions
  fetchAttachments: (recordId: number) => Promise<void>
  uploadAttachment: (recordId: number, file: File, onProgress?: (progress: number) => void) => Promise<Attachment>
  deleteAttachment: (attachmentId: number) => Promise<void>
  getAttachmentUrl: (attachmentId: number) => Promise<string>
  clearUploadProgress: (fileId: string) => void
  clearAllUploadProgress: () => void
  clearError: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const useAttachmentStore = create<AttachmentState>((set) => ({
  attachments: [],
  uploadProgress: new Map(),
  isLoading: false,
  error: null,

  fetchAttachments: async (recordId: number) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${API_BASE_URL}/api/therapy-records/${recordId}/attachments`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('获取附件列表失败')
      }

      const attachments = await response.json()
      set({
        attachments,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '获取附件列表失败',
      })
      throw error
    }
  },

  uploadAttachment: async (recordId: number, file: File, onProgress) => {
    const fileId = `${Date.now()}-${file.name}`

    // 初始化上传进度
    set(state => {
      const newProgress = new Map(state.uploadProgress)
      newProgress.set(fileId, {
        fileId,
        progress: 0,
        status: 'uploading',
      })
      return { uploadProgress: newProgress }
    })

    try {
      const token = localStorage.getItem('auth_token')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('record_id', recordId.toString())

      const xhr = new XMLHttpRequest()

      // 返回一个Promise来支持进度跟踪
      const uploadPromise = new Promise<Attachment>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)

            set(state => {
              const newProgress = new Map(state.uploadProgress)
              newProgress.set(fileId, {
                fileId,
                progress,
                status: 'uploading',
              })
              return { uploadProgress: newProgress }
            })

            if (onProgress) {
              onProgress(progress)
            }
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText)

            set(state => {
              const newProgress = new Map(state.uploadProgress)
              newProgress.set(fileId, {
                fileId,
                progress: 100,
                status: 'success',
              })
              return {
                attachments: [...state.attachments, response],
                uploadProgress: newProgress
              }
            })

            resolve(response)
          } else {
            const error = JSON.parse(xhr.responseText)

            set(state => {
              const newProgress = new Map(state.uploadProgress)
              newProgress.set(fileId, {
                fileId,
                progress: 0,
                status: 'error',
                error: error.message || '上传失败',
              })
              return { uploadProgress: newProgress }
            })

            reject(new Error(error.message || '上传失败'))
          }
        })

        xhr.addEventListener('error', () => {
          set(state => {
            const newProgress = new Map(state.uploadProgress)
            newProgress.set(fileId, {
              fileId,
              progress: 0,
              status: 'error',
              error: '网络错误',
            })
            return { uploadProgress: newProgress }
          })

          reject(new Error('网络错误'))
        })

        xhr.open('POST', `${API_BASE_URL}/api/attachments/upload`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })

      return await uploadPromise
    } catch (error: any) {
      set(state => {
        const newProgress = new Map(state.uploadProgress)
        newProgress.set(fileId, {
          fileId,
          progress: 0,
          status: 'error',
          error: error.message || '上传失败',
        })
        return { uploadProgress: newProgress }
      })
      throw error
    }
  },

  deleteAttachment: async (attachmentId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${API_BASE_URL}/api/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('删除附件失败')
      }

      set(state => ({
        attachments: state.attachments.filter(a => a.id !== attachmentId),
      }))
    } catch (error: any) {
      set({ error: error.message || '删除附件失败' })
      throw error
    }
  },

  getAttachmentUrl: async (attachmentId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${API_BASE_URL}/api/attachments/${attachmentId}/url`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('获取文件URL失败')
      }

      const data = await response.json()
      return data.url
    } catch (error: any) {
      throw error
    }
  },

  clearUploadProgress: (fileId: string) => {
    set(state => {
      const newProgress = new Map(state.uploadProgress)
      newProgress.delete(fileId)
      return { uploadProgress: newProgress }
    })
  },

  clearAllUploadProgress: () => {
    set({ uploadProgress: new Map() })
  },

  clearError: () => {
    set({ error: null })
  },
}))