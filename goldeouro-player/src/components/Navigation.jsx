import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSidebar } from '../contexts/SidebarContext'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isCollapsed, toggleSidebar } = useSidebar()

  // Ícones SVG profissionais similares ao painel de controle
  const Icons = {
    Dashboard: () => (
      <svg className={`${isCollapsed ? 'w-7 h-7' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    Game: () => (
      <svg className={`${isCollapsed ? 'w-7 h-7' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Profile: () => (
      <svg className={`${isCollapsed ? 'w-7 h-7' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    Withdraw: () => (
      <svg className={`${isCollapsed ? 'w-7 h-7' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    Logout: () => (
      <svg className={`${isCollapsed ? 'w-7 h-7' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    Menu: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )
  }

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { path: '/game', label: 'Jogar', icon: Icons.Game },
    { path: '/profile', label: 'Perfil', icon: Icons.Profile },
    { path: '/withdraw', label: 'Saque', icon: Icons.Withdraw }
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
          className="text-white p-2 transition-colors mb-5 hover:bg-white/10 rounded"
        >
          <Icons.Menu />
        </button>
      </div>

      {/* Botão toggle para desktop */}
      <button
        onClick={toggleSidebar}
        className="hidden md:block fixed top-4 left-4 z-50 text-white p-2 transition-colors mb-5 hover:bg-white/10 rounded"
      >
        <Icons.Menu />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-[#111827] shadow-lg z-40 transform transition-all duration-300 ease-in-out
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 
          ${isCollapsed ? 'w-16' : 'w-72'}`}
      >
        {/* Header simplificado sem logo */}
        <div className={`mb-6 text-center p-4 ${isCollapsed ? 'px-2' : ''}`}>
          {!isCollapsed && (
            <div className="text-center">
              <h1 className="text-xl font-bold text-yellow-400">Gol de Ouro</h1>
              <p className="text-white/70 text-sm">Jogador</p>
            </div>
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
              <item.icon />
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
            <Icons.Logout />
            {!isCollapsed && 'Sair'}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Navigation
