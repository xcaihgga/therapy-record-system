/**
 * 地理定位工具
 * 使用Geolocation API获取位置，支持地图服务集成
 */

import { 
  GeoLocation, 
  AddressInfo, 
  GeoValidationResult 
} from '@/types/watermark'

// 地图服务配置
interface MapServiceConfig {
  type: 'amap' | 'baidu' | 'google' | 'none'
  apiKey?: string
}

// 默认地图服务配置
let mapServiceConfig: MapServiceConfig = {
  type: 'none'
}

/**
 * 设置地图服务配置
 */
export const setMapServiceConfig = (config: MapServiceConfig) => {
  mapServiceConfig = config
}

/**
 * 获取当前位置
 */
export const getCurrentLocation = (): Promise<GeoLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }
    
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoLocation: GeoLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || undefined,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        }
        resolve(geoLocation)
      },
      (error) => {
        let errorMessage = '获取位置失败'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '用户拒绝了位置权限请求'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用'
            break
          case error.TIMEOUT:
            errorMessage = '获取位置超时'
            break
        }
        
        reject(new Error(errorMessage))
      },
      options
    )
  })
}

/**
 * 验证位置信息
 */
export const validateGeoLocation = (
  location: GeoLocation,
  captureTime?: Date
): GeoValidationResult => {
  const warnings: string[] = []
  const errors: string[] = []
  
  // 检查定位精度
  if (location.accuracy && location.accuracy > 100) {
    warnings.push(`定位精度较低（${location.accuracy.toFixed(0)}米），建议在开阔区域重新定位`)
  }
  
  // 检查定位时间
  if (captureTime) {
    const locationTime = new Date(location.timestamp)
    const timeDiff = Math.abs(captureTime.getTime() - locationTime.getTime())
    
    if (timeDiff > 60000) { // 60秒
      warnings.push(`定位时间与拍摄时间相差${(timeDiff / 1000).toFixed(0)}秒，可能存在时间同步问题`)
    }
  }
  
  // 检查海拔信息
  if (!location.altitude) {
    warnings.push('未获取到海拔信息')
  }
  
  // 检查速度信息（用于检测移动中的定位）
  if (location.speed && location.speed > 10) {
    warnings.push(`检测到移动速度${location.speed.toFixed(1)}米/秒，建议在静止状态下拍摄`)
  }
  
  // 基础验证
  if (location.latitude < -90 || location.latitude > 90) {
    errors.push('纬度值无效')
  }
  
  if (location.longitude < -180 || location.longitude > 180) {
    errors.push('经度值无效')
  }
  
  return {
    isValid: errors.length === 0,
    accuracy: location.accuracy || 0,
    timestamp: location.timestamp,
    warnings,
    errors
  }
}

/**
 * 地理编码：将经纬度转换为地址（高德地图）
 */
const geocodeAmap = async (
  latitude: number, 
  longitude: number,
  apiKey: string
): Promise<AddressInfo> => {
  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?key=${apiKey}&location=${longitude},${latitude}&extensions=all`,
      { mode: 'cors' }
    )
    
    if (!response.ok) {
      throw new Error('高德地图API请求失败')
    }
    
    const data = await response.json()
    
    if (data.status !== '1') {
      throw new Error(data.info || '地理编码失败')
    }
    
    const addressComponent = data.regeocode.addressComponent
    
    return {
      formatted_address: data.regeocode.formatted_address,
      country: addressComponent.country || '中国',
      province: addressComponent.province,
      city: Array.isArray(addressComponent.city) 
        ? addressComponent.city.join('') 
        : addressComponent.city,
      district: addressComponent.district,
      street: addressComponent.streetNumber?.street,
      streetNumber: addressComponent.streetNumber?.number
    }
  } catch (error) {
    console.error('高德地图地理编码失败:', error)
    throw error
  }
}

/**
 * 地理编码：将经纬度转换为地址（百度地图）
 */
const geocodeBaidu = async (
  latitude: number, 
  longitude: number,
  apiKey: string
): Promise<AddressInfo> => {
  try {
    const response = await fetch(
      `https://api.map.baidu.com/reverse_geocoding/v3/?ak=${apiKey}&output=json&coordtype=wgs84ll&location=${latitude},${longitude}`,
      { mode: 'cors' }
    )
    
    if (!response.ok) {
      throw new Error('百度地图API请求失败')
    }
    
    const data = await response.json()
    
    if (data.status !== 0) {
      throw new Error(data.message || '地理编码失败')
    }
    
    const addressComponent = data.result.addressComponent
    
    return {
      formatted_address: data.result.formatted_address,
      country: addressComponent.country || '中国',
      province: addressComponent.province,
      city: addressComponent.city,
      district: addressComponent.district,
      street: addressComponent.street,
      streetNumber: addressComponent.street_number
    }
  } catch (error) {
    console.error('百度地图地理编码失败:', error)
    throw error
  }
}

