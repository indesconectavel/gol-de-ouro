# 🚀 INSTRUÇÕES PARA DEPLOY DOS FRONTENDS - 05/09/2025

**Data:** 05/09/2025  
**Status:** ⏳ AGUARDANDO DEPLOY MANUAL  
**Prioridade:** URGENTE  

## 📋 STATUS ATUAL

### ✅ **CONCLUÍDO:**
- ✅ Backend deployado no Render
- ✅ Webhook Mercado Pago configurado
- ✅ URLs de produção atualizadas
- ✅ Variáveis de ambiente configuradas
- ✅ CORS configurado para domínios de produção

### ⏳ **PENDENTE:**
- ⏳ Deploy do Frontend Player no Vercel
- ⏳ Deploy do Frontend Admin no Vercel

## 🚀 DEPLOY DO FRONTEND PLAYER

### 1. Navegar para o diretório
```bash
cd goldeouro-player
```

### 2. Verificar configuração
```bash
# Verificar se o Vercel CLI está instalado
vercel --version

# Verificar arquivo vercel.json
cat vercel.json
```

### 3. Fazer deploy
```bash
# Deploy de produção
vercel --prod

# Ou deploy normal (será perguntado se é produção)
vercel
```

### 4. Configurações do Vercel
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 5. Variáveis de Ambiente (já configuradas no vercel.json)
```json
{
  "env": {
    "VITE_API_URL": "https://goldeouro-backend.onrender.com",
    "VITE_WS_URL": "wss://goldeouro-backend.onrender.com"
  }
}
```

## 🚀 DEPLOY DO FRONTEND ADMIN

### 1. Navegar para o diretório
```bash
cd goldeouro-admin
```

### 2. Verificar configuração
```bash
# Verificar arquivo vercel.json
cat vercel.json
```

### 3. Fazer deploy
```bash
# Deploy de produção
vercel --prod

# Ou deploy normal
vercel
```

### 4. Configurações do Vercel
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 5. Variáveis de Ambiente (já configuradas no vercel.json)
```json
{
  "env": {
    "VITE_API_URL": "https://goldeouro-backend.onrender.com"
  }
}
```

## 🔧 CONFIGURAÇÕES JÁ PRONTAS

### Frontend Player (goldeouro-player)
- ✅ **vercel.json:** Configurado com variáveis de ambiente
- ✅ **URLs atualizadas:** localhost → produção
- ✅ **WebSocket:** wss:// para produção
- ✅ **API:** Configuração centralizada em `src/config/api.js`

### Frontend Admin (goldeouro-admin)
- ✅ **vercel.json:** Configurado com variáveis de ambiente
- ✅ **URLs atualizadas:** localhost → produção
- ✅ **Config/env.js:** URLs de produção configuradas

## 🧪 TESTES APÓS DEPLOY

### 1. Teste de Conectividade
```bash
# Testar backend
curl https://goldeouro-backend.onrender.com/health

# Testar frontend player
curl https://goldeouro-player.vercel.app

# Testar frontend admin
curl https://goldeouro-admin.vercel.app
```

### 2. Teste de CORS
```bash
# Testar CORS do player
curl -H "Origin: https://goldeouro-player.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://goldeouro-backend.onrender.com/

# Testar CORS do admin
curl -H "Origin: https://goldeouro-admin.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://goldeouro-backend.onrender.com/
```

### 3. Teste de Pagamento PIX
1. Acessar o frontend player
2. Fazer login
3. Ir para página de pagamentos
4. Criar pagamento PIX de teste
5. Verificar se o webhook processa automaticamente

## 📊 URLS ESPERADAS

| Componente | URL | Status |
|------------|-----|--------|
| **Backend** | https://goldeouro-backend.onrender.com | ✅ Ativo |
| **Player** | https://goldeouro-player.vercel.app | ⏳ Deploy pendente |
| **Admin** | https://goldeouro-admin.vercel.app | ⏳ Deploy pendente |

## ⚠️ POSSÍVEIS PROBLEMAS

### 1. Vercel CLI não responde
- **Solução:** Usar interface web do Vercel
- **URL:** https://vercel.com/dashboard
- **Ação:** Fazer upload do projeto ou conectar repositório

### 2. Erro de build
- **Solução:** Verificar dependências
- **Comando:** `npm install && npm run build`

### 3. Variáveis de ambiente não carregam
- **Solução:** Verificar vercel.json
- **Ação:** Configurar manualmente no painel do Vercel

## 🎯 COMANDOS RÁPIDOS

### Deploy Player:
```bash
cd goldeouro-player
vercel --prod
```

### Deploy Admin:
```bash
cd goldeouro-admin
vercel --prod
```

### Verificar Status:
```bash
# Backend
curl https://goldeouro-backend.onrender.com/health

# Player (após deploy)
curl https://goldeouro-player.vercel.app

# Admin (após deploy)
curl https://goldeouro-admin.vercel.app
```

## ✅ CHECKLIST FINAL

- [ ] Deploy do Player no Vercel
- [ ] Deploy do Admin no Vercel
- [ ] Teste de conectividade de todos os serviços
- [ ] Teste de CORS entre frontends e backend
- [ ] Teste de pagamento PIX completo
- [ ] Verificação de WebSocket (chat/analytics)

---
**Desenvolvido por:** Assistente IA  
**Data:** 05/09/2025  
**Versão:** 1.0.0
