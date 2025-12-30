# 🎯 PRÓXIMOS PASSOS IMEDIATOS - 18/11/2025

## ✅ O QUE JÁ FOI FEITO

1. ✅ Script de verificação executado no Supabase
2. ✅ Estrutura da tabela `rewards` confirmada (`usuario_id` UUID)
3. ✅ Scripts SQL criados e corrigidos

---

## 🔴 PRÓXIMOS PASSOS (ORDEM OBRIGATÓRIA)

### **PASSO 1: Verificar Estrutura das Tabelas Restantes** ⏱️ 2 min

**No Supabase SQL Editor, execute:**

```sql
-- Verificar estrutura de match_players
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'match_players'
ORDER BY ordinal_position;

-- Verificar estrutura de matches
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches'
ORDER BY ordinal_position;

-- Verificar estrutura de match_events
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'match_events'
ORDER BY ordinal_position;

-- Verificar estrutura de queue_board
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'queue_board'
ORDER BY ordinal_position;

-- Verificar estrutura de webhook_events
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'webhook_events'
ORDER BY ordinal_position;
```

**Objetivo:** Confirmar nomes exatos das colunas antes de aplicar RLS.

---

### **PASSO 2: Aplicar Correções RLS** ⏱️ 5 min

**No Supabase SQL Editor, execute:**

```sql
-- Arquivo: database/corrigir-rls-tabelas-publicas-FINAL.sql
-- Este script já está preparado com políticas seguras
```

**OU copie e cole o conteúdo completo de:**
- `database/corrigir-rls-tabelas-publicas-FINAL.sql`

**Verificação após aplicar:**
```sql
-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'webhook_events',
    'queue_board',
    'matches',
    'match_players',
    'match_events',
    'rewards'
  )
ORDER BY tablename;
```

**Resultado esperado:** Todas as 6 tabelas com `rls_enabled = true`

---

### **PASSO 3: Validar Security Advisor** ⏱️ 2 min

1. Acesse: **Security Advisor** no Supabase Dashboard
2. Clique em **"Rerun linter"**
3. Aguarde análise (pode levar 1-2 minutos)
4. Verifique se os **6 erros críticos** foram resolvidos

**Resultado esperado:** 
- ✅ 0 erros críticos de RLS
- ⚠️ Ainda terá 22 warnings de Function Search Path (próximo passo)

---

### **PASSO 4: Aplicar Correções Search Path** ⏱️ 15-20 min

**No Supabase SQL Editor, execute para cada função:**

Baseado na lista de 18 funções identificadas, execute:

```sql
-- Exemplo para cada função (substitua nome_da_funcao):
ALTER FUNCTION public.rpc_add_balance SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_deduct_balance SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_get_balance SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_transfer_balance SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_get_or_create_lote SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_update_lote_after_shot SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_get_active_lotes SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_register_reward SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_mark_reward_credited SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_get_user_rewards SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_register_webhook_event SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_mark_webhook_event_processed SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_check_webhook_event_processed SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_add_to_queue SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_remove_from_queue SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_get_next_players_from_queue SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_mark_players_matched SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_update_queue_heartbeat SET search_path = public, pg_catalog;

-- Funções de trigger também:
ALTER FUNCTION public.update_webhook_events_updated_at SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_queue_board_updated_at SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_matches_updated_at SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_match_players_updated_at SET search_path = public, pg_catalog;
```

**⚠️ IMPORTANTE:** Se alguma função não existir, pule para a próxima.

---

### **PASSO 5: Validar Security Advisor Final** ⏱️ 2 min

1. Acesse: **Security Advisor** no Supabase Dashboard
2. Clique em **"Rerun linter"**
3. Aguarde análise

**Resultado esperado:** 
- ✅ 0 erros críticos
- ✅ 0 warnings (ou apenas warnings menores não relacionados)

---

### **PASSO 6: Testar Backend** ⏱️ 5 min

**Após aplicar correções, testar se backend continua funcionando:**

```bash
# Testar health check
curl https://goldeouro-backend-v2.fly.dev/health

# Testar login (se possível)
# Testar criação de PIX
# Testar consulta de extrato
```

**Verificar logs:**
```bash
fly logs -a goldeouro-backend-v2 | tail -50
```

**Resultado esperado:** Sem erros relacionados a RLS ou acesso negado.

---

## 📋 CHECKLIST RÁPIDO

- [ ] **PASSO 1:** Verificar estrutura das tabelas restantes
- [ ] **PASSO 2:** Aplicar script RLS corrigido
- [ ] **PASSO 3:** Validar Security Advisor (0 erros RLS)
- [ ] **PASSO 4:** Aplicar correções search_path (18-22 funções)
- [ ] **PASSO 5:** Validar Security Advisor final (0 erros, 0 warnings)
- [ ] **PASSO 6:** Testar backend funcionando

---

## ⚠️ IMPORTANTE

1. **Backup:** Recomendado fazer backup antes de aplicar RLS (opcional, mas seguro)

2. **Teste Incremental:** Após cada passo, verificar se não quebrou nada

3. **Rollback:** Se algo der errado, você pode desabilitar RLS temporariamente:
   ```sql
   ALTER TABLE public.nome_tabela DISABLE ROW LEVEL SECURITY;
   ```

4. **Políticas Permissivas:** O script FINAL usa políticas mais permissivas (leitura pública) para não quebrar funcionalidades. Podem ser restringidas depois se necessário.

---

## 🎯 TEMPO TOTAL ESTIMADO

- **Mínimo:** 30 minutos
- **Máximo:** 45 minutos (com testes e validações)

---

## 📞 SE ALGO DER ERRADO

1. Verificar logs do Supabase
2. Verificar logs do Fly.io
3. Desabilitar RLS temporariamente se necessário
4. Revisar políticas criadas no Security Advisor

---

## ✅ RESULTADO FINAL ESPERADO

- ✅ Security Advisor: 0 erros, 0 warnings críticos
- ✅ Backend funcionando normalmente
- ✅ Sistema 100% seguro e pronto para produção

