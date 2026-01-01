-- =====================================================
-- VALIDAÇÕES PÓS-APLICAÇÃO - MISSÃO C
-- Execute estas queries no Supabase SQL Editor para validar
-- =====================================================

-- 1. Verificar se coluna ultimo_gol_de_ouro_arrecadacao foi criada
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'metricas_globais' 
AND column_name = 'ultimo_gol_de_ouro_arrecadacao';

-- 2. Verificar valor atual da coluna
SELECT 
    ultimo_gol_de_ouro_arrecadacao,
    (SELECT COUNT(*) FROM metricas_globais) as total_registros
FROM public.metricas_globais
LIMIT 1;

-- 3. Verificar se funções RPC foram atualizadas
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('rpc_update_lote_after_shot', 'rpc_get_or_create_lote')
ORDER BY routine_name;

-- 4. Verificar se função rpc_update_lote_after_shot contém validação de R$10
SELECT 
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%10.00%' THEN '✅ Contém validação R$10'
        ELSE '❌ Não contém validação R$10'
    END as validacao_r10,
    CASE 
        WHEN routine_definition LIKE '%total_arrecadado >= 10.00%' THEN '✅ Fecha quando >= R$10'
        ELSE '❌ Não fecha corretamente'
    END as fechamento_automatico
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'rpc_update_lote_after_shot';

-- 5. Verificar se função rpc_get_or_create_lote busca lotes com arrecadação < R$10
SELECT 
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%total_arrecadado < 10.00%' THEN '✅ Busca lotes < R$10'
        ELSE '❌ Não busca corretamente'
    END as busca_lotes,
    CASE 
        WHEN routine_definition LIKE '%indice_vencedor = -1%' THEN '✅ Inicializa com -1'
        ELSE '❌ Não inicializa corretamente'
    END as inicializacao_vencedor
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'rpc_get_or_create_lote';

-- 6. Verificar lotes ativos com arrecadação < R$10
SELECT 
    id,
    valor_aposta,
    total_arrecadado,
    status,
    indice_vencedor,
    posicao_atual,
    CASE 
        WHEN total_arrecadado < 10.00 THEN '✅ Abaixo de R$10'
        WHEN total_arrecadado >= 10.00 THEN '⚠️ Deveria estar fechado'
        ELSE '❓ Status desconhecido'
    END as status_arrecadacao
FROM public.lotes
WHERE status = 'ativo'
ORDER BY total_arrecadado DESC
LIMIT 10;

-- 7. Verificar lotes fechados (completed) e seus winnerIndex
SELECT 
    id,
    valor_aposta,
    total_arrecadado,
    status,
    indice_vencedor,
    posicao_atual,
    CASE 
        WHEN indice_vencedor >= 0 THEN '✅ WinnerIndex definido'
        WHEN indice_vencedor = -1 THEN '⚠️ WinnerIndex ainda -1 (deveria estar definido)'
        ELSE '❓ Status desconhecido'
    END as status_vencedor
FROM public.lotes
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;

-- 8. Resumo estatístico
SELECT 
    COUNT(*) FILTER (WHERE status = 'ativo' AND total_arrecadado < 10.00) as lotes_ativos_abaixo_r10,
    COUNT(*) FILTER (WHERE status = 'ativo' AND total_arrecadado >= 10.00) as lotes_ativos_acima_r10,
    COUNT(*) FILTER (WHERE status = 'completed') as lotes_fechados,
    COUNT(*) FILTER (WHERE indice_vencedor = -1 AND status = 'ativo') as lotes_ativos_sem_vencedor,
    COUNT(*) FILTER (WHERE indice_vencedor >= 0 AND status = 'completed') as lotes_fechados_com_vencedor
FROM public.lotes;

-- =====================================================
-- FIM DAS VALIDAÇÕES
-- =====================================================
-- ✅ Se todas as queries retornaram resultados esperados, a migração está OK!
-- =====================================================

