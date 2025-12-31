-- EXPORTAÇÃO DE DADOS CRÍTICOS - BACKUP EXECUTIVO MISSÃO C
-- Data: 2025-12-31
-- Aviso: Este script exporta apenas dados críticos para backup
-- NÃO inclui dados sensíveis ou temporários

-- =====================================================
-- 1. USUÁRIOS (dados essenciais)
-- =====================================================
COPY (
    SELECT 
        id,
        email,
        username,
        saldo,
        tipo,
        ativo,
        email_verificado,
        total_apostas,
        total_ganhos,
        created_at,
        updated_at
    FROM public.usuarios
    WHERE ativo = true
    ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER;

-- =====================================================
-- 2. LOTES ATIVOS E RECENTES
-- =====================================================
COPY (
    SELECT 
        id,
        valor_aposta,
        tamanho,
        posicao_atual,
        indice_vencedor,
        status,
        total_arrecadado,
        premio_total,
        created_at,
        updated_at
    FROM public.lotes
    WHERE status = 'ativo' OR (status = 'finalizado' AND updated_at > NOW() - INTERVAL '30 days')
    ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER;

-- =====================================================
-- 3. CHUTES RECENTES (últimos 30 dias)
-- =====================================================
COPY (
    SELECT 
        id,
        lote_id,
        usuario_id,
        direction,
        amount,
        result,
        premio,
        premio_gol_de_ouro,
        is_gol_de_ouro,
        shot_index,
        timestamp
    FROM public.chutes
    WHERE timestamp > NOW() - INTERVAL '30 days'
    ORDER BY timestamp DESC
    LIMIT 10000
) TO STDOUT WITH CSV HEADER;

-- =====================================================
-- 4. TRANSAÇÕES CRÍTICAS (últimos 30 dias)
-- =====================================================
COPY (
    SELECT 
        id,
        usuario_id,
        tipo,
        valor,
        saldo_anterior,
        saldo_posterior,
        descricao,
        referencia_id,
        referencia_tipo,
        status,
        processed_at,
        created_at
    FROM public.transacoes
    WHERE created_at > NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 5000
) TO STDOUT WITH CSV HEADER;

-- =====================================================
-- 5. PAGAMENTOS PIX PENDENTES E APROVADOS
-- =====================================================
COPY (
    SELECT 
        id,
        usuario_id,
        external_id,
        amount,
        status,
        created_at,
        updated_at
    FROM public.pagamentos_pix
    WHERE status IN ('pending', 'approved')
    ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER;

-- =====================================================
-- 6. SAQUES PENDENTES E APROVADOS
-- =====================================================
COPY (
    SELECT 
        id,
        usuario_id,
        valor,
        valor_liquido,
        taxa,
        chave_pix,
        tipo_chave,
        status,
        created_at,
        updated_at
    FROM public.saques
    WHERE status IN ('pendente', 'processando', 'aprovado')
    ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER;

-- =====================================================
-- 7. MÉTRICAS GLOBAIS
-- =====================================================
COPY (
    SELECT 
        id,
        contador_chutes_global,
        ultimo_gol_de_ouro,
        total_usuarios,
        total_jogos,
        total_receita,
        created_at,
        updated_at
    FROM public.metricas_globais
    ORDER BY updated_at DESC
    LIMIT 1
) TO STDOUT WITH CSV HEADER;

