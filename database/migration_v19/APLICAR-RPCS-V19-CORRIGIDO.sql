-- =====================================================
-- APLICAR RPCs V19 - VERSÃO CORRIGIDA
-- Gol de Ouro Backend - Engine V19
-- =====================================================
-- Data: 2025-12-10
-- Versão: V19.0.0
-- Status: CORRIGIDO - Verifica estrutura antes de criar
-- 
-- Este arquivo aplica todas as RPCs V19 de forma segura,
-- verificando estrutura e corrigindo problemas antes de executar.
-- =====================================================

-- =====================================================
-- PARTE 1: CORRIGIR ESTRUTURA DE TABELAS (se necessário)
-- =====================================================

-- Garantir que tabela rewards tem todas as colunas
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

-- Garantir que tabela webhook_events tem todas as colunas
DO $$
BEGIN
    -- Adicionar coluna payment_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN payment_id VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
    
    -- Adicionar coluna idempotency_key se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN idempotency_key VARCHAR(255);
        -- Tentar adicionar constraint UNIQUE
        BEGIN
            ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_idempotency_key_unique UNIQUE (idempotency_key);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
END $$;

-- =====================================================
-- PARTE 2: REMOVER FUNÇÕES DUPLICADAS (se existirem)
-- =====================================================

-- Remover versões antigas das funções antes de recriar
DROP FUNCTION IF EXISTS public.rpc_get_or_create_lote(VARCHAR, DECIMAL, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.rpc_update_lote_after_shot(VARCHAR, DECIMAL, DECIMAL, DECIMAL, BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_get_active_lotes();

DROP FUNCTION IF EXISTS public.rpc_register_reward(UUID, VARCHAR, UUID, VARCHAR, DECIMAL, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.rpc_mark_reward_credited(INTEGER, UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.rpc_get_user_rewards(UUID, INTEGER, INTEGER, VARCHAR, VARCHAR);

DROP FUNCTION IF EXISTS public.rpc_register_webhook_event(VARCHAR, VARCHAR, VARCHAR, JSONB);
DROP FUNCTION IF EXISTS public.rpc_check_webhook_event_processed(VARCHAR);
DROP FUNCTION IF EXISTS public.rpc_mark_webhook_event_processed(INTEGER, JSONB, TEXT);

-- =====================================================
-- PARTE 3: APLICAR RPCs FINANCEIRAS
-- =====================================================

-- NOTA: Execute o arquivo database/rpc-financial-acid.sql completo
-- Este arquivo contém todas as 4 RPCs financeiras ACID

-- =====================================================
-- PARTE 4: APLICAR RPCs DE LOTES
-- =====================================================

-- NOTA: Execute o arquivo database/schema-lotes-persistencia.sql
-- Este arquivo contém as 3 RPCs de lotes

-- =====================================================
-- PARTE 5: APLICAR RPCs DE RECOMPENSAS
-- =====================================================

-- NOTA: Execute o arquivo database/schema-rewards.sql
-- Este arquivo contém as 3 RPCs de recompensas

-- =====================================================
-- PARTE 6: APLICAR RPCs DE WEBHOOK
-- =====================================================

-- NOTA: Execute o arquivo database/schema-webhook-events.sql
-- Este arquivo contém as 3 RPCs de webhook

-- =====================================================
-- PARTE 7: APLICAR SEARCH PATH (correção de segurança)
-- =====================================================

-- Aplicar search_path em todas as funções criadas
-- Execute: database/corrigir-search-path-TODAS-FUNCOES.sql

-- =====================================================
-- FIM DO ARQUIVO
-- =====================================================

SELECT 'Estrutura corrigida! Agora execute os arquivos SQL individuais de RPCs.' AS resultado;

