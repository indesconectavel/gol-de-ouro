-- =====================================================
-- AUDITORIA COMPLETA DO SISTEMA FINANCEIRO
-- FASE 3 - GO-LIVE CONTROLADO
-- Data: 19/12/2025
-- =====================================================
-- ⚠️ ATENÇÃO: Este arquivo contém APENAS queries SELECT
-- NÃO execute UPDATE, DELETE ou ALTER
-- =====================================================

-- =====================================================
-- QUERY 0: Detecção de Schema Real
-- =====================================================
-- Objetivo: Detectar nomes de colunas reais antes de executar outras queries
SELECT 
  'usuarios' AS tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios'
ORDER BY ordinal_position;

SELECT 
  'transacoes' AS tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transacoes'
ORDER BY ordinal_position;

SELECT 
  'pagamentos_pix' AS tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pagamentos_pix'
ORDER BY ordinal_position;

SELECT 
  'saques' AS tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'saques'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 1: Validação de Saldos de Usuários
-- =====================================================
-- Objetivo: Identificar saldos negativos ou valores suspeitosamente altos
-- Nota: Usa username como nome do usuário (schema real)
SELECT 
  id,
  email,
  username AS nome_usuario,
  saldo,
  created_at,
  updated_at,
  CASE 
    WHEN saldo < 0 THEN '⚠️ SALDO NEGATIVO'
    WHEN saldo > 10000 THEN '⚠️ SALDO ALTO'
    ELSE '✅ OK'
  END AS status_saldo
FROM usuarios
ORDER BY saldo DESC;

-- =====================================================
-- QUERY 2: Consistência de Transações
-- =====================================================
-- Objetivo: Identificar inconsistências entre saldo atual e saldo calculado
SELECT 
  u.id AS usuario_id,
  u.email,
  u.username AS nome_usuario,
  u.saldo AS saldo_atual,
  COALESCE(SUM(CASE WHEN t.tipo = 'credito' THEN t.valor ELSE 0 END), 0) AS total_creditos,
  COALESCE(SUM(CASE WHEN t.tipo = 'debito' THEN t.valor ELSE 0 END), 0) AS total_debitos,
  COALESCE(SUM(CASE WHEN t.tipo = 'credito' THEN t.valor ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN t.tipo = 'debito' THEN t.valor ELSE 0 END), 0) AS saldo_calculado,
  u.saldo - (
    COALESCE(SUM(CASE WHEN t.tipo = 'credito' THEN t.valor ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN t.tipo = 'debito' THEN t.valor ELSE 0 END), 0)
  ) AS diferenca_saldo
FROM usuarios u
LEFT JOIN transacoes t ON u.id = t.usuario_id
GROUP BY u.id, u.email, u.username, u.saldo
HAVING ABS(u.saldo - (
  COALESCE(SUM(CASE WHEN t.tipo = 'credito' THEN t.valor ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN t.tipo = 'debito' THEN t.valor ELSE 0 END), 0)
)) > 0.01
ORDER BY ABS(u.saldo - (
  COALESCE(SUM(CASE WHEN t.tipo = 'credito' THEN t.valor ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN t.tipo = 'debito' THEN t.valor ELSE 0 END), 0)
)) DESC;

-- =====================================================
-- QUERY 3: Integridade de Pagamentos PIX
-- =====================================================
-- Objetivo: Identificar PIX aprovados sem transação correspondente
-- Nota: Usa username como nome do usuário (schema real) (valor/amount)
SELECT 
  pp.id,
  pp.usuario_id,
  u.email,
  u.username AS nome_usuario,
  COALESCE(pp.valor, pp.amount) AS valor,
  pp.status,
  COALESCE(pp.payment_id, pp.external_id) AS payment_id,
  pp.created_at,
  pp.updated_at,
  CASE 
    WHEN pp.status = 'approved' AND NOT EXISTS (
      SELECT 1 FROM transacoes t 
      WHERE t.usuario_id = pp.usuario_id 
      AND t.tipo = 'credito' 
      AND t.valor = COALESCE(pp.valor, pp.amount)
      AND t.created_at >= pp.created_at
      AND ABS(EXTRACT(EPOCH FROM (t.created_at - pp.created_at))) < 60
    ) THEN '⚠️ PIX APROVADO SEM TRANSAÇÃO'
    WHEN pp.status = 'pending' AND pp.created_at < NOW() - INTERVAL '24 hours' THEN '⚠️ PIX PENDENTE HÁ MAIS DE 24H'
    ELSE '✅ OK'
  END AS status_validacao
