-- =====================================================
-- DIAGNÓSTICO E CORREÇÃO - RPC DEDUCT BALANCE
-- =====================================================
-- Problema: UUID sendo convertido para INTEGER
-- Erro: "invalid input syntax for type integer: \"7942b74a-f601-4acf-80e1-0051af8c2201\""
-- =====================================================

-- 1. Verificar código atual da RPC
SELECT pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'rpc_deduct_balance';

-- 2. Verificar triggers na tabela transacoes
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'transacoes'
AND event_object_schema = 'public';

-- 3. Verificar estrutura da tabela transacoes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'transacoes'
AND column_name IN ('referencia_id', 'usuario_id', 'id')
ORDER BY ordinal_position;

-- 4. Verificar se há constraints que podem estar causando problema
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.transacoes'::regclass
AND conname LIKE '%referencia%';

