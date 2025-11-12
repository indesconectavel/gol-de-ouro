-- ============================================
-- QUERIES DE OTIMIZAÇÃO PARA SUPABASE
-- ============================================
-- Execute no SQL Editor: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql/new
-- ============================================

-- 1. Verificar e criar índices apenas se as colunas existirem
-- ============================================

-- Criar índices para chutes (verificar se tabela existe)
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
CREATE INDEX IF NOT EXISTS idx_lotes_valor_aposta ON lotes(valor_aposta);

-- Criar índices para pagamentos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos' AND column_name = 'usuario_id') THEN
            CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON pagamentos(usuario_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
        END IF;
    END IF;
END $$;

-- 2. Criar função otimizada para RLS (resolve 22 warnings)
-- ============================================

CREATE OR REPLACE FUNCTION public.auth_user_id() 
RETURNS TEXT 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.uid()::TEXT, ''::TEXT);
$$;

-- 3. Otimizar consultas de usuários
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);

-- 4. Otimizar consultas de pagamentos
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pagamentos_created_at ON pagamentos(created_at);
CREATE INDEX IF NOT EXISTS idx_pagamentos_updated_at ON pagamentos(updated_at);

-- 5. Otimizar consultas de lotes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lotes_created_at ON lotes(created_at);
CREATE INDEX IF NOT EXISTS idx_lotes_updated_at ON lotes(updated_at);

-- 6. Otimizar consultas de chutes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chutes_created_at ON chutes(created_at);
CREATE INDEX IF NOT EXISTS idx_chutes_status ON chutes(status);

-- 7. Atualizar policies (sintaxe correta do PostgreSQL)
-- ============================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "users_own_data" ON public.usuarios;
DROP POLICY IF EXISTS "users_select_all" ON public.usuarios;

-- Criar nova policy otimizada (sem IF NOT EXISTS, não suportado em CREATE POLICY)
CREATE POLICY "users_own_data" 
ON public.usuarios
FOR SELECT
USING (true); -- Temporariamente permissivo, ajustar conforme necessário

-- 8. Analisar estatísticas
-- ============================================

ANALYZE usuarios;
ANALYZE lotes;
ANALYZE chutes;
ANALYZE pagamentos;
ANALYZE metricas_globais;

-- 9. Verificar índices não utilizados
-- ============================================

-- Executar no Supabase SQL Editor:
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

-- 10. Limpar índices não utilizados (executar manualmente)
-- ============================================

-- DROP INDEX IF EXISTS nome_do_indice_nao_utilizado;

-- ============================================
-- FIM DAS QUERIES DE OTIMIZAÇÃO
-- ============================================

