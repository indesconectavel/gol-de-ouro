import { useState, useEffect, useCallback } from 'react'

const usePerformanceMonitor = (options = {}) => {
  const {
    enabled = true,
    sampleRate = 0.1, // 10% das sessões
    reportInterval = 30000, // 30 segundos
    endpoint = '/api/performance'
  } = options

  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0,
    networkLatency: 0,
    errors: 0
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  // Monitorar FPS
  const monitorFPS = useCallback(() => {
    let lastTime = performance.now()
    let frameCount = 0
    let fps = 0

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setMetrics(prev => ({ ...prev, fps }))
        
        frameCount = 0
        lastTime = currentTime
      }
      
      if (isMonitoring) {
        requestAnimationFrame(measureFPS)
      }
    }

    if (isMonitoring) {
      requestAnimationFrame(measureFPS)
    }
  }, [isMonitoring])

  // Monitorar memória
  const monitorMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = performance.memory
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
      setMetrics(prev => ({ ...prev, memory: usedMB }))
    }
  }, [])

  // Monitorar tempo de renderização
  const measureRenderTime = useCallback((componentName) => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime)
      }))
      
      // Log render lento
      if (renderTime > 16) { // Mais de 16ms (60fps)
        console.warn(`Slow render in ${componentName}: ${renderTime}ms`)
      }
    }
  }, [])

  // Monitorar latência de rede
  const measureNetworkLatency = useCallback(async (url) => {
    const startTime = performance.now()
    
    try {
      await fetch(url, { method: 'HEAD' })
      const endTime = performance.now()
      const latency = endTime - startTime
      
      setMetrics(prev => ({
        ...prev,
        networkLatency: Math.round(latency)
      }))
    } catch (error) {
      console.error('Network latency measurement failed:', error)
    }
  }, [])

  // Monitorar erros
  const monitorErrors = useCallback(() => {
    let errorCount = 0

    const handleError = (event) => {
      errorCount++
      setMetrics(prev => ({ ...prev, errors: errorCount }))
      
      // Reportar erro crítico
      if (event.error && event.error.stack) {
        console.error('JavaScript Error:', event.error)
      }
    }

    const handleUnhandledRejection = (event) => {
      errorCount++
      setMetrics(prev => ({ ...prev, errors: errorCount }))
      
      console.error('Unhandled Promise Rejection:', event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Enviar métricas para o servidor
  const reportMetrics = useCallback(async () => {
    if (!enabled || Math.random() > sampleRate) return

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        })
      })
    } catch (error) {
      console.error('Failed to report metrics:', error)
    }
  }, [enabled, sampleRate, endpoint, metrics])

  // Iniciar monitoramento
  const startMonitoring = useCallback(() => {
    if (!enabled) return

    setIsMonitoring(true)
    monitorFPS()
    monitorMemory()
    monitorErrors()

    // Medir latência de rede periodicamente
    const networkInterval = setInterval(() => {
      measureNetworkLatency('/api/health')
    }, 10000)

    // Reportar métricas periodicamente
    const reportInterval = setInterval(reportMetrics, 30000)

    return () => {
      setIsMonitoring(false)
      clearInterval(networkInterval)
      clearInterval(reportInterval)
    }
  }, [enabled, monitorFPS, monitorMemory, monitorErrors, measureNetworkLatency, reportMetrics])

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  // Iniciar automaticamente
  useEffect(() => {
    const cleanup = startMonitoring()
    return cleanup
  }, [startMonitoring])

  // Monitorar mudanças de visibilidade
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopMonitoring()
      } else {
        startMonitoring()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startMonitoring, stopMonitoring])

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureRenderTime,
    measureNetworkLatency,
    reportMetrics
  }
}

export default usePerformanceMonitor
