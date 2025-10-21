-- SCRIPT DE APLICAÇÃO DE RLS - GOL DE OURO v1.1.1
-- Data: 2025-01-07T23:55:00Z
-- Objetivo: Corrigir vulnerabilidade crítica de segurança

-- ===============================================
-- BACKUP ANTES DE EXECUTAR
-- ===============================================
-- IMPORTANTE: Execute um backup completo antes de aplicar este script
-- pg_dump -h <host> -U <user> -d <db> -s > schema-backup-$(date +%F).sql

-- ===============================================
-- 1. HABILITAR RLS NAS TABELAS CRÍTICAS
-- ===============================================

-- Tabela de Usuários
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Tabela de Transações
ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;

-- Tabela de Jogos
ALTER TABLE public."Game" ENABLE ROW LEVEL SECURITY;

-- Tabela de Entradas na Fila
ALTER TABLE public."QueueEntry" ENABLE ROW LEVEL SECURITY;

-- Tabela de Notificações
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;

-- Tabela de Configurações do Sistema
ALTER TABLE public."system_config" ENABLE ROW LEVEL SECURITY;

-- Tabela de Saques
ALTER TABLE public."Withdrawal" ENABLE ROW LEVEL SECURITY;

-- Tabela de Tentativas de Chute
ALTER TABLE public."ShotAttempt" ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- 2. CRIAR POLÍTICAS DE SEGURANÇA
-- ===============================================

-- POLÍTICAS PARA TABELA USER
-- Usuários só podem ver e editar seus próprios dados
CREATE POLICY "Users: select own" ON public."User"
  FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users: update own" ON public."User"
  FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users: insert authenticated" ON public."User"
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Admins podem ver todos os usuários
CREATE POLICY "Users: admin select all" ON public."User"
  FOR SELECT
  USING (current_setting('jwt.claims.role', true) = 'admin');

-- POLÍTICAS PARA TABELA TRANSACTION
-- Usuários só podem ver suas próprias transações
CREATE POLICY "Transactions: select own" ON public."Transaction"
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Usuários podem criar suas próprias transações
CREATE POLICY "Transactions: insert own" ON public."Transaction"
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Apenas sistema pode atualizar transações (webhooks, etc.)
CREATE POLICY "Transactions: update system only" ON public."Transaction"
  FOR UPDATE
  USING (current_setting('jwt.claims.role', true) IN ('service_role', 'admin'));

-- Admins podem ver todas as transações
CREATE POLICY "Transactions: admin select all" ON public."Transaction"
  FOR SELECT
  USING (current_setting('jwt.claims.role', true) = 'admin');

-- POLÍTICAS PARA TABELA GAME
-- Jogos públicos podem ser vistos por todos
CREATE POLICY "Games: select public" ON public."Game"
  FOR SELECT
  USING (status = 'public' OR status = 'active');

-- Apenas o host pode criar jogos
CREATE POLICY "Games: insert by host" ON public."Game"
  FOR INSERT
  WITH CHECK (auth.uid()::text = host_id::text);

-- Host e admins podem atualizar jogos
CREATE POLICY "Games: update host or admin" ON public."Game"
  FOR UPDATE
  USING (auth.uid()::text = host_id::text OR current_setting('jwt.claims.role', true) = 'admin');

-- POLÍTICAS PARA TABELA QUEUEENTRY
-- Usuários só podem ver suas próprias entradas na fila
CREATE POLICY "QueueEntry: select own" ON public."QueueEntry"
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Usuários podem entrar na fila
CREATE POLICY "QueueEntry: insert own" ON public."QueueEntry"
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Usuários podem sair da fila (deletar sua entrada)
CREATE POLICY "QueueEntry: delete own" ON public."QueueEntry"
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Admins podem ver todas as entradas
CREATE POLICY "QueueEntry: admin select all" ON public."QueueEntry"
  FOR SELECT
  USING (current_setting('jwt.claims.role', true) = 'admin');

