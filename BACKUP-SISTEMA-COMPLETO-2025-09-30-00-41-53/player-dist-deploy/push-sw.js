// Service Worker para notificações push
const CACHE_NAME = 'goldeouro-push-v1'

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('Push Service Worker installing...')
  self.skipWaiting()
})

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('Push Service Worker activating...')
  event.waitUntil(self.clients.claim())
})

// Escutar mensagens push
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Gol de Ouro!',
    icon: '/images/Gol_de_Ouro_logo.png',
    badge: '/images/badge.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Detalhes',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/images/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Gol de Ouro', options)
  )
})

// Escutar cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/game')
    )
  } else if (event.action === 'close') {
    // Apenas fechar a notificação
  } else {
    // Clique na notificação (não em ações)
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

// Escutar mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
