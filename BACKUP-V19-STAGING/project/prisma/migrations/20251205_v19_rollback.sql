-- =====================================================
-- ROLLBACK MIGRATION V19
-- =====================================================
-- Data: 2025-12-05
-- Versão: V19.0.0
-- Status: ROLLBACK - Reverte alterações da migration V19
--
-- ATENÇÃO: Este script reverte as alterações da migration V19
-- Use apenas em caso de necessidade de rollback completo
-- =====================================================

BEGIN;

-- =====================================================
-- 1. REMOVER POLICIES
-- =====================================================

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

-- =====================================================
-- 2. DESABILITAR RLS (CUIDADO!)
-- =====================================================

-- ATENÇÃO: Desabilitar RLS remove proteção de segurança
-- Apenas execute se realmente necessário

-- ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chutes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lotes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transacoes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pagamentos_pix DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.saques DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.webhook_events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.rewards DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. REMOVER ÍNDICES (OPCIONAL - apenas se necessário)
-- =====================================================

-- DROP INDEX IF EXISTS idx_chutes_usuario_id;
-- DROP INDEX IF EXISTS idx_chutes_lote_id;
-- DROP INDEX IF EXISTS idx_chutes_created_at;
-- DROP INDEX IF EXISTS idx_chutes_lote_created;
-- DROP INDEX IF EXISTS idx_transacoes_usuario_id;
-- DROP INDEX IF EXISTS idx_transacoes_created_at;
-- DROP INDEX IF EXISTS idx_transacoes_usuario_created;
-- DROP INDEX IF EXISTS idx_lotes_status_created;
-- DROP INDEX IF EXISTS idx_lotes_valor_status;

-- =====================================================
-- 4. REMOVER COLUNAS ADICIONADAS (OPCIONAL)
-- =====================================================

-- ALTER TABLE public.lotes DROP COLUMN IF EXISTS persisted_global_counter;
-- ALTER TABLE public.lotes DROP COLUMN IF EXISTS synced_at;

-- =====================================================
-- 5. REMOVER TABELA system_heartbeat (OPCIONAL)
-- =====================================================

-- DROP TABLE IF EXISTS public.system_heartbeat;

-- =====================================================
-- 6. REMOVER ROLES (OPCIONAL - apenas se não usados)
-- =====================================================

-- DROP ROLE IF EXISTS backend;
-- DROP ROLE IF EXISTS observer;
-- DROP ROLE IF EXISTS admin;

COMMIT;

-- =====================================================
-- FIM DO ROLLBACK V19
-- =====================================================
-- NOTA: Este script está comentado para segurança
-- Descomente apenas as seções necessárias para rollback parcial
-- =====================================================

