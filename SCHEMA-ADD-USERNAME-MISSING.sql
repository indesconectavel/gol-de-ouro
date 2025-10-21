-- =====================================================
-- CORREÇÃO CRÍTICA - ADICIONAR COLUNA 'username' FALTANTE
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO PARA COLUNA 'username' AUSENTE
-- Versão: v4.0-add-missing-username

-- =====================================================
-- PASSO 1: VERIFICAR ESTRUTURA ATUAL DA TABELA USUARIOS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura atual da tabela public.usuarios...';
END $$;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 2: ADICIONAR COLUNA 'username' SE NÃO EXISTIR
-- =====================================================

DO $$
BEGIN
    -- Verificar se a coluna 'username' existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'username' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Coluna "username" não existe. Adicionando...';
        
        -- Adicionar coluna 'username' como nullable primeiro
        ALTER TABLE public.usuarios ADD COLUMN username TEXT;
        RAISE NOTICE 'Coluna "username" adicionada como nullable.';
        
        -- Atualizar valores NULL existentes com valores padrão
        UPDATE public.usuarios
        SET username = COALESCE(
            SUBSTRING(email FROM '^[^@]+'), -- Pega a parte do email antes do @
            'usuario_' || id::TEXT,         -- Fallback para 'usuario_' + ID
            'usuario_desconhecido'          -- Fallback final
        )
        WHERE username IS NULL;
        RAISE NOTICE 'Valores NULL na coluna "username" atualizados.';
        
        -- Agora definir como NOT NULL
        ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;
        RAISE NOTICE 'Coluna "username" definida como NOT NULL.';
        
    ELSE
        RAISE NOTICE 'Coluna "username" já existe.';
    END IF;
END $$;

-- =====================================================
-- PASSO 3: VERIFICAR ESTRUTURA FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura FINAL da tabela public.usuarios...';
END $$;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 4: TESTE DE INSERÇÃO (OPCIONAL)
-- =====================================================

DO $$
DECLARE
    test_user_id UUID;
BEGIN
    RAISE NOTICE 'Testando inserção de usuário para validação...';
    
    -- Tentar inserir um usuário de teste
    INSERT INTO public.usuarios (email, username, senha_hash, saldo, tipo, ativo, email_verificado)
    VALUES ('teste_schema@validacao.com', 'TesteSchema', 'hash_teste_123', 100.00, 'jogador', true, false)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO test_user_id;

    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário de teste inserido com sucesso: %', test_user_id;
        
        -- Remover o usuário de teste
        DELETE FROM public.usuarios WHERE id = test_user_id;
        RAISE NOTICE 'Usuário de teste removido após validação.';
    ELSE
        RAISE NOTICE 'Usuário de teste já existe ou não foi inserido.';
    END IF;
    
    RAISE NOTICE 'Validação do schema concluída com sucesso!';
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Script de correção da coluna "username" finalizado.';
END $$;
