-- V1 MANUAL SAQUE — expande tipos no ledger_financeiro e status em saques para fluxo administrativo.
-- Aplicar no Supabase após revisão. Idempotência: só executar uma vez por ambiente.

-- 1) Ledger: novos tipos para confirmação manual e rollback manual administrativo.
ALTER TABLE public.ledger_financeiro DROP CONSTRAINT IF EXISTS ledger_financeiro_tipo_check;

ALTER TABLE public.ledger_financeiro
  ADD CONSTRAINT ledger_financeiro_tipo_check CHECK (
    tipo = ANY (
      ARRAY[
        'deposito'::text,
        'saque'::text,
        'taxa'::text,
        'rollback'::text,
        'payout_confirmado'::text,
        'falha_payout'::text,
        'payout_manual_confirmado'::text,
        'rollback_manual'::text
      ]
    )
  );

-- 2) Saques: incluir pago_manual e cancelado_manual mantendo valores já usados pelo backend/MP.
ALTER TABLE public.saques DROP CONSTRAINT IF EXISTS saques_status_check;

ALTER TABLE public.saques
  ADD CONSTRAINT saques_status_check CHECK (
    status = ANY (
      ARRAY[
        'pendente'::text,
        'pending'::text,
        'processando'::text,
        'processing'::text,
        'em_processamento'::text,
        'aguardando_confirmacao'::text,
        'processado'::text,
        'falhou'::text,
        'cancelado'::text,
        'rejeitado'::text,
        'concluido'::text,
        'pago_manual'::text,
        'cancelado_manual'::text
      ]
    )
  );

COMMENT ON CONSTRAINT saques_status_check ON public.saques IS
  'Status de saques V1+V1-S; inclui pago_manual/cancelado_manual para payout manual administrativo';
