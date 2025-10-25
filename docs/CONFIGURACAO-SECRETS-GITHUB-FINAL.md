# 🔐 CONFIGURAÇÃO DE SECRETS NO GITHUB - GOL DE OURO

## 📋 **INSTRUÇÕES PARA CONFIGURAR SECRETS:**

### **1. Acesse o repositório GitHub:**
```
https://github.com/indesconectavel/gol-de-ouro/settings/secrets/actions
```

### **2. Configure os Secrets Obrigatórios:**

#### **FLY_API_TOKEN**
- **Nome:** `FLY_API_TOKEN`
- **Valor:** [OBTER VIA `flyctl auth token` - NÃO EXPOR EM DOCUMENTAÇÃO]
- **Descrição:** Token de autenticação do Fly.io
- **⚠️ IMPORTANTE:** Nunca exponha tokens em documentação pública

#### **VERCEL_TOKEN**
- **Nome:** `VERCEL_TOKEN`
- **Valor:** [Obter via `npx vercel login`]
- **Descrição:** Token de autenticação do Vercel

#### **VERCEL_ORG_ID**
- **Nome:** `VERCEL_ORG_ID`
- **Valor:** `goldeouro-admins-projects`
- **Descrição:** ID da organização no Vercel

#### **VERCEL_PROJECT_ID**
- **Nome:** `VERCEL_PROJECT_ID`
- **Valor:** `goldeouro-player`
- **Descrição:** ID do projeto no Vercel

### **3. Configure os Secrets Opcionais:**

#### **SUPABASE_URL**
- **Nome:** `SUPABASE_URL`
- **Valor:** `https://seuprojeto.supabase.co`
- **Descrição:** URL do projeto Supabase

#### **SUPABASE_KEY**
- **Nome:** `SUPABASE_KEY`
- **Valor:** `sua_chave_anonima`
- **Descrição:** Chave anônima do Supabase

---

## ✅ **STATUS DOS SECRETS:**

### **✅ Obtidos:**
- ✅ `FLY_API_TOKEN` - Token do Fly.io (obtido)
- ✅ `VERCEL_ORG_ID` - `goldeouro-admins-projects`
- ✅ `VERCEL_PROJECT_ID` - `goldeouro-player`

### **⚠️ Para Obter:**
- ⚠️ `VERCEL_TOKEN` - Obter via `npx vercel login`
- ⚠️ `SUPABASE_URL` - URL do Supabase (opcional)
- ⚠️ `SUPABASE_KEY` - Chave do Supabase (opcional)

---

## 🎯 **APÓS CONFIGURAR OS SECRETS:**

1. **Execute o pipeline principal** manualmente
2. **Verifique os logs** de deploy
3. **Confirme que os serviços** estão online
4. **Teste o sistema** completo

---

**📅 Data:** $(Get-Date)
**👨‍💻 Desenvolvido por:** Fred Silva
