# 📋 ESTRUTURA COMPLETA LOCAL vs PRODUÇÃO - GOL DE OURO

**Data:** 16 de Outubro de 2025  
**Status:** ✅ **ESTRUTURA CORRIGIDA E DOCUMENTADA**  
**Objetivo:** Separar completamente desenvolvimento local de produção

---

## 🏗️ **ARQUITETURA GERAL**

### **DESENVOLVIMENTO LOCAL:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Supabase     │
│   Player        │───▶│   Localhost     │───▶│   Desenvolvimento│
│   localhost:5173│    │   localhost:8080│    │   goldeouro-db  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **PRODUÇÃO:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Supabase     │
│   goldeouro.lol │───▶│   Fly.io        │───▶│   Produção      │
│   admin.goldeouro│    │   goldeouro-    │    │   goldeouro-    │
│                 │    │   backend.fly.dev│    │   production    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔧 **CONFIGURAÇÕES POR AMBIENTE**

### **1. DESENVOLVIMENTO LOCAL**

#### **Backend (`server-fly.js`):**
- **Porta:** 8080
- **Banco:** Supabase `goldeouro-db` (desenvolvimento)
- **PIX:** Mercado Pago Sandbox
- **URL:** `http://localhost:8080`

#### **Frontend Player:**
- **Porta:** 5173
- **API:** `http://localhost:8080`
- **PWA:** Habilitado para desenvolvimento
- **URL:** `http://localhost:5173`

#### **Frontend Admin:**
- **Porta:** 5174
- **API:** `http://localhost:8080`
- **URL:** `http://localhost:5174`

#### **Variáveis de Ambiente (`.env`):**
```env
NODE_ENV=development
PORT=8080
SUPABASE_URL=https://uatszaqzdqcwnfbipoxg.supabase.co
SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
MERCADOPAGO_ACCESS_TOKEN=TEST-your-sandbox-token
MERCADOPAGO_PUBLIC_KEY=TEST-your-sandbox-key
JWT_SECRET=goldeouro-dev-secret-key-2025
BACKEND_URL=http://localhost:8080
PLAYER_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
LOG_LEVEL=debug
USE_MOCKS=true
USE_SANDBOX=true
```

### **2. PRODUÇÃO**

#### **Backend (Fly.io):**
- **URL:** `https://goldeouro-backend.fly.dev`
- **Banco:** Supabase `goldeouro-production`
- **PIX:** Mercado Pago Produção
- **Região:** São Paulo (gru)

#### **Frontend Player (Vercel):**
- **URL:** `https://goldeouro.lol`
- **API:** `https://goldeouro-backend.fly.dev`
- **PWA:** Habilitado para produção

#### **Frontend Admin (Vercel):**
- **URL:** `https://admin.goldeouro.lol`
- **API:** Proxy via Vercel (`/api`)

#### **Variáveis de Ambiente (Fly.io Secrets):**
```env
NODE_ENV=production
PORT=8080
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-prod-token
MERCADOPAGO_PUBLIC_KEY=your-prod-public-key
JWT_SECRET=goldeouro-prod-secret-key-2025
BACKEND_URL=https://goldeouro-backend.fly.dev
PLAYER_URL=https://goldeouro.lol
ADMIN_URL=https://admin.goldeouro.lol
LOG_LEVEL=error
USE_MOCKS=false
USE_SANDBOX=false
```

---

## 🚀 **COMANDOS DE DESENVOLVIMENTO**

### **Iniciar Desenvolvimento Local:**

#### **1. Backend:**
```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp env.development .env

# Iniciar servidor
npm start
# ou
node server-fly.js
```

#### **2. Frontend Player:**
```bash
cd goldeouro-player
npm install
npm run dev
# Acesse: http://localhost:5173
```

#### **3. Frontend Admin:**
```bash
cd goldeouro-admin
npm install
npm run dev
# Acesse: http://localhost:5174
```

### **Verificar Status:**
```bash
# Backend
curl http://localhost:8080/health

# Frontend Player
curl http://localhost:5173

# Frontend Admin
curl http://localhost:5174
```

