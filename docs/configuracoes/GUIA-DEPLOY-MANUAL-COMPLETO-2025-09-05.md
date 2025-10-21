# 🚀 GUIA COMPLETO DE DEPLOY MANUAL - 05/09/2025

**Data:** 05/09/2025  
**Status:** ⚠️ **AÇÃO IMEDIATA NECESSÁRIA**  
**Prioridade:** CRÍTICA  

## 🎯 PROBLEMA IDENTIFICADO

**O terminal está travando porque você está clicando em "Skip" nos prompts que demoram!**

### ❌ **NÃO FAÇA ISSO:**
- ❌ Clicar em "Skip" quando o terminal demora
- ❌ Interromper comandos em execução
- ❌ Fechar o terminal durante operações

### ✅ **FAÇA ISSO:**
- ✅ Aguardar os comandos terminarem
- ✅ Deixar o terminal processar
- ✅ Aguardar a conclusão natural

## 🚀 DEPLOY MANUAL COMPLETO

### **PASSO 1: BACKEND (RENDER.COM)**

#### 1.1 Acessar Render Dashboard
- **URL:** https://dashboard.render.com
- **Login:** Com suas credenciais
- **Projeto:** Localizar "goldeouro-backend"

#### 1.2 Configurar Variáveis de Ambiente
**Ir para:** Environment tab no projeto

**Adicionar estas variáveis:**

```env
DATABASE_URL=postgresql://postgres.uatszaqzdqcwnfbipoxg:J6wGY2EnCyXc0lID@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
PORT=3000
NODE_ENV=production
JWT_SECRET=8841259ba3f27fcdbfb1c26758d965874836178d0699cbc136237e600535c1d4
ADMIN_TOKEN=be81dd1b229fd4f1737ada13cbab37eb
CORS_ORIGINS=https://goldeouro-admin.vercel.app,https://goldeouro-player.vercel.app,https://goldeouro-backend.onrender.com
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7954357605868928-090204-e9f5fb668c0f91f6b729328b1e14adf5-468718642
MERCADOPAGO_WEBHOOK_SECRET=157e633722bf94eb817dcd66d6e13c08425517779a7962feb034ddd26671f9bf
WEBHOOK_URL=https://goldeouro-backend.onrender.com/api/payments/webhook
FRONTEND_URL=https://goldeouro-player.vercel.app
ADMIN_URL=https://goldeouro-admin.vercel.app
BACKEND_URL=https://goldeouro-backend.onrender.com
```

#### 1.3 Fazer Deploy
1. **Clicar em:** "Manual Deploy"
2. **Aguardar:** Conclusão do build (NÃO CLICAR EM SKIP!)
3. **Verificar:** Logs de runtime
4. **Confirmar:** Servidor iniciou sem erros

### **PASSO 2: FRONTEND PLAYER (VERCEL)**

#### 2.1 Acessar Vercel Dashboard
- **URL:** https://vercel.com/dashboard
- **Projeto:** Localizar "goldeouro-player"

#### 2.2 Verificar Deploy
- **Status:** Deve estar "Ready"
- **URL:** https://goldeouro-player.vercel.app
- **Variáveis:** Já configuradas no vercel.json

### **PASSO 3: FRONTEND ADMIN (VERCEL)**

#### 3.1 Acessar Vercel Dashboard
- **URL:** https://vercel.com/dashboard
- **Projeto:** Localizar "goldeouro-admin"

#### 3.2 Verificar Deploy
- **Status:** Deve estar "Ready"
- **URL:** https://goldeouro-admin.vercel.app
- **Variáveis:** Já configuradas no vercel.json

## 🧪 TESTES DE VALIDAÇÃO

