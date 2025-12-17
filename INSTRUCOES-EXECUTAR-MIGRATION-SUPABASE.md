# 📋 INSTRUÇÕES: Executar Migration Refresh Token no Supabase

**Data:** 2025-01-24  
**Migration:** `database/migration-refresh-token.sql`  
**Status:** ⏳ Pendente de Execução

---

## 🎯 QUAL PROJETO SUPABASE USAR?

### **✅ PROJETO DE PRODUÇÃO**

**Nome do Projeto:** `goldeouro-production`  
**URL:** `https://gayopagjdrkcmkirmfvy.supabase.co`  
**ID:** `gayopagjdrkcmkirmfvy`

**⚠️ IMPORTANTE:** Este é o projeto que o backend de produção está usando atualmente.

---

## 📝 PASSO A PASSO PARA EXECUTAR A MIGRATION

### **1. Acessar Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **`goldeouro-production`**

**Como identificar o projeto correto:**
- Nome: `goldeouro-production`
- URL contém: `gayopagjdrkcmkirmfvy`
- Região: AWS | sa-east-1 (São Paulo)

---

### **2. Abrir SQL Editor**

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** (botão verde no canto superior direito)

---

### **3. Copiar e Colar a Migration**

1. Abra o arquivo: `database/migration-refresh-token.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase

**Conteúdo da Migration:**
```sql
-- =====================================================
-- MIGRATION: Adicionar Refresh Token
-- =====================================================
-- Data: 2025-01-24
-- Status: HARDENING FINAL
-- Descrição: Adiciona coluna refresh_token na tabela usuarios
-- =====================================================

-- Adicionar coluna refresh_token se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'refresh_token'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN refresh_token TEXT;
        CREATE INDEX IF NOT EXISTS idx_usuarios_refresh_token ON public.usuarios(refresh_token);
        COMMENT ON COLUMN public.usuarios.refresh_token IS 'Refresh token JWT para renovação de acesso';
    END IF;
END $$;

-- Adicionar coluna last_login se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'last_login'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
```

---

### **4. Executar a Migration**

1. Clique no botão **"Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
2. Aguarde a execução (deve levar alguns segundos)
3. Verifique a mensagem de sucesso:
   ```
   Success. No rows returned
   ```

---

### **5. Validar a Migration**

Execute esta query para verificar se as colunas foram criadas:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'usuarios' 
AND column_name IN ('refresh_token', 'last_login')
ORDER BY column_name;
```

**Resultado Esperado:**
```
column_name     | data_type                   | is_nullable
----------------+-----------------------------+-------------
last_login      | timestamp with time zone    | YES
refresh_token   | text                        | YES
```

---

### **6. Verificar Índice**

Execute esta query para verificar se o índice foi criado:

```sql
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'usuarios' 
AND indexname = 'idx_usuarios_refresh_token';
```

**Resultado Esperado:**
```
indexname                      | indexdef
-------------------------------+------------------------------------------
idx_usuarios_refresh_token     | CREATE INDEX idx_usuarios_refresh_token ON public.usuarios USING btree (refresh_token)
```

---

## ✅ VALIDAÇÃO FINAL

### **Checklist de Validação:**

- [ ] Migration executada sem erros
- [ ] Coluna `refresh_token` existe na tabela `usuarios`
- [ ] Coluna `last_login` existe na tabela `usuarios`
- [ ] Índice `idx_usuarios_refresh_token` foi criado
- [ ] Query de validação retorna resultados esperados

---

## 🔍 VERIFICAÇÃO ALTERNATIVA (Via Table Editor)

Se preferir verificar visualmente:

1. No menu lateral, clique em **"Table Editor"**
2. Selecione a tabela **`usuarios`**
3. Verifique se as colunas aparecem:
   - `refresh_token` (tipo: text)
   - `last_login` (tipo: timestamp)

---

## ⚠️ IMPORTANTE

### **Segurança:**

- ✅ A migration é **idempotente** (pode ser executada múltiplas vezes sem problemas)
- ✅ Usa `IF NOT EXISTS` para evitar erros se já existir
- ✅ Não remove dados existentes
- ✅ Apenas adiciona colunas novas

### **Backup:**

Antes de executar (opcional, mas recomendado):
1. No Supabase Dashboard, vá em **"Database"** → **"Backups"**
2. Crie um backup manual (se disponível no seu plano)

---

## 🚨 EM CASO DE ERRO

### **Erro: "relation usuarios does not exist"**

**Causa:** Tabela `usuarios` não existe ainda.

**Solução:**
1. Execute primeiro o schema principal: `SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql`
2. Depois execute a migration de refresh token

### **Erro: "permission denied"**

**Causa:** Permissões insuficientes.

**Solução:**
1. Verifique se está usando a conta correta
2. Verifique se tem permissões de administrador no projeto
3. Tente executar via SQL Editor (não via API)

### **Erro: "column already exists"**

**Causa:** Coluna já existe (migration já foi executada).

**Solução:**
- ✅ Isso é normal! A migration é idempotente
- ✅ Pule para a validação (passo 5)

---

## 📞 PRÓXIMOS PASSOS

Após executar a migration com sucesso:

1. ✅ Marcar como concluído no checklist
2. ✅ Prosseguir para **Fase 2: Deploy Backend**
3. ✅ Validar refresh token funcionando após deploy

---

## 📋 RESUMO

**Projeto:** `goldeouro-production`  
**URL:** `https://gayopagjdrkcmkirmfvy.supabase.co`  
**Migration:** `database/migration-refresh-token.sql`  
**Tempo Estimado:** 5 minutos

**Status:** ⏳ **PENDENTE DE EXECUÇÃO**

---

*Documento gerado em: 2025-01-24*  
*Versão: 1.0*

