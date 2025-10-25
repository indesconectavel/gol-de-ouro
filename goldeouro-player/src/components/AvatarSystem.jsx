// components/AvatarSystem.jsx
import React, { useState, useRef } from 'react'
import apiClient from '../services/apiClient'

const AvatarSystem = ({ user, onAvatarUpdate }) => {
  const [avatar, setAvatar] = useState(user.avatar || '👤')
  const [isUploading, setIsUploading] = useState(false)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const fileInputRef = useRef(null)

  // Avatares padrão disponíveis
  const defaultAvatars = [
    '👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓',
    '👨‍🚀', '👩‍🚀', '👨‍⚕️', '👩‍⚕️', '👨‍🍳', '👩‍🍳', '👨‍🎨', '👩‍🎨',
    '🧑‍💻', '🧑‍🎨', '🧑‍🍳', '🧑‍⚕️', '🧑‍🎓', '🧑‍💼', '🧑‍🚀', '🧑‍🔬'
  ]

  // Avatares temáticos do futebol
  const footballAvatars = [
    '⚽', '🥅', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️',
    '👑', '💎', '⭐', '🌟', '✨', '🔥', '💪', '🎯'
  ]

  // Avatares de animais
  const animalAvatars = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'
  ]

  // Upload de imagem personalizada
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.')
      return
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await apiClient.post('/api/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const newAvatarUrl = response.data.data.avatarUrl
        setAvatar(newAvatarUrl)
        onAvatarUpdate?.(newAvatarUrl)
        alert('Avatar atualizado com sucesso!')
      } else {
        alert('Erro ao atualizar avatar. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error)
      alert('Erro ao fazer upload do avatar. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  // Selecionar avatar padrão
  const selectDefaultAvatar = async (avatarEmoji) => {
    try {
      const response = await apiClient.put('/api/user/avatar', {
        avatar: avatarEmoji
      })

      if (response.data.success) {
        setAvatar(avatarEmoji)
        onAvatarUpdate?.(avatarEmoji)
        setShowAvatarMenu(false)
        alert('Avatar atualizado com sucesso!')
      } else {
        alert('Erro ao atualizar avatar. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error)
      alert('Erro ao atualizar avatar. Tente novamente.')
    }
  }

  // Componente de avatar
  const AvatarDisplay = ({ size = 'large', clickable = false }) => {
    const sizeClasses = {
      small: 'w-12 h-12 text-xl',
      medium: 'w-16 h-16 text-2xl',
      large: 'w-20 h-20 text-3xl',
      xlarge: 'w-24 h-24 text-4xl'
    }

    return (
      <div 
        className={`${sizeClasses[size]} bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-slate-900 shadow-lg ${
          clickable ? 'cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105' : ''
        }`}
        onClick={clickable ? () => setShowAvatarMenu(true) : undefined}
      >
        {avatar.startsWith('http') ? (
          <img 
            src={avatar} 
            alt="Avatar" 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-3xl">{avatar}</span>
        )}
        {clickable && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✏️</span>
          </div>
        )}
      </div>
    )
  }

  // Menu de seleção de avatar
  const AvatarMenu = () => {
    if (!showAvatarMenu) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Escolher Avatar</h3>
            <button
              onClick={() => setShowAvatarMenu(false)}
              className="text-white/70 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Upload de imagem */}
          <div className="mb-6">
            <h4 className="text-white/80 font-medium mb-3">Imagem Personalizada</h4>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {isUploading ? 'Enviando...' : 'Escolher Imagem'}
              </button>
              <span className="text-white/60 text-sm">
                JPG, PNG ou GIF (máx. 2MB)
              </span>
            </div>
          </div>

          {/* Avatares padrão */}
          <div className="mb-6">
            <h4 className="text-white/80 font-medium mb-3">Pessoas</h4>
            <div className="grid grid-cols-8 gap-2">
              {defaultAvatars.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => selectDefaultAvatar(emoji)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Avatares de futebol */}
          <div className="mb-6">
            <h4 className="text-white/80 font-medium mb-3">Futebol</h4>
            <div className="grid grid-cols-8 gap-2">
              {footballAvatars.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => selectDefaultAvatar(emoji)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Avatares de animais */}
          <div className="mb-6">
            <h4 className="text-white/80 font-medium mb-3">Animais</h4>
            <div className="grid grid-cols-8 gap-2">
              {animalAvatars.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => selectDefaultAvatar(emoji)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Preview do avatar atual */}
          <div className="border-t border-white/20 pt-4">
            <h4 className="text-white/80 font-medium mb-3">Avatar Atual</h4>
            <div className="flex items-center space-x-4">
              <AvatarDisplay size="large" />
              <div>
                <p className="text-white/70 text-sm">
                  {avatar.startsWith('http') ? 'Imagem personalizada' : 'Emoji padrão'}
                </p>
                <p className="text-white/50 text-xs">
                  Clique em qualquer avatar acima para alterar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <AvatarDisplay size="large" clickable={true} />
      <AvatarMenu />
    </div>
  )
}

export default AvatarSystem
