-- ============================================
-- QUERIES SIMPLES E SEGURAS PARA SUPABASE
-- ============================================
-- Sem verificação complexa, apenas as queries básicas que funcionam
-- ============================================

-- 1. Criar índices básicos para lotes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lotes_id ON lotes(id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(status);

-- 2. Criar índices básicos para usuários
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);

-- 3. Analisar estatísticas
-- ============================================

ANALYZE usuarios;
ANALYZE lotes;
ANALYZE metricas_globais;

-- ============================================
-- FIM - QUERIES SEGURAS
-- ============================================

