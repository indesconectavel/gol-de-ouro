const CACHE_NAME = 'goldeouro-v1'
const STATIC_CACHE = 'goldeouro-static-v1'
const DYNAMIC_CACHE = 'goldeouro-dynamic-v1'

// Assets críticos para cache
const CRITICAL_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/images/Gol_de_Ouro_logo.png',
  '/images/Gol_de_Ouro_Bg01.jpg',
  '/images/Gol_de_Ouro_Bg02.jpg',
  '/sounds/background.mp3',
  '/sounds/button-click.mp3',
  '/sounds/celebration.mp3',
  '/sounds/crowd.mp3'
]

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching critical assets...')
        return cache.addAll(CRITICAL_ASSETS)
      })
      .then(() => {
        console.log('Service Worker installed successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error)
      })
  )
})

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated successfully')
        return self.clients.claim()
      })
  )
})

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Ignorar requisições não HTTP
  if (!request.url.startsWith('http')) {
    return
  }
  
  // Estratégia de cache para diferentes tipos de recursos
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (request.destination === 'audio') {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
  }
})

// Estratégia: Cache First
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Cache first strategy failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Estratégia: Network First
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', error)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    return new Response('Offline', { status: 503 })
  }
}

// Estratégia: Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // Se a rede falhar, retornar cache se disponível
    return cachedResponse
  })
  
  return cachedResponse || fetchPromise
}

// Limpeza de cache periódica
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCaches()
  }
})

async function cleanOldCaches() {
  const cacheNames = await caches.keys()
  const oldCaches = cacheNames.filter(name => 
    name !== STATIC_CACHE && name !== DYNAMIC_CACHE
  )
  
  await Promise.all(
    oldCaches.map(name => caches.delete(name))
  )
  
  console.log('Old caches cleaned')
}

// Background sync para dados offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Sincronizar dados offline quando a conexão voltar
    console.log('Performing background sync...')
    // Implementar lógica de sincronização aqui
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}
