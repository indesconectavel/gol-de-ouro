-- ROLLBACK DO BANCO - 2025-12-09_17-44-53
-- Este script restaura o estado do banco ANTES da Migration V19
--
-- ⚠️ ATENÇÃO: Execute apenas se necessário reverter a Migration V19
--

-- =====================================================
-- ROLLBACK DA MIGRATION V19
-- =====================================================

BEGIN;

-- Remover policies criadas pela V19
DROP POLICY IF EXISTS usuarios_select_own ON public.usuarios;
DROP POLICY IF EXISTS usuarios_insert_backend ON public.usuarios;
DROP POLICY IF EXISTS usuarios_update_own ON public.usuarios;
DROP POLICY IF EXISTS chutes_select_own ON public.chutes;
DROP POLICY IF EXISTS chutes_insert_backend ON public.chutes;
DROP POLICY IF EXISTS lotes_select_public ON public.lotes;
DROP POLICY IF EXISTS lotes_modify_backend ON public.lotes;
DROP POLICY IF EXISTS transacoes_select_own ON public.transacoes;
DROP POLICY IF EXISTS transacoes_insert_backend ON public.transacoes;
DROP POLICY IF EXISTS pagamentos_pix_select_own ON public.pagamentos_pix;
DROP POLICY IF EXISTS pagamentos_pix_modify_backend ON public.pagamentos_pix;
DROP POLICY IF EXISTS saques_select_own ON public.saques;
DROP POLICY IF EXISTS saques_modify_backend ON public.saques;
DROP POLICY IF EXISTS webhook_events_backend ON public.webhook_events;
DROP POLICY IF EXISTS rewards_select_own ON public.rewards;
DROP POLICY IF EXISTS rewards_modify_backend ON public.rewards;

-- Desabilitar RLS (se necessário)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chutes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_pix DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saques DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards DISABLE ROW LEVEL SECURITY;

-- Remover índices criados pela V19 (se necessário)
DROP INDEX IF EXISTS idx_chutes_usuario_id;
DROP INDEX IF EXISTS idx_chutes_lote_id;
DROP INDEX IF EXISTS idx_chutes_created_at;
DROP INDEX IF EXISTS idx_chutes_lote_created;
DROP INDEX IF EXISTS idx_transacoes_usuario_id;
DROP INDEX IF EXISTS idx_transacoes_created_at;
DROP INDEX IF EXISTS idx_transacoes_usuario_created;
DROP INDEX IF EXISTS idx_lotes_status_created;
DROP INDEX IF EXISTS idx_lotes_valor_status;
DROP INDEX IF EXISTS idx_usuarios_email;
DROP INDEX IF EXISTS idx_system_heartbeat_last_seen;
DROP INDEX IF EXISTS idx_system_heartbeat_instance;

-- Remover colunas adicionadas pela V19 (se necessário)
ALTER TABLE public.lotes DROP COLUMN IF EXISTS persisted_global_counter;
ALTER TABLE public.lotes DROP COLUMN IF EXISTS synced_at;
-- posicao_atual pode ser mantida se já existia

-- Remover tabela system_heartbeat
DROP TABLE IF EXISTS public.system_heartbeat;

-- Remover roles (se necessário)
DROP ROLE IF EXISTS backend;
DROP ROLE IF EXISTS observer;
DROP ROLE IF EXISTS admin;

COMMIT;

-- =====================================================
-- VERIFICAÇÃO PÓS-ROLLBACK
-- =====================================================
-- Execute estas queries para verificar:
--
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes');
--
-- SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
--
-- SELECT COUNT(*) FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'system_heartbeat';
--
