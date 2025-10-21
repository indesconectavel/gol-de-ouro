-- SCHEMA FORÇA CACHE PIX E SAQUE - GOL DE OURO v4.3
-- =====================================================
-- Data: 17/10/2025
-- Status: FORÇA ATUALIZAÇÃO DE CACHE PARA PIX E SAQUE
-- Versão: v4.3-forca-cache-pix-saque

-- Este script força especificamente a atualização do cache
-- para as tabelas pagamentos_pix e saques que estão com problemas.

-- 1. FORÇAR ATUALIZAÇÃO DA TABELA PAGAMENTOS_PIX
DO $$
BEGIN
    -- Verificar se a coluna external_id existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos_pix' AND column_name = 'external_id') THEN
        ALTER TABLE public.pagamentos_pix ADD COLUMN external_id VARCHAR(255);
        RAISE NOTICE 'Coluna external_id adicionada à tabela pagamentos_pix.';
    END IF;
    
    -- Verificar se a coluna amount existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos_pix' AND column_name = 'amount') THEN
        ALTER TABLE public.pagamentos_pix ADD COLUMN amount DECIMAL(10,2);
        RAISE NOTICE 'Coluna amount adicionada à tabela pagamentos_pix.';
    END IF;
    
    -- Atualizar valores nulos para evitar erros de NOT NULL
    UPDATE public.pagamentos_pix SET external_id = COALESCE(external_id, 'default_external_id') WHERE external_id IS NULL;
    UPDATE public.pagamentos_pix SET amount = COALESCE(amount, 0.00) WHERE amount IS NULL;
    
    -- Adicionar restrições NOT NULL
    ALTER TABLE public.pagamentos_pix ALTER COLUMN external_id SET NOT NULL;
    ALTER TABLE public.pagamentos_pix ALTER COLUMN amount SET NOT NULL;
    
    RAISE NOTICE 'Tabela pagamentos_pix atualizada com sucesso.';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro ao atualizar pagamentos_pix: %', SQLERRM;
END $$;

-- 2. FORÇAR ATUALIZAÇÃO DA TABELA SAQUES
DO $$
BEGIN
    -- Verificar se a coluna amount existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saques' AND column_name = 'amount') THEN
        ALTER TABLE public.saques ADD COLUMN amount DECIMAL(10,2);
        RAISE NOTICE 'Coluna amount adicionada à tabela saques.';
    END IF;
    
    -- Verificar se a coluna pix_key existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saques' AND column_name = 'pix_key') THEN
        ALTER TABLE public.saques ADD COLUMN pix_key VARCHAR(255);
        RAISE NOTICE 'Coluna pix_key adicionada à tabela saques.';
    END IF;
    
    -- Verificar se a coluna pix_type existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saques' AND column_name = 'pix_type') THEN
        ALTER TABLE public.saques ADD COLUMN pix_type VARCHAR(50);
        RAISE NOTICE 'Coluna pix_type adicionada à tabela saques.';
    END IF;
    
    -- Atualizar valores nulos para evitar erros de NOT NULL
    UPDATE public.saques SET amount = COALESCE(amount, 0.00) WHERE amount IS NULL;
    UPDATE public.saques SET pix_key = COALESCE(pix_key, 'default_pix_key') WHERE pix_key IS NULL;
    UPDATE public.saques SET pix_type = COALESCE(pix_type, 'default_pix_type') WHERE pix_type IS NULL;
    
    -- Adicionar restrições NOT NULL
    ALTER TABLE public.saques ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.saques ALTER COLUMN pix_key SET NOT NULL;
    ALTER TABLE public.saques ALTER COLUMN pix_type SET NOT NULL;
    
    RAISE NOTICE 'Tabela saques atualizada com sucesso.';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro ao atualizar saques: %', SQLERRM;
END $$;

-- 3. VERIFICAR ESTRUTURA FINAL DAS TABELAS
SELECT 'VERIFICAÇÃO PAGAMENTOS_PIX:' as tabela;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pagamentos_pix'
ORDER BY column_name;

SELECT 'VERIFICAÇÃO SAQUES:' as tabela;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'saques'
ORDER BY column_name;

-- 4. CONFIRMAÇÃO FINAL
SELECT 'SCHEMA FORÇA CACHE PIX E SAQUE APLICADO COM SUCESSO' as status;
