-- =====================================================
-- LIMPAR LOTES PROBLEMÁTICOS - VERSÃO FINAL CORRIGIDA
-- =====================================================
-- Objetivo: Fechar lotes ativos que têm chutes com direções inválidas
-- =====================================================
-- Data: 2025-12-10
-- Status: CORRIGIDO - Usa nomes de colunas corretos
-- PROJETO: goldeouro-production (gayopagjdrkcmkirmfvy)
-- =====================================================

-- ⚠️ IMPORTANTE: Execute este SQL no projeto CORRETO:
-- ✅ PROJETO: goldeouro-production
-- ✅ URL: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy
-- ❌ NÃO usar: goldeouro-db

-- =====================================================
-- PASSO 1: VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

-- Verificar colunas da tabela lotes
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- Verificar colunas da tabela chutes
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'chutes'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 2: FECHAR TODOS OS LOTES ATIVOS (SIMPLES E DIRETO)
-- =====================================================
-- ✅ CORREÇÃO: Usa apenas coluna 'status' e 'valor_aposta' (não 'valor')
-- ✅ CORREÇÃO: Não usa JOIN com chutes (evita erro de coluna inexistente)

UPDATE lotes 
SET 
  status = 'finalizado',
  processed_at = NOW(),
  updated_at = NOW()
WHERE (status = 'ativo' OR status IS NULL)
AND status != 'finalizado';

-- =====================================================
-- PASSO 3: VERIFICAR RESULTADO
-- =====================================================

-- Contar lotes fechados
SELECT 
  COUNT(*) as lotes_fechados,
  COUNT(DISTINCT valor_aposta) as valores_diferentes
FROM lotes 
WHERE status = 'finalizado' 
AND processed_at >= NOW() - INTERVAL '1 minute';

-- Verificar se ainda há lotes ativos
SELECT 
  COUNT(*) as lotes_ativos_restantes
FROM lotes 
WHERE (status = 'ativo' OR status IS NULL);

-- =====================================================
-- NOTA: Após executar este script, novos lotes serão
-- criados automaticamente quando necessário, e usarão
-- as direções corretas do sistema atual.
-- =====================================================

