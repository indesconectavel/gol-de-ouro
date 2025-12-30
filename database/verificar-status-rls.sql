-- ============================================================================
-- VERIFICAÇÃO COMPLETA DO STATUS RLS
-- ============================================================================
-- Execute este script para verificar o status atual das correções RLS
-- ============================================================================

-- 1. VERIFICAR SE RLS ESTÁ HABILITADO NAS 6 TABELAS CRÍTICAS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Desabilitado'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'webhook_events',
    'queue_board',
    'matches',
    'match_players',
    'match_events',
    'rewards'
  )
ORDER BY tablename;

-- 2. VERIFICAR POLÍTICAS CRIADAS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Leitura'
    WHEN cmd = 'INSERT' THEN 'Inserção'
    WHEN cmd = 'UPDATE' THEN 'Atualização'
    WHEN cmd = 'DELETE' THEN 'Exclusão'
    WHEN cmd = 'ALL' THEN 'Todas operações'
    ELSE cmd
  END as operacao
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'webhook_events',
    'queue_board',
    'matches',
    'match_players',
    'match_events',
    'rewards'
  )
ORDER BY tablename, policyname;

-- 3. RESUMO POR TABELA
SELECT 
  tablename,
  COUNT(*) as total_politicas,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as politicas_leitura,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as politicas_insercao,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as politicas_atualizacao,
  COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) as politicas_todas
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'webhook_events',
    'queue_board',
    'matches',
    'match_players',
    'match_events',
    'rewards'
  )
GROUP BY tablename
ORDER BY tablename;

