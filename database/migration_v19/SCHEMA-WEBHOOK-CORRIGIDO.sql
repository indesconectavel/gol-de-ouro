-- =====================================================
-- SCHEMA: Webhook Events - CORRIGIDO
-- =====================================================
-- Data: 2025-12-10
-- Status: CORRIGIDO - Verifica colunas antes de criar índices
-- =====================================================

-- =====================================================
-- PARTE 1: GARANTIR COLUNAS EXISTEM
-- =====================================================

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
-- PARTE 2: REMOVER FUNÇÕES ANTIGAS
-- =====================================================

DROP FUNCTION IF EXISTS public.rpc_register_webhook_event(VARCHAR, VARCHAR, VARCHAR, JSONB);
DROP FUNCTION IF EXISTS public.rpc_check_webhook_event_processed(VARCHAR);
DROP FUNCTION IF EXISTS public.rpc_mark_webhook_event_processed(INTEGER, JSONB, TEXT);

-- =====================================================
-- PARTE 3: EXECUTAR SCHEMA COMPLETO
-- =====================================================

-- Agora execute o conteúdo completo de:
-- database/schema-webhook-events.sql
-- (copie e cole o conteúdo aqui ou execute o arquivo diretamente)

-- =====================================================
-- FIM
-- =====================================================

