-- =====================================================
-- CORREÇÃO COMPLETA E FINAL - TODAS AS COLUNAS FALTANTES
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO COMPLETA E FINAL
-- Versão: v3.0-complete-fix

-- =====================================================
-- PASSO 1: VERIFICAR ESTRUTURA ATUAL DE TODAS AS TABELAS
-- =====================================================

-- Verificar tabela usuarios
SELECT 'USUARIOS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar tabela pagamentos_pix
SELECT 'PAGAMENTOS_PIX' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pagamentos_pix' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar tabela chutes
SELECT 'CHUTES' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chutes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar tabela saques
SELECT 'SAQUES' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'saques' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar tabela metricas_globais
SELECT 'METRICAS_GLOBAIS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'metricas_globais' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 2: CRIAR TABELA USUARIOS COMPLETA
-- =====================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username VARCHAR(100) NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    role VARCHAR(20) DEFAULT 'player',
    account_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PASSO 3: ADICIONAR TODAS AS COLUNAS FALTANTES NA TABELA USUARIOS
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar password_hash se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'password_hash') THEN
        ALTER TABLE usuarios ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Coluna password_hash adicionada à tabela usuarios';
    END IF;
    
    -- Adicionar username se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'username') THEN
        ALTER TABLE usuarios ADD COLUMN username VARCHAR(100);
        RAISE NOTICE 'Coluna username adicionada à tabela usuarios';
    END IF;
    
    -- Adicionar saldo se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'saldo') THEN
        ALTER TABLE usuarios ADD COLUMN saldo DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna saldo adicionada à tabela usuarios';
    END IF;
    
    -- Adicionar role se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'role') THEN
        ALTER TABLE usuarios ADD COLUMN role VARCHAR(20) DEFAULT 'player';
        RAISE NOTICE 'Coluna role adicionada à tabela usuarios';
    END IF;
    
    -- Adicionar account_status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'account_status') THEN
        ALTER TABLE usuarios ADD COLUMN account_status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Coluna account_status adicionada à tabela usuarios';
    END IF;
    
    -- Adicionar created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'created_at') THEN
        ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada à tabela usuarios';
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'updated_at') THEN
        ALTER TABLE usuarios ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela usuarios';
    END IF;
END $$;

-- =====================================================
-- PASSO 4: CRIAR TABELA PAGAMENTOS_PIX COMPLETA
-- =====================================================

CREATE TABLE IF NOT EXISTS pagamentos_pix (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    external_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    qr_code TEXT,
    qr_code_base64 TEXT,
    pix_copy_paste TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PASSO 5: ADICIONAR TODAS AS COLUNAS FALTANTES NA TABELA PAGAMENTOS_PIX
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar external_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'external_id') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN external_id VARCHAR(100);
        RAISE NOTICE 'Coluna external_id adicionada à tabela pagamentos_pix';
    END IF;
    
    -- Adicionar amount se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'amount') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        RAISE NOTICE 'Coluna amount adicionada à tabela pagamentos_pix';
    END IF;
    
    -- Adicionar status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'status') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
        RAISE NOTICE 'Coluna status adicionada à tabela pagamentos_pix';
    END IF;
    
    -- Adicionar qr_code se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'qr_code') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN qr_code TEXT;
        RAISE NOTICE 'Coluna qr_code adicionada à tabela pagamentos_pix';
    END IF;
    
    -- Adicionar qr_code_base64 se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'qr_code_base64') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN qr_code_base64 TEXT;
        RAISE NOTICE 'Coluna qr_code_base64 adicionada à tabela pagamentos_pix';
    END IF;
    
    -- Adicionar pix_copy_paste se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'pix_copy_paste') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN pix_copy_paste TEXT;
        RAISE NOTICE 'Coluna pix_copy_paste adicionada à tabela pagamentos_pix';
    END IF;
    
    -- Adicionar created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'created_at') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada à tabela pagamentos_pix';
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'updated_at') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela pagamentos_pix';
    END IF;
END $$;

-- =====================================================
-- PASSO 6: CRIAR TABELA CHUTES COMPLETA
-- =====================================================

