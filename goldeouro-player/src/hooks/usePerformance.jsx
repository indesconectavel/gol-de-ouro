import { useState, useEffect, useCallback, useRef } from 'react'
import { PerformanceUtils } from '../config/performance'

const usePerformance = () => {
  const [fps, setFps] = useState(60)
  const [isLowEndDevice, setIsLowEndDevice] = useState(false)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafIdRef = useRef(null)

  // Monitorar FPS
  const measureFPS = useCallback(() => {
    const now = performance.now()
    frameCountRef.current++

    if (now - lastTimeRef.current >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
      setFps(currentFps)
      frameCountRef.current = 0
      lastTimeRef.current = now
    }

    rafIdRef.current = requestAnimationFrame(measureFPS)
  }, [])

  // Detectar dispositivo de baixo desempenho
  const detectLowEndDevice = useCallback(() => {
    const isMobile = PerformanceUtils.isMobile()
    const hasWebGL = PerformanceUtils.supportsWebGL()
    const hasAudioContext = PerformanceUtils.supportsAudioContext()
    const memory = navigator.deviceMemory || 4 // GB
    const cores = navigator.hardwareConcurrency || 4

    // Considerar dispositivo de baixo desempenho se:
    // - É móvel E tem pouca memória
    // - Não tem WebGL
    // - Tem poucos cores
    const isLowEnd = (isMobile && memory < 4) || !hasWebGL || cores < 4

    setIsLowEndDevice(isLowEnd)
  }, [])

  // Otimizar baseado no desempenho
  const getOptimizedSettings = useCallback(() => {
    return {
      reduceAnimations: isLowEndDevice || fps < 30,
      reduceParticles: isLowEndDevice || fps < 45,
      reduceShadows: isLowEndDevice,
      reduceEffects: isLowEndDevice || fps < 40,
      quality: isLowEndDevice ? 'low' : fps < 45 ? 'medium' : 'high'
    }
  }, [isLowEndDevice, fps])

  // Throttled functions
  const throttledSetFps = PerformanceUtils.throttle(setFps, 1000)

  useEffect(() => {
    detectLowEndDevice()
    measureFPS()

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [detectLowEndDevice, measureFPS])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return {
    fps,
    isLowEndDevice,
    optimizedSettings: getOptimizedSettings(),
    PerformanceUtils
  }
}

export default usePerformance
