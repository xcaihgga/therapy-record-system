import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  WatermarkConfig, 
  WatermarkField,
  DEFAULT_WATERMARK_CONFIG 
} from '@/types/watermark'

interface WatermarkState {
  config: WatermarkConfig
  
  // 配置操作
  updateConfig: (config: Partial<WatermarkConfig>) => void
  resetConfig: () => void
  
  // 字段操作
  updateField: (fieldType: string, updates: Partial<WatermarkField>) => void
  toggleField: (fieldType: string) => void
  reorderFields: (fields: WatermarkField[]) => void
  
  // 导入导出
  exportConfig: () => string
  importConfig: (configJson: string) => boolean
}

export const useWatermarkStore = create<WatermarkState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_WATERMARK_CONFIG,
      
      updateConfig: (updates) => {
        set((state) => ({
          config: {
            ...state.config,
            ...updates,
            lastUpdated: new Date().toISOString()
          }
        }))
      },
      
      resetConfig: () => {
        set({
          config: {
            ...DEFAULT_WATERMARK_CONFIG,
            lastUpdated: new Date().toISOString()
          }
        })
      },
      
      updateField: (fieldType, updates) => {
        set((state) => ({
          config: {
            ...state.config,
            fields: state.config.fields.map(field =>
              field.type === fieldType ? { ...field, ...updates } : field
            ),
            lastUpdated: new Date().toISOString()
          }
        }))
      },
      
      toggleField: (fieldType) => {
        set((state) => ({
          config: {
            ...state.config,
            fields: state.config.fields.map(field =>
              field.type === fieldType ? { ...field, enabled: !field.enabled } : field
            ),
            lastUpdated: new Date().toISOString()
          }
        }))
      },
      
      reorderFields: (fields) => {
        set((state) => ({
          config: {
            ...state.config,
            fields: fields.map((field, index) => ({ ...field, order: index + 1 })),
            lastUpdated: new Date().toISOString()
          }
        }))
      },
      
      exportConfig: () => {
        const state = get()
        return JSON.stringify(state.config, null, 2)
      },
      
      importConfig: (configJson) => {
        try {
          const config = JSON.parse(configJson) as WatermarkConfig
          // 验证配置的有效性
          if (typeof config.enabled === 'boolean' && 
              Array.isArray(config.fields) &&
              typeof config.opacity === 'number' &&
              typeof config.fontSize === 'number') {
            set({
              config: {
                ...config,
                lastUpdated: new Date().toISOString()
              }
            })
            return true
          }
          return false
        } catch (error) {
          console.error('导入配置失败:', error)
          return false
        }
      }
    }),
    {
      name: 'watermark-config',
      version: 1
    }
  )
)