CREATE TABLE IF NOT EXISTS chutes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    lote_id VARCHAR(100) NOT NULL,
    valor_aposta DECIMAL(10,2) NOT NULL,
    resultado VARCHAR(20) DEFAULT 'pending',
    premio DECIMAL(10,2) DEFAULT 0.00,
    premio_gol_de_ouro DECIMAL(10,2) DEFAULT 0.00,
    is_gol_de_ouro BOOLEAN DEFAULT FALSE,
    contador_global INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PASSO 7: ADICIONAR TODAS AS COLUNAS FALTANTES NA TABELA CHUTES
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar lote_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chutes' AND column_name = 'lote_id') THEN
        ALTER TABLE chutes ADD COLUMN lote_id VARCHAR(100);
        RAISE NOTICE 'Coluna lote_id adicionada à tabela chutes';
    END IF;
    
    -- Adicionar valor_aposta se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chutes' AND column_name = 'valor_aposta') THEN
        ALTER TABLE chutes ADD COLUMN valor_aposta DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        RAISE NOTICE 'Coluna valor_aposta adicionada à tabela chutes';
    END IF;
    
    -- Adicionar resultado se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chutes' AND column_name = 'resultado') THEN
        ALTER TABLE chutes ADD COLUMN resultado VARCHAR(20) DEFAULT 'pending';
        RAISE NOTICE 'Coluna resultado adicionada à tabela chutes';
    END IF;
    
    -- Adicionar premio se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chutes' AND column_name = 'premio') THEN
        ALTER TABLE chutes ADD COLUMN premio DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna premio adicionada à tabela chutes';
    END IF;
    
    -- Adicionar premio_gol_de_ouro se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chutes' AND column_name = 'premio_gol_de_ouro') THEN
        ALTER TABLE chutes ADD COLUMN premio_gol_de_ouro DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna premio_gol_de_ouro adicionada à tabela chutes';
    END IF;
    
    -- Adicionar is_gol_de_ouro se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chutes' AND column_name = 'is_gol_de_ouro') THEN
        ALTER TABLE chutes ADD COLUMN is_gol_de_ouro BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna is_gol_de_ouro adicionada à tabela chutes';
    END IF;
    
    -- Adicionar contador_global se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chutes' AND column_name = 'contador_global') THEN
        ALTER TABLE chutes ADD COLUMN contador_global INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Coluna contador_global adicionada à tabela chutes';
    END IF;
    
    -- Adicionar created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chutes' AND column_name = 'created_at') THEN
        ALTER TABLE chutes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada à tabela chutes';
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chutes' AND column_name = 'updated_at') THEN
        ALTER TABLE chutes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela chutes';
    END IF;
END $$;

-- =====================================================
-- PASSO 8: CRIAR TABELA SAQUES COMPLETA
-- =====================================================

CREATE TABLE IF NOT EXISTS saques (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    metodo VARCHAR(20) DEFAULT 'pix',
    pix_key VARCHAR(255),
    pix_type VARCHAR(50),
    dados_saque JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PASSO 9: ADICIONAR TODAS AS COLUNAS FALTANTES NA TABELA SAQUES
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar valor se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'saques' AND column_name = 'valor') THEN
        ALTER TABLE saques ADD COLUMN valor DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        RAISE NOTICE 'Coluna valor adicionada à tabela saques';
    END IF;
    
    -- Adicionar status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'saques' AND column_name = 'status') THEN
        ALTER TABLE saques ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
        RAISE NOTICE 'Coluna status adicionada à tabela saques';
    END IF;
    
    -- Adicionar metodo se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'saques' AND column_name = 'metodo') THEN
        ALTER TABLE saques ADD COLUMN metodo VARCHAR(20) DEFAULT 'pix';
        RAISE NOTICE 'Coluna metodo adicionada à tabela saques';
    END IF;
    
    -- Adicionar pix_key se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'saques' AND column_name = 'pix_key') THEN
        ALTER TABLE saques ADD COLUMN pix_key VARCHAR(255);
        RAISE NOTICE 'Coluna pix_key adicionada à tabela saques';
    END IF;
    
    -- Adicionar pix_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'saques' AND column_name = 'pix_type') THEN
        ALTER TABLE saques ADD COLUMN pix_type VARCHAR(50);
        RAISE NOTICE 'Coluna pix_type adicionada à tabela saques';
    END IF;
    
    -- Adicionar dados_saque se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'saques' AND column_name = 'dados_saque') THEN
        ALTER TABLE saques ADD COLUMN dados_saque JSONB;
        RAISE NOTICE 'Coluna dados_saque adicionada à tabela saques';
    END IF;
    
    -- Adicionar created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'saques' AND column_name = 'created_at') THEN
        ALTER TABLE saques ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada à tabela saques';
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'saques' AND column_name = 'updated_at') THEN
        ALTER TABLE saques ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela saques';
    END IF;
