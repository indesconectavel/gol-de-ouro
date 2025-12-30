-- =====================================================
-- SCHEMA: Sistema de Recompensas - CORRIGIDO
-- =====================================================
-- Data: 2025-12-10
-- Status: CORRIGIDO - Verifica colunas antes de criar índices
-- =====================================================

-- =====================================================
-- PARTE 1: GARANTIR COLUNAS EXISTEM
-- =====================================================

DO $$
BEGIN
    -- Adicionar coluna chute_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rewards' 
        AND column_name = 'chute_id'
    ) THEN
        ALTER TABLE public.rewards ADD COLUMN chute_id UUID REFERENCES public.chutes(id) ON DELETE SET NULL;
    END IF;
    
    -- Adicionar coluna lote_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rewards' 
        AND column_name = 'lote_id'
    ) THEN
        ALTER TABLE public.rewards ADD COLUMN lote_id VARCHAR(100);
    END IF;
END $$;

-- =====================================================
-- PARTE 2: REMOVER FUNÇÕES ANTIGAS
-- =====================================================

DROP FUNCTION IF EXISTS public.rpc_register_reward(UUID, VARCHAR, UUID, VARCHAR, DECIMAL, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.rpc_mark_reward_credited(INTEGER, UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.rpc_get_user_rewards(UUID, INTEGER, INTEGER, VARCHAR, VARCHAR);

-- =====================================================
-- PARTE 3: EXECUTAR SCHEMA COMPLETO
-- =====================================================

-- Agora execute o conteúdo completo de:
-- database/schema-rewards.sql
-- (copie e cole o conteúdo aqui ou execute o arquivo diretamente)

-- =====================================================
-- FIM
-- =====================================================

