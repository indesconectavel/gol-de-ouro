-- SCHEMA DEFINITIVO FINAL - GOL DE OURO v4.2
-- =====================================================
-- Data: 17/10/2025
-- Status: SCHEMA DEFINITIVO PARA PRODUÇÃO 100%
-- Versão: v4.2-definitivo-final

-- =====================================================
-- CORREÇÕES CRÍTICAS NECESSÁRIAS
-- =====================================================

-- 1. ADICIONAR COLUNA EXTERNAL_ID EM PAGAMENTOS_PIX
ALTER TABLE public.pagamentos_pix 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- 2. ADICIONAR COLUNA AMOUNT EM PAGAMENTOS_PIX
ALTER TABLE public.pagamentos_pix 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

-- 3. ADICIONAR COLUNA AMOUNT EM SAQUES
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

-- 4. ADICIONAR COLUNA PIX_KEY EM SAQUES
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);

-- 5. ADICIONAR COLUNA PIX_TYPE EM SAQUES
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS pix_type VARCHAR(50);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'SCHEMA DEFINITIVO FINAL APLICADO COM SUCESSO' as status;
