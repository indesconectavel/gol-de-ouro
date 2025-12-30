-- 🗄️ ESTRUTURA COMPLETA DO BANCO DE DADOS - GOL DE OURO v1.1.1
-- Execute este SQL no Supabase para criar todas as tabelas necessárias

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  saldo DECIMAL(10,2) DEFAULT 0.00,
  role VARCHAR(20) DEFAULT 'player',
  account_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de chutes
CREATE TABLE IF NOT EXISTS chutes (
  id SERIAL PRIMARY KEY,
  lote_id VARCHAR(100) NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  zona VARCHAR(20) NOT NULL,
  potencia INTEGER NOT NULL,
  angulo INTEGER NOT NULL,
  valor_aposta DECIMAL(10,2) NOT NULL,
  resultado VARCHAR(20),
  gol_marcado BOOLEAN DEFAULT FALSE,
  premio DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de pagamentos PIX
CREATE TABLE IF NOT EXISTS pagamentos_pix (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  qr_code TEXT,
  qr_code_base64 TEXT,
  pix_copy_paste TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  tipo VARCHAR(20) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_posterior DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  referencia VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pendente',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de saques
CREATE TABLE IF NOT EXISTS saques (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  valor DECIMAL(10,2) NOT NULL,
  chave_pix VARCHAR(255) NOT NULL,
  tipo_chave VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Tabela de lotes (para controle)
CREATE TABLE IF NOT EXISTS lotes (
  id VARCHAR(100) PRIMARY KEY,
  chutes_coletados INTEGER DEFAULT 0,
  ganhador_indice INTEGER,
  status VARCHAR(20) DEFAULT 'coletando',
  created_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chutes_usuario ON chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote ON chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario ON pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario ON transacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_usuario ON saques(usuario_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saques ENABLE ROW LEVEL SECURITY;

-- Política para usuários (podem ver apenas seus próprios dados)
CREATE POLICY "Usuários podem ver apenas seus próprios dados" ON usuarios
  FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Usuários podem ver apenas seus próprios chutes" ON chutes
  FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem ver apenas seus próprios pagamentos" ON pagamentos_pix
  FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem ver apenas suas próprias transações" ON transacoes
  FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem ver apenas seus próprios saques" ON saques
  FOR ALL USING (auth.uid()::text = usuario_id::text);

-- Política para admins (podem ver tudo)
CREATE POLICY "Admins podem ver todos os usuários" ON usuarios
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins podem ver todos os chutes" ON chutes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins podem ver todos os pagamentos" ON pagamentos_pix
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins podem ver todas as transações" ON transacoes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins podem ver todos os saques" ON saques
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_pix_updated_at BEFORE UPDATE ON pagamentos_pix
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO usuarios (email, password_hash, username, saldo, role) VALUES
('admin@goldeouro.lol', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1000.00, 'admin')
ON CONFLICT (email) DO NOTHING;

-- Inserir usuário de teste (senha: test123)
INSERT INTO usuarios (email, password_hash, username, saldo, role) VALUES
('test@goldeouro.lol', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'testuser', 100.00, 'player')
ON CONFLICT (email) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema Gol de Ouro';
COMMENT ON TABLE chutes IS 'Tabela de chutes dos jogadores';
COMMENT ON TABLE pagamentos_pix IS 'Tabela de pagamentos PIX via Mercado Pago';
COMMENT ON TABLE transacoes IS 'Tabela de transações financeiras';
COMMENT ON TABLE saques IS 'Tabela de solicitações de saque';
COMMENT ON TABLE lotes IS 'Tabela de controle de lotes de chutes';

-- Verificar se as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('usuarios', 'chutes', 'pagamentos_pix', 'transacoes', 'saques', 'lotes')
ORDER BY table_name;
