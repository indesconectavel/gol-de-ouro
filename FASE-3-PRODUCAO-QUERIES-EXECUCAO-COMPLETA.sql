-- =====================================================
-- QUERIES DE AUDITORIA E DIAGNÓSTICO - EXECUÇÃO COMPLETA
-- Ambiente: Supabase goldeouro-production
-- Data: 19/12/2025
-- Status: TODAS AS QUERIES EM UM ÚNICO ARQUIVO
-- =====================================================
-- ⚠️ REGRA ABSOLUTA: Estas queries são APENAS para leitura (SELECT)
-- ⚠️ Pode executar todas de uma vez no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- BLOCO 1: ESTRUTURA DO BANCO DE DADOS
-- =====================================================

-- Query 1.1: Listar todas as tabelas
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Query 1.2: Verificar tabelas de pagamento (diagnóstico)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%pagamento%'
        OR table_name LIKE '%pix%'
        OR table_name LIKE '%payment%'
    )
ORDER BY table_name;

-- Query 1.3: Contar colunas por tabela
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) AS num_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- BLOCO 2: ESTRUTURA DE TABELAS CRÍTICAS
-- =====================================================

-- Query 2.1: Estrutura da tabela `chutes`
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'chutes'
ORDER BY ordinal_position;

-- Query 2.2: Colunas de resultado/status na tabela `chutes`
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'chutes'
    AND (
        column_name LIKE '%resultado%'
        OR column_name LIKE '%status%'
        OR column_name LIKE '%gol%'
    )
ORDER BY table_name, column_name;

-- Query 2.3: Estrutura de `pagamentos_pix` (se existir)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'pagamentos_pix'
ORDER BY ordinal_position;

-- Query 2.4: Estrutura de `saques`
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'saques'
ORDER BY ordinal_position;

-- Query 2.5: Estrutura de `lotes`
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'lotes'
ORDER BY ordinal_position;

-- Query 2.6: Estrutura de `usuarios`
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- =====================================================
-- BLOCO 3: DADOS E CONTAGENS
-- =====================================================

-- Query 3.1: Contagem geral de registros
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
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS ultimas_24h,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '24 hours') AS anteriores
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
    'saques' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'processado') AS processados,
    COUNT(*) FILTER (WHERE status != 'processado') AS pendentes
FROM saques;

-- Query 3.2: Dados na tabela `chutes` (detalhado)
SELECT 
    COUNT(*) AS total_chutes,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS ultimas_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS ultimos_7_dias,
    MIN(created_at) AS primeiro_chute,
    MAX(created_at) AS ultimo_chute
FROM chutes;

-- Query 3.3: Dados em `pagamentos_pix` (se existir)
SELECT 
    status,
    COUNT(*) AS quantidade,
    SUM(amount) AS valor_total,
    MIN(created_at) AS mais_antigo,
    MAX(created_at) AS mais_recente
FROM pagamentos_pix
GROUP BY status
ORDER BY quantidade DESC;

-- Query 3.4: Resumo de saldos de usuários ativos
SELECT
    COUNT(*) AS usuarios_ativos,
    MIN(saldo) AS saldo_minimo,
    MAX(saldo) AS saldo_maximo,
    AVG(saldo) AS saldo_medio,
    SUM(saldo) AS saldo_total
FROM usuarios
WHERE ativo = true;

-- Query 3.5: Integridade de saldos
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
-- BLOCO 4: LOTES ATIVOS
-- =====================================================

-- Query 4.1: Lotes ativos
-- ⚠️ CORRIGIDO V2: Usando apenas colunas que CERTAMENTE existem em produção
-- Estrutura real confirmada: id, valor_aposta, tamanho, status, chutes_coletados, ganhador_id, created_at, finished_at, completed_at
-- Colunas removidas: posicao_atual, updated_at, total_arrecadado, premio_total (não existem)
SELECT
    id,
    valor_aposta,
    status,
    tamanho,
    chutes_coletados,
    ganhador_id,
    created_at,
    finished_at,
    completed_at
