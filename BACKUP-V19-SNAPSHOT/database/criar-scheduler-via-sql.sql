-- ============================================================================
-- CRIAR SCHEDULER VIA SQL (Alternativa ao Dashboard)
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Clique em "Run"
-- 4. Pronto! O cron job será criado automaticamente
-- ============================================================================

-- Verificar se a extensão pg_cron está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar job que executa a Edge Function via HTTP
-- Nota: pg_cron executa SQL, então vamos criar uma função que chama a Edge Function
-- via HTTP usando pg_net (extensão do Supabase)

-- Primeiro, verificar se pg_net está disponível
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar função que chama a Edge Function via HTTP
CREATE OR REPLACE FUNCTION public.call_expire_stale_pix_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_response jsonb;
  v_url text;
  v_service_key text;
BEGIN
  -- Obter URL do projeto e service key das variáveis de ambiente
  -- Nota: No Supabase, essas variáveis estão disponíveis via current_setting
  v_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  -- Se não conseguir obter das variáveis, usar valores padrão do Supabase
  -- Você precisará substituir pelo seu projeto
  IF v_url IS NULL THEN
    v_url := 'https://gayopagjdrkcmkirmfvy.supabase.co';
  END IF;
  
  -- Chamar Edge Function via HTTP
  SELECT content INTO v_response
  FROM http((
    'POST',
    v_url || '/functions/v1/expire-stale-pix',
    ARRAY[
      http_header('Authorization', 'Bearer ' || COALESCE(v_service_key, 'your-service-role-key')),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::http_request);
  
  -- Log do resultado (opcional)
  RAISE NOTICE 'Edge Function chamada: %', v_response;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao chamar Edge Function: %', SQLERRM;
END;
$$;

-- Criar o cron job que executa a cada 5 minutos
-- Formato cron: minuto hora dia mês dia-da-semana
-- */5 * * * * = a cada 5 minutos
SELECT cron.schedule(
  'expire-stale-pix-job',           -- Nome do job
  '*/5 * * * *',                    -- Cron: a cada 5 minutos
  $$SELECT public.call_expire_stale_pix_edge_function();$$  -- SQL a executar
);

-- Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'expire-stale-pix-job';

-- ✅ PRONTO! O cron job está configurado e executará a cada 5 minutos

-- ============================================================================
-- ALTERNATIVA MAIS SIMPLES: Executar função RPC diretamente (sem Edge Function)
-- ============================================================================
-- Se a abordagem acima não funcionar, você pode criar um cron job que executa
-- a função RPC diretamente (sem passar pela Edge Function):

-- Remover job anterior (se existir)
SELECT cron.unschedule('expire-stale-pix-job-direct');

-- Criar job que executa a função RPC diretamente
SELECT cron.schedule(
  'expire-stale-pix-job-direct',    -- Nome do job
  '*/5 * * * *',                    -- Cron: a cada 5 minutos
  $$SELECT public.expire_stale_pix();$$  -- Executa função RPC diretamente
);

-- Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'expire-stale-pix-job-direct';

-- ✅ Esta abordagem é mais simples e não precisa da Edge Function!

