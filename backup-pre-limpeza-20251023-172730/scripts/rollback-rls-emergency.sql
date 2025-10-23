-- SCRIPT DE ROLLBACK DE EMERGÊNCIA - RLS
-- Data: 2025-01-07T23:55:00Z
-- Objetivo: Desabilitar RLS em caso de problemas críticos

-- ⚠️ ATENÇÃO: Este script desabilita TODAS as políticas de segurança
-- Use apenas em caso de emergência crítica
-- Execute o backup antes de usar este script

-- ===============================================
-- 1. REMOVER TODAS AS POLÍTICAS
-- ===============================================

-- Remover políticas da tabela User
DROP POLICY IF EXISTS "Users: select own" ON public."User";
DROP POLICY IF EXISTS "Users: update own" ON public."User";
DROP POLICY IF EXISTS "Users: insert authenticated" ON public."User";
DROP POLICY IF EXISTS "Users: admin select all" ON public."User";

-- Remover políticas da tabela Transaction
DROP POLICY IF EXISTS "Transactions: select own" ON public."Transaction";
DROP POLICY IF EXISTS "Transactions: insert own" ON public."Transaction";
DROP POLICY IF EXISTS "Transactions: update system only" ON public."Transaction";
DROP POLICY IF EXISTS "Transactions: admin select all" ON public."Transaction";

-- Remover políticas da tabela Game
DROP POLICY IF EXISTS "Games: select public" ON public."Game";
DROP POLICY IF EXISTS "Games: insert by host" ON public."Game";
DROP POLICY IF EXISTS "Games: update host or admin" ON public."Game";

-- Remover políticas da tabela QueueEntry
DROP POLICY IF EXISTS "QueueEntry: select own" ON public."QueueEntry";
DROP POLICY IF EXISTS "QueueEntry: insert own" ON public."QueueEntry";
DROP POLICY IF EXISTS "QueueEntry: delete own" ON public."QueueEntry";
DROP POLICY IF EXISTS "QueueEntry: admin select all" ON public."QueueEntry";

-- Remover políticas da tabela Notification
DROP POLICY IF EXISTS "Notifications: select own" ON public."Notification";
DROP POLICY IF EXISTS "Notifications: insert system" ON public."Notification";
DROP POLICY IF EXISTS "Notifications: update own" ON public."Notification";

-- Remover políticas da tabela system_config
DROP POLICY IF EXISTS "SystemConfig: admin only" ON public."system_config";

-- Remover políticas da tabela Withdrawal
DROP POLICY IF EXISTS "Withdrawals: select own" ON public."Withdrawal";
DROP POLICY IF EXISTS "Withdrawals: insert own" ON public."Withdrawal";
DROP POLICY IF EXISTS "Withdrawals: update admin only" ON public."Withdrawal";
DROP POLICY IF EXISTS "Withdrawals: admin select all" ON public."Withdrawal";

-- Remover políticas da tabela ShotAttempt
DROP POLICY IF EXISTS "ShotAttempts: select own" ON public."ShotAttempt";
DROP POLICY IF EXISTS "ShotAttempts: insert own" ON public."ShotAttempt";
DROP POLICY IF EXISTS "ShotAttempts: select by game host" ON public."ShotAttempt";

-- ===============================================
-- 2. DESABILITAR RLS (EMERGÊNCIA)
-- ===============================================

-- ⚠️ CUIDADO: Isto remove TODA a segurança de nível de linha
-- Use apenas se houver problemas críticos de acesso

-- Desabilitar RLS nas tabelas
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Game" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."QueueEntry" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."system_config" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Withdrawal" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShotAttempt" DISABLE ROW LEVEL SECURITY;

-- ===============================================
-- 3. VERIFICAÇÃO PÓS-ROLLBACK
-- ===============================================

-- Verificar se RLS foi desabilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled",
    CASE 
        WHEN rowsecurity THEN '❌ RLS AINDA ATIVO' 
        ELSE '✅ RLS DESATIVADO' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'Transaction', 'Game', 'QueueEntry', 'Notification', 'system_config', 'Withdrawal', 'ShotAttempt')
ORDER BY tablename;

-- Verificar se não há políticas restantes
SELECT COUNT(*) as "Políticas Restantes"
FROM pg_policies 
WHERE schemaname = 'public';

-- ===============================================
-- 4. LOG DE ROLLBACK
-- ===============================================

-- Registrar o rollback
INSERT INTO public."system_config" (key, value, description, updated_at) 
VALUES (
    'rls_rollback_emergency', 
    'true', 
    'RLS desabilitado em emergência - ' || NOW()::text,
    NOW()
) ON CONFLICT (key) DO UPDATE SET 
    value = 'true',
    description = 'RLS desabilitado em emergência - ' || NOW()::text,
    updated_at = NOW();

-- ===============================================
-- 5. PRÓXIMOS PASSOS APÓS ROLLBACK
-- ===============================================

-- 1. Investigar o problema que causou a necessidade do rollback
-- 2. Corrigir as políticas problemáticas
-- 3. Testar em ambiente de desenvolvimento
-- 4. Reaplicar RLS com políticas corrigidas
-- 5. Monitorar logs de acesso

-- ===============================================
-- SCRIPT DE ROLLBACK CONCLUÍDO
-- ===============================================
-- ⚠️ SISTEMA VOLTOU AO ESTADO INSEGURO
-- ⚠️ CORRIJA OS PROBLEMAS E REAPLIQUE RLS IMEDIATAMENTE
-- ⚠️ MONITORE ACESSOS SUSPEITOS
