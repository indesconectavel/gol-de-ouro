-- Script para prevenir pausa do Supabase fazendo atividade no banco
-- Executar periodicamente no Supabase SQL Editor

-- 1. Query simples para gerar atividade
SELECT COUNT(*) as total_users FROM usuarios;
SELECT COUNT(*) as total_transactions FROM transacoes;
SELECT COUNT(*) as total_payments FROM pagamentos_pix WHERE status = 'pending';

-- 2. Verificar estatísticas do banco
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 10;

-- 3. Verificar conexões ativas
SELECT 
    COUNT(*) as active_connections,
    state,
    application_name
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state, application_name;

-- 4. Verificar tamanho do banco
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Este script deve ser executado periodicamente (diariamente) para manter atividade

