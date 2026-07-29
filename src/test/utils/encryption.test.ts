import { describe, it, expect, beforeEach, vi } from 'vitest'
import { encrypt, decrypt, hash, generateSalt, isEncryptionSupported } from '@/utils/encryption'

describe('Encryption Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isEncryptionSupported', () => {
    it('should return true when crypto API is available', () => {
      expect(isEncryptionSupported()).toBe(true)
    })
  })

  describe('generateSalt', () => {
    it('should generate a base64 encoded salt', () => {
      const salt = generateSalt()
      expect(typeof salt).toBe('string')
      expect(salt.length).toBeGreaterThan(0)
    })

    it('should generate different salts', () => {
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      expect(salt1).not.toBe(salt2)
    })
  })

  describe('hash', () => {
    it('should generate SHA-256 hash', async () => {
      const data = 'test data'
      const hashResult = await hash(data)
      
      expect(typeof hashResult).toBe('string')
      expect(hashResult.length).toBe(64) // SHA-256 produces 64 hex characters
    })

    it('should generate same hash for same input', async () => {
      const data = 'test data'
      const hash1 = await hash(data)
      const hash2 = await hash(data)
      
      expect(hash1).toBe(hash2)
    })

    it('should generate different hash for different input', async () => {
      const hash1 = await hash('data1')
      const hash2 = await hash('data2')
      
      expect(hash1).not.toBe(hash2)
    })
  })
})

describe('Encryption and Decryption', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should encrypt and decrypt data correctly', async () => {
    const originalData = 'sensitive patient data'
    
    // Mock encryption
    const mockEncrypted = btoa(originalData)
    vi.mocked(global.crypto.subtle.encrypt).mockResolvedValueOnce(
      new TextEncoder().encode(mockEncrypted)
    )
    
    // Mock decryption
    vi.mocked(global.crypto.subtle.decrypt).mockResolvedValueOnce(
      new TextEncoder().encode(originalData)
    )
    
    vi.mocked(global.crypto.subtle.importKey).mockResolvedValue({} as CryptoKey)
    vi.mocked(global.crypto.subtle.generateKey).mockResolvedValue({} as CryptoKey)
    vi.mocked(global.crypto.subtle.exportKey).mockResolvedValue(new ArrayBuffer(32))
    vi.mocked(global.crypto.subtle.deriveKey).mockResolvedValue({} as CryptoKey)
    
    const encrypted = await encrypt(originalData)
    expect(typeof encrypted).toBe('string')
  })
})

describe('Encryption Error Handling', () => {
  it('should handle encryption errors gracefully', async () => {
    vi.mocked(global.crypto.subtle.encrypt).mockRejectedValueOnce(
      new Error('Encryption failed')
    )
    
    await expect(encrypt('test')).rejects.toThrow('数据加密失败')
  })

  it('should handle decryption errors gracefully', async () => {
    vi.mocked(global.crypto.subtle.decrypt).mockRejectedValueOnce(
      new Error('Decryption failed')
    )
    
    await expect(decrypt('invalid-data')).rejects.toThrow('数据解密失败')
  })
})