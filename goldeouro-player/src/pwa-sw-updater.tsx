import { useEffect, useState } from 'react'
import { Workbox } from 'workbox-window'

export default function PwaSwUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // ✅ CORREÇÃO CRÍTICA: Limpar Service Workers antigos primeiro
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          // Verificar se é um Service Worker antigo (não do Workbox atual)
          if (registration.active?.scriptURL && !registration.active.scriptURL.includes('sw.js')) {
            console.log('[SW-UPDATER] Desregistrando SW antigo:', registration.active.scriptURL);
            registration.unregister();
          }
        });
      });

      const wb = new Workbox('/sw.js', { 
        scope: '/',
        // ✅ CORREÇÃO CRÍTICA: Forçar atualização imediata
        updateViaCache: 'none'
      })

      // ✅ CORREÇÃO CRÍTICA: Detectar quando há nova versão disponível
      wb.addEventListener('waiting', () => {
        console.log('[SW-UPDATER] Nova versão detectada - mostrando botão de atualização');
        setWaitingWorker(wb?.waiting || null)
        setIsUpdateAvailable(true)
        // ✅ RESTAURADO: Não forçar atualização automática - deixar usuário escolher
      })

      // ✅ CORREÇÃO CRÍTICA: Detectar quando Service Worker está ativo
      wb.addEventListener('controlling', () => {
        console.log('[SW-UPDATER] Service Worker assumiu controle - recarregando');
        // ✅ RESTAURADO: Só recarregar quando Service Worker assumir controle (após usuário clicar)
        window.location.reload();
      })

      // ✅ CORREÇÃO CRÍTICA: Detectar quando há atualização disponível
      wb.addEventListener('externalwaiting', () => {
        console.log('[SW-UPDATER] Atualização externa detectada - mostrando botão');
        setIsUpdateAvailable(true);
        setWaitingWorker(wb?.waiting || null);
        // ✅ RESTAURADO: Não forçar atualização automática - deixar usuário escolher
      })

      // ✅ CORREÇÃO CRÍTICA: Registrar e verificar atualizações imediatamente
      wb.register().then((registration) => {
        console.log('[SW-UPDATER] Service Worker registrado');
        
        // Verificar atualizações imediatamente e periodicamente
        setInterval(() => {
          registration.update();
        }, 60000); // A cada 1 minuto
        
        // Verificar atualização imediatamente
        registration.update();
      }).catch((error) => {
        console.error('[SW-UPDATER] Erro ao registrar Service Worker:', error);
      });
    }
  }, [])

  const reload = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    // ✅ CORREÇÃO CRÍTICA: Limpar caches antes de recarregar
    if (caches && caches.keys) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      }).then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }

  if (!isUpdateAvailable) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-black/90 backdrop-blur-sm border border-yellow-500/50 text-white px-6 py-4 shadow-2xl max-w-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-yellow-400 text-xl">🔄</span>
          <div>
            <p className="font-semibold text-sm">Nova versão disponível!</p>
            <p className="text-xs text-gray-300 mt-1">Clique em "Atualizar" para aplicar as mudanças.</p>
          </div>
        </div>
        <button 
          onClick={reload} 
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ml-4"
        >
          Atualizar Agora
        </button>
      </div>
    </div>
  )
}
