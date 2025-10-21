-- SCHEMA COMPLETO FINAL - GOL DE OURO v4.2
-- =====================================================
-- Data: 17/10/2025
-- Status: SCHEMA COMPLETO PARA LANÇAMENTO
-- Versão: v4.2-final-launch

-- 1. CRIAR TABELA DE MÉTRICAS GLOBAIS
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

-- 2. CRIAR TABELA DE PAGAMENTOS PIX (se não existir)
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

-- 3. CRIAR TABELA DE USUÁRIOS (se não existir)
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

-- 4. CRIAR TABELA DE JOGOS (se não existir)
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

-- 5. CRIAR TABELA DE SAQUES (se não existir)
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

-- 6. INSERIR DADOS INICIAIS
INSERT INTO public.metricas_globais (contador_chutes_global, ultimo_gol_de_ouro)
SELECT 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.metricas_globais);

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_jogos_usuario_id ON public.jogos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_jogos_created_at ON public.jogos(created_at);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON public.pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_usuario_id ON public.saques(usuario_id);

-- 8. VERIFICAR ESTRUTURA FINAL
SELECT 'TABELAS CRIADAS COM SUCESSO' as status;

-- 9. VERIFICAR DADOS INICIAIS
SELECT COUNT(*) as total_metricas FROM public.metricas_globais;
SELECT COUNT(*) as total_usuarios FROM public.usuarios;
SELECT COUNT(*) as total_jogos FROM public.jogos;
SELECT COUNT(*) as total_pagamentos FROM public.pagamentos_pix;
SELECT COUNT(*) as total_saques FROM public.saques;
