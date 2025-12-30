-- =====================================================
-- QUERIES CORRIGIDAS - VERSÃO 2
-- Ambiente: Supabase goldeouro-production
-- Data: 19/12/2025
-- Status: CORRIGIDAS PARA ESTRUTURA REAL DE PRODUÇÃO
-- =====================================================
-- ⚠️ CORREÇÕES APLICADAS:
-- - Removida coluna posicao_atual (não existe)
-- - Removidas colunas total_arrecadado e premio_total (podem não existir)
-- - Usando apenas colunas confirmadas: chutes_coletados, ganhador_id, finished_at
-- =====================================================

-- =====================================================
-- QUERY CORRIGIDA 4.1: Lotes Ativos (VERSÃO SEGURA)
-- =====================================================
SELECT
    id,
    valor_aposta,
    status,
    tamanho,
    chutes_coletados,
    ganhador_id,
    created_at,
    updated_at,
    finished_at,
    completed_at
FROM lotes
WHERE status = 'ativo'
ORDER BY created_at DESC;

-- =====================================================
-- QUERY ALTERNATIVA: Verificar quais colunas realmente existem
-- =====================================================
-- Execute esta query PRIMEIRO para ver todas as colunas disponíveis
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'lotes'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY ADAPTABLE: Lotes ativos (usa apenas colunas básicas)
-- =====================================================
-- Esta versão usa apenas colunas que CERTAMENTE existem
SELECT
    id,
    valor_aposta,
    status,
    tamanho,
    created_at
FROM lotes
WHERE status = 'ativo'
ORDER BY created_at DESC;

