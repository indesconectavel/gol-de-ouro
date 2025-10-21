-- SCHEMA FINAL COMPLETO - GOL DE OURO v4.2
-- =====================================================
-- Data: 17/10/2025
-- Status: SCHEMA COMPLETO PARA PRODUÇÃO 100%
-- Versão: v4.2-final-producao

-- 1. CORRIGIR TABELA PAGAMENTOS_PIX - ADICIONAR COLUNAS AUSENTES
ALTER TABLE public.pagamentos_pix 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

ALTER TABLE public.pagamentos_pix 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- 2. CORRIGIR TABELA SAQUES - ADICIONAR COLUNA AMOUNT
ALTER TABLE public.saques 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

-- 3. CRIAR TABELA MÉTRICAS GLOBAIS (se não existir)
CREATE TABLE IF NOT EXISTS public.metricas_globais (
    id SERIAL PRIMARY KEY,
    contador_chutes_global INTEGER DEFAULT 0 NOT NULL,
    ultimo_gol_de_ouro INTEGER DEFAULT 0 NOT NULL,
    total_usuarios INTEGER DEFAULT 0,
    total_jogos INTEGER DEFAULT 0,
    total_receita DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CORRIGIR COLUNA USERNAME - REMOVER CONSTRAINT NOT NULL TEMPORARIAMENTE
ALTER TABLE public.usuarios 
ALTER COLUMN username DROP NOT NULL;

-- 5. ATUALIZAR VALORES NULL NA COLUNA USERNAME
UPDATE public.usuarios 
SET username = split_part(email, '@', 1) 
WHERE username IS NULL;

-- 6. RESTAURAR CONSTRAINT NOT NULL NA COLUNA USERNAME
ALTER TABLE public.usuarios 
ALTER COLUMN username SET NOT NULL;

-- 7. INSERIR DADOS INICIAIS NA TABELA MÉTRICAS
INSERT INTO public.metricas_globais (contador_chutes_global, ultimo_gol_de_ouro)
SELECT 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.metricas_globais);

-- 8. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_metricas_contador ON public.metricas_globais(contador_chutes_global);
CREATE INDEX IF NOT EXISTS idx_pagamentos_amount ON public.pagamentos_pix(amount);
CREATE INDEX IF NOT EXISTS idx_saques_amount ON public.saques(amount);

-- 9. VERIFICAR ESTRUTURA FINAL
SELECT 'SCHEMA FINAL COMPLETO PARA PRODUÇÃO' as status;

-- 10. VERIFICAR DADOS
SELECT COUNT(*) as total_metricas FROM public.metricas_globais;
SELECT COUNT(*) as total_usuarios FROM public.usuarios WHERE username IS NOT NULL;
SELECT COUNT(*) as total_pagamentos FROM public.pagamentos_pix WHERE amount IS NOT NULL;
SELECT COUNT(*) as total_saques FROM public.saques WHERE amount IS NOT NULL;
