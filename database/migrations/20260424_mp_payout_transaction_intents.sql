-- BLOCO V1-S — Colunas additive-only para Payout Mercado Pago (transaction-intents)
-- NÃO executar em produção sem aprovação explícita.
-- Após aplicar: configurar MP_PAYOUT_* e chave Ed25519 conforme doc Payouts / go-to-production.

ALTER TABLE public.saques
  ADD COLUMN IF NOT EXISTS mp_transaction_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS payout_external_reference TEXT,
  ADD COLUMN IF NOT EXISTS mp_payout_status TEXT,
  ADD COLUMN IF NOT EXISTS mp_payout_raw JSONB,
  ADD COLUMN IF NOT EXISTS last_mp_sync_at TIMESTAMPTZ;

COMMENT ON COLUMN public.saques.mp_transaction_intent_id IS 'ID retornado pelo MP em POST/GET /v1/transaction-intents';
COMMENT ON COLUMN public.saques.payout_external_reference IS 'external_reference curto (<=64) enviado ao MP; único quando preenchido';
COMMENT ON COLUMN public.saques.mp_payout_status IS 'Último status de payout devolvido pelo MP (sync ou GET)';
COMMENT ON COLUMN public.saques.mp_payout_raw IS 'Snapshot sanitizado da última resposta MP (auditoria)';
COMMENT ON COLUMN public.saques.last_mp_sync_at IS 'Última sincronização com API MP para este saque';

CREATE UNIQUE INDEX IF NOT EXISTS saques_payout_external_reference_uidx
  ON public.saques (payout_external_reference)
  WHERE payout_external_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS saques_mp_transaction_intent_id_idx
  ON public.saques (mp_transaction_intent_id)
  WHERE mp_transaction_intent_id IS NOT NULL;

-- O CHECK real de `saques.status` é específico do ambiente (Supabase).
-- Antes de alterar, inspecionar: SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.saques'::regclass;
-- Valores usados pelo backend após V1-S incluem, entre outros:
-- pendente, pending, processando, aguardando_confirmacao, processado, falhou, cancelado
