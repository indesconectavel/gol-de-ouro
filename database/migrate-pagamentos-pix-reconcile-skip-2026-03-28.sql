-- Excluir linhas legadas do reconcile automático (payment_id/external_id não numéricos).
-- Aplicar no Supabase SQL Editor antes ou junto ao deploy que usa reconcile_skip.
-- Data: 2026-03-28

ALTER TABLE public.pagamentos_pix
  ADD COLUMN IF NOT EXISTS reconcile_skip boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.pagamentos_pix.reconcile_skip IS
  'Quando true, o job de reconcile em server-fly.js ignora a linha (ex.: ID MP inválido / legado).';

CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_pending_reconcile
  ON public.pagamentos_pix (created_at ASC)
  WHERE status = 'pending' AND reconcile_skip = false;
