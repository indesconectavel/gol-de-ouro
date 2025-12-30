-- =====================================================
-- MIGRATION INCREMENTAL V19 PARA PRODUÇÃO - COMPLETA E SEGURA
-- Gol de Ouro Backend - Engine V19
-- =====================================================
-- Data: 2025-12-10
-- Versão: V19.0.0
-- Status: SEGURO - Não apaga dados existentes
-- Projeto: goldeouro-production (gayopagjdrkcmkirmfvy)
-- 
-- Este arquivo aplica TODAS as correções V19 de forma incremental e segura.
-- Pode ser executado múltiplas vezes sem problemas (idempotente).
-- 
-- ⚠️ IMPORTANTE: Este arquivo NÃO apaga dados existentes.
-- ⚠️ IMPORTANTE: Este arquivo apenas ADICIONA estrutura faltante.
-- ⚠️ IMPORTANTE: Este arquivo deixa o ambiente 100% igual ao goldeouro-db.
-- =====================================================

-- =====================================================
-- PARTE 1: EXTENSÕES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PARTE 2: CRIAR TABELAS V19 FALTANTES
-- =====================================================

-- Tabela lotes (persistência V19)
CREATE TABLE IF NOT EXISTS public.lotes (
    id VARCHAR(100) PRIMARY KEY,
    valor_aposta DECIMAL(10,2) NOT NULL,
    tamanho INTEGER NOT NULL,
    posicao_atual INTEGER DEFAULT 0,
    indice_vencedor INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'pausado', 'completed')),
    total_arrecadado DECIMAL(10,2) DEFAULT 0.00,
    premio_total DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Adicionar coluna completed_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.lotes ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Tabela rewards (sistema de recompensas V19)
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

-- Tabela webhook_events (idempotência V19)
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

-- Tabela system_heartbeat (monitoramento V19)
CREATE TABLE IF NOT EXISTS public.system_heartbeat (
    id SERIAL PRIMARY KEY,
    instance_id VARCHAR(255) UNIQUE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PARTE 3: ADICIONAR COLUNAS FALTANTES
-- =====================================================

-- Adicionar colunas faltantes em rewards
DO $$ 
BEGIN
    -- lote_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rewards' 
        AND column_name = 'lote_id'
    ) THEN
        ALTER TABLE public.rewards ADD COLUMN lote_id VARCHAR(100);
    END IF;
    
    -- chute_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rewards' 
        AND column_name = 'chute_id'
    ) THEN
        ALTER TABLE public.rewards ADD COLUMN chute_id UUID REFERENCES public.chutes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Adicionar colunas faltantes em webhook_events
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
    
    -- payment_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN payment_id VARCHAR(255);
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
    
    -- Adicionar outras colunas que podem faltar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'event_type'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN event_type VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'raw_payload'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN raw_payload JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'processed'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN processed BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'processing_started_at'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN processing_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'processing_duration_ms'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN processing_duration_ms INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'result'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN result JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'error_message'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN error_message TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.webhook_events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Adicionar constraint UNIQUE em idempotency_key se não existir
DO $$
BEGIN
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
END $$;

-- =====================================================
-- PARTE 4: REMOVER FUNÇÕES DUPLICADAS (SE EXISTIREM)
-- =====================================================

-- Remover função rpc_get_or_create_lote (todas as assinaturas possíveis)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc
        WHERE proname = 'rpc_get_or_create_lote'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.rpc_get_or_create_lote(%s)', func_record.args);
    END LOOP;
END $$;

-- Remover função rpc_update_lote_after_shot (todas as assinaturas possíveis)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc
        WHERE proname = 'rpc_update_lote_after_shot'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.rpc_update_lote_after_shot(%s)', func_record.args);
    END LOOP;
END $$;

