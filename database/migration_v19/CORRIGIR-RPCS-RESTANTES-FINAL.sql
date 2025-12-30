-- =====================================================
-- CORREÇÃO FINAL DEFINITIVA: Remover TODAS as versões e recriar
-- Security Advisor Warning: Function Search Path Mutable
-- Funções: public.rpc_get_balance e public.rpc_deduct_balance
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Corrigir warnings restantes definitivamente
-- =====================================================

-- =====================================================
-- PARTE 1: REMOVER TODAS AS VERSÕES EXISTENTES
-- =====================================================

-- Remover TODAS as versões possíveis de rpc_get_balance
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc
        WHERE proname = 'rpc_get_balance'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.rpc_get_balance(%s)', func_record.args);
    END LOOP;
END $$;

-- Remover TODAS as versões possíveis de rpc_deduct_balance
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc
        WHERE proname = 'rpc_deduct_balance'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.rpc_deduct_balance(%s)', func_record.args);
    END LOOP;
END $$;

-- =====================================================
-- PARTE 2: RECRIAR COM SET search_path
-- =====================================================

-- RPC: Obter Saldo (RECRIAR COM SET search_path)
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

-- RPC: Deduzir Saldo (RECRIAR COM SET search_path)
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

-- =====================================================
-- PARTE 3: VERIFICAR E CONFIRMAR
-- =====================================================

-- Verificar se as funções foram criadas corretamente com SET search_path
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) LIKE '%SET search_path%' as has_search_path
FROM pg_proc
WHERE proname IN ('rpc_get_balance', 'rpc_deduct_balance')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Mensagem de sucesso
SELECT '✅ Funções rpc_get_balance e rpc_deduct_balance recriadas com SET search_path! Execute Rerun linter no Security Advisor.' AS resultado;

