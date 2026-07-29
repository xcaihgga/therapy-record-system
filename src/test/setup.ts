import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator.geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn().mockImplementation((success) =>
      success({
        coords: {
          latitude: 39.9042,
          longitude: 116.4074,
          accuracy: 100,
        },
      })
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
})

// Mock crypto.subtle
const mockSubtle = {
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  generateKey: vi.fn(),
  deriveKey: vi.fn(),
  importKey: vi.fn(),
  exportKey: vi.fn(),
  digest: vi.fn().mockImplementation(async (algorithm, data) => {
    // Create a hash based on the input data to ensure different inputs produce different hashes
    const dataArray = new Uint8Array(data)
    const hash = new Uint8Array(32)
    
    // Simple hash algorithm based on input
    for (let i = 0; i < 32; i++) {
      hash[i] = (dataArray[i % dataArray.length] + i) % 256
    }
    
    return hash
  }),
}

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: mockSubtle,
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    },
  },
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})