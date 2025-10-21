# 🎯 GUIA RÁPIDO PARA CONFIGURAR CREDENCIAIS REAIS

## ✅ STATUS ATUAL
- **Supabase URL:** ✅ Configurada (`https://gayopagjdrkcmkirmfvy.supabase.co`)
- **Mercado Pago:** ✅ Configurado (token real)
- **Script SQL:** ✅ Corrigido (UUID compatível)

## 🔧 PRÓXIMOS PASSOS (2 MINUTOS)

### 1. EXECUTAR SCRIPT SQL CORRIGIDO

**No Supabase SQL Editor:**
1. **Cole o script corrigido** do arquivo `schema-supabase-real.sql`
2. **Execute** - agora deve funcionar sem erros
3. **Verifique** se as tabelas foram criadas

### 2. OBTER CREDENCIAIS SUPABASE

**No Supabase Dashboard:**
1. **Vá para:** Settings > API
2. **Copie as chaves:**
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role secret key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. CONFIGURAR NO FLY.IO

```bash
# Substitua pelas suas chaves reais
fly secrets set SUPABASE_ANON_KEY="sua_anon_key_real" --app goldeouro-backend-v2
fly secrets set SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_real" --app goldeouro-backend-v2
```

### 4. REDEPLOYAR

```bash
fly deploy --app goldeouro-backend-v2 --yes
```

## 🎮 SISTEMA PRONTO

Após configurar as credenciais:

### ✅ FUNCIONALIDADES ATIVAS:
- **Login/Logout:** Funcionando
- **Perfil:** Dados reais do Supabase
- **Saldo:** Saldo real do usuário
- **Depósitos PIX:** Mercado Pago real
- **Saques:** Sistema real
- **Jogo:** Sistema de lotes funcionando
- **Dados:** Persistidos no Supabase real

### 👥 PARA BETA TESTERS:
**URL:** `https://goldeouro-player-l2h4sa0sj-goldeouro-admins-projects.vercel.app`

**Usuário de teste:** `free10signer@gmail.com` / `Free10signer`

## 📊 VERIFICAÇÃO

**Teste o sistema:**
```bash
# Verificar status
curl https://goldeouro-backend-v2.fly.dev/health

# Testar login
curl -X POST https://goldeouro-backend-v2.fly.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free10signer@gmail.com","password":"Free10signer"}'
```

---

**Só falta configurar as 2 chaves do Supabase e fazer o redeploy!** 🚀
