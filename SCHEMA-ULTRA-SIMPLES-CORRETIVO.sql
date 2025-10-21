-- SCHEMA ULTRA-SIMPLES CORRETIVO - GOL DE OURO v4.2
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO ULTRA-SIMPLES PARA PRODUÇÃO 100%
-- Versão: v4.2-ultra-simples-corretivo

-- =====================================================
-- 1. ADICIONAR COLUNA EXTERNAL_ID EM PAGAMENTOS_PIX
-- =====================================================
ALTER TABLE public.pagamentos_pix 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- =====================================================
-- 2. ADICIONAR COLUNA AMOUNT EM PAGAMENTOS_PIX
-- =====================================================
ALTER TABLE public.pagamentos_pix 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

-- =====================================================
-- 3. ADICIONAR COLUNA AMOUNT EM SAQUES
-- =====================================================
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

-- =====================================================
-- 4. ADICIONAR COLUNA PIX_KEY EM SAQUES
-- =====================================================
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);

-- =====================================================
-- 5. ADICIONAR COLUNA PIX_TYPE EM SAQUES
-- =====================================================
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS pix_type VARCHAR(50);

-- =====================================================
-- 6. VERIFICAR ESTRUTURA FINAL
-- =====================================================
SELECT 'SCHEMA ULTRA-SIMPLES CORRETIVO APLICADO' as status;

-- Verificar colunas da tabela pagamentos_pix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pagamentos_pix'
ORDER BY ordinal_position;

-- Verificar colunas da tabela saques
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'saques'
ORDER BY ordinal_position;
