-- =====================================================
-- CRIAÇÃO DA TABELA DE PAGAMENTOS PIX - PRODUÇÃO
-- Ambiente: Supabase goldeouro-production
-- Data: 19/12/2025
-- Status: SEGURO - Apenas criação de tabela nova
-- =====================================================
-- ⚠️ IMPORTANTE: Esta query CRIA uma nova tabela
-- ⚠️ NÃO apaga dados existentes
-- ⚠️ Pode ser executada múltiplas vezes (idempotente)
-- =====================================================

-- =====================================================
-- VERIFICAÇÃO PRÉVIA: Verificar se tabela já existe
-- =====================================================
-- Execute esta query PRIMEIRO para verificar
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (
        table_name = 'pagamentos_pix'
        OR table_name = 'pix_payments'
        OR table_name = 'pagamentos'
    );

-- =====================================================
-- CRIAÇÃO DA TABELA pagamentos_pix
-- =====================================================
-- Baseado em: database/migration_v19/PRODUCAO_CORRECAO_INCREMENTAL_V19.sql
-- Estrutura conforme Engine V19

CREATE TABLE IF NOT EXISTS public.pagamentos_pix (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'cancelled', 'expired', 'pago')),
    qr_code TEXT,
    qr_code_base64 TEXT,
    pix_copy_paste TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    mercado_pago_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_usuario_id ON public.pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_status ON public.pagamentos_pix(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_external_id ON public.pagamentos_pix(external_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_created_at ON public.pagamentos_pix(created_at);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_expires_at ON public.pagamentos_pix(expires_at);

-- =====================================================
-- RLS (Row Level Security) - Se necessário
-- =====================================================
-- Descomente se RLS for necessário
-- ALTER TABLE public.pagamentos_pix ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view own payments" ON public.pagamentos_pix
--     FOR SELECT USING (auth.uid() = usuario_id);

-- =====================================================
-- VALIDAÇÃO: Verificar se tabela foi criada
-- =====================================================
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = 'pagamentos_pix') AS num_colunas
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name = 'pagamentos_pix';

-- =====================================================
-- VERIFICAÇÃO DE ESTRUTURA
-- =====================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'pagamentos_pix'
ORDER BY ordinal_position;

-- =====================================================
-- FIM DA CRIAÇÃO
-- =====================================================
-- ✅ Tabela criada com sucesso
-- ✅ Índices criados
-- ✅ Pronta para uso
-- =====================================================

