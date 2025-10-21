-- CORREÇÃO URGENTE: ADICIONAR COLUNA PASSWORD
-- =====================================================
-- Data: 17/10/2025
-- Status: CORREÇÃO URGENTE PROBLEMA LOGIN
-- Versão: v4.5-correcao-urgente-password

-- Este script adiciona a coluna 'password' que está faltando na tabela 'usuarios'
-- e corrige problemas de autenticação

DO $$
BEGIN
    -- Verificar se a coluna 'password' existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'password'
    ) THEN
        -- Adicionar coluna 'password'
        ALTER TABLE public.usuarios 
        ADD COLUMN password VARCHAR(255);
        
        RAISE NOTICE 'Coluna password adicionada à tabela usuarios';
    ELSE
        RAISE NOTICE 'Coluna password já existe na tabela usuarios';
    END IF;

    -- Verificar se a coluna 'senha' existe (pode ser que esteja usando 'senha' ao invés de 'password')
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'senha'
    ) THEN
        -- Renomear 'senha' para 'password' se existir
        ALTER TABLE public.usuarios 
        RENAME COLUMN senha TO password;
        
        RAISE NOTICE 'Coluna senha renomeada para password';
    END IF;

    -- Verificar se a coluna 'password_hash' existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'password_hash'
    ) THEN
        -- Renomear 'password_hash' para 'password' se existir
        ALTER TABLE public.usuarios 
        RENAME COLUMN password_hash TO password;
        
        RAISE NOTICE 'Coluna password_hash renomeada para password';
    END IF;

    -- Verificar estrutura final da tabela usuarios
    RAISE NOTICE 'Verificando estrutura final da tabela usuarios...';
    
    -- Listar todas as colunas da tabela usuarios
    FOR rec IN (
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
        ORDER BY ordinal_position
    ) LOOP
        RAISE NOTICE 'Coluna: % - Tipo: % - Nullable: %', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;

    RAISE NOTICE 'CORREÇÃO URGENTE PASSWORD CONCLUÍDA COM SUCESSO';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro ao corrigir coluna password: %', SQLERRM;
END $$;
