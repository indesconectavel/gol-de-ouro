-- =====================================================
-- QUERIES DE DIAGNÓSTICO ADICIONAIS - PRODUÇÃO
-- Ambiente: Supabase goldeouro-production
-- Data: 19/12/2025
-- Objetivo: Diagnosticar problemas identificados nos prints
-- =====================================================
-- ⚠️ REGRA ABSOLUTA: Estas queries são APENAS para leitura (SELECT)
-- =====================================================

-- =====================================================
-- QUERY 1: Verificar Tabelas de Pagamento Existentes
-- =====================================================
-- Objetivo: Identificar nome correto da tabela de pagamentos
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
-- QUERY 2: Verificar Estrutura da Tabela `chutes`
-- =====================================================
-- Objetivo: Confirmar estrutura e identificar coluna de resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'chutes'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 3: Verificar Dados na Tabela `chutes`
-- =====================================================
-- Objetivo: Confirmar se tabela está vazia ou tem dados
SELECT 
    COUNT(*) AS total_chutes,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS ultimas_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS ultimos_7_dias,
    MIN(created_at) AS primeiro_chute,
    MAX(created_at) AS ultimo_chute
FROM chutes;

-- =====================================================
-- QUERY 4: Verificar Todas as Tabelas do Schema Public
-- =====================================================
-- Objetivo: Listar todas as tabelas para identificar estrutura completa
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
-- QUERY 5: Verificar Colunas que Contêm "resultado" ou "status"
-- =====================================================
-- Objetivo: Encontrar coluna de resultado na tabela chutes
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

-- =====================================================
-- QUERY 6: Verificar Se Existe Tabela `pagamentos_pix`
-- =====================================================
-- Objetivo: Confirmar se tabela de pagamentos tem nome alternativo
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) AS num_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND (
        table_name = 'pagamentos_pix'
        OR table_name = 'pix_payments'
        OR table_name = 'pagamentos'
    );

-- =====================================================
-- QUERY 7: Verificar Estrutura de `pagamentos_pix` (se existir)
-- =====================================================
-- Objetivo: Verificar estrutura da tabela de pagamentos PIX
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'pagamentos_pix'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 8: Verificar Dados em `pagamentos_pix` (se existir)
-- =====================================================
-- Objetivo: Verificar se há pagamentos registrados
SELECT 
    status,
    COUNT(*) AS quantidade,
    SUM(amount) AS valor_total,
    MIN(created_at) AS mais_antigo,
    MAX(created_at) AS mais_recente
FROM pagamentos_pix
GROUP BY status
ORDER BY quantidade DESC;

-- =====================================================
-- QUERY 9: Verificar Integração Backend → Banco
-- =====================================================
-- Objetivo: Verificar se tabelas críticas estão sendo usadas
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
-- FIM DAS QUERIES DE DIAGNÓSTICO
-- =====================================================
-- ⚠️ LEMBRETE: Estas queries são APENAS para leitura
-- ⚠️ Execute todas e documente os resultados
-- =====================================================