-- POLÍTICAS PARA TABELA NOTIFICATION
-- Usuários só podem ver suas próprias notificações
CREATE POLICY "Notifications: select own" ON public."Notification"
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Sistema pode criar notificações
CREATE POLICY "Notifications: insert system" ON public."Notification"
  FOR INSERT
  WITH CHECK (current_setting('jwt.claims.role', true) IN ('service_role', 'admin'));

-- Usuários podem marcar suas notificações como lidas
CREATE POLICY "Notifications: update own" ON public."Notification"
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- POLÍTICAS PARA TABELA SYSTEM_CONFIG
-- Apenas admins podem acessar configurações do sistema
CREATE POLICY "SystemConfig: admin only" ON public."system_config"
  FOR ALL
  USING (current_setting('jwt.claims.role', true) = 'admin');

-- POLÍTICAS PARA TABELA WITHDRAWAL
-- Usuários só podem ver seus próprios saques
CREATE POLICY "Withdrawals: select own" ON public."Withdrawal"
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Usuários podem solicitar saques
CREATE POLICY "Withdrawals: insert own" ON public."Withdrawal"
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Apenas admins podem aprovar/rejeitar saques
CREATE POLICY "Withdrawals: update admin only" ON public."Withdrawal"
  FOR UPDATE
  USING (current_setting('jwt.claims.role', true) = 'admin');

-- Admins podem ver todos os saques
CREATE POLICY "Withdrawals: admin select all" ON public."Withdrawal"
  FOR SELECT
  USING (current_setting('jwt.claims.role', true) = 'admin');

-- POLÍTICAS PARA TABELA SHOTATTEMPT
-- Usuários só podem ver suas próprias tentativas de chute
CREATE POLICY "ShotAttempts: select own" ON public."ShotAttempt"
  FOR SELECT
  USING (auth.uid()::text = player_id::text);

-- Usuários podem registrar suas tentativas de chute
CREATE POLICY "ShotAttempts: insert own" ON public."ShotAttempt"
  FOR INSERT
  WITH CHECK (auth.uid()::text = player_id::text);

-- Host do jogo e admins podem ver todas as tentativas do jogo
CREATE POLICY "ShotAttempts: select by game host" ON public."ShotAttempt"
  FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT host_id::text FROM public."Game" WHERE id = game_id
    ) OR current_setting('jwt.claims.role', true) = 'admin'
  );

-- ===============================================
-- 3. VERIFICAÇÕES DE SEGURANÇA
-- ===============================================

-- Verificar se RLS está habilitado em todas as tabelas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'Transaction', 'Game', 'QueueEntry', 'Notification', 'system_config', 'Withdrawal', 'ShotAttempt');

-- Listar todas as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===============================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- ===============================================

COMMENT ON POLICY "Users: select own" ON public."User" IS 'Usuários só podem ver seus próprios dados';
COMMENT ON POLICY "Transactions: select own" ON public."Transaction" IS 'Usuários só podem ver suas próprias transações';
COMMENT ON POLICY "Games: select public" ON public."Game" IS 'Jogos públicos podem ser vistos por todos';
COMMENT ON POLICY "QueueEntry: select own" ON public."QueueEntry" IS 'Usuários só podem ver suas próprias entradas na fila';
COMMENT ON POLICY "Notifications: select own" ON public."Notification" IS 'Usuários só podem ver suas próprias notificações';
COMMENT ON POLICY "SystemConfig: admin only" ON public."system_config" IS 'Apenas admins podem acessar configurações do sistema';
COMMENT ON POLICY "Withdrawals: select own" ON public."Withdrawal" IS 'Usuários só podem ver seus próprios saques';
COMMENT ON POLICY "ShotAttempts: select own" ON public."ShotAttempt" IS 'Usuários só podem ver suas próprias tentativas de chute';

-- ===============================================
-- SCRIPT CONCLUÍDO
-- ===============================================
-- Execute este script no SQL Editor do Supabase
-- Teste todas as políticas antes de considerar o deploy
-- Monitore logs de acesso após a aplicação
