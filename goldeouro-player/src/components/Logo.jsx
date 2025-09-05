import { useState } from 'react'

const Logo = ({ size = 'large', className = '' }) => {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    small: 'w-12 h-12',      // 48px
    medium: 'w-24 h-24',     // 96px (páginas internas - 150px)
    large: 'w-60 h-auto',    // 240px (páginas iniciais - 250px)
    xlarge: 'w-64 h-auto'    // 256px (páginas iniciais - 250px)
  }

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  }

  const containerSize = size === 'xlarge' ? 'w-64 h-auto' : sizeClasses[size] || sizeClasses.large

  return (
    <div className={`${containerSize} ${className}`}>
      {!imageError ? (
        <img
          src="/images/logo-gol.png"
          alt="Gol de Ouro"
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        // Fallback CSS Logo
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg p-2">
          <div className="text-center">
            <div className="w-8 h-8 bg-white rounded-full mx-auto mb-1 flex items-center justify-center">
              <span className="text-yellow-600 text-lg">⚽</span>
            </div>
            <div className={`font-bold text-blue-900 ${textSizes[size] || textSizes.large}`}>
              GOL DE OURO
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Logo
