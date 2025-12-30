-- =====================================================
-- MIGRATION V19: RLS + ÍNDICES + PERSISTÊNCIA COMPLETA
-- =====================================================
-- Data: 2025-12-05
-- Versão: V19.0.0
-- Status: IDEMPOTENTE - Pode ser executada múltiplas vezes
--
-- Esta migration:
-- 1. Cria roles (backend, observer, admin)
-- 2. Adiciona índices faltantes
-- 3. Habilita RLS nas tabelas críticas
-- 4. Cria policies seguras
-- 5. Adiciona colunas para persistência completa
-- 6. Cria tabela system_heartbeat
-- 7. Verifica/cria RPC functions necessárias
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CRIAR ROLES (se não existirem)
-- =====================================================

DO $$
BEGIN
    -- Role backend: operações de escrita
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'backend') THEN
        CREATE ROLE backend;
        RAISE NOTICE 'Role backend criada';
    ELSE
        RAISE NOTICE 'Role backend já existe';
    END IF;

    -- Role observer: apenas leitura de agregados
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'observer') THEN
        CREATE ROLE observer;
        RAISE NOTICE 'Role observer criada';
    ELSE
        RAISE NOTICE 'Role observer já existe';
    END IF;

    -- Role admin: acesso total
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin;
        RAISE NOTICE 'Role admin criada';
    ELSE
        RAISE NOTICE 'Role admin já existe';
    END IF;
END $$;

-- =====================================================
-- 2. ADICIONAR COLUNAS FALTANTES PARA PERSISTÊNCIA
-- =====================================================

-- Adicionar colunas em lotes se não existirem
DO $$
BEGIN
    -- persisted_global_counter
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'persisted_global_counter'
    ) THEN
        ALTER TABLE public.lotes ADD COLUMN persisted_global_counter BIGINT DEFAULT 0;
        RAISE NOTICE 'Coluna persisted_global_counter adicionada em lotes';
    END IF;

    -- synced_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'synced_at'
    ) THEN
        ALTER TABLE public.lotes ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna synced_at adicionada em lotes';
    END IF;

    -- posicao_atual (já deve existir, mas verificamos)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'posicao_atual'
    ) THEN
        ALTER TABLE public.lotes ADD COLUMN posicao_atual INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna posicao_atual adicionada em lotes';
    END IF;
END $$;

-- =====================================================
-- 3. CRIAR ÍNDICES FALTANTES
-- =====================================================

-- Índices em chutes
CREATE INDEX IF NOT EXISTS idx_chutes_usuario_id ON public.chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON public.chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_chutes_created_at ON public.chutes(created_at);
CREATE INDEX IF NOT EXISTS idx_chutes_lote_created ON public.chutes(lote_id, created_at);

-- Índices em transacoes
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_id ON public.transacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_created_at ON public.transacoes(created_at);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_created ON public.transacoes(usuario_id, created_at);

-- Índices em lotes (performance)
CREATE INDEX IF NOT EXISTS idx_lotes_status_created ON public.lotes(status, created_at);
CREATE INDEX IF NOT EXISTS idx_lotes_valor_status ON public.lotes(valor_aposta, status);

-- Índice em usuarios (email já deve existir, mas verificamos)
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);

