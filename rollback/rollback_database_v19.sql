-- =====================================================
-- ROLLBACK DATABASE V19
-- =====================================================
-- Data: 2025-12-05
-- Versão: V19.0.0
-- Status: CONSERVADOR - Não remove dados, apenas objetos criados
-- =====================================================
-- ATENÇÃO: Este script reverte apenas estruturas criadas pela V19
-- Não remove dados existentes
-- =====================================================

BEGIN;

-- Remover índices criados pela V19
DROP INDEX IF EXISTS idx_chutes_usuario_id;
DROP INDEX IF EXISTS idx_chutes_lote_id;
DROP INDEX IF EXISTS idx_chutes_created_at;
DROP INDEX IF EXISTS idx_transacoes_usuario_id;
DROP INDEX IF EXISTS idx_transacoes_created_at;
DROP INDEX IF EXISTS idx_lotes_status_created;
DROP INDEX IF EXISTS idx_lotes_valor_status;
DROP INDEX IF EXISTS idx_usuarios_email;
DROP INDEX IF EXISTS idx_system_heartbeat_last_seen;
DROP INDEX IF EXISTS idx_system_heartbeat_instance;

-- Remover colunas adicionadas em lotes (CUIDADO: pode perder dados)
-- Descomente apenas se tiver certeza:
-- ALTER TABLE public.lotes DROP COLUMN IF EXISTS persisted_global_counter;
-- ALTER TABLE public.lotes DROP COLUMN IF EXISTS synced_at;
-- ALTER TABLE public.lotes DROP COLUMN IF EXISTS posicao_atual;

-- Remover tabela system_heartbeat (CUIDADO: perde dados de heartbeat)
-- Descomente apenas se tiver certeza:
-- DROP TABLE IF EXISTS public.system_heartbeat;

-- Remover policies (RLS permanece habilitado, mas sem policies)
DROP POLICY IF EXISTS usuarios_select_own ON public.usuarios;
DROP POLICY IF EXISTS usuarios_insert_backend ON public.usuarios;
DROP POLICY IF EXISTS usuarios_update_own ON public.usuarios;
DROP POLICY IF EXISTS chutes_select_own ON public.chutes;
DROP POLICY IF EXISTS chutes_insert_backend ON public.chutes;
DROP POLICY IF EXISTS chutes_update_backend ON public.chutes;
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

-- Desabilitar RLS (opcional - descomente se necessário)
-- ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chutes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lotes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transacoes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pagamentos_pix DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.saques DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.webhook_events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.rewards DISABLE ROW LEVEL SECURITY;

-- NOTA: RPC Functions não são removidas automaticamente por segurança
-- Para remover manualmente:
-- DROP FUNCTION IF EXISTS public.rpc_get_or_create_lote(...);
-- DROP FUNCTION IF EXISTS public.rpc_update_lote_after_shot(...);

COMMIT;

-- =====================================================
-- FIM DO ROLLBACK V19
-- =====================================================



