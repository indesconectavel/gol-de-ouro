// Configurações de performance para o jogo
export const PERFORMANCE_CONFIG = {
  // Configurações de animação
  ANIMATION: {
    // Usar transform3d para aceleração por hardware
    USE_GPU_ACCELERATION: true,
    // Reduzir animações em dispositivos móveis
    REDUCE_MOTION: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Duração padrão das animações
    DEFAULT_DURATION: 300,
    // Easing padrão
    DEFAULT_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Configurações de imagem
  IMAGE: {
    // Qualidade de compressão para imagens
    COMPRESSION_QUALITY: 0.8,
    // Formato preferido para imagens
    PREFERRED_FORMAT: 'webp',
    // Tamanho máximo de cache de imagens
    MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
    // Lazy loading threshold
    LAZY_LOAD_THRESHOLD: 0.1
  },

  // Configurações de som
  SOUND: {
    // Volume padrão
    DEFAULT_VOLUME: 0.7,
    // Máximo de sons simultâneos
    MAX_CONCURRENT_SOUNDS: 5,
    // Fade out duration
    FADE_OUT_DURATION: 200
  },

  // Configurações de renderização
  RENDERING: {
    // Usar requestAnimationFrame para animações
    USE_RAF: true,
    // Throttle para eventos de scroll/resize
    THROTTLE_DELAY: 16, // ~60fps
    // Debounce para eventos de input
    DEBOUNCE_DELAY: 300
  }
}

// Utilitários de performance
export const PerformanceUtils = {
  // Throttle function
  throttle: (func, delay) => {
    let timeoutId
    let lastExecTime = 0
    return function (...args) {
      const currentTime = Date.now()
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args)
        lastExecTime = currentTime
      } else {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          func.apply(this, args)
          lastExecTime = Date.now()
        }, delay - (currentTime - lastExecTime))
      }
    }
  },

  // Debounce function
  debounce: (func, delay) => {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  },

  // Request Animation Frame wrapper
  raf: (callback) => {
    if (PERFORMANCE_CONFIG.RENDERING.USE_RAF) {
      requestAnimationFrame(callback)
    } else {
      setTimeout(callback, 16)
    }
  },

  // Verificar se o dispositivo é móvel
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  // Verificar suporte a WebGL
  supportsWebGL: () => {
    try {
      const canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'))
    } catch (e) {
      return false
    }
  },

  // Verificar suporte a AudioContext
  supportsAudioContext: () => {
    return !!(window.AudioContext || window.webkitAudioContext)
  }
}

export default PERFORMANCE_CONFIG
