-- ============================================================================
-- CORREÇÃO: Function Search Path Mutable (22 Warnings)
-- ============================================================================
-- Data: 2025-11-18
-- Problema: Security Advisor identificou 22 warnings sobre funções sem
--           search_path definido, o que pode causar vulnerabilidades de segurança
--
-- Solução: Adicionar SET search_path = '' ou SET search_path = public, pg_catalog
--          em todas as funções RPC
-- ============================================================================

-- Lista de funções que precisam de correção (baseado nos warnings):
-- - public.rpc_transfer_balance
-- - public.rpc_get_or_create_lote
-- - public.update_webhook_events_updated_at
-- - public.rpc_register_webhook_event
-- - public.rpc_update_lote_after_shot
-- - public.rpc_get_active_lotes
-- - public.rpc_add_balance
-- - public.rpc_deduct_balance
-- - public.rpc_get_balance
-- - public.rpc_register_reward
-- - public.rpc_mark_reward_credited
-- - public.rpc_get_user_rewards
-- - public.rpc_mark_webhook_event_processed
-- - public.rpc_check_webhook_event_processed
-- - public.update_queue_board_updated_at
-- - public.update_matches_updated_at
-- - public.update_match_players_updated_at
-- - public.rpc_add_to_queue
-- - public.rpc_remove_from_queue
-- - public.rpc_get_next_players_from_queue
-- - public.rpc_mark_players_matched
-- - public.rpc_update_queue_heartbeat

-- IMPORTANTE: Este script precisa ser executado após verificar as definições
-- atuais das funções. Para cada função, adicionar no início:
--
-- CREATE OR REPLACE FUNCTION nome_da_funcao(...)
-- RETURNS tipo
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public, pg_catalog  -- ADICIONAR ESTA LINHA
-- AS $$
-- ...
-- $$;

-- Exemplo de correção para uma função:
-- ============================================================================

-- ANTES:
-- CREATE OR REPLACE FUNCTION public.rpc_add_balance(...)
-- RETURNS jsonb
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$...

-- DEPOIS:
-- CREATE OR REPLACE FUNCTION public.rpc_add_balance(...)
-- RETURNS jsonb
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public, pg_catalog  -- ADICIONAR
-- AS $$...

-- ============================================================================
-- SCRIPT PARA GERAR CORREÇÕES AUTOMÁTICAS
-- ============================================================================

-- Listar todas as funções que precisam de correção
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE 'rpc_%'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_proc p2
    WHERE p2.oid = p.oid
    AND pg_get_functiondef(p2.oid) LIKE '%SET search_path%'
  )
ORDER BY p.proname;

-- Para aplicar a correção, execute manualmente ALTER FUNCTION para cada uma:
-- ALTER FUNCTION public.nome_da_funcao SET search_path = public, pg_catalog;

-- OU recrie cada função adicionando SET search_path na definição

