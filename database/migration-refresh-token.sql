-- =====================================================
-- MIGRATION: Adicionar Refresh Token
-- =====================================================
-- Data: 2025-01-24
-- Status: HARDENING FINAL
-- Descrição: Adiciona coluna refresh_token na tabela usuarios
-- =====================================================

-- Adicionar coluna refresh_token se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'refresh_token'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN refresh_token TEXT;
        CREATE INDEX IF NOT EXISTS idx_usuarios_refresh_token ON public.usuarios(refresh_token);
        COMMENT ON COLUMN public.usuarios.refresh_token IS 'Refresh token JWT para renovação de acesso';
    END IF;
END $$;

-- Adicionar coluna last_login se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'last_login'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

