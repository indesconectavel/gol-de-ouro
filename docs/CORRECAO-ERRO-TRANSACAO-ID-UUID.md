# 🔧 CORREÇÃO: Erro de Tipo UUID vs INTEGER (transacao_id)

**Data:** 2025-01-12  
**Status:** ✅ **CORRIGIDO**

---

## ❌ Problema Identificado

Ao aplicar o schema de recompensas no Supabase, ocorreu o erro:

```
ERROR: 42804: foreign key constraint "rewards_transacao_id_fkey" cannot be implemented 
DETAIL: Key columns "transacao_id" and "id" are of incompatible types: integer and uuid.
```

---

## 🔍 Causa Raiz

A tabela `transacoes` no Supabase usa `id UUID`, mas o schema de `rewards` estava definindo `transacao_id INTEGER`.

---

## ✅ Correção Aplicada

### **1. Schema SQL Corrigido**

**Arquivo:** `database/schema-rewards.sql` e `database/schema-rewards-PARA-COPIAR.sql`

**Mudança na Tabela:**
```sql
-- ❌ ANTES (ERRADO)
transacao_id INTEGER REFERENCES public.transacoes(id) ON DELETE SET NULL,

-- ✅ DEPOIS (CORRETO)
transacao_id UUID REFERENCES public.transacoes(id) ON DELETE SET NULL,
```

**Mudança na Função RPC:**
```sql
-- ❌ ANTES (ERRADO)
CREATE OR REPLACE FUNCTION public.rpc_mark_reward_credited(
    p_reward_id INTEGER,
    p_transacao_id INTEGER,
    p_saldo_posterior DECIMAL(10,2)
)

-- ✅ DEPOIS (CORRETO)
CREATE OR REPLACE FUNCTION public.rpc_mark_reward_credited(
    p_reward_id INTEGER,
    p_transacao_id UUID,
    p_saldo_posterior DECIMAL(10,2)
)
```

---

## 📋 Arquivos Corrigidos

1. ✅ `database/schema-rewards.sql`
2. ✅ `database/schema-rewards-PARA-COPIAR.sql`

**Nota:** O `rewardService.js` já estava correto, pois usa o `transactionId` retornado pelo `FinancialService.addBalance()`, que já retorna UUID.

---

## 🚀 Próximo Passo

**Aplicar o schema corrigido no Supabase:**

1. Abra `database/schema-rewards-PARA-COPIAR.sql`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no Supabase SQL Editor
4. Execute (CTRL + Enter)
5. Deve aparecer: **Success. No rows returned**

---

## ✅ Verificação Pós-Aplicação

Execute no Supabase SQL Editor:

```sql
-- Verificar tipo da coluna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rewards' AND column_name = 'transacao_id';
-- Deve retornar: transacao_id | uuid

-- Verificar foreign key
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'rewards'
  AND kcu.column_name = 'transacao_id';
-- Deve retornar: rewards_transacao_id_fkey | rewards | transacao_id | transacoes | id
```

---

**Status:** ✅ **PRONTO PARA REAPLICAR**


