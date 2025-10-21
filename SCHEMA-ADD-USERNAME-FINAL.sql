-- ADICIONAR COLUNA USERNAME QUE ESTÁ FALTANDO
-- =====================================================
-- Data: 17/10/2025
-- Status: ADICIONAR COLUNA 'username' FALTANTE
-- Versão: v4.0-add-username-missing

-- 1. Adicionar a coluna 'username' se não existir
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Atualizar valores NULL em 'username' para um valor padrão
UPDATE public.usuarios
SET username = SUBSTRING(email FROM '^[^@]+')
WHERE username IS NULL;

-- 3. Definir a coluna 'username' como NOT NULL
ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;

-- 4. Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND table_schema = 'public' 
ORDER BY ordinal_position;
