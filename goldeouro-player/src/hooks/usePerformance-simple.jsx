import { useCallback } from 'react'

const usePerformance = () => {
  // Função para pré-carregar recursos críticos
  const preloadCriticalResources = useCallback(() => {
    // Pré-carregar imagens críticas
    const criticalImages = [
      '/images/Gol_de_Ouro_logo.png',
      '/images/bola_de_ouro.png'
    ]
    
    criticalImages.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  return {
    fps: 60,
    isLowEndDevice: false,
    optimizedSettings: {
      reduceAnimations: false,
      reduceParticles: false,
      reduceShadows: false,
      reduceEffects: false,
      quality: 'high'
    },
    preloadCriticalResources,
    PerformanceUtils: {
      throttle: (func, delay) => func,
      debounce: (func, delay) => func,
      raf: (callback) => requestAnimationFrame(callback),
      isMobile: () => false,
      supportsWebGL: () => true,
      supportsAudioContext: () => true
    }
  }
}

export default usePerformance
