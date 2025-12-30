-- ============================================================================
-- CORREÇÃO FINAL: Habilitar RLS nas tabelas públicas sem segurança
-- ============================================================================
-- Data: 2025-11-18
-- Versão: FINAL (corrigido após verificação de estrutura)
-- Problema: Security Advisor identificou 6 erros críticos de RLS Disabled
-- ============================================================================

-- IMPORTANTE: Execute database/verificar-colunas-tabelas.sql PRIMEIRO
-- para confirmar os nomes das colunas antes de aplicar este script.

-- ============================================================================
-- 1. HABILITAR RLS NAS TABELAS CRÍTICAS
-- ============================================================================

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CRIAR POLÍTICAS DE SEGURANÇA
-- ============================================================================

-- POLÍTICAS PARA WEBHOOK_EVENTS
-- Apenas o backend (service_role) pode acessar webhooks
DROP POLICY IF EXISTS "webhook_events_backend_only" ON public.webhook_events;
CREATE POLICY "webhook_events_backend_only" ON public.webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA QUEUE_BOARD
-- Usuários autenticados podem ler, apenas backend pode escrever
DROP POLICY IF EXISTS "queue_board_read_authenticated" ON public.queue_board;
CREATE POLICY "queue_board_read_authenticated" ON public.queue_board
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "queue_board_write_backend" ON public.queue_board;
CREATE POLICY "queue_board_write_backend" ON public.queue_board
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "queue_board_update_backend" ON public.queue_board;
CREATE POLICY "queue_board_update_backend" ON public.queue_board
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA MATCHES
-- Backend pode tudo, usuários podem ler partidas públicas
DROP POLICY IF EXISTS "matches_read_public" ON public.matches;
CREATE POLICY "matches_read_public" ON public.matches
  FOR SELECT
  USING (auth.role() = 'service_role' OR true); -- Permitir leitura pública por enquanto

DROP POLICY IF EXISTS "matches_write_backend" ON public.matches;
CREATE POLICY "matches_write_backend" ON public.matches
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA MATCH_PLAYERS
-- Backend pode tudo, usuários podem ler (dados públicos de partidas)
-- NOTA: Se a tabela tiver coluna de user_id, ajustar política abaixo
DROP POLICY IF EXISTS "match_players_read_public" ON public.match_players;
CREATE POLICY "match_players_read_public" ON public.match_players
  FOR SELECT
  USING (auth.role() = 'service_role' OR true); -- Permitir leitura pública por enquanto

DROP POLICY IF EXISTS "match_players_write_backend" ON public.match_players;
CREATE POLICY "match_players_write_backend" ON public.match_players
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA MATCH_EVENTS
-- Backend pode tudo, usuários podem ler eventos de partidas públicas
DROP POLICY IF EXISTS "match_events_read_public" ON public.match_events;
CREATE POLICY "match_events_read_public" ON public.match_events
  FOR SELECT
  USING (auth.role() = 'service_role' OR true); -- Permitir leitura pública por enquanto

DROP POLICY IF EXISTS "match_events_write_backend" ON public.match_events;
CREATE POLICY "match_events_write_backend" ON public.match_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA REWARDS (CRÍTICO - Sistema Financeiro)
-- Usuários podem ler apenas seus próprios rewards, backend pode tudo
-- CONFIRMADO: Coluna é usuario_id (UUID)
DROP POLICY IF EXISTS "rewards_read_own" ON public.rewards;
CREATE POLICY "rewards_read_own" ON public.rewards
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    usuario_id = auth.uid()
  );

DROP POLICY IF EXISTS "rewards_write_backend" ON public.rewards;
CREATE POLICY "rewards_write_backend" ON public.rewards
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 3. VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
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

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
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