-- =====================================================
-- 4. CRIAR TABELA system_heartbeat
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_heartbeat (
    id SERIAL PRIMARY KEY,
    instance_id VARCHAR(255) UNIQUE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_heartbeat_last_seen ON public.system_heartbeat(last_seen);
CREATE INDEX IF NOT EXISTS idx_system_heartbeat_instance ON public.system_heartbeat(instance_id);

-- =====================================================
-- 5. HABILITAR RLS NAS TABELAS CRÍTICAS
-- =====================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CRIAR POLICIES SEGURAS
-- =====================================================

-- =====================================================
-- 6.1 POLICIES PARA usuarios
-- =====================================================

-- Policy SELECT: usuários podem ver apenas seus próprios dados
DROP POLICY IF EXISTS usuarios_select_own ON public.usuarios;
CREATE POLICY usuarios_select_own ON public.usuarios
    FOR SELECT
    USING (
        current_setting('app.current_user_id', true)::uuid = id
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- Policy INSERT: apenas backend pode inserir
DROP POLICY IF EXISTS usuarios_insert_backend ON public.usuarios;
CREATE POLICY usuarios_insert_backend ON public.usuarios
    FOR INSERT
    WITH CHECK (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- Policy UPDATE: backend e próprio usuário podem atualizar
DROP POLICY IF EXISTS usuarios_update_own ON public.usuarios;
CREATE POLICY usuarios_update_own ON public.usuarios
    FOR UPDATE
    USING (
        current_setting('app.current_user_id', true)::uuid = id
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    )
    WITH CHECK (
        current_setting('app.current_user_id', true)::uuid = id
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- =====================================================
-- 6.2 POLICIES PARA chutes
-- =====================================================

-- Policy SELECT: usuários veem seus próprios chutes, backend vê tudo
DROP POLICY IF EXISTS chutes_select_own ON public.chutes;
CREATE POLICY chutes_select_own ON public.chutes
    FOR SELECT
    USING (
        current_setting('app.current_user_id', true)::uuid = usuario_id
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
        OR current_setting('app.role', true) = 'observer'
    );

-- Policy INSERT: apenas backend pode inserir
DROP POLICY IF EXISTS chutes_insert_backend ON public.chutes;
CREATE POLICY chutes_insert_backend ON public.chutes
    FOR INSERT
    WITH CHECK (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- =====================================================
-- 6.3 POLICIES PARA lotes
-- =====================================================

-- Policy SELECT: todos podem ler lotes ativos (público), backend vê tudo
DROP POLICY IF EXISTS lotes_select_public ON public.lotes;
CREATE POLICY lotes_select_public ON public.lotes
    FOR SELECT
    USING (
        status = 'ativo'
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
        OR current_setting('app.role', true) = 'observer'
    );

-- Policy INSERT/UPDATE: apenas backend
DROP POLICY IF EXISTS lotes_modify_backend ON public.lotes;
CREATE POLICY lotes_modify_backend ON public.lotes
    FOR ALL
    USING (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    )
    WITH CHECK (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- =====================================================
-- 6.4 POLICIES PARA transacoes
-- =====================================================

-- Policy SELECT: usuários veem suas próprias transações
DROP POLICY IF EXISTS transacoes_select_own ON public.transacoes;
CREATE POLICY transacoes_select_own ON public.transacoes
    FOR SELECT
    USING (
        current_setting('app.current_user_id', true)::uuid = usuario_id
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
        OR current_setting('app.role', true) = 'observer'
    );

-- Policy INSERT: apenas backend (via RPC functions)
DROP POLICY IF EXISTS transacoes_insert_backend ON public.transacoes;
CREATE POLICY transacoes_insert_backend ON public.transacoes
    FOR INSERT
    WITH CHECK (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- =====================================================
-- 6.5 POLICIES PARA pagamentos_pix
-- =====================================================

DROP POLICY IF EXISTS pagamentos_pix_select_own ON public.pagamentos_pix;
CREATE POLICY pagamentos_pix_select_own ON public.pagamentos_pix
    FOR SELECT
    USING (
        current_setting('app.current_user_id', true)::uuid = usuario_id
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

DROP POLICY IF EXISTS pagamentos_pix_modify_backend ON public.pagamentos_pix;
CREATE POLICY pagamentos_pix_modify_backend ON public.pagamentos_pix
    FOR ALL
    USING (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    )
    WITH CHECK (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- =====================================================
-- 6.6 POLICIES PARA saques
-- =====================================================

DROP POLICY IF EXISTS saques_select_own ON public.saques;
CREATE POLICY saques_select_own ON public.saques
    FOR SELECT
    USING (
        current_setting('app.current_user_id', true)::uuid = usuario_id
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

DROP POLICY IF EXISTS saques_modify_backend ON public.saques;
CREATE POLICY saques_modify_backend ON public.saques
    FOR ALL
    USING (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    )
    WITH CHECK (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- =====================================================
-- 6.7 POLICIES PARA webhook_events (já deve ter RLS)
-- =====================================================

DROP POLICY IF EXISTS webhook_events_backend ON public.webhook_events;
CREATE POLICY webhook_events_backend ON public.webhook_events
    FOR ALL
    USING (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    )
    WITH CHECK (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- =====================================================
-- 6.8 POLICIES PARA rewards
-- =====================================================

DROP POLICY IF EXISTS rewards_select_own ON public.rewards;
CREATE POLICY rewards_select_own ON public.rewards
    FOR SELECT
    USING (
        current_setting('app.current_user_id', true)::uuid = usuario_id
        OR current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
        OR current_setting('app.role', true) = 'observer'
    );

DROP POLICY IF EXISTS rewards_modify_backend ON public.rewards;
CREATE POLICY rewards_modify_backend ON public.rewards
    FOR ALL
    USING (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    )
    WITH CHECK (
        current_setting('app.role', true) = 'backend'
        OR current_setting('app.role', true) = 'admin'
    );

-- =====================================================
-- 7. VERIFICAR/CRIAR RPC FUNCTIONS (idempotente)
-- =====================================================

-- Verificar se rpc_get_or_create_lote existe e tem assinatura correta
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rpc_get_or_create_lote'
    ) THEN
        -- Criar função (código completo do schema-lotes-persistencia.sql)
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.rpc_get_or_create_lote(
            p_lote_id VARCHAR(100),
            p_valor_aposta DECIMAL(10,2),
            p_tamanho INTEGER,
            p_indice_vencedor INTEGER
        )
        RETURNS JSON
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        DECLARE
            v_lote RECORD;
            v_result JSON;
        BEGIN
            SELECT * INTO v_lote
            FROM public.lotes
            WHERE valor_aposta = p_valor_aposta
            AND status = ''ativo''
            AND posicao_atual < tamanho
            LIMIT 1
            FOR UPDATE;

            IF v_lote IS NULL THEN
                INSERT INTO public.lotes (
                    id, valor_aposta, tamanho, posicao_atual,
                    indice_vencedor, status, total_arrecadado, premio_total
                ) VALUES (
                    p_lote_id, p_valor_aposta, p_tamanho, 0,
                    p_indice_vencedor, ''ativo'', 0.00, 0.00
                )
                ON CONFLICT (id) DO NOTHING
                RETURNING * INTO v_lote;

                IF v_lote IS NULL THEN
                    SELECT * INTO v_lote FROM public.lotes WHERE id = p_lote_id;
                END IF;
            END IF;

            v_result := json_build_object(
                ''success'', true,
                ''lote'', json_build_object(
                    ''id'', v_lote.id,
                    ''valor_aposta'', v_lote.valor_aposta,
                    ''tamanho'', v_lote.tamanho,
                    ''posicao_atual'', v_lote.posicao_atual,
                    ''indice_vencedor'', v_lote.indice_vencedor,
                    ''status'', v_lote.status,
                    ''total_arrecadado'', v_lote.total_arrecadado,
                    ''premio_total'', v_lote.premio_total
                )
            );

            RETURN v_result;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN json_build_object(''success'', false, ''error'', SQLERRM);
        END;
        $func$;
        ';
        RAISE NOTICE 'Função rpc_get_or_create_lote criada';
    ELSE
        RAISE NOTICE 'Função rpc_get_or_create_lote já existe';
    END IF;
END $$;

-- Verificar rpc_update_lote_after_shot
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rpc_update_lote_after_shot'
    ) THEN
        EXECUTE '
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
        AS $func$
        DECLARE
            v_lote RECORD;
            v_nova_posicao INTEGER;
            v_novo_status VARCHAR(20);
            v_result JSON;
        BEGIN
            SELECT * INTO v_lote FROM public.lotes WHERE id = p_lote_id FOR UPDATE;

            IF v_lote IS NULL THEN
                RETURN json_build_object(''success'', false, ''error'', ''Lote não encontrado'');
            END IF;

            v_nova_posicao := v_lote.posicao_atual + 1;
            v_novo_status := v_lote.status;

            IF p_is_goal THEN
                v_novo_status := ''completed'';
            END IF;

            IF v_nova_posicao >= v_lote.tamanho THEN
                v_novo_status := ''completed'';
            END IF;

            UPDATE public.lotes
            SET posicao_atual = v_nova_posicao,
                status = v_novo_status,
                total_arrecadado = total_arrecadado + p_valor_aposta,
                premio_total = premio_total + p_premio + p_premio_gol_de_ouro,
                updated_at = NOW(),
                completed_at = CASE WHEN v_novo_status = ''completed'' THEN NOW() ELSE completed_at END
            WHERE id = p_lote_id
            RETURNING * INTO v_lote;

            v_result := json_build_object(
                ''success'', true,
                ''lote'', json_build_object(
                    ''id'', v_lote.id,
                    ''posicao_atual'', v_lote.posicao_atual,
                    ''status'', v_lote.status,
                    ''total_arrecadado'', v_lote.total_arrecadado,
                    ''premio_total'', v_lote.premio_total,
                    ''is_complete'', v_lote.status = ''completed''
                )
            );

            RETURN v_result;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN json_build_object(''success'', false, ''error'', SQLERRM);
        END;
        $func$;
        ';
        RAISE NOTICE 'Função rpc_update_lote_after_shot criada';
    ELSE
        RAISE NOTICE 'Função rpc_update_lote_after_shot já existe';
    END IF;
END $$;

-- Verificar rpc_add_balance e rpc_deduct_balance (já devem existir)
-- Apenas verificamos, não recriamos se existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rpc_add_balance'
    ) THEN
        RAISE WARNING 'Função rpc_add_balance não encontrada - execute rpc-financial-acid.sql';
    ELSE
        RAISE NOTICE 'Função rpc_add_balance existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rpc_deduct_balance'
    ) THEN
        RAISE WARNING 'Função rpc_deduct_balance não encontrada - execute rpc-financial-acid.sql';
    ELSE
        RAISE NOTICE 'Função rpc_deduct_balance existe';
    END IF;
END $$;

-- =====================================================
-- 8. RESUMO FINAL
-- =====================================================

DO $$
DECLARE
    v_indices_count INTEGER;
    v_policies_count INTEGER;
    v_tables_rls_count INTEGER;
BEGIN
    -- Contar índices criados
    SELECT COUNT(*) INTO v_indices_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND (
        indexname LIKE 'idx_chutes%'
        OR indexname LIKE 'idx_transacoes%'
        OR indexname LIKE 'idx_lotes%'
        OR indexname LIKE 'idx_usuarios_email'
    );

    -- Contar policies criadas
    SELECT COUNT(*) INTO v_policies_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards')
    );

    -- Contar tabelas com RLS habilitado
    SELECT COUNT(*) INTO v_tables_rls_count
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true
    AND t.tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards');

    RAISE NOTICE '============================================================';
    RAISE NOTICE ' RESUMO DA MIGRATION V19';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Índices criados/verificados: %', v_indices_count;
    RAISE NOTICE 'Policies criadas: %', v_policies_count;
    RAISE NOTICE 'Tabelas com RLS habilitado: %', v_tables_rls_count;
    RAISE NOTICE '============================================================';
END $$;

COMMIT;

-- =====================================================
-- FIM DA MIGRATION V19
-- =====================================================

