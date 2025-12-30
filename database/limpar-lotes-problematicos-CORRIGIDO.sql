-- =====================================================
-- LIMPAR LOTES PROBLEMÁTICOS - CORRIGIDO
-- =====================================================
-- Objetivo: Fechar lotes ativos que têm chutes com direções inválidas
-- =====================================================
-- Data: 2025-12-10
-- Status: CORRIGIDO - Usa apenas colunas que existem
-- PROJETO: goldeouro-production (gayopagjdrkcmkirmfvy)
-- =====================================================

-- ⚠️ IMPORTANTE: Execute este SQL no projeto CORRETO:
-- ✅ PROJETO: goldeouro-production
-- ✅ URL: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy

-- PASSO 1: Verificar estrutura da tabela lotes
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- PASSO 2: Verificar lotes ativos problemáticos
SELECT 
  l.id, 
  l.valor as valor_aposta, 
  l.status, 
  COUNT(c.id) as chutes_count,
  STRING_AGG(DISTINCT c.direction::text, ', ') as direcoes
FROM lotes l
LEFT JOIN chutes c ON c.lote_id = l.id
WHERE l.status = 'ativo' OR l.status IS NULL
GROUP BY l.id, l.valor, l.status
ORDER BY l.valor, l.id;

-- PASSO 3: Verificar chutes com direções novas (left, right, center, etc)
SELECT 
  c.id,
  c.lote_id,
  c.direction,
  c.created_at,
  l.status as lote_status,
  l.valor as valor_aposta
FROM chutes c
JOIN lotes l ON l.id = c.lote_id
WHERE (l.status = 'ativo' OR l.status IS NULL)
AND c.direction IN ('left', 'right', 'center', 'up', 'down')
ORDER BY c.created_at DESC
LIMIT 50;

-- PASSO 4: Fechar TODOS os lotes ativos (CORRIGIDO - sem coluna 'ativo')
-- ✅ CORREÇÃO: Usa apenas coluna 'status' que existe
UPDATE lotes 
SET 
  status = 'finalizado',
  processed_at = NOW(),
  updated_at = NOW()
WHERE (status = 'ativo' OR status IS NULL)
AND status != 'finalizado';

-- Verificar resultado
SELECT 
  COUNT(*) as lotes_fechados,
  COUNT(DISTINCT valor) as valores_diferentes
FROM lotes 
WHERE status = 'finalizado' 
AND processed_at >= NOW() - INTERVAL '1 minute';

-- PASSO 5: Verificar se ainda há lotes ativos
SELECT 
  COUNT(*) as lotes_ativos_restantes
FROM lotes 
WHERE (status = 'ativo' OR status IS NULL);

-- =====================================================
-- NOTA: Após executar este script, novos lotes serão
-- criados automaticamente quando necessário, e usarão
-- as direções corretas do sistema atual.
-- =====================================================

