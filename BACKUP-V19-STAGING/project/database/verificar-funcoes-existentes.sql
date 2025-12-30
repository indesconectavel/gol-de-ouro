-- Verificar quais funções realmente existem no banco
-- Executar no Supabase SQL Editor antes de corrigir search_path

-- 1. Listar todas as funções públicas
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as current_search_path,
    CASE 
        WHEN proconfig IS NULL OR array_length(proconfig, 1) IS NULL THEN 'SEM search_path'
        ELSE 'COM search_path'
    END as search_path_status
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- 2. Verificar especificamente as funções mencionadas no Security Advisor
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as current_search_path
FROM pg_proc
WHERE proname IN ('update_global_metrics', 'update_user_stats')
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Listar funções sem search_path definido (vulneráveis)
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND (proconfig IS NULL OR NOT ('search_path' = ANY(proconfig)))
ORDER BY proname;

