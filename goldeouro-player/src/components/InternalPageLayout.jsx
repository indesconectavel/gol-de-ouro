// BLOCO F — Navegação interna (sem TopBar)
// Header: ← MENU PRINCIPAL | Logo + título | (opcional) SAIR
// Footer: ⚽ JOGAR AGORA

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { track } from '../utils/analytics';

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
          className="text-white/90 hover:text-white text-sm font-medium flex items-center gap-1 rounded-md transition-colors duration-150 ease-out active:opacity-90 active:scale-[0.99] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/45"
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
            className="text-red-400 hover:text-red-300 text-sm font-medium rounded-md transition-colors duration-150 ease-out active:opacity-90 active:scale-[0.99] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400/55"
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
      <footer className="border-t border-white/10 bg-slate-900/95 backdrop-blur pt-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] overflow-visible">
        <div className="flex justify-center overflow-visible py-0.5">
          <button
            type="button"
            onClick={() => {
              track('game_play_click', {});
              navigate('/game');
            }}
            className="relative bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all duration-150 ease-out ring-2 ring-amber-200/90 shadow-[0_0_22px_rgba(251,191,36,0.42),0_0_0_1px_rgba(254,243,199,0.35)] hover:from-amber-300 hover:via-yellow-400 hover:to-amber-300 hover:shadow-[0_0_28px_rgba(251,191,36,0.5)] active:translate-y-0.5 active:shadow-[0_0_16px_rgba(251,191,36,0.38)] active:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            ⚽ JOGAR AGORA
          </button>
        </div>
      </footer>
    </div>
  );
}
