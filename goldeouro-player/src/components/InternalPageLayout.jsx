// BLOCO F — Navegação interna (sem TopBar)
// Header: ← MENU PRINCIPAL | Logo + título | (opcional) SAIR
// Footer: ⚽ JOGAR AGORA

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

export default function InternalPageLayout({ title, children, showLogout = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-white/90 hover:text-white text-sm font-medium flex items-center gap-1"
        >
          ← MENU PRINCIPAL
        </button>
        <div className="flex items-center gap-2">
          <Logo size="small" className="w-8 h-8" />
          <h1 className="text-lg font-bold text-white truncate max-w-[140px] md:max-w-none">{title}</h1>
        </div>
        {showLogout ? (
          <button
            type="button"
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 text-sm font-medium"
          >
            SAIR DA CONTA
          </button>
        ) : (
          <div className="w-24 md:w-28" aria-hidden />
        )}
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-900/95 backdrop-blur py-4 px-4">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/game')}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-lg"
          >
            ⚽ JOGAR AGORA
          </button>
        </div>
      </footer>
    </div>
  );
}
