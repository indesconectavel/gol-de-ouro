-- =====================================================
-- CORRIGIR ESTRUTURA COMPLETA V19 - UMA ÚNICA EXECUÇÃO
-- Gol de Ouro Backend - Engine V19
-- =====================================================
-- Data: 2025-12-10
-- Versão: V19.0.0
-- Status: CORREÇÃO COMPLETA - Executa tudo de uma vez
-- 
-- Este arquivo corrige TODA a estrutura V19 de uma vez,
-- garantindo que todas as tabelas e colunas existam antes
-- de criar índices e funções.
-- =====================================================

-- =====================================================
-- PARTE 1: GARANTIR TABELA webhook_events COMPLETA
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id SERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255),
    event_type VARCHAR(50),
    payment_id VARCHAR(255),
    raw_payload JSONB,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms INTEGER,
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar todas as colunas que podem estar faltando
DO $$
BEGIN
    -- idempotency_key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN idempotency_key VARCHAR(255);
    END IF;
    
    -- event_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'event_type'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN event_type VARCHAR(50);
    END IF;
    
    -- payment_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN payment_id VARCHAR(255);
    END IF;
    
    -- raw_payload
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'raw_payload'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN raw_payload JSONB;
    END IF;
    
    -- processed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'processed'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN processed BOOLEAN DEFAULT false;
    END IF;
    
    -- processed_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- processing_started_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'processing_started_at'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN processing_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- processing_duration_ms
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'processing_duration_ms'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN processing_duration_ms INTEGER;
    END IF;
    
    -- result
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'result'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN result JSONB;
    END IF;
    
    -- error_message
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'error_message'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN error_message TEXT;
    END IF;
    
    -- retry_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;
    
    -- created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Adicionar constraints se não existirem
DO $$
BEGIN
    -- Constraint UNIQUE em idempotency_key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'webhook_events_idempotency_key_unique'
    ) THEN
        BEGIN
            ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_idempotency_key_unique UNIQUE (idempotency_key);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
    
    -- NOT NULL em payment_id (se possível)
    BEGIN
        ALTER TABLE public.webhook_events ALTER COLUMN payment_id SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- NOT NULL em event_type (se possível)
    BEGIN
        ALTER TABLE public.webhook_events ALTER COLUMN event_type SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- NOT NULL em raw_payload (se possível)
    BEGIN
        ALTER TABLE public.webhook_events ALTER COLUMN raw_payload SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- =====================================================
-- PARTE 2: GARANTIR TABELA rewards COMPLETA
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.rewards (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    lote_id VARCHAR(100),
    chute_id UUID REFERENCES public.chutes(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('gol_normal', 'gol_de_ouro', 'bonus', 'promocao', 'outro')),
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'creditado', 'cancelado', 'falhou')),
    saldo_anterior DECIMAL(10,2),
    saldo_posterior DECIMAL(10,2),
    transacao_id UUID REFERENCES public.transacoes(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    credited_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas faltantes
DO $$
BEGIN
    -- chute_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rewards' 
        AND column_name = 'chute_id'
    ) THEN
        ALTER TABLE public.rewards ADD COLUMN chute_id UUID REFERENCES public.chutes(id) ON DELETE SET NULL;
    END IF;
    
    -- lote_id
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
-- PARTE 3: REMOVER TODAS AS FUNÇÕES DUPLICADAS
-- =====================================================

-- Remover todas as versões possíveis das funções
DROP FUNCTION IF EXISTS public.rpc_get_or_create_lote(VARCHAR, DECIMAL, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.rpc_get_or_create_lote(VARCHAR(100), DECIMAL(10,2), INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.rpc_update_lote_after_shot(VARCHAR, DECIMAL, DECIMAL, DECIMAL, BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_update_lote_after_shot(VARCHAR(100), DECIMAL(10,2), DECIMAL(10,2), DECIMAL(10,2), BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_get_active_lotes();

DROP FUNCTION IF EXISTS public.rpc_register_reward(UUID, VARCHAR, UUID, VARCHAR, DECIMAL, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.rpc_mark_reward_credited(INTEGER, UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.rpc_get_user_rewards(UUID, INTEGER, INTEGER, VARCHAR, VARCHAR);

DROP FUNCTION IF EXISTS public.rpc_register_webhook_event(VARCHAR, VARCHAR, VARCHAR, JSONB);
DROP FUNCTION IF EXISTS public.rpc_check_webhook_event_processed(VARCHAR);
DROP FUNCTION IF EXISTS public.rpc_mark_webhook_event_processed(INTEGER, JSONB, TEXT);

-- =====================================================
-- PARTE 4: CRIAR ÍNDICES (apenas se colunas existirem)
-- =====================================================

-- Índices para webhook_events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'idempotency_key') THEN
        CREATE INDEX IF NOT EXISTS idx_webhook_events_idempotency_key ON public.webhook_events(idempotency_key);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'payment_id') THEN
        CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON public.webhook_events(payment_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'processed') THEN
        CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'event_type') THEN
        CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'payment_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'processed') THEN
        CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_processed ON public.webhook_events(payment_id, processed);
    END IF;
END $$;

-- Índices para rewards
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'chute_id') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_chute_id ON public.rewards(chute_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'lote_id') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_lote_id ON public.rewards(lote_id);
    END IF;
END $$;

-- =====================================================
-- PARTE 5: CRIAR TRIGGER PARA webhook_events
-- =====================================================

-- Função do trigger
CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_webhook_events_updated_at_trigger ON public.webhook_events;

-- Criar trigger
CREATE TRIGGER update_webhook_events_updated_at_trigger
    BEFORE UPDATE ON public.webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_events_updated_at();

-- =====================================================
-- PARTE 6: MENSAGEM DE SUCESSO
-- =====================================================

SELECT '✅ Estrutura V19 corrigida com sucesso! Agora execute os arquivos de RPCs.' AS resultado;

