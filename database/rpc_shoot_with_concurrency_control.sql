-- =====================================================
-- FUNÇÃO RPC: Buscar lote ativo com lock (controle de concorrência)
-- =====================================================
-- Objetivo: Garantir que apenas uma requisição possa processar o mesmo lote
-- Usa FOR UPDATE para lock de linha no lote ativo
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_get_active_lote_with_lock(
    p_valor_aposta DECIMAL(10,2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_lote RECORD;
    v_lote_id VARCHAR(100);
    v_result JSON;
BEGIN
    -- Buscar lote ativo com FOR UPDATE (lock de linha)
    -- Isso garante que apenas uma requisição possa processar este lote
    SELECT * INTO v_lote
    FROM public.lotes
    WHERE valor_aposta = p_valor_aposta
    AND status = 'ativo'
    AND total_arrecadado < 10.00
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    -- Se não existe lote ativo, retornar null (endpoint criará novo)
    IF v_lote IS NULL THEN
        RETURN json_build_object(
            'success', true,
            'lote', NULL
        );
    END IF;

    -- Retornar lote com lock
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
            'premio_total', v_lote.premio_total,
            'created_at', v_lote.created_at,
            'updated_at', v_lote.updated_at
        )
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

COMMENT ON FUNCTION public.rpc_get_active_lote_with_lock IS 'Busca lote ativo com FOR UPDATE para controle de concorrência - garante que apenas uma requisição processe o mesmo lote';

-- =====================================================
-- ATUALIZAR FUNÇÃO: rpc_update_lote_after_shot
-- =====================================================
-- Adiciona verificação se lote ainda está ativo antes de fechar
-- Isso previne que duas requisições simultâneas fechem o mesmo lote
-- =====================================================

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
    v_arrecadacao_apos DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- Buscar lote com FOR UPDATE (lock de linha)
    SELECT * INTO v_lote
    FROM public.lotes
    WHERE id = p_lote_id
    FOR UPDATE;

    IF v_lote IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Lote não encontrado'
        );
    END IF;

    -- ✅ CONTROLE DE CONCORRÊNCIA: Verificar se lote ainda está ativo
    -- Se já foi fechado por outra requisição, não fechar novamente
    IF v_lote.status = 'completed' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Lote já foi fechado',
            'lote', json_build_object(
                'id', v_lote.id,
                'status', v_lote.status,
                'total_arrecadado', v_lote.total_arrecadado,
                'is_complete', true
            )
        );
    END IF;

    -- Calcular arrecadação após chute
    v_arrecadacao_apos := v_lote.total_arrecadado + p_valor_aposta;

    -- Atualizar posição e valores
    v_nova_posicao := v_lote.posicao_atual + 1;
    v_novo_status := v_lote.status;

    -- ✅ CONTROLE DE CONCORRÊNCIA: Só fechar se atingiu R$10 E ainda está ativo
    -- Verificar se este chute fecha o lote (atingiu R$10)
    IF v_arrecadacao_apos >= 10.00 AND v_lote.status = 'ativo' THEN
        v_novo_status := 'completed';
        -- Definir indice_vencedor como a posição atual (antes de incrementar)
        -- Isso será atualizado no UPDATE abaixo
    END IF;

    -- Se gol, finalizar lote (mas só se ainda estiver ativo)
    IF p_is_goal AND v_lote.status = 'ativo' THEN
        v_novo_status := 'completed';
    END IF;

    -- Se atingiu tamanho máximo, finalizar (mas só se ainda estiver ativo)
    IF v_nova_posicao >= v_lote.tamanho AND v_lote.status = 'ativo' THEN
        v_novo_status := 'completed';
    END IF;

    -- Atualizar lote
    UPDATE public.lotes
    SET 
        posicao_atual = v_nova_posicao,
        status = v_novo_status,
        total_arrecadado = v_arrecadacao_apos,
        premio_total = premio_total + p_premio + p_premio_gol_de_ouro,
        indice_vencedor = CASE 
            WHEN v_novo_status = 'completed' AND v_lote.indice_vencedor = -1 
            THEN v_lote.posicao_atual 
            ELSE indice_vencedor 
        END,
        updated_at = NOW(),
        completed_at = CASE WHEN v_novo_status = 'completed' THEN NOW() ELSE completed_at END
    WHERE id = p_lote_id
    RETURNING * INTO v_lote;

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'lote', json_build_object(
            'id', v_lote.id,
            'posicao_atual', v_lote.posicao_atual,
            'status', v_lote.status,
            'total_arrecadado', v_lote.total_arrecadado,
            'premio_total', v_lote.premio_total,
            'is_complete', v_lote.status = 'completed',
            'indice_vencedor', v_lote.indice_vencedor
        )
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

COMMENT ON FUNCTION public.rpc_update_lote_after_shot IS 'Atualiza lote após chute - COM CONTROLE DE CONCORRÊNCIA: verifica se lote ainda está ativo antes de fechar';

