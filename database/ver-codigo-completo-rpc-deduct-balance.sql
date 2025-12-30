-- =====================================================
-- VER CÓDIGO COMPLETO DA RPC rpc_deduct_balance
-- =====================================================
-- Objetivo: Ver o código completo para identificar onde está
-- tentando converter UUID para INTEGER
-- =====================================================

-- Ver código completo da função
SELECT pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'rpc_deduct_balance'
AND pronamespace = 'public'::regnamespace;

-- Ver também os parâmetros da função
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'rpc_deduct_balance'
AND n.nspname = 'public';

