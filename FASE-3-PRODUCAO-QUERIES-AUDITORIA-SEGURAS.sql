-- =====================================================
-- QUERIES DE AUDITORIA SEGURAS - PRODUÇÃO
-- Ambiente: Supabase goldeouro-production
-- Data: 19/12/2025
-- Status: APENAS SELECT - NENHUMA ALTERAÇÃO
-- =====================================================
-- ⚠️ REGRA ABSOLUTA: Estas queries são APENAS para leitura
-- ⚠️ NENHUMA query DROP, TRUNCATE, DELETE ou UPDATE será executada
-- =====================================================

-- =====================================================
-- QUERY 1: Verificar Estrutura de Tabelas
-- =====================================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- QUERY 2: Verificar Constraints e Integridade
-- =====================================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- QUERY 3: Verificar Funções Críticas
-- =====================================================
SELECT
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- =====================================================
-- QUERY 4: Verificar Índices
-- =====================================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- QUERY 5: Verificar RLS (Row Level Security)
-- =====================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- QUERY 6: Contagem de Registros (Sem Dados Sensíveis)
-- =====================================================
SELECT
    'usuarios' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE ativo = true) AS ativos,
    COUNT(*) FILTER (WHERE ativo = false) AS inativos
FROM usuarios
UNION ALL
SELECT
    'chutes' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'processado') AS processados,
    COUNT(*) FILTER (WHERE status != 'processado') AS pendentes
FROM chutes
UNION ALL
SELECT
    'lotes' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'ativo') AS ativos,
    COUNT(*) FILTER (WHERE status != 'ativo') AS outros
FROM lotes
UNION ALL
SELECT
    'transacoes' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas,
    COUNT(*) FILTER (WHERE status != 'concluida') AS pendentes
FROM transacoes
UNION ALL
SELECT
    'pagamentos_pix' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'pago') AS pagos,
    COUNT(*) FILTER (WHERE status != 'pago') AS pendentes
FROM pagamentos_pix
UNION ALL
SELECT
    'saques' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'processado') AS processados,
    COUNT(*) FILTER (WHERE status != 'processado') AS pendentes
FROM saques;

-- =====================================================
-- QUERY 7: Verificar Integridade de Saldos
-- =====================================================
SELECT
    COUNT(*) AS total_usuarios,
    COUNT(*) FILTER (WHERE saldo IS NULL) AS saldos_nulos,
    COUNT(*) FILTER (WHERE saldo < 0) AS saldos_negativos,
    COUNT(*) FILTER (WHERE saldo >= 0) AS saldos_validos,
    AVG(saldo) AS saldo_medio,
    MIN(saldo) AS saldo_minimo,
    MAX(saldo) AS saldo_maximo
FROM usuarios
WHERE ativo = true;

-- =====================================================
-- QUERY 8: Verificar Lotes Ativos
-- =====================================================
SELECT
    id,
    valor_aposta,
    status,
    posicao_atual,
    total_arrecadado,
    premio_total,
    created_at,
    updated_at
FROM lotes
WHERE status = 'ativo'
ORDER BY created_at DESC;

-- =====================================================
-- QUERY 9: Verificar Transações Recentes (Últimas 24h)
-- =====================================================
SELECT
    tipo,
    status,
    COUNT(*) AS quantidade,
    SUM(valor) AS valor_total
FROM transacoes
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY tipo, status
ORDER BY tipo, status;

-- =====================================================
-- QUERY 10: Verificar Pagamentos PIX Pendentes
-- =====================================================
SELECT
    status,
    COUNT(*) AS quantidade,
    SUM(valor) AS valor_total,
    MIN(created_at) AS mais_antigo,
    MAX(created_at) AS mais_recente
FROM pagamentos_pix
WHERE status IN ('pendente', 'processando')
GROUP BY status;

-- =====================================================
-- QUERY 11: Verificar Usuários de Teste
-- =====================================================
-- Identificar usuários de teste por email ou metadata
SELECT
    id,
    email,
    username,
    ativo,
    created_at,
    CASE 
        WHEN email LIKE '%+test%' OR email LIKE '%+staging%' THEN true
        ELSE false
    END AS identificado_como_teste
FROM usuarios
WHERE email LIKE '%+test%' 
   OR email LIKE '%+staging%'
   OR email LIKE '%test%'
