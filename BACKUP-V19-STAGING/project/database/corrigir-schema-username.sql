-- =====================================================
-- CORREÇÃO: Renomear coluna nome para username
-- =====================================================
-- Data: 2025-11-24
-- Descrição: Corrige inconsistência entre schema e código
--            O código usa 'username' mas schema antigo usa 'nome'
-- =====================================================

-- Verificar se coluna nome existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'nome'
    ) THEN
        -- Se username não existe, renomear nome para username
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios' 
            AND column_name = 'username'
        ) THEN
            ALTER TABLE public.usuarios RENAME COLUMN nome TO username;
            RAISE NOTICE '✅ Coluna nome renomeada para username';
        ELSE
            -- Se ambos existem, migrar dados e remover nome
            UPDATE public.usuarios SET username = nome WHERE username IS NULL OR username = '';
            ALTER TABLE public.usuarios DROP COLUMN nome;
            RAISE NOTICE '✅ Dados migrados de nome para username, coluna nome removida';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Coluna nome não encontrada, pulando correção';
    END IF;
END $$;

-- Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'usuarios' 
AND column_name IN ('nome', 'username')
ORDER BY column_name;

-- ✅ Correção concluída

