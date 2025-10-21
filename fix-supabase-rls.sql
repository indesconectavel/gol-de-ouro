-- 🔒 CORREÇÃO CRÍTICA DE SEGURANÇA - RLS SUPABASE
-- Data: 16 de Outubro de 2025
-- Objetivo: Habilitar RLS em todas as tabelas públicas

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas críticas
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Game" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Withdrawal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."QueueEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShotAttempt" ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS DE SEGURANÇA - USUÁRIOS
-- =============================================

-- Políticas para tabela User
CREATE POLICY "Users can view own data" ON "public"."User"
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON "public"."User"
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own data" ON "public"."User"
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- =============================================
-- POLÍTICAS DE SEGURANÇA - TRANSAÇÕES
-- =============================================

-- Políticas para tabela Transaction
CREATE POLICY "Users can view own transactions" ON "public"."Transaction"
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own transactions" ON "public"."Transaction"
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "System can update transactions" ON "public"."Transaction"
    FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS DE SEGURANÇA - JOGOS
-- =============================================

-- Políticas para tabela Game
CREATE POLICY "Users can view own games" ON "public"."Game"
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own games" ON "public"."Game"
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own games" ON "public"."Game"
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- =============================================
-- POLÍTICAS DE SEGURANÇA - SAQUES
-- =============================================

-- Políticas para tabela Withdrawal
CREATE POLICY "Users can view own withdrawals" ON "public"."Withdrawal"
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own withdrawals" ON "public"."Withdrawal"
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "System can update withdrawals" ON "public"."Withdrawal"
    FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS DE SEGURANÇA - FILA
-- =============================================

-- Políticas para tabela QueueEntry
CREATE POLICY "Users can view own queue entries" ON "public"."QueueEntry"
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own queue entries" ON "public"."QueueEntry"
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own queue entries" ON "public"."QueueEntry"
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- =============================================
-- POLÍTICAS DE SEGURANÇA - NOTIFICAÇÕES
-- =============================================

-- Políticas para tabela Notification
CREATE POLICY "Users can view own notifications" ON "public"."Notification"
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert notifications" ON "public"."Notification"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON "public"."Notification"
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- =============================================
-- POLÍTICAS DE SEGURANÇA - CONFIGURAÇÕES
-- =============================================

-- Políticas para tabela system_config
CREATE POLICY "System can view config" ON "public"."system_config"
    FOR SELECT USING (true);

CREATE POLICY "System can update config" ON "public"."system_config"
    FOR UPDATE USING (true);

CREATE POLICY "System can insert config" ON "public"."system_config"
    FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS DE SEGURANÇA - TENTATIVAS DE CHUTE
-- =============================================

-- Políticas para tabela ShotAttempt
CREATE POLICY "Users can view own shots" ON "public"."ShotAttempt"
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own shots" ON "public"."ShotAttempt"
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own shots" ON "public"."ShotAttempt"
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- =============================================
-- VERIFICAÇÃO DE SEGURANÇA
-- =============================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('User', 'Transaction', 'Game', 'Withdrawal', 'QueueEntry', 'Notification', 'system_config', 'ShotAttempt')
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================
-- LOG DE EXECUÇÃO
-- =============================================

-- Inserir log de execução
INSERT INTO "public"."system_config" (key, value, description, updated_at)
VALUES (
    'rls_security_fix',
    'executed',
    'RLS security policies applied on 2025-10-16',
    NOW()
) ON CONFLICT (key) DO UPDATE SET
    value = 'executed',
    description = 'RLS security policies applied on 2025-10-16',
    updated_at = NOW();

-- =============================================
-- MENSAGEM DE SUCESSO
-- =============================================

SELECT '✅ RLS Security Fix Applied Successfully!' as status,
       NOW() as executed_at,
       'All critical tables now have Row Level Security enabled' as description;
