-- =====================================================
-- VALIDAÇÃO FINAL - MISSÃO C
-- Execute APENAS após confirmar que todas as colunas existem
-- =====================================================

-- 1. Verificar TODAS as colunas da tabela lotes
SELECT 
    column_name, 
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- 2. Verificar coluna ultimo_gol_de_ouro_arrecadacao
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'metricas_globais' 
            AND column_name = 'ultimo_gol_de_ouro_arrecadacao'
        ) THEN '✅ Coluna ultimo_gol_de_ouro_arrecadacao EXISTE'
        ELSE '❌ Coluna ultimo_gol_de_ouro_arrecadacao NÃO EXISTE'
    END as status_coluna_gol_ouro;

-- 3. Verificar funções RPC atualizadas
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'rpc_update_lote_after_shot' THEN '✅ Função de atualização existe'
        WHEN routine_name = 'rpc_get_or_create_lote' THEN '✅ Função de criação existe'
        ELSE '❓ Função desconhecida'
    END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('rpc_update_lote_after_shot', 'rpc_get_or_create_lote')
ORDER BY routine_name;

-- 4. Verificar validação de R$10 na função rpc_update_lote_after_shot
SELECT 
    'Validação R$10' as teste,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'rpc_update_lote_after_shot'
            AND routine_definition LIKE '%10.00%'
        ) THEN '✅ Função contém validação de R$10'
        ELSE '❌ Função NÃO contém validação de R$10'
    END as resultado;

-- 5. Verificar busca de lotes < R$10 na função rpc_get_or_create_lote
SELECT 
    'Busca lotes < R$10' as teste,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'rpc_get_or_create_lote'
            AND (routine_definition LIKE '%< 10.00%' OR routine_definition LIKE '%<10.00%')
        ) THEN '✅ Função busca lotes com arrecadação < R$10'
        ELSE '❌ Função NÃO busca corretamente'
    END as resultado;

-- 6. Verificar inicialização de indice_vencedor = -1
SELECT 
    'Inicialização winnerIndex' as teste,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'rpc_get_or_create_lote'
            AND (routine_definition LIKE '%indice_vencedor = -1%' OR routine_definition LIKE '%indice_vencedor=-1%')
        ) THEN '✅ Função inicializa indice_vencedor com -1'
        ELSE '❌ Função NÃO inicializa corretamente'
    END as resultado;

-- 7. Resumo de colunas críticas na tabela lotes
SELECT 
    'Colunas críticas em lotes' as info,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes' AND column_name = 'total_arrecadado') THEN '✅ total_arrecadado' ELSE '❌ total_arrecadado' END as col1,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes' AND column_name = 'indice_vencedor') THEN '✅ indice_vencedor' ELSE '❌ indice_vencedor' END as col2,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes' AND column_name = 'premio_total') THEN '✅ premio_total' ELSE '❌ premio_total' END as col3,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes' AND column_name = 'posicao_atual') THEN '✅ posicao_atual' ELSE '❌ posicao_atual' END as col4;

-- =====================================================
-- RESUMO FINAL
-- =====================================================
SELECT 
    '✅ MISSÃO C - VALIDAÇÃO COMPLETA' as status,
    'Todas as estruturas necessárias foram verificadas' as mensagem;

-- =====================================================
-- FIM
-- =====================================================

