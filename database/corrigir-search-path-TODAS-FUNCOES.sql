-- ============================================================================
-- CORREÇÃO COMPLETA: Function Search Path Mutable (22 Warnings)
-- ============================================================================
-- Data: 2025-11-18
-- Status: Security Advisor mostra 0 erros, 22 warnings restantes
-- Objetivo: Corrigir todas as 22 funções de uma vez
-- ============================================================================

-- IMPORTANTE: Execute este script completo no Supabase SQL Editor
-- Todas as funções serão corrigidas de uma vez

-- ============================================================================
-- FUNÇÕES RPC FINANCEIRAS
-- ============================================================================

ALTER FUNCTION public.rpc_add_balance SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_deduct_balance SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_get_balance SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_transfer_balance SET search_path = public, pg_catalog;

-- ============================================================================
-- FUNÇÕES RPC DE LOTES
-- ============================================================================

ALTER FUNCTION public.rpc_get_or_create_lote SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_update_lote_after_shot SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_get_active_lotes SET search_path = public, pg_catalog;

-- ============================================================================
-- FUNÇÕES RPC DE REWARDS
-- ============================================================================

ALTER FUNCTION public.rpc_register_reward SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_mark_reward_credited SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_get_user_rewards SET search_path = public, pg_catalog;

-- ============================================================================
-- FUNÇÕES RPC DE WEBHOOKS
-- ============================================================================

ALTER FUNCTION public.rpc_register_webhook_event SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_mark_webhook_event_processed SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_check_webhook_event_processed SET search_path = public, pg_catalog;

-- ============================================================================
-- FUNÇÕES RPC DE FILA (se existirem)
-- ============================================================================

ALTER FUNCTION public.rpc_add_to_queue SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_remove_from_queue SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_get_next_players_from_queue SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_mark_players_matched SET search_path = public, pg_catalog;
ALTER FUNCTION public.rpc_update_queue_heartbeat SET search_path = public, pg_catalog;

-- ============================================================================
-- FUNÇÕES DE TRIGGER (UPDATE UPDATED_AT)
-- ============================================================================

ALTER FUNCTION public.update_webhook_events_updated_at SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_queue_board_updated_at SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_matches_updated_at SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_match_players_updated_at SET search_path = public, pg_catalog;
-- NOTA: update_match_events_updated_at não existe no banco, removida do script

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar funções corrigidas
SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN '✅ Corrigida'
    ELSE '❌ Falta corrigir'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE 'rpc_%' OR
    p.proname LIKE 'update_%_updated_at'
  )
ORDER BY p.proname;

-- ============================================================================
-- NOTA: Se alguma função não existir, você receberá um erro específico
-- Apenas pule para a próxima função ou remova a linha do script
-- ============================================================================

