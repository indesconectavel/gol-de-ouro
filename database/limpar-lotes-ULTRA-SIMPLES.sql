-- =====================================================
-- LIMPAR LOTES PROBLEMÁTICOS - VERSÃO ULTRA SIMPLES
-- =====================================================
-- Objetivo: Fechar lotes ativos (apenas coluna status)
-- =====================================================
-- Data: 2025-12-10
-- Status: ULTRA SIMPLES - Usa APENAS coluna 'status'
-- PROJETO: goldeouro-production (gayopagjdrkcmkirmfvy)
-- =====================================================

-- ⚠️ IMPORTANTE: Execute este SQL no projeto CORRETO:
-- ✅ PROJETO: goldeouro-production
-- ✅ URL: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy
-- ❌ NÃO usar: goldeouro-db

-- =====================================================
-- PASSO 1: VERIFICAR ESTRUTURA DA TABELA lotes
-- =====================================================
-- Execute primeiro para ver quais colunas existem:

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 2: FECHAR TODOS OS LOTES ATIVOS (ULTRA SIMPLES)
-- =====================================================
-- ✅ Usa APENAS coluna 'status' - nada mais!

UPDATE lotes 
SET status = 'finalizado'
WHERE (status = 'ativo' OR status IS NULL)
AND status != 'finalizado';

-- =====================================================
-- PASSO 3: VERIFICAR RESULTADO
-- =====================================================

-- Contar lotes fechados
SELECT 
  COUNT(*) as lotes_fechados
FROM lotes 
WHERE status = 'finalizado';

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

