-- =====================================================
-- SCHEMA SUPABASE CORRIGIDO - GOL DE OURO v2.0-REAL
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO CRÍTICA PARA 100% REAL
-- Versão: v2.0-real-fixed

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA DE USUÁRIOS (CORRIGIDA)
-- =====================================================

-- Dropar tabela se existir (CUIDADO EM PRODUÇÃO!)
DROP TABLE IF EXISTS usuarios CASCADE;

-- Criar tabela de usuários com estrutura correta
CREATE TABLE usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username VARCHAR(100) NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    role VARCHAR(20) DEFAULT 'player',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);

-- =====================================================
-- TABELA DE PAGAMENTOS PIX (REAL)
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

-- Índices para pagamentos
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario ON pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos_pix(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_external_id ON pagamentos_pix(external_id);

-- =====================================================
-- TABELA DE CHUTES (REAL)
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

-- Índices para chutes
CREATE INDEX IF NOT EXISTS idx_chutes_usuario ON chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote ON chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_chutes_resultado ON chutes(resultado);
CREATE INDEX IF NOT EXISTS idx_chutes_contador ON chutes(contador_global);

-- =====================================================
-- TABELA DE SAQUES (REAL)
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

-- Índices para saques
CREATE INDEX IF NOT EXISTS idx_saques_usuario ON saques(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_status ON saques(status);

-- =====================================================
-- TABELA DE MÉTRICAS GLOBAIS (REAL)
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

-- Inserir registro inicial de métricas
INSERT INTO metricas_globais (contador_chutes_global, ultimo_gol_de_ouro) 
VALUES (0, 0) 
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS (ROW LEVEL SECURITY) - SEGURANÇA
-- =====================================================

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saques ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para usuários
CREATE POLICY "Usuários podem ver apenas seus próprios dados" ON usuarios
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Usuários podem inserir seus próprios dados" ON usuarios
    FOR INSERT WITH CHECK (true);

-- Políticas para pagamentos
CREATE POLICY "Usuários podem ver apenas seus pagamentos" ON pagamentos_pix
    FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem inserir seus pagamentos" ON pagamentos_pix
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Políticas para chutes
CREATE POLICY "Usuários podem ver apenas seus chutes" ON chutes
    FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem inserir seus chutes" ON chutes
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Políticas para saques
CREATE POLICY "Usuários podem ver apenas seus saques" ON saques
    FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem inserir seus saques" ON saques
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos_pix
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chutes_updated_at BEFORE UPDATE ON chutes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saques_updated_at BEFORE UPDATE ON saques
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metricas_updated_at BEFORE UPDATE ON metricas_globais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir usuário admin padrão (opcional)
-- INSERT INTO usuarios (email, password_hash, username, role) 
-- VALUES ('admin@goldeouro.lol', '$2a$10$hash_aqui', 'Admin', 'admin')
-- ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('usuarios', 'pagamentos_pix', 'chutes', 'saques', 'metricas_globais');

-- Verificar RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'pagamentos_pix', 'chutes', 'saques');

-- =====================================================
-- SCHEMA FINALIZADO
-- =====================================================
-- Status: ✅ PRONTO PARA 100% REAL
-- Data: 17/10/2025
-- Versão: v2.0-real-fixed
