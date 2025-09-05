import React, { useState, useEffect } from 'react'
import useImagePreloader from '../hooks/useImagePreloader'

const ImageLoader = ({ children, imageSources = [] }) => {
  const { loadedImages, loadingProgress, isLoading } = useImagePreloader(imageSources)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      // Pequeno delay para suavizar a transição
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 bg-slate-800/50 rounded-2xl">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-white text-lg font-medium mb-2">Carregando jogo...</div>
        <div className="w-64 bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <div className="text-white/70 text-sm">{Math.round(loadingProgress)}%</div>
      </div>
    )
  }

  return (
    <div className={`transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  )
}

export default ImageLoader
