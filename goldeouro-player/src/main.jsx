// 🚨 PRIMEIRA LINHA EXECUTADA NO APP - BLINDAGEM DEFINITIVA DO BACKEND
// ✅ CORREÇÃO CRÍTICA: Executar ANTES de qualquer import funcional
import { forceProductionBackend } from './bootstrap';

// ✅ CORREÇÃO CRÍTICA: Forçar backend correto IMEDIATAMENTE
forceProductionBackend();

// ❗ SOMENTE DEPOIS DISSO: Importar React e outros módulos
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ✅ CORREÇÃO CRÍTICA: Desregistrar Service Workers antigos antes de iniciar app
// Executa imediatamente, sem await, para não bloquear renderização
if ('serviceWorker' in navigator) {
  // Verificar se há Service Worker antigo (hash antigo no cache)
  const checkAndClean = async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // ✅ CORREÇÃO CRÍTICA: Desregistrar TODOS os Service Workers
      for (const registration of registrations) {
        console.log('[MAIN] Desregistrando Service Worker:', registration.scope);
        const success = await registration.unregister();
        if (success) {
          console.log('[MAIN] ✅ Service Worker desregistrado:', registration.scope);
        }
      }
      
      // ✅ CORREÇÃO CRÍTICA: Limpar TODOS os caches
      if (caches && caches.keys) {
        const cacheNames = await caches.keys();
        console.log('[MAIN] Encontrados', cacheNames.length, 'caches para limpar');
        
        for (const cacheName of cacheNames) {
          const deleted = await caches.delete(cacheName);
          if (deleted) {
            console.log('[MAIN] ✅ Cache deletado:', cacheName);
          }
        }
      }
      
      // ✅ CORREÇÃO CRÍTICA: Limpar flags de SW antigas
      try {
        sessionStorage.removeItem('sw-registered');
        sessionStorage.removeItem('sw-version');
        sessionStorage.removeItem('env_isInitialized');
        sessionStorage.removeItem('env_hasLoggedOnce');
        sessionStorage.removeItem('backend_forced');
        console.log('[MAIN] ✅ Flags de SW limpas');
      } catch (e) {
        console.warn('[MAIN] ⚠️ Erro ao limpar flags:', e);
      }
      
      console.log('[MAIN] ✅ Limpeza completa de Service Workers concluída');
    } catch (error) {
      console.error('[MAIN] ❌ Erro ao limpar Service Workers:', error);
    }
  };
  
  // Executar imediatamente, sem bloquear
  checkAndClean();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
