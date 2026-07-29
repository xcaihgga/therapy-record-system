/**
 * 水印生成工具
 * 使用Canvas API绘制水印，支持多行文本和图片水印
 */

import { 
  WatermarkConfig, 
  WatermarkData, 
  WatermarkPosition,
  WatermarkFieldType 
} from '@/types/watermark'

/**
 * 加载图片
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * 获取水印位置坐标
 */
const getWatermarkPosition = (
  position: WatermarkPosition,
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  padding: number
): { x: number; y: number } => {
  switch (position) {
    case WatermarkPosition.TOP_LEFT:
      return { x: padding, y: padding }
    
    case WatermarkPosition.TOP_RIGHT:
      return { 
        x: canvasWidth - watermarkWidth - padding, 
        y: padding 
      }
    
    case WatermarkPosition.BOTTOM_LEFT:
      return { 
        x: padding, 
        y: canvasHeight - watermarkHeight - padding 
      }
    
    case WatermarkPosition.BOTTOM_RIGHT:
      return { 
        x: canvasWidth - watermarkWidth - padding, 
        y: canvasHeight - watermarkHeight - padding 
      }
    
    case WatermarkPosition.CENTER:
      return { 
        x: (canvasWidth - watermarkWidth) / 2, 
        y: (canvasHeight - watermarkHeight) / 2 
      }
    
    default:
      return { x: padding, y: padding }
  }
}

/**
 * 格式化时间戳
 */
const formatTimestamp = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

/**
 * 格式化位置信息
 */
const formatLocation = (data: WatermarkData): string => {
  if (!data.location) return '位置信息未获取'
  
  const lat = data.location.latitude.toFixed(6)
  const lng = data.location.longitude.toFixed(6)
  
  if (data.address && data.address.formatted_address) {
    return `${data.address.formatted_address}`
  }
  
  return `经度: ${lng}, 纬度: ${lat}`
}

/**
 * 根据字段类型获取显示文本
 */
const getFieldText = (
  fieldType: WatermarkFieldType, 
  data: WatermarkData
): string => {
  switch (fieldType) {
    case WatermarkFieldType.TIMESTAMP:
      return `拍摄时间: ${formatTimestamp(data.timestamp)}`
    
    case WatermarkFieldType.LOCATION:
      return `位置: ${formatLocation(data)}`
    
    case WatermarkFieldType.THERAPIST_NAME:
      return data.therapistName ? `治疗师: ${data.therapistName}` : ''
    
    case WatermarkFieldType.THERAPIST_CERTIFICATE:
      return data.therapistCertificate ? `证书编号: ${data.therapistCertificate}` : ''
    
    case WatermarkFieldType.PATIENT_NAME:
      return data.patientName ? `患者: ${data.patientName}` : ''
    
    case WatermarkFieldType.PATIENT_MEDICAL_NUMBER:
      return data.patientMedicalNumber ? `病历号: ${data.patientMedicalNumber}` : ''
    
    case WatermarkFieldType.TREATMENT_TYPE:
      return data.treatmentType ? `治疗类型: ${data.treatmentType}` : ''
    
    case WatermarkFieldType.CUSTOM_TEXT:
      return data.customText || ''
    
    default:
      return ''
  }
}

/**
 * 计算水印文本框尺寸
 */
const calculateWatermarkSize = (
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  data: WatermarkData
): { width: number; height: number; lines: string[] } => {
  const lines: string[] = []
  const enabledFields = config.fields
    .filter(f => f.enabled)
    .sort((a, b) => a.order - b.order)
  
  for (const field of enabledFields) {
    const text = getFieldText(field.type, data)
    if (text) {
      lines.push(text)
    }
  }
  
  if (lines.length === 0) {
    return { width: 0, height: 0, lines: [] }
  }
  
  // 计算最大宽度
  ctx.font = `${config.fontSize}px ${config.fontFamily}`
  const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width))
  
  // 计算总高度
  const lineHeight = config.fontSize * 1.5
  const totalHeight = lines.length * lineHeight
  
  return {
    width: maxWidth + config.padding * 2,
    height: totalHeight + config.padding * 2,
    lines
  }
}

/**
 * 绘制文本水印
 */
const drawTextWatermark = (
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  data: WatermarkData,
  position: { x: number; y: number }
): void => {
  const size = calculateWatermarkSize(ctx, config, data)
  
  if (size.lines.length === 0) return
  
  // 保存当前状态
  ctx.save()
  
  // 设置全局透明度
  ctx.globalAlpha = config.opacity
  
  // 绘制背景
  if (config.backgroundColor) {
    ctx.fillStyle = config.backgroundColor
    ctx.beginPath()
    if (config.borderRadius > 0) {
      ctx.roundRect(
        position.x, 
        position.y, 
        size.width, 
        size.height, 
        config.borderRadius
      )
    } else {
      ctx.rect(position.x, position.y, size.width, size.height)
    }
    ctx.fill()
  }
  
  // 设置字体和颜色
  ctx.font = `${config.fontSize}px ${config.fontFamily}`
  ctx.fillStyle = config.fontColor
  ctx.textBaseline = 'top'
  
  // 绘制文本
  const lineHeight = config.fontSize * 1.5
  size.lines.forEach((line, index) => {
    const x = position.x + config.padding
    const y = position.y + config.padding + index * lineHeight
    ctx.fillText(line, x, y)
  })
  
  // 恢复状态
  ctx.restore()
}

