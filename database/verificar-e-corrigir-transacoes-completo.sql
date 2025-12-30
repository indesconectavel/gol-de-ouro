-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO COMPLETA DA TABELA transacoes
-- =====================================================
-- Baseado na verificação do print, precisamos:
-- 1. Corrigir tipo de referencia_id (de VARCHAR para INTEGER)
-- 2. Adicionar colunas faltantes: saldo_anterior, saldo_posterior, metadata, processed_at
-- =====================================================

-- Verificar estrutura atual
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'transacoes'
ORDER BY ordinal_position;

-- =====================================================
-- CORREÇÕES NECESSÁRIAS
-- =====================================================

DO $$
BEGIN
  -- 1. Corrigir tipo de referencia_id (de VARCHAR para INTEGER)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transacoes' 
    AND column_name = 'referencia_id'
    AND data_type = 'character varying'
  ) THEN
    -- Converter valores existentes e alterar tipo
    ALTER TABLE public.transacoes 
    ALTER COLUMN referencia_id TYPE INTEGER USING NULLIF(referencia_id, '')::INTEGER;
    
    RAISE NOTICE 'Tipo de referencia_id alterado de VARCHAR para INTEGER';
  END IF;

  -- 2. Adicionar coluna saldo_anterior se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transacoes' 
    AND column_name = 'saldo_anterior'
  ) THEN
    ALTER TABLE public.transacoes 
    ADD COLUMN saldo_anterior DECIMAL(12,2);
    
    RAISE NOTICE 'Coluna saldo_anterior adicionada à tabela transacoes';
  END IF;

  -- 3. Adicionar coluna saldo_posterior se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transacoes' 
    AND column_name = 'saldo_posterior'
  ) THEN
    ALTER TABLE public.transacoes 
    ADD COLUMN saldo_posterior DECIMAL(12,2);
    
    RAISE NOTICE 'Coluna saldo_posterior adicionada à tabela transacoes';
  END IF;

  -- 4. Adicionar coluna metadata se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transacoes' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.transacoes 
    ADD COLUMN metadata JSONB;
    
    RAISE NOTICE 'Coluna metadata adicionada à tabela transacoes';
  END IF;

  -- 5. Adicionar coluna processed_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transacoes' 
    AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE public.transacoes 
    ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE 'Coluna processed_at adicionada à tabela transacoes';
  END IF;

  -- 6. Atualizar constraint da coluna tipo para aceitar 'debito' e 'credito'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transacoes' 
    AND column_name = 'tipo'
  ) THEN
    -- Remover constraint antigo se existir
    ALTER TABLE public.transacoes DROP CONSTRAINT IF EXISTS transacoes_tipo_check;
    
    -- Adicionar novo constraint que aceita 'debito' e 'credito' além dos tipos existentes
    ALTER TABLE public.transacoes 
    ADD CONSTRAINT transacoes_tipo_check 
    CHECK (tipo IN ('deposito', 'saque', 'aposta', 'premio', 'bonus', 'cashback', 'debito', 'credito'));
    
    RAISE NOTICE 'Constraint da coluna tipo atualizado para incluir debito e credito';
  END IF;

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

