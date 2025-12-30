# 🔧 CORREÇÃO - CONSTRAINT STATUS TRANSACOES

## ❌ NOVO ERRO IDENTIFICADO

**Erro após adicionar colunas:**
```json
{
  "success": false,
  "error": "new row for relation \"transacoes\" violates check constraint \"transacoes_status_check\""
}
```

**Causa:**
O CHECK constraint `transacoes_status_check` na coluna `status` não permite o valor que a RPC está tentando inserir.

---

## ✅ SOLUÇÃO

### Verificar Constraint Atual

**No Supabase SQL Editor, execute:**

```sql
-- Verificar constraint atual
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.transacoes'::regclass
AND conname LIKE '%status%';
```

### Corrigir Constraint

**Aplicar o script abaixo:**

```sql
-- =====================================================
-- CORREÇÃO DO CONSTRAINT transacoes_status_check
-- =====================================================

DO $$
BEGIN
  -- Remover constraint antigo se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transacoes_status_check'
    AND conrelid = 'public.transacoes'::regclass
  ) THEN
    ALTER TABLE public.transacoes DROP CONSTRAINT transacoes_status_check;
    RAISE NOTICE 'Constraint transacoes_status_check removido';
  END IF;

  -- Adicionar novo constraint que permite todos os valores necessários
  ALTER TABLE public.transacoes
  ADD CONSTRAINT transacoes_status_check
  CHECK (status IN ('pendente', 'processado', 'cancelado', 'falhou', 'concluido', 'processando'));
  
  RAISE NOTICE 'Constraint transacoes_status_check atualizado com sucesso';
END $$;

-- Verificar constraint atualizado
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.transacoes'::regclass
AND conname = 'transacoes_status_check';
```

---

## 🔍 VALORES DE STATUS PERMITIDOS

Após aplicar a correção, os seguintes valores serão permitidos:
- ✅ `pendente` (padrão)
- ✅ `processado`
- ✅ `cancelado`
- ✅ `falhou`
- ✅ `concluido`
- ✅ `processando`

---

## 🧪 RETESTAR RPC

Após aplicar a correção, reteste a RPC:

```sql
SELECT public.rpc_deduct_balance(
  '4ddf8330-ae94-4e92-a010-bdc7fa254ad5'::UUID,
  5.00::DECIMAL,
  'Teste de débito'::TEXT,
  NULL::INTEGER,
  'aposta'::VARCHAR,
  false::BOOLEAN
);
```

**Resultado Esperado:**
```json
{
  "success": true,
  "old_balance": 50.00,
  "new_balance": 45.00,
  "transaction_id": 123,
  "amount": 5.00
}
```

---

## 📋 VERIFICAÇÃO COMPLETA

### 1. Verificar Colunas (JÁ FEITO ✅)
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'transacoes'
ORDER BY ordinal_position;
```

### 2. Verificar Constraints
```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.transacoes'::regclass;
```

### 3. Testar RPC
```sql
SELECT public.rpc_deduct_balance(
  '4ddf8330-ae94-4e92-a010-bdc7fa254ad5'::UUID,
  5.00::DECIMAL,
  'Teste'::TEXT,
  NULL::INTEGER,
  'aposta'::VARCHAR,
  false::BOOLEAN
);
```

---

## ⚠️ IMPORTANTE

- ✅ O script é seguro - só atualiza o constraint
- ✅ Não remove dados existentes
- ✅ Pode ser executado múltiplas vezes

---

**Data:** 2025-12-10 12:40 UTC  
**Status:** 🔧 CORREÇÃO DO CONSTRAINT NECESSÁRIA  
**Prioridade:** 🔴 ALTA - Bloqueia funcionamento da RPC

