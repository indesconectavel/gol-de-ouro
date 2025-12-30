-- =====================================================
-- FASE 2.6 - ETAPA 3: AUDITORIA DE INTEGRIDADE FINANCEIRA
-- Ambiente: Supabase goldeouro-production
-- Data: 19/12/2025
-- Status: APENAS SELECT - NENHUMA ALTERAÇÃO
-- =====================================================
-- ⚠️ REGRA ABSOLUTA: Estas queries são APENAS para leitura
-- ⚠️ NENHUMA query DROP, TRUNCATE, DELETE ou UPDATE será executada
-- =====================================================

-- =====================================================
-- QUERY 1: Soma de Créditos vs Débitos
-- =====================================================
SELECT 
    'Créditos' AS tipo,
    SUM(valor) AS total,
    COUNT(*) AS quantidade
FROM transacoes
WHERE tipo IN ('deposito', 'premio', 'bonus', 'cashback', 'credito')
    AND status = 'concluida'
UNION ALL
SELECT 
    'Débitos' AS tipo,
    SUM(valor) AS total,
    COUNT(*) AS quantidade
FROM transacoes
WHERE tipo IN ('saque', 'aposta')
    AND status = 'concluida';

-- =====================================================
-- QUERY 2: Saldo Total dos Usuários
-- =====================================================
SELECT 
    COUNT(*) AS total_usuarios,
    SUM(saldo) AS saldo_total,
    AVG(saldo) AS saldo_medio,
    MIN(saldo) AS saldo_minimo,
    MAX(saldo) AS saldo_maximo,
    COUNT(*) FILTER (WHERE saldo < 0) AS usuarios_saldo_negativo,
    COUNT(*) FILTER (WHERE saldo = 0) AS usuarios_saldo_zero,
    COUNT(*) FILTER (WHERE saldo > 0) AS usuarios_saldo_positivo
FROM usuarios
WHERE ativo = true;

-- =====================================================
-- QUERY 3: PIX Criados vs PIX Utilizados
-- =====================================================
SELECT 
    'PIX Criados' AS categoria,
    COUNT(*) AS quantidade,
    SUM(amount) AS valor_total,
    COUNT(*) FILTER (WHERE status = 'pending') AS pendentes,
    COUNT(*) FILTER (WHERE status = 'approved' OR status = 'pago') AS aprovados,
    COUNT(*) FILTER (WHERE status = 'rejected') AS rejeitados,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelados,
    COUNT(*) FILTER (WHERE status = 'expired') AS expirados
FROM pagamentos_pix;

-- =====================================================
-- QUERY 4: PIX Pendentes (Possível Problema)
-- =====================================================
SELECT 
    id,
    usuario_id,
    amount,
    status,
    created_at,
    expires_at,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRADO'
        ELSE 'VÁLIDO'
    END AS status_expiracao
FROM pagamentos_pix
WHERE status = 'pending'
ORDER BY created_at DESC;

-- =====================================================
-- QUERY 5: Saldos Negativos (Anomalia)
-- =====================================================
SELECT 
    id,
    email,
    username,
    saldo,
    created_at
FROM usuarios
WHERE saldo < 0
ORDER BY saldo ASC;

-- =====================================================
-- QUERY 6: Transações sem Correspondência em Pagamentos
-- =====================================================
SELECT 
    t.id,
    t.usuario_id,
    t.tipo,
    t.valor,
    t.status,
    t.created_at
FROM transacoes t
LEFT JOIN pagamentos_pix p ON t.referencia_id::text = p.payment_id::text
WHERE t.tipo = 'deposito'
    AND p.id IS NULL
ORDER BY t.created_at DESC;

-- =====================================================
-- QUERY 7: Pagamentos sem Correspondência em Transações
-- =====================================================
SELECT 
    p.id,
    p.usuario_id,
    p.amount,
    p.status,
    p.payment_id,
    p.created_at
FROM pagamentos_pix p
LEFT JOIN transacoes t ON t.referencia_id::text = p.payment_id::text
WHERE t.id IS NULL
ORDER BY p.created_at DESC;

-- =====================================================
-- QUERY 8: Resumo Financeiro por Usuário
-- =====================================================
SELECT 
    u.id,
    u.email,
    u.saldo AS saldo_atual,
    COALESCE(SUM(CASE WHEN t.tipo IN ('deposito', 'premio', 'bonus', 'cashback', 'credito') THEN t.valor ELSE 0 END), 0) AS total_creditos,
    COALESCE(SUM(CASE WHEN t.tipo IN ('saque', 'aposta') THEN t.valor ELSE 0 END), 0) AS total_debitos,
    COALESCE(SUM(CASE WHEN t.tipo IN ('deposito', 'premio', 'bonus', 'cashback', 'credito') THEN t.valor ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN t.tipo IN ('saque', 'aposta') THEN t.valor ELSE 0 END), 0) AS saldo_calculado,
    u.saldo - (
        COALESCE(SUM(CASE WHEN t.tipo IN ('deposito', 'premio', 'bonus', 'cashback', 'credito') THEN t.valor ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN t.tipo IN ('saque', 'aposta') THEN t.valor ELSE 0 END), 0)
    ) AS diferenca
FROM usuarios u
LEFT JOIN transacoes t ON t.usuario_id = u.id AND t.status = 'concluida'
WHERE u.ativo = true
GROUP BY u.id, u.email, u.saldo
HAVING ABS(u.saldo - (
    COALESCE(SUM(CASE WHEN t.tipo IN ('deposito', 'premio', 'bonus', 'cashback', 'credito') THEN t.valor ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN t.tipo IN ('saque', 'aposta') THEN t.valor ELSE 0 END), 0)
)) > 0.01
ORDER BY ABS(diferenca) DESC
LIMIT 20;

-- =====================================================
-- QUERY 9: Saques Pendentes
-- =====================================================
SELECT 
    id,
    usuario_id,
    amount,
    status,
    created_at
FROM saques
WHERE status = 'pendente'
ORDER BY created_at DESC;

-- =====================================================
-- QUERY 10: Resumo Geral de Integridade
-- =====================================================
SELECT 
    'Total de Usuários Ativos' AS metrica,
    COUNT(*)::text AS valor
FROM usuarios
WHERE ativo = true
UNION ALL
SELECT 
    'Usuários com Saldo Negativo' AS metrica,
    COUNT(*)::text AS valor
FROM usuarios
WHERE saldo < 0 AND ativo = true
UNION ALL
SELECT 
    'Total de Transações Concluídas' AS metrica,
    COUNT(*)::text AS valor
FROM transacoes
WHERE status = 'concluida'
UNION ALL
SELECT 
    'Total de PIX Criados' AS metrica,
    COUNT(*)::text AS valor
FROM pagamentos_pix
UNION ALL
SELECT 
    'PIX Pendentes' AS metrica,
    COUNT(*)::text AS valor
FROM pagamentos_pix
WHERE status = 'pending'
UNION ALL
SELECT 
    'PIX Aprovados' AS metrica,
    COUNT(*)::text AS valor
FROM pagamentos_pix
WHERE status IN ('approved', 'pago')
UNION ALL
SELECT 
    'Saques Pendentes' AS metrica,
    COUNT(*)::text AS valor
FROM saques
WHERE status = 'pendente'
UNION ALL
SELECT 
    'Saldo Total dos Usuários' AS metrica,
    SUM(saldo)::text AS valor
FROM usuarios
WHERE ativo = true;

-- =====================================================
-- FIM DAS QUERIES DE INTEGRIDADE FINANCEIRA
-- =====================================================

