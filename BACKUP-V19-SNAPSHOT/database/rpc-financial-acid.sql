-- =====================================================
-- RPC FUNCTIONS PARA SISTEMA FINANCEIRO ACID
-- Gol de Ouro v4.0 - Fase 1: Sistema Financeiro ACID
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Garantir integridade financeira
-- 
-- Estas funções garantem operações ACID para atualização de saldo,
-- eliminando race conditions e garantindo consistência total.
-- =====================================================

-- =====================================================
-- FUNÇÃO 1: Adicionar Saldo (Crédito) com Transação ACID
-- =====================================================
-- Esta função adiciona saldo ao usuário de forma segura e atômica,
-- criando automaticamente o registro de transação.
-- 
-- Parâmetros:
--   p_user_id: UUID do usuário
--   p_amount: Valor a ser creditado (DECIMAL positivo)
--   p_description: Descrição da transação
--   p_reference_id: ID de referência (ex: payment_id, reward_id)
--   p_reference_type: Tipo de referência (ex: 'deposito', 'premio')
--
-- Retorna:
--   JSON com { success: boolean, new_balance: decimal, transaction_id: integer, error: text }
-- =====================================================

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
AS $$
DECLARE
  v_old_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id INTEGER;
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

  -- Iniciar transação implícita (cada função RPC é uma transação)
  -- Usar SELECT FOR UPDATE para lock de linha (row-level locking)
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

  -- Calcular novo saldo
  v_new_balance := v_old_balance + p_amount;

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
    'credito',
    p_amount,
    v_old_balance,
    v_new_balance,
    COALESCE(p_description, 'Crédito de saldo'),
    p_reference_id,
    p_reference_type,
    'concluido',
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Retornar sucesso com dados
  RETURN json_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, fazer rollback automático (transação implícita)
    v_error := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- =====================================================
-- FUNÇÃO 2: Deduzir Saldo (Débito) com Transação ACID
-- =====================================================
-- Esta função deduz saldo do usuário de forma segura e atômica,
-- verificando saldo suficiente e criando registro de transação.
-- 
-- Parâmetros:
--   p_user_id: UUID do usuário
--   p_amount: Valor a ser debitado (DECIMAL positivo)
--   p_description: Descrição da transação
--   p_reference_id: ID de referência
--   p_reference_type: Tipo de referência (ex: 'saque', 'aposta')
--   p_allow_negative: BOOLEAN - Permitir saldo negativo? (padrão: false)
--
-- Retorna:
--   JSON com { success: boolean, new_balance: decimal, transaction_id: integer, error: text }
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
AS $$
DECLARE
  v_old_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id INTEGER;
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
  ) RETURNING id INTO v_transaction_id;

  -- Retornar sucesso com dados
  RETURN json_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
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

