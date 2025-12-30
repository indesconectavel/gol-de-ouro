# 🔐 PASSO A PASSO: Rotacionar Secrets Comprometidos

**Data:** 12 de Novembro de 2025  
**Urgência:** 🔴 **CRÍTICO - FAZER AGORA**

---

## ⚠️ **POR QUE ISSO É URGENTE?**

O GitGuardian detectou que sua **Supabase Service Role Key** foi exposta no GitHub. Qualquer pessoa que tenha acesso ao histórico do repositório pode ver essa chave e ter acesso total ao seu banco de dados.

**Ação necessária:** Gerar uma nova chave e atualizar no Fly.io.

---

## 📋 **PASSO A PASSO COMPLETO**

### **PASSO 1: Acessar o Dashboard do Supabase**

1. Abra seu navegador e acesse: **https://supabase.com/dashboard**
2. Faça login com sua conta
3. Selecione o projeto: **goldeouro-production** (ou o projeto que você está usando)

---

### **PASSO 2: Gerar Nova Service Role Key**

1. No menu lateral esquerdo, clique em **"Settings"** (Configurações)
2. Clique em **"API"**
3. Role até a seção **"Project API keys"**
4. Encontre a seção **"service_role"** (secret)
5. Clique no botão **"Reset"** ou **"Regenerate"** ao lado da chave
6. ⚠️ **ATENÇÃO:** Uma mensagem aparecerá avisando que isso invalidará a chave antiga
7. Clique em **"Confirm"** ou **"Reset"**
8. **COPIE A NOVA CHAVE** que aparecerá (ela começa com `eyJhbGci...`)
   - ⚠️ **IMPORTANTE:** Copie agora, pois você não poderá vê-la novamente depois!

---

### **PASSO 3: Atualizar Secret no Fly.io**

1. Abra o PowerShell ou Terminal
2. Navegue até a pasta do projeto (se ainda não estiver):
   ```powershell
   cd "E:\Chute de Ouro\goldeouro-backend"
   ```

3. Execute o comando abaixo, substituindo `[NOVA_CHAVE_AQUI]` pela chave que você copiou:
   ```powershell
   flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="[NOVA_CHAVE_AQUI]" --app goldeouro-backend-v2
   ```

   **Exemplo:**
   ```powershell
   flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OSwiZXhwIjoyMDc1NTk2NjY5fQ.NOVA_ASSINATURA_AQUI" --app goldeouro-backend-v2
   ```

4. Pressione **Enter**
5. Você verá uma mensagem de sucesso

---

### **PASSO 4: Verificar se Funcionou**

1. Verifique o status da aplicação:
   ```powershell
   flyctl status --app goldeouro-backend-v2
   ```

2. Verifique o health check:
   ```powershell
   Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing | Select-Object -ExpandProperty Content
   ```

   Você deve ver algo como:
   ```json
   {"status":"ok","database":"connected",...}
   ```

3. Verifique os logs (opcional):
   ```powershell
   flyctl logs --app goldeouro-backend-v2
   ```

   Procure por mensagens como:
   - ✅ `[SUPABASE] Conectado com sucesso`
   - ❌ Se aparecer erros de autenticação, algo deu errado

---

### **PASSO 5: Testar Funcionalidades**

1. **Teste de Login:**
   - Acesse: https://goldeouro.lol
   - Tente fazer login
   - Se funcionar, está tudo OK ✅

2. **Teste de Pagamento (se aplicável):**
   - Tente criar um pagamento PIX
   - Verifique se está funcionando

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

Marque cada item conforme completar:

- [ ] Acessei o Supabase Dashboard
- [ ] Gerei nova Service Role Key
- [ ] Copiei a nova chave
- [ ] Atualizei o secret no Fly.io
- [ ] Verifiquei o status da aplicação
- [ ] Verifiquei o health check (deve mostrar "ok")
- [ ] Verifiquei os logs (sem erros de autenticação)
- [ ] Testei login no frontend
- [ ] Tudo funcionando corretamente

---

## 🚨 **SE ALGO DER ERRADO**

### **Problema: "Secret não atualizado"**
- Verifique se copiou a chave completa (ela é muito longa)
- Certifique-se de que está usando aspas duplas no comando
- Verifique se está usando o nome correto do app: `goldeouro-backend-v2`

### **Problema: "Erro de autenticação nos logs"**
- Verifique se copiou a chave corretamente (sem espaços extras)
- Tente gerar uma nova chave no Supabase e atualizar novamente
- Verifique se a chave antiga foi realmente invalidada

### **Problema: "Health check falhando"**
- Aguarde alguns minutos (a aplicação pode estar reiniciando)
- Verifique os logs: `flyctl logs --app goldeouro-backend-v2`
- Se persistir, verifique se a chave está correta

### **Precisa de Ajuda?**
- Verifique os logs: `flyctl logs --app goldeouro-backend-v2`
- Verifique o status: `flyctl status --app goldeouro-backend-v2`
- Consulte: `docs/auditorias/GUIA-ROTACAO-SECRETS-2025-11-12.md`

---

## 📝 **COMANDOS RÁPIDOS**

Copie e cole estes comandos (substitua `[NOVA_CHAVE]` pela chave real):

```powershell
# 1. Atualizar secret
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="[NOVA_CHAVE]" --app goldeouro-backend-v2

# 2. Verificar status
flyctl status --app goldeouro-backend-v2

# 3. Verificar health check
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing | Select-Object -ExpandProperty Content

# 4. Ver logs
flyctl logs --app goldeouro-backend-v2
```

---

## 🎯 **RESUMO**

1. ✅ Acesse Supabase Dashboard
2. ✅ Gere nova Service Role Key
3. ✅ Copie a nova chave
4. ✅ Execute: `flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="[NOVA_CHAVE]" --app goldeouro-backend-v2`
5. ✅ Verifique se está funcionando

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** Fácil  
**Urgência:** 🔴 Crítica

---

**Boa sorte! Se tiver dúvidas, consulte o guia completo em `docs/auditorias/GUIA-ROTACAO-SECRETS-2025-11-12.md`**

