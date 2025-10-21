-- Script para corrigir tabelas existentes no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar colunas se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna username se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'username') THEN
        ALTER TABLE usuarios ADD COLUMN username VARCHAR(100);
    END IF;
    
    -- Adicionar coluna senha se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'senha') THEN
        ALTER TABLE usuarios ADD COLUMN senha VARCHAR(255);
    END IF;
    
    -- Adicionar coluna nome se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'nome') THEN
        ALTER TABLE usuarios ADD COLUMN nome VARCHAR(255);
    END IF;
    
    -- Adicionar coluna saldo se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'saldo') THEN
        ALTER TABLE usuarios ADD COLUMN saldo DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Adicionar coluna tipo se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'tipo') THEN
        ALTER TABLE usuarios ADD COLUMN tipo VARCHAR(50) DEFAULT 'jogador';
    END IF;
END $$;

-- 2. Verificar se existe coluna senha_hash e ajustar constraint
DO $$ 
BEGIN
    -- Se existe coluna senha_hash, tornar ela nullable temporariamente
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'usuarios' AND column_name = 'senha_hash') THEN
        ALTER TABLE usuarios ALTER COLUMN senha_hash DROP NOT NULL;
    END IF;
END $$;

-- 3. Atualizar usuário existente com dados corretos
UPDATE usuarios 
SET username = 'free10signer', 
    nome = 'free10signer',
    saldo = 0.00,
    senha = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    senha_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'free10signer@gmail.com';

-- 4. Inserir usuário se não existir (sem conflito)
INSERT INTO usuarios (email, nome, username, senha, senha_hash, saldo, tipo) 
SELECT 'free10signer@gmail.com', 'free10signer', 'free10signer', 
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       0.00, 'jogador'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'free10signer@gmail.com');

-- 5. Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS chutes (
    id SERIAL PRIMARY KEY,
    lote_id VARCHAR(100),
    usuario_id UUID REFERENCES usuarios(id),
    zona VARCHAR(50),
    potencia INTEGER,
    angulo INTEGER,
    valor_aposta DECIMAL(10,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    gol_marcado BOOLEAN DEFAULT false,
    premio DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS pagamentos_pix (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    payment_id VARCHAR(100) UNIQUE,
    valor DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    qr_code TEXT,
    qr_code_base64 TEXT,
    pix_copy_paste TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    init_point TEXT,
    real BOOLEAN DEFAULT false,
    banco VARCHAR(50) DEFAULT 'memoria',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saques (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    valor DECIMAL(10,2),
    chave_pix VARCHAR(255),
    tipo_chave VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS lotes (
    id VARCHAR(100) PRIMARY KEY,
    tamanho INTEGER DEFAULT 10,
    chutes_coletados INTEGER DEFAULT 0,
    ganhador_id UUID REFERENCES usuarios(id),
    status VARCHAR(50) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE
);

-- 6. Habilitar RLS se não estiver habilitado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas básicas (ignorar se já existirem)
DO $$ 
BEGIN
    -- Política para usuários
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'Usuários podem ver apenas seus próprios dados') THEN
        CREATE POLICY "Usuários podem ver apenas seus próprios dados" ON usuarios
            FOR ALL USING (auth.uid() = id);
    END IF;
    
    -- Política para chutes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chutes' AND policyname = 'Usuários podem ver apenas seus próprios chutes') THEN
        CREATE POLICY "Usuários podem ver apenas seus próprios chutes" ON chutes
            FOR ALL USING (auth.uid() = usuario_id);
    END IF;
    
    -- Política para pagamentos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pagamentos_pix' AND policyname = 'Usuários podem ver apenas seus próprios pagamentos') THEN
        CREATE POLICY "Usuários podem ver apenas seus próprios pagamentos" ON pagamentos_pix
            FOR ALL USING (auth.uid() = usuario_id);
    END IF;
    
    -- Política para saques
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saques' AND policyname = 'Usuários podem ver apenas seus próprios saques') THEN
        CREATE POLICY "Usuários podem ver apenas seus próprios saques" ON saques
            FOR ALL USING (auth.uid() = usuario_id);
    END IF;
    
    -- Política para lotes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lotes' AND policyname = 'Lotes são públicos para leitura') THEN
        CREATE POLICY "Lotes são públicos para leitura" ON lotes
            FOR SELECT USING (true);
    END IF;
END $$;

-- 8. Criar função para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Criar triggers se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usuarios_updated_at') THEN
        CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pagamentos_updated_at') THEN
        CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos_pix
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 10. Criar índices se não existirem (apenas se as colunas existirem)
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Criar índices para chutes apenas se a tabela e colunas existirem
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chutes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chutes' AND column_name = 'usuario_id') THEN
            CREATE INDEX IF NOT EXISTS idx_chutes_usuario_id ON chutes(usuario_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chutes' AND column_name = 'lote_id') THEN
            CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON chutes(lote_id);
        END IF;
    END IF;
END $$;

-- Criar índices para pagamentos_pix apenas se a tabela e colunas existirem
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos_pix') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos_pix' AND column_name = 'usuario_id') THEN
            CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON pagamentos_pix(usuario_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos_pix' AND column_name = 'payment_id') THEN
            CREATE INDEX IF NOT EXISTS idx_pagamentos_payment_id ON pagamentos_pix(payment_id);
        END IF;
    END IF;
END $$;

-- Criar índices para saques apenas se a tabela e colunas existirem
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saques') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saques' AND column_name = 'usuario_id') THEN
            CREATE INDEX IF NOT EXISTS idx_saques_usuario_id ON saques(usuario_id);
        END IF;
    END IF;
END $$;

-- Script executado com sucesso!
SELECT 'Tabelas corrigidas e configuradas com sucesso!' as status;
