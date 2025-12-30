-- =====================================================
-- CORREÇÃO: Adicionar SET search_path à função de trigger
-- Security Advisor Warning: Function Search Path Mutable
-- Função: public.update_webhook_events_updated_at
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Corrigir warning de segurança
-- =====================================================

-- Recriar função com SET search_path
CREATE OR REPLACE FUNCTION public.update_webhook_events_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.update_webhook_events_updated_at() IS 'Trigger function para atualizar updated_at em webhook_events. Configurada com SET search_path para segurança.';

-- Verificar se o trigger existe e está correto
DO $$
BEGIN
    -- O trigger já deve existir, apenas garantir que está usando a função correta
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_webhook_events_updated_at_trigger'
        AND tgrelid = 'public.webhook_events'::regclass
    ) THEN
        CREATE TRIGGER update_webhook_events_updated_at_trigger
            BEFORE UPDATE ON public.webhook_events
            FOR EACH ROW
            EXECUTE FUNCTION public.update_webhook_events_updated_at();
    END IF;
END $$;

-- Mensagem de sucesso
SELECT '✅ Função update_webhook_events_updated_at corrigida com SET search_path!' AS resultado;

