-- =====================================================
-- FASE 3 - GATE 2: VALIDAÇÃO DO BANCO DE DADOS
-- Ambiente: Supabase goldeouro-production
-- Data: 19/12/2025
-- Status: APENAS SELECT - NENHUMA ALTERAÇÃO
-- =====================================================
-- ⚠️ REGRA ABSOLUTA: Estas queries são APENAS para leitura
-- ⚠️ NENHUMA query DROP, TRUNCATE, DELETE ou UPDATE será executada
-- =====================================================

-- =====================================================
-- QUERY 1: Validar Existência e Schema da Tabela usuarios
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 2: Validar Existência e Schema da Tabela transacoes
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'transacoes'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 3: Validar Existência e Schema da Tabela pagamentos_pix
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'pagamentos_pix'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 4: Validar Existência e Schema da Tabela saques
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'saques'
ORDER BY ordinal_position;

-- =====================================================
-- QUERY 5: Validar Colunas Esperadas em usuarios
-- =====================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios' 
            AND column_name = 'id'
        ) THEN '✅ id existe'
        ELSE '❌ id NÃO existe'
    END AS validacao_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios' 
            AND column_name = 'email'
        ) THEN '✅ email existe'
        ELSE '❌ email NÃO existe'
    END AS validacao_email,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios' 
            AND column_name = 'saldo'
        ) THEN '✅ saldo existe'
        ELSE '❌ saldo NÃO existe'
    END AS validacao_saldo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios' 
            AND column_name = 'ativo'
        ) THEN '✅ ativo existe'
        ELSE '❌ ativo NÃO existe'
    END AS validacao_ativo;

-- =====================================================
-- QUERY 6: Validar Colunas Esperadas em transacoes
-- =====================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transacoes' 
            AND column_name = 'id'
        ) THEN '✅ id existe'
        ELSE '❌ id NÃO existe'
    END AS validacao_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transacoes' 
            AND column_name = 'usuario_id'
        ) THEN '✅ usuario_id existe'
        ELSE '❌ usuario_id NÃO existe'
    END AS validacao_usuario_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transacoes' 
            AND column_name = 'tipo'
        ) THEN '✅ tipo existe'
        ELSE '❌ tipo NÃO existe'
    END AS validacao_tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transacoes' 
            AND column_name = 'valor'
        ) THEN '✅ valor existe'
        ELSE '❌ valor NÃO existe'
    END AS validacao_valor,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transacoes' 
            AND column_name = 'status'
        ) THEN '✅ status existe'
        ELSE '❌ status NÃO existe'
    END AS validacao_status;

-- =====================================================
-- QUERY 7: Validar Colunas Esperadas em pagamentos_pix
-- =====================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pagamentos_pix' 
            AND column_name = 'id'
        ) THEN '✅ id existe'
        ELSE '❌ id NÃO existe'
    END AS validacao_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pagamentos_pix' 
            AND column_name = 'usuario_id'
        ) THEN '✅ usuario_id existe'
        ELSE '❌ usuario_id NÃO existe'
    END AS validacao_usuario_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pagamentos_pix' 
            AND column_name = 'payment_id'
        ) THEN '✅ payment_id existe'
        ELSE '❌ payment_id NÃO existe'
    END AS validacao_payment_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pagamentos_pix' 
            AND column_name = 'amount'
        ) THEN '✅ amount existe'
        ELSE '❌ amount NÃO existe'
    END AS validacao_amount,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pagamentos_pix' 
            AND column_name = 'status'
        ) THEN '✅ status existe'
        ELSE '❌ status NÃO existe'
    END AS validacao_status;

-- =====================================================
-- QUERY 8: Validar Colunas Esperadas em saques
-- =====================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'saques' 
            AND column_name = 'id'
        ) THEN '✅ id existe'
        ELSE '❌ id NÃO existe'
    END AS validacao_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'saques' 
            AND column_name = 'usuario_id'
        ) THEN '✅ usuario_id existe'
        ELSE '❌ usuario_id NÃO existe'
    END AS validacao_usuario_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'saques' 
            AND column_name = 'amount'
        ) THEN '✅ amount existe'
        ELSE '❌ amount NÃO existe'
    END AS validacao_amount,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'saques' 
            AND column_name = 'status'
        ) THEN '✅ status existe'
        ELSE '❌ status NÃO existe'
    END AS validacao_status;

-- =====================================================
-- QUERY 9: Validar Tipos de Dados Coerentes
-- =====================================================
SELECT 
    'usuarios.saldo' AS coluna,
    data_type AS tipo_atual,
    CASE 
        WHEN data_type IN ('numeric', 'decimal', 'double precision', 'real') THEN '✅ Tipo numérico correto'
        ELSE '⚠️ Tipo pode não ser adequado para valores monetários'
    END AS validacao
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'usuarios'
    AND column_name = 'saldo'
UNION ALL
SELECT 
    'transacoes.valor' AS coluna,
    data_type AS tipo_atual,
    CASE 
        WHEN data_type IN ('numeric', 'decimal', 'double precision', 'real') THEN '✅ Tipo numérico correto'
        ELSE '⚠️ Tipo pode não ser adequado para valores monetários'
    END AS validacao
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'transacoes'
    AND column_name = 'valor'
UNION ALL
SELECT 
    'pagamentos_pix.amount' AS coluna,
    data_type AS tipo_atual,
    CASE 
        WHEN data_type IN ('numeric', 'decimal', 'double precision', 'real') THEN '✅ Tipo numérico correto'
        ELSE '⚠️ Tipo pode não ser adequado para valores monetários'
    END AS validacao
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'pagamentos_pix'
    AND column_name = 'amount';