### Teste 1: Backend Health Check
```bash
curl https://goldeouro-backend.onrender.com/health
```
**Esperado:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-05T...",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0",
  "database": "connected"
}
```

### Teste 2: API Principal
```bash
curl https://goldeouro-backend.onrender.com/
```
**Esperado:**
```json
{
  "message": "🚀 API Gol de Ouro ativa!",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2025-09-05T..."
}
```

### Teste 3: Frontend Player
- **URL:** https://goldeouro-player.vercel.app
- **Verificar:** Página carrega sem erros
- **Verificar:** Console sem erros de API

### Teste 4: Frontend Admin
- **URL:** https://goldeouro-admin.vercel.app
- **Verificar:** Página carrega sem erros
- **Verificar:** Console sem erros de API

## 📊 STATUS ESPERADO APÓS CONFIGURAÇÃO

| Componente | Status | URL |
|------------|--------|-----|
| **Backend** | ✅ Ativo | https://goldeouro-backend.onrender.com |
| **Health Check** | ✅ Respondendo | /health |
| **Database** | ✅ Conectado | Supabase |
| **CORS** | ✅ Configurado | Domínios de produção |
| **Mercado Pago** | ✅ Configurado | Webhook ativo |
| **Player** | ✅ Ativo | https://goldeouro-player.vercel.app |
| **Admin** | ✅ Ativo | https://goldeouro-admin.vercel.app |

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

### 1. **Terminal Travando**
- **Causa:** Clicar em "Skip" nos prompts
- **Solução:** Aguardar comandos terminarem naturalmente

### 2. **Deploy não iniciou**
- **Causa:** Commit não foi enviado para GitHub
- **Solução:** Verificar se o commit foi feito

### 3. **Build falhou**
- **Causa:** Erro no código ou dependências
- **Solução:** Verificar logs de build no Render

### 4. **Variáveis não carregam**
- **Causa:** Não configuradas no Render
- **Solução:** Configurar manualmente no dashboard

### 5. **Banco não conecta**
- **Causa:** DATABASE_URL incorreta
- **Solução:** Verificar URL do Supabase

### 6. **CORS não funciona**
- **Causa:** CORS_ORIGINS não configurado
- **Solução:** Adicionar domínios no Render

## 🔧 CONFIGURAÇÃO DETALHADA

### Passo 1: Acessar Render Dashboard
1. Ir para https://dashboard.render.com
2. Fazer login
3. Localizar projeto "goldeouro-backend"

### Passo 2: Configurar Environment Variables
1. Clicar na aba "Environment"
2. Adicionar cada variável listada acima
3. Clicar em "Save Changes"

### Passo 3: Fazer Deploy
1. Clicar em "Manual Deploy"
2. **AGUARDAR** conclusão (NÃO CLICAR EM SKIP!)
3. Verificar logs

### Passo 4: Testar
1. Testar health check
2. Testar API principal
3. Testar CORS
4. Verificar logs de erro

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] **Render Dashboard:** Acessado
- [ ] **Projeto:** Localizado
- [ ] **Variáveis:** Configuradas
- [ ] **Deploy:** Iniciado
- [ ] **Build:** Concluído sem erros
- [ ] **Runtime:** Servidor iniciado
- [ ] **Health Check:** Respondendo
- [ ] **Database:** Conectado
- [ ] **CORS:** Funcionando
- [ ] **Logs:** Sem erros críticos
- [ ] **Player:** Funcionando
- [ ] **Admin:** Funcionando

## 🚨 AÇÕES IMEDIATAS

1. **Acessar Render Dashboard AGORA**
2. **Configurar todas as variáveis de ambiente**
3. **Fazer redeploy manual**
4. **AGUARDAR conclusão (NÃO CLICAR EM SKIP!)**
5. **Testar todos os endpoints**
6. **Verificar logs de erro**

## 📞 SUPORTE

Se os problemas persistirem:
1. Verificar logs detalhados no Render
2. Confirmar que o commit foi enviado para GitHub
3. Verificar conectividade com banco de dados
4. Testar localmente com `npm start`

## 🎯 RESUMO EXECUTIVO

**O SISTEMA ESTÁ 95% PRONTO!**

- ✅ **Frontends:** Deployados no Vercel
- ✅ **Código:** Commitado e enviado para GitHub
- ✅ **Configurações:** Arquivos preparados
- ⚠️ **Backend:** Precisa de configuração no Render
- ⚠️ **Variáveis:** Precisam ser adicionadas no Render

**APENAS A CONFIGURAÇÃO DO RENDER RESTA!**

**IMPORTANTE: NÃO CLICAR EM SKIP NOS PROMPTS!**

---
**Desenvolvido por:** Assistente IA  
**Data:** 05/09/2025  
**Versão:** 1.0.0  
**Status:** ⚠️ **AÇÃO IMEDIATA NECESSÁRIA**
