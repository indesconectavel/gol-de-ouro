-- Gol de Ouro - Schema Supabase Produção Real v1.1.1
-- =====================================================
-- Projeto: goldeouro-production (ID: gayopagjdrkcmkirmfvy)
-- Data: 16 de Outubro de 2025

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    cpf VARCHAR(14),
    birth_date DATE,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    role VARCHAR(50) DEFAULT 'player',
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_deposits DECIMAL(10,2) DEFAULT 0.00,
    total_withdrawals DECIMAL(10,2) DEFAULT 0.00,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de jogos
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_bet DECIMAL(10,2) DEFAULT 1.00,
    max_bet DECIMAL(10,2) DEFAULT 1000.00,
    house_edge DECIMAL(5,2) DEFAULT 2.00,
    is_active BOOLEAN DEFAULT true,
    icon_url TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de apostas
CREATE TABLE IF NOT EXISTS bets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    multiplier DECIMAL(8,2) NOT NULL,
    result VARCHAR(50) NOT NULL, -- 'win', 'lose', 'pending'
    payout DECIMAL(10,2) DEFAULT 0.00,
    game_data JSONB, -- Dados específicos do jogo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'bet', 'win', 'bonus'
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    description TEXT,
    reference_id VARCHAR(255), -- ID externo (Mercado Pago, etc.)
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pagamentos PIX
CREATE TABLE IF NOT EXISTS pix_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    mercado_pago_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    pix_code TEXT,
    qr_code TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(255),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Índices para bets
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_id ON bets(game_id);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at);
CREATE INDEX IF NOT EXISTS idx_bets_result ON bets(result);

-- Índices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Índices para pix_payments
CREATE INDEX IF NOT EXISTS idx_pix_payments_user_id ON pix_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_pix_payments_mercado_pago_id ON pix_payments(mercado_pago_id);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para bets
CREATE POLICY "Users can view own bets" ON bets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bets" ON bets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para pix_payments
CREATE POLICY "Users can view own pix payments" ON pix_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pix payments" ON pix_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pix_payments_updated_at BEFORE UPDATE ON pix_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir jogos padrão
INSERT INTO games (name, description, min_bet, max_bet, house_edge, category) VALUES
('Crash', 'Aposte no multiplicador antes que o avião caia!', 1.00, 1000.00, 2.00, 'crash'),
('Dice', 'Aposte no resultado dos dados!', 1.00, 500.00, 1.50, 'dice'),
('Plinko', 'Deixe a bola cair e ganhe multiplicadores!', 1.00, 200.00, 2.50, 'plinko'),
('Mines', 'Encontre as minas e multiplique seus ganhos!', 1.00, 1000.00, 1.00, 'mines')
ON CONFLICT DO NOTHING;

-- Inserir configurações padrão
INSERT INTO system_settings (key, value, description, is_public) VALUES
('site_name', 'Gol de Ouro', 'Nome do site', true),
('site_description', 'Plataforma de jogos online', 'Descrição do site', true),
('min_deposit', '10.00', 'Valor mínimo para depósito', true),
('max_deposit', '10000.00', 'Valor máximo para depósito', true),
('min_withdrawal', '20.00', 'Valor mínimo para saque', true),
('max_withdrawal', '5000.00', 'Valor máximo para saque', true),
('maintenance_mode', 'false', 'Modo de manutenção', false),
('registration_enabled', 'true', 'Registro de usuários habilitado', true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para estatísticas do usuário
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.balance,
    u.total_deposits,
    u.total_withdrawals,
    COUNT(b.id) as total_bets,
    COALESCE(SUM(b.amount), 0) as total_wagered,
    COALESCE(SUM(CASE WHEN b.result = 'win' THEN b.payout ELSE 0 END), 0) as total_winnings,
    u.created_at,
    u.last_login
FROM users u
LEFT JOIN bets b ON u.id = b.user_id
GROUP BY u.id, u.username, u.email, u.balance, u.total_deposits, u.total_withdrawals, u.created_at, u.last_login;

-- View para estatísticas gerais
CREATE OR REPLACE VIEW general_stats AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT b.id) as total_bets,
    COALESCE(SUM(b.amount), 0) as total_wagered,
    COALESCE(SUM(CASE WHEN b.result = 'win' THEN b.payout ELSE 0 END), 0) as total_winnings,
    COALESCE(SUM(t.amount), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN t.type = 'withdrawal' THEN t.amount ELSE 0 END), 0) as total_withdrawals
FROM users u
LEFT JOIN bets b ON u.id = b.user_id
LEFT JOIN transactions t ON u.id = t.user_id AND t.type = 'deposit';

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE users IS 'Tabela de usuários do sistema';
COMMENT ON TABLE games IS 'Tabela de jogos disponíveis';
COMMENT ON TABLE bets IS 'Tabela de apostas dos usuários';
COMMENT ON TABLE transactions IS 'Tabela de transações financeiras';
COMMENT ON TABLE pix_payments IS 'Tabela de pagamentos PIX via Mercado Pago';
COMMENT ON TABLE system_settings IS 'Tabela de configurações do sistema';
COMMENT ON TABLE audit_logs IS 'Tabela de logs de auditoria';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================