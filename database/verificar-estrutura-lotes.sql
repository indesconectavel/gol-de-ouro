-- =====================================================
-- VERIFICAR ESTRUTURA DA TABELA lotes
-- =====================================================
-- Objetivo: Descobrir quais colunas existem na tabela lotes
-- =====================================================

-- Verificar estrutura completa da tabela lotes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- Verificar lotes ativos e seus status
SELECT 
  id,
  valor as valor_aposta,
  status,
  created_at,
  updated_at,
  processed_at,
  completed_at
FROM lotes
WHERE status = 'ativo' OR status IS NULL
ORDER BY created_at DESC
LIMIT 10;

