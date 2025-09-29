-- Habilita RLS
alter table if exists public.transactions enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.queue_board enable row level security;
alter table if exists public.shot_attempts enable row level security;
alter table if exists public.withdrawals enable row level security;

-- Policies exemplo por user_id (ajuste sua auth, se usa auth.uid() ou app.user_id)
do $$
begin
  if not exists (select 1 from pg_policies where polname='user_can_read_own_transactions') then
    create policy "user_can_read_own_transactions"
    on public.transactions for select
    using (coalesce(current_setting('app.user_id', true), '') <> '' and user_id::text = current_setting('app.user_id', true));
  end if;

  if not exists (select 1 from pg_policies where polname='user_can_insert_own_transactions') then
    create policy "user_can_insert_own_transactions"
    on public.transactions for insert
    with check (coalesce(current_setting('app.user_id', true), '') <> '' and user_id::text = current_setting('app.user_id', true));
  end if;
end $$;

-- Índices básicos
create index if not exists idx_tx_user on public.transactions(user_id);
create index if not exists idx_tx_created on public.transactions(created_at);

-- Idempotência de webhook do Mercado Pago
create table if not exists mp_events (
  id text primary key,
  received_at timestamptz default now()
);