FROM pagamentos_pix pp
LEFT JOIN usuarios u ON pp.usuario_id = u.id
ORDER BY pp.created_at DESC;

-- =====================================================
-- QUERY 4: Validação de Saques
-- =====================================================
-- Objetivo: Identificar saques completos sem transação correspondente
-- Nota: Schema real usa pix_key e pix_type (não chave_pix ou tipo_chave_pix)
SELECT 
  s.id,
  s.usuario_id,
  u.email,
  u.username AS nome_usuario,
  COALESCE(s.valor, s.amount) AS valor,
  s.status,
  s.pix_key AS chave_pix,
  s.pix_type AS tipo_chave_pix,
  s.created_at,
  s.updated_at,
  CASE 
    WHEN s.status = 'completed' AND NOT EXISTS (
      SELECT 1 FROM transacoes t 
      WHERE t.usuario_id = s.usuario_id 
      AND t.tipo = 'debito' 
      AND t.valor = COALESCE(s.valor, s.amount)
      AND t.created_at >= s.created_at
      AND ABS(EXTRACT(EPOCH FROM (t.created_at - s.created_at))) < 60
    ) THEN '⚠️ SAQUE COMPLETO SEM TRANSAÇÃO'
    WHEN s.status = 'pending' AND s.created_at < NOW() - INTERVAL '7 days' THEN '⚠️ SAQUE PENDENTE HÁ MAIS DE 7 DIAS'
    WHEN COALESCE(s.valor, s.amount) > u.saldo THEN '⚠️ SAQUE MAIOR QUE SALDO'
    ELSE '✅ OK'
  END AS status_validacao
FROM saques s
LEFT JOIN usuarios u ON s.usuario_id = u.id
ORDER BY s.created_at DESC;

-- =====================================================
-- QUERY 5: Transações Órfãs
-- =====================================================
-- Objetivo: Identificar transações sem usuário válido
SELECT 
  t.id,
  t.usuario_id,
  t.tipo,
  t.valor,
  t.saldo_anterior,
  t.saldo_posterior,
  t.created_at,
  CASE 
    WHEN u.id IS NULL THEN '⚠️ USUÁRIO NÃO EXISTE'
    ELSE '✅ OK'
  END AS status_validacao
FROM transacoes t
LEFT JOIN usuarios u ON t.usuario_id = u.id
WHERE u.id IS NULL
ORDER BY t.created_at DESC;

-- =====================================================
-- QUERY 6: Pagamentos PIX Órfãos
-- =====================================================
-- Objetivo: Identificar pagamentos PIX sem usuário válido
SELECT 
  pp.id,
  pp.usuario_id,
  pp.valor,
  pp.status,
  pp.created_at,
  CASE 
    WHEN u.id IS NULL THEN '⚠️ USUÁRIO NÃO EXISTE'
    ELSE '✅ OK'
  END AS status_validacao
FROM pagamentos_pix pp
LEFT JOIN usuarios u ON pp.usuario_id = u.id
WHERE u.id IS NULL
ORDER BY pp.created_at DESC;

-- =====================================================
-- QUERY 7: Saques Órfãos
-- =====================================================
-- Objetivo: Identificar saques sem usuário válido
SELECT 
  s.id,
  s.usuario_id,
  s.valor,
  s.status,
  s.created_at,
  CASE 
    WHEN u.id IS NULL THEN '⚠️ USUÁRIO NÃO EXISTE'
    ELSE '✅ OK'
  END AS status_validacao
FROM saques s
LEFT JOIN usuarios u ON s.usuario_id = u.id
WHERE u.id IS NULL
ORDER BY s.created_at DESC;

-- =====================================================
-- QUERY 8: Validação de Valores
-- =====================================================
-- Objetivo: Identificar valores suspeitos em todas as tabelas financeiras
-- Nota: Usa username como nome do usuário (schema real) (valor/amount)
SELECT 
  'transacoes' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN valor < 0 THEN 1 END) AS valores_negativos,
  COUNT(CASE WHEN valor = 0 THEN 1 END) AS valores_zero,
  COUNT(CASE WHEN valor > 10000 THEN 1 END) AS valores_muito_altos,
  MIN(valor) AS valor_minimo,
  MAX(valor) AS valor_maximo,
  AVG(valor) AS valor_medio
