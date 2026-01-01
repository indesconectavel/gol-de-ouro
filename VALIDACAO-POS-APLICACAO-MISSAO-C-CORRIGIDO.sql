-- =====================================================
-- VALIDAÇÕES PÓS-APLICAÇÃO - MISSÃO C (CORRIGIDO)
-- Execute estas queries no Supabase SQL Editor para validar
-- =====================================================

-- PASSO 0: Verificar estrutura real da tabela lotes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- =====================================================
-- VALIDAÇÕES BÁSICAS (sempre funcionam)
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

-- 2. Verificar valor atual da coluna (se tabela existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'metricas_globais') THEN
        RAISE NOTICE 'Tabela metricas_globais existe';
    ELSE
        RAISE NOTICE 'Tabela metricas_globais NÃO existe';
    END IF;
END $$;

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
        WHEN routine_definition LIKE '%>= 10.00%' OR routine_definition LIKE '%>=10.00%' THEN '✅ Fecha quando >= R$10'
        ELSE '❌ Não fecha corretamente'
    END as fechamento_automatico
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'rpc_update_lote_after_shot';

-- 5. Verificar se função rpc_get_or_create_lote busca lotes com arrecadação < R$10
SELECT 
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%< 10.00%' OR routine_definition LIKE '%<10.00%' THEN '✅ Busca lotes < R$10'
        ELSE '❌ Não busca corretamente'
    END as busca_lotes,
    CASE 
        WHEN routine_definition LIKE '%indice_vencedor = -1%' OR routine_definition LIKE '%indice_vencedor=-1%' THEN '✅ Inicializa com -1'
        ELSE '❌ Não inicializa corretamente'
    END as inicializacao_vencedor
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'rpc_get_or_create_lote';

-- =====================================================
-- VALIDAÇÕES CONDICIONAIS (só se coluna existir)
-- =====================================================

-- 6. Verificar se coluna total_arrecadado existe antes de usar
DO $$
DECLARE
    coluna_existe BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'total_arrecadado'
    ) INTO coluna_existe;
    
    IF coluna_existe THEN
        RAISE NOTICE '✅ Coluna total_arrecadado EXISTE - Executando validações de lotes...';
    ELSE
        RAISE NOTICE '⚠️ Coluna total_arrecadado NÃO EXISTE - Pulando validações de lotes';
        RAISE NOTICE '💡 A coluna pode ter outro nome ou a tabela precisa ser atualizada';
    END IF;
END $$;

-- 6a. Verificar lotes ativos (só se coluna total_arrecadado existir)
SELECT 
    id,
    valor_aposta,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'lotes' 
            AND column_name = 'total_arrecadado'
        ) THEN (
            SELECT total_arrecadado::TEXT FROM public.lotes l2 WHERE l2.id = l.id
        )
        ELSE 'Coluna não existe'
    END as total_arrecadado,
    status,
    indice_vencedor,
    posicao_atual
FROM public.lotes l
WHERE status = 'ativo'
LIMIT 10;

-- 6b. Versão alternativa usando apenas colunas que sabemos que existem
SELECT 
    id,
    valor_aposta,
    status,
    indice_vencedor,
    posicao_atual,
    created_at,
    updated_at
FROM public.lotes
WHERE status = 'ativo'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar lotes fechados (completed) e seus winnerIndex
SELECT 
    id,
    valor_aposta,
    status,
    indice_vencedor,
    posicao_atual,
    CASE 
        WHEN indice_vencedor >= 0 THEN '✅ WinnerIndex definido'
        WHEN indice_vencedor = -1 THEN '⚠️ WinnerIndex ainda -1 (deveria estar definido)'
        ELSE '❓ Status desconhecido'
    END as status_vencedor,
    completed_at
FROM public.lotes
WHERE status = 'completed' OR status = 'finalizado'
ORDER BY COALESCE(completed_at, updated_at) DESC
LIMIT 10;

-- 8. Resumo estatístico (usando apenas colunas que existem)
SELECT 
    COUNT(*) FILTER (WHERE status = 'ativo') as lotes_ativos,
    COUNT(*) FILTER (WHERE status = 'completed' OR status = 'finalizado') as lotes_fechados,
    COUNT(*) FILTER (WHERE indice_vencedor = -1 AND status = 'ativo') as lotes_ativos_sem_vencedor,
    COUNT(*) FILTER (WHERE indice_vencedor >= 0 AND (status = 'completed' OR status = 'finalizado')) as lotes_fechados_com_vencedor,
    COUNT(*) as total_lotes
FROM public.lotes;

-- =====================================================
-- DIAGNÓSTICO: Verificar todas as colunas da tabela lotes
-- =====================================================
SELECT 
    'ESTRUTURA DA TABELA lotes:' as info,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as colunas
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lotes';

-- =====================================================
-- FIM DAS VALIDAÇÕES
-- =====================================================
-- ✅ Execute primeiro a query "PASSO 0" para ver a estrutura real da tabela
-- ✅ Depois execute as outras queries conforme necessário
-- =====================================================

