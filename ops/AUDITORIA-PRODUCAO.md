# 🔍 AUDITORIA REAL DE PRODUÇÃO - GOL DE OURO v1.1.1

**Data:** 2025-10-01  
**Versão:** v1.1.1 Complexo  
**Status:** Análise Completa

---

## 📊 **INFRAESTRUTURA ATUAL**

### **🌐 Domínios de Produção**
- **Player:** `https://www.goldeouro.lol` (Vercel)
- **Admin:** `https://admin.goldeouro.lol` (Vercel)  
- **Backend:** `https://goldeouro-backend-v2.fly.dev` (Fly.io)

### **🏗️ Hosting & Build**
- **Frontend Player:** Vercel (React + Vite + PWA)
- **Frontend Admin:** Vercel (React + Vite + TypeScript)
- **Backend:** Fly.io (Node.js + Express + Docker)
- **Banco:** Supabase PostgreSQL

---

## 🔒 **SEGURANÇA & HEADERS**

### **CSP (Content Security Policy)**
**Player (vercel.json):**
- ❌ **SEM CSP** - Apenas headers básicos
- ✅ Rewrite `/api/(.*)` → Backend
- ✅ Cache control para PWA assets

**Admin (vercel.json):**
- ✅ **CSP AGRESSIVA** configurada
- ✅ `Service-Worker-Allowed: false`
- ✅ `Cache-Control: no-cache` global
- ⚠️ **BLOQUEIA** `https://www.goldeouro.lol` (imagem fundo)

### **CORS (Backend)**
```javascript
origin: [
  'https://goldeouro.lol',
  'https://www.goldeouro.lol', 
  'https://admin.goldeouro.lol',
  'https://app.goldeouro.lol'
]
credentials: true
```

---

## 🔄 **SERVICE WORKERS & CACHE**

### **Service Workers Ativos**
- ✅ **Player:** `sw.js` (PWA completo)
- ✅ **Admin:** `sw.js` (mas desabilitado via header)
- ⚠️ **Problema:** SW do Player pode estar causando cache de CSP antigo

### **Cache Strategy**
- **Static:** Assets críticos (JS, CSS, imagens, sons)
- **Dynamic:** API calls com fallback
- **Background:** Atualização automática

---

## 💳 **PIX & PAGAMENTOS**

### **Provedor Atual**
- **Mercado Pago** (configurado mas não testado)
- **Token:** `MP_ACCESS_TOKEN` (env)
- **Webhook:** `/api/payments/pix/webhook`

### **Rotas PIX Identificadas**
```
POST /api/payments/pix/criar     - Criar PIX
GET  /api/payments/pix/status    - Status PIX  
POST /api/payments/pix/webhook   - Webhook MP
```

### **Status PIX**
- ⚠️ **SIMULAÇÃO** - Código tem fallback para mock
- ⚠️ **Webhook** - Não testado em produção
- ⚠️ **Credenciais** - Depende de env vars

---

## 🎮 **FLUXO DO JOGO REAL**

### **Rotas Identificadas**
```
POST /auth/login              - Login
POST /auth/register           - Cadastro  
GET  /api/user/me            - Perfil usuário
POST /api/payments/pix/criar - Depósito PIX
POST /api/games/shoot        - Jogar (chute)
GET  /api/withdraw/estimate  - Estimar saque
POST /api/withdraw/request   - Solicitar saque
POST /auth/logout            - Logout
```

### **Backend Principal**
- **Arquivo:** `server-fly.js`
- **Porta:** 8080 (Fly.io)
- **Autenticação:** JWT + bcrypt
- **Banco:** Supabase (fallback in-memory)

---

## 🚨 **BLOCKERS CRÍTICOS IDENTIFICADOS**

### **1. CSP Admin Bloqueando Imagem**
```
Refused to connect to 'https://www.goldeouro.lol/images/Gol_de_Ouro_Bg01.jpg'
```
**Causa:** CSP não inclui `https://www.goldeouro.lol` em `img-src`

### **2. Service Worker Cache**
- SW pode estar servindo versões antigas
- CSP antigo sendo cacheado
- Necessário `kill-sw.html`

### **3. PIX Não Testado**
- Mercado Pago configurado mas não validado
- Webhook não testado
- Credenciais podem estar inválidas

### **4. Banco Fallback**
- Supabase pode estar falhando
- Sistema usando dados in-memory
- Dados não persistem entre restarts

---

## 📱 **MOBILE/APK**

### **Stack Mobile**
- **Expo SDK:** ~49.0.0 (DESATUALIZADO)
- **React Native:** 0.72.6 (DESATUALIZADO)
- **Status:** Dependências quebradas, APK não gerado

### **PWA Status**
- ✅ **Player:** PWA completo (manifest, SW, offline)
- ✅ **Instalável** no Android via Chrome
- ❌ **APK nativo** não disponível

---

## 🎯 **PRÓXIMOS PASSOS CRÍTICOS**

1. **Criar `kill-sw.html`** para limpar cache
2. **Corrigir CSP** do Admin para permitir imagens
3. **Testar PIX real** com Mercado Pago
4. **Validar webhook** de pagamento
5. **Verificar credenciais** Supabase
6. **Gerar APK** ou focar em PWA

---

## 📋 **CONFIRMAÇÕES NECESSÁRIAS**

Antes de implementar SIMPLE_MVP, preciso confirmar:

1. **PLAYER_URL:** `https://www.goldeouro.lol` ✅
2. **ADMIN_URL:** `https://admin.goldeouro.lol` ✅  
3. **BACKEND_URL:** `https://goldeouro-backend-v2.fly.dev` ✅
4. **PIX_TOKEN:** `MP_ACCESS_TOKEN` (precisa validar) ❓
5. **SUPABASE_CREDS:** (precisa validar) ❓
6. **CSP_EXTRA:** Apenas vercel.json ✅
7. **MOBILE_STACK:** Expo (atualizar) ou PWA ❓

---

**Status:** ✅ **AUDITORIA COMPLETA**  
**Próximo:** Backup + Rollback v1.1.1 Complexo
