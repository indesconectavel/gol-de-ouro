-- Correção de search_path para funções restantes identificadas pelo Security Advisor
-- Executar no Supabase SQL Editor

-- 1. Verificar quais funções realmente existem
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as current_search_path
FROM pg_proc
WHERE proname IN ('update_global_metrics', 'update_user_stats')
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Corrigir apenas as funções que existem
-- Se update_global_metrics existir, executar:
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_global_metrics' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        EXECUTE 'ALTER FUNCTION public.update_global_metrics() SET search_path = public, pg_catalog';
        RAISE NOTICE 'Função update_global_metrics corrigida';
    ELSE
        RAISE NOTICE 'Função update_global_metrics não existe - ignorando';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_user_stats' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        EXECUTE 'ALTER FUNCTION public.update_user_stats() SET search_path = public, pg_catalog';
        RAISE NOTICE 'Função update_user_stats corrigida';
    ELSE
        RAISE NOTICE 'Função update_user_stats não existe - ignorando';
    END IF;
END $$;

-- 3. Verificar se foram aplicadas corretamente
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as search_path_config
FROM pg_proc
WHERE proname IN ('update_global_metrics', 'update_user_stats')
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

