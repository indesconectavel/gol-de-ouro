import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Obter data e hora atual no fuso horário de São Paulo
const now = new Date();
const saoPauloTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).formatToParts(now);

const buildDate = `${saoPauloTime.find(p => p.type === 'day').value}/${saoPauloTime.find(p => p.type === 'month').value}/${saoPauloTime.find(p => p.type === 'year').value}`;
const buildTime = `${saoPauloTime.find(p => p.type === 'hour').value}:${saoPauloTime.find(p => p.type === 'minute').value}`;

export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');
  
  // Tentar ler .env.local se existir
  let buildVersion = 'v1.2.0';
  let buildDateEnv = buildDate;
  let buildTimeEnv = buildTime;
  
  const envLocalPath = resolve(process.cwd(), '.env.local');
  if (existsSync(envLocalPath)) {
    try {
      const envLocal = readFileSync(envLocalPath, 'utf-8');
      const versionMatch = envLocal.match(/VITE_BUILD_VERSION=(.+)/);
      const dateMatch = envLocal.match(/VITE_BUILD_DATE=(.+)/);
      const timeMatch = envLocal.match(/VITE_BUILD_TIME=(.+)/);
      
      if (versionMatch) buildVersion = versionMatch[1].trim();
      if (dateMatch) buildDateEnv = dateMatch[1].trim();
      if (timeMatch) buildTimeEnv = timeMatch[1].trim();
    } catch (error) {
      console.warn('⚠️ Não foi possível ler .env.local, usando valores padrão');
    }
  }

  return {
    // ✅ ADICIONADO: Configuração explícita de build output
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    },
    define: {
      // Injetar variáveis de build no código
      'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(buildVersion),
      'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDateEnv),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTimeEnv),
    },
    plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png',
        'apple-touch-icon.png'
      ],
      manifest: {
        name: 'Gol de Ouro',
        short_name: 'GolDeOuro',
        description: 'Jogue, chute e vença no Gol de Ouro!',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#001a33',
        theme_color: '#ffd700',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        runtimeCaching: [
          // API backend (.fly.dev)
          {
            urlPattern: ({ url }) => url.origin.includes('.fly.dev'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // Imagens
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          },
        ]
      },
      devOptions: { enabled: false }
    })
    ],
  }
})
