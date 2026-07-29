import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className merge)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'not-included')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('not-included')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toContain('px-4')
      expect(result).toContain('py-1')
      expect(result).not.toContain('px-2')
    })

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle object notation', () => {
      const result = cn({
        active: true,
        disabled: false,
        primary: true,
      })
      expect(result).toContain('active')
      expect(result).toContain('primary')
      expect(result).not.toContain('disabled')
    })
  })
})