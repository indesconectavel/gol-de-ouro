# 🔧 SOLUÇÃO - LOGIN free10signer@gmail.com

**Data:** 2025-12-13  
**Problema:** Não consegue fazer login  
**Email:** free10signer@gmail.com  
**Senha:** Free10signer

---

## ✅ SOLUÇÃO RÁPIDA (RECOMENDADA)

### Opção 1: Usar Script Node.js (Mais Seguro)

**Pré-requisito:** Configure as variáveis de ambiente primeiro

```powershell
# No PowerShell, configure as variáveis:
$env:SUPABASE_URL_PROD = "https://gayopagjdrkcmkirmfvy.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY_PROD = "sua-service-role-key-aqui"

# Depois execute:
node scripts/alterar-senha-usuario.js free10signer@gmail.com Free10signer
```

**Onde obter a SERVICE_ROLE_KEY:**
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto de PRODUÇÃO
3. Vá em: Settings → API
4. Copie a "service_role" key (secret)

---

### Opção 2: Executar SQL no Supabase (Alternativa)

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto de **PRODUÇÃO**
3. Vá em: SQL Editor
4. Execute o arquivo: `database/corrigir-login-free10signer-producao.sql`

**⚠️ IMPORTANTE:** O SQL não pode gerar hash bcrypt diretamente. Você precisa usar o script Node.js ou usar um hash pré-gerado.

---

### Opção 3: Usar Hash Pré-gerado (Funciona, mas menos seguro)

Execute no Supabase SQL Editor:

```sql
UPDATE usuarios
SET 
  senha_hash = '$2b$10$WFyA2yQB8NRw0MqUmirG2.qqqh.Ykw70l9McGRPYvDVN16gpleQRa',
  ativo = true,
  updated_at = NOW()
WHERE email = 'free10signer@gmail.com';
```

Este hash corresponde à senha `Free10signer`.

---

## 🧪 TESTAR LOGIN APÓS CORREÇÃO

### Via API (PowerShell):

```powershell
$body = @{
    email = "free10signer@gmail.com"
    password = "Free10signer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://goldeouro-backend-v2.fly.dev/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Via App Mobile:

1. Abrir app
2. Email: `free10signer@gmail.com`
3. Senha: `Free10signer`
4. Clicar em Login

---

## 📋 CHECKLIST

- [ ] Configurar variáveis de ambiente (SUPABASE_URL_PROD e SUPABASE_SERVICE_ROLE_KEY_PROD)
- [ ] Executar script de correção OU SQL no Supabase
- [ ] Verificar que campo `ativo` está como `true`
- [ ] Testar login via API
- [ ] Testar login via app mobile
- [ ] Confirmar que login funciona

---

## 🔍 VERIFICAR PROBLEMAS

Se ainda não funcionar após correção:

1. **Verificar se usuário existe:**
   ```sql
   SELECT * FROM usuarios WHERE email = 'free10signer@gmail.com';
   ```

2. **Verificar se conta está ativa:**
   ```sql
   SELECT email, ativo FROM usuarios WHERE email = 'free10signer@gmail.com';
   ```

3. **Verificar logs do backend:**
   - Acesse logs do Fly.io
   - Procure por erros de login

---

## ⚠️ IMPORTANTE

- Use sempre o ambiente de **PRODUÇÃO**
- Não altere outros dados do usuário
- Mantenha backup antes de alterar senha
- Teste imediatamente após correção

---

**Última atualização:** 2025-12-13

