-- AUDITORIA PROFUNDA DE SEGURANÇA - GOL DE OURO v1.1.1
-- Data: 2025-01-07T23:58:00Z
-- Objetivo: Verificação completa de segurança e RLS

-- ===============================================
-- 1. VERIFICAÇÃO COMPLETA DE RLS
-- ===============================================

-- Verificar status RLS de todas as tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS_Enabled",
    CASE 
        WHEN rowsecurity THEN '✅ SEGURO' 
        ELSE '❌ VULNERÁVEL' 
    END as "Status_Seguranca"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===============================================
-- 2. CONTAGEM DE POLÍTICAS POR TABELA
-- ===============================================

SELECT 
    tablename as "Tabela",
    COUNT(*) as "Num_Politicas",
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ ADEQUADO'
        WHEN COUNT(*) >= 1 THEN '⚠️ MÍNIMO'
        ELSE '❌ INSUFICIENTE'
    END as "Status_Politicas"
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ===============================================
-- 3. LISTAGEM COMPLETA DE POLÍTICAS
-- ===============================================

SELECT 
    tablename as "Tabela",
    policyname as "Politica",
    cmd as "Comando",
    permissive as "Permissiva",
    roles as "Roles",
    CASE 
        WHEN qual IS NOT NULL THEN 'Condição: ' || qual
        ELSE 'Sem condição'
    END as "Condicao"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===============================================
-- 4. VERIFICAÇÃO DE ÍNDICES PARA PERFORMANCE
-- ===============================================

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('User', 'Transaction', 'Game', 'QueueEntry', 'Notification', 'system_config', 'Withdrawal', 'ShotAttempt', 'AuditLog')
ORDER BY tablename, indexname;

-- ===============================================
-- 5. VERIFICAÇÃO DE PERMISSÕES DE USUÁRIO
-- ===============================================

-- Verificar usuários do sistema
SELECT 
    usename as "Usuario",
    usesuper as "Superuser",
    usecreatedb as "Pode_Criar_DB",
    usebypassrls as "Bypass_RLS"
FROM pg_user
WHERE usename NOT LIKE 'pg_%'
ORDER BY usename;

-- ===============================================
-- 6. VERIFICAÇÃO DE CONFIGURAÇÕES DE SEGURANÇA
-- ===============================================

-- Verificar configurações de segurança do PostgreSQL
SELECT 
    name as "Configuracao",
    setting as "Valor",
    CASE 
        WHEN name = 'row_security' AND setting = 'on' THEN '✅ RLS GLOBAL ATIVO'
        WHEN name = 'row_security' AND setting = 'off' THEN '❌ RLS GLOBAL DESATIVO'
        ELSE 'ℹ️ ' || name
    END as "Status"
FROM pg_settings 
WHERE name IN ('row_security', 'ssl', 'password_encryption', 'log_statement')
ORDER BY name;

-- ===============================================
-- 7. VERIFICAÇÃO DE TABELAS SENSÍVEIS
-- ===============================================

-- Verificar se tabelas sensíveis têm RLS ativo
SELECT 
    t.tablename as "Tabela",
    t.rowsecurity as "RLS_Ativo",
    COUNT(p.policyname) as "Num_Politicas",
    CASE 
        WHEN t.rowsecurity = true AND COUNT(p.policyname) > 0 THEN '✅ SEGURA'
        WHEN t.rowsecurity = true AND COUNT(p.policyname) = 0 THEN '⚠️ RLS SEM POLÍTICAS'
        ELSE '❌ VULNERÁVEL'
    END as "Status_Final"
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
AND t.tablename IN ('User', 'Transaction', 'Game', 'QueueEntry', 'Notification', 'system_config', 'Withdrawal', 'ShotAttempt', 'AuditLog')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ===============================================
-- 8. RELATÓRIO DE SEGURANÇA FINAL
-- ===============================================

-- Resumo geral de segurança
SELECT 
    'TABELAS COM RLS' as "Metrica",
    COUNT(*) as "Total",
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as "Com_RLS",
    ROUND(
        (SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END)::float / COUNT(*)::float) * 100, 
        2
    ) as "Percentual_Seguro"
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('User', 'Transaction', 'Game', 'QueueEntry', 'Notification', 'system_config', 'Withdrawal', 'ShotAttempt', 'AuditLog')

UNION ALL

SELECT 
    'POLÍTICAS CRIADAS' as "Metrica",
    COUNT(*) as "Total",
    COUNT(*) as "Com_RLS",
    100.0 as "Percentual_Seguro"
FROM pg_policies 
WHERE schemaname = 'public';

-- ===============================================
-- AUDITORIA CONCLUÍDA
-- ===============================================
