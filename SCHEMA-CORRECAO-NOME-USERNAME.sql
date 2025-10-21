-- =====================================================
-- CORREÇÃO ESPECÍFICA - COLUNA 'nome' NA TABELA 'usuarios'
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO PARA CONFLITO DE COLUNAS 'nome'/'username'
-- Versão: v3.1-fix-nome-username

-- =====================================================
-- PASSO 1: VERIFICAR ESTRUTURA ATUAL DA TABELA USUARIOS
-- =====================================================

RAISE NOTICE 'Verificando estrutura da tabela public.usuarios...';
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 2: CORREÇÃO AUTOMÁTICA DA COLUNA 'nome'
-- =====================================================

DO $$
DECLARE
    nome_exists BOOLEAN;
    username_exists BOOLEAN;
    nome_is_not_null BOOLEAN;
BEGIN
    -- Verificar se 'nome' existe
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'nome' AND table_schema = 'public'
    ) INTO nome_exists;

    -- Verificar se 'username' existe
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'username' AND table_schema = 'public'
    ) INTO username_exists;

    -- Verificar se 'nome' é NOT NULL (se existir)
    IF nome_exists THEN
        SELECT is_nullable = 'NO'
        FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'nome' AND table_schema = 'public'
        INTO nome_is_not_null;
    END IF;

    IF nome_exists AND NOT username_exists THEN
        -- Caso 1: 'nome' existe e 'username' NÃO existe. Renomear 'nome' para 'username'.
        RAISE NOTICE 'Renomeando coluna "nome" para "username" na tabela usuarios...';
        ALTER TABLE public.usuarios RENAME COLUMN nome TO username;
        RAISE NOTICE 'Coluna "nome" renomeada para "username".';

        -- Garantir que 'username' seja NOT NULL
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'username' AND is_nullable = 'NO') THEN
            RAISE NOTICE 'Adicionando constraint NOT NULL à coluna username...';
            ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;
        END IF;

    ELSIF nome_exists AND username_exists THEN
        -- Caso 2: Ambas 'nome' e 'username' existem. Remover 'nome' (pois 'username' é a coluna correta).
        RAISE NOTICE 'Ambas as colunas "nome" e "username" existem. Removendo a coluna "nome" redundante...';
        ALTER TABLE public.usuarios DROP COLUMN nome;
        RAISE NOTICE 'Coluna "nome" removida.';

        -- Garantir que 'username' seja NOT NULL
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'username' AND is_nullable = 'NO') THEN
            RAISE NOTICE 'Adicionando constraint NOT NULL à coluna username...';
            ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;
        END IF;

    ELSIF NOT nome_exists AND NOT username_exists THEN
        -- Caso 3: Nenhuma das colunas existe. Adicionar 'username' como NOT NULL.
        RAISE NOTICE 'Nenhuma das colunas "nome" ou "username" existe. Adicionando coluna "username" como NOT NULL...';
        ALTER TABLE public.usuarios ADD COLUMN username TEXT NOT NULL DEFAULT 'default_username';
        -- Remover o default após a adição, se necessário, para evitar que novos registros usem o default
        ALTER TABLE public.usuarios ALTER COLUMN username DROP DEFAULT;
        RAISE NOTICE 'Coluna "username" adicionada como NOT NULL.';

    ELSIF NOT nome_exists AND username_exists THEN
        -- Caso 4: 'username' existe e 'nome' NÃO existe. Apenas garantir que 'username' seja NOT NULL.
        RAISE NOTICE 'Coluna "username" já existe e "nome" não. Verificando e garantindo NOT NULL para "username"...';
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'username' AND is_nullable = 'YES') THEN
            RAISE NOTICE 'Adicionando constraint NOT NULL à coluna username...';
            ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;
        END IF;
        RAISE NOTICE 'Coluna "username" verificada.';
    END IF;

    RAISE NOTICE 'Verificação e correção da coluna "nome" e "username" concluída.';
END $$;

-- =====================================================
-- PASSO 3: VERIFICAR ESTRUTURA FINAL DA TABELA USUARIOS
-- =====================================================

RAISE NOTICE 'Verificando estrutura FINAL da tabela public.usuarios...';
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 4: TESTE DE FUNCIONAMENTO
-- =====================================================

-- Testar inserção de usuário
INSERT INTO usuarios (email, password_hash, username, saldo, role, account_status)
VALUES ('teste@nome-corrigido.com', 'hash_teste_nome_corrigido', 'TesteNomeCorrigido', 0.00, 'player', 'active')
ON CONFLICT (email) DO NOTHING;

-- Verificar se o usuário foi criado
SELECT id, email, username, saldo, role, account_status FROM usuarios WHERE email = 'teste@nome-corrigido.com';

-- =====================================================
-- PASSO 5: VERIFICAÇÃO FINAL COMPLETA
-- =====================================================

-- Verificar estrutura final de todas as tabelas
SELECT 'USUARIOS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar todas as tabelas criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('usuarios', 'pagamentos_pix', 'chutes', 'saques', 'metricas_globais')
ORDER BY table_name;

-- =====================================================
-- SCHEMA FINALIZADO - VERSÃO CORREÇÃO NOME/USERNAME
-- =====================================================
-- Status: ✅ CORREÇÃO DE NOME/USERNAME APLICADA
-- Data: 17/10/2025
-- Versão: v3.1-fix-nome-username
