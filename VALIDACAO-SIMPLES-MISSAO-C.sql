-- =====================================================
-- VALIDAÇÃO SIMPLES - MISSÃO C
-- Execute APENAS após adicionar as colunas faltantes
-- =====================================================

-- 1. Verificar estrutura da tabela lotes
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- 2. Verificar coluna ultimo_gol_de_ouro_arrecadacao em metricas_globais
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'metricas_globais' 
AND column_name = 'ultimo_gol_de_ouro_arrecadacao';

-- 3. Verificar funções RPC
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('rpc_update_lote_after_shot', 'rpc_get_or_create_lote')
ORDER BY routine_name;

-- 4. Verificar validação de R$10 na função rpc_update_lote_after_shot
SELECT 
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%10.00%' THEN '✅ Contém validação R$10'
        ELSE '❌ Não contém validação R$10'
    END as validacao
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'rpc_update_lote_after_shot';

-- 5. Verificar busca de lotes < R$10 na função rpc_get_or_create_lote
SELECT 
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%< 10.00%' OR routine_definition LIKE '%<10.00%' THEN '✅ Busca lotes < R$10'
        ELSE '❌ Não busca corretamente'
    END as busca
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'rpc_get_or_create_lote';

-- 6. Ver alguns lotes (só se colunas existirem)
SELECT 
    id,
    valor_aposta,
    status,
    posicao_atual,
    created_at
FROM public.lotes
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- FIM
-- =====================================================

