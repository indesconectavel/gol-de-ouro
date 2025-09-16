import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/game', label: 'Jogar', icon: '⚽' },
    { path: '/profile', label: 'Perfil', icon: '👤' },
    { path: '/withdraw', label: 'Saque', icon: '💸' }
  ]

  const isActive = (path) => location.pathname === path

  const linkClasses = (path) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
      isActive(path)
        ? 'bg-yellow-500 text-white'
        : 'text-white hover:bg-yellow-600'
    }`


  return (
    <>
      {/* Sidebar - sempre visível */}
      <aside
        className="fixed top-0 left-0 h-screen bg-[#111827] shadow-lg z-40 w-16"
      >
        {/* Cabeçalho removido */}

        <nav className="flex flex-col gap-2 text-sm text-white px-2 pt-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`${linkClasses(item.path)} justify-center`}
              title={item.label}
            >
              <span className="text-xl">{item.icon}</span>
            </button>
          ))}
        </nav>

        {/* Informações do Usuário - simplificado */}
        <div className="mt-auto pt-6 border-t border-gray-700 px-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-lg">J</span>
            </div>
          </div>
          
              {/* Botão de Logout */}
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="flex items-center justify-center w-full py-3 text-white hover:bg-red-600 rounded-lg transition-colors font-medium px-2"
                title="Sair"
              >
                <span className="text-xl">🚪</span>
              </button>
        </div>
      </aside>
    </>
  )
}

export default Navigation
