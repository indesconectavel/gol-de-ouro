-- =====================================================
-- TABELA WEBHOOK_EVENTS - IDEMPOTÊNCIA COMPLETA
-- Gol de Ouro v4.0 - Fase 2: Idempotência do Webhook
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Garantir que webhook nunca processe duas vezes
-- 
-- Esta tabela registra todos os eventos de webhook recebidos,
-- garantindo idempotência completa mesmo com múltiplas chamadas simultâneas.
-- =====================================================

-- Criar tabela webhook_events
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id SERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payment_id VARCHAR(255) NOT NULL,
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms INTEGER,
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_idempotency_key ON public.webhook_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON public.webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- Índice composto para queries frequentes
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_processed ON public.webhook_events(payment_id, processed);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_webhook_events_updated_at_trigger ON public.webhook_events;
CREATE TRIGGER update_webhook_events_updated_at_trigger
    BEFORE UPDATE ON public.webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_events_updated_at();

-- Comentários
COMMENT ON TABLE public.webhook_events IS 'Registro de todos os eventos de webhook para garantir idempotência';
COMMENT ON COLUMN public.webhook_events.idempotency_key IS 'Chave única para identificar evento (formato: event_type:payment_id:timestamp)';
COMMENT ON COLUMN public.webhook_events.processed IS 'Indica se evento já foi processado com sucesso';
COMMENT ON COLUMN public.webhook_events.raw_payload IS 'Payload completo do webhook (JSON)';
COMMENT ON COLUMN public.webhook_events.result IS 'Resultado do processamento (JSON)';
COMMENT ON COLUMN public.webhook_events.retry_count IS 'Número de tentativas de processamento';

-- =====================================================
-- RPC FUNCTION: Registrar Evento de Webhook
-- =====================================================
-- Esta função registra um evento de webhook de forma atômica,
-- garantindo que apenas uma thread possa registrar o mesmo evento.
-- 
-- Retorna:
--   JSON com { success: boolean, event_id: integer, already_exists: boolean, error: text }
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_register_webhook_event(
  p_idempotency_key VARCHAR(255),
  p_event_type VARCHAR(50),
  p_payment_id VARCHAR(255),
  p_raw_payload JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id INTEGER;
  v_already_exists BOOLEAN;
  v_error TEXT;
BEGIN
  -- Validar parâmetros
  IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Idempotency key é obrigatória'
    );
  END IF;

  IF p_payment_id IS NULL OR p_payment_id = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Payment ID é obrigatório'
    );
  END IF;

  -- Tentar inserir evento (com ON CONFLICT para detectar duplicatas)
  INSERT INTO public.webhook_events (
    idempotency_key,
    event_type,
    payment_id,
    raw_payload,
    processed,
    processing_started_at
  ) VALUES (
    p_idempotency_key,
    p_event_type,
    p_payment_id,
    p_raw_payload,
    false,
    NOW()
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_event_id;

  -- Verificar se inseriu (não existia) ou já existia
  IF v_event_id IS NULL THEN
    -- Evento já existe, buscar ID existente
    SELECT id INTO v_event_id
    FROM public.webhook_events
    WHERE idempotency_key = p_idempotency_key;
    
    v_already_exists := true;
  ELSE
    v_already_exists := false;
  END IF;

  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'event_id', v_event_id,
    'already_exists', v_already_exists
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- =====================================================
-- RPC FUNCTION: Marcar Evento como Processado
-- =====================================================
-- Esta função marca um evento como processado com sucesso,
-- registrando o resultado e tempo de processamento.
-- 
-- Retorna:
--   JSON com { success: boolean, error: text }
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_mark_webhook_event_processed(
  p_event_id INTEGER,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processing_started_at TIMESTAMP WITH TIME ZONE;
  v_duration_ms INTEGER;
  v_error TEXT;
BEGIN
  -- Validar parâmetros
  IF p_event_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Event ID é obrigatório'
    );
  END IF;

  -- Buscar processing_started_at para calcular duração
  SELECT processing_started_at INTO v_processing_started_at
  FROM public.webhook_events
  WHERE id = p_event_id;

  IF v_processing_started_at IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Evento não encontrado'
    );
  END IF;

  -- Calcular duração em milissegundos
  v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_processing_started_at)) * 1000;

  -- Atualizar evento
  UPDATE public.webhook_events
  SET 
    processed = true,
    processed_at = NOW(),
    processing_duration_ms = v_duration_ms,
    result = p_result,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_event_id;

  -- Verificar se atualizou
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Evento não encontrado para atualização'
    );
  END IF;

  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'duration_ms', v_duration_ms
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- =====================================================
-- RPC FUNCTION: Verificar se Evento Já Foi Processado
-- =====================================================
-- Esta função verifica se um evento já foi processado,
-- útil para verificação rápida antes de processar.
-- 
-- Retorna:
--   JSON com { success: boolean, processed: boolean, event_id: integer, error: text }
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_check_webhook_event_processed(
  p_idempotency_key VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id INTEGER;
  v_processed BOOLEAN;
  v_error TEXT;
BEGIN
  -- Validar parâmetros
  IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Idempotency key é obrigatória'
    );
  END IF;

  -- Buscar evento
  SELECT id, processed INTO v_event_id, v_processed
  FROM public.webhook_events
  WHERE idempotency_key = p_idempotency_key;

  -- Verificar se encontrou
  IF v_event_id IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'processed', false,
      'event_id', NULL
    );
  END IF;

  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'processed', v_processed,
    'event_id', v_event_id
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.rpc_register_webhook_event IS 'Registra evento de webhook de forma atômica, garantindo idempotência';
COMMENT ON FUNCTION public.rpc_mark_webhook_event_processed IS 'Marca evento como processado com sucesso ou erro';
COMMENT ON FUNCTION public.rpc_check_webhook_event_processed IS 'Verifica se evento já foi processado';

-- =====================================================
-- FIM DO SCHEMA WEBHOOK EVENTS
-- =====================================================

