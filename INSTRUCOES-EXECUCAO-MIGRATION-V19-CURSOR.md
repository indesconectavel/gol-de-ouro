# 📋 INSTRUÇÕES PARA EXECUTAR MIGRATION V19
## Gerado pelo Cursor - Modo Seguro (DRY-RUN)

---

## ⚠️ IMPORTANTE

Este documento foi gerado em **modo seguro (DRY-RUN)**.

**Nenhuma alteração foi aplicada automaticamente.**

Para aplicar as mudanças, siga as instruções abaixo **manualmente** no Supabase Dashboard.

---

## 📁 ARQUIVOS SQL GERADOS

Os seguintes arquivos SQL foram gerados e estão prontos para execução:

1. **`logs/v19_cursor_run/migration_sql/roles.sql`**
   - Cria roles: backend, engine, observer, admin, user_app
   - Idempotente (pode ser executado múltiplas vezes)

2. **`logs/v19_cursor_run/migration_sql/rls_policies.sql`**
   - Habilita RLS nas tabelas críticas
   - Cria policies de segurança
   - Idempotente

3. **`logs/v19_cursor_run/migration_sql/functions_indices.sql`**
   - Cria índices de performance
   - Cria tabela system_heartbeat
   - Adiciona colunas em lotes
   - Cria/atualiza RPC functions
   - Idempotente

---

## 🎯 PASSO A PASSO PARA APLICAR MIGRATION

### PASSO 1: Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/uatszaqzdqcwnfbipoxg/sql/new
2. OU navegue manualmente:
   - Acesse: https://supabase.com/dashboard
   - Selecione o projeto: **uatszaqzdqcwnfbipoxg**
   - Clique em **"SQL Editor"** no menu lateral
   - Clique em **"New query"** (ou `Ctrl+N`)

---

### PASSO 2: Executar Roles (Módulo A)

1. Abra o arquivo: `logs/v19_cursor_run/migration_sql/roles.sql`
2. Copie TODO o conteúdo (`Ctrl+A`, `Ctrl+C`)
3. Cole no SQL Editor do Supabase (`Ctrl+V`)
4. Clique em **"Run"** (ou `Ctrl+Enter`)
5. Aguarde mensagem de sucesso

**Resultado esperado:**
- ✅ Mensagens: "Role X criada" ou "Role X já existe"
- ✅ Nenhum erro vermelho

---

### PASSO 3: Executar RLS + Policies (Módulo B)

1. Abra o arquivo: `logs/v19_cursor_run/migration_sql/rls_policies.sql`
2. Copie TODO o conteúdo (`Ctrl+A`, `Ctrl+C`)
3. Cole no SQL Editor do Supabase (`Ctrl+V`)
4. Clique em **"Run"** (ou `Ctrl+Enter`)
5. Aguarde mensagem de sucesso

**Resultado esperado:**
- ✅ Mensagens: "RLS habilitado em X"
- ✅ Nenhum erro vermelho
- ✅ Policies criadas/atualizadas

---

### PASSO 4: Executar Functions + Índices (Módulo C)

1. Abra o arquivo: `logs/v19_cursor_run/migration_sql/functions_indices.sql`
2. Copie TODO o conteúdo (`Ctrl+A`, `Ctrl+C`)
3. Cole no SQL Editor do Supabase (`Ctrl+V`)
4. Clique em **"Run"** (ou `Ctrl+Enter`)
5. Aguarde mensagem de sucesso

**Resultado esperado:**
- ✅ Índices criados
- ✅ Tabela system_heartbeat criada
- ✅ Colunas adicionadas em lotes
- ✅ RPC functions criadas/atualizadas
- ✅ Nenhum erro vermelho

---

### PASSO 5: Validar Execução

Execute estas queries no SQL Editor para validar:

#### 5.1 Verificar Tabela system_heartbeat

```sql
SELECT * FROM system_heartbeat LIMIT 1;
```

**Resultado esperado:** Query executa sem erro

#### 5.2 Verificar Colunas em lotes

```sql
SELECT persisted_global_counter, synced_at, posicao_atual 
FROM lotes 
LIMIT 1;
```

**Resultado esperado:** Query executa sem erro

#### 5.3 Verificar RLS Habilitado

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes');
```

**Resultado esperado:** Todas com `rowsecurity = true`

#### 5.4 Verificar Policies

```sql
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

**Resultado esperado:** Múltiplas policies listadas

#### 5.5 Verificar RPC Functions

```sql
SELECT proname 
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
AND proname IN ('rpc_get_or_create_lote', 'rpc_update_lote_after_shot');
```

**Resultado esperado:** Functions listadas

---

### PASSO 6: Reexecutar Validações

Após aplicar todas as migrations, execute:

```bash
node src/scripts/validar_pos_migration_v19.js
```

**Resultado esperado:**
- ✅ Todas as tabelas existem
- ✅ Todas as colunas existem
- ✅ RLS habilitado
- ✅ Policies criadas
- ✅ RPC Functions existem

---

## 🔄 ROLLBACK (SE NECESSÁRIO)

Se precisar reverter as mudanças:

1. Abra o arquivo: `rollback/rollback_database_v19.sql`
2. Revise o conteúdo (algumas operações estão comentadas por segurança)
3. Execute no Supabase SQL Editor
4. Valide reversão

**⚠️ ATENÇÃO:** Rollback remove estruturas criadas, mas não remove dados. Algumas operações estão comentadas por segurança.

---

## 📊 RELATÓRIOS DISPONÍVEIS

- **`logs/v19_cursor_run/prechecks.json`** - Resultado dos prechecks
- **`logs/v19_cursor_run/validation/report.json`** - Validação completa (JSON)
- **`logs/v19_cursor_run/validation/report.md`** - Validação completa (Markdown)

---

## ✅ CHECKLIST FINAL

Após aplicar todas as migrations:

- [ ] Roles criadas (backend, engine, observer, admin, user_app)
- [ ] RLS habilitado em todas as tabelas críticas
- [ ] Policies criadas para todas as tabelas
- [ ] Índices criados
- [ ] Tabela system_heartbeat criada
- [ ] Colunas adicionadas em lotes
- [ ] RPC Functions criadas/atualizadas
- [ ] Validações reexecutadas com sucesso
- [ ] Servidor reiniciado (se necessário)
- [ ] Endpoints /monitor e /metrics funcionando

---

## 🎯 CONCLUSÃO

**Status Atual:** ⚠️ **SQL GERADO, MIGRATION NÃO APLICADA**

**Próximos passos:**
1. Aplicar migrations manualmente seguindo os passos acima
2. Validar execução bem-sucedida
3. Reexecutar validações
4. Confirmar ENGINE V19 100% funcional

---

**Gerado em:** 2025-12-05T22:45:00Z  
**Versão:** V19.0.0  
**Modo:** Safe Mode (DRY-RUN)



