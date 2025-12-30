-- =====================================================
-- LIMPAR LOTES PROBLEMÁTICOS COM DIREÇÕES INVÁLIDAS
-- =====================================================
-- Objetivo: Fechar lotes ativos que têm chutes com direções inválidas
-- =====================================================
-- Data: 2025-12-10
-- Status: CRÍTICO - Resolver erro 400 nos chutes
-- =====================================================

-- PASSO 1: Verificar lotes ativos problemáticos
SELECT 
  l.id, 
  l.valor as valor_aposta, 
  l.status, 
  COUNT(c.id) as chutes_count,
  STRING_AGG(DISTINCT c.direction::text, ', ') as direcoes
FROM lotes l
LEFT JOIN chutes c ON c.lote_id = l.id
WHERE l.status = 'ativo' OR l.status IS NULL OR l.ativo = true
GROUP BY l.id, l.valor, l.status
ORDER BY l.valor, l.id;

-- PASSO 2: Verificar chutes com direções que podem causar problemas
-- (direções novas: left, right, center, up, down)
SELECT 
  c.id,
  c.lote_id,
  c.direction,
  c.created_at,
  l.status as lote_status,
  l.valor as valor_aposta
FROM chutes c
JOIN lotes l ON l.id = c.lote_id
WHERE (l.status = 'ativo' OR l.status IS NULL OR l.ativo = true)
AND c.direction IN ('left', 'right', 'center', 'up', 'down')
ORDER BY c.created_at DESC
LIMIT 50;

-- PASSO 3: Fechar TODOS os lotes ativos (RECOMENDADO)
-- Isso garante que novos lotes serão criados com direções corretas
UPDATE lotes 
SET 
  status = 'finalizado',
  ativo = false,
  processed_at = NOW(),
  updated_at = NOW()
WHERE (status = 'ativo' OR status IS NULL OR ativo = true)
AND (status != 'finalizado');

-- Verificar resultado
SELECT 
  COUNT(*) as lotes_fechados,
  COUNT(DISTINCT valor) as valores_diferentes
FROM lotes 
WHERE status = 'finalizado' 
AND processed_at >= NOW() - INTERVAL '1 minute';

-- PASSO 4: Verificar se ainda há lotes ativos
SELECT 
  COUNT(*) as lotes_ativos_restantes
FROM lotes 
WHERE (status = 'ativo' OR status IS NULL OR ativo = true);

-- =====================================================
-- NOTA: Após executar este script, novos lotes serão
-- criados automaticamente quando necessário, e usarão
-- as direções corretas do sistema atual.
-- =====================================================

