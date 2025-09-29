-- supabase/policies_mp_events.sql - Endurecer mp_events (apenas service role)
-- Aplicar via Supabase CLI ou Dashboard

-- Revogar acesso público à tabela mp_events
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.mp_events FROM public;

-- Opcional: criar policy para role de serviço específico
-- (ajuste conforme seu setup de autenticação)
DO $$
BEGIN
  -- Verificar se role de serviço existe
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    -- Garantir que service_role tem acesso total
    GRANT ALL ON public.mp_events TO service_role;
  END IF;
END $$;

-- Comentário: mp_events é usado apenas para idempotência de webhooks
-- Não deve ser acessível via RLS público, apenas via service_role
