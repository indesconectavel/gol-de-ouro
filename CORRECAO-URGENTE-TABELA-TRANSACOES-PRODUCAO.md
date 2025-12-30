# 🚨 CORREÇÃO URGENTE - TABELA TRANSACOES NO PROJETO DE PRODUÇÃO

## ❌ PROBLEMA IDENTIFICADO

**Erro ao executar RPC:**
```json
{
  "success": false,
  "error": "column \"referencia_id\" of relation \"transacoes\" does not exist"
}
```

**Causa:**
A tabela `transacoes` no projeto `goldeouro-production` não tem as colunas necessárias que a RPC `rpc_deduct_balance` precisa.

---

## ✅ SOLUÇÃO

### Aplicar Script SQL no Projeto de Produção

**1. Acessar Supabase SQL Editor:**
- Projeto: `goldeouro-production` (gayopagjdrkcmkirmfvy)
- Ir em: SQL Editor

**2. Executar o Script Abaixo:**

```sql
-- =====================================================
-- CORREÇÃO COMPLETA DA TABELA transacoes
-- Projeto: goldeouro-production
-- Data: 2025-12-10
-- =====================================================

DO $$
BEGIN
  -- 1. Adicionar coluna referencia_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transacoes'
    AND column_name = 'referencia_id'
  ) THEN
    ALTER TABLE public.transacoes
    ADD COLUMN referencia_id INTEGER;
    RAISE NOTICE 'Coluna referencia_id adicionada à tabela transacoes';
  ELSE
    RAISE NOTICE 'Coluna referencia_id já existe na tabela transacoes';
  END IF;

  -- 2. Adicionar coluna referencia_tipo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transacoes'
    AND column_name = 'referencia_tipo'
  ) THEN
    ALTER TABLE public.transacoes
    ADD COLUMN referencia_tipo VARCHAR(50);
    RAISE NOTICE 'Coluna referencia_tipo adicionada à tabela transacoes';
  ELSE
    RAISE NOTICE 'Coluna referencia_tipo já existe na tabela transacoes';
  END IF;

  -- 3. Adicionar coluna saldo_anterior se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transacoes'
    AND column_name = 'saldo_anterior'
  ) THEN
    ALTER TABLE public.transacoes
    ADD COLUMN saldo_anterior DECIMAL(12,2);
    RAISE NOTICE 'Coluna saldo_anterior adicionada à tabela transacoes';
  ELSE
    RAISE NOTICE 'Coluna saldo_anterior já existe na tabela transacoes';
  END IF;

  -- 4. Adicionar coluna saldo_posterior se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transacoes'
    AND column_name = 'saldo_posterior'
  ) THEN
    ALTER TABLE public.transacoes
    ADD COLUMN saldo_posterior DECIMAL(12,2);
    RAISE NOTICE 'Coluna saldo_posterior adicionada à tabela transacoes';
  ELSE
    RAISE NOTICE 'Coluna saldo_posterior já existe na tabela transacoes';
  END IF;

  -- 5. Adicionar coluna metadata se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transacoes'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.transacoes
    ADD COLUMN metadata JSONB;
    RAISE NOTICE 'Coluna metadata adicionada à tabela transacoes';
  ELSE
    RAISE NOTICE 'Coluna metadata já existe na tabela transacoes';
  END IF;

  -- 6. Adicionar coluna processed_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transacoes'
    AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE public.transacoes
    ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Coluna processed_at adicionada à tabela transacoes';
  ELSE
    RAISE NOTICE 'Coluna processed_at já existe na tabela transacoes';
  END IF;

  -- 7. Corrigir tipo de referencia_id se for VARCHAR
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transacoes'
    AND column_name = 'referencia_id'
    AND data_type = 'character varying'
  ) THEN
    ALTER TABLE public.transacoes
    ALTER COLUMN referencia_id TYPE INTEGER USING referencia_id::INTEGER;
    RAISE NOTICE 'Tipo de referencia_id alterado para INTEGER';
  END IF;

  -- 8. Atualizar CHECK constraint da coluna 'tipo'
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transacoes_tipo_check'
    AND conrelid = 'public.transacoes'::regclass
  ) THEN
    ALTER TABLE public.transacoes DROP CONSTRAINT transacoes_tipo_check;
    RAISE NOTICE 'Constraint transacoes_tipo_check removido';
  END IF;

  -- Adicionar novo constraint
  ALTER TABLE public.transacoes
  ADD CONSTRAINT transacoes_tipo_check
  CHECK (tipo IN ('deposito', 'saque', 'aposta', 'premio', 'bonus', 'cashback', 'debito', 'credito'));
  RAISE NOTICE 'Constraint transacoes_tipo_check atualizado';

END $$;

-- Comentários nas colunas
COMMENT ON COLUMN public.transacoes.referencia_id IS 'ID de referência da transação (ex: payment_id, saque_id)';
COMMENT ON COLUMN public.transacoes.referencia_tipo IS 'Tipo de referência (ex: deposito, aposta, premio)';
COMMENT ON COLUMN public.transacoes.saldo_anterior IS 'Saldo do usuário antes da transação';
COMMENT ON COLUMN public.transacoes.saldo_posterior IS 'Saldo do usuário após a transação';
COMMENT ON COLUMN public.transacoes.metadata IS 'Metadados adicionais da transação em formato JSON';

-- Verificar estrutura final
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'transacoes'
ORDER BY ordinal_position;
```

**3. Verificar Resultado:**

Após executar, você deve ver:
- Mensagens de sucesso para cada coluna adicionada
- Uma tabela mostrando todas as colunas da tabela `transacoes`

**4. Retestar a RPC:**

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

## 📋 COLUNAS QUE SERÃO ADICIONADAS

1. ✅ `referencia_id` (INTEGER) - ID de referência da transação
2. ✅ `referencia_tipo` (VARCHAR(50)) - Tipo de referência
3. ✅ `saldo_anterior` (DECIMAL(12,2)) - Saldo antes da transação
4. ✅ `saldo_posterior` (DECIMAL(12,2)) - Saldo após a transação
5. ✅ `metadata` (JSONB) - Metadados adicionais
6. ✅ `processed_at` (TIMESTAMP WITH TIME ZONE) - Data de processamento

---

## ⚠️ IMPORTANTE

- ✅ O script é **seguro** - só adiciona colunas se não existirem
- ✅ Não remove dados existentes
- ✅ Pode ser executado múltiplas vezes sem problemas
- ✅ Funciona mesmo se algumas colunas já existirem

---

## 🎯 APÓS APLICAR A CORREÇÃO

1. ✅ Retestar a RPC no SQL Editor
2. ✅ Se funcionar, retestar o endpoint `/api/games/shoot`
3. ✅ Verificar se o jogo está funcionando completamente

---

**Data:** 2025-12-10 12:35 UTC  
**Status:** 🚨 CORREÇÃO URGENTE NECESSÁRIA  
**Prioridade:** 🔴 ALTA - Bloqueia funcionamento do jogo

