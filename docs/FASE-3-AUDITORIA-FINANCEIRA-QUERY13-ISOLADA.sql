-- =====================================================
-- QUERY 13: Validação de Sequência de Transações (CORRIGIDA)
-- =====================================================
-- Objetivo: Validar se saldo_posterior = saldo_anterior + valor (para créditos/depósitos) ou saldo_anterior + valor (para débitos, onde valor já é negativo)
-- 
-- CORREÇÕES APLICADAS:
-- 1. Incluído 'deposito' como tipo de crédito
-- 2. Débitos usam soma porque valor já é negativo no banco
-- =====================================================

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

