-- =====================================================
-- TABELA IDEMPOTENCY_KEYS - GOL DE OURO
-- =====================================================
-- Objetivo: Implementar idempotência no endpoint /api/games/shoot
-- Data: 2025-01-XX
-- 
-- Esta tabela armazena respostas de requisições idempotentes
-- para evitar processamento duplicado.

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índice único para garantir que não haja duplicatas
    -- para a mesma combinação de user_id + endpoint + idempotency_key
    CONSTRAINT unique_idempotency UNIQUE (user_id, endpoint, idempotency_key)
);

-- Índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup 
ON public.idempotency_keys(user_id, endpoint, idempotency_key);

-- Índice para limpeza de registros antigos (opcional, para manutenção futura)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at 
ON public.idempotency_keys(created_at);

-- Comentários para documentação
COMMENT ON TABLE public.idempotency_keys IS 'Armazena respostas de requisições idempotentes para evitar processamento duplicado';
COMMENT ON COLUMN public.idempotency_keys.user_id IS 'ID do usuário que fez a requisição';
COMMENT ON COLUMN public.idempotency_keys.endpoint IS 'Endpoint da requisição (ex: /api/games/shoot)';
COMMENT ON COLUMN public.idempotency_keys.idempotency_key IS 'Chave de idempotência enviada no header X-Idempotency-Key';
COMMENT ON COLUMN public.idempotency_keys.response_body IS 'Resposta JSON completa da requisição original';

