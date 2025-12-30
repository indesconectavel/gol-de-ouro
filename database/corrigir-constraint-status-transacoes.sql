-- =====================================================
-- CORREÇÃO DO CONSTRAINT transacoes_status_check
-- =====================================================
-- Problema: A RPC rpc_deduct_balance tenta inserir status = 'concluido',
-- mas o constraint atual não permite esse valor
-- =====================================================

-- Verificar constraint atual
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.transacoes'::regclass
AND conname LIKE '%status%';

-- Corrigir constraint
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
  -- Incluindo 'concluido' que a RPC usa
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

