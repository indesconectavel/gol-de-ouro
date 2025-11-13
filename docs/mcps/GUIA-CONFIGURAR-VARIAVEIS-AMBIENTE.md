# 🔐 GUIA PARA CONFIGURAR VARIÁVEIS DE AMBIENTE - MCPs

**Data:** 13/11/2025, 16:25:35  
**Versão:** 1.2.0

---

## 📋 VARIÁVEIS JÁ CONHECIDAS

Estas variáveis já estão configuradas ou são conhecidas:

```bash
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
VERCEL_ORG_ID=goldeouro-admins-projects
VERCEL_PROJECT_ID=goldeouro-player
FLY_APP_NAME=goldeouro-backend-v2
```

---

## 🔐 VARIÁVEIS QUE PRECISAM SER CONFIGURADAS

### **1. VERCEL_TOKEN** 🔴 **CRÍTICO**

**Como Obter:**
1. Acesse: https://vercel.com/account/tokens
2. Clique em "Create Token"
3. Dê um nome ao token (ex: "Gol de Ouro MCP")
4. Copie o token gerado

**Onde Configurar:**
- **Local:** Adicione ao arquivo `.env.local`
- **GitHub Actions:** Adicione como secret `VERCEL_TOKEN`

---

### **2. FLY_API_TOKEN** 🔴 **CRÍTICO**

**Como Obter:**

**Opção 1: Via CLI**
```bash
flyctl auth token
```

**Opção 2: Via Dashboard**
1. Acesse: https://fly.io/user/personal_access_tokens
2. Clique em "Create Token"
3. Copie o token gerado

**Onde Configurar:**
- **Local:** Adicione ao arquivo `.env.local`
- **GitHub Actions:** Já deve estar configurado como secret `FLY_API_TOKEN`

---

### **3. SUPABASE_SERVICE_ROLE_KEY** 🔴 **CRÍTICO**

**Como Obter:**
1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/settings/api
2. Role até "Project API keys"
3. Copie a **Service Role Key** (secret) - ⚠️ **NÃO** a anon key

**Onde Configurar:**
- **Local:** Adicione ao arquivo `.env.local`
- **Fly.io:** Já deve estar configurado como secret
- **GitHub Actions:** Opcional (para monitoramento)

---

### **4. GITHUB_TOKEN** 🔴 **CRÍTICO**

**Como Obter:**
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Dê um nome ao token (ex: "Gol de Ouro MCP")
4. Selecione escopos:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Clique em "Generate token"
6. **Copie o token imediatamente** (não será mostrado novamente)

**Onde Configurar:**
- **Local:** Adicione ao arquivo `.env.local`
- **GitHub Actions:** Não necessário (já tem acesso)

---

## 📝 CONFIGURAR LOCALMENTE

### **Opção 1: Usar o Script**

Execute o script de configuração:

```bash
node scripts/configurar-variaveis-ambiente.js
```

### **Opção 2: Criar Manualmente**

Crie o arquivo `.env.local` na raiz do projeto:

```bash
# Vercel
VERCEL_TOKEN=seu_token_aqui
VERCEL_ORG_ID=goldeouro-admins-projects
VERCEL_PROJECT_ID=goldeouro-player

# Fly.io
FLY_API_TOKEN=seu_token_aqui

# Supabase
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# GitHub Actions
GITHUB_TOKEN=seu_token_aqui
```

**⚠️ IMPORTANTE:** Certifique-se de que `.env.local` está no `.gitignore`!

---

## ✅ VERIFICAR CONFIGURAÇÃO

Após configurar, execute:

```bash
node scripts/verificar-mcps.js
```

Isso verificará se todas as variáveis estão configuradas corretamente.

---

## 🔒 SEGURANÇA

- ⚠️ **NUNCA** commite arquivos `.env` ou `.env.local` no Git
- ⚠️ **NUNCA** exponha tokens em documentação pública
- ✅ Use secrets do GitHub Actions para CI/CD
- ✅ Use secrets do Fly.io para produção
- ✅ Mantenha tokens locais apenas para desenvolvimento

---

**Guia criado em:** 13/11/2025, 16:25:35
