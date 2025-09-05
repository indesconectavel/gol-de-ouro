-- Otimizações de banco de dados para Gol de Ouro
-- Execute estas queries para melhorar a performance

-- 1. Índices para tabelas principais
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. Índices para jogos
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_status_created ON games(status, created_at);

-- 3. Índices para apostas
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_id ON bets(game_id);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_user_created ON bets(user_id, created_at);

-- 4. Índices para transações
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at);

-- 5. Índices compostos para queries complexas
CREATE INDEX IF NOT EXISTS idx_games_user_status ON games(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bets_game_status ON bets(game_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);

-- 6. Índices parciais para dados ativos
CREATE INDEX IF NOT EXISTS idx_active_games ON games(created_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pending_bets ON bets(created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_completed_transactions ON transactions(created_at) WHERE status = 'completed';

-- 7. Otimizações de tabelas
-- Atualizar estatísticas
ANALYZE users;
ANALYZE games;
ANALYZE bets;
ANALYZE transactions;

-- 8. Configurações de performance
-- Ajustar configurações do PostgreSQL para melhor performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- 9. Views materializadas para relatórios
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    COUNT(DISTINCT g.id) as total_games,
    COUNT(DISTINCT b.id) as total_bets,
    COALESCE(SUM(b.amount), 0) as total_wagered,
    COALESCE(SUM(CASE WHEN b.status = 'won' THEN b.amount * b.multiplier ELSE 0 END), 0) as total_won,
    COALESCE(SUM(t.amount), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN t.type = 'withdrawal' THEN t.amount ELSE 0 END), 0) as total_withdrawals
FROM users u
LEFT JOIN games g ON u.id = g.user_id
LEFT JOIN bets b ON g.id = b.game_id
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.email, u.created_at;

-- Índice para a view materializada
CREATE INDEX IF NOT EXISTS idx_user_stats_id ON user_stats(id);
CREATE INDEX IF NOT EXISTS idx_user_stats_created_at ON user_stats(created_at);

-- 10. Função para atualizar estatísticas
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
END;
$$ LANGUAGE plpgsql;

-- 11. Triggers para atualização automática
CREATE OR REPLACE FUNCTION trigger_refresh_user_stats()
RETURNS trigger AS $$
BEGIN
    PERFORM refresh_user_stats();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS refresh_user_stats_on_bet ON bets;
CREATE TRIGGER refresh_user_stats_on_bet
    AFTER INSERT OR UPDATE OR DELETE ON bets
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_user_stats();

DROP TRIGGER IF EXISTS refresh_user_stats_on_transaction ON transactions;
CREATE TRIGGER refresh_user_stats_on_transaction
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_user_stats();

-- 12. Queries otimizadas para relatórios
-- Query otimizada para dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as new_users_today,
    (SELECT COUNT(*) FROM games WHERE status = 'active') as active_games,
    (SELECT COUNT(*) FROM games WHERE created_at >= CURRENT_DATE) as games_today,
    (SELECT COALESCE(SUM(amount), 0) FROM bets WHERE created_at >= CURRENT_DATE) as total_wagered_today,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'deposit' AND created_at >= CURRENT_DATE) as total_deposits_today,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'withdrawal' AND created_at >= CURRENT_DATE) as total_withdrawals_today;

-- 13. Particionamento de tabelas por data (para grandes volumes)
-- Criar tabela particionada para logs
CREATE TABLE IF NOT EXISTS game_logs (
    id SERIAL,
    game_id INTEGER,
    user_id INTEGER,
    action VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Criar partições mensais
CREATE TABLE IF NOT EXISTS game_logs_2024_01 PARTITION OF game_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE IF NOT EXISTS game_logs_2024_02 PARTITION OF game_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- 14. Configurações de conexão
-- Pool de conexões otimizado
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- 15. Monitoramento de performance
-- Habilitar extensão de estatísticas
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View para queries lentas
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 1000  -- Queries com mais de 1 segundo
ORDER BY mean_time DESC;

-- 16. Limpeza automática de dados antigos
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Limpar logs antigos (manter apenas 30 dias)
    DELETE FROM game_logs WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Limpar sessões expiradas
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    -- Atualizar estatísticas
    ANALYZE;
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza diária
-- (Execute via cron job ou pg_cron)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');
