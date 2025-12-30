-- =====================================================
-- PATCH - AJUSTES BANCO V19
-- =====================================================
-- Data: 2025-12-10
-- Versão: V19.0.0
-- Auditor: AUDITOR SUPREMO V19 - STATE SCAN
-- 
-- Este script aplica todas as correções e ajustes necessários
-- para alinhar o banco de dados com o padrão oficial ENGINE V19.
-- 
-- ⚠️ IMPORTANTE: Este script é IDEMPOTENTE e pode ser executado múltiplas vezes.
-- =====================================================

-- =====================================================
-- SEÇÃO 1: VERIFICAR E CORRIGIR TABELA transacoes
-- =====================================================
-- Adiciona colunas faltantes e corrige constraint de status

DO $$ 
BEGIN
    -- Adicionar coluna referencia_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'referencia_id'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN referencia_id INTEGER;
        RAISE NOTICE 'Coluna referencia_id adicionada à tabela transacoes';
    END IF;

    -- Adicionar coluna referencia_tipo se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'referencia_tipo'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN referencia_tipo VARCHAR(50);
        RAISE NOTICE 'Coluna referencia_tipo adicionada à tabela transacoes';
    END IF;

    -- Adicionar coluna saldo_anterior se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'saldo_anterior'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN saldo_anterior DECIMAL(10,2);
        RAISE NOTICE 'Coluna saldo_anterior adicionada à tabela transacoes';
    END IF;

    -- Adicionar coluna saldo_posterior se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'saldo_posterior'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN saldo_posterior DECIMAL(10,2);
        RAISE NOTICE 'Coluna saldo_posterior adicionada à tabela transacoes';
    END IF;

    -- Adicionar coluna metadata se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna metadata adicionada à tabela transacoes';
    END IF;

    -- Adicionar coluna processed_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna processed_at adicionada à tabela transacoes';
    END IF;

    -- Remover constraint antigo se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND constraint_name = 'transacoes_status_check'
    ) THEN
        ALTER TABLE public.transacoes DROP CONSTRAINT transacoes_status_check;
        RAISE NOTICE 'Constraint transacoes_status_check antigo removido';
    END IF;

    -- Adicionar novo constraint com todos os valores permitidos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND constraint_name = 'transacoes_status_check'
    ) THEN
        ALTER TABLE public.transacoes ADD CONSTRAINT transacoes_status_check 
        CHECK (status IN ('pendente', 'processado', 'cancelado', 'falhou', 'concluido', 'processando'));
        RAISE NOTICE 'Constraint transacoes_status_check novo adicionado';
    END IF;
END $$;

-- =====================================================
-- SEÇÃO 2: APLICAR RPCs FINANCEIRAS
-- =====================================================
-- Aplica RPCs financeiras que não estão na migration principal
-- Arquivo fonte: database/rpc-financial-acid.sql

-- NOTA: As RPCs financeiras devem ser aplicadas do arquivo:
-- database/rpc-financial-acid.sql
-- 
-- Este arquivo contém:
-- - rpc_add_balance
-- - rpc_deduct_balance
-- - rpc_transfer_balance
-- - rpc_get_balance
--
-- Execute: \i database/rpc-financial-acid.sql
-- OU copie e cole o conteúdo do arquivo aqui

-- =====================================================
-- SEÇÃO 3: APLICAR RPCs DE RECOMPENSAS
-- =====================================================
-- Aplica RPCs de recompensas que não estão na migration principal
-- Arquivo fonte: database/schema-rewards.sql

-- NOTA: As RPCs de recompensas devem ser aplicadas do arquivo:
-- database/schema-rewards.sql
-- 
-- Este arquivo contém:
-- - rpc_register_reward
-- - rpc_mark_reward_credited
-- - rpc_get_user_rewards
--
-- Execute: \i database/schema-rewards.sql
-- OU copie e cole o conteúdo do arquivo aqui

-- =====================================================
-- SEÇÃO 4: APLICAR RPCs DE WEBHOOK
-- =====================================================
-- Aplica RPCs de webhook que não estão na migration principal
-- Arquivo fonte: database/schema-webhook-events.sql

