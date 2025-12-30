-- =====================================================
-- FASE 2.6 - ETAPA 1: INSPEÇÃO DO SCHEMA REAL
-- Ambiente: Supabase goldeouro-production
-- Data: 19/12/2025
-- Status: APENAS SELECT - NENHUMA ALTERAÇÃO
-- =====================================================
-- ⚠️ REGRA ABSOLUTA: Estas queries são APENAS para leitura
-- ⚠️ NENHUMA query DROP, TRUNCATE, DELETE ou UPDATE será executada
-- =====================================================

-- =====================================================
-- QUERY 1: Estrutura da tabela pagamentos_pix
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'pagamentos_pix'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 2: Valores únicos de status em pagamentos_pix
-- =====================================================
SELECT DISTINCT status
FROM pagamentos_pix
ORDER BY status;

-- =====================================================
-- QUERY 3: Estrutura da tabela transacoes
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'transacoes'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 4: Valores únicos de status em transacoes
-- =====================================================
SELECT DISTINCT status
FROM transacoes
ORDER BY status;

-- =====================================================
-- QUERY 5: Valores únicos de tipo em transacoes
-- =====================================================
SELECT DISTINCT tipo
FROM transacoes
ORDER BY tipo;

-- =====================================================
-- QUERY 6: Estrutura da tabela lotes
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'lotes'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 7: Valores únicos de status em lotes
-- =====================================================
SELECT DISTINCT status
FROM lotes
ORDER BY status;

-- =====================================================
-- QUERY 8: Estrutura da tabela saques
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'saques'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 9: Valores únicos de status em saques
-- =====================================================
SELECT DISTINCT status
FROM saques
ORDER BY status;

-- =====================================================
-- QUERY 10: Constraints CHECK em todas as tabelas críticas
-- =====================================================
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('pagamentos_pix', 'transacoes', 'lotes', 'saques')
    AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- FIM DAS QUERIES DE INSPEÇÃO
-- =====================================================

