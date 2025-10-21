-- =====================================================
-- CORREÇÃO DEFINITIVA - ESTRUTURA TABELA USUARIOS
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO DEFINITIVA DO SCHEMA
-- Versão: v2.0-final-fix

-- =====================================================
-- PASSO 1: VERIFICAR ESTRUTURA ATUAL
-- =====================================================

-- Verificar se a tabela usuarios existe e sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 2: CRIAR TABELA USUARIOS CORRETA (SE NÃO EXISTIR)
-- =====================================================

-- Criar tabela usuarios com estrutura correta
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username VARCHAR(100) NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    role VARCHAR(20) DEFAULT 'player',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PASSO 3: ADICIONAR COLUNAS FALTANTES (SE TABELA JÁ EXISTIR)
-- =====================================================

-- Adicionar colunas que podem estar faltando
DO $$ 
BEGIN
    -- Adicionar password_hash se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'password_hash') THEN
        ALTER TABLE usuarios ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Coluna password_hash adicionada';
    END IF;
    
    -- Adicionar username se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'username') THEN
        ALTER TABLE usuarios ADD COLUMN username VARCHAR(100);
        RAISE NOTICE 'Coluna username adicionada';
    END IF;
    
    -- Adicionar saldo se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'saldo') THEN
        ALTER TABLE usuarios ADD COLUMN saldo DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna saldo adicionada';
    END IF;
    
    -- Adicionar role se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'role') THEN
        ALTER TABLE usuarios ADD COLUMN role VARCHAR(20) DEFAULT 'player';
        RAISE NOTICE 'Coluna role adicionada';
    END IF;
    
    -- Adicionar created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'created_at') THEN
        ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada';
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'updated_at') THEN
        ALTER TABLE usuarios ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada';
    END IF;
END $$;

-- =====================================================
-- PASSO 4: CRIAR TABELA PAGAMENTOS_PIX (SE NÃO EXISTIR)
-- =====================================================

CREATE TABLE IF NOT EXISTS pagamentos_pix (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
-- PASSO 5: CRIAR TABELA CHUTES (SE NÃO EXISTIR)
-- =====================================================

CREATE TABLE IF NOT EXISTS chutes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
-- PASSO 6: CRIAR TABELA SAQUES (SE NÃO EXISTIR)
-- =====================================================

CREATE TABLE IF NOT EXISTS saques (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
-- PASSO 7: CRIAR TABELA MÉTRICAS GLOBAIS (SE NÃO EXISTIR)
-- =====================================================

CREATE TABLE IF NOT EXISTS metricas_globais (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contador_chutes_global INTEGER DEFAULT 0,
    ultimo_gol_de_ouro INTEGER DEFAULT 0,
    total_premios_distribuidos DECIMAL(10,2) DEFAULT 0.00,
    total_gols_de_ouro INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registro inicial de métricas apenas se não existir
INSERT INTO metricas_globais (contador_chutes_global, ultimo_gol_de_ouro) 
SELECT 0, 0
WHERE NOT EXISTS (SELECT 1 FROM metricas_globais);

-- =====================================================
-- PASSO 8: CRIAR ÍNDICES PARA PERFORMANCE
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
-- PASSO 9: TESTE DE FUNCIONAMENTO
-- =====================================================

-- Testar inserção de usuário
INSERT INTO usuarios (email, password_hash, username, saldo, role)
VALUES ('teste@final.com', 'hash_teste_final', 'TesteFinal', 0.00, 'player')
ON CONFLICT (email) DO NOTHING;

-- Verificar se o usuário foi criado
SELECT id, email, username, saldo, role FROM usuarios WHERE email = 'teste@final.com';

-- =====================================================
-- PASSO 10: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura final da tabela usuarios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
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
-- SCHEMA FINALIZADO - VERSÃO DEFINITIVA
-- =====================================================
-- Status: ✅ CORREÇÃO DEFINITIVA APLICADA
-- Data: 17/10/2025
-- Versão: v2.0-final-fix
