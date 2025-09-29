# PWA + APK - Gol de Ouro v1.1.2

## 📱 PWA (Progressive Web App)

### Funcionalidades
- **Manifest**: Configurado para Player e Admin
- **Service Worker**: AutoUpdate via Workbox
- **Cache Inteligente**: API e assets em cache
- **Offline**: Fallback para SPA
- **Atualizações**: Banner "Nova versão disponível"

### Como Buildar PWA

#### Player
```bash
cd goldeouro-player
npm i -D vite-plugin-pwa workbox-window
npm run build
vercel --prod
```

#### Admin
```bash
cd goldeouro-admin
npm i -D vite-plugin-pwa workbox-window
npm run build
vercel --prod
```

### Ícones PWA
Coloque os seguintes ícones em `public/icons/`:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- `maskable-192.png` (192x192px)
- `maskable-512.png` (512x512px)
- `apple-touch-icon.png` (180x180px)

### Gerar Ícones Automaticamente
```bash
npm i -D pwa-asset-generator
npx pwa-asset-generator .\public\logo.png .\public\icons -i
```

## 📱 APK (Android)

### Funcionalidades
- **WebView**: Aponta para https://goldeouro.lol
- **App ID**: com.goldeouro.app
- **Permissões**: Internet (padrão)
- **Splash**: Tela de carregamento nativa

### Como Gerar APK

#### 1. Preparar Ambiente
```bash
cd goldeouro-player
npm i @capacitor/core
npm i -D @capacitor/cli
npm i @capacitor/android
```

#### 2. Inicializar Capacitor
```bash
npx cap init "Gol de Ouro" "com.goldeouro.app" --web-dir=dist
npx cap add android
```

#### 3. Build e Deploy
```bash
npm run build
npx cap copy
npx cap open android
```

#### 4. Gerar APK no Android Studio
1. Abrir projeto no Android Studio
2. Build > Build Bundle(s)/APK(s) > Build APK(s)
3. APK será gerado em `android/app/build/outputs/apk/`

### Script Automatizado
```bash
# Executar script completo
powershell -ExecutionPolicy Bypass -File scripts/build-pwa-apk.ps1
```

## 🔧 Configurações

### Capacitor Config
```typescript
// capacitor.config.ts
{
  appId: 'com.goldeouro.app',
  appName: 'Gol de Ouro',
  webDir: 'dist',
  server: {
    url: 'https://goldeouro.lol',
    cleartext: false
  }
}
```

### PWA Manifest
```json
{
  "name": "Gol de Ouro",
  "short_name": "GolDeOuro",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#ffd700",
  "background_color": "#001a33"
}
```

## 🚀 Deploy

### PWA
- **Player**: https://goldeouro.lol
- **Admin**: https://admin.goldeouro.lol
- **Instalação**: "Adicionar à tela inicial"

### APK
- **Download**: Via link direto ou Play Store
- **Instalação**: Permitir fontes desconhecidas
- **Atualização**: Automática via WebView

## 🔍 Testes

### PWA
- [ ] Manifest válido
- [ ] Service Worker ativo
- [ ] Cache funcionando
- [ ] Offline básico
- [ ] Banner de atualização

### APK
- [ ] App abre sem crash
- [ ] Carrega https://goldeouro.lol
- [ ] PIX funciona
- [ ] Jogo funciona
- [ ] Navegação OK

## 📋 Limitações

### PWA
- **Offline**: Apenas SPA + assets cacheados
- **API**: Requer conexão para dados dinâmicos
- **PIX**: Requer conexão para pagamentos

### APK
- **WebView**: Depende da versão em produção
- **Atualizações**: Via deploy do site, não do app
- **Performance**: Limitada pela WebView

## 🛠️ Troubleshooting

### PWA não instala
- Verificar se HTTPS está ativo
- Verificar se manifest está válido
- Verificar se Service Worker está registrado

### APK não abre
- Verificar se URL está acessível
- Verificar permissões de internet
- Verificar se WebView está atualizada

### Cache não funciona
- Verificar configuração do Workbox
- Verificar se assets estão sendo servidos
- Limpar cache do navegador
