-- Ledger financeiro imutável para auditoria de saques/depositos
-- Criar tabela de ledger (somente insert)
create table if not exists ledger_financeiro (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  tipo text not null check (tipo in ('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout')),
  usuario_id uuid not null,
  valor numeric(12,2) not null,
  referencia text,
  created_at timestamptz not null default now()
);

create index if not exists ledger_financeiro_usuario_idx on ledger_financeiro (usuario_id);
create index if not exists ledger_financeiro_created_idx on ledger_financeiro (created_at);
create unique index if not exists ledger_financeiro_correlation_tipo_ref_idx on ledger_financeiro (correlation_id, tipo, referencia);

-- Associar correlation_id ao saque para idempotência
alter table saques add column if not exists correlation_id text;
create index if not exists saques_correlation_id_idx on saques (correlation_id);
