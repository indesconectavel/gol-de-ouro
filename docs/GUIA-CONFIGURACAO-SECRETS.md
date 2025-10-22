# 🔐 Guia de Configuração de Secrets - GitHub Actions

## 🎯 **CONFIGURAÇÃO COMPLETA DOS SECRETS**

### **📋 INSTRUÇÕES PASSO A PASSO:**

1. **Acesse o repositório GitHub:**
   ```
   https://github.com/indesconectavel/gol-de-ouro
   ```

2. **Navegue para Settings:**
   - Clique em **Settings** (aba superior)
   - No menu lateral, clique em **Secrets and variables**
   - Clique em **Actions**

3. **Configure os Secrets Obrigatórios:**

### **🔑 SECRETS OBRIGATÓRIOS:**

#### **1. FLY_API_TOKEN**
- **Descrição:** Token de autenticação do Fly.io
- **Como obter:**
  ```bash
  flyctl auth token
  ```
- **Valor:** Cole o token completo retornado
- **Uso:** Deploy automático do backend

#### **2. VERCEL_TOKEN**
- **Descrição:** Token de autenticação do Vercel
- **Como obter:**
  ```bash
  npx vercel login
  npx vercel whoami
  ```
- **Valor:** Token de autenticação do Vercel
- **Uso:** Deploy automático do frontend

#### **3. VERCEL_ORG_ID**
- **Descrição:** ID da organização no Vercel
- **Como obter:**
  ```bash
  npx vercel orgs list
  ```
- **Valor:** ID da organização (ex: `team_xxxxx`)
- **Uso:** Identificação da organização

#### **4. VERCEL_PROJECT_ID**
- **Descrição:** ID do projeto no Vercel
- **Como obter:**
  ```bash
  npx vercel projects list
  ```
- **Valor:** ID do projeto (ex: `prj_xxxxx`)
- **Uso:** Identificação do projeto

### **🔑 SECRETS OPCIONAIS:**

#### **5. SUPABASE_URL**
- **Descrição:** URL do projeto Supabase
- **Como obter:** Painel Supabase → Settings → API
- **Valor:** `https://seuprojeto.supabase.co`
- **Uso:** Monitoramento do banco de dados

#### **6. SUPABASE_KEY**
- **Descrição:** Chave anônima do Supabase
- **Como obter:** Painel Supabase → Settings → API
- **Valor:** Chave anônima (anon key)
- **Uso:** Monitoramento do banco de dados

#### **7. SLACK_WEBHOOK_URL**
- **Descrição:** Webhook do Slack para alertas
- **Como obter:** Slack → Apps → Incoming Webhooks
- **Valor:** `https://hooks.slack.com/services/...`
- **Uso:** Notificações de alertas

#### **8. DISCORD_WEBHOOK_URL**
- **Descrição:** Webhook do Discord para alertas
- **Como obter:** Discord → Server Settings → Integrations → Webhooks
- **Valor:** `https://discord.com/api/webhooks/...`
- **Uso:** Notificações de alertas

---

## 🚀 **COMANDOS PARA OBTER OS SECRETS:**

### **Fly.io:**
```bash
# Obter token do Fly.io
flyctl auth token

# Verificar status do app
flyctl status --app goldeouro-backend
```

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

## 🔧 **CONFIGURAÇÃO NO GITHUB:**

1. **Clique em "New repository secret"**
2. **Digite o nome do secret** (ex: `FLY_API_TOKEN`)
3. **Cole o valor** do secret
4. **Clique em "Add secret"**
5. **Repita para todos os secrets**

---

## 📊 **STATUS DOS SECRETS:**

### **✅ Obrigatórios (4):**
- [ ] `FLY_API_TOKEN`
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`

### **⚠️ Opcionais (4):**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_KEY`
- [ ] `SLACK_WEBHOOK_URL`
- [ ] `DISCORD_WEBHOOK_URL`

---

## 🎯 **APÓS CONFIGURAR OS SECRETS:**

1. **Execute o pipeline principal** manualmente
2. **Verifique os logs** de deploy
3. **Confirme que os serviços** estão online
4. **Teste o sistema** completo

---

**📅 Última atualização:** $(Get-Date)
**👨‍💻 Desenvolvido por:** Fred Silva
