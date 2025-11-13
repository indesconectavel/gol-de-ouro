# 📋 PRÓXIMOS PASSOS - CONFIGURAÇÃO DE MCPs

**Data:** 13 de Novembro de 2025  
**Versão:** 1.2.0  
**Status:** ⚠️ **CONFIGURAÇÃO EM ANDAMENTO**

---

## 📊 RESUMO DA VERIFICAÇÃO

### **Status Atual:**
- ✅ **MCPs Configurados:** 11/11 (100%)
- ⚠️ **Variáveis de Ambiente:** 0/11 configuradas (0%)
- ⚠️ **Comandos Funcionando:** 1/10 (10%)
- ❌ **Problemas Identificados:** 4 MCPs precisam de correção

---

## 🔴 AÇÕES PRIORITÁRIAS

### **1. CONFIGURAR VARIÁVEIS DE AMBIENTE** 🔴 **CRÍTICO**

#### **1.1 Variáveis do Vercel**

**Onde Configurar:**
- **Local:** Criar arquivo `.env.local` ou configurar no sistema
- **GitHub Actions:** Secrets do repositório
- **Vercel Dashboard:** Settings → Environment Variables

**Variáveis Necessárias:**
```bash
VERCEL_TOKEN=<seu_token_vercel>
VERCEL_ORG_ID=<seu_org_id>
VERCEL_PROJECT_ID=goldeouro-player
```

**Como Obter:**
1. Acesse: https://vercel.com/account/tokens
2. Crie um novo token
3. Copie o token
4. Acesse: https://vercel.com/[seu-time]/settings
5. Copie o Org ID
6. Project ID está no nome do projeto: `goldeouro-player`

---

#### **1.2 Variáveis do Fly.io**

**Onde Configurar:**
- **Local:** Criar arquivo `.env.local` ou configurar no sistema
- **GitHub Actions:** Secrets do repositório

**Variáveis Necessárias:**
```bash
FLY_API_TOKEN=<seu_fly_api_token>
```

**Como Obter:**
1. Execute: `flyctl auth token`
2. Ou acesse: https://fly.io/user/personal_access_tokens
3. Crie um novo token
4. Copie o token

---

#### **1.3 Variáveis do Supabase**

**Onde Configurar:**
- **Local:** Criar arquivo `.env.local` ou configurar no sistema
- **Fly.io:** Secrets da aplicação
- **GitHub Actions:** Secrets do repositório

**Variáveis Necessárias:**
```bash
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<sua_service_role_key>
```

**Como Obter:**
1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/settings/api
2. Copie a URL do projeto
3. Copie a Service Role Key (secret)

---

#### **1.4 Variáveis do GitHub Actions**

**Onde Configurar:**
- **GitHub Actions:** Secrets do repositório

**Variáveis Necessárias:**
```bash
GITHUB_TOKEN=<seu_github_token>
```

**Como Obter:**
1. Acesse: https://github.com/settings/tokens
2. Crie um novo token (classic)
3. Selecione escopos: `repo`, `workflow`
4. Copie o token

---

#### **1.5 Variáveis do Sentry (Opcional)**

**Onde Configurar:**
- **Local:** Criar arquivo `.env.local` ou configurar no sistema
- **Fly.io:** Secrets da aplicação

**Variáveis Necessárias:**
```bash
SENTRY_AUTH_TOKEN=<seu_sentry_token>
SENTRY_ORG=<seu_org>
SENTRY_PROJECT=<seu_projeto>
```

**Como Obter:**
1. Acesse: https://sentry.io/settings/account/api/auth-tokens/
2. Crie um novo token
3. Copie o token
4. Org e Project estão na URL do Sentry

---

#### **1.6 Variáveis do Postgres**

**Onde Configurar:**
- **Local:** Criar arquivo `.env.local` ou configurar no sistema

**Variáveis Necessárias:**
```bash
DATABASE_URL=postgresql://postgres:[senha]@[host]:5432/postgres
```

**Como Obter:**
1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/settings/database
2. Copie a Connection String
3. Substitua `[YOUR-PASSWORD]` pela senha do banco

---

#### **1.7 Variáveis do Mercado Pago**

**Onde Configurar:**
- **Local:** Criar arquivo `.env.local` ou configurar no sistema
- **Fly.io:** Secrets da aplicação

**Variáveis Necessárias:**
```bash
MERCADOPAGO_ACCESS_TOKEN=<seu_access_token>
```

**Como Obter:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Copie o Access Token

---

### **2. CORRIGIR PROBLEMAS IDENTIFICADOS** 🟡 **IMPORTANTE**

#### **2.1 Docker MCP** ❌

**Problema:** Docker não está instalado

**Solução:**
1. **Instalar Docker Desktop:**
   - Windows: https://www.docker.com/products/docker-desktop/
   - Baixe e instale o Docker Desktop
   - Reinicie o computador após instalação

2. **Verificar Instalação:**
   ```bash
   docker --version
   ```

**Status:** ⚠️ **Requer instalação manual**

---

#### **2.2 Jest MCP** ❌

**Problema:** Erro de configuração ES Module

**Solução:**
1. **Corrigir `jest.config.js`:**
   ```javascript
   // Renomear para jest.config.cjs ou converter para ESM
   ```

2. **Ou atualizar configuração:**
   ```json
   // package.json
   {
     "jest": {
       "preset": "default",
       "testEnvironment": "node"
     }
   }
   ```

