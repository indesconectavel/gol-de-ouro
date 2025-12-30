-- =====================================================
-- CORREÇÃO CRÍTICA - RPC DEDUCT BALANCE
-- =====================================================
-- PROBLEMA: A tabela transacoes tem id como UUID,
-- mas a RPC declara v_transaction_id como INTEGER
-- 
-- ERRO: "invalid input syntax for type integer: \"7942b74a-f601-4acf-80e1-0051af8c2201\""
-- 
-- SOLUÇÃO: Alterar v_transaction_id de INTEGER para UUID
-- =====================================================

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
SET search_path = public
AS $$
DECLARE
  v_old_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id UUID;  -- ✅ CORRIGIDO: Mudado de INTEGER para UUID
  v_error TEXT;
BEGIN
  -- Validar parâmetros
  IF p_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User ID é obrigatório'
    );
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Valor deve ser maior que zero'
    );
  END IF;

  -- Iniciar transação implícita com lock de linha
  SELECT saldo INTO v_old_balance
  FROM public.usuarios
  WHERE id = p_user_id
  FOR UPDATE; -- 🔒 LOCK: Garante que nenhuma outra operação modifique este saldo simultaneamente

  -- Verificar se usuário existe
  IF v_old_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Verificar saldo suficiente (se não permitir negativo)
  IF NOT p_allow_negative AND v_old_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Saldo insuficiente',
      'current_balance', v_old_balance,
      'required_amount', p_amount,
      'shortage', p_amount - v_old_balance
    );
  END IF;

  -- Calcular novo saldo
  v_new_balance := v_old_balance - p_amount;

  -- Atualizar saldo do usuário (dentro da mesma transação)
  UPDATE public.usuarios
  SET saldo = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Criar registro de transação (dentro da mesma transação)
  INSERT INTO public.transacoes (
    usuario_id,
    tipo,
    valor,
    saldo_anterior,
    saldo_posterior,
    descricao,
    referencia_id,
    referencia_tipo,
    status,
    processed_at
  ) VALUES (
    p_user_id,
    'debito',
    -p_amount, -- Valor negativo para débito
    v_old_balance,
    v_new_balance,
    COALESCE(p_description, 'Débito de saldo'),
    p_reference_id,
    p_reference_type,
    'concluido',
    NOW()
  ) RETURNING id INTO v_transaction_id;  -- ✅ Agora funciona: UUID vai para variável UUID

  -- Retornar sucesso com dados
  RETURN json_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id::TEXT,  -- ✅ Converter UUID para TEXT no retorno JSON
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, fazer rollback automático
    v_error := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.rpc_deduct_balance IS 'Debita saldo do usuário de forma ACID. Retorna transaction_id como TEXT (UUID convertido).';

