-- Saneamento controlado de legados PIX não numéricos para reconcile.
-- Objetivo: tirar do ciclo automático linhas pendentes sem ID MP válido.
-- Seguro/idempotente: apenas marca reconcile_skip=true por critério estrito.
-- Data: 2026-03-31

ALTER TABLE public.pagamentos_pix
  ADD COLUMN IF NOT EXISTS reconcile_skip boolean NOT NULL DEFAULT false;

-- Marca como "fora do reconcile automático" apenas quando
-- NÃO há ID numérico em nenhum dos campos usados para lookup no MP.
UPDATE public.pagamentos_pix
SET reconcile_skip = true,
    updated_at = NOW()
WHERE status = 'pending'
  AND COALESCE(reconcile_skip, false) = false
  AND (
    (payment_id IS NULL OR payment_id !~ '^[0-9]+$')
    AND (external_id IS NULL OR external_id !~ '^[0-9]+$')
  );

-- Índice parcial para reconcile saudável
CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_pending_reconcile
  ON public.pagamentos_pix (created_at ASC)
  WHERE status = 'pending' AND reconcile_skip = false;
