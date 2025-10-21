-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DE ESTRUTURA - GOL DE OURO
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO DE INCONSISTÊNCIAS
-- Versão: v2.0-debug-fix

-- =====================================================
-- VERIFICAR ESTRUTURA ATUAL DAS TABELAS
-- =====================================================

-- Verificar estrutura da tabela usuarios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela pagamentos_pix
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pagamentos_pix' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- CORRIGIR ESTRUTURA DA TABELA PAGAMENTOS_PIX
-- =====================================================

-- Adicionar colunas que podem estar faltando
DO $$ 
BEGIN
    -- Adicionar external_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'external_id') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN external_id VARCHAR(100);
    END IF;
    
    -- Adicionar amount se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'amount') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN amount DECIMAL(10,2);
    END IF;
    
    -- Adicionar status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'status') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;
    
    -- Adicionar qr_code se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'qr_code') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN qr_code TEXT;
    END IF;
    
    -- Adicionar qr_code_base64 se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'qr_code_base64') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN qr_code_base64 TEXT;
    END IF;
    
    -- Adicionar pix_copy_paste se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'pix_copy_paste') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN pix_copy_paste TEXT;
    END IF;
    
    -- Adicionar usuario_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'usuario_id') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN usuario_id UUID REFERENCES usuarios(id);
    END IF;
    
    -- Adicionar created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'created_at') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pagamentos_pix' AND column_name = 'updated_at') THEN
        ALTER TABLE pagamentos_pix ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- VERIFICAR ESTRUTURA APÓS CORREÇÃO
-- =====================================================

-- Verificar estrutura corrigida da tabela pagamentos_pix
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pagamentos_pix' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- TESTE DE INSERÇÃO SIMPLES
-- =====================================================

-- Testar inserção de um registro de teste
INSERT INTO usuarios (email, password_hash, username, saldo, role)
VALUES ('teste@schema.com', 'hash_teste', 'TesteSchema', 0.00, 'player')
ON CONFLICT (email) DO NOTHING;

-- Verificar se o usuário foi criado
SELECT id, email, username, saldo, role FROM usuarios WHERE email = 'teste@schema.com';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar todas as tabelas criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('usuarios', 'pagamentos_pix', 'chutes', 'saques', 'metricas_globais')
ORDER BY table_name;

-- =====================================================
-- SCHEMA DE DEBUG FINALIZADO
-- =====================================================
-- Status: ✅ CORREÇÃO DE INCONSISTÊNCIAS
-- Data: 17/10/2025
-- Versão: v2.0-debug-fix
