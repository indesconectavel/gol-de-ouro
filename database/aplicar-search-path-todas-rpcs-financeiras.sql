-- =====================================================
-- APLICAR SEARCH_PATH EM TODAS AS RPCs FINANCEIRAS
-- =====================================================
-- Objetivo: Corrigir vulnerabilidade de segurança
--           Function Search Path Mutable
-- =====================================================
-- Data: 2025-12-10
-- Status: CRÍTICO - Segurança
-- =====================================================

-- =====================================================
-- RPC 1: rpc_add_balance
-- =====================================================
ALTER FUNCTION public.rpc_add_balance(
  UUID,
  DECIMAL(10,2),
  TEXT,
  INTEGER,
  VARCHAR(50)
) SET search_path = public;

-- =====================================================
-- RPC 2: rpc_deduct_balance
-- =====================================================
ALTER FUNCTION public.rpc_deduct_balance(
  UUID,
  DECIMAL(10,2),
  TEXT,
  INTEGER,
  VARCHAR(50),
  BOOLEAN
) SET search_path = public;

-- =====================================================
-- RPC 3: rpc_transfer_balance
-- =====================================================
ALTER FUNCTION public.rpc_transfer_balance(
  UUID,
  UUID,
  DECIMAL(10,2),
  TEXT
) SET search_path = public;

-- =====================================================
-- RPC 4: rpc_get_balance
-- =====================================================
-- NOTA: Esta função tem 2 parâmetros: UUID e BOOLEAN (com DEFAULT)
ALTER FUNCTION public.rpc_get_balance(
  UUID,
  BOOLEAN
) SET search_path = public;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Verificar se search_path foi aplicado corretamente
SELECT 
  proname as function_name,
  proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN (
  'rpc_add_balance',
  'rpc_deduct_balance',
  'rpc_transfer_balance',
  'rpc_get_balance'
)
ORDER BY proname;

-- Resultado esperado:
-- Cada função deve ter proconfig contendo: {search_path=public}

