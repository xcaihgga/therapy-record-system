// 环境变量配置
export const config = {
  // API配置
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  },
  
  // 认证配置
  auth: {
    domain: import.meta.env.VITE_AUTH_DOMAIN || '',
    clientId: import.meta.env.VITE_AUTH_CLIENT_ID || '',
  },
  
  // 安全配置
  security: {
    encryptionEnabled: import.meta.env.VITE_ENCRYPTION_ENABLED === 'true',
    logLevel: import.meta.env.VITE_SECURITY_LOG_LEVEL || 'INFO',
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
    allowedFileTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || '').split(','),
  },
  
  // 水印配置
  watermark: {
    enabled: import.meta.env.VITE_WATERMARK_ENABLED === 'true',
    logoUrl: import.meta.env.VITE_WATERMARK_LOGO_URL || '',
  },
  
  // 地理位置服务
  geolocation: {
    apiKey: import.meta.env.VITE_GEOLOCATION_API_KEY || '',
  },
  
  // 监控配置
  monitoring: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
    analyticsId: import.meta.env.VITE_ANALYTICS_ID || '',
  },
  
  // PWA配置
  pwa: {
    enabled: import.meta.env.VITE_PWA_ENABLED === 'true',
    startUrl: import.meta.env.VITE_PWA_START_URL || '/',
  },
  
  // 功能开关
  features: {
    proofGeneration: import.meta.env.VITE_FEATURE_PROOF_GENERATION === 'true',
    digitalSignature: import.meta.env.VITE_FEATURE_DIGITAL_SIGNATURE === 'true',
    offlineMode: import.meta.env.VITE_FEATURE_OFFLINE_MODE === 'true',
  },
  
  // 其他配置
  app: {
    name: import.meta.env.VITE_APP_NAME || '治疗师治疗记录系统',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com',
  },
  
  // 环境
  env: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
  },
}

export type Config = typeof config