-- =====================================================
-- CORREÇÃO SIMPLES E DIRETA - ADICIONAR COLUNA USERNAME
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO DIRETA PARA COLUNA USERNAME
-- Versão: v5.0-simple-add-username

-- Verificar se a coluna username existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Adicionar coluna username se não existir
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS username TEXT;

-- Atualizar valores NULL existentes
UPDATE public.usuarios
SET username = COALESCE(
    SUBSTRING(email FROM '^[^@]+'), -- Pega a parte do email antes do @
    'usuario_' || id::TEXT,         -- Fallback para 'usuario_' + ID
    'usuario_desconhecido'          -- Fallback final
)
WHERE username IS NULL;

-- Definir como NOT NULL
ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Teste de inserção
INSERT INTO public.usuarios (email, username, senha_hash, saldo, tipo, ativo, email_verificado)
VALUES ('teste_final@validacao.com', 'TesteFinal', 'hash_teste_123', 100.00, 'jogador', true, false)
ON CONFLICT (email) DO NOTHING;

-- Limpar teste
DELETE FROM public.usuarios WHERE email = 'teste_final@validacao.com';
