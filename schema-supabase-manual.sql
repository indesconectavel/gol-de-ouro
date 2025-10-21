-- SCHEMA SIMPLIFICADO PARA APLICAÇÃO MANUAL - GOL DE OURO v1.2.0
-- =============================================================
-- Data: 21/10/2025
-- Status: SCHEMA PARA APLICAÇÃO MANUAL NO SUPABASE SQL EDITOR
-- Versão: v1.2.0-final-production

-- =====================================================
-- INSTRUÇÕES DE APLICAÇÃO
-- =====================================================
-- 1. Copie este código completo
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute todo o código de uma vez
-- 4. Verifique se todas as tabelas foram criadas

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- 1. TABELA USUÁRIOS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    tipo VARCHAR(50) DEFAULT 'jogador',
    ativo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    total_apostas INTEGER DEFAULT 0,
    total_ganhos DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA LOTES
CREATE TABLE IF NOT EXISTS public.lotes (
    id VARCHAR(100) PRIMARY KEY,
    valor_aposta DECIMAL(10,2) NOT NULL,
    tamanho INTEGER NOT NULL,
    posicao_atual INTEGER DEFAULT 0,
    indice_vencedor INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo',
    total_arrecadado DECIMAL(10,2) DEFAULT 0.00,
    premio_total DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA CHUTES
CREATE TABLE IF NOT EXISTS public.chutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    lote_id VARCHAR(100) NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
    direcao VARCHAR(10) NOT NULL CHECK (direcao IN ('TL', 'TR', 'C', 'BL', 'BR')),
    valor_aposta DECIMAL(10,2) NOT NULL,
    resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('goal', 'miss')),
    premio DECIMAL(10,2) DEFAULT 0.00,
    premio_gol_de_ouro DECIMAL(10,2) DEFAULT 0.00,
    is_gol_de_ouro BOOLEAN DEFAULT false,
    contador_global INTEGER NOT NULL,
    shot_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA PAGAMENTOS PIX
CREATE TABLE IF NOT EXISTS public.pagamentos_pix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    external_id VARCHAR(255) UNIQUE NOT NULL,
    payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    qr_code TEXT,
    qr_code_base64 TEXT,
    pix_copy_paste TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA TRANSAÇÕES
CREATE TABLE IF NOT EXISTS public.transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('deposit', 'withdrawal', 'prize', 'bet')),
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    referencia_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA SAQUES
CREATE TABLE IF NOT EXISTS public.saques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    pix_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA MÉTRICAS GLOBAIS
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

-- =====================================================
-- CORREÇÕES DE COLUNAS
-- =====================================================

-- Adicionar colunas se não existirem
DO $$
BEGIN
    -- Adicionar colunas ausentes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'total_apostas') THEN
        ALTER TABLE public.usuarios ADD COLUMN total_apostas INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'total_ganhos') THEN
        ALTER TABLE public.usuarios ADD COLUMN total_ganhos DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos_pix' AND column_name = 'payment_id') THEN
        ALTER TABLE public.pagamentos_pix ADD COLUMN payment_id VARCHAR(255);
    END IF;
    
    -- Atualizar valores nulos
    UPDATE public.usuarios SET total_apostas = 0 WHERE total_apostas IS NULL;
    UPDATE public.usuarios SET total_ganhos = 0.00 WHERE total_ganhos IS NULL;
    UPDATE public.pagamentos_pix SET payment_id = external_id WHERE payment_id IS NULL;
    
    -- Adicionar restrições NOT NULL
    ALTER TABLE public.usuarios ALTER COLUMN total_apostas SET NOT NULL;
    ALTER TABLE public.usuarios ALTER COLUMN total_ganhos SET NOT NULL;
    ALTER TABLE public.pagamentos_pix ALTER COLUMN payment_id SET NOT NULL;
    
    RAISE NOTICE 'Colunas críticas corrigidas com sucesso!';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro ao corrigir colunas: %', SQLERRM;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_globais ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Users can view own data" ON public.usuarios;
CREATE POLICY "Users can view own data" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);
    
DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;
CREATE POLICY "Users can update own data" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own data" ON public.usuarios;
CREATE POLICY "Users can insert own data" ON public.usuarios
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view active lots" ON public.lotes;
CREATE POLICY "Anyone can view active lots" ON public.lotes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own shots" ON public.chutes;
CREATE POLICY "Users can view own shots" ON public.chutes
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert own shots" ON public.chutes;
CREATE POLICY "Users can insert own shots" ON public.chutes
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can view own payments" ON public.pagamentos_pix;
CREATE POLICY "Users can view own payments" ON public.pagamentos_pix
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.pagamentos_pix;
CREATE POLICY "Users can insert own payments" ON public.pagamentos_pix
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transacoes;
CREATE POLICY "Users can view own transactions" ON public.transacoes
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transacoes;
CREATE POLICY "Users can insert own transactions" ON public.transacoes
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.saques;
CREATE POLICY "Users can view own withdrawals" ON public.saques
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.saques;
CREATE POLICY "Users can insert own withdrawals" ON public.saques
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Anyone can view global metrics" ON public.metricas_globais;
CREATE POLICY "Anyone can view global metrics" ON public.metricas_globais
    FOR SELECT USING (true);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON public.usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON public.usuarios(ativo);

-- Índices para lotes
CREATE INDEX IF NOT EXISTS idx_lotes_status ON public.lotes(status);
CREATE INDEX IF NOT EXISTS idx_lotes_valor_aposta ON public.lotes(valor_aposta);
CREATE INDEX IF NOT EXISTS idx_lotes_created_at ON public.lotes(created_at);

-- Índices para chutes
CREATE INDEX IF NOT EXISTS idx_chutes_usuario_id ON public.chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON public.chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_chutes_resultado ON public.chutes(resultado);
CREATE INDEX IF NOT EXISTS idx_chutes_created_at ON public.chutes(created_at);
CREATE INDEX IF NOT EXISTS idx_chutes_contador_global ON public.chutes(contador_global);

-- Índices para pagamentos_pix
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON public.pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_external_id ON public.pagamentos_pix(external_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_payment_id ON public.pagamentos_pix(payment_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos_pix(status);

-- Índices para transacoes
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_id ON public.transacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_created_at ON public.transacoes(created_at);

-- Índices para saques
CREATE INDEX IF NOT EXISTS idx_saques_usuario_id ON public.saques(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_status ON public.saques(status);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir dados iniciais das métricas globais
INSERT INTO public.metricas_globais (contador_chutes_global, ultimo_gol_de_ouro, total_usuarios)
SELECT 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.metricas_globais);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura final
SELECT 'SCHEMA DEFINITIVO FINAL v1.2.0 APLICADO COM SUCESSO' as status;

-- Verificar dados
SELECT COUNT(*) as total_metricas FROM public.metricas_globais;
SELECT COUNT(*) as total_usuarios FROM public.usuarios;
SELECT COUNT(*) as total_lotes FROM public.lotes;
SELECT COUNT(*) as total_chutes FROM public.chutes;
SELECT COUNT(*) as total_pagamentos FROM public.pagamentos_pix;
SELECT COUNT(*) as total_transacoes FROM public.transacoes;
SELECT COUNT(*) as total_saques FROM public.saques;

-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- Verificar índices criados
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- =====================================================
-- SCHEMA SIMPLIFICADO PARA APLICAÇÃO MANUAL v1.2.0
-- =====================================================
