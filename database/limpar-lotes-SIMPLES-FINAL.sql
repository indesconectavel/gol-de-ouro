-- =====================================================
-- LIMPAR LOTES PROBLEMÁTICOS - VERSÃO SIMPLES FINAL
-- =====================================================
-- Objetivo: Fechar lotes ativos (versão mais simples possível)
-- =====================================================
-- Data: 2025-12-10
-- Status: SIMPLES - Usa apenas colunas que existem
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
-- PASSO 2: FECHAR TODOS OS LOTES ATIVOS (SIMPLES)
-- =====================================================
-- ✅ Usa apenas coluna 'status' que sabemos que existe
-- ✅ Não usa colunas que podem não existir (processed_at, ativo, etc)

UPDATE lotes 
SET 
  status = 'finalizado',
  updated_at = NOW()
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

