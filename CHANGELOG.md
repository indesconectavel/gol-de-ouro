# Changelog - Gol de Ouro

## v1.1.2 — PWA + APK + Fix shoot (2025-09-27)

### 🎯 Correções Críticas
- **Fix:** /api/games/shoot: 404 → 200 (contratos + testes)
- **Fix:** Trava de regressão implementada
- **Fix:** Testes de contrato para rota do jogo

### 📱 PWA (Progressive Web App)
- **PWA:** Player/Admin (manifest + SW + autoUpdate)
- **PWA:** Cache inteligente para API e assets
- **PWA:** Offline fallback para SPA
- **PWA:** Banner "Nova versão disponível"

### 📱 APK (Android)
- **APK:** Capacitor apontando para https://goldeouro.lol
- **APK:** App ID: com.goldeouro.app
- **APK:** Splash screen e ícones nativos

### 🔧 Melhorias
- **CI:** GitHub Actions para testes de contrato
- **Version:** Endpoint /version consistente
- **Testing:** Scripts de contrato para /api/games/shoot
- **Release:** Script formalizado para v1.1.2

### 🔒 Segurança
- **Backend:** CORS completo com métodos e headers específicos
- **Backend:** Rate-limit específico para webhook MP
- **Backend:** Endpoint /version para monitoramento

### 📊 Validação
- **GO/NO-GO:** Validação estrita sem falso-positivo
- **Evidence:** Pack de evidências para auditoria
- **Contract:** Testes automatizados de contrato

---

## v1.1.2 (PWA + APK) - 2025-01-24

### 📱 PWA (Progressive Web App)
- **PWA:** Manifest configurado para Player e Admin
- **PWA:** Service Worker com autoUpdate via Workbox
- **PWA:** Cache inteligente para API e assets
- **PWA:** Offline fallback para SPA
- **PWA:** Banner "Nova versão disponível"
- **PWA:** Ícones maskable para Android

### 📱 APK (Android)
- **APK:** Capacitor configurado para Android
- **APK:** WebView apontando para https://goldeouro.lol
- **APK:** App ID: com.goldeouro.app
- **APK:** Permissões de internet configuradas
- **APK:** Splash screen e ícones nativos

### 🔧 Melhorias
- **Build:** Scripts PowerShell para PWA + APK
- **Docs:** README-PWA-APK.md criado
- **Icons:** Sistema de ícones PWA padronizado

### 🔒 Segurança
- **Backend:** CORS completo com métodos e headers específicos
- **Backend:** Rate-limit específico para webhook MP (30 req/min)
- **Backend:** Endpoint /version para monitoramento
- **DB:** mp_events endurecido (apenas service_role)

---

## v1.1.1 (produção) - 2025-01-24

### 🐛 Correções
- **Fix:** SPA fallback no Admin (Vercel) para rotas diretas (/login) sem 404
- **Fix:** Logout client-side via react-router (sem full reload)
- **Fix:** Configuração CORS estrita para Player/Admin

### 🚀 Infraestrutura
- **Infra:** Backend migrado para Fly.io com healthcheck /health
- **Infra:** Dockerfile otimizado para produção
- **Infra:** fly.toml configurado para região GRU
- **Infra:** Dependências pg e mercadopago adicionadas

### 💳 Pagamentos
- **Pagamentos:** Mercado Pago Prod validado
- **Pagamentos:** PIX com validação R$1 a R$500
- **Pagamentos:** Webhook configurado para produção

### 🔧 Melhorias
- **Admin:** Componente Logout.tsx para navegação client-side
- **Admin:** vercel.json com SPA fallback correto
- **Backend:** server-fly.js otimizado para Fly.io
- **Backend:** Conexão Supabase com pooler SSL

### 📊 Monitoramento
- **Health:** Endpoint /health para Fly.io
- **Health:** Endpoint /readiness com verificação de banco
- **Logs:** Logs estruturados para produção

---

## v1.1.0 (desenvolvimento) - 2025-01-23

### ✨ Funcionalidades
- Sistema de apostas dinâmicas (R$1, R$2, R$5, R$10)
- Lógica de gol/defesa (10% chance)
- Gol de Ouro (1 em 1000 chutes, R$100)
- Sistema de autenticação JWT
- Admin Panel completo
- Responsividade mobile/tablet/desktop

### 🎨 Interface
- Design system harmonizado
- Animações de gol e defesa
- Overlays de vitória
- Header com estatísticas em tempo real

### 🔒 Segurança
- CORS configurado
- Headers de segurança
- Validação de tokens
- Rate limiting
