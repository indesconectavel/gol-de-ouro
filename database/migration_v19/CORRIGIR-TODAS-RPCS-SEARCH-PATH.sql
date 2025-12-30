-- =====================================================
-- CORREÇÃO COMPLETA: Adicionar SET search_path a TODAS as RPCs V19
-- Security Advisor Warning: Function Search Path Mutable
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Corrigir todos os warnings de segurança
-- =====================================================
-- Este script corrige TODAS as funções RPC V19 que estão sem SET search_path
-- =====================================================

-- =====================================================
-- PARTE 1: CORRIGIR RPCs FINANCEIRAS (4 funções)
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

  INSERT INTO public.transacoes (
    usuario_id, tipo, valor, descricao, referencia_id, referencia_tipo, saldo_anterior, saldo_posterior
  ) VALUES (
    p_user_id, 'credito', p_amount, p_description, p_reference_id, p_reference_type, v_old_balance, v_new_balance
  )
  RETURNING id INTO v_transaction_id;

  UPDATE public.usuarios
  SET saldo = v_new_balance, updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
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

  IF v_old_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  v_new_balance := v_old_balance - p_amount;

  INSERT INTO public.transacoes (
    usuario_id, tipo, valor, descricao, referencia_id, referencia_tipo, saldo_anterior, saldo_posterior
  ) VALUES (
    p_user_id, 'debito', p_amount, p_description, p_reference_id, p_reference_type, v_old_balance, v_new_balance
  )
  RETURNING id INTO v_transaction_id;

  UPDATE public.usuarios
  SET saldo = v_new_balance, updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
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
  v_from_balance DECIMAL(10,2);
  v_to_balance DECIMAL(10,2);
  v_from_new_balance DECIMAL(10,2);
  v_to_new_balance DECIMAL(10,2);
  v_transaction_id INTEGER;
  v_error TEXT;
BEGIN
  IF p_from_user_id IS NULL OR p_to_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User IDs são obrigatórios');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Valor deve ser maior que zero');
  END IF;

  IF p_from_user_id = p_to_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível transferir para o mesmo usuário');
  END IF;

  SELECT saldo INTO v_from_balance
  FROM public.usuarios
  WHERE id = p_from_user_id
  FOR UPDATE;

  SELECT saldo INTO v_to_balance
  FROM public.usuarios
  WHERE id = p_to_user_id
  FOR UPDATE;

  IF v_from_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário origem não encontrado');
  END IF;

  IF v_to_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário destino não encontrado');
  END IF;

  IF v_from_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  v_from_new_balance := v_from_balance - p_amount;
  v_to_new_balance := v_to_balance + p_amount;

  INSERT INTO public.transacoes (
    usuario_id, tipo, valor, descricao, referencia_id, referencia_tipo, saldo_anterior, saldo_posterior
  ) VALUES (
    p_from_user_id, 'transferencia_envio', p_amount, p_description, NULL, 'transferencia', v_from_balance, v_from_new_balance
  )
  RETURNING id INTO v_transaction_id;

  INSERT INTO public.transacoes (
    usuario_id, tipo, valor, descricao, referencia_id, referencia_tipo, saldo_anterior, saldo_posterior
  ) VALUES (
    p_to_user_id, 'transferencia_recebimento', p_amount, p_description, v_transaction_id, 'transferencia', v_to_balance, v_to_new_balance
  );

  UPDATE public.usuarios
  SET saldo = v_from_new_balance, updated_at = NOW()
  WHERE id = p_from_user_id;

  UPDATE public.usuarios
  SET saldo = v_to_new_balance, updated_at = NOW()
  WHERE id = p_to_user_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'from_user_id', p_from_user_id,
    'to_user_id', p_to_user_id,
    'amount', p_amount,
    'from_old_balance', v_from_balance,
    'from_new_balance', v_from_new_balance,
    'to_old_balance', v_to_balance,
    'to_new_balance', v_to_new_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- RPC: Obter Saldo
CREATE OR REPLACE FUNCTION public.rpc_get_balance(
  p_user_id UUID
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

  SELECT saldo INTO v_balance
  FROM public.usuarios
  WHERE id = p_user_id;

  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'balance', v_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- =====================================================
-- PARTE 2: CORRIGIR RPCs DE RECOMPENSAS (3 funções)
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
    SELECT * INTO v_reward
    FROM public.rewards
    WHERE id = p_reward_id
    FOR UPDATE;

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
        SELECT *
        FROM public.rewards
        WHERE usuario_id = p_usuario_id
        AND (p_tipo IS NULL OR tipo = p_tipo)
        AND (p_status IS NULL OR status = p_status)
        ORDER BY created_at DESC
        LIMIT p_limit
        OFFSET p_offset
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
-- PARTE 3: CORRIGIR RPCs DE WEBHOOK (3 funções)
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
    RETURN json_build_object(
      'success', true,
      'event_id', NULL,
      'processed', false,
      'exists', false
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'event_id', v_event_id,
    'processed', v_processed,
    'exists', true
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
  v_event_id INTEGER;
  v_error TEXT;
BEGIN
  IF p_event_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Event ID é obrigatório');
  END IF;

  UPDATE public.webhook_events
  SET 
    processed = true,
    processed_at = NOW(),
    result = p_result,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_event_id
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Evento não encontrado');
  END IF;

  RETURN json_build_object(
    'success', true,
    'event_id', v_event_id,
    'processed', true
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error);
END;
$$;

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

SELECT '✅ Todas as 10 funções RPC V19 corrigidas com SET search_path!' AS resultado;