FROM lotes
WHERE status = 'ativo'
ORDER BY created_at DESC;

-- =====================================================
-- BLOCO 5: TRANSAÇÕES E PAGAMENTOS
-- =====================================================

-- Query 5.1: Transações recentes (últimas 24h)
SELECT
    tipo,
    status,
    COUNT(*) AS quantidade,
    SUM(valor) AS valor_total
FROM transacoes
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY tipo, status
ORDER BY tipo, status;

-- Query 5.2: Pagamentos PIX pendentes (se tabela existir)
SELECT
    status,
    COUNT(*) AS quantidade,
    SUM(amount) AS valor_total,
    MIN(created_at) AS mais_antigo,
    MAX(created_at) AS mais_recente
FROM pagamentos_pix
WHERE status IN ('pendente', 'processando')
GROUP BY status;

-- =====================================================
-- BLOCO 6: FUNÇÕES E RPCs
-- =====================================================

-- Query 6.1: Listar todas as funções
SELECT
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Query 6.2: Funções financeiras críticas
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
        'rpc_add_balance',
        'rpc_deduct_balance',
        'rpc_transfer_balance',
        'rpc_get_balance'
    )
ORDER BY routine_name;

-- Query 6.3: Funções de jogo críticas
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
        'rpc_get_or_create_lote',
        'rpc_update_lote_after_shot',
        'rpc_get_active_lotes'
    )
ORDER BY routine_name;

-- =====================================================
-- BLOCO 7: INTEGRIDADE E CONSTRAINTS
-- =====================================================

-- Query 7.1: Constraints de chave estrangeira
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

-- Query 7.2: Índices
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Query 7.3: RLS (Row Level Security)
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- BLOCO 8: USUÁRIOS DE TESTE
-- =====================================================

-- Query 8.1: Identificar usuários de teste
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
-- BLOCO 9: WEBHOOKS E SYSTEM HEARTBEAT
-- =====================================================

-- Query 9.1: Webhooks pendentes (se tabela existir)
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

-- Query 9.2: System heartbeat
SELECT
    instance_id,
    last_seen,
    NOW() - last_seen AS tempo_desde_ultimo_heartbeat,
    metadata
FROM system_heartbeat
ORDER BY last_seen DESC;

-- =====================================================
-- BLOCO 10: RESUMO FINAL DE INTEGRAÇÃO
-- =====================================================

-- Query 10.1: Status geral das tabelas críticas
SELECT 
    'usuarios' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE ativo = true) AS ativos,
    'OK' AS status
FROM usuarios
UNION ALL
SELECT 
    'chutes' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS ultimas_24h,
    CASE 
        WHEN COUNT(*) = 0 THEN 'VAZIA'
        ELSE 'OK'
    END AS status
FROM chutes
UNION ALL
SELECT 
    'lotes' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'ativo') AS ativos,
    'OK' AS status
FROM lotes
UNION ALL
SELECT 
    'saques' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'pendente') AS pendentes,
    'OK' AS status
FROM saques
UNION ALL
SELECT 
    COALESCE(
        (SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND (table_name LIKE '%pagamento%' OR table_name LIKE '%pix%')
         LIMIT 1),
        'pagamentos_pix'
    ) AS tabela,
    COALESCE(
        (SELECT COUNT(*) FROM pagamentos_pix),
        0
    ) AS total_registros,
    COALESCE(
        (SELECT COUNT(*) FROM pagamentos_pix WHERE status = 'pendente'),
        0
    ) AS pendentes,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%pagamento%' OR table_name LIKE '%pix%')
        ) THEN 'OK'
        ELSE 'NAO_EXISTE'
    END AS status;

-- =====================================================
-- FIM DAS QUERIES
-- =====================================================
-- ✅ TODAS AS QUERIES SÃO SELECT - SEGURAS PARA PRODUÇÃO
-- ✅ PODE EXECUTAR TODAS DE UMA VEZ NO SQL EDITOR
-- ✅ RESULTADOS SERÃO EXIBIDOS EM SEQUÊNCIA
-- =====================================================