-- NOTA: As RPCs de webhook devem ser aplicadas do arquivo:
-- database/schema-webhook-events.sql
-- 
-- Este arquivo contém:
-- - rpc_register_webhook_event
-- - rpc_check_webhook_event_processed
-- - rpc_mark_webhook_event_processed
--
-- Execute: \i database/schema-webhook-events.sql
-- OU copie e cole o conteúdo do arquivo aqui

-- =====================================================
-- SEÇÃO 5: ADICIONAR RPC rpc_get_active_lotes
-- =====================================================
-- Adiciona RPC que não está na migration principal

CREATE OR REPLACE FUNCTION public.rpc_get_active_lotes()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_lotes JSON;
    v_count INTEGER;
BEGIN
    -- Buscar lotes ativos
    SELECT 
        json_agg(
            json_build_object(
                'id', id,
                'valor_aposta', valor_aposta,
                'tamanho', tamanho,
                'indice_vencedor', indice_vencedor,
                'total_arrecadado', total_arrecadado,
                'premio_total', premio_total,
                'is_complete', is_complete,
                'ativo', ativo,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ),
        COUNT(*)
    INTO v_lotes, v_count
    FROM public.lotes
    WHERE ativo = true AND is_complete = false;

    -- Retornar resultado
    RETURN json_build_object(
        'success', true,
        'lotes', COALESCE(v_lotes, '[]'::json),
        'count', COALESCE(v_count, 0)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'lotes', '[]'::json,
            'count', 0
        );
END;
$$;

COMMENT ON FUNCTION public.rpc_get_active_lotes IS 'Retorna todos os lotes ativos do sistema';

-- =====================================================
-- SEÇÃO 6: VERIFICAR E CORRIGIR search_path DAS RPCs
-- =====================================================
-- Garante que todas as RPCs têm search_path correto

DO $$
DECLARE
    rpc_name TEXT;
    rpc_list TEXT[] := ARRAY[
        'rpc_add_balance',
        'rpc_deduct_balance',
        'rpc_transfer_balance',
        'rpc_get_balance',
        'rpc_get_or_create_lote',
        'rpc_update_lote_after_shot',
        'rpc_get_active_lotes',
        'rpc_register_reward',
        'rpc_mark_reward_credited',
        'rpc_get_user_rewards',
        'rpc_register_webhook_event',
        'rpc_check_webhook_event_processed',
        'rpc_mark_webhook_event_processed'
    ];
BEGIN
    FOREACH rpc_name IN ARRAY rpc_list
    LOOP
        -- Verificar se RPC existe
        IF EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = rpc_name
        ) THEN
            -- Atualizar search_path
            EXECUTE format('ALTER FUNCTION public.%I SET search_path = public, pg_catalog', rpc_name);
            RAISE NOTICE 'search_path atualizado para: %', rpc_name;
        ELSE
            RAISE WARNING 'RPC não encontrada: %', rpc_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- SEÇÃO 7: VERIFICAR ESTRUTURAS CRÍTICAS
-- =====================================================
-- Verifica se todas as estruturas críticas existem

DO $$
DECLARE
    v_missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Verificar tabela system_heartbeat
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'system_heartbeat'
    ) THEN
        v_missing := array_append(v_missing, 'system_heartbeat');
    END IF;

    -- Verificar tabela rewards
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'rewards'
    ) THEN
        v_missing := array_append(v_missing, 'rewards');
    END IF;

    -- Verificar tabela webhook_events
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'webhook_events'
    ) THEN
        v_missing := array_append(v_missing, 'webhook_events');
    END IF;

    -- Reportar tabelas faltantes
    IF array_length(v_missing, 1) > 0 THEN
        RAISE WARNING 'Tabelas faltantes: %', array_to_string(v_missing, ', ');
        RAISE WARNING 'Execute MIGRATION-V19-PARA-SUPABASE.sql para criar essas tabelas';
    ELSE
        RAISE NOTICE 'Todas as tabelas críticas existem';
    END IF;
END $$;

-- =====================================================
-- FIM DO PATCH
-- =====================================================
-- 
-- PRÓXIMOS PASSOS:
-- 
-- 1. Execute este script no Supabase SQL Editor
-- 2. Execute database/rpc-financial-acid.sql separadamente
-- 3. Execute database/schema-rewards.sql separadamente
-- 4. Execute database/schema-webhook-events.sql separadamente
-- 5. Verifique se todas as RPCs foram criadas corretamente
-- 
-- =====================================================

