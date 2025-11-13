# 🔐 STATUS DAS CREDENCIAIS PARA MCPs - GOL DE OURO

**Data:** 13 de Novembro de 2025  
**Versão:** 1.2.0  
**Status:** ⚠️ **CONFIGURAÇÃO PARCIAL**

---

## ✅ CREDENCIAIS JÁ DISPONÍVEIS

### **Informações Conhecidas:**
- ✅ **SUPABASE_URL:** `https://gayopagjdrkcmkirmfvy.supabase.co`
- ✅ **VERCEL_ORG_ID:** `goldeouro-admins-projects`
- ✅ **VERCEL_PROJECT_ID:** `goldeouro-player`
- ✅ **FLY_APP_NAME:** `goldeouro-backend-v2`

### **Secrets Configurados no Fly.io:**
- ✅ `SUPABASE_URL` - Configurado
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Configurado
- ✅ `MERCADOPAGO_ACCESS_TOKEN` - Configurado
- ✅ `DATABASE_URL` - Configurado
- ✅ E outros secrets de produção

### **Secrets Configurados no GitHub Actions:**
- ✅ `FLY_API_TOKEN` - Configurado (usado nos workflows)
- ✅ `VERCEL_TOKEN` - Configurado (usado nos workflows)
- ✅ `VERCEL_ORG_ID` - Configurado
- ✅ `VERCEL_PROJECT_ID` - Configurado

---

## ⚠️ CREDENCIAIS QUE PRECISAM SER OBTIDAS

### **Para Uso Local (MCPs):**

#### **1. VERCEL_TOKEN** 🔴 **CRÍTICO**

**Status:** ⚠️ **Precisa ser obtido**

**Como Obter:**
1. Acesse: https://vercel.com/account/tokens
2. Clique em "Create Token"
3. Dê um nome: "Gol de Ouro MCP"
4. Copie o token gerado

**Onde Configurar:**
- ✅ **GitHub Actions:** Já configurado como secret
- ⚠️ **Local:** Adicionar ao `.env.local`

**Nota:** O token do GitHub Actions pode ser diferente do token local.

---

#### **2. FLY_API_TOKEN** 🔴 **CRÍTICO**

**Status:** ⚠️ **Precisa ser obtido**

**Como Obter:**

**Opção 1: Via CLI (Recomendado)**
```bash
flyctl auth token
```

**Opção 2: Via Dashboard**
1. Acesse: https://fly.io/user/personal_access_tokens
2. Clique em "Create Token"
3. Copie o token gerado

**Onde Configurar:**
- ✅ **GitHub Actions:** Já configurado como secret
- ⚠️ **Local:** Adicionar ao `.env.local`

**Nota:** O token do GitHub Actions pode ser diferente do token local.

---

#### **3. SUPABASE_SERVICE_ROLE_KEY** 🔴 **CRÍTICO**

**Status:** ✅ **Já configurado no Fly.io**

**Como Obter (se necessário localmente):**
1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/settings/api
2. Role até "Project API keys"
3. Copie a **Service Role Key** (secret)

**Onde Configurar:**
- ✅ **Fly.io:** Já configurado como secret
- ⚠️ **Local:** Adicionar ao `.env.local` (se necessário)

**Nota:** Pode usar o mesmo valor do Fly.io se tiver acesso.

---

#### **4. GITHUB_TOKEN** 🔴 **CRÍTICO**

**Status:** ⚠️ **Precisa ser obtido**

**Como Obter:**
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Dê um nome: "Gol de Ouro MCP"
4. Selecione escopos:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Clique em "Generate token"
6. **Copie o token imediatamente**

**Onde Configurar:**
- ⚠️ **Local:** Adicionar ao `.env.local`
- ✅ **GitHub Actions:** Não necessário (já tem acesso)

---

## 📋 RESUMO POR MCP

### **Vercel MCP:**
- ✅ `VERCEL_ORG_ID` - Conhecido
- ✅ `VERCEL_PROJECT_ID` - Conhecido
- ⚠️ `VERCEL_TOKEN` - Precisa obter

### **Fly.io MCP:**
- ✅ `FLY_APP_NAME` - Conhecido
- ⚠️ `FLY_API_TOKEN` - Precisa obter

### **Supabase MCP:**
- ✅ `SUPABASE_URL` - Conhecido
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - Precisa obter (ou copiar do Fly.io)

### **GitHub Actions MCP:**
- ⚠️ `GITHUB_TOKEN` - Precisa obter

### **Mercado Pago MCP:**
- ✅ `MERCADOPAGO_ACCESS_TOKEN` - Já configurado no Fly.io
- ⚠️ Precisa copiar para `.env.local` se necessário localmente

### **Postgres MCP:**
- ✅ `DATABASE_URL` - Já configurado no Fly.io
- ⚠️ Precisa copiar para `.env.local` se necessário localmente

---

## 🔧 COMO OBTER AS CREDENCIAIS DO FLY.IO

Se você tem acesso ao Fly.io, pode obter os secrets:

```bash
# Listar todos os secrets
flyctl secrets list --app goldeouro-backend-v2

# Obter um secret específico (não funciona diretamente, mas pode ver no dashboard)
# Acesse: https://fly.io/apps/goldeouro-backend-v2/secrets
```

---

## 📝 CONFIGURAR LOCALMENTE

### **Opção 1: Usar o Script**

```bash
node scripts/configurar-variaveis-ambiente.js
```

### **Opção 2: Editar Manualmente**

Edite o arquivo `.env.local` que foi criado:

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

---

## ✅ VERIFICAR APÓS CONFIGURAR

Após configurar todas as variáveis:

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

## 📊 STATUS ATUAL

| Credencial | GitHub Actions | Fly.io | Local | Status |
|------------|----------------|--------|-------|--------|
| VERCEL_TOKEN | ✅ | ❌ | ⚠️ | Precisa configurar local |
| VERCEL_ORG_ID | ✅ | ❌ | ✅ | OK |
| VERCEL_PROJECT_ID | ✅ | ❌ | ✅ | OK |
| FLY_API_TOKEN | ✅ | ❌ | ⚠️ | Precisa configurar local |
| SUPABASE_URL | ⚠️ | ✅ | ✅ | OK |
| SUPABASE_SERVICE_ROLE_KEY | ⚠️ | ✅ | ⚠️ | Precisa configurar local |
| GITHUB_TOKEN | ✅ | ❌ | ⚠️ | Precisa configurar local |
| MERCADOPAGO_ACCESS_TOKEN | ❌ | ✅ | ⚠️ | Precisa configurar local |
| DATABASE_URL | ❌ | ✅ | ⚠️ | Precisa configurar local |

---

## 🎯 PRÓXIMOS PASSOS

1. **Obter tokens faltantes:**
   - VERCEL_TOKEN
   - FLY_API_TOKEN
   - GITHUB_TOKEN
   - SUPABASE_SERVICE_ROLE_KEY (ou copiar do Fly.io)

2. **Configurar no `.env.local`:**
   - Editar o arquivo criado
   - Adicionar todos os tokens

3. **Verificar configuração:**
   - Executar `node scripts/verificar-mcps.js`
   - Confirmar que todos os MCPs estão funcionando

---

**Documento criado em:** 13 de Novembro de 2025  
**Versão:** 1.0  
**Status:** ⚠️ **CONFIGURAÇÃO EM ANDAMENTO**

