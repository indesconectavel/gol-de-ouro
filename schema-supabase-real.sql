-- Script para criar tabelas no Supabase REAL
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de usuários (usando UUID para compatibilidade)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255),
    username VARCHAR(100),
    senha VARCHAR(255),
    saldo DECIMAL(10,2) DEFAULT 0.00,
    tipo VARCHAR(50) DEFAULT 'jogador',
    ativo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    telefone VARCHAR(20),
    data_nascimento DATE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    total_apostas INTEGER DEFAULT 0,
    total_ganhos DECIMAL(10,2) DEFAULT 0.00,
    total_partidas INTEGER DEFAULT 0,
    total_gols INTEGER DEFAULT 0,
    ranking INTEGER DEFAULT 0
);

-- 2. Tabela de chutes
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

-- 3. Tabela de pagamentos PIX
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

-- 4. Tabela de saques
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

-- 5. Tabela de lotes
CREATE TABLE IF NOT EXISTS lotes (
    id VARCHAR(100) PRIMARY KEY,
    tamanho INTEGER DEFAULT 10,
    chutes_coletados INTEGER DEFAULT 0,
    ganhador_id UUID REFERENCES usuarios(id),
    status VARCHAR(50) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE
);

-- 6. Inserir usuário de teste
INSERT INTO usuarios (email, nome, username, senha, saldo, tipo) 
VALUES ('free10signer@gmail.com', 'free10signer', 'free10signer', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0.00, 'jogador')
ON CONFLICT (email) DO UPDATE SET 
    nome = EXCLUDED.nome,
    username = EXCLUDED.username,
    saldo = EXCLUDED.saldo;

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

-- 8. Políticas básicas de RLS
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver apenas seus próprios dados" ON usuarios
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Usuários podem ver apenas seus próprios chutes" ON chutes
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver apenas seus próprios pagamentos" ON pagamentos_pix
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver apenas seus próprios saques" ON saques
    FOR ALL USING (auth.uid() = usuario_id);

-- Lotes são públicos para leitura
CREATE POLICY "Lotes são públicos para leitura" ON lotes
    FOR SELECT USING (true);

-- 9. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos_pix
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_chutes_usuario_id ON chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_payment_id ON pagamentos_pix(payment_id);
CREATE INDEX IF NOT EXISTS idx_saques_usuario_id ON saques(usuario_id);

-- 12. Comentários das tabelas
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema Gol de Ouro';
COMMENT ON TABLE chutes IS 'Tabela de chutes dos jogadores';
COMMENT ON TABLE pagamentos_pix IS 'Tabela de pagamentos PIX';
COMMENT ON TABLE saques IS 'Tabela de saques dos usuários';
COMMENT ON TABLE lotes IS 'Tabela de lotes do jogo';

-- Script executado com sucesso!
SELECT 'Tabelas criadas com sucesso no Supabase!' as status;
