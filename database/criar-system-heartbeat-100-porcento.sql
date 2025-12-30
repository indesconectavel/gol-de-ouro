-- =====================================================
-- CRIAR TABELA system_heartbeat - PARA ALCANÇAR 100%
-- =====================================================
-- Data: 2025-12-09
-- Objetivo: Criar tabela system_heartbeat que falta para alcançar 100%
-- Status: IDEMPOTENTE - Pode ser executada múltiplas vezes
-- =====================================================

-- Criar tabela system_heartbeat (se não existe)
CREATE TABLE IF NOT EXISTS public.system_heartbeat (
    id SERIAL PRIMARY KEY,
    instance_id VARCHAR(255) UNIQUE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_system_heartbeat_last_seen 
ON public.system_heartbeat(last_seen);

CREATE INDEX IF NOT EXISTS idx_system_heartbeat_instance 
ON public.system_heartbeat(instance_id);

-- Habilitar RLS na tabela (se ainda não estiver habilitado)
ALTER TABLE public.system_heartbeat ENABLE ROW LEVEL SECURITY;

-- Criar policy para permitir acesso via service_role
-- (Apenas backend pode inserir/atualizar heartbeat)
-- Nota: DROP IF EXISTS antes de criar para evitar erro se já existir
DROP POLICY IF EXISTS "Backend pode gerenciar heartbeat" ON public.system_heartbeat;

CREATE POLICY "Backend pode gerenciar heartbeat"
ON public.system_heartbeat
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verificar se foi criada com sucesso
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_heartbeat'
    ) THEN
        RAISE NOTICE '✅ Tabela system_heartbeat criada com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ Erro ao criar tabela system_heartbeat';
    END IF;
END $$;

-- Mensagem de sucesso
SELECT '✅ Tabela system_heartbeat criada com sucesso! Sistema agora está 100% completo!' AS resultado;

