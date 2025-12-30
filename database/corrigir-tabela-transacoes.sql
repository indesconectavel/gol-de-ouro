-- =====================================================
-- CORREÇÃO: Adicionar colunas referencia_id e referencia_tipo à tabela transacoes
-- =====================================================
-- Problema: A RPC rpc_deduct_balance tenta inserir referencia_id e referencia_tipo,
-- mas a tabela transacoes só tem a coluna referencia (VARCHAR)
-- =====================================================

-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
  -- Adicionar coluna referencia_id se não existir
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

  -- Adicionar coluna referencia_tipo se não existir
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

  -- Adicionar coluna tipo se não existir (alguns schemas podem ter 'debito'/'credito' em vez de tipos específicos)
  -- Verificar se a coluna tipo aceita 'debito' e 'credito'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transacoes' 
    AND column_name = 'tipo'
  ) THEN
    -- Verificar se o CHECK constraint permite 'debito' e 'credito'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.check_constraints cc
      JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
      WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'transacoes'
      AND ccu.column_name = 'tipo'
      AND cc.check_clause LIKE '%debito%'
    ) THEN
      -- Remover constraint antigo se existir
      ALTER TABLE public.transacoes DROP CONSTRAINT IF EXISTS transacoes_tipo_check;
      
      -- Adicionar novo constraint que aceita 'debito' e 'credito' além dos tipos existentes
      ALTER TABLE public.transacoes 
      ADD CONSTRAINT transacoes_tipo_check 
      CHECK (tipo IN ('deposito', 'saque', 'aposta', 'premio', 'bonus', 'cashback', 'debito', 'credito'));
      
      RAISE NOTICE 'Constraint da coluna tipo atualizado para incluir debito e credito';
    END IF;
  END IF;

END $$;

-- Comentários nas colunas
COMMENT ON COLUMN public.transacoes.referencia_id IS 'ID de referência da transação (ex: payment_id, saque_id)';
COMMENT ON COLUMN public.transacoes.referencia_tipo IS 'Tipo de referência (ex: deposito, aposta, premio)';

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

