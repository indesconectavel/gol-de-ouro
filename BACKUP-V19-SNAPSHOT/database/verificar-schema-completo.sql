-- =====================================================
-- VERIFICAÇÃO COMPLETA DO SCHEMA - AUDITORIA FINAL
-- =====================================================
-- Data: 2025-11-24
-- Descrição: Verifica todas as correções aplicadas no schema
-- =====================================================

-- =====================================================
-- 1. VERIFICAR TABELA usuarios
-- =====================================================
SELECT 
    'usuarios' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'usuarios'
AND column_name IN ('nome', 'username', 'email', 'senha_hash', 'saldo')
ORDER BY column_name;

-- Verificar se coluna 'nome' ainda existe (não deveria)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios' 
            AND column_name = 'nome'
        ) THEN '❌ PROBLEMA: Coluna nome ainda existe'
        ELSE '✅ OK: Coluna nome não existe'
    END as status_nome;

-- Verificar se coluna 'username' existe (deveria)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios' 
            AND column_name = 'username'
        ) THEN '✅ OK: Coluna username existe'
        ELSE '❌ PROBLEMA: Coluna username não existe'
    END as status_username;

-- =====================================================
-- 2. VERIFICAR TABELA chutes
-- =====================================================
SELECT 
    'chutes' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chutes'
AND column_name IN ('direcao', 'valor_aposta', 'zona', 'potencia', 'angulo', 'usuario_id', 'lote_id', 'resultado')
ORDER BY column_name;

-- Verificar se colunas antigas ainda existem (não deveriam)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chutes' 
            AND column_name = 'zona'
        ) THEN '❌ PROBLEMA: Coluna zona ainda existe'
        ELSE '✅ OK: Coluna zona não existe'
    END as status_zona,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chutes' 
            AND column_name = 'potencia'
        ) THEN '❌ PROBLEMA: Coluna potencia ainda existe'
        ELSE '✅ OK: Coluna potencia não existe'
    END as status_potencia,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chutes' 
            AND column_name = 'angulo'
        ) THEN '❌ PROBLEMA: Coluna angulo ainda existe'
        ELSE '✅ OK: Coluna angulo não existe'
    END as status_angulo;

-- Verificar se colunas novas existem e são NOT NULL (deveriam)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chutes' 
            AND column_name = 'direcao'
            AND is_nullable = 'NO'
        ) THEN '✅ OK: Coluna direcao existe e é NOT NULL'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chutes' 
            AND column_name = 'direcao'
        ) THEN '⚠️ AVISO: Coluna direcao existe mas é NULLABLE'
        ELSE '❌ PROBLEMA: Coluna direcao não existe'
    END as status_direcao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chutes' 
            AND column_name = 'valor_aposta'
            AND is_nullable = 'NO'
        ) THEN '✅ OK: Coluna valor_aposta existe e é NOT NULL'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'chutes' 
            AND column_name = 'valor_aposta'
        ) THEN '⚠️ AVISO: Coluna valor_aposta existe mas é NULLABLE'
        ELSE '❌ PROBLEMA: Coluna valor_aposta não existe'
    END as status_valor_aposta;

-- =====================================================
-- 3. VERIFICAR TABELA pagamentos_pix (status expired)
-- =====================================================
SELECT 
    'pagamentos_pix' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pagamentos_pix'
AND column_name = 'status'
ORDER BY column_name;

-- Verificar constraint de status
SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'pagamentos_pix'
AND con.conname LIKE '%status%';

-- Verificar se status 'expired' é permitido
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = 'pagamentos_pix'
            AND con.conname LIKE '%status%'
            AND pg_get_constraintdef(con.oid) LIKE '%expired%'
        ) THEN '✅ OK: Status expired é permitido'
        ELSE '❌ PROBLEMA: Status expired não está na constraint'
    END as status_expired;

-- =====================================================
-- 4. VERIFICAR FUNÇÕES RPC CRÍTICAS
-- =====================================================
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'rpc_add_balance',
    'rpc_subtract_balance',
    'rpc_transfer_balance',
    'rpc_get_or_create_lote',
    'rpc_update_lote_after_shot',
    'expire_stale_pix'
)
ORDER BY routine_name;

-- =====================================================
-- 5. RESUMO GERAL
-- =====================================================
SELECT 
    'RESUMO' as tipo,
    'Verificação completa do schema concluída' as mensagem,
    NOW() as timestamp;

