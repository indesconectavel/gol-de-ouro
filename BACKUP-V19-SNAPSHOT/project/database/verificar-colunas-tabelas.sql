-- ============================================================================
-- VERIFICAÇÃO: Estrutura das tabelas antes de aplicar RLS
-- ============================================================================
-- Execute este script PRIMEIRO para verificar os nomes corretos das colunas
-- ============================================================================

-- Verificar estrutura de match_players
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'match_players'
ORDER BY ordinal_position;

-- Verificar estrutura de matches
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches'
ORDER BY ordinal_position;

-- Verificar estrutura de match_events
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'match_events'
ORDER BY ordinal_position;

-- Verificar estrutura de queue_board
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'queue_board'
ORDER BY ordinal_position;

-- Verificar estrutura de webhook_events
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'webhook_events'
ORDER BY ordinal_position;

-- Verificar estrutura de rewards
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rewards'
ORDER BY ordinal_position;

