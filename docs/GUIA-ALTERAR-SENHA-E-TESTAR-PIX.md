# 🔐 GUIA: Alterar Senha e Testar PIX

## 📋 PASSO A PASSO

### **1. Executar SQL no Supabase** ⏳

**Arquivo SQL:** `database/alterar-senha-free10signer.sql`

**Ações:**
1. Abrir Supabase Dashboard
2. Navegar para SQL Editor
3. Abrir o arquivo: `database/alterar-senha-free10signer.sql`
4. Copiar e colar o SQL no editor
5. Executar o SQL (Run)
6. Verificar se retornou 1 linha atualizada

**SQL a executar:**
```sql
-- Alterar senha do usuário: free10signer@gmail.com
UPDATE usuarios
SET senha_hash = '$2b$10$WFyA2yQB8NRw0MqUmirG2.qqqh.Ykw70l9McGRPYvDVN16gpleQRa',
    updated_at = NOW()
WHERE email = 'free10signer@gmail.com';

-- Verificar se foi atualizado
SELECT id, email, username, updated_at
FROM usuarios
WHERE email = 'free10signer@gmail.com';
```

---

### **2. Executar Teste PIX** ⏳

Após executar o SQL, executar:

```bash
node scripts/testar-criar-pix.js free10signer@gmail.com Free10signer 1.00
```

---

## 🔧 ALTERNATIVA: Gerar Novo SQL

Se precisar gerar um novo hash (por exemplo, se a senha mudou):

```bash
node scripts/gerar-sql-alterar-senha.js [email] [novaSenha]
```

Exemplo:
```bash
node scripts/gerar-sql-alterar-senha.js free10signer@gmail.com Free10signer
```

---

## ✅ RESULTADO ESPERADO

Após executar o SQL e o teste:

```
✅ Login realizado com sucesso
✅ PIX criado com sucesso
✅ Código PIX presente
✅ QR Code presente
✅ Status consultado com sucesso
```

---

## 📄 ARQUIVOS CRIADOS

- ✅ `database/alterar-senha-free10signer.sql` - SQL para alterar senha
- ✅ `scripts/gerar-sql-alterar-senha.js` - Gerador de SQL com hash
- ✅ `scripts/alterar-senha-usuario.js` - Script Node.js (requer SUPABASE_SERVICE_ROLE_KEY)
- ✅ `scripts/alterar-senha-e-testar-pix.js` - Script completo (requer SUPABASE_SERVICE_ROLE_KEY)

---

**Status:** ⏳ **AGUARDANDO EXECUÇÃO DO SQL NO SUPABASE**

**Próxima Ação:** Executar o SQL em `database/alterar-senha-free10signer.sql` no Supabase SQL Editor

