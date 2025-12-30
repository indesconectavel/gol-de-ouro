# ✅ CORREÇÃO APLICADA: chute_id UUID

**Data:** 2025-01-12  
**Status:** ✅ **CORRIGIDO E PRONTO PARA APLICAR**

---

## 🔧 Problema Corrigido

O schema de recompensas estava usando `chute_id INTEGER`, mas a tabela `chutes` no Supabase usa `id UUID`.

**Erro original:**
```
ERROR: 42804: foreign key constraint "rewards_chute_id_fkey" cannot be implemented 
DETAIL: Key columns "chute_id" and "id" are of incompatible types: integer and uuid.
```

---

## ✅ Correções Aplicadas

### **1. Schema SQL**
- ✅ `database/schema-rewards.sql` - Corrigido
- ✅ `database/schema-rewards-PARA-COPIAR.sql` - Corrigido

**Mudança:**
- `chute_id INTEGER` → `chute_id UUID`
- `p_chute_id INTEGER` → `p_chute_id UUID` (na função RPC)

### **2. Service JavaScript**
- ✅ `services/rewardService.js` - Documentação corrigida

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
WHERE table_name = 'rewards' AND column_name = 'chute_id';
-- Deve retornar: chute_id | uuid

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
  AND kcu.column_name = 'chute_id';
-- Deve retornar: rewards_chute_id_fkey | rewards | chute_id | chutes | id
```

---

**Status:** ✅ **PRONTO PARA APLICAR NO SUPABASE**

