-- SCHEMA SEGURANÇA RLS - GOL DE OURO v4.4
-- =====================================================
-- Data: 17/10/2025
-- Status: HABILITAR ROW LEVEL SECURITY EM TODAS AS TABELAS
-- Versão: v4.4-seguranca-rls

-- Este script habilita Row Level Security (RLS) em todas as tabelas
-- para corrigir os 13 erros de segurança identificados no Supabase Security Advisor

-- 1. HABILITAR RLS EM TODAS AS TABELAS CRÍTICAS
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partida_jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fila_jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_globais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS BÁSICAS DE SEGURANÇA PARA USUÁRIOS
-- Permitir que usuários vejam apenas seus próprios dados

-- Política para tabela usuarios (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios' AND table_schema = 'public') THEN
        ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
        
        -- Usuários podem ver apenas seus próprios dados
        DROP POLICY IF EXISTS "Users can view own data" ON public.usuarios;
        CREATE POLICY "Users can view own data" ON public.usuarios
            FOR SELECT USING (auth.uid() = id);
            
        -- Usuários podem atualizar apenas seus próprios dados
        DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;
        CREATE POLICY "Users can update own data" ON public.usuarios
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Política para tabela jogos
DROP POLICY IF EXISTS "Users can view own games" ON public.jogos;
CREATE POLICY "Users can view own games" ON public.jogos
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert own games" ON public.jogos;
CREATE POLICY "Users can insert own games" ON public.jogos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para tabela metricas_globais (apenas leitura para todos)
DROP POLICY IF EXISTS "Anyone can view global metrics" ON public.metricas_globais;
CREATE POLICY "Anyone can view global metrics" ON public.metricas_globais
    FOR SELECT USING (true);

-- Política para tabela transacoes
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transacoes;
CREATE POLICY "Users can view own transactions" ON public.transacoes
    FOR SELECT USING (auth.uid() = usuario_id);

-- 3. POLÍTICAS PARA TABELAS DE ADMINISTRAÇÃO
-- Estas tabelas devem ser acessíveis apenas por service_role

-- Política para logs_sistema (apenas service_role)
DROP POLICY IF EXISTS "Service role can manage system logs" ON public.logs_sistema;
CREATE POLICY "Service role can manage system logs" ON public.logs_sistema
    FOR ALL USING (auth.role() = 'service_role');

-- Política para configuracoes (apenas service_role)
DROP POLICY IF EXISTS "Service role can manage configs" ON public.configuracoes;
CREATE POLICY "Service role can manage configs" ON public.configuracoes
    FOR ALL USING (auth.role() = 'service_role');

-- 4. VERIFICAR STATUS FINAL
SELECT 'RLS HABILITADO COM SUCESSO EM TODAS AS TABELAS' as status;

-- Verificar quais tabelas têm RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;
