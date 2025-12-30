-- ============================================================================
-- SCRIPT SIMPLES: Criar Função para Expirar Pagamentos PIX
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Clique em "Run" (ou CTRL+Enter)
-- 4. Aguarde alguns segundos
-- 5. Pronto!
-- ============================================================================

-- Remover função antiga (se existir)
DROP FUNCTION IF EXISTS public.expire_stale_pix() CASCADE;

-- Criar função nova
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
      EXTRACT(EPOCH FROM (NOW() - created_at)) > 86400
      OR
      (expires_at IS NOT NULL AND expires_at < NOW())
    );

  -- Marcar pagamentos stale como expired
  UPDATE pagamentos_pix
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'pending'
    AND (
      EXTRACT(EPOCH FROM (NOW() - created_at)) > 86400
      OR
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
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', NOW()
    );
END;
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION public.expire_stale_pix() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_pix() TO anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_pix() TO service_role;

-- Verificar se funcionou
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'expire_stale_pix';

-- ✅ PRONTO! Agora teste com: SELECT * FROM expire_stale_pix();

