import { useState, useEffect, useRef, useCallback } from 'react'

const useLazyLoading = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options

  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const elementRef = useRef(null)

  const handleIntersection = useCallback((entries) => {
    const [entry] = entries
    const isVisible = entry.isIntersecting

    setIsIntersecting(isVisible)

    if (isVisible && !hasIntersected) {
      setHasIntersected(true)
    }
  }, [hasIntersected])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    })

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [handleIntersection, threshold, rootMargin])

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
    shouldRender: triggerOnce ? hasIntersected : isIntersecting
  }
}

export default useLazyLoading
