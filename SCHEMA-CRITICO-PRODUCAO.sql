-- SCHEMA CRÍTICO PARA PRODUÇÃO 100% - GOL DE OURO
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÕES CRÍTICAS PARA PRODUÇÃO
-- Versão: v4.2-producao-critico

-- 1. CORRIGIR TABELA PAGAMENTOS_PIX - ADICIONAR COLUNA AMOUNT
ALTER TABLE public.pagamentos_pix 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

-- 2. CRIAR TABELA MÉTRICAS GLOBAIS (se não existir)
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

-- 3. CORRIGIR COLUNA USERNAME - REMOVER CONSTRAINT NOT NULL TEMPORARIAMENTE
ALTER TABLE public.usuarios 
ALTER COLUMN username DROP NOT NULL;

-- 4. ATUALIZAR VALORES NULL NA COLUNA USERNAME
UPDATE public.usuarios 
SET username = split_part(email, '@', 1) 
WHERE username IS NULL;

-- 5. RESTAURAR CONSTRAINT NOT NULL NA COLUNA USERNAME
ALTER TABLE public.usuarios 
ALTER COLUMN username SET NOT NULL;

-- 6. INSERIR DADOS INICIAIS NA TABELA MÉTRICAS
INSERT INTO public.metricas_globais (contador_chutes_global, ultimo_gol_de_ouro)
SELECT 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.metricas_globais);

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_metricas_contador ON public.metricas_globais(contador_chutes_global);
CREATE INDEX IF NOT EXISTS idx_pagamentos_amount ON public.pagamentos_pix(amount);

-- 8. VERIFICAR ESTRUTURA FINAL
SELECT 'SCHEMA CORRIGIDO PARA PRODUÇÃO' as status;

-- 9. VERIFICAR DADOS
SELECT COUNT(*) as total_metricas FROM public.metricas_globais;
SELECT COUNT(*) as total_usuarios FROM public.usuarios WHERE username IS NOT NULL;
SELECT COUNT(*) as total_pagamentos FROM public.pagamentos_pix WHERE amount IS NOT NULL;
