-- =====================================================
-- CORREÇÃO ESPECÍFICA - COLUNA 'username' COM VALORES NULL
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO PARA VALORES NULL EM 'username'
-- Versão: v3.2-fix-null-username

-- =====================================================
-- PASSO 1: VERIFICAR ESTRUTURA ATUAL DA TABELA USUARIOS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura da tabela public.usuarios...';
END $$;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 2: VERIFICAR VALORES NULL NA COLUNA 'username'
-- =====================================================

DO $$
DECLARE
    null_count INTEGER;
BEGIN
    -- Contar quantos registros têm username NULL
    SELECT COUNT(*) INTO null_count
    FROM public.usuarios
    WHERE username IS NULL;
    
    RAISE NOTICE 'Encontrados % registros com username NULL', null_count;
    
    IF null_count > 0 THEN
        RAISE NOTICE 'Atualizando registros com username NULL...';
        
        -- Atualizar registros com username NULL usando email como base
        UPDATE public.usuarios 
        SET username = COALESCE(
            CASE 
                WHEN email IS NOT NULL THEN 
                    SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1)
                ELSE 'usuario_' || id::text
            END,
            'usuario_' || id::text
        )
        WHERE username IS NULL;
        
        RAISE NOTICE 'Registros atualizados com sucesso';
    ELSE
        RAISE NOTICE 'Nenhum registro com username NULL encontrado';
    END IF;
END $$;

-- =====================================================
-- PASSO 3: CORREÇÃO AUTOMÁTICA DA COLUNA 'nome'/'username'
-- =====================================================

DO $$
DECLARE
    nome_exists BOOLEAN;
    username_exists BOOLEAN;
    nome_is_not_null BOOLEAN;
BEGIN
    -- Verifica se a coluna 'nome' existe
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'nome' AND table_schema = 'public'
    ) INTO nome_exists;

    -- Verifica se a coluna 'username' existe
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'username' AND table_schema = 'public'
    ) INTO username_exists;

    -- Verifica se a coluna 'nome' é NOT NULL
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'nome' AND is_nullable = 'NO' AND table_schema = 'public'
    ) INTO nome_is_not_null;

    IF nome_exists AND NOT username_exists THEN
        -- Caso 1: 'nome' existe e 'username' não existe. Renomear 'nome' para 'username'.
        RAISE NOTICE 'Coluna "nome" existe e "username" não. Renomeando "nome" para "username"...';
        ALTER TABLE public.usuarios RENAME COLUMN nome TO username;
        RAISE NOTICE 'Coluna "nome" renomeada para "username".';

        -- Garantir que 'username' seja NOT NULL (agora que não há valores NULL)
        IF NOT nome_is_not_null THEN
            RAISE NOTICE 'Definindo "username" como NOT NULL...';
            ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;
            RAISE NOTICE '"username" definido como NOT NULL.';
        END IF;

    ELSIF nome_exists AND username_exists THEN
        -- Caso 2: Ambas 'nome' e 'username' existem. Remover 'nome'.
        RAISE NOTICE 'Ambas as colunas "nome" e "username" existem. Removendo "nome"...';
        ALTER TABLE public.usuarios DROP COLUMN nome;
        RAISE NOTICE 'Coluna "nome" removida.';

        -- Garantir que 'username' seja NOT NULL (agora que não há valores NULL)
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'usuarios' AND column_name = 'username' AND is_nullable = 'NO' AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'Definindo "username" como NOT NULL...';
            ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;
            RAISE NOTICE '"username" definido como NOT NULL.';
        END IF;

    ELSIF NOT nome_exists AND NOT username_exists THEN
        -- Caso 3: Nenhuma das colunas existe. Adicionar 'username' como NOT NULL.
        RAISE NOTICE 'Nenhuma das colunas "nome" ou "username" existe. Adicionando "username"...';
        ALTER TABLE public.usuarios ADD COLUMN username TEXT NOT NULL DEFAULT 'usuario_default';
        -- Remover o default após a adição
        ALTER TABLE public.usuarios ALTER COLUMN username DROP DEFAULT;
        RAISE NOTICE 'Coluna "username" adicionada como NOT NULL.';

    ELSIF NOT nome_exists AND username_exists THEN
        -- Caso 4: 'username' existe e 'nome' não. Garantir que 'username' seja NOT NULL.
        RAISE NOTICE 'Coluna "username" já existe. Verificando se é NOT NULL...';
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'usuarios' AND column_name = 'username' AND is_nullable = 'NO' AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'Definindo "username" como NOT NULL...';
            ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;
            RAISE NOTICE '"username" definido como NOT NULL.';
        END IF;
    END IF;

    RAISE NOTICE 'Verificação e correção da coluna "nome"/"username" concluída.';

    -- =====================================================
    -- PASSO 4: VERIFICAR E ADICIONAR OUTRAS COLUNAS CRÍTICAS
    -- =====================================================

    -- Adicionar 'password_hash' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'password_hash' AND table_schema = 'public') THEN
        RAISE NOTICE 'Adicionando coluna password_hash à tabela usuarios...';
        ALTER TABLE public.usuarios ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Coluna password_hash adicionada.';
    END IF;

    -- Adicionar 'account_status' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'account_status' AND table_schema = 'public') THEN
        RAISE NOTICE 'Adicionando coluna account_status à tabela usuarios...';
        ALTER TABLE public.usuarios ADD COLUMN account_status TEXT DEFAULT 'active';
        RAISE NOTICE 'Coluna account_status adicionada.';
    END IF;

    -- Adicionar 'updated_at' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'updated_at' AND table_schema = 'public') THEN
        RAISE NOTICE 'Adicionando coluna updated_at à tabela usuarios...';
        ALTER TABLE public.usuarios ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada.';
    END IF;

    RAISE NOTICE 'Verificação e correção de outras colunas críticas concluída.';

END $$;

-- =====================================================
-- PASSO 5: VERIFICAR ESTRUTURA FINAL DA TABELA USUARIOS
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
-- PASSO 6: TESTE DE INSERÇÃO (OPCIONAL - DESCOMENTE PARA TESTAR)
-- =====================================================
-- Este teste tenta inserir um usuário para verificar se o schema está funcional.
-- Se você já tem usuários, pode comentar esta seção.
-- Certifique-se de que o email e username sejam únicos.

-- DO $$
-- DECLARE
--     test_user_id UUID;
-- BEGIN
--     RAISE NOTICE 'Tentando inserir usuário de teste para validação...';
--     INSERT INTO public.usuarios (email, password_hash, username, saldo, role, account_status)
--     VALUES ('teste_fix_null@schema.com', 'hash_seguro_123', 'FixNullUser', 100.00, 'player', 'active')
--     ON CONFLICT (email) DO NOTHING
--     RETURNING id INTO test_user_id;

--     IF test_user_id IS NOT NULL THEN
--         RAISE NOTICE 'Usuário de teste inserido com sucesso: %', test_user_id;
--     ELSE
--         RAISE NOTICE 'Usuário de teste já existe ou não foi inserido.';
--     END IF;
-- END $$;

DO $$
BEGIN
    RAISE NOTICE 'Script de correção de valores NULL em "username" finalizado.';
END $$;