/**
 * 绘制图片水印（Logo）
 */
const drawImageWatermark = async (
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  position: { x: number; y: number },
  watermarkHeight: number
): Promise<void> => {
  if (!config.logoEnabled || !config.logoPath) return
  
  try {
    const logo = await loadImage(config.logoPath)
    
    // 保存状态
    ctx.save()
    
    // 设置透明度
    ctx.globalAlpha = config.logoOpacity || config.opacity
    
    // 计算Logo尺寸（保持宽高比）
    const maxSize = config.logoSize || watermarkHeight * 0.8
    let logoWidth = logo.width
    let logoHeight = logo.height
    
    if (logo.width > logo.height) {
      if (logo.width > maxSize) {
        logoHeight = (logo.height / logo.width) * maxSize
        logoWidth = maxSize
      }
    } else {
      if (logo.height > maxSize) {
        logoWidth = (logo.width / logo.height) * maxSize
        logoHeight = maxSize
      }
    }
    
    // 计算Logo位置（在水印文本上方或旁边）
    const logoX = position.x
    const logoY = position.y - logoHeight - 10
    
    // 绘制Logo
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight)
    
    // 恢复状态
    ctx.restore()
  } catch (error) {
    console.error('加载Logo失败:', error)
  }
}

/**
 * 添加水印到图片
 */
export const addWatermarkToImage = async (
  imageFile: File,
  config: WatermarkConfig,
  data: WatermarkData
): Promise<{ original: Blob; watermarked: Blob }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const img = new Image()
        img.onload = async () => {
          // 创建Canvas
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('无法创建Canvas上下文'))
            return
          }
          
          // 设置Canvas尺寸
          canvas.width = img.width
          canvas.height = img.height
          
          // 绘制原图
          ctx.drawImage(img, 0, 0)
          
          // 添加水印
          if (config.enabled) {
            const size = calculateWatermarkSize(ctx, config, data)
            const position = getWatermarkPosition(
              config.position,
              canvas.width,
              canvas.height,
              size.width,
              size.height,
              10
            )
            
            // 绘制Logo水印
            if (config.logoEnabled) {
              await drawImageWatermark(ctx, config, position, size.height)
            }
            
            // 绘制文本水印
            drawTextWatermark(ctx, config, data, position)
          }
          
          // 转换为Blob
          const originalCanvas = document.createElement('canvas')
          const originalCtx = originalCanvas.getContext('2d')
          originalCanvas.width = img.width
          originalCanvas.height = img.height
          originalCtx?.drawImage(img, 0, 0)
          
          // 创建原始图片和水印图片的Blob
          originalCanvas.toBlob((originalBlob) => {
            if (!originalBlob) {
              reject(new Error('创建原图Blob失败'))
              return
            }
            
            canvas.toBlob((watermarkedBlob) => {
              if (!watermarkedBlob) {
                reject(new Error('创建水印图Blob失败'))
                return
              }
              
              resolve({
                original: originalBlob,
                watermarked: watermarkedBlob
              })
            }, 'image/jpeg', 0.9)
          }, 'image/jpeg', 0.9)
        }
        
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = e.target?.result as string
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(imageFile)
  })
}

/**
 * 在Canvas上直接添加水印（用于摄像头拍摄）
 */
export const addWatermarkToCanvas = async (
  canvas: HTMLCanvasElement,
  config: WatermarkConfig,
  data: WatermarkData
): Promise<Blob> => {
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('无法获取Canvas上下文')
  }
  
  // 添加水印
  if (config.enabled) {
    const size = calculateWatermarkSize(ctx, config, data)
    const position = getWatermarkPosition(
      config.position,
      canvas.width,
      canvas.height,
      size.width,
      size.height,
      10
    )
    
    // 绘制Logo水印
    if (config.logoEnabled) {
      await drawImageWatermark(ctx, config, position, size.height)
    }
    
    // 绘制文本水印
    drawTextWatermark(ctx, config, data, position)
  }
  
  // 转换为Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Canvas转换Blob失败'))
      }
    }, 'image/jpeg', 0.9)
  })
}

/**
 * 创建水印预览
 */
export const createWatermarkPreview = (
  config: WatermarkConfig,
  data: WatermarkData,
  width: number = 400,
  height: number = 300
): string => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return ''
  
  canvas.width = width
  canvas.height = height
  
  // 绘制背景
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, width, height)
  
  // 绘制示例图片占位符
  ctx.fillStyle = '#ddd'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#999'
  ctx.font = '16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('预览图片', width / 2, height / 2)
  
  // 添加水印
  if (config.enabled) {
    const size = calculateWatermarkSize(ctx, config, data)
    const position = getWatermarkPosition(
      config.position,
      width,
      height,
      size.width,
      size.height,
      10
    )
    
    drawTextWatermark(ctx, config, data, position)
  }
  
  return canvas.toDataURL('image/png')
}