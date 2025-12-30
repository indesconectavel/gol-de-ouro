-- =====================================================
-- SCHEMA: Persistência de Lotes Ativos - CORRIGIDO
-- =====================================================
-- Data: 2025-12-10
-- Status: CORRIGIDO - Remove funções antes de recriar
-- =====================================================

-- =====================================================
-- PARTE 1: REMOVER FUNÇÕES ANTIGAS (se existirem)
-- =====================================================

-- Remover todas as versões possíveis das funções
DROP FUNCTION IF EXISTS public.rpc_get_or_create_lote(VARCHAR, DECIMAL, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.rpc_get_or_create_lote(VARCHAR(100), DECIMAL(10,2), INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.rpc_update_lote_after_shot(VARCHAR, DECIMAL, DECIMAL, DECIMAL, BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_update_lote_after_shot(VARCHAR(100), DECIMAL(10,2), DECIMAL(10,2), DECIMAL(10,2), BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_get_active_lotes();

-- =====================================================
-- PARTE 2: EXECUTAR SCHEMA COMPLETO
-- =====================================================

-- Agora execute o conteúdo completo de:
-- database/schema-lotes-persistencia.sql
-- (copie e cole o conteúdo aqui ou execute o arquivo diretamente)

-- =====================================================
-- FIM
-- =====================================================

