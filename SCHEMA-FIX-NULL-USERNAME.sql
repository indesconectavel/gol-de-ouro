-- CORRIGIR VALORES NULL NA COLUNA USERNAME
-- =====================================================
-- Data: 17/10/2025
-- Status: CORRIGIR VALORES NULL EM 'username'
-- Versão: v4.1-fix-null-username-final

-- 1. Verificar quantos usuários têm username NULL
SELECT COUNT(*) as usuarios_com_username_null 
FROM public.usuarios 
WHERE username IS NULL;

-- 2. Atualizar valores NULL em 'username' para um valor padrão
UPDATE public.usuarios 
SET username = SUBSTRING(email FROM '^[^@]+') 
WHERE username IS NULL;

-- 3. Verificar se ainda há valores NULL após a correção
SELECT COUNT(*) as usuarios_com_username_null_apos_correcao 
FROM public.usuarios 
WHERE username IS NULL;

-- 4. Verificar alguns exemplos de usuários corrigidos
SELECT id, email, username 
FROM public.usuarios 
LIMIT 5;

-- 5. Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND table_schema = 'public' 
ORDER BY ordinal_position;
