-- Cirurgia 10 — auditoria administrativa persistida (trilho mínimo).
-- Aplicar no Supabase após revisão. Idempotência: CREATE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE RESTRICT,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_logs IS 'Auditoria mínima de ações administrativas (sem segredos nem PII sensível).';

CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx ON public.admin_logs (admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_action_idx ON public.admin_logs (action);