END $$;

-- =====================================================
-- PASSO 10: CRIAR TABELA MÉTRICAS GLOBAIS COMPLETA
-- =====================================================

CREATE TABLE IF NOT EXISTS metricas_globais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contador_chutes_global INTEGER DEFAULT 0,
    ultimo_gol_de_ouro INTEGER DEFAULT 0,
    total_premios_distribuidos DECIMAL(10,2) DEFAULT 0.00,
    total_gols_de_ouro INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PASSO 11: ADICIONAR TODAS AS COLUNAS FALTANTES NA TABELA MÉTRICAS GLOBAIS
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar contador_chutes_global se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'metricas_globais' AND column_name = 'contador_chutes_global') THEN
        ALTER TABLE metricas_globais ADD COLUMN contador_chutes_global INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna contador_chutes_global adicionada à tabela metricas_globais';
    END IF;
    
    -- Adicionar ultimo_gol_de_ouro se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'metricas_globais' AND column_name = 'ultimo_gol_de_ouro') THEN
        ALTER TABLE metricas_globais ADD COLUMN ultimo_gol_de_ouro INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna ultimo_gol_de_ouro adicionada à tabela metricas_globais';
    END IF;
    
    -- Adicionar total_premios_distribuidos se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'metricas_globais' AND column_name = 'total_premios_distribuidos') THEN
        ALTER TABLE metricas_globais ADD COLUMN total_premios_distribuidos DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna total_premios_distribuidos adicionada à tabela metricas_globais';
    END IF;
    
    -- Adicionar total_gols_de_ouro se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'metricas_globais' AND column_name = 'total_gols_de_ouro') THEN
        ALTER TABLE metricas_globais ADD COLUMN total_gols_de_ouro INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna total_gols_de_ouro adicionada à tabela metricas_globais';
    END IF;
    
    -- Adicionar created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'metricas_globais' AND column_name = 'created_at') THEN
        ALTER TABLE metricas_globais ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada à tabela metricas_globais';
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'metricas_globais' AND column_name = 'updated_at') THEN
        ALTER TABLE metricas_globais ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela metricas_globais';
    END IF;
END $$;

-- =====================================================
-- PASSO 12: INSERIR REGISTRO INICIAL DE MÉTRICAS
-- =====================================================

INSERT INTO metricas_globais (contador_chutes_global, ultimo_gol_de_ouro) 
SELECT 0, 0
WHERE NOT EXISTS (SELECT 1 FROM metricas_globais);

-- =====================================================
-- PASSO 13: CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);

-- Índices para pagamentos_pix
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario ON pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos_pix(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_external_id ON pagamentos_pix(external_id);

-- Índices para chutes
CREATE INDEX IF NOT EXISTS idx_chutes_usuario ON chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote ON chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_chutes_resultado ON chutes(resultado);
CREATE INDEX IF NOT EXISTS idx_chutes_contador ON chutes(contador_global);

-- Índices para saques
CREATE INDEX IF NOT EXISTS idx_saques_usuario ON saques(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_status ON saques(status);

-- =====================================================
-- PASSO 14: TESTE DE FUNCIONAMENTO COMPLETO
-- =====================================================

-- Testar inserção de usuário
INSERT INTO usuarios (email, password_hash, username, saldo, role, account_status)
VALUES ('teste@completo.com', 'hash_teste_completo', 'TesteCompleto', 0.00, 'player', 'active')
ON CONFLICT (email) DO NOTHING;

-- Verificar se o usuário foi criado
SELECT id, email, username, saldo, role, account_status FROM usuarios WHERE email = 'teste@completo.com';

-- =====================================================
-- PASSO 15: VERIFICAÇÃO FINAL COMPLETA
-- =====================================================

-- Verificar estrutura final de todas as tabelas
SELECT 'USUARIOS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'PAGAMENTOS_PIX' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pagamentos_pix' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'CHUTES' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chutes' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'SAQUES' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'saques' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'METRICAS_GLOBAIS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'metricas_globais' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar todas as tabelas criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('usuarios', 'pagamentos_pix', 'chutes', 'saques', 'metricas_globais')
ORDER BY table_name;

-- =====================================================
-- SCHEMA FINALIZADO - VERSÃO COMPLETA E FINAL
-- =====================================================
-- Status: ✅ CORREÇÃO COMPLETA E FINAL APLICADA
-- Data: 17/10/2025
-- Versão: v3.0-complete-fix
