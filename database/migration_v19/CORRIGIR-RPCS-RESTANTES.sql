-- =====================================================
-- CORREÇÃO FINAL: Adicionar SET search_path às 2 RPCs restantes
-- Security Advisor Warning: Function Search Path Mutable
-- Funções: public.rpc_get_balance e public.rpc_deduct_balance
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Corrigir warnings restantes
-- =====================================================

-- RPC: Obter Saldo (CORRIGIR)
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

-- RPC: Deduzir Saldo (CORRIGIR)
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

-- Mensagem de sucesso
SELECT '✅ Funções rpc_get_balance e rpc_deduct_balance corrigidas com SET search_path!' AS resultado;

