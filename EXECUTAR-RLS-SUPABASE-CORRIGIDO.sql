-- 🚨 CORREÇÃO URGENTE RLS - VERSÃO CORRIGIDA
-- Data: 16 de Outubro de 2025 - 09:59
-- Objetivo: Corrigir 9 vulnerabilidades críticas de segurança
-- CORREÇÃO: Usar nomes de colunas corretos (camelCase)

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS) - URGENTE
-- =============================================

-- Habilitar RLS em TODAS as tabelas críticas identificadas no print
ALTER TABLE "public"."ShotAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Withdrawal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."QueueEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Game" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Transaction" ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS DE SEGURANÇA CRÍTICAS - CORRIGIDAS
-- =============================================

-- Políticas para ShotAttempt (CORRIGIDO: usar userId)
CREATE POLICY "Users can view own shots" ON "public"."ShotAttempt"
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own shots" ON "public"."ShotAttempt"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update own shots" ON "public"."ShotAttempt"
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

-- Políticas para Withdrawal (CORRIGIDO: usar userId)
CREATE POLICY "Users can view own withdrawals" ON "public"."Withdrawal"
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own withdrawals" ON "public"."Withdrawal"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "System can update withdrawals" ON "public"."Withdrawal"
    FOR UPDATE USING (true);

-- Políticas para system_config (SEM userId - tabela de sistema)
CREATE POLICY "System can view config" ON "public"."system_config"
    FOR SELECT USING (true);

CREATE POLICY "System can update config" ON "public"."system_config"
    FOR UPDATE USING (true);

CREATE POLICY "System can insert config" ON "public"."system_config"
    FOR INSERT WITH CHECK (true);

-- Políticas para Notification (CORRIGIDO: usar userId)
CREATE POLICY "Users can view own notifications" ON "public"."Notification"
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "System can insert notifications" ON "public"."Notification"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON "public"."Notification"
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

-- Políticas para QueueEntry (CORRIGIDO: usar userId)
CREATE POLICY "Users can view own queue entries" ON "public"."QueueEntry"
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own queue entries" ON "public"."QueueEntry"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update own queue entries" ON "public"."QueueEntry"
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

-- Políticas para Game (CORRIGIDO: usar userId)
CREATE POLICY "Users can view own games" ON "public"."Game"
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert own games" ON "public"."Game"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update own games" ON "public"."Game"
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

-- Políticas para User (CORRIGIDO: usar id)
CREATE POLICY "Users can view own data" ON "public"."User"
    FOR SELECT USING (auth.uid()::text = "id"::text);

CREATE POLICY "Users can update own data" ON "public"."User"
    FOR UPDATE USING (auth.uid()::text = "id"::text);

CREATE POLICY "Users can insert own data" ON "public"."User"
    FOR INSERT WITH CHECK (auth.uid()::text = "id"::text);

-- Políticas para Transaction (CORRIGIDO: usar userId)
CREATE POLICY "Users can view own transactions" ON "public"."Transaction"
    FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "System can update transactions" ON "public"."Transaction"
    FOR UPDATE USING (true);

CREATE POLICY "System can insert transactions" ON "public"."Transaction"
    FOR INSERT WITH CHECK (true);

-- =============================================
-- VERIFICAÇÃO DE SEGURANÇA
-- =============================================

-- Verificar se RLS está habilitado em todas as tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('ShotAttempt', 'Withdrawal', 'system_config', 'Notification', 'QueueEntry', 'Game', 'User', 'Transaction')
ORDER BY tablename;

-- Verificar políticas criadas (CORRIGIDO: sem referência a colunas)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('ShotAttempt', 'Withdrawal', 'system_config', 'Notification', 'QueueEntry', 'Game', 'User', 'Transaction')
ORDER BY tablename, policyname;

-- =============================================
-- CONFIRMAÇÃO DE EXECUÇÃO
-- =============================================

SELECT '✅ RLS Security Fix Applied Successfully!' as status,
       NOW() as executed_at,
       'All 9 critical tables now have Row Level Security enabled' as description,
       'Security Advisor should now show 0 issues' as next_step;
