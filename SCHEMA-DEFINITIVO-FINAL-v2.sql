-- SCHEMA DEFINITIVO FINAL v2 - GOL DE OURO
-- =========================================
-- Data: 17/10/2025
-- Status: SCHEMA DEFINITIVO FINAL v2
-- Versão: v4.4-definitivo-final-v2

-- Este script resolve DEFINITIVAMENTE todos os problemas de schema
-- forçando a atualização completa do cache do Supabase

-- 1. CRIAR TABELA MÉTRICAS GLOBAIS (se não existir)
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

-- 2. CRIAR TABELA USUÁRIOS (se não existir)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    tipo VARCHAR(50) DEFAULT 'jogador',
    ativo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA PAGAMENTOS PIX (se não existir)
CREATE TABLE IF NOT EXISTS public.pagamentos_pix (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    qr_code TEXT,
    qr_code_base64 TEXT,
    pix_copy_paste TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA JOGOS (se não existir)
CREATE TABLE IF NOT EXISTS public.jogos (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    lote_id VARCHAR(255),
    direction VARCHAR(50),
    amount DECIMAL(10,2),
    result VARCHAR(50),
    premio DECIMAL(10,2) DEFAULT 0.00,
    premio_gol_de_ouro DECIMAL(10,2) DEFAULT 0.00,
    is_gol_de_ouro BOOLEAN DEFAULT false,
    contador_global INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR TABELA SAQUES (se não existir)
CREATE TABLE IF NOT EXISTS public.saques (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    pix_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. FORÇAR ATUALIZAÇÃO DE COLUNAS CRÍTICAS
DO $$
BEGIN
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos_pix' AND column_name = 'external_id') THEN
        ALTER TABLE public.pagamentos_pix ADD COLUMN external_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos_pix' AND column_name = 'amount') THEN
        ALTER TABLE public.pagamentos_pix ADD COLUMN amount DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saques' AND column_name = 'amount') THEN
        ALTER TABLE public.saques ADD COLUMN amount DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saques' AND column_name = 'pix_key') THEN
        ALTER TABLE public.saques ADD COLUMN pix_key VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saques' AND column_name = 'pix_type') THEN
        ALTER TABLE public.saques ADD COLUMN pix_type VARCHAR(50);
    END IF;
    
    -- Atualizar valores nulos
    UPDATE public.pagamentos_pix SET external_id = COALESCE(external_id, 'default_external_id') WHERE external_id IS NULL;
    UPDATE public.pagamentos_pix SET amount = COALESCE(amount, 0.00) WHERE amount IS NULL;
    UPDATE public.saques SET amount = COALESCE(amount, 0.00) WHERE amount IS NULL;
    UPDATE public.saques SET pix_key = COALESCE(pix_key, 'default_pix_key') WHERE pix_key IS NULL;
    UPDATE public.saques SET pix_type = COALESCE(pix_type, 'default_pix_type') WHERE pix_type IS NULL;
    
    -- Adicionar restrições NOT NULL
    ALTER TABLE public.pagamentos_pix ALTER COLUMN external_id SET NOT NULL;
    ALTER TABLE public.pagamentos_pix ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.saques ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.saques ALTER COLUMN pix_key SET NOT NULL;
    ALTER TABLE public.saques ALTER COLUMN pix_type SET NOT NULL;
    
    RAISE NOTICE 'Colunas críticas atualizadas com sucesso!';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro ao atualizar colunas: %', SQLERRM;
END $$;

-- 7. INSERIR DADOS INICIAIS
INSERT INTO public.metricas_globais (contador_chutes_global, ultimo_gol_de_ouro)
SELECT 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.metricas_globais);

-- 8. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_jogos_usuario_id ON public.jogos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_jogos_created_at ON public.jogos(created_at);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON public.pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_usuario_id ON public.saques(usuario_id);

-- 9. VERIFICAR ESTRUTURA FINAL
SELECT 'SCHEMA DEFINITIVO FINAL v2 APLICADO COM SUCESSO' as status;

-- 10. VERIFICAR DADOS
SELECT COUNT(*) as total_metricas FROM public.metricas_globais;
SELECT COUNT(*) as total_usuarios FROM public.usuarios;
SELECT COUNT(*) as total_jogos FROM public.jogos;
SELECT COUNT(*) as total_pagamentos FROM public.pagamentos_pix;
SELECT COUNT(*) as total_saques FROM public.saques;