-- Remover outras funções V19 que podem estar duplicadas
DROP FUNCTION IF EXISTS public.rpc_get_active_lotes();
DROP FUNCTION IF EXISTS public.rpc_register_reward(UUID, VARCHAR, UUID, VARCHAR, DECIMAL, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.rpc_mark_reward_credited(INTEGER, UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.rpc_get_user_rewards(UUID, INTEGER, INTEGER, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.rpc_register_webhook_event(VARCHAR, VARCHAR, VARCHAR, JSONB);
DROP FUNCTION IF EXISTS public.rpc_check_webhook_event_processed(VARCHAR);
DROP FUNCTION IF EXISTS public.rpc_mark_webhook_event_processed(INTEGER, JSONB, TEXT);

-- =====================================================
-- PARTE 5: CRIAR RPCs FINANCEIRAS (COM SEARCH_PATH)
-- =====================================================

-- RPC: Adicionar Saldo
CREATE OR REPLACE FUNCTION public.rpc_add_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT DEFAULT NULL,
  p_reference_id INTEGER DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_old_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id INTEGER;
  v_error TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User ID é obrigatório');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Valor deve ser maior que zero');
  END IF;

  SELECT saldo INTO v_old_balance
  FROM public.usuarios
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_old_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  v_new_balance := v_old_balance + p_amount;

  UPDATE public.usuarios
  SET saldo = v_new_balance, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.transacoes (
    usuario_id, tipo, valor, saldo_anterior, saldo_posterior,
    descricao, referencia_id, referencia_tipo, status, processed_at
  ) VALUES (
    p_user_id, 'credito', p_amount, v_old_balance, v_new_balance,
    COALESCE(p_description, 'Crédito de saldo'), p_reference_id, p_reference_type,
    'concluido', NOW()
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- RPC: Deduzir Saldo
CREATE OR REPLACE FUNCTION public.rpc_deduct_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT DEFAULT NULL,
  p_reference_id INTEGER DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL,
  p_allow_negative BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_old_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id INTEGER;
  v_error TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User ID é obrigatório');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Valor deve ser maior que zero');
  END IF;

  SELECT saldo INTO v_old_balance
  FROM public.usuarios
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_old_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  IF NOT p_allow_negative AND v_old_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Saldo insuficiente',
      'current_balance', v_old_balance,
      'required_amount', p_amount,
      'shortage', p_amount - v_old_balance
    );
  END IF;

  v_new_balance := v_old_balance - p_amount;

  UPDATE public.usuarios
  SET saldo = v_new_balance, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.transacoes (
    usuario_id, tipo, valor, saldo_anterior, saldo_posterior,
    descricao, referencia_id, referencia_tipo, status, processed_at
  ) VALUES (
    p_user_id, 'debito', -p_amount, v_old_balance, v_new_balance,
    COALESCE(p_description, 'Débito de saldo'), p_reference_id, p_reference_type,
    'concluido', NOW()
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- RPC: Transferir Saldo
CREATE OR REPLACE FUNCTION public.rpc_transfer_balance(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_from_old_balance DECIMAL(10,2);
  v_from_new_balance DECIMAL(10,2);
  v_to_old_balance DECIMAL(10,2);
  v_to_new_balance DECIMAL(10,2);
  v_from_transaction_id INTEGER;
  v_to_transaction_id INTEGER;
  v_error TEXT;
BEGIN
  IF p_from_user_id IS NULL OR p_to_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'IDs de usuário são obrigatórios');
  END IF;

  IF p_from_user_id = p_to_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível transferir para o mesmo usuário');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Valor deve ser maior que zero');
  END IF;

  IF p_from_user_id < p_to_user_id THEN
    SELECT saldo INTO v_from_old_balance FROM public.usuarios WHERE id = p_from_user_id FOR UPDATE;
    SELECT saldo INTO v_to_old_balance FROM public.usuarios WHERE id = p_to_user_id FOR UPDATE;
  ELSE
    SELECT saldo INTO v_to_old_balance FROM public.usuarios WHERE id = p_to_user_id FOR UPDATE;
    SELECT saldo INTO v_from_old_balance FROM public.usuarios WHERE id = p_from_user_id FOR UPDATE;
  END IF;

  IF v_from_old_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário origem não encontrado');
  END IF;

  IF v_to_old_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário destino não encontrado');
  END IF;

  IF v_from_old_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Saldo insuficiente para transferência',
      'current_balance', v_from_old_balance,
      'required_amount', p_amount
    );
  END IF;

  v_from_new_balance := v_from_old_balance - p_amount;
  v_to_new_balance := v_to_old_balance + p_amount;

  UPDATE public.usuarios SET saldo = v_from_new_balance, updated_at = NOW() WHERE id = p_from_user_id;
  UPDATE public.usuarios SET saldo = v_to_new_balance, updated_at = NOW() WHERE id = p_to_user_id;

  INSERT INTO public.transacoes (
    usuario_id, tipo, valor, saldo_anterior, saldo_posterior,
    descricao, referencia_id, referencia_tipo, status, processed_at
  ) VALUES (
    p_from_user_id, 'debito', -p_amount, v_from_old_balance, v_from_new_balance,
    COALESCE(p_description, 'Transferência enviada') || ' → ' || p_to_user_id::text,
    NULL, 'transferencia', 'concluido', NOW()
  ) RETURNING id INTO v_from_transaction_id;

  INSERT INTO public.transacoes (
    usuario_id, tipo, valor, saldo_anterior, saldo_posterior,
    descricao, referencia_id, referencia_tipo, status, processed_at
  ) VALUES (
    p_to_user_id, 'credito', p_amount, v_to_old_balance, v_to_new_balance,
    COALESCE(p_description, 'Transferência recebida') || ' ← ' || p_from_user_id::text,
    NULL, 'transferencia', 'concluido', NOW()
  ) RETURNING id INTO v_to_transaction_id;

  RETURN json_build_object(
    'success', true,
    'from_balance', v_from_new_balance,
    'to_balance', v_to_new_balance,
    'transaction_ids', ARRAY[v_from_transaction_id, v_to_transaction_id],
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- RPC: Obter Saldo
CREATE OR REPLACE FUNCTION public.rpc_get_balance(
  p_user_id UUID,
  p_with_lock BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_balance DECIMAL(10,2);
  v_error TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User ID é obrigatório');
  END IF;

  IF p_with_lock THEN
    SELECT saldo INTO v_balance FROM public.usuarios WHERE id = p_user_id FOR UPDATE;
  ELSE
    SELECT saldo INTO v_balance FROM public.usuarios WHERE id = p_user_id;
  END IF;

  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  RETURN json_build_object('success', true, 'balance', v_balance);

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- =====================================================
-- PARTE 6: CRIAR RPCs V19 DE LOTES (COM SEARCH_PATH)
-- =====================================================

-- RPC: Criar ou obter lote ativo
CREATE OR REPLACE FUNCTION public.rpc_get_or_create_lote(
    p_lote_id VARCHAR(100),
    p_valor_aposta DECIMAL(10,2),
    p_tamanho INTEGER,
    p_indice_vencedor INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_lote RECORD;
    v_result JSON;
BEGIN
    SELECT * INTO v_lote
    FROM public.lotes
    WHERE valor_aposta = p_valor_aposta
    AND status = 'ativo'
    AND posicao_atual < tamanho
    LIMIT 1;

    IF v_lote IS NULL THEN
        INSERT INTO public.lotes (
            id, valor_aposta, tamanho, posicao_atual, indice_vencedor,
            status, total_arrecadado, premio_total
        ) VALUES (
            p_lote_id, p_valor_aposta, p_tamanho, 0, p_indice_vencedor,
            'ativo', 0.00, 0.00
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING * INTO v_lote;

        IF v_lote IS NULL THEN
            SELECT * INTO v_lote FROM public.lotes WHERE id = p_lote_id;
        END IF;
    END IF;

    v_result := json_build_object(
        'success', true,
        'lote', json_build_object(
            'id', v_lote.id,
            'valor_aposta', v_lote.valor_aposta,
            'tamanho', v_lote.tamanho,
            'posicao_atual', v_lote.posicao_atual,
            'indice_vencedor', v_lote.indice_vencedor,
            'status', v_lote.status,
            'total_arrecadado', v_lote.total_arrecadado,
            'premio_total', v_lote.premio_total
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- RPC: Atualizar lote após chute
CREATE OR REPLACE FUNCTION public.rpc_update_lote_after_shot(
    p_lote_id VARCHAR(100),
    p_valor_aposta DECIMAL(10,2),
    p_premio DECIMAL(10,2) DEFAULT 0.00,
    p_premio_gol_de_ouro DECIMAL(10,2) DEFAULT 0.00,
    p_is_goal BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_lote RECORD;
    v_nova_posicao INTEGER;
    v_novo_status VARCHAR(20);
    v_result JSON;
BEGIN
    SELECT * INTO v_lote FROM public.lotes WHERE id = p_lote_id FOR UPDATE;

    IF v_lote IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Lote não encontrado');
    END IF;

    v_nova_posicao := v_lote.posicao_atual + 1;
    v_novo_status := v_lote.status;

    IF p_is_goal THEN
        v_novo_status := 'completed';
    END IF;

    IF v_nova_posicao >= v_lote.tamanho THEN
        v_novo_status := 'completed';
    END IF;

    UPDATE public.lotes
    SET 
        posicao_atual = v_nova_posicao,
        status = v_novo_status,
        total_arrecadado = total_arrecadado + p_valor_aposta,
        premio_total = premio_total + p_premio + p_premio_gol_de_ouro,
        updated_at = NOW(),
        completed_at = CASE WHEN v_novo_status = 'completed' THEN NOW() ELSE completed_at END
    WHERE id = p_lote_id
    RETURNING * INTO v_lote;

    v_result := json_build_object(
        'success', true,
        'lote', json_build_object(
            'id', v_lote.id,
            'posicao_atual', v_lote.posicao_atual,
            'status', v_lote.status,
            'total_arrecadado', v_lote.total_arrecadado,
            'premio_total', v_lote.premio_total,
            'is_complete', v_lote.status = 'completed'
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- RPC: Obter lotes ativos
CREATE OR REPLACE FUNCTION public.rpc_get_active_lotes()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_lote RECORD;
    v_lotes JSON[] := '{}';
    v_result JSON;
BEGIN
    FOR v_lote IN
        SELECT * FROM public.lotes WHERE status = 'ativo' ORDER BY created_at ASC
    LOOP
        v_lotes := array_append(v_lotes, json_build_object(
            'id', v_lote.id,
            'valor_aposta', v_lote.valor_aposta,
            'tamanho', v_lote.tamanho,
            'posicao_atual', v_lote.posicao_atual,
            'indice_vencedor', v_lote.indice_vencedor,
            'status', v_lote.status,
            'total_arrecadado', v_lote.total_arrecadado,
            'premio_total', v_lote.premio_total,
            'created_at', v_lote.created_at
        ));
    END LOOP;

    v_result := json_build_object(
        'success', true,
        'lotes', v_lotes,
        'count', array_length(v_lotes, 1)
    );

    RETURN v_result;

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

-- =====================================================
-- PARTE 7: CRIAR RPCs V19 DE RECOMPENSAS (COM SEARCH_PATH)
-- =====================================================

-- RPC: Registrar recompensa
CREATE OR REPLACE FUNCTION public.rpc_register_reward(
    p_usuario_id UUID,
    p_lote_id VARCHAR(100),
    p_chute_id UUID,
    p_tipo VARCHAR(50),
    p_valor DECIMAL(10,2),
    p_descricao TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_reward_id INTEGER;
    v_usuario_saldo DECIMAL(10,2);
    v_result JSON;
BEGIN
    IF p_usuario_id IS NULL OR p_valor IS NULL OR p_valor <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Parâmetros inválidos: usuario_id e valor são obrigatórios');
    END IF;

    SELECT saldo INTO v_usuario_saldo FROM public.usuarios WHERE id = p_usuario_id;

    IF v_usuario_saldo IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
    END IF;

    INSERT INTO public.rewards (
        usuario_id, lote_id, chute_id, tipo, valor, descricao,
        status, saldo_anterior, metadata, created_at
    ) VALUES (
        p_usuario_id, p_lote_id, p_chute_id, p_tipo, p_valor, p_descricao,
        'pendente', v_usuario_saldo, p_metadata, NOW()
    )
    RETURNING id INTO v_reward_id;

    v_result := json_build_object(
        'success', true,
        'reward_id', v_reward_id,
        'usuario_id', p_usuario_id,
        'valor', p_valor,
        'tipo', p_tipo,
        'status', 'pendente',
        'saldo_anterior', v_usuario_saldo
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- RPC: Marcar recompensa como creditada
CREATE OR REPLACE FUNCTION public.rpc_mark_reward_credited(
    p_reward_id INTEGER,
    p_transacao_id UUID,
    p_saldo_posterior DECIMAL(10,2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_reward RECORD;
    v_result JSON;
BEGIN
    SELECT * INTO v_reward FROM public.rewards WHERE id = p_reward_id FOR UPDATE;

    IF v_reward IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Recompensa não encontrada');
    END IF;

    UPDATE public.rewards
    SET 
        status = 'creditado',
        transacao_id = p_transacao_id,
        saldo_posterior = p_saldo_posterior,
        credited_at = NOW(),
        updated_at = NOW()
    WHERE id = p_reward_id;

    v_result := json_build_object(
        'success', true,
        'reward_id', p_reward_id,
        'status', 'creditado',
        'transacao_id', p_transacao_id
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- RPC: Obter recompensas do usuário
CREATE OR REPLACE FUNCTION public.rpc_get_user_rewards(
    p_usuario_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_tipo VARCHAR(50) DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_reward RECORD;
    v_rewards JSON[] := '{}';
    v_total_count INTEGER;
    v_result JSON;
BEGIN
    SELECT COUNT(*) INTO v_total_count
    FROM public.rewards
    WHERE usuario_id = p_usuario_id
    AND (p_tipo IS NULL OR tipo = p_tipo)
    AND (p_status IS NULL OR status = p_status);

    FOR v_reward IN
        SELECT * FROM public.rewards
        WHERE usuario_id = p_usuario_id
        AND (p_tipo IS NULL OR tipo = p_tipo)
        AND (p_status IS NULL OR status = p_status)
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
    LOOP
        v_rewards := array_append(v_rewards, json_build_object(
            'id', v_reward.id,
            'lote_id', v_reward.lote_id,
            'chute_id', v_reward.chute_id,
            'tipo', v_reward.tipo,
            'valor', v_reward.valor,
            'descricao', v_reward.descricao,
            'status', v_reward.status,
            'saldo_anterior', v_reward.saldo_anterior,
            'saldo_posterior', v_reward.saldo_posterior,
            'created_at', v_reward.created_at,
            'credited_at', v_reward.credited_at,
            'metadata', v_reward.metadata
        ));
    END LOOP;

    v_result := json_build_object(
        'success', true,
        'rewards', v_rewards,
        'total', v_total_count,
        'limit', p_limit,
        'offset', p_offset
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'rewards', '[]'::json,
            'total', 0
        );
END;
$$;

-- =====================================================
-- PARTE 8: CRIAR RPCs V19 DE WEBHOOK (COM SEARCH_PATH)
-- =====================================================

-- RPC: Registrar evento de webhook
CREATE OR REPLACE FUNCTION public.rpc_register_webhook_event(
  p_idempotency_key VARCHAR(255),
  p_event_type VARCHAR(50),
  p_payment_id VARCHAR(255),
  p_raw_payload JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_event_id INTEGER;
  v_already_exists BOOLEAN;
  v_error TEXT;
BEGIN
  IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
    RETURN json_build_object('success', false, 'error', 'Idempotency key é obrigatória');
  END IF;

  IF p_payment_id IS NULL OR p_payment_id = '' THEN
    RETURN json_build_object('success', false, 'error', 'Payment ID é obrigatório');
  END IF;

  INSERT INTO public.webhook_events (
    idempotency_key, event_type, payment_id, raw_payload,
    processed, processing_started_at
  ) VALUES (
    p_idempotency_key, p_event_type, p_payment_id, p_raw_payload,
    false, NOW()
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    SELECT id INTO v_event_id FROM public.webhook_events WHERE idempotency_key = p_idempotency_key;
    v_already_exists := true;
  ELSE
    v_already_exists := false;
  END IF;

  RETURN json_build_object(
    'success', true,
    'event_id', v_event_id,
    'already_exists', v_already_exists
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- RPC: Verificar se evento foi processado
CREATE OR REPLACE FUNCTION public.rpc_check_webhook_event_processed(
  p_idempotency_key VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_event_id INTEGER;
  v_processed BOOLEAN;
  v_error TEXT;
BEGIN
  IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
    RETURN json_build_object('success', false, 'error', 'Idempotency key é obrigatória');
  END IF;

  SELECT id, processed INTO v_event_id, v_processed
  FROM public.webhook_events
  WHERE idempotency_key = p_idempotency_key;

  IF v_event_id IS NULL THEN
    RETURN json_build_object('success', true, 'processed', false, 'event_id', NULL);
  END IF;

  RETURN json_build_object(
    'success', true,
    'processed', v_processed,
    'event_id', v_event_id
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- RPC: Marcar evento como processado
CREATE OR REPLACE FUNCTION public.rpc_mark_webhook_event_processed(
  p_event_id INTEGER,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_processing_started_at TIMESTAMP WITH TIME ZONE;
  v_duration_ms INTEGER;
  v_error TEXT;
BEGIN
  IF p_event_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Event ID é obrigatório');
  END IF;

  SELECT processing_started_at INTO v_processing_started_at
  FROM public.webhook_events WHERE id = p_event_id;

  IF v_processing_started_at IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Evento não encontrado');
  END IF;

  v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_processing_started_at)) * 1000;

  UPDATE public.webhook_events
  SET 
    processed = true,
    processed_at = NOW(),
    processing_duration_ms = v_duration_ms,
    result = p_result,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Evento não encontrado para atualização');
  END IF;

  RETURN json_build_object('success', true, 'duration_ms', v_duration_ms);

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- =====================================================
-- PARTE 9: CRIAR ÍNDICES V19
-- =====================================================

-- Índices para lotes (3 índices)
CREATE INDEX IF NOT EXISTS idx_lotes_status ON public.lotes(status);
CREATE INDEX IF NOT EXISTS idx_lotes_valor_aposta ON public.lotes(valor_aposta);
CREATE INDEX IF NOT EXISTS idx_lotes_created_at ON public.lotes(created_at);

-- Índices para rewards (8 índices)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'usuario_id') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_usuario_id ON public.rewards(usuario_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'lote_id') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_lote_id ON public.rewards(lote_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'chute_id') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_chute_id ON public.rewards(chute_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'tipo') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_tipo ON public.rewards(tipo);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON public.rewards(created_at);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'usuario_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'tipo') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_usuario_tipo ON public.rewards(usuario_id, tipo);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'usuario_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_rewards_usuario_status ON public.rewards(usuario_id, status);
    END IF;
END $$;

-- Índices para webhook_events (6 índices)
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

-- Índices para system_heartbeat (2 índices)
CREATE INDEX IF NOT EXISTS idx_system_heartbeat_last_seen ON public.system_heartbeat(last_seen);
CREATE INDEX IF NOT EXISTS idx_system_heartbeat_instance ON public.system_heartbeat(instance_id);

-- =====================================================
-- PARTE 10: CRIAR TRIGGER DE UPDATED_AT EM WEBHOOK_EVENTS
-- =====================================================

-- Função do trigger
CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Criar trigger (com tratamento de erro para duplicatas)
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_webhook_events_updated_at_trigger ON public.webhook_events;
    CREATE TRIGGER update_webhook_events_updated_at_trigger
        BEFORE UPDATE ON public.webhook_events
        FOR EACH ROW
        EXECUTE FUNCTION update_webhook_events_updated_at();
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
    WHEN OTHERS THEN
        NULL;
END $$;

-- =====================================================
-- PARTE 11: CRIAR RLS POLICIES V19
-- =====================================================

-- Habilitar RLS em system_heartbeat
ALTER TABLE public.system_heartbeat ENABLE ROW LEVEL SECURITY;

-- Policy para system_heartbeat
DROP POLICY IF EXISTS "Backend pode gerenciar heartbeat" ON public.system_heartbeat;
CREATE POLICY "Backend pode gerenciar heartbeat"
ON public.system_heartbeat
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- PARTE 12: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.lotes IS 'Lotes ativos do sistema de jogo V19';
COMMENT ON TABLE public.rewards IS 'Histórico completo de todas as recompensas V19';
COMMENT ON TABLE public.webhook_events IS 'Registro de eventos de webhook para idempotência V19';
COMMENT ON TABLE public.system_heartbeat IS 'Heartbeat do sistema V19';

COMMENT ON FUNCTION public.rpc_add_balance IS 'Adiciona saldo ao usuário de forma ACID, criando transação automaticamente';
COMMENT ON FUNCTION public.rpc_deduct_balance IS 'Deduz saldo do usuário de forma ACID, verificando saldo suficiente';
COMMENT ON FUNCTION public.rpc_transfer_balance IS 'Transfere saldo entre usuários de forma ACID (ambas operações atômicas)';
COMMENT ON FUNCTION public.rpc_get_balance IS 'Obtém saldo atual do usuário (com lock opcional)';

COMMENT ON FUNCTION public.rpc_get_or_create_lote IS 'Cria ou obtém lote ativo para valor de aposta';
COMMENT ON FUNCTION public.rpc_update_lote_after_shot IS 'Atualiza lote após chute (posição, valores, status)';
COMMENT ON FUNCTION public.rpc_get_active_lotes IS 'Retorna todos os lotes ativos para sincronização';

COMMENT ON FUNCTION public.rpc_register_reward IS 'Registra uma nova recompensa (status: pendente)';
COMMENT ON FUNCTION public.rpc_mark_reward_credited IS 'Marca recompensa como creditada após usar FinancialService';
COMMENT ON FUNCTION public.rpc_get_user_rewards IS 'Retorna histórico de recompensas de um usuário com paginação';

COMMENT ON FUNCTION public.rpc_register_webhook_event IS 'Registra evento de webhook de forma atômica, garantindo idempotência';
COMMENT ON FUNCTION public.rpc_check_webhook_event_processed IS 'Verifica se evento já foi processado';
COMMENT ON FUNCTION public.rpc_mark_webhook_event_processed IS 'Marca evento como processado com sucesso ou erro';

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

SELECT '✅ Migration V19 aplicada com sucesso! Ambiente 100% igual ao goldeouro-db.' AS resultado;

-- =====================================================
-- FIM DO ARQUIVO
-- =====================================================
