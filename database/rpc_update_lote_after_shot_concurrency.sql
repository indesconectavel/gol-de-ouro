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