ORDER BY created_at DESC;

-- =====================================================
-- QUERY 12: Verificar Funções Financeiras Críticas
-- =====================================================
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
        'rpc_add_balance',
        'rpc_deduct_balance',
        'rpc_transfer_balance',
        'rpc_get_balance',
        'rpc_process_payment',
        'rpc_process_withdrawal'
    )
ORDER BY routine_name;

-- =====================================================
-- QUERY 13: Verificar Funções de Jogo Críticas
-- =====================================================
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
        'rpc_register_shot',
        'rpc_process_batch',
        'rpc_calculate_prize',
        'rpc_get_or_create_lote',
        'rpc_update_lote_after_shot',
        'rpc_get_active_lotes'
    )
ORDER BY routine_name;

-- =====================================================
-- QUERY 14: Verificar Consistência Saldo vs Transações
-- =====================================================
SELECT
    u.id AS usuario_id,
    u.email,
    u.saldo AS saldo_atual,
    COALESCE(SUM(CASE WHEN t.tipo = 'deposito' THEN t.valor ELSE 0 END), 0) AS total_depositos,
    COALESCE(SUM(CASE WHEN t.tipo = 'saque' THEN t.valor ELSE 0 END), 0) AS total_saques,
    COALESCE(SUM(CASE WHEN t.tipo = 'chute' THEN t.valor ELSE 0 END), 0) AS total_chutes,
    COALESCE(SUM(CASE WHEN t.tipo = 'premio' THEN t.valor ELSE 0 END), 0) AS total_premios,
    (COALESCE(SUM(CASE WHEN t.tipo = 'deposito' THEN t.valor ELSE 0 END), 0) +
     COALESCE(SUM(CASE WHEN t.tipo = 'premio' THEN t.valor ELSE 0 END), 0) -
     COALESCE(SUM(CASE WHEN t.tipo = 'saque' THEN t.valor ELSE 0 END), 0) -
     COALESCE(SUM(CASE WHEN t.tipo = 'chute' THEN t.valor ELSE 0 END), 0)) AS saldo_calculado,
    ABS(u.saldo - (COALESCE(SUM(CASE WHEN t.tipo = 'deposito' THEN t.valor ELSE 0 END), 0) +
                   COALESCE(SUM(CASE WHEN t.tipo = 'premio' THEN t.valor ELSE 0 END), 0) -
                   COALESCE(SUM(CASE WHEN t.tipo = 'saque' THEN t.valor ELSE 0 END), 0) -
                   COALESCE(SUM(CASE WHEN t.tipo = 'chute' THEN t.valor ELSE 0 END), 0))) AS diferenca
FROM usuarios u
LEFT JOIN transacoes t ON u.id = t.usuario_id
WHERE u.ativo = true
GROUP BY u.id, u.email, u.saldo
HAVING ABS(u.saldo - (COALESCE(SUM(CASE WHEN t.tipo = 'deposito' THEN t.valor ELSE 0 END), 0) +
                     COALESCE(SUM(CASE WHEN t.tipo = 'premio' THEN t.valor ELSE 0 END), 0) -
                     COALESCE(SUM(CASE WHEN t.tipo = 'saque' THEN t.valor ELSE 0 END), 0) -
                     COALESCE(SUM(CASE WHEN t.tipo = 'chute' THEN t.valor ELSE 0 END), 0))) > 0.01
ORDER BY diferenca DESC
LIMIT 20;

-- =====================================================
-- QUERY 15: Verificar Webhooks Pendentes
-- =====================================================
SELECT
    id,
    idempotency_key,
    event_type,
    payment_id,
    processed,
    retry_count,
    created_at,
    processing_started_at,
    error_message
FROM webhook_events
WHERE processed = false
ORDER BY created_at DESC
LIMIT 50;

-- =====================================================
-- QUERY 16: Verificar System Heartbeat
-- =====================================================
SELECT
    instance_id,
    last_seen,
    NOW() - last_seen AS tempo_desde_ultimo_heartbeat,
    metadata
FROM system_heartbeat
ORDER BY last_seen DESC;

-- =====================================================
-- FIM DAS QUERIES DE AUDITORIA
-- =====================================================
-- ⚠️ LEMBRETE: Estas queries são APENAS para leitura
-- ⚠️ NENHUMA alteração será feita até análise completa dos resultados
-- =====================================================

