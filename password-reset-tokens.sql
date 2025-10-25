-- TABELA PARA TOKENS DE RECUPERAÇÃO DE SENHA - GOL DE OURO v1.2.0
-- ================================================================
-- Data: 24/10/2025
-- Status: TABELA PARA SISTEMA DE RECUPERAÇÃO DE SENHA
-- Versão: v1.2.0-password-recovery-tokens

-- Criar tabela para tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON public.password_reset_tokens(used);

-- Política RLS (Row Level Security)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de tokens
CREATE POLICY "Permitir inserção de tokens de recuperação" ON public.password_reset_tokens
    FOR INSERT WITH CHECK (true);

-- Política para permitir leitura de tokens válidos
CREATE POLICY "Permitir leitura de tokens válidos" ON public.password_reset_tokens
    FOR SELECT USING (true);

-- Política para permitir atualização de tokens (marcar como usado)
CREATE POLICY "Permitir atualização de tokens" ON public.password_reset_tokens
    FOR UPDATE USING (true);

-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_password_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM public.password_reset_tokens 
    WHERE expires_at < NOW() OR used = true;
    
    RAISE NOTICE 'Tokens de recuperação expirados removidos: %', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_password_reset_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_password_reset_tokens_updated_at
    BEFORE UPDATE ON public.password_reset_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_password_reset_tokens_updated_at();
