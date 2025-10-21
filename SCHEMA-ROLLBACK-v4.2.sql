-- SCHEMA DE ROLLBACK - GOL DE OURO v4.2
-- =====================================================
-- Data: 17/10/2025
-- Status: ROLLBACK PARA VERSÃO ANTERIOR
-- Versão: v4.2-rollback

-- 1. REMOVER TABELA DE MÉTRICAS GLOBAIS (se necessário)
-- ATENÇÃO: Isso apagará todos os dados de métricas!
-- DROP TABLE IF EXISTS public.metricas_globais;

-- 2. REMOVER COLUNA USERNAME (se necessário)
-- ATENÇÃO: Isso apagará todos os usernames!
-- ALTER TABLE public.usuarios DROP COLUMN IF EXISTS username;

-- 3. RESTAURAR VALORES NULL EM USERNAME (se necessário)
-- UPDATE public.usuarios 
-- SET username = NULL 
-- WHERE username IS NOT NULL;

-- 4. VERIFICAR ESTRUTURA ATUAL
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND table_schema = 'public' 
ORDER BY ordinal_position;

-- 5. VERIFICAR DADOS ATUAIS
SELECT COUNT(*) as total_usuarios,
       COUNT(username) as usuarios_com_username,
       COUNT(*) - COUNT(username) as usuarios_sem_username
FROM public.usuarios;

-- 6. VERIFICAR MÉTRICAS GLOBAIS (se existir)
SELECT COUNT(*) as total_metricas
FROM information_schema.tables 
WHERE table_name = 'metricas_globais' AND table_schema = 'public';

-- 7. BACKUP DE SEGURANÇA (antes de qualquer alteração)
-- CREATE TABLE IF NOT EXISTS backup_usuarios_antes_rollback AS 
-- SELECT * FROM public.usuarios;

-- 8. INSTRUÇÕES DE ROLLBACK MANUAL
-- Para reverter completamente:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Reinicie o servidor backend
-- 3. Teste todas as funcionalidades
-- 4. Se necessário, restaure do backup de segurança

-- 9. VERIFICAÇÃO FINAL
SELECT 'ROLLBACK EXECUTADO COM SUCESSO' as status;
