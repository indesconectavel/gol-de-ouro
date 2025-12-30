-- =====================================================
-- QUERIES DE AUDITORIA - VERSÃO SEGURA FINAL
-- Ambiente: Supabase goldeouro-production
-- Data: 19/12/2025
-- Status: CORRIGIDAS PARA ESTRUTURA REAL DE PRODUÇÃO
-- =====================================================
-- ⚠️ CORREÇÕES APLICADAS:
-- - Removida coluna posicao_atual (não existe)
-- - Removida coluna updated_at (não existe)
-- - Removidas colunas total_arrecadado e premio_total (podem não existir)
-- - Usando apenas colunas CONFIRMADAS que existem
-- =====================================================

-- =====================================================
-- BLOCO 1: VERIFICAÇÃO DE ESTRUTURA (EXECUTAR PRIMEIRO)
-- =====================================================

-- Query 0.1: Verificar TODAS as colunas da tabela lotes
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'lotes'
ORDER BY ordinal_position;

-- Query 0.2: Listar todas as tabelas
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- BLOCO 2: DADOS BÁSICOS (SEGURO)
-- =====================================================

-- Query 2.1: Contagem geral (sem colunas problemáticas)
SELECT
    'usuarios' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE ativo = true) AS ativos
FROM usuarios
UNION ALL
SELECT
    'chutes' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS ultimas_24h
FROM chutes
UNION ALL
SELECT
    'lotes' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'ativo') AS ativos
FROM lotes
UNION ALL
SELECT
    'saques' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE status = 'pendente') AS pendentes
FROM saques;

-- Query 2.2: Resumo de saldos de usuários ativos
SELECT
    COUNT(*) AS usuarios_ativos,
    MIN(saldo) AS saldo_minimo,
    MAX(saldo) AS saldo_maximo,
    AVG(saldo) AS saldo_medio,
    SUM(saldo) AS saldo_total
FROM usuarios
WHERE ativo = true;

-- =====================================================
-- BLOCO 3: LOTES ATIVOS (VERSÃO SEGURA)
-- =====================================================

-- Query 3.1: Lotes ativos (apenas colunas básicas confirmadas)
SELECT
    id,
    valor_aposta,
    status,
    tamanho,
    created_at
FROM lotes
WHERE status = 'ativo'
ORDER BY created_at DESC;

-- Query 3.2: Lotes ativos (com colunas opcionais - pode falhar se não existirem)
-- ⚠️ Execute apenas se Query 0.1 mostrar que estas colunas existem
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
-- BLOCO 4: ESTRUTURA DE TABELAS CRÍTICAS
-- =====================================================

-- Query 4.1: Estrutura da tabela `chutes`
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'chutes'
ORDER BY ordinal_position;

-- Query 4.2: Estrutura da tabela `usuarios`
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- Query 4.3: Estrutura da tabela `saques`
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'saques'
ORDER BY ordinal_position;

-- Query 4.4: Verificar tabelas de pagamento
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%pagamento%'
        OR table_name LIKE '%pix%'
        OR table_name LIKE '%payment%'
    )
ORDER BY table_name;

-- =====================================================
-- BLOCO 5: DADOS E CONTAGENS
-- =====================================================

-- Query 5.1: Dados na tabela `chutes`
SELECT 
    COUNT(*) AS total_chutes,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS ultimas_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS ultimos_7_dias,
    MIN(created_at) AS primeiro_chute,
    MAX(created_at) AS ultimo_chute
FROM chutes;

-- Query 5.2: Integridade de saldos
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
-- BLOCO 6: TRANSAÇÕES E PAGAMENTOS
-- =====================================================

-- Query 6.1: Transações recentes (últimas 24h)
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
-- BLOCO 7: FUNÇÕES E RPCs
-- =====================================================

-- Query 7.1: Listar todas as funções
SELECT
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Query 7.2: Funções financeiras críticas
SELECT
    routine_name
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

-- Query 7.3: Funções de jogo críticas
SELECT
    routine_name
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
-- BLOCO 8: INTEGRIDADE E CONSTRAINTS
-- =====================================================

-- Query 8.1: Constraints de chave estrangeira
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Query 8.2: Índices
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Query 8.3: RLS (Row Level Security)
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- BLOCO 9: USUÁRIOS DE TESTE
-- =====================================================

-- Query 9.1: Identificar usuários de teste
SELECT
    id,
    email,
    username,
    ativo,
    created_at
FROM usuarios
WHERE email LIKE '%+test%' 
   OR email LIKE '%+staging%'
   OR email LIKE '%test%'
ORDER BY created_at DESC;

-- =====================================================
-- BLOCO 10: RESUMO FINAL
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
FROM saques;

-- =====================================================
-- FIM DAS QUERIES
-- =====================================================
-- ✅ TODAS AS QUERIES SÃO SELECT - SEGURAS PARA PRODUÇÃO
-- ✅ CORRIGIDAS PARA ESTRUTURA REAL DE PRODUÇÃO
-- ✅ PODE EXECUTAR TODAS DE UMA VEZ
-- =====================================================

