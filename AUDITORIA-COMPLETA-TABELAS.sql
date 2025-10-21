-- AUDITORIA COMPLETA DAS TABELAS - GOL DE OURO v4.2
-- =====================================================
-- Data: 17/10/2025
-- Status: AUDITORIA COMPLETA PARA PRODUÇÃO 100%
-- Versão: v4.2-auditoria-completa

-- =====================================================
-- 1. AUDITORIA DA TABELA USUARIOS
-- =====================================================
SELECT 'AUDITORIA TABELA USUARIOS' as auditoria;

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'usuarios'
) as tabela_usuarios_existe;

-- Verificar colunas da tabela usuarios
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- =====================================================
-- 2. AUDITORIA DA TABELA PAGAMENTOS_PIX
-- =====================================================
SELECT 'AUDITORIA TABELA PAGAMENTOS_PIX' as auditoria;

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'pagamentos_pix'
) as tabela_pagamentos_pix_existe;

-- Verificar colunas da tabela pagamentos_pix
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pagamentos_pix'
ORDER BY ordinal_position;

-- =====================================================
-- 3. AUDITORIA DA TABELA SAQUES
-- =====================================================
SELECT 'AUDITORIA TABELA SAQUES' as auditoria;

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saques'
) as tabela_saques_existe;

-- Verificar colunas da tabela saques
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'saques'
ORDER BY ordinal_position;

-- =====================================================
-- 4. AUDITORIA DA TABELA JOGOS
-- =====================================================
SELECT 'AUDITORIA TABELA JOGOS' as auditoria;

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'jogos'
) as tabela_jogos_existe;

-- Verificar colunas da tabela jogos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'jogos'
ORDER BY ordinal_position;

-- =====================================================
-- 5. AUDITORIA DA TABELA METRICAS_GLOBAIS
-- =====================================================
SELECT 'AUDITORIA TABELA METRICAS_GLOBAIS' as auditoria;

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'metricas_globais'
) as tabela_metricas_globais_existe;

-- Verificar colunas da tabela metricas_globais (se existir)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'metricas_globais'
ORDER BY ordinal_position;

-- =====================================================
-- 6. RESUMO DA AUDITORIA
-- =====================================================
SELECT 'RESUMO DA AUDITORIA' as resumo;

-- Contar tabelas existentes
SELECT COUNT(*) as total_tabelas_existentes
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('usuarios', 'pagamentos_pix', 'saques', 'jogos', 'metricas_globais');

-- Listar todas as tabelas do schema public
SELECT table_name, 
       CASE WHEN table_name IN ('usuarios', 'pagamentos_pix', 'saques', 'jogos', 'metricas_globais') 
            THEN 'NECESSARIA' 
            ELSE 'EXTRA' 
       END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
