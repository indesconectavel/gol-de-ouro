-- SCHEMA FORÇA CACHE UPDATE - GOL DE OURO v4.2
-- =====================================================
-- Data: 17/10/2025
-- Status: FORÇA ATUALIZAÇÃO DO CACHE SUPABASE
-- Versão: v4.2-forca-cache-update

-- =====================================================
-- FORÇAR ATUALIZAÇÃO DO CACHE DO SUPABASE
-- =====================================================

-- 1. ADICIONAR COLUNA EXTERNAL_ID EM PAGAMENTOS_PIX (FORÇA)
ALTER TABLE public.pagamentos_pix 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- 2. ADICIONAR COLUNA AMOUNT EM PAGAMENTOS_PIX (FORÇA)
ALTER TABLE public.pagamentos_pix 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

-- 3. ADICIONAR COLUNA AMOUNT EM SAQUES (FORÇA)
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

-- 4. ADICIONAR COLUNA PIX_KEY EM SAQUES (FORÇA)
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);

-- 5. ADICIONAR COLUNA PIX_TYPE EM SAQUES (FORÇA)
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS pix_type VARCHAR(50);

-- =====================================================
-- FORÇAR ATUALIZAÇÃO DO CACHE
-- =====================================================

-- 6. ATUALIZAR CACHE DO SUPABASE
NOTIFY pgrst, 'reload schema';

-- 7. VERIFICAR ESTRUTURA ATUAL
SELECT 'CACHE FORÇADO A ATUALIZAR' as status;

-- 8. VERIFICAR COLUNAS DA TABELA PAGAMENTOS_PIX
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pagamentos_pix'
AND column_name IN ('external_id', 'amount')
ORDER BY column_name;

-- 9. VERIFICAR COLUNAS DA TABELA SAQUES
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'saques'
AND column_name IN ('amount', 'pix_key', 'pix_type')
ORDER BY column_name;
