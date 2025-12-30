-- =====================================================
-- QUERY 13 ALTERNATIVA: Ver TODAS as Transações (sem filtro)
-- =====================================================
-- OBJETIVO: Mostrar TODAS as transações com validação de consistência
-- Use esta query para ver todas as transações e confirmar que estão corretas
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
ORDER BY t.created_at DESC;