-- =====================================================
-- FUNÇÃO 3: Transferir Saldo entre Usuários (ACID)
-- =====================================================
-- Esta função transfere saldo de um usuário para outro de forma atômica,
-- garantindo que ambas as operações aconteçam ou nenhuma aconteça.
-- 
-- Parâmetros:
--   p_from_user_id: UUID do usuário origem
--   p_to_user_id: UUID do usuário destino
--   p_amount: Valor a ser transferido
--   p_description: Descrição da transação
--
-- Retorna:
--   JSON com { success: boolean, from_balance: decimal, to_balance: decimal, transaction_ids: integer[], error: text }
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_transfer_balance(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
  -- Validar parâmetros
  IF p_from_user_id IS NULL OR p_to_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'IDs de usuário são obrigatórios'
    );
  END IF;

  IF p_from_user_id = p_to_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Não é possível transferir para o mesmo usuário'
    );
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Valor deve ser maior que zero'
    );
  END IF;

  -- Lock ambas as linhas simultaneamente (ordem fixa para evitar deadlock)
  -- Ordenar por UUID para garantir ordem consistente
  IF p_from_user_id < p_to_user_id THEN
    -- Lock origem primeiro
    SELECT saldo INTO v_from_old_balance
    FROM public.usuarios
    WHERE id = p_from_user_id
    FOR UPDATE;

    -- Lock destino segundo
    SELECT saldo INTO v_to_old_balance
    FROM public.usuarios
    WHERE id = p_to_user_id
    FOR UPDATE;
  ELSE
    -- Lock destino primeiro
    SELECT saldo INTO v_to_old_balance
    FROM public.usuarios
    WHERE id = p_to_user_id
    FOR UPDATE;

    -- Lock origem segundo
    SELECT saldo INTO v_from_old_balance
    FROM public.usuarios
    WHERE id = p_from_user_id
    FOR UPDATE;
  END IF;

  -- Verificar se ambos usuários existem
  IF v_from_old_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário origem não encontrado'
    );
  END IF;

  IF v_to_old_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário destino não encontrado'
    );
  END IF;

  -- Verificar saldo suficiente
  IF v_from_old_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Saldo insuficiente para transferência',
      'current_balance', v_from_old_balance,
      'required_amount', p_amount
    );
  END IF;

  -- Calcular novos saldos
  v_from_new_balance := v_from_old_balance - p_amount;
  v_to_new_balance := v_to_old_balance + p_amount;

  -- Atualizar saldo do usuário origem
  UPDATE public.usuarios
  SET saldo = v_from_new_balance,
      updated_at = NOW()
  WHERE id = p_from_user_id;

  -- Atualizar saldo do usuário destino
  UPDATE public.usuarios
  SET saldo = v_to_new_balance,
      updated_at = NOW()
  WHERE id = p_to_user_id;

  -- Criar transação de débito (origem)
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
    p_from_user_id,
    'debito',
    -p_amount,
    v_from_old_balance,
    v_from_new_balance,
    COALESCE(p_description, 'Transferência enviada') || ' → ' || p_to_user_id::text,
    NULL,
    'transferencia',
    'concluido',
    NOW()
  ) RETURNING id INTO v_from_transaction_id;

  -- Criar transação de crédito (destino)
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
    p_to_user_id,
    'credito',
    p_amount,
    v_to_old_balance,
    v_to_new_balance,
    COALESCE(p_description, 'Transferência recebida') || ' ← ' || p_from_user_id::text,
    NULL,
    'transferencia',
    'concluido',
    NOW()
  ) RETURNING id INTO v_to_transaction_id;

  -- Retornar sucesso com dados
  RETURN json_build_object(
    'success', true,
    'from_balance', v_from_new_balance,
    'to_balance', v_to_new_balance,
    'transaction_ids', ARRAY[v_from_transaction_id, v_to_transaction_id],
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

-- =====================================================
-- FUNÇÃO 4: Obter Saldo Atual (com Lock Opcional)
-- =====================================================
-- Esta função retorna o saldo atual do usuário.
-- Útil para verificação antes de operações críticas.
-- 
-- Parâmetros:
--   p_user_id: UUID do usuário
--   p_with_lock: BOOLEAN - Fazer lock da linha? (padrão: false)
--
-- Retorna:
--   JSON com { success: boolean, balance: decimal, error: text }
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_get_balance(
  p_user_id UUID,
  p_with_lock BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL(10,2);
  v_error TEXT;
BEGIN
  -- Validar parâmetros
  IF p_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User ID é obrigatório'
    );
  END IF;

  -- Buscar saldo (com ou sem lock)
  IF p_with_lock THEN
    SELECT saldo INTO v_balance
    FROM public.usuarios
    WHERE id = p_user_id
    FOR UPDATE; -- 🔒 LOCK: Para operações que precisam garantir consistência
  ELSE
    SELECT saldo INTO v_balance
    FROM public.usuarios
    WHERE id = p_user_id;
  END IF;

  -- Verificar se usuário existe
  IF v_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Retornar sucesso com saldo
  RETURN json_build_object(
    'success', true,
    'balance', v_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Permitir que service_role execute essas funções
-- (já são SECURITY DEFINER, então executam com privilégios elevados)

-- Nota: Em produção, essas funções devem ser chamadas apenas pelo backend
-- usando service_role key, nunca diretamente pelo frontend.

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.rpc_add_balance IS 'Adiciona saldo ao usuário de forma ACID, criando transação automaticamente';
COMMENT ON FUNCTION public.rpc_deduct_balance IS 'Deduz saldo do usuário de forma ACID, verificando saldo suficiente';
COMMENT ON FUNCTION public.rpc_transfer_balance IS 'Transfere saldo entre usuários de forma ACID (ambas operações atômicas)';
COMMENT ON FUNCTION public.rpc_get_balance IS 'Obtém saldo atual do usuário (com lock opcional)';

-- =====================================================
-- FIM DO ARQUIVO RPC FINANCIAL ACID
-- =====================================================