FROM transacoes
UNION ALL
SELECT 
  'pagamentos_pix' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN COALESCE(valor, amount) < 0 THEN 1 END) AS valores_negativos,
  COUNT(CASE WHEN COALESCE(valor, amount) = 0 THEN 1 END) AS valores_zero,
  COUNT(CASE WHEN COALESCE(valor, amount) > 10000 THEN 1 END) AS valores_muito_altos,
  MIN(COALESCE(valor, amount)) AS valor_minimo,
  MAX(COALESCE(valor, amount)) AS valor_maximo,
  AVG(COALESCE(valor, amount)) AS valor_medio
FROM pagamentos_pix
UNION ALL
SELECT 
  'saques' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN COALESCE(valor, amount) < 0 THEN 1 END) AS valores_negativos,
  COUNT(CASE WHEN COALESCE(valor, amount) = 0 THEN 1 END) AS valores_zero,
  COUNT(CASE WHEN COALESCE(valor, amount) > 10000 THEN 1 END) AS valores_muito_altos,
  MIN(COALESCE(valor, amount)) AS valor_minimo,
  MAX(COALESCE(valor, amount)) AS valor_maximo,
  AVG(COALESCE(valor, amount)) AS valor_medio
FROM saques;

-- =====================================================
-- QUERY 9: Duplicação de Transações
-- =====================================================
-- Objetivo: Identificar possíveis transações duplicadas
SELECT 
  usuario_id,
  tipo,
  valor,
  COUNT(*) AS quantidade,
  STRING_AGG(id::text, ', ') AS ids,
  MIN(created_at) AS primeira_ocorrencia,
  MAX(created_at) AS ultima_ocorrencia
FROM transacoes
GROUP BY usuario_id, tipo, valor, DATE_TRUNC('minute', created_at)
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- =====================================================
-- QUERY 10: Duplicação de Pagamentos PIX
-- =====================================================
-- Objetivo: Identificar possíveis pagamentos PIX duplicados
-- Nota: Usa username como nome do usuário (schema real) (valor/amount)
SELECT 
  usuario_id,
  COALESCE(valor, amount) AS valor,
  status,
  COUNT(*) AS quantidade,
  STRING_AGG(id::text, ', ') AS ids,
  MIN(created_at) AS primeira_ocorrencia,
  MAX(created_at) AS ultima_ocorrencia
FROM pagamentos_pix
GROUP BY usuario_id, COALESCE(valor, amount), status, DATE_TRUNC('minute', created_at)
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- =====================================================
-- QUERY 11: Duplicação de Saques
-- =====================================================
-- Objetivo: Identificar possíveis saques duplicados
-- Nota: Usa username como nome do usuário (schema real) (valor/amount)
SELECT 
  usuario_id,
  COALESCE(valor, amount) AS valor,
  status,
  COUNT(*) AS quantidade,
  STRING_AGG(id::text, ', ') AS ids,
  MIN(created_at) AS primeira_ocorrencia,
  MAX(created_at) AS ultima_ocorrencia
FROM saques
GROUP BY usuario_id, COALESCE(valor, amount), status, DATE_TRUNC('minute', created_at)
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- =====================================================
-- QUERY 12: Resumo Financeiro Geral
-- =====================================================
-- Objetivo: Obter visão geral do sistema financeiro
SELECT 
  'RESUMO FINANCEIRO GERAL' AS categoria,
  COUNT(DISTINCT u.id) AS total_usuarios,
  COUNT(DISTINCT CASE WHEN u.saldo > 0 THEN u.id END) AS usuarios_com_saldo,
  SUM(u.saldo) AS saldo_total_sistema,
  COUNT(DISTINCT t.id) AS total_transacoes,
  COUNT(DISTINCT CASE WHEN t.tipo = 'credito' THEN t.id END) AS total_creditos,
  COUNT(DISTINCT CASE WHEN t.tipo = 'debito' THEN t.id END) AS total_debitos,
  SUM(CASE WHEN t.tipo = 'credito' THEN t.valor ELSE 0 END) AS valor_total_creditos,
  SUM(CASE WHEN t.tipo = 'debito' THEN t.valor ELSE 0 END) AS valor_total_debitos,
  COUNT(DISTINCT pp.id) AS total_pagamentos_pix,
  COUNT(DISTINCT CASE WHEN pp.status = 'approved' THEN pp.id END) AS pix_aprovados,
  COUNT(DISTINCT CASE WHEN pp.status = 'pending' THEN pp.id END) AS pix_pendentes,
  SUM(CASE WHEN pp.status = 'approved' THEN COALESCE(pp.valor, pp.amount) ELSE 0 END) AS valor_pix_aprovados,
  SUM(CASE WHEN pp.status = 'pending' THEN COALESCE(pp.valor, pp.amount) ELSE 0 END) AS valor_pix_pendentes,
  COUNT(DISTINCT s.id) AS total_saques,
  COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS saques_completos,
  COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) AS saques_pendentes,
  SUM(CASE WHEN s.status = 'completed' THEN COALESCE(s.valor, s.amount) ELSE 0 END) AS valor_saques_completos,
  SUM(CASE WHEN s.status = 'pending' THEN COALESCE(s.valor, s.amount) ELSE 0 END) AS valor_saques_pendentes
