// CONFIGURAÇÃO VITE CORRIGIDA - GOL DE OURO v1.2.0
// ================================================
// Data: 21/10/2025
// Status: CONFIGURAÇÃO OTIMIZADA PARA PRODUÇÃO REAL
// Versão: v1.2.0-final-production
// GPT-4o Auto-Fix: Vite config otimizada

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Configuração do servidor de desenvolvimento
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,
    cors: true,
    proxy: {
      // Proxy para API em desenvolvimento
      '/api': {
        target: 'https://goldeouro-backend.fly.dev',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  
  // Configuração de build otimizada
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Cache busting com hashes
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        // Otimização de chunks
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['react-toastify'],
          utils: ['axios']
        }
      }
    },
    // Otimizações de build
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  
  // Configuração de plugins
  plugins: [
    react({
      // Otimizações do React
      fastRefresh: true,
      babel: {
        plugins: [
          // Plugin para otimização de produção
          ...(process.env.NODE_ENV === 'production' ? [
            ['transform-remove-console', { exclude: ['error', 'warn'] }]
          ] : [])
        ]
      }
    }),
    
    // PWA otimizada
    VitePWA({
      registerType: 'autoUpdate',
      workboxMode: 'generateSW',
      
      // Assets incluídos
      includeAssets: [
        'favicon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png',
        'apple-touch-icon.png',
        'sounds/music.mp3',
        'sounds/torcida_2.mp3',
        'sounds/gol.mp3',
        'sounds/kick.mp3',
        'sounds/click.mp3',
        'sounds/golden-goal.mp3',
        'sounds/golden-victory.mp3'
      ],
      
      // Manifest otimizado
      manifest: {
        name: 'Gol de Ouro - Jogo de Apostas',
        short_name: 'GolDeOuro',
        description: 'Jogue, chute e vença no Gol de Ouro! Sistema de apostas esportivas.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#001a33',
        theme_color: '#ffd700',
        orientation: 'portrait',
        categories: ['games', 'sports', 'entertainment'],
        lang: 'pt-BR',
        
        icons: [
          { 
            src: 'icons/icon-192.png', 
            sizes: '192x192', 
            type: 'image/png',
            purpose: 'any'
          },
          { 
            src: 'icons/icon-512.png', 
            sizes: '512x512', 
            type: 'image/png',
            purpose: 'any'
          },
          { 
            src: 'icons/maskable-192.png', 
            sizes: '192x192', 
            type: 'image/png', 
            purpose: 'maskable' 
          },
          { 
            src: 'icons/maskable-512.png', 
            sizes: '512x512', 
            type: 'image/png', 
            purpose: 'maskable' 
          }
        ],
        
        // Funcionalidades PWA
        features: [
          'Cross Platform',
          'fast',
          'simple'
        ],
        
        // Screenshots para app stores
        screenshots: [
          {
            src: 'screenshots/game.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          }
        ]
      },
      
      // Workbox otimizado
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/health/],
        
        // Padrões de arquivos para cache
        globPatterns: [
          '**/*.{js,css,html,svg,png,webp,woff2,mp3}'
        ],
        
        // Estratégias de cache otimizadas
        runtimeCaching: [
          // API backend - Network First com fallback
          {
            urlPattern: ({ url }) => url.origin.includes('.fly.dev'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache-v1',
              networkTimeoutSeconds: 5,
              expiration: { 
                maxEntries: 100, 
                maxAgeSeconds: 60 * 60 // 1 hora
              },
              cacheableResponse: { 
                statuses: [0, 200] 
              }
            }
          },
          
          // Imagens - Stale While Revalidate
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache-v1',
              expiration: { 
                maxEntries: 200, 
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 dias
              }
            }
          },
          
          // Áudio - Cache First (não muda frequentemente)
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache-v1',
              expiration: { 
                maxEntries: 50, 
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 dias
              }
            }
          },
          
          // Fontes - Cache First
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache-v1',
              expiration: { 
                maxEntries: 20, 
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 ano
              }
            }
          },
          
          // CSS e JS - Stale While Revalidate
          {
            urlPattern: ({ request }) => 
              request.destination === 'style' || 
              request.destination === 'script',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-cache-v1',
              expiration: { 
                maxEntries: 100, 
                maxAgeSeconds: 24 * 60 * 60 // 1 dia
              }
            }
          }
        ],
        
        // Configurações de precache
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        
        // Skip waiting para atualizações
        skipWaiting: true,
        clientsClaim: true
      },
      
      // Opções de desenvolvimento
      devOptions: { 
        enabled: true,
        type: 'module'
      }
    })
  ],
  
  // Configurações de otimização
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-toastify',
      'axios'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Configurações de CSS
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  
  // Configurações de ambiente
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.2.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Configurações de resolução
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@config': '/src/config',
      '@utils': '/src/utils'
    }
  },
  
  // Configurações de preview (build preview)
  preview: {
    port: 4173,
    host: 'localhost',
    strictPort: true,
    cors: true
  }
})

// =====================================================
// CONFIGURAÇÃO VITE CORRIGIDA v1.2.0 - PRODUÇÃO REAL 100%
// =====================================================
