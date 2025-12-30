-- =====================================================
-- PATCH MIGRATION V19 - Correções e Validações
-- =====================================================
-- Data: 2025-12-10
-- Versão: V19.0.0
-- Status: APLICAR APÓS MIGRATION-V19-PARA-SUPABASE.sql
--
-- Este patch:
-- 1. Verifica e corrige estrutura da tabela transacoes
-- 2. Verifica e corrige constraint transacoes_status_check
-- 3. Valida que RPCs financeiras existem
-- 4. Aplica search_path nas RPCs se necessário
-- =====================================================

BEGIN;

-- =====================================================
-- 1. VERIFICAR E CORRIGIR TABELA transacoes
-- =====================================================

-- Adicionar colunas faltantes se não existirem
DO $$
BEGIN
    -- referencia_id (INTEGER)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'referencia_id'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN referencia_id INTEGER;
        RAISE NOTICE 'Coluna referencia_id adicionada em transacoes';
    END IF;

    -- referencia_tipo (VARCHAR)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'referencia_tipo'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN referencia_tipo VARCHAR(50);
        RAISE NOTICE 'Coluna referencia_tipo adicionada em transacoes';
    END IF;

    -- saldo_anterior (DECIMAL)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'saldo_anterior'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN saldo_anterior DECIMAL(10,2);
        RAISE NOTICE 'Coluna saldo_anterior adicionada em transacoes';
    END IF;

    -- saldo_posterior (DECIMAL)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'saldo_posterior'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN saldo_posterior DECIMAL(10,2);
        RAISE NOTICE 'Coluna saldo_posterior adicionada em transacoes';
    END IF;

    -- metadata (JSONB)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN metadata JSONB;
        RAISE NOTICE 'Coluna metadata adicionada em transacoes';
    END IF;

    -- processed_at (TIMESTAMP)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.transacoes ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna processed_at adicionada em transacoes';
    END IF;
END $$;

-- =====================================================
-- 2. VERIFICAR E CORRIGIR CONSTRAINT transacoes_status_check
-- =====================================================

-- Remover constraint antigo se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'transacoes_status_check'
    ) THEN
        ALTER TABLE public.transacoes DROP CONSTRAINT transacoes_status_check;
        RAISE NOTICE 'Constraint transacoes_status_check removido';
    END IF;
END $$;

-- Adicionar novo constraint que permite todos os valores necessários
ALTER TABLE public.transacoes
ADD CONSTRAINT transacoes_status_check
CHECK (status IN ('pendente', 'processado', 'cancelado', 'falhou', 'concluido', 'processando'));

-- =====================================================
-- 3. VERIFICAR SE RPCs FINANCEIRAS EXISTEM
-- =====================================================

DO $$
BEGIN
    -- Verificar rpc_add_balance
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rpc_add_balance'
    ) THEN
        RAISE WARNING '⚠️ RPC rpc_add_balance não encontrada - Execute database/rpc-financial-acid.sql';
    ELSE
        RAISE NOTICE '✅ RPC rpc_add_balance existe';
    END IF;

    -- Verificar rpc_deduct_balance
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rpc_deduct_balance'
    ) THEN
        RAISE WARNING '⚠️ RPC rpc_deduct_balance não encontrada - Execute database/rpc-financial-acid.sql';
    ELSE
        RAISE NOTICE '✅ RPC rpc_deduct_balance existe';
    END IF;

    -- Verificar rpc_transfer_balance
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rpc_transfer_balance'
    ) THEN
        RAISE WARNING '⚠️ RPC rpc_transfer_balance não encontrada - Execute database/rpc-financial-acid.sql';
    ELSE
        RAISE NOTICE '✅ RPC rpc_transfer_balance existe';
    END IF;

    -- Verificar rpc_get_balance
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rpc_get_balance'
    ) THEN
        RAISE WARNING '⚠️ RPC rpc_get_balance não encontrada - Execute database/rpc-financial-acid.sql';
    ELSE
        RAISE NOTICE '✅ RPC rpc_get_balance existe';
    END IF;
END $$;

-- =====================================================
-- 4. RESUMO FINAL
-- =====================================================

DO $$
DECLARE
    v_colunas_transacoes INTEGER;
    v_rpcs_financeiras INTEGER;
BEGIN
    -- Contar colunas críticas em transacoes
    SELECT COUNT(*) INTO v_colunas_transacoes
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transacoes'
    AND column_name IN (
        'referencia_id',
        'referencia_tipo',
        'saldo_anterior',
        'saldo_posterior',
        'metadata',
        'processed_at'
    );

    -- Contar RPCs financeiras
    SELECT COUNT(*) INTO v_rpcs_financeiras
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'rpc_add_balance',
        'rpc_deduct_balance',
        'rpc_transfer_balance',
        'rpc_get_balance'
    );

    RAISE NOTICE '============================================================';
    RAISE NOTICE ' RESUMO DO PATCH MIGRATION V19';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Colunas críticas em transacoes: %/6', v_colunas_transacoes;
    RAISE NOTICE 'RPCs financeiras encontradas: %/4', v_rpcs_financeiras;
    
    IF v_colunas_transacoes < 6 THEN
        RAISE WARNING '⚠️ Algumas colunas críticas estão faltando em transacoes';
    END IF;
    
    IF v_rpcs_financeiras < 4 THEN
        RAISE WARNING '⚠️ Algumas RPCs financeiras estão faltando - Execute database/rpc-financial-acid.sql';
    END IF;
    
    RAISE NOTICE '============================================================';
END $$;

COMMIT;

-- =====================================================
-- FIM DO PATCH MIGRATION V19
-- =====================================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Se RPCs financeiras não existem, execute:
--    database/rpc-financial-acid.sql
-- 
-- 2. Se necessário aplicar search_path nas RPCs, execute:
--    database/aplicar-search-path-todas-rpcs-financeiras.sql
-- 
-- 3. Validar estrutura completa:
--    SELECT * FROM information_schema.columns WHERE table_name = 'transacoes';
--    SELECT proname FROM pg_proc WHERE proname LIKE 'rpc_%';
-- =====================================================

