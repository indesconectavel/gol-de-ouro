-- ADICIONAR COLUNA USERNAME - SCRIPT ULTRA SIMPLES
ALTER TABLE public.usuarios ADD COLUMN username TEXT;

-- Atualizar valores NULL existentes
UPDATE public.usuarios SET username = SUBSTRING(email FROM '^[^@]+') WHERE username IS NULL;

-- Definir como NOT NULL
ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;

-- Verificar resultado
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'usuarios' AND table_schema = 'public' 
ORDER BY ordinal_position;
