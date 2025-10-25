# 🔐 CONFIGURAÇÃO DE SECRETS NO GITHUB - GOL DE OURO

## 🎯 **GUIA COMPLETO PARA CONFIGURAR SECRETS**

### **📋 INSTRUÇÕES PASSO A PASSO:**

1. **Acesse o repositório GitHub:**
   ```
   https://github.com/indesconectavel/gol-de-ouro/settings/secrets/actions
   ```

2. **Configure os Secrets Obrigatórios:**

### **🔑 SECRETS OBRIGATÓRIOS:**

#### **1. FLY_API_TOKEN**
- **Nome:** `FLY_API_TOKEN`
- **Valor:** [OBTER VIA `flyctl auth token` - NÃO EXPOR EM DOCUMENTAÇÃO]
- **Descrição:** Token de autenticação do Fly.io
- **⚠️ IMPORTANTE:** Nunca exponha tokens em documentação pública

#### **2. VERCEL_TOKEN**
- **Nome:** `VERCEL_TOKEN`
- **Valor:** [Obter via `npx vercel login`]
- **Descrição:** Token de autenticação do Vercel

#### **3. VERCEL_ORG_ID**
- **Nome:** `VERCEL_ORG_ID`
- **Valor:** [Obter via `npx vercel orgs list`]
- **Descrição:** ID da organização no Vercel

#### **4. VERCEL_PROJECT_ID**
- **Nome:** `VERCEL_PROJECT_ID`
- **Valor:** [Obter via `npx vercel projects list`]
- **Descrição:** ID do projeto no Vercel

### **🔑 SECRETS OPCIONAIS:**

#### **5. SUPABASE_URL**
- **Nome:** `SUPABASE_URL`
- **Valor:** `https://seuprojeto.supabase.co`
- **Descrição:** URL do projeto Supabase

#### **6. SUPABASE_KEY**
- **Nome:** `SUPABASE_KEY`
- **Valor:** `sua_chave_anonima`
- **Descrição:** Chave anônima do Supabase

#### **7. SLACK_WEBHOOK_URL**
- **Nome:** `SLACK_WEBHOOK_URL`
- **Valor:** `https://hooks.slack.com/services/...`
- **Descrição:** Webhook do Slack para alertas

#### **8. DISCORD_WEBHOOK_URL**
- **Nome:** `DISCORD_WEBHOOK_URL`
- **Valor:** `https://discord.com/api/webhooks/...`
- **Descrição:** Webhook do Discord para alertas

---

## 🚀 **COMANDOS PARA OBTER TOKENS:**

### **Vercel:**
```bash
# Fazer login no Vercel
npx vercel login

# Verificar usuário
npx vercel whoami

# Listar organizações
npx vercel orgs list

# Listar projetos
npx vercel projects list
```

### **Fly.io:**
```bash
# Verificar status do app
flyctl status --app goldeouro-backend

# Obter token (já obtido)
flyctl auth token
```

---

## ✅ **VALIDAÇÃO DOS SECRETS:**

Após configurar os secrets, execute:

```bash
# Testar Fly.io
flyctl status --app goldeouro-backend

# Testar Vercel
npx vercel whoami
```

---

## 📊 **STATUS ATUAL:**

### **✅ Tokens Obtidos:**
- ✅ **FLY_API_TOKEN:** Obtido com sucesso
- ✅ **VERCEL_TOKEN:** Usuário autenticado (indesconectavel)

### **⚠️ Tokens para Obter:**
- ⚠️ **VERCEL_TOKEN:** Obter via `npx vercel login`
- ⚠️ **VERCEL_ORG_ID:** Obter via `npx vercel orgs list`
- ⚠️ **VERCEL_PROJECT_ID:** Obter via `npx vercel projects list`

---

## 🎯 **APÓS CONFIGURAR OS SECRETS:**

1. **Execute o pipeline principal** manualmente
2. **Verifique os logs** de deploy
3. **Confirme que os serviços** estão online
4. **Teste o sistema** completo

---

**📅 Última atualização:** $(Get-Date)
**👨‍💻 Desenvolvido por:** Fred Silva
