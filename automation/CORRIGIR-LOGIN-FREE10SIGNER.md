# 🔧 CORRIGIR LOGIN - free10signer@gmail.com

**Data:** 2025-12-13  
**Problema:** Usuário não consegue fazer login  
**Email:** free10signer@gmail.com  
**Senha:** Free10signer

---

## 🔍 DIAGNÓSTICO

O usuário existe no banco de dados (confirmado no backup), mas não consegue fazer login. Possíveis causas:

1. **Senha hash incorreta** - O hash da senha pode não corresponder à senha atual
2. **Conta inativa** - Campo `ativo` pode estar como `false`
3. **Email com diferença de maiúsculas/minúsculas** - Problema de case sensitivity

---

## ✅ SOLUÇÃO 1: Executar SQL Direto no Supabase

Execute este SQL no Supabase SQL Editor (Production):

```sql
-- Verificar usuário atual
SELECT id, email, username, ativo, senha_hash, saldo 
FROM usuarios 
WHERE email = 'free10signer@gmail.com';

-- Corrigir senha (gerar novo hash)
UPDATE usuarios
SET 
  senha_hash = crypt('Free10signer', gen_salt('bf', 10)),
  updated_at = NOW(),
  ativo = true
WHERE email = 'free10signer@gmail.com';

-- Verificar após correção
SELECT id, email, username, ativo, saldo 
FROM usuarios 
WHERE email = 'free10signer@gmail.com';
```

**Nota:** Se `crypt` não estiver disponível, use o script Node.js abaixo.

---

## ✅ SOLUÇÃO 2: Usar Script Node.js

Execute o script criado:

```bash
node scripts/verificar-e-corrigir-login-free10signer.js
```

Este script:
1. Verifica se o usuário existe
2. Testa a senha atual
3. Corrige a senha se necessário
4. Testa o login após correção

---

## ✅ SOLUÇÃO 3: Usar Script Existente

Execute o script de alteração de senha existente:

```bash
node scripts/alterar-senha-usuario.js
```

Siga as instruções do script.

---

## 🧪 TESTAR LOGIN APÓS CORREÇÃO

Após corrigir, teste o login:

### Via API:

```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "free10signer@gmail.com",
    "password": "Free10signer"
  }'
```

### Via App Mobile:

1. Abrir app
2. Inserir email: `free10signer@gmail.com`
3. Inserir senha: `Free10signer`
4. Clicar em Login

---

## 📋 CHECKLIST

- [ ] Verificar se usuário existe no banco
- [ ] Verificar se campo `ativo` está como `true`
- [ ] Corrigir senha usando uma das soluções acima
- [ ] Testar login via API
- [ ] Testar login via app mobile
- [ ] Confirmar que login funciona

---

## ⚠️ IMPORTANTE

- Use sempre o ambiente de **PRODUÇÃO** (`SUPABASE_URL_PROD`)
- Não altere outros dados do usuário
- Mantenha backup antes de alterar senha
- Teste imediatamente após correção

---

**Última atualização:** 2025-12-13

