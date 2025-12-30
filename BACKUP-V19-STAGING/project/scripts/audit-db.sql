-- scripts/audit-db.sql - Verificação básica do banco
-- Executar via psql: psql "$env:DATABASE_URL" -f scripts/audit-db.sql

-- Teste de conectividade
SELECT 1 as connectivity_test;

-- Verificar tabelas principais
SELECT 
  schemaname, 
  tablename, 
  hasindexes 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'transactions', 'mp_events', 'shot_attempts', 'withdrawals');

-- Contar registros nas tabelas principais
SELECT 'transactions' as table_name, count(*) as record_count FROM public.transactions
UNION ALL
SELECT 'mp_events' as table_name, count(*) as record_count FROM public.mp_events
UNION ALL
SELECT 'users' as table_name, count(*) as record_count FROM public.users;

-- Verificar RLS ativo
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'transactions', 'mp_events', 'shot_attempts', 'withdrawals');

-- Verificar policies ativas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'transactions', 'mp_events', 'shot_attempts', 'withdrawals');