FROM usuarios u
LEFT JOIN transacoes t ON u.id = t.usuario_id
LEFT JOIN pagamentos_pix pp ON u.id = pp.usuario_id
LEFT JOIN saques s ON u.id = s.usuario_id;

-- =====================================================
-- QUERY 13: Validação de Sequência de Transações
-- =====================================================
-- Objetivo: Validar se saldo_posterior = saldo_anterior + valor (para créditos) ou - valor (para débitos)
SELECT 
  t.id,
  t.usuario_id,
  u.email,
  t.tipo,
  t.valor,
  t.saldo_anterior,
  t.saldo_posterior,
  CASE 
    WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor  -- CORRIGIDO: deposito também é crédito
    WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor  -- CORRIGIDO: valor já é negativo, então somar
    ELSE t.saldo_anterior
  END AS saldo_esperado,
  t.saldo_posterior - (
    CASE 
      WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor  -- CORRIGIDO: deposito também é crédito
      WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor  -- CORRIGIDO: valor já é negativo, então somar
      ELSE t.saldo_anterior
    END
  ) AS diferenca,
  t.created_at,
  CASE 
    WHEN ABS(t.saldo_posterior - (
      CASE 
        WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor  -- CORRIGIDO: deposito também é crédito
        WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor  -- CORRIGIDO: valor já é negativo, então somar
        ELSE t.saldo_anterior
      END
    )) > 0.01 THEN '⚠️ INCONSISTÊNCIA'
    ELSE '✅ OK'
  END AS status_validacao
FROM transacoes t
LEFT JOIN usuarios u ON t.usuario_id = u.id
WHERE ABS(t.saldo_posterior - (
  CASE 
    WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor  -- CORRIGIDO: deposito também é crédito
    WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor  -- CORRIGIDO: valor já é negativo, então somar
    ELSE t.saldo_anterior
  END
)) > 0.01
ORDER BY t.created_at DESC;

-- =====================================================
-- QUERY 14: Validação de Valores Mínimos e Máximos
-- =====================================================
-- Objetivo: Validar se valores estão dentro dos limites esperados
-- Nota: Usa username como nome do usuário (schema real) (valor/amount)
SELECT 
  'pagamentos_pix' AS tabela,
  COUNT(*) AS total,
  COUNT(CASE WHEN COALESCE(valor, amount) < 1 THEN 1 END) AS abaixo_minimo,
  COUNT(CASE WHEN COALESCE(valor, amount) > 50 THEN 1 END) AS acima_maximo,
  COUNT(CASE WHEN COALESCE(valor, amount) >= 1 AND COALESCE(valor, amount) <= 50 THEN 1 END) AS dentro_limites
FROM pagamentos_pix
UNION ALL
SELECT 
  'saques' AS tabela,
  COUNT(*) AS total,
  COUNT(CASE WHEN COALESCE(valor, amount) < 10 THEN 1 END) AS abaixo_minimo,
  COUNT(CASE WHEN COALESCE(valor, amount) > 1000 THEN 1 END) AS acima_maximo,
  COUNT(CASE WHEN COALESCE(valor, amount) >= 10 AND COALESCE(valor, amount) <= 1000 THEN 1 END) AS dentro_limites
FROM saques;

-- =====================================================
-- QUERY 15: Análise Temporal de Transações
-- =====================================================
-- Objetivo: Analisar padrões temporais de transações
SELECT 
  DATE_TRUNC('day', created_at) AS data,
  tipo,
  COUNT(*) AS quantidade,
  SUM(valor) AS valor_total,
  AVG(valor) AS valor_medio,
  MIN(valor) AS valor_minimo,
  MAX(valor) AS valor_maximo
FROM transacoes
GROUP BY DATE_TRUNC('day', created_at), tipo
ORDER BY data DESC, tipo;

-- =====================================================
-- FIM DAS QUERIES DE AUDITORIA
-- =====================================================

