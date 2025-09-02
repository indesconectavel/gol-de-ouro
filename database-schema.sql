-- Schema do Banco de Dados - Gol de Ouro
-- Execute este script no seu banco PostgreSQL

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar TEXT DEFAULT '',
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de jogos
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    players JSONB DEFAULT '[]',
    current_player INTEGER REFERENCES users(id),
    game_status VARCHAR(50) DEFAULT 'waiting',
    winner_user_id INTEGER REFERENCES users(id),
    prize_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de apostas
CREATE TABLE IF NOT EXISTS bets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    choice VARCHAR(100) NOT NULL,
    game_id INTEGER NOT NULL REFERENCES games(id),
    status VARCHAR(50) DEFAULT 'pending',
    prize DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de fila de jogadores
CREATE TABLE IF NOT EXISTS queue_board (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    position INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'waiting',
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de tentativas de chute
CREATE TABLE IF NOT EXISTS shot_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    shot_choice VARCHAR(100) NOT NULL,
    was_goal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    transaction_date TIMESTAMP DEFAULT NOW()
);

-- Tabela de pagamentos PIX
CREATE TABLE IF NOT EXISTS pix_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    mercado_pago_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    pix_code TEXT,
    qr_code TEXT,
    expires_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de webhooks do Mercado Pago
CREATE TABLE IF NOT EXISTS mercado_pago_webhooks (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payment_id VARCHAR(255),
    processed BOOLEAN DEFAULT FALSE,
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance (criados após as tabelas)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_id ON bets(game_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(game_status);
CREATE INDEX IF NOT EXISTS idx_queue_user_id ON queue_board(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_board(status);
CREATE INDEX IF NOT EXISTS idx_shot_user_id ON shot_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_user_id ON pix_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_pix_payments_mercado_pago_id ON pix_payments(mercado_pago_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON mercado_pago_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_webhooks_payment_id ON mercado_pago_webhooks(payment_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pix_payments_updated_at BEFORE UPDATE ON pix_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo (opcional)
INSERT INTO users (name, email, password_hash, balance) VALUES
('Admin', 'admin@goldeouro.com', '$2a$10$example.hash.here', 1000.00),
('Jogador 1', 'jogador1@test.com', '$2a$10$example.hash.here', 500.00),
('Jogador 2', 'jogador2@test.com', '$2a$10$example.hash.here', 300.00)
ON CONFLICT (email) DO NOTHING;
