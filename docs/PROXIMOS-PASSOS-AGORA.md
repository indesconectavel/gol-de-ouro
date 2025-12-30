# 🎯 PRÓXIMOS PASSOS IMEDIATOS - STATUS ATUAL

## ✅ O QUE JÁ FOI FEITO

Pelos prints do Supabase, vejo que:
- ✅ Políticas RLS já foram criadas para várias tabelas
- ✅ 12 políticas visíveis nos resultados (match_events, match_players, matches, queue_board)
- ✅ Script de verificação de estrutura está sendo executado

---

## 🔍 VERIFICAÇÃO IMEDIATA (2 minutos)

**Execute no Supabase SQL Editor:**

```sql
-- Arquivo: database/verificar-status-rls.sql
-- OU copie e cole o conteúdo do arquivo acima
```

**Objetivo:** Confirmar exatamente o que já está aplicado e o que falta.

---

## 📋 PRÓXIMOS PASSOS BASEADOS NO STATUS

### **CENÁRIO 1: Se todas as 6 tabelas já têm RLS habilitado**

✅ **PASSO 1:** Validar Security Advisor (2 min)
- Acesse Security Advisor
- Clique em "Rerun linter"
- Verifique se os 6 erros críticos foram resolvidos

✅ **PASSO 2:** Aplicar correções search_path (15-20 min)
- Execute os `ALTER FUNCTION` para as 18 funções
- Ver instruções em `docs/PROXIMOS-PASSOS-IMEDIATOS.md`

✅ **PASSO 3:** Validação final (2 min)
- Rerun linter novamente
- Confirmar 0 erros, 0 warnings

---

### **CENÁRIO 2: Se ainda faltam tabelas sem RLS**

⚠️ **PASSO 1:** Completar aplicação RLS (5 min)
- Execute `database/corrigir-rls-tabelas-publicas-FINAL.sql`
- Verifique se todas as 6 tabelas têm RLS habilitado

⚠️ **PASSO 2:** Validar Security Advisor (2 min)
- Rerun linter
- Confirmar 0 erros de RLS

⚠️ **PASSO 3:** Aplicar correções search_path (15-20 min)
- Execute os `ALTER FUNCTION` para as 18 funções

⚠️ **PASSO 4:** Validação final (2 min)
- Rerun linter final
- Confirmar 0 erros, 0 warnings

---

## 🎯 AÇÃO IMEDIATA AGORA

### **1. Execute a verificação de status:**

```sql
-- Copie e cole no Supabase SQL Editor:

-- Verificar RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Desabilitado'
  END as status
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

### **2. Com base no resultado:**

**Se todas as 6 tabelas mostram "✅ RLS Habilitado":**
→ Pule para **PASSO 2** abaixo

**Se alguma tabela mostra "❌ RLS Desabilitado":**
→ Execute `database/corrigir-rls-tabelas-publicas-FINAL.sql` primeiro

---

## 📝 PRÓXIMOS PASSOS DETALHADOS

### **PASSO 1: Validar Security Advisor - RLS** ⏱️ 2 min

1. Acesse: **Security Advisor** no Supabase Dashboard
2. Clique em **"Rerun linter"**
3. Aguarde análise (1-2 minutos)
4. Verifique a aba **"Errors"**

**Resultado esperado:**
- ✅ 0 erros de "RLS Disabled in Public"
- ⚠️ Ainda terá warnings de "Function Search Path Mutable" (normal, próximo passo)

---

### **PASSO 2: Aplicar Correções Search Path** ⏱️ 15-20 min

**No Supabase SQL Editor, execute:**

```sql
-- Lista completa de funções que precisam correção
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

**⚠️ IMPORTANTE:** 
- Se alguma função não existir, você receberá um erro - apenas pule para a próxima
- Execute todas de uma vez ou uma por uma, conforme preferir

---

### **PASSO 3: Validar Security Advisor - Final** ⏱️ 2 min

1. Acesse: **Security Advisor** no Supabase Dashboard
2. Clique em **"Rerun linter"**
3. Aguarde análise completa

**Resultado esperado:**
- ✅ **Errors:** 0 erros críticos
- ✅ **Warnings:** 0 warnings (ou apenas warnings menores não relacionados)

---

### **PASSO 4: Testar Backend** ⏱️ 5 min

**Após aplicar todas as correções:**

```bash
# Testar health check
curl https://goldeouro-backend-v2.fly.dev/health

# Verificar logs para erros
fly logs -a goldeouro-backend-v2 | tail -50
```

**Verificar:**
- ✅ Health check retorna 200 OK
- ✅ Sem erros relacionados a RLS ou acesso negado nos logs
- ✅ Endpoints críticos funcionando (login, PIX, extrato)

---

## ✅ CHECKLIST RÁPIDO

- [ ] **AGORA:** Executar verificação de status RLS
- [ ] **Se necessário:** Completar aplicação RLS nas tabelas faltantes
- [ ] **PASSO 1:** Validar Security Advisor - RLS (0 erros)
- [ ] **PASSO 2:** Aplicar correções search_path (18-22 funções)
- [ ] **PASSO 3:** Validar Security Advisor - Final (0 erros, 0 warnings)
- [ ] **PASSO 4:** Testar backend funcionando

---

## 🎯 TEMPO TOTAL ESTIMADO

- **Mínimo:** 20 minutos (se RLS já está completo)
- **Máximo:** 30 minutos (se precisar aplicar RLS também)

---

## 📞 SE ALGO DER ERRADO

1. **Erro ao aplicar ALTER FUNCTION:**
   - Função não existe? → Pule para próxima
   - Outro erro? → Verifique nome exato da função

2. **Backend parou de funcionar:**
   - Verifique logs do Fly.io
   - Desabilite RLS temporariamente se necessário:
     ```sql
     ALTER TABLE public.nome_tabela DISABLE ROW LEVEL SECURITY;
     ```

3. **Security Advisor ainda mostra erros:**
   - Aguarde alguns minutos e execute "Rerun linter" novamente
   - Verifique se todas as políticas foram criadas corretamente

---

## 🎉 RESULTADO FINAL ESPERADO

- ✅ Security Advisor: **0 erros, 0 warnings críticos**
- ✅ Backend funcionando normalmente
- ✅ Sistema 100% seguro e pronto para produção
- ✅ **AGENT BROWSER MASTER PROMPT: 100% COMPLETO**

