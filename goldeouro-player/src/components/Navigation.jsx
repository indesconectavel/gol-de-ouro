import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useSidebar } from '../contexts/SidebarContext'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isCollapsed, toggleSidebar } = useSidebar()

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
      {/* Botão mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white bg-yellow-500 p-2 rounded shadow"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Botão toggle para desktop */}
      <button
        onClick={toggleSidebar}
        className="hidden md:block fixed top-4 left-4 z-50 text-white bg-yellow-500 p-2 rounded shadow hover:bg-yellow-600 transition-colors"
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-[#111827] shadow-lg z-40 transform transition-all duration-300 ease-in-out
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 
          ${isCollapsed ? 'w-16' : 'w-72'}`}
      >
        <div className={`mb-8 text-center p-6 ${isCollapsed ? 'px-2' : ''}`}>
          {!isCollapsed && (
            <>
              <img 
                src="/images/Gol_de_Ouro_logo.png" 
                alt="Gol de Ouro" 
                className="mx-auto mb-2" 
                style={{ width: '200px', height: 'auto' }} 
              />
              <h1 className="text-xl font-bold text-yellow-400">Gol de Ouro</h1>
              <p className="text-white/70 text-sm">Jogador</p>
            </>
          )}
        </div>

        <nav className={`flex flex-col gap-2 text-sm text-white ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                setIsMenuOpen(false)
              }}
              className={`${linkClasses(item.path)} ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && item.label}
            </button>
          ))}
        </nav>

        {/* Informações do Usuário */}
        <div className={`mt-auto pt-6 border-t border-gray-700 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-lg">J</span>
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-white font-medium">Jogador</p>
                <p className="text-white/70 text-sm">R$ 150,00</p>
              </div>
            )}
          </div>
          
          {/* Botão de Logout */}
          <button
            onClick={() => {
              // Implementar logout
              alert('Funcionalidade de logout será implementada em breve!')
            }}
            className={`flex items-center gap-3 w-full py-3 text-white hover:bg-red-600 rounded-lg transition-colors font-medium ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
            title={isCollapsed ? 'Sair' : ''}
          >
            <span className="text-xl">🚪</span>
            {!isCollapsed && 'Sair'}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Navigation
