-- =====================================================
-- SCHEMA: Sistema de Recompensas
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Garantir integridade financeira nas recompensas
--
-- Este schema implementa sistema completo de recompensas,
-- garantindo rastreabilidade e integridade financeira.
-- =====================================================

-- =====================================================
-- 1. TABELA REWARDS (Histórico de Recompensas)
-- =====================================================

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

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rewards_usuario_id ON public.rewards(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rewards_lote_id ON public.rewards(lote_id);
CREATE INDEX IF NOT EXISTS idx_rewards_chute_id ON public.rewards(chute_id);
CREATE INDEX IF NOT EXISTS idx_rewards_tipo ON public.rewards(tipo);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON public.rewards(created_at);
CREATE INDEX IF NOT EXISTS idx_rewards_usuario_tipo ON public.rewards(usuario_id, tipo);
CREATE INDEX IF NOT EXISTS idx_rewards_usuario_status ON public.rewards(usuario_id, status);

-- =====================================================
-- 3. RPC FUNCTIONS: Gerenciar Recompensas
-- =====================================================

-- Função: Registrar recompensa (sem creditar ainda)
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
AS $$
DECLARE
    v_reward_id INTEGER;
    v_usuario_saldo DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- Validar parâmetros
    IF p_usuario_id IS NULL OR p_valor IS NULL OR p_valor <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Parâmetros inválidos: usuario_id e valor são obrigatórios'
        );
    END IF;

    -- Buscar saldo atual do usuário
    SELECT saldo INTO v_usuario_saldo
    FROM public.usuarios
    WHERE id = p_usuario_id;

    IF v_usuario_saldo IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;

    -- Inserir recompensa
    INSERT INTO public.rewards (
        usuario_id,
        lote_id,
        chute_id,
        tipo,
        valor,
        descricao,
        status,
        saldo_anterior,
        metadata,
        created_at
    ) VALUES (
        p_usuario_id,
        p_lote_id,
        p_chute_id,
        p_tipo,
        p_valor,
        p_descricao,
        'pendente',
        v_usuario_saldo,
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_reward_id;

    -- Retornar resultado
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
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Função: Marcar recompensa como creditada
CREATE OR REPLACE FUNCTION public.rpc_mark_reward_credited(
    p_reward_id INTEGER,
    p_transacao_id UUID,
    p_saldo_posterior DECIMAL(10,2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward RECORD;
    v_result JSON;
BEGIN
    -- Buscar recompensa
    SELECT * INTO v_reward
    FROM public.rewards
    WHERE id = p_reward_id
    FOR UPDATE;

    IF v_reward IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Recompensa não encontrada'
        );
    END IF;

    -- Atualizar status
    UPDATE public.rewards
    SET 
        status = 'creditado',
        transacao_id = p_transacao_id,
        saldo_posterior = p_saldo_posterior,
        credited_at = NOW(),
        updated_at = NOW()
    WHERE id = p_reward_id;

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'reward_id', p_reward_id,
        'status', 'creditado',
        'transacao_id', p_transacao_id
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Função: Obter recompensas de um usuário
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
AS $$
DECLARE
    v_reward RECORD;
    v_rewards JSON[] := '{}';
    v_total_count INTEGER;
    v_result JSON;
BEGIN
    -- Contar total
    SELECT COUNT(*) INTO v_total_count
    FROM public.rewards
    WHERE usuario_id = p_usuario_id
    AND (p_tipo IS NULL OR tipo = p_tipo)
    AND (p_status IS NULL OR status = p_status);

    -- Buscar recompensas
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

    -- Retornar resultado
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
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.rewards IS 'Histórico completo de todas as recompensas dadas aos jogadores';
COMMENT ON FUNCTION public.rpc_register_reward IS 'Registra uma nova recompensa (status: pendente)';
COMMENT ON FUNCTION public.rpc_mark_reward_credited IS 'Marca recompensa como creditada após usar FinancialService';
COMMENT ON FUNCTION public.rpc_get_user_rewards IS 'Retorna histórico de recompensas de um usuário com paginação';

-- =====================================================
-- FIM DO SCHEMA DE RECOMPENSAS
-- =====================================================

