// TopBar — navegação simples no topo (fora da /game)
// BLOCO F: substitui sidebar em Dashboard, Profile, Withdraw, Pagamentos, GameShoot

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from './Logo'

const TopBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { path: '/dashboard', label: 'Início' },
    { path: '/game', label: 'Jogar' },
    { path: '/pagamentos', label: 'Depositar' },
    { path: '/withdraw', label: 'Sacar' },
    { path: '/profile', label: 'Perfil' }
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white hover:opacity-90"
        >
          <Logo size="small" className="w-8 h-8" />
          <span className="font-bold text-yellow-400">Gol de Ouro</span>
        </button>

        {/* Desktop: links horizontais */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ path, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive(path) ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile: menu hamburger */}
        <div className="md:hidden relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-white hover:bg-white/10 rounded-lg"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-full mt-1 py-2 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50">
                {links.map(({ path, label }) => (
                  <button
                    key={path}
                    onClick={() => { navigate(path); setMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm ${isActive(path) ? 'bg-yellow-500/20 text-yellow-400' : 'text-white hover:bg-white/10'}`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                >
                  Sair
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop: Sair */}
        <button
          onClick={handleLogout}
          className="hidden md:block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          Sair
        </button>
      </div>
    </header>
  )
}

export default TopBar
