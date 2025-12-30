# 📋 INSTRUÇÕES PARA APLICAR MIGRATION V19
## Passo a Passo Completo

---

## ⚠️ IMPORTANTE

A migration V19 **DEVE** ser aplicada manualmente via Supabase Dashboard antes de continuar com as validações.

---

## 🔧 PASSO A PASSO

### 1. Acessar Supabase Dashboard

**URL:** https://supabase.com/dashboard/project/uatszaqzdqcwnfbipoxg/sql/new

**OU:**
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `uatszaqzdqcwnfbipoxg`
3. Clique em "SQL Editor" no menu lateral
4. Clique em "New query"

---

### 2. Abrir Arquivo de Migration

**Arquivo:** `prisma/migrations/20251205_v19_rls_indexes_migration.sql`

**Localização:** `E:\Chute de Ouro\goldeouro-backend\prisma\migrations\20251205_v19_rls_indexes_migration.sql`

---

### 3. Copiar Todo o Conteúdo

1. Abra o arquivo `20251205_v19_rls_indexes_migration.sql`
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)

---

### 4. Colar no SQL Editor

1. No Supabase SQL Editor, cole o conteúdo copiado
2. Verifique que o SQL está completo (deve ter ~587 linhas)
3. Verifique que começa com `BEGIN;` e termina com `COMMIT;`

---

### 5. Executar Migration

1. Clique no botão **"Run"** ou pressione **Ctrl+Enter**
2. Aguarde a execução completar
3. Verifique se há erros na saída

---

### 6. Validar Execução

**Execute no SQL Editor:**

```sql
-- Verificar se tabela system_heartbeat existe
SELECT * FROM public.system_heartbeat LIMIT 1;

-- Verificar se coluna persisted_global_counter existe
SELECT persisted_global_counter FROM public.lotes LIMIT 1;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes');
```

**Resultados esperados:**
- ✅ Tabela system_heartbeat existe
- ✅ Coluna persisted_global_counter existe
- ✅ RLS habilitado em todas as tabelas

---

### 7. Após Aplicar Migration

**Execute novamente as validações:**

```bash
node src/scripts/validate_heartbeat_v19.js
node src/scripts/validate_monitor_endpoint.js
node src/scripts/validate_metrics_endpoint.js
node src/scripts/validate_engine_v19_final.js
```

---

## ✅ CONFIRMAÇÃO

Após aplicar a migration, você deve ver:

- ✅ Mensagem de sucesso no SQL Editor
- ✅ Tabela system_heartbeat criada
- ✅ Colunas adicionadas em lotes
- ✅ RLS habilitado
- ✅ Policies criadas

---

**Gerado em:** 2025-12-05T20:57:00Z