-- =====================================================
-- QUERY 10: Validar Tabelas Críticas Não Vazias (sem explicação)
-- =====================================================
SELECT 
    'usuarios' AS tabela,
    COUNT(*) AS total_registros,
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ Tabela vazia - investigar'
        ELSE '✅ Tabela contém dados'
    END AS validacao
FROM usuarios
UNION ALL
SELECT 
    'transacoes' AS tabela,
    COUNT(*) AS total_registros,
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ Tabela vazia - pode ser normal se sistema novo'
        ELSE '✅ Tabela contém dados'
    END AS validacao
FROM transacoes
UNION ALL
SELECT 
    'pagamentos_pix' AS tabela,
    COUNT(*) AS total_registros,
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ Tabela vazia - pode ser normal se sistema novo'
        ELSE '✅ Tabela contém dados'
    END AS validacao
FROM pagamentos_pix
UNION ALL
SELECT 
    'saques' AS tabela,
    COUNT(*) AS total_registros,
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ Tabela vazia - pode ser normal se sistema novo'
        ELSE '✅ Tabela contém dados'
    END AS validacao
FROM saques;

-- =====================================================
-- QUERY 11: Validar Integridade - Usuários com Saldo Negativo
-- =====================================================
SELECT 
    COUNT(*) AS usuarios_saldo_negativo,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nenhum saldo negativo'
        WHEN COUNT(*) <= 5 THEN '⚠️ Poucos saldos negativos - investigar'
        ELSE '❌ Muitos saldos negativos - PROBLEMA CRÍTICO'
    END AS validacao
FROM usuarios
WHERE saldo < 0
    AND ativo = true;

-- =====================================================
-- QUERY 12: Validar Integridade - PIX sem Vínculo com Transação
-- =====================================================
SELECT 
    COUNT(*) AS pix_sem_transacao,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todos os PIX têm transação'
        WHEN COUNT(*) <= 10 THEN '⚠️ Alguns PIX sem transação - pode ser normal'
        ELSE '❌ Muitos PIX sem transação - PROBLEMA CRÍTICO'
    END AS validacao
FROM pagamentos_pix p
LEFT JOIN transacoes t ON t.referencia_id::text = p.payment_id::text
WHERE t.id IS NULL
    AND p.status IN ('approved', 'pago');

-- =====================================================
-- QUERY 13: Validar Integridade - Transações Órfãs (sem usuário)
-- =====================================================
SELECT 
    COUNT(*) AS transacoes_orfas,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nenhuma transação órfã'
        ELSE '❌ Transações órfãs encontradas - PROBLEMA CRÍTICO'
    END AS validacao
FROM transacoes t
LEFT JOIN usuarios u ON t.usuario_id = u.id
WHERE u.id IS NULL;

-- =====================================================
-- QUERY 14: Validar Integridade - PIX sem Usuário
-- =====================================================
SELECT 
    COUNT(*) AS pix_sem_usuario,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nenhum PIX sem usuário'
        ELSE '❌ PIX sem usuário encontrados - PROBLEMA CRÍTICO'
    END AS validacao
FROM pagamentos_pix p
LEFT JOIN usuarios u ON p.usuario_id = u.id
WHERE u.id IS NULL;

-- =====================================================
-- QUERY 15: Validar Integridade - Saques sem Usuário
-- =====================================================
SELECT 
    COUNT(*) AS saques_sem_usuario,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nenhum saque sem usuário'
        ELSE '❌ Saques sem usuário encontrados - PROBLEMA CRÍTICO'
    END AS validacao
FROM saques s
LEFT JOIN usuarios u ON s.usuario_id = u.id
WHERE u.id IS NULL;

-- =====================================================
-- QUERY 16: Resumo Geral de Integridade
-- =====================================================
SELECT 
    'Total de Usuários Ativos' AS metrica,
    COUNT(*)::text AS valor,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK'
        ELSE '⚠️ Nenhum usuário ativo'
    END AS status
FROM usuarios
WHERE ativo = true
UNION ALL
SELECT 
    'Usuários com Saldo Negativo' AS metrica,
    COUNT(*)::text AS valor,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '⚠️ Investigar'
    END AS status
FROM usuarios
WHERE saldo < 0 AND ativo = true
UNION ALL
SELECT 
    'Total de Transações' AS metrica,
    COUNT(*)::text AS valor,
    '✅ OK' AS status
FROM transacoes
UNION ALL
SELECT 
    'Transações Órfãs' AS metrica,
    COUNT(*)::text AS valor,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END AS status
FROM transacoes t
LEFT JOIN usuarios u ON t.usuario_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Total de PIX' AS metrica,
    COUNT(*)::text AS valor,
    '✅ OK' AS status
FROM pagamentos_pix
UNION ALL
SELECT 
    'PIX sem Usuário' AS metrica,
    COUNT(*)::text AS valor,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END AS status
FROM pagamentos_pix p
LEFT JOIN usuarios u ON p.usuario_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Total de Saques' AS metrica,
    COUNT(*)::text AS valor,
    '✅ OK' AS status
FROM saques
UNION ALL
SELECT 
    'Saques sem Usuário' AS metrica,
    COUNT(*)::text AS valor,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END AS status
FROM saques s
LEFT JOIN usuarios u ON s.usuario_id = u.id
WHERE u.id IS NULL;

-- =====================================================
-- FIM DAS QUERIES DE VALIDAÇÃO
-- =====================================================
-- ✅ Todas as queries são SELECT - seguras para produção
-- ✅ Execute todas e documente os resultados
-- =====================================================

