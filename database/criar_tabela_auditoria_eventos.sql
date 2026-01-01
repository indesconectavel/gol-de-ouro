-- =====================================================
-- TABELA DE AUDITORIA DE EVENTOS FINANCEIROS
-- =====================================================
-- Objetivo: Registrar eventos críticos para observabilidade
-- e rastreabilidade de operações com dinheiro real
-- =====================================================
-- IMPORTANTE: Esta tabela NÃO interfere em saldo ou lógica de negócio
-- É APENAS para log e auditoria
-- =====================================================

CREATE TABLE IF NOT EXISTS public.auditoria_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_evento VARCHAR(50) NOT NULL,
    user_id UUID,
    lote_id VARCHAR(100),
    shot_id VARCHAR(100),
    valor NUMERIC(10,2),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_auditoria_tipo_evento ON public.auditoria_eventos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_auditoria_user_id ON public.auditoria_eventos(user_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_lote_id ON public.auditoria_eventos(lote_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON public.auditoria_eventos(created_at);

-- Comentários
COMMENT ON TABLE public.auditoria_eventos IS 'Tabela de auditoria para eventos financeiros críticos - apenas para observabilidade, não interfere em saldo ou lógica de negócio';
COMMENT ON COLUMN public.auditoria_eventos.tipo_evento IS 'Tipo do evento: SHOOT_PROCESSED, LOTE_FECHADO, PREMIO_PAGO, ERRO_FINANCEIRO';
COMMENT ON COLUMN public.auditoria_eventos.user_id IS 'ID do usuário relacionado ao evento (nullable)';
COMMENT ON COLUMN public.auditoria_eventos.lote_id IS 'ID do lote relacionado (nullable)';
COMMENT ON COLUMN public.auditoria_eventos.shot_id IS 'ID do chute relacionado (nullable)';
COMMENT ON COLUMN public.auditoria_eventos.valor IS 'Valor monetário relacionado ao evento (nullable)';
COMMENT ON COLUMN public.auditoria_eventos.payload IS 'Dados adicionais do evento em formato JSON (nullable)';