**Status:** ⚠️ **Requer correção de configuração**

---

#### **2.3 Lighthouse MCP** ❌

**Problema:** Timeout ao executar

**Solução:**
1. **Instalar Lighthouse globalmente:**
   ```bash
   npm install -g lighthouse
   ```

2. **Ou usar npx com timeout maior:**
   ```bash
   npx lighthouse https://goldeouro.lol --timeout=60000
   ```

**Status:** ⚠️ **Requer ajuste de timeout**

---

#### **2.4 ESLint MCP** ✅

**Status:** ✅ **Funcionando corretamente**

---

### **3. TESTAR CADA MCP INDIVIDUALMENTE** 🟡 **IMPORTANTE**

#### **3.1 Testar Vercel MCP**

```bash
# Verificar versão
npx vercel --version

# Verificar autenticação
npx vercel whoami

# Listar projetos
npx vercel ls
```

---

#### **3.2 Testar Fly.io MCP**

```bash
# Verificar versão
flyctl version

# Verificar autenticação
flyctl auth whoami

# Verificar status do app
flyctl status --app goldeouro-backend-v2
```

---

#### **3.3 Testar Supabase MCP**

```bash
# Testar conexão
node test-supabase.js

# Verificar tabelas
node check-tables.js
```

---

#### **3.4 Testar GitHub Actions MCP**

```bash
# Verificar versão
gh --version

# Verificar autenticação
gh auth status

# Listar workflows
gh workflow list
```

---

#### **3.5 Testar Lighthouse MCP**

```bash
# Executar auditoria
npx lighthouse https://goldeouro.lol --output html --output-path ./reports/lighthouse.html
```

---

#### **3.6 Testar Docker MCP**

```bash
# Verificar versão
docker --version

# Verificar containers
docker ps
```

---

#### **3.7 Testar Jest MCP**

```bash
# Executar testes
npm test

# Com cobertura
npm run test:coverage
```

---

#### **3.8 Testar ESLint MCP**

```bash
# Executar lint
npx eslint .

# Corrigir problemas
npx eslint . --fix
```

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### **Variáveis de Ambiente:**
- [ ] VERCEL_TOKEN
- [ ] VERCEL_ORG_ID
- [ ] VERCEL_PROJECT_ID
- [ ] FLY_API_TOKEN
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] GITHUB_TOKEN
- [ ] SENTRY_AUTH_TOKEN (opcional)
- [ ] SENTRY_ORG (opcional)
- [ ] SENTRY_PROJECT (opcional)
- [ ] DATABASE_URL
- [ ] MERCADOPAGO_ACCESS_TOKEN

### **Ferramentas:**
- [ ] Docker Desktop instalado
- [ ] Jest configurado corretamente
- [ ] Lighthouse funcionando

### **Testes:**
- [ ] Vercel MCP testado
- [ ] Fly.io MCP testado
- [ ] Supabase MCP testado
- [ ] GitHub Actions MCP testado
- [ ] Lighthouse MCP testado
- [ ] Docker MCP testado
- [ ] Jest MCP testado
- [ ] ESLint MCP testado

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

### **Fase 1: Configurar Variáveis Críticas** (30 minutos)
1. ✅ Configurar Vercel (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
2. ✅ Configurar Fly.io (FLY_API_TOKEN)
3. ✅ Configurar Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
4. ✅ Configurar GitHub Actions (GITHUB_TOKEN)

### **Fase 2: Configurar Variáveis Opcionais** (15 minutos)
5. ⚠️ Configurar Sentry (se necessário)
6. ⚠️ Configurar Postgres (DATABASE_URL)
7. ⚠️ Configurar Mercado Pago (MERCADOPAGO_ACCESS_TOKEN)

### **Fase 3: Corrigir Problemas** (1-2 horas)
8. ⚠️ Instalar Docker Desktop
9. ⚠️ Corrigir configuração do Jest
10. ⚠️ Ajustar timeout do Lighthouse

### **Fase 4: Testar Todos os MCPs** (30 minutos)
11. ✅ Testar cada MCP individualmente
12. ✅ Verificar funcionamento completo

---

## 📄 ARQUIVOS DE CONFIGURAÇÃO

### **Criar `.env.local` (Local):**

```bash
# Vercel
VERCEL_TOKEN=seu_token_aqui
VERCEL_ORG_ID=seu_org_id_aqui
VERCEL_PROJECT_ID=goldeouro-player

# Fly.io
FLY_API_TOKEN=seu_token_aqui

# Supabase
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_key_aqui

# GitHub Actions
GITHUB_TOKEN=seu_token_aqui

# Postgres
DATABASE_URL=sua_connection_string_aqui

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui

# Sentry (opcional)
SENTRY_AUTH_TOKEN=seu_token_aqui
SENTRY_ORG=seu_org_aqui
SENTRY_PROJECT=seu_projeto_aqui
```

**⚠️ IMPORTANTE:** Adicione `.env.local` ao `.gitignore` para não commitar secrets!

---

## ✅ CONCLUSÃO

**Status:** Configuração dos MCPs está em andamento. Variáveis de ambiente precisam ser configuradas e alguns problemas precisam ser corrigidos.

**Próxima Ação:** Configurar variáveis de ambiente críticas (Vercel, Fly.io, Supabase, GitHub Actions).

---

**Documento criado em:** 13 de Novembro de 2025  
**Versão:** 1.0  
**Status:** ⚠️ **EM ANDAMENTO**

