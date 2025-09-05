// Configuração de CDN para assets estáticos
const CDN_CONFIG = {
  baseUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.goldeouro.lol',
  fallbackUrl: process.env.PUBLIC_URL || '',
  version: process.env.REACT_APP_VERSION || '1.0.0'
}

// Função para gerar URL do CDN
export const getCDNUrl = (path, options = {}) => {
  const {
    useVersion = true,
    useFallback = true,
    quality = 'auto'
  } = options

  let url = `${CDN_CONFIG.baseUrl}${path}`
  
  // Adicionar versão para cache busting
  if (useVersion) {
    const separator = path.includes('?') ? '&' : '?'
    url += `${separator}v=${CDN_CONFIG.version}`
  }
  
  // Adicionar parâmetros de qualidade para imagens
  if (path.match(/\.(jpg|jpeg|png|webp)$/i)) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}q=${quality}`
  }
  
  return url
}

// Função para pré-carregar assets críticos
export const preloadCriticalAssets = () => {
  const criticalAssets = [
    '/images/Gol_de_Ouro_logo.png',
    '/images/Gol_de_Ouro_Bg01.jpg',
    '/images/Gol_de_Ouro_Bg02.jpg',
    '/sounds/background.mp3',
    '/sounds/button-click.mp3'
  ]

  criticalAssets.forEach(asset => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = getCDNUrl(asset)
    
    if (asset.match(/\.(jpg|jpeg|png|webp)$/i)) {
      link.as = 'image'
    } else if (asset.match(/\.(mp3|wav|ogg)$/i)) {
      link.as = 'audio'
    } else if (asset.match(/\.(css)$/i)) {
      link.as = 'style'
    } else if (asset.match(/\.(js)$/i)) {
      link.as = 'script'
    }
    
    document.head.appendChild(link)
  })
}

// Função para carregar assets sob demanda
export const loadAsset = (path, type = 'image') => {
  return new Promise((resolve, reject) => {
    const url = getCDNUrl(path)
    
    if (type === 'image') {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => {
        // Fallback para URL local
        const fallbackImg = new Image()
        fallbackImg.onload = () => resolve(fallbackImg)
        fallbackImg.onerror = () => reject(new Error(`Failed to load image: ${path}`))
        fallbackImg.src = `${CDN_CONFIG.fallbackUrl}${path}`
      }
      img.src = url
    } else if (type === 'audio') {
      const audio = new Audio()
      audio.oncanplaythrough = () => resolve(audio)
      audio.onerror = () => {
        // Fallback para URL local
        const fallbackAudio = new Audio()
        fallbackAudio.oncanplaythrough = () => resolve(fallbackAudio)
        fallbackAudio.onerror = () => reject(new Error(`Failed to load audio: ${path}`))
        fallbackAudio.src = `${CDN_CONFIG.fallbackUrl}${path}`
      }
      audio.src = url
    } else {
      reject(new Error(`Unsupported asset type: ${type}`))
    }
  })
}

// Função para otimizar imagens
export const optimizeImage = (src, options = {}) => {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto'
  } = options

  let url = getCDNUrl(src, { quality })
  
  // Adicionar parâmetros de redimensionamento
  if (width || height) {
    const separator = url.includes('?') ? '&' : '?'
    if (width) url += `${separator}w=${width}`
    if (height) url += `${separator}h=${height}`
  }
  
  // Adicionar formato
  if (format !== 'auto') {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}f=${format}`
  }
  
  return url
}

// Função para verificar se CDN está disponível
export const checkCDNAvailability = async () => {
  try {
    const response = await fetch(getCDNUrl('/health'), {
      method: 'HEAD',
      timeout: 5000
    })
    return response.ok
  } catch (error) {
    console.warn('CDN not available, using fallback:', error)
    return false
  }
}

export default {
  getCDNUrl,
  preloadCriticalAssets,
  loadAsset,
  optimizeImage,
  checkCDNAvailability
}
