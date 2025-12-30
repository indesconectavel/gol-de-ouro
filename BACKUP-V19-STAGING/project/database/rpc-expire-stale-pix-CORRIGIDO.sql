-- ============================================================================
-- FUNÇÃO RPC: Expirar Pagamentos PIX Stale (Antigos) - VERSÃO CORRIGIDA
-- ============================================================================
-- Data: 2025-11-24
-- Descrição: Função RPC para marcar pagamentos pending com mais de 24 horas
--            como expired. Esta função será chamada pelo Edge Function via
--            agendamento automático (cron job).
-- ============================================================================
-- CORREÇÃO: Primeiro faz DROP da função existente antes de criar
-- ============================================================================

-- Configurar search_path para segurança
SET search_path = public, pg_catalog;

-- 1. Remover função existente (se existir)
DROP FUNCTION IF EXISTS public.expire_stale_pix() CASCADE;

-- 2. Criar função RPC para expirar pagamentos stale
CREATE OR REPLACE FUNCTION public.expire_stale_pix()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_pending_count INTEGER := 0;
  v_result JSON;
BEGIN
  -- Contar pagamentos pending antes da expiração
  SELECT COUNT(*) INTO v_pending_count
  FROM pagamentos_pix
  WHERE status = 'pending'
    AND (
      -- Pagamentos com mais de 24 horas
      EXTRACT(EPOCH FROM (NOW() - created_at)) > 86400
      OR
      -- Pagamentos com expires_at passado
      (expires_at IS NOT NULL AND expires_at < NOW())
    );

  -- Marcar pagamentos stale como expired
  UPDATE pagamentos_pix
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'pending'
    AND (
      -- Pagamentos com mais de 24 horas
      EXTRACT(EPOCH FROM (NOW() - created_at)) > 86400
      OR
      -- Pagamentos com expires_at passado
      (expires_at IS NOT NULL AND expires_at < NOW())
    );

  -- Obter contagem de pagamentos expirados
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  -- Retornar resultado em JSON
  v_result := json_build_object(
    'success', true,
    'expired_count', v_expired_count,
    'pending_before', v_pending_count,
    'timestamp', NOW(),
    'message', format('Expirou %s pagamentos PIX stale', v_expired_count)
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Retornar erro em JSON
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', NOW()
    );
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.expire_stale_pix() IS 
'Expira pagamentos PIX pending com mais de 24 horas ou com expires_at passado. Retorna JSON com contagem de pagamentos expirados.';

-- Garantir permissões corretas
GRANT EXECUTE ON FUNCTION public.expire_stale_pix() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_pix() TO anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_pix() TO service_role;

-- ✅ Função RPC criada/atualizada com sucesso

-- Verificar função criada
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'expire_stale_pix';

