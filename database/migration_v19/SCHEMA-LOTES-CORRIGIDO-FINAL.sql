-- =====================================================
-- SCHEMA: Persistência de Lotes Ativos - CORRIGIDO FINAL
-- =====================================================
-- Data: 2025-12-10
-- Status: CORRIGIDO - Remove TODAS as versões antes de criar
-- =====================================================

-- =====================================================
-- PARTE 1: REMOVER TODAS AS VERSÕES POSSÍVEIS DA FUNÇÃO
-- =====================================================

-- Remover função rpc_get_or_create_lote (todas as assinaturas possíveis)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Buscar todas as versões da função
    FOR func_record IN
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc
        WHERE proname = 'rpc_get_or_create_lote'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        -- Remover cada versão encontrada
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

-- Remover função rpc_get_active_lotes
DROP FUNCTION IF EXISTS public.rpc_get_active_lotes();

-- =====================================================
-- PARTE 2: GARANTIR TABELA lotes EXISTE E ESTÁ COMPLETA
-- =====================================================

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

-- =====================================================
-- PARTE 3: CRIAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lotes_status ON public.lotes(status);
CREATE INDEX IF NOT EXISTS idx_lotes_valor_aposta ON public.lotes(valor_aposta);
CREATE INDEX IF NOT EXISTS idx_lotes_created_at ON public.lotes(created_at);

-- =====================================================
-- PARTE 4: CRIAR FUNÇÕES RPC (AGORA SEM DUPLICATAS)
-- =====================================================

-- Função: Criar ou obter lote ativo
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
    -- Verificar se existe lote ativo para este valor
    SELECT * INTO v_lote
    FROM public.lotes
    WHERE valor_aposta = p_valor_aposta
    AND status = 'ativo'
    AND posicao_atual < tamanho
    LIMIT 1;

    -- Se não existe, criar novo
    IF v_lote IS NULL THEN
        INSERT INTO public.lotes (
            id,
            valor_aposta,
            tamanho,
            posicao_atual,
            indice_vencedor,
            status,
            total_arrecadado,
            premio_total
        ) VALUES (
            p_lote_id,
            p_valor_aposta,
            p_tamanho,
            0,
            p_indice_vencedor,
            'ativo',
            0.00,
            0.00
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING * INTO v_lote;

        -- Se ainda não existe (conflito), buscar novamente
        IF v_lote IS NULL THEN
            SELECT * INTO v_lote
            FROM public.lotes
            WHERE id = p_lote_id;
        END IF;
    END IF;

    -- Retornar lote
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
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Função: Atualizar lote após chute
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
    -- Buscar lote
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

    -- Atualizar posição e valores
    v_nova_posicao := v_lote.posicao_atual + 1;
    v_novo_status := v_lote.status;

    -- Se gol, finalizar lote
    IF p_is_goal THEN
        v_novo_status := 'completed';
    END IF;

    -- Se atingiu tamanho máximo, finalizar
    IF v_nova_posicao >= v_lote.tamanho THEN
        v_novo_status := 'completed';
    END IF;

    -- Atualizar lote
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

    -- Retornar resultado
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
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Função: Sincronizar lotes ativos ao iniciar servidor
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
    -- Buscar todos os lotes ativos
    FOR v_lote IN
        SELECT *
        FROM public.lotes
        WHERE status = 'ativo'
        ORDER BY created_at ASC
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

    -- Retornar resultado
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
-- PARTE 5: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.lotes IS 'Lotes ativos do sistema de jogo';
COMMENT ON FUNCTION public.rpc_get_or_create_lote IS 'Cria ou obtém lote ativo para valor de aposta';
COMMENT ON FUNCTION public.rpc_update_lote_after_shot IS 'Atualiza lote após chute (posição, valores, status)';
COMMENT ON FUNCTION public.rpc_get_active_lotes IS 'Retorna todos os lotes ativos para sincronização';

-- =====================================================
-- FIM DO SCHEMA DE PERSISTÊNCIA DE LOTES
-- =====================================================

SELECT '✅ Funções de lotes criadas com sucesso!' AS resultado;

