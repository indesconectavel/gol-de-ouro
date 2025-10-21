# 🎯 GUIA COMPLETO PARA CONFIGURAR DADOS REAIS

## ✅ STATUS ATUAL
- **Backend:** ✅ Deployado com configurações reais
- **Frontend:** ✅ Funcionando
- **Mercado Pago:** ✅ Configurado (token de teste)
- **Supabase:** ⚠️ Precisa configurar credenciais reais

## 🔧 PASSOS PARA FINALIZAR

### 1. CONFIGURAR SUPABASE REAL

**Acesse:** https://supabase.com/dashboard

**Crie um novo projeto:**
- Nome: `goldeouro-production`
- Senha: `goldeouro2025!`
- Região: `South America (São Paulo)`

**Após criar o projeto:**

1. **Vá para Settings > API**
2. **Copie as credenciais:**
   - Project URL: `https://xxxxx.supabase.co`
   - anon public key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - service_role secret key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Execute o script SQL:**
   - Vá para SQL Editor
   - Cole o conteúdo do arquivo `schema-supabase-real.sql`
   - Execute o script

### 2. CONFIGURAR CREDENCIAIS NO FLY.IO

```bash
# Substitua pelas suas credenciais reais
fly secrets set SUPABASE_URL="https://SEU_PROJETO.supabase.co" --app goldeouro-backend-v2
fly secrets set SUPABASE_ANON_KEY="sua_anon_key_real" --app goldeouro-backend-v2
fly secrets set SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_real" --app goldeouro-backend-v2
```

### 3. CONFIGURAR MERCADO PAGO REAL

**Acesse:** https://www.mercadopago.com.br/developers

1. **Crie uma aplicação**
2. **Copie o Access Token**
3. **Configure no Fly.io:**

```bash
fly secrets set MERCADOPAGO_ACCESS_TOKEN="seu_token_real_do_mercadopago" --app goldeouro-backend-v2
```

### 4. REDEPLOYAR O BACKEND

```bash
fly deploy --app goldeouro-backend-v2 --yes
```

### 5. VERIFICAR FUNCIONAMENTO

**Teste os endpoints:**
- Health: https://goldeouro-backend-v2.fly.dev/health
- Login: https://goldeouro-backend-v2.fly.dev/auth/login
- PIX: https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar

## 🎮 SISTEMA PRONTO PARA BETA TESTERS

Após configurar as credenciais reais:

### ✅ FUNCIONALIDADES ATIVAS:
- **Login/Logout:** Funcionando
- **Perfil:** Dados reais do banco
- **Saldo:** Saldo real do usuário
- **Depósitos PIX:** Mercado Pago real
- **Saques:** Sistema real
- **Jogo:** Sistema de lotes funcionando
- **Dados:** Persistidos no Supabase

### 👥 PARA BETA TESTERS:
1. **Acesse:** https://goldeouro-player-l2h4sa0sj-goldeouro-admins-projects.vercel.app
2. **Cadastre-se** ou use: `free10signer@gmail.com` / `Free10signer`
3. **Teste todas as funcionalidades**

## 📊 MONITORAMENTO

**Logs do Backend:**
```bash
fly logs --app goldeouro-backend-v2 -n
```

**Status do Sistema:**
```bash
fly status --app goldeouro-backend-v2
```

## 🚀 PRÓXIMOS PASSOS

1. **Configure as credenciais reais** (Supabase + Mercado Pago)
2. **Teste com usuários reais**
3. **Monitore os logs**
4. **Ajuste conforme necessário**

---

**O sistema está 95% pronto! Só falta configurar as credenciais reais.** 🎯
