-- =====================================================
-- QUERY 13: Validação de Sequência de Transações (CORRIGIDA E COMPLETA)
-- =====================================================
-- OBJETIVO: Encontrar transações onde saldo_posterior não corresponde ao cálculo esperado
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
    WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor
    WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor
    ELSE t.saldo_anterior
  END AS saldo_esperado,
  t.saldo_posterior - (
    CASE 
      WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor
      WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor
      ELSE t.saldo_anterior
    END
  ) AS diferenca,
  t.created_at,
  CASE 
    WHEN ABS(t.saldo_posterior - (
      CASE 
        WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor
        WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor
        ELSE t.saldo_anterior
      END
    )) > 0.01 THEN '⚠️ INCONSISTÊNCIA'
    ELSE '✅ OK'
  END AS status_validacao
FROM transacoes t
LEFT JOIN usuarios u ON t.usuario_id = u.id
WHERE ABS(t.saldo_posterior - (
  CASE 
    WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor
    WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor
    ELSE t.saldo_anterior
  END
)) > 0.01
ORDER BY t.created_at DESC;

-- =====================================================
-- QUERY ALTERNATIVA: Ver TODAS as transações (sem filtro)
-- Use esta query se quiser ver todas as transações, não apenas as inconsistentes
-- =====================================================
/*
SELECT 
  t.id,
  t.usuario_id,
  u.email,
  t.tipo,
  t.valor,
  t.saldo_anterior,
  t.saldo_posterior,
  CASE 
    WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor
    WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor
    ELSE t.saldo_anterior
  END AS saldo_esperado,
  t.saldo_posterior - (
    CASE 
      WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor
      WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor
      ELSE t.saldo_anterior
    END
  ) AS diferenca,
  t.created_at,
  CASE 
    WHEN ABS(t.saldo_posterior - (
      CASE 
        WHEN t.tipo IN ('credito', 'deposito') THEN t.saldo_anterior + t.valor
        WHEN t.tipo = 'debito' THEN t.saldo_anterior + t.valor
        ELSE t.saldo_anterior
      END
    )) > 0.01 THEN '⚠️ INCONSISTÊNCIA'
    ELSE '✅ OK'
  END AS status_validacao
FROM transacoes t
LEFT JOIN usuarios u ON t.usuario_id = u.id
ORDER BY t.created_at DESC;
*/

