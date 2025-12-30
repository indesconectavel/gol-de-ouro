-- =====================================================
-- VERIFICAÇÃO DO SCHEMA REAL DA TABELA saques
-- Execute esta query PRIMEIRO para verificar os nomes corretos das colunas
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'saques'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAÇÃO DO SCHEMA REAL DA TABELA pagamentos_pix
-- =====================================================

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
-- VERIFICAÇÃO DO SCHEMA REAL DA TABELA usuarios
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAÇÃO DO SCHEMA REAL DA TABELA transacoes
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'transacoes'
ORDER BY ordinal_position;

