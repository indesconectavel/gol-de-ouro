-- =====================================================
-- CORREÇÃO COMPLETA DE RLS NO SUPABASE
-- =====================================================
-- Data: 13 de Novembro de 2025
-- Versão: 1.2.0
-- Objetivo: Corrigir todos os erros de RLS identificados pelo Security Advisor
-- =====================================================

-- =====================================================
-- ESTRATÉGIA: Criar políticas RLS adequadas ao invés de desabilitar
-- =====================================================
-- Isso é mais seguro e segue as melhores práticas do Supabase
-- =====================================================

-- =====================================================
-- 1. CONQUISTAS (Acesso público para leitura)
-- =====================================================
ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler conquistas
CREATE POLICY "conquistas_select_policy" 
ON public.conquistas 
FOR SELECT 
USING (true);

-- Política: Apenas service role pode inserir/atualizar
CREATE POLICY "conquistas_admin_policy" 
ON public.conquistas 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 2. FILA_JOGADORES (Acesso restrito por usuário)
-- =====================================================
ALTER TABLE public.fila_jogadores ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias entradas
CREATE POLICY "fila_jogadores_user_policy" 
ON public.fila_jogadores 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Service role tem acesso total
CREATE POLICY "fila_jogadores_admin_policy" 
ON public.fila_jogadores 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 3. NOTIFICAÇÕES (Acesso por usuário)
-- =====================================================
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias notificações
CREATE POLICY "notificacoes_user_policy" 
ON public.notificacoes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias notificações
CREATE POLICY "notificacoes_update_policy" 
ON public.notificacoes 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Service role pode inserir notificações
CREATE POLICY "notificacoes_insert_policy" 
ON public.notificacoes 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- =====================================================
-- 4. PARTIDA_JOGADORES (Acesso por partida)
-- =====================================================
ALTER TABLE public.partida_jogadores ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler partida_jogadores (dados públicos de partidas)
CREATE POLICY "partida_jogadores_select_policy" 
ON public.partida_jogadores 
FOR SELECT 
USING (true);

-- Política: Service role pode inserir/atualizar
CREATE POLICY "partida_jogadores_admin_policy" 
ON public.partida_jogadores 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 5. PARTIDAS (Acesso público para leitura)
-- =====================================================
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler partidas
CREATE POLICY "partidas_select_policy" 
ON public.partidas 
FOR SELECT 
USING (true);

-- Política: Service role pode inserir/atualizar
CREATE POLICY "partidas_admin_policy" 
ON public.partidas 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 6. RANKING (Acesso público)
-- =====================================================
ALTER TABLE public.ranking ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler ranking
CREATE POLICY "ranking_select_policy" 
ON public.ranking 
FOR SELECT 
USING (true);

-- Política: Service role pode inserir/atualizar
CREATE POLICY "ranking_admin_policy" 
ON public.ranking 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 7. SESSÕES (Acesso por usuário)
-- =====================================================
ALTER TABLE public.sessoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias sessões
CREATE POLICY "sessoes_user_policy" 
ON public.sessoes 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Service role tem acesso total
CREATE POLICY "sessoes_admin_policy" 
ON public.sessoes 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 8. USUARIO_CONQUISTAS (Acesso por usuário)
-- =====================================================
ALTER TABLE public.usuario_conquistas ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias conquistas
CREATE POLICY "usuario_conquistas_user_policy" 
ON public.usuario_conquistas 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política: Service role pode inserir/atualizar
CREATE POLICY "usuario_conquistas_admin_policy" 
ON public.usuario_conquistas 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Execute este comando para verificar se todas as políticas foram criadas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('conquistas', 'fila_jogadores', 'notificacoes', 'partida_jogadores', 'partidas', 'ranking', 'sessoes', 'usuario_conquistas')
-- ORDER BY tablename, policyname;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Todas as tabelas agora têm RLS habilitado com políticas adequadas
-- 2. Dados públicos (ranking, partidas, conquistas) são acessíveis a todos
-- 3. Dados privados (sessões, notificações) são acessíveis apenas ao usuário
-- 4. Service role tem acesso total para operações do backend
-- 5. Isso resolve todos os 8 erros identificados pelo Security Advisor
-- =====================================================

