-- ============================================
-- QUERIES DE OTIMIZAÇÃO PARA SUPABASE - CORRIGIDO
-- ============================================
-- Execute no SQL Editor: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql/new
-- ============================================

-- 1. Criar índices com verificação de colunas existentes
-- ============================================

-- Criar índices para chutes (com verificação)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chutes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chutes' AND column_name = 'lote_id') THEN
            CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON chutes(lote_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chutes' AND column_name = 'usuario_id') THEN
            CREATE INDEX IF NOT EXISTS idx_chutes_usuario_id ON chutes(usuario_id);
        END IF;
    END IF;
END $$;

-- Criar índices para lotes
CREATE INDEX IF NOT EXISTS idx_lotes_id ON lotes(id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(status);

-- Criar índices para pagamentos (com verificação de tabela)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
        CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON pagamentos(usuario_id);
        CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
    END IF;
END $$;

-- 2. Criar índices para usuários
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);

-- 3. Criar índices para timestamps
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_pagamentos_created_at ON pagamentos(created_at);
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_lotes_created_at ON lotes(created_at);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chutes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chutes' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_chutes_created_at ON chutes(created_at);
        END IF;
    END IF;
END $$;

-- 4. Analisar estatísticas
-- ============================================

ANALYZE usuarios;
ANALYZE lotes;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chutes') THEN
        ANALYZE chutes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
        ANALYZE pagamentos;
    END IF;
END $$;

-- ============================================
-- FIM DAS QUERIES DE OTIMIZAÇÃO
-- ============================================

