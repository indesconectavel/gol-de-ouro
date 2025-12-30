-- ============================================================================
-- CORREÇÃO URGENTE: Habilitar RLS nas tabelas públicas sem segurança
-- ============================================================================
-- Data: 2025-11-18
-- Problema: Security Advisor do Supabase identificou 6 erros críticos:
--   - public.webhook_events (RLS Disabled)
--   - public.queue_board (RLS Disabled)
--   - public.matches (RLS Disabled)
--   - public.match_players (RLS Disabled)
--   - public.match_events (RLS Disabled)
--   - public.rewards (RLS Disabled)
--
-- Solução: Habilitar RLS e criar políticas básicas de segurança
-- ============================================================================

-- 1. HABILITAR RLS NAS TABELAS CRÍTICAS
-- ============================================================================

-- Webhook Events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Queue Board
ALTER TABLE public.queue_board ENABLE ROW LEVEL SECURITY;

-- Matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Match Players
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- Match Events
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Rewards (CRÍTICO - Sistema Financeiro)
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- 2. CRIAR POLÍTICAS DE SEGURANÇA BÁSICAS
-- ============================================================================

-- POLÍTICAS PARA WEBHOOK_EVENTS
-- Apenas o backend (service_role) pode inserir/ler webhooks
CREATE POLICY "webhook_events_backend_only" ON public.webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA QUEUE_BOARD
-- Usuários autenticados podem ler, apenas backend pode escrever
CREATE POLICY "queue_board_read_authenticated" ON public.queue_board
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "queue_board_write_backend" ON public.queue_board
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "queue_board_update_backend" ON public.queue_board
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA MATCHES
-- Usuários podem ler suas próprias partidas, backend pode tudo
-- NOTA: Verificar nome correto da coluna de user_id em match_players antes de aplicar
CREATE POLICY "matches_read_own" ON public.matches
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.match_players mp
      WHERE mp.match_id = matches.id
      AND (mp.user_id = auth.uid()::text OR mp.usuario_id = auth.uid()::text OR mp.player_id = auth.uid()::text)
    )
  );

CREATE POLICY "matches_write_backend" ON public.matches
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA MATCH_PLAYERS
-- Usuários podem ler seus próprios registros, backend pode tudo
-- NOTA: Verificar nome correto da coluna antes de aplicar (pode ser user_id, usuario_id ou player_id)
CREATE POLICY "match_players_read_own" ON public.match_players
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    (user_id = auth.uid()::text OR usuario_id = auth.uid()::text OR player_id = auth.uid()::text)
  );

CREATE POLICY "match_players_write_backend" ON public.match_players
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA MATCH_EVENTS
-- Usuários podem ler eventos de suas partidas, backend pode tudo
-- NOTA: Verificar nome correto da coluna antes de aplicar
CREATE POLICY "match_events_read_own_matches" ON public.match_events
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.match_players mp
      WHERE mp.match_id = match_events.match_id
      AND (mp.user_id = auth.uid()::text OR mp.usuario_id = auth.uid()::text OR mp.player_id = auth.uid()::text)
    )
  );

CREATE POLICY "match_events_write_backend" ON public.match_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLÍTICAS PARA REWARDS (CRÍTICO - Sistema Financeiro)
-- Usuários podem ler apenas seus próprios rewards, backend pode tudo
-- NOTA: Baseado nos schemas, a coluna correta é usuario_id (UUID)
CREATE POLICY "rewards_read_own" ON public.rewards
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    usuario_id = auth.uid()
  );

CREATE POLICY "rewards_write_backend" ON public.rewards
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
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

-- 4. VERIFICAR STATUS DO RLS
-- ============================================================================
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