/**
 * 模拟地理编码（当没有API密钥时使用）
 */
const geocodeMock = (latitude: number, longitude: number): AddressInfo => {
  return {
    formatted_address: `位置: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    country: '中国',
    province: '未知省份',
    city: '未知城市'
  }
}

/**
 * 地理编码：将经纬度转换为地址
 */
export const geocodeCoordinates = async (
  latitude: number, 
  longitude: number
): Promise<AddressInfo> => {
  // 如果没有配置地图服务或类型为none，使用模拟数据
  if (mapServiceConfig.type === 'none' || !mapServiceConfig.apiKey) {
    console.warn('未配置地图服务API，使用模拟地址')
    return geocodeMock(latitude, longitude)
  }
  
  try {
    switch (mapServiceConfig.type) {
      case 'amap':
        return await geocodeAmap(latitude, longitude, mapServiceConfig.apiKey)
      
      case 'baidu':
        return await geocodeBaidu(latitude, longitude, mapServiceConfig.apiKey)
      
      default:
        return geocodeMock(latitude, longitude)
    }
  } catch (error) {
    console.error('地理编码失败，使用模拟地址:', error)
    return geocodeMock(latitude, longitude)
  }
}

/**
 * 获取完整的位置信息（包括地理编码）
 */
export const getFullLocation = async (): Promise<{
  location: GeoLocation
  address: AddressInfo
  validation: GeoValidationResult
}> => {
  try {
    // 获取地理位置
    const location = await getCurrentLocation()
    
    // 地理编码获取地址
    const address = await geocodeCoordinates(location.latitude, location.longitude)
    
    // 验证位置信息
    const validation = validateGeoLocation(location)
    
    return {
      location,
      address,
      validation
    }
  } catch (error) {
    throw error
  }
}

/**
 * 计算两点之间的距离（米）
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c * 1000 // 转换为米
  
  return distance
}

/**
 * 检测是否在特定区域内（用于位置验证）
 */
export const isInArea = (
  latitude: number,
  longitude: number,
  centerLat: number,
  centerLon: number,
  radiusInMeters: number
): boolean => {
  const distance = calculateDistance(latitude, longitude, centerLat, centerLon)
  return distance <= radiusInMeters
}

/**
 * 持续监听位置变化
 */
export const watchLocation = (
  onSuccess: (location: GeoLocation) => void,
  onError: (error: Error) => void
): number => {
  if (!navigator.geolocation) {
    onError(new Error('浏览器不支持地理定位'))
    return -1
  }
  
  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
  }
  
  return navigator.geolocation.watchPosition(
    (position) => {
      const geoLocation: GeoLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude || undefined,
        accuracy: position.coords.accuracy,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp
      }
      onSuccess(geoLocation)
    },
    (error) => {
      let errorMessage = '监听位置失败'
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '用户拒绝了位置权限请求'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = '位置信息不可用'
          break
        case error.TIMEOUT:
          errorMessage = '获取位置超时'
          break
      }
      
      onError(new Error(errorMessage))
    },
    options
  )
}

/**
 * 停止监听位置变化
 */
export const stopWatchingLocation = (watchId: number) => {
  if (watchId !== -1 && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
  }
}