import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  sizes?: string
  loading?: 'lazy' | 'eager'
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

/**
 * 优化的图片组件
 * - 懒加载
 * - 响应式图片
 * - 占位符
 * - 渐进式加载
 */
export function OptimizedImage({
  src,
  alt,
  className,
  sizes = '100vw',
  loading = 'lazy',
  quality = 75,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(loading === 'eager')
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || !imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px',
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [loading])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // 生成响应式图片URL（简化版本）
  const getResponsiveSrc = () => {
    if (!src || src.startsWith('data:')) return src

    // 如果是外部URL，不进行优化
    if (src.startsWith('http')) return src

    // 本地图片添加质量参数
    return `${src}?q=${quality}`
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* 占位符 */}
      {(!isLoaded || hasError) && (
        <div
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
          aria-hidden="true"
        >
          {hasError ? (
            <span className="text-muted-foreground text-sm">加载失败</span>
          ) : (
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* 图片 */}
      {isInView && (
        <img
          ref={imgRef}
          src={getResponsiveSrc()}
          alt={alt}
          loading={loading}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  )
}

/**
 * 图片预加载组件
 */
export function ImagePreloader({ images }: { images: string[] }) {
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [images])

  return null
}

/**
 * 虚拟列表组件
 */
interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 2,
    items.length
  )

  const visibleItems = items.slice(startIndex, endIndex)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    setScrollTop(target.scrollTop)

    // 滚动到底部时加载更多
    if (
      hasMore &&
      !isLoading &&
      target.scrollTop + target.clientHeight >= target.scrollHeight - 100
    ) {
      onLoadMore?.()
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflowY: 'auto' }}
      className="scroll-smooth"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}