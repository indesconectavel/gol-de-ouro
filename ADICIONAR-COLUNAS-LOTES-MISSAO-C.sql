-- =====================================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA lotes - MISSÃO C
-- Execute este script se as colunas total_arrecadado ou indice_vencedor não existirem
-- =====================================================

-- Verificar estrutura atual ANTES de adicionar
SELECT 
    'ESTRUTURA ATUAL:' as info,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- =====================================================
-- ADICIONAR COLUNAS SE NÃO EXISTIREM
-- =====================================================

-- 1. Adicionar coluna total_arrecadado
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'total_arrecadado'
    ) THEN
        ALTER TABLE public.lotes 
        ADD COLUMN total_arrecadado DECIMAL(10,2) DEFAULT 0.00;
        
        -- Inicializar valores existentes
        UPDATE public.lotes 
        SET total_arrecadado = 0.00 
        WHERE total_arrecadado IS NULL;
        
        RAISE NOTICE '✅ Coluna total_arrecadado adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna total_arrecadado já existe';
    END IF;
END $$;

-- 2. Adicionar coluna indice_vencedor
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'indice_vencedor'
    ) THEN
        ALTER TABLE public.lotes 
        ADD COLUMN indice_vencedor INTEGER DEFAULT -1;
        
        -- Inicializar valores existentes com -1 (até fechar economicamente)
        UPDATE public.lotes 
        SET indice_vencedor = -1 
        WHERE indice_vencedor IS NULL;
        
        RAISE NOTICE '✅ Coluna indice_vencedor adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna indice_vencedor já existe';
    END IF;
END $$;

-- 3. Adicionar coluna premio_total (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'premio_total'
    ) THEN
        ALTER TABLE public.lotes 
        ADD COLUMN premio_total DECIMAL(10,2) DEFAULT 0.00;
        
        UPDATE public.lotes 
        SET premio_total = 0.00 
        WHERE premio_total IS NULL;
        
        RAISE NOTICE '✅ Coluna premio_total adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna premio_total já existe';
    END IF;
END $$;

-- 4. Adicionar coluna posicao_atual (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'posicao_atual'
    ) THEN
        ALTER TABLE public.lotes 
        ADD COLUMN posicao_atual INTEGER DEFAULT 0;
        
        -- Inicializar valores existentes
        UPDATE public.lotes 
        SET posicao_atual = 0 
        WHERE posicao_atual IS NULL;
        
        RAISE NOTICE '✅ Coluna posicao_atual adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna posicao_atual já existe';
    END IF;
END $$;

-- 5. Adicionar coluna completed_at (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.lotes 
        ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE '✅ Coluna completed_at adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna completed_at já existe';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR ESTRUTURA APÓS ADIÇÃO
-- =====================================================

SELECT 
    'ESTRUTURA APÓS ADIÇÃO:' as info,
    column_name, 
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- =====================================================
-- CONFIRMAÇÃO
-- =====================================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'lotes' 
            AND column_name = 'total_arrecadado'
        ) THEN '✅ total_arrecadado existe'
        ELSE '❌ total_arrecadado NÃO existe'
    END as status_total_arrecadado,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'lotes' 
            AND column_name = 'indice_vencedor'
        ) THEN '✅ indice_vencedor existe'
        ELSE '❌ indice_vencedor NÃO existe'
    END as status_indice_vencedor,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'lotes' 
            AND column_name = 'premio_total'
        ) THEN '✅ premio_total existe'
        ELSE '❌ premio_total NÃO existe'
    END as status_premio_total,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'lotes' 
            AND column_name = 'posicao_atual'
        ) THEN '✅ posicao_atual existe'
        ELSE '❌ posicao_atual NÃO existe'
    END as status_posicao_atual;

-- =====================================================
-- FIM
-- =====================================================
-- ✅ Execute este script primeiro para adicionar as colunas faltantes
-- ✅ Depois execute as validações
-- =====================================================

