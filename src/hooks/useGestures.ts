import { useCallback, useRef } from 'react'

interface SwipeConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

interface TouchPosition {
  x: number
  y: number
  time: number
}

/**
 * 手势操作钩子
 * 用于实现滑动、缩放等触控操作
 */
export function useGestures(config: SwipeConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50
  } = config

  const touchStartRef = useRef<TouchPosition | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1) {
      return
    }

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // 确保是快速滑动（小于300ms）
    if (deltaTime > 300) {
      touchStartRef.current = null
      return
    }

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // 水平滑动
    if (absX > absY && absX > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }
    // 垂直滑动
    else if (absY > absX && absY > threshold) {
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown()
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp()
      }
    }

    touchStartRef.current = null
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  }
}

/**
 * 下拉刷新钩子
 */
export function usePullToRefresh(callback: () => void | Promise<void>) {
  const startY = useRef(0)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    // 下拉超过100px触发刷新
    if (diff > 100) {
      isPulling.current = false
      callback()
    }
  }, [callback])

  const handleTouchEnd = useCallback(() => {
    isPulling.current = false
  }, [])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}

/**
 * 双击缩放钩子
 */
export function useDoubleTapZoom(elementRef: React.RefObject<HTMLElement>) {
  const lastTapTime = useRef(0)

  const handleTouchEnd = useCallback(() => {
    const currentTime = Date.now()
    const tapLength = currentTime - lastTapTime.current

    if (tapLength < 300 && tapLength > 0) {
      // 双击
      if (elementRef.current) {
        elementRef.current.classList.toggle('scale-150')
      }
    }

    lastTapTime.current = currentTime
  }, [elementRef])

  return {
    onTouchEnd: handleTouchEnd,
  }
}