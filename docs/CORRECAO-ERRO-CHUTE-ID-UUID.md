# 🔧 CORREÇÃO: Erro de Tipo UUID vs INTEGER

**Data:** 2025-01-12  
**Status:** ✅ **CORRIGIDO**

---

## ❌ Problema Identificado

Ao aplicar o schema de recompensas no Supabase, ocorreu o erro:

```
ERROR: 42804: foreign key constraint "rewards_chute_id_fkey" cannot be implemented 
DETAIL: Key columns "chute_id" and "id" are of incompatible types: integer and uuid.
```

---

## 🔍 Causa Raiz

A tabela `chutes` no Supabase usa `id UUID`, mas o schema de `rewards` estava definindo `chute_id INTEGER`.

---

## ✅ Correção Aplicada

### **1. Schema SQL Corrigido**

**Arquivo:** `database/schema-rewards.sql` e `database/schema-rewards-PARA-COPIAR.sql`

**Mudança:**
```sql
-- ❌ ANTES (ERRADO)
chute_id INTEGER REFERENCES public.chutes(id) ON DELETE SET NULL,

-- ✅ DEPOIS (CORRETO)
chute_id UUID REFERENCES public.chutes(id) ON DELETE SET NULL,
```

**Função RPC Corrigida:**
```sql
-- ❌ ANTES (ERRADO)
CREATE OR REPLACE FUNCTION public.rpc_register_reward(
    ...
    p_chute_id INTEGER,
    ...
)

-- ✅ DEPOIS (CORRETO)
CREATE OR REPLACE FUNCTION public.rpc_register_reward(
    ...
    p_chute_id UUID,
    ...
)
```

---

## 📋 Arquivos Corrigidos

1. ✅ `database/schema-rewards.sql`
2. ✅ `database/schema-rewards-PARA-COPIAR.sql`

---

## 🚀 Próximos Passos

1. **Copiar o schema corrigido** de `database/schema-rewards-PARA-COPIAR.sql`
2. **Aplicar no Supabase SQL Editor**
3. **Verificar sucesso** (deve aparecer "Success. No rows returned")

---

## ✅ Verificação

Após aplicar, execute:

```sql
-- Verificar tipo da coluna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rewards' AND column_name = 'chute_id';
-- Deve retornar: chute_id | uuid
```

---

**Status:** ✅ **PRONTO PARA REAPLICAR**

