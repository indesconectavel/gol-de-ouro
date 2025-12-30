-- =====================================================
-- MIGRATION RESET COMPLETO V19 PARA PRODUÇÃO
-- Gol de Ouro Backend - Engine V19
-- =====================================================
-- Data: 2025-12-10
-- Versão: V19.0.0
-- Status: ⚠️ RESET COMPLETO (APAGA DADOS EXISTENTES)
-- Projeto: goldeouro-production (gayopagjdrkcmkirmfvy)
-- 
-- ⚠️ ATENÇÃO CRÍTICA: Este arquivo recria toda a estrutura V19 do zero.
-- ⚠️ USE APENAS EM AMBIENTES VAZIOS OU APÓS BACKUP COMPLETO!
-- 
-- Para atualização segura, use: PRODUCAO_CORRECAO_INCREMENTAL_V19.sql
-- =====================================================

-- =====================================================
-- AVISO CRÍTICO
-- =====================================================
-- 
-- ⚠️ ESTE ARQUIVO APAGA TODOS OS DADOS DAS TABELAS V19!
-- 
-- Execute apenas se:
-- 1. Estiver em ambiente de desenvolvimento/teste
-- 2. Tiver feito backup completo do banco
-- 3. Estiver certo de que deseja apagar todos os dados V19
-- 4. O ambiente estiver vazio ou seja aceitável perder dados V19
--
-- Para atualização segura em produção, use:
-- database/migration_v19/PRODUCAO_CORRECAO_INCREMENTAL_V19.sql
--
-- =====================================================

-- =====================================================
-- PARTE 1: EXTENSÕES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PARTE 2: REMOVER TABELAS V19 (SE EXISTIREM)
-- =====================================================
-- ⚠️ ATENÇÃO: Isso apaga todos os dados das tabelas V19!

DROP TABLE IF EXISTS public.system_heartbeat CASCADE;
DROP TABLE IF EXISTS public.webhook_events CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.lotes CASCADE;

-- =====================================================
-- PARTE 3: CRIAR TABELAS V19 (ESTRUTURA PERFEITA)
-- =====================================================

-- Tabela lotes (persistência V19)
CREATE TABLE public.lotes (
    id VARCHAR(100) PRIMARY KEY,
    valor_aposta DECIMAL(10,2) NOT NULL,
    tamanho INTEGER NOT NULL,
    posicao_atual INTEGER DEFAULT 0,
    indice_vencedor INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'pausado', 'completed')),
    total_arrecadado DECIMAL(10,2) DEFAULT 0.00,
    premio_total DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela rewards (sistema de recompensas V19)
CREATE TABLE public.rewards (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    lote_id VARCHAR(100),
    chute_id UUID REFERENCES public.chutes(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('gol_normal', 'gol_de_ouro', 'bonus', 'promocao', 'outro')),
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'creditado', 'cancelado', 'falhou')),
    saldo_anterior DECIMAL(10,2),
    saldo_posterior DECIMAL(10,2),
    transacao_id UUID REFERENCES public.transacoes(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    credited_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela webhook_events (idempotência V19)
CREATE TABLE public.webhook_events (
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

-- Tabela system_heartbeat (monitoramento V19)
CREATE TABLE public.system_heartbeat (
    id SERIAL PRIMARY KEY,
    instance_id VARCHAR(255) UNIQUE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PARTE 4: CRIAR ÍNDICES V19
-- =====================================================

-- Índices para lotes
CREATE INDEX idx_lotes_status ON public.lotes(status);
CREATE INDEX idx_lotes_valor_aposta ON public.lotes(valor_aposta);
CREATE INDEX idx_lotes_created_at ON public.lotes(created_at);

-- Índices para rewards
CREATE INDEX idx_rewards_usuario_id ON public.rewards(usuario_id);
CREATE INDEX idx_rewards_lote_id ON public.rewards(lote_id);
CREATE INDEX idx_rewards_chute_id ON public.rewards(chute_id);
CREATE INDEX idx_rewards_tipo ON public.rewards(tipo);
CREATE INDEX idx_rewards_status ON public.rewards(status);
CREATE INDEX idx_rewards_created_at ON public.rewards(created_at);
CREATE INDEX idx_rewards_usuario_tipo ON public.rewards(usuario_id, tipo);
CREATE INDEX idx_rewards_usuario_status ON public.rewards(usuario_id, status);

-- Índices para webhook_events
CREATE INDEX idx_webhook_events_idempotency_key ON public.webhook_events(idempotency_key);
CREATE INDEX idx_webhook_events_payment_id ON public.webhook_events(payment_id);
CREATE INDEX idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX idx_webhook_events_created_at ON public.webhook_events(created_at);
CREATE INDEX idx_webhook_events_payment_processed ON public.webhook_events(payment_id, processed);

-- Índices para system_heartbeat
CREATE INDEX idx_system_heartbeat_last_seen ON public.system_heartbeat(last_seen);
CREATE INDEX idx_system_heartbeat_instance ON public.system_heartbeat(instance_id);

-- =====================================================
-- PARTE 5: CRIAR TRIGGERS V19
-- =====================================================

-- Trigger para webhook_events updated_at
CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_events_updated_at_trigger
    BEFORE UPDATE ON public.webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_events_updated_at();

-- =====================================================
-- PARTE 6: CRIAR RLS POLICIES V19
-- =====================================================

-- Habilitar RLS em system_heartbeat
ALTER TABLE public.system_heartbeat ENABLE ROW LEVEL SECURITY;

-- Policy para system_heartbeat
CREATE POLICY "Backend pode gerenciar heartbeat"
ON public.system_heartbeat
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- PARTE 7: COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.lotes IS 'Lotes ativos do sistema de jogo V19';
COMMENT ON TABLE public.rewards IS 'Histórico completo de todas as recompensas V19';
COMMENT ON TABLE public.webhook_events IS 'Registro de eventos de webhook para idempotência V19';
COMMENT ON TABLE public.system_heartbeat IS 'Heartbeat do sistema V19';

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

SELECT '✅ Estrutura V19 criada do zero com sucesso! Agora execute os arquivos de RPCs.' AS resultado;

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- 
-- Este arquivo contém apenas a estrutura básica.
-- Para RPCs completas, execute também (na ordem):
-- 1. database/rpc-financial-acid.sql
-- 2. database/migration_v19/SCHEMA-LOTES-CORRIGIDO-FINAL.sql
-- 3. database/schema-rewards.sql
-- 4. database/schema-webhook-events.sql
-- 5. database/criar-system-heartbeat-100-porcento.sql
-- 6. database/corrigir-search-path-TODAS-FUNCOES.sql
--
-- =====================================================

