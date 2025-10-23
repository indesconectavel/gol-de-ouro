-- SCRIPT DE TESTE DAS POLÍTICAS RLS - GOL DE OURO v1.1.1
-- Data: 2025-01-07T23:55:00Z
-- Objetivo: Validar se as políticas de RLS estão funcionando corretamente

-- ===============================================
-- IMPORTANTE: Execute este script APÓS aplicar o RLS
-- Use tokens de teste para validar as políticas
-- ===============================================

-- ===============================================
-- 1. VERIFICAÇÕES BÁSICAS DE RLS
-- ===============================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled",
    CASE 
        WHEN rowsecurity THEN '✅ RLS ATIVO' 
        ELSE '❌ RLS DESATIVO' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'Transaction', 'Game', 'QueueEntry', 'Notification', 'system_config', 'Withdrawal', 'ShotAttempt')
ORDER BY tablename;

-- ===============================================
-- 2. LISTAR TODAS AS POLÍTICAS CRIADAS
-- ===============================================

SELECT 
    tablename as "Tabela",
    policyname as "Política",
    cmd as "Comando",
    permissive as "Permissiva",
    roles as "Roles",
    CASE 
        WHEN qual IS NOT NULL THEN 'Condição: ' || qual
        ELSE 'Sem condição'
    END as "Condição"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===============================================
-- 3. TESTES DE SEGURANÇA (EXECUTAR COM TOKENS)
-- ===============================================

-- NOTA: Para executar estes testes, você precisa:
-- 1. Gerar um token JWT de usuário comum
-- 2. Gerar um token JWT de admin
-- 3. Executar as queries com os tokens apropriados

-- TESTE 1: Usuário comum tentando ver dados de outros usuários
-- (Deve retornar apenas seus próprios dados)
/*
-- Com token de usuário comum:
SELECT id, email, balance FROM public."User" LIMIT 5;
-- Resultado esperado: Apenas o próprio usuário
*/

-- TESTE 2: Usuário comum tentando ver transações de outros
-- (Deve retornar apenas suas próprias transações)
/*
-- Com token de usuário comum:
SELECT id, user_id, amount, type FROM public."Transaction" LIMIT 5;
-- Resultado esperado: Apenas transações do próprio usuário
*/

-- TESTE 3: Admin tentando ver todos os usuários
-- (Deve retornar todos os usuários)
/*
-- Com token de admin:
SELECT id, email, balance FROM public."User" LIMIT 5;
-- Resultado esperado: Todos os usuários
*/

-- TESTE 4: Usuário comum tentando acessar configurações do sistema
-- (Deve ser bloqueado)
/*
-- Com token de usuário comum:
SELECT * FROM public."system_config";
-- Resultado esperado: Erro de permissão ou resultado vazio
*/

-- TESTE 5: Admin tentando acessar configurações do sistema
-- (Deve ter acesso)
/*
-- Com token de admin:
SELECT * FROM public."system_config";
-- Resultado esperado: Configurações do sistema
*/

-- ===============================================
-- 4. VERIFICAÇÃO DE PERFORMANCE
-- ===============================================

-- Verificar se há índices adequados para as políticas
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('User', 'Transaction', 'Game', 'QueueEntry', 'Notification', 'system_config', 'Withdrawal', 'ShotAttempt')
ORDER BY tablename, indexname;

-- ===============================================
-- 5. MONITORAMENTO DE ACESSO
-- ===============================================

-- Verificar logs de acesso (se habilitado)
-- SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';

-- ===============================================
-- 6. TESTES DE INSERÇÃO E ATUALIZAÇÃO
-- ===============================================

-- TESTE 6: Usuário tentando inserir transação para outro usuário
-- (Deve ser bloqueado)
/*
-- Com token de usuário comum:
INSERT INTO public."Transaction" (user_id, amount, type, description) 
VALUES ('outro-user-id', 100.00, 'deposit', 'Teste de segurança');
-- Resultado esperado: Erro de permissão
*/

-- TESTE 7: Usuário tentando inserir transação para si mesmo
-- (Deve ser permitido)
/*
-- Com token de usuário comum (substitua 'seu-user-id' pelo ID real):
INSERT INTO public."Transaction" (user_id, amount, type, description) 
VALUES ('seu-user-id', 50.00, 'deposit', 'Teste de segurança');
-- Resultado esperado: Inserção bem-sucedida
*/

-- ===============================================
-- 7. RELATÓRIO DE VALIDAÇÃO
-- ===============================================

-- Contar políticas por tabela
SELECT 
    tablename as "Tabela",
    COUNT(*) as "Número de Políticas",
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ Adequado'
        WHEN COUNT(*) >= 1 THEN '⚠️ Mínimo'
        ELSE '❌ Insuficiente'
    END as "Status"
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ===============================================
-- SCRIPT DE TESTE CONCLUÍDO
-- ===============================================
-- Execute este script para validar as políticas RLS
-- Todos os testes devem passar antes do deploy em produção
-- Monitore logs de acesso após a aplicação