---

## 🔍 **DETECÇÃO AUTOMÁTICA DE AMBIENTE**

### **Frontend Player (`environments.js`):**
```javascript
const getCurrentEnvironment = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return environments.development; // localhost:8080
  } else if (hostname.includes('staging')) {
    return environments.staging; // staging backend
  } else {
    return environments.production; // produção
  }
};
```

### **Frontend Admin (`env.js`):**
```javascript
export const getApiUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080'; // desenvolvimento
  } else if (hostname.includes('staging')) {
    return 'https://goldeouro-backend.fly.dev'; // staging
  } else {
    return '/api'; // produção (proxy Vercel)
  }
};
```

---

## 📊 **PROJETOS SUPABASE**

### **1. goldeouro-db (Desenvolvimento):**
- **URL:** `https://uatszaqzdqcwnfbipoxg.supabase.co`
- **Uso:** Desenvolvimento local e testes
- **Dados:** Dados de teste e desenvolvimento
- **Status:** Ativo para desenvolvimento

### **2. goldeouro-production (Produção):**
- **URL:** `https://gayopagjdrkcmkirmfvy.supabase.co`
- **Uso:** Produção real
- **Dados:** Dados reais dos usuários
- **Status:** Ativo para produção

---

## 🔒 **SEGURANÇA POR AMBIENTE**

### **Desenvolvimento:**
- ✅ Mocks habilitados
- ✅ Sandbox Mercado Pago
- ✅ Logs detalhados
- ✅ CORS permissivo
- ✅ RLS relaxado

### **Produção:**
- ❌ Mocks desabilitados
- ✅ Mercado Pago real
- ✅ Logs mínimos
- ✅ CORS restritivo
- ✅ RLS rigoroso

---

## 🧪 **TESTES POR AMBIENTE**

### **Desenvolvimento:**
```bash
# Testes unitários
npm test

# Testes E2E locais
npm run test:e2e

# Validação local
npm run validate
```

### **Produção:**
```bash
# Testes de produção
npm run test:production

# Validação de produção
npm run validate:production

# Deploy seguro
npm run deploy:safe
```

---

## 📈 **MONITORAMENTO**

### **Desenvolvimento:**
- Logs detalhados no console
- Hot reload ativo
- Debug tools habilitados
- Erros visíveis

### **Produção:**
- Logs estruturados
- Monitoramento Fly.io
- Alertas automáticos
- Métricas de performance

---

## 🚨 **TROUBLESHOOTING**

### **Problema: Frontend não conecta ao backend local**
**Solução:**
1. Verificar se backend está rodando na porta 8080
2. Verificar arquivo `.env` existe
3. Verificar configuração em `environments.js`

### **Problema: Erro "Ops! Algo deu errado"**
**Solução:**
1. Verificar console do navegador
2. Verificar se backend está respondendo
3. Verificar configuração de ambiente

### **Problema: Supabase em modo FALLBACK**
**Solução:**
1. Verificar credenciais no arquivo `.env`
2. Verificar se projeto Supabase está ativo
3. Verificar conectividade de rede

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

### **Desenvolvimento Local:**
- [ ] Backend rodando em localhost:8080
- [ ] Frontend Player rodando em localhost:5173
- [ ] Frontend Admin rodando em localhost:5174
- [ ] Supabase conectado (goldeouro-db)
- [ ] Mercado Pago em modo sandbox
- [ ] Logs de debug visíveis
- [ ] Hot reload funcionando

### **Produção:**
- [ ] Backend rodando em Fly.io
- [ ] Frontend Player rodando em Vercel
- [ ] Frontend Admin rodando em Vercel
- [ ] Supabase conectado (goldeouro-production)
- [ ] Mercado Pago em modo produção
- [ ] Monitoramento ativo
- [ ] SSL/HTTPS funcionando

---

**ESTRUTURA COMPLETAMENTE SEPARADA E DOCUMENTADA!** ✅📋


