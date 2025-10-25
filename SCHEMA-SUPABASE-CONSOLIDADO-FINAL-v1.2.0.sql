-- SCHEMA CONSOLIDADO FINAL DO SUPABASE - GOL DE OURO v1.2.0
-- ============================================================
-- Data: 23/10/2025
-- Status: SCHEMA CONSOLIDADO E UNIFICADO PARA PRODUÇÃO REAL 100%
-- Versão: v1.2.0-schema-consolidated-final
-- GPT-4o Auto-Fix: Schema consolidado e otimizado

-- =====================================================
-- EXTENSÕES NECESSÁRIAS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELAS PRINCIPAIS - ESTRUTURA CONSOLIDADA
-- =====================================================

-- 1. TABELA USUÁRIOS (Consolidada e Otimizada)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    tipo VARCHAR(50) DEFAULT 'jogador' CHECK (tipo IN ('jogador', 'admin', 'moderador')),
    ativo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    total_apostas INTEGER DEFAULT 0,
    total_ganhos DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA MÉTRICAS GLOBAIS (Consolidada)
CREATE TABLE IF NOT EXISTS public.metricas_globais (
    id SERIAL PRIMARY KEY,
    contador_chutes_global INTEGER DEFAULT 0 NOT NULL,
    ultimo_gol_de_ouro INTEGER DEFAULT 0 NOT NULL,
    total_usuarios INTEGER DEFAULT 0,
    total_jogos INTEGER DEFAULT 0,
    total_receita DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA LOTES (Sistema de Lotes Dinâmico)
CREATE TABLE IF NOT EXISTS public.lotes (
    id VARCHAR(100) PRIMARY KEY,
    valor_aposta DECIMAL(10,2) NOT NULL,
    tamanho INTEGER NOT NULL,
    posicao_atual INTEGER DEFAULT 0,
    indice_vencedor INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'pausado')),
    total_arrecadado DECIMAL(10,2) DEFAULT 0.00,
    premio_total DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA CHUTES (Histórico de Jogadas)
CREATE TABLE IF NOT EXISTS public.chutes (
    id SERIAL PRIMARY KEY,
    lote_id VARCHAR(100) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('left', 'center', 'right')),
    amount DECIMAL(10,2) NOT NULL,
    result VARCHAR(20) NOT NULL CHECK (result IN ('goal', 'miss')),
    premio DECIMAL(10,2) DEFAULT 0.00,
    premio_gol_de_ouro DECIMAL(10,2) DEFAULT 0.00,
    is_gol_de_ouro BOOLEAN DEFAULT false,
    shot_index INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA PAGAMENTOS PIX (Consolidada)
CREATE TABLE IF NOT EXISTS public.pagamentos_pix (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    external_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    qr_code TEXT,
    qr_code_base64 TEXT,
    pix_copy_paste TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA SAQUES (Consolidada)
CREATE TABLE IF NOT EXISTS public.saques (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    valor_liquido DECIMAL(10,2) NOT NULL,
    taxa DECIMAL(10,2) NOT NULL,
    chave_pix VARCHAR(255) NOT NULL,
    tipo_chave VARCHAR(50) NOT NULL CHECK (tipo_chave IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'aprovado', 'rejeitado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA TRANSAÇÕES (Histórico Completo)
CREATE TABLE IF NOT EXISTS public.transacoes (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('credito', 'debito')),
    valor DECIMAL(10,2) NOT NULL,
    saldo_anterior DECIMAL(10,2) NOT NULL,
    saldo_posterior DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    referencia_id INTEGER,
    referencia_tipo VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'falhou')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA NOTIFICAÇÕES (Sistema de Notificações)
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('deposito', 'saque', 'premio', 'gol_de_ouro', 'sistema')),
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA CONFIGURAÇÕES DO SISTEMA
CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    publico BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON public.usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON public.usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_created_at ON public.usuarios(created_at);

-- Índices para chutes
CREATE INDEX IF NOT EXISTS idx_chutes_usuario_id ON public.chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON public.chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_chutes_result ON public.chutes(result);
CREATE INDEX IF NOT EXISTS idx_chutes_timestamp ON public.chutes(timestamp);
CREATE INDEX IF NOT EXISTS idx_chutes_usuario_timestamp ON public.chutes(usuario_id, timestamp);

-- Índices para pagamentos
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON public.pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos_pix(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_external_id ON public.pagamentos_pix(external_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_created_at ON public.pagamentos_pix(created_at);

-- Índices para saques
CREATE INDEX IF NOT EXISTS idx_saques_usuario_id ON public.saques(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_status ON public.saques(status);
CREATE INDEX IF NOT EXISTS idx_saques_created_at ON public.saques(created_at);

-- Índices para transações
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_id ON public.transacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_created_at ON public.transacoes(created_at);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON public.notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON public.notificacoes(created_at);

-- Índices compostos para queries complexas
CREATE INDEX IF NOT EXISTS idx_chutes_usuario_result ON public.chutes(usuario_id, result);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_status ON public.pagamentos_pix(usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_saques_usuario_status ON public.saques(usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_tipo ON public.transacoes(usuario_id, tipo);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_globais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Políticas para usuários
DROP POLICY IF EXISTS "Users can view own data" ON public.usuarios;
CREATE POLICY "Users can view own data" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;
CREATE POLICY "Users can update own data" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own data" ON public.usuarios;
CREATE POLICY "Users can insert own data" ON public.usuarios
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para chutes
DROP POLICY IF EXISTS "Users can view own shots" ON public.chutes;
CREATE POLICY "Users can view own shots" ON public.chutes
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert own shots" ON public.chutes;
CREATE POLICY "Users can insert own shots" ON public.chutes
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Políticas para pagamentos
DROP POLICY IF EXISTS "Users can view own payments" ON public.pagamentos_pix;
CREATE POLICY "Users can view own payments" ON public.pagamentos_pix
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.pagamentos_pix;
CREATE POLICY "Users can insert own payments" ON public.pagamentos_pix
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Políticas para saques
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.saques;
CREATE POLICY "Users can view own withdrawals" ON public.saques
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.saques;
CREATE POLICY "Users can insert own withdrawals" ON public.saques
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Políticas para transações
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transacoes;
CREATE POLICY "Users can view own transactions" ON public.transacoes
    FOR SELECT USING (auth.uid() = usuario_id);

-- Políticas para notificações
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notificacoes;
CREATE POLICY "Users can view own notifications" ON public.notificacoes
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notificacoes;
CREATE POLICY "Users can update own notifications" ON public.notificacoes
    FOR UPDATE USING (auth.uid() = usuario_id);

-- Políticas para métricas globais (públicas)
DROP POLICY IF EXISTS "Anyone can view global metrics" ON public.metricas_globais;
CREATE POLICY "Anyone can view global metrics" ON public.metricas_globais
    FOR SELECT USING (true);

-- Políticas para configurações do sistema
DROP POLICY IF EXISTS "Anyone can view public config" ON public.configuracoes_sistema;
CREATE POLICY "Anyone can view public config" ON public.configuracoes_sistema
    FOR SELECT USING (publico = true);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir métricas globais iniciais
INSERT INTO public.metricas_globais (contador_chutes_global, ultimo_gol_de_ouro, total_usuarios, total_jogos, total_receita)
SELECT 0, 0, 0, 0, 0.00
WHERE NOT EXISTS (SELECT 1 FROM public.metricas_globais);

-- Inserir configurações padrão do sistema
INSERT INTO public.configuracoes_sistema (chave, valor, descricao, tipo, publico) VALUES
('jogo_valor_minimo', '1.00', 'Valor mínimo para apostar', 'number', true),
('jogo_valor_maximo', '10.00', 'Valor máximo para apostar', 'number', true),
('jogo_premio_base', '5.00', 'Prêmio base por gol', 'number', true),
('jogo_premio_gol_ouro', '100.00', 'Prêmio do Gol de Ouro', 'number', true),
('jogo_frequencia_gol_ouro', '1000', 'Frequência do Gol de Ouro (chutes)', 'number', true),
('saque_taxa', '2.00', 'Taxa de saque', 'number', true),
('saque_valor_minimo', '0.50', 'Valor mínimo para saque', 'number', true),
('saque_valor_maximo', '1000.00', 'Valor máximo para saque', 'number', true),
('sistema_manutencao', 'false', 'Sistema em manutenção', 'boolean', true),
('sistema_versao', '1.2.0', 'Versão do sistema', 'string', true)
ON CONFLICT (chave) DO NOTHING;

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_metricas_globais_updated_at ON public.metricas_globais;
CREATE TRIGGER update_metricas_globais_updated_at BEFORE UPDATE ON public.metricas_globais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lotes_updated_at ON public.lotes;
CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON public.lotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pagamentos_pix_updated_at ON public.pagamentos_pix;
CREATE TRIGGER update_pagamentos_pix_updated_at BEFORE UPDATE ON public.pagamentos_pix FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saques_updated_at ON public.saques;
CREATE TRIGGER update_saques_updated_at BEFORE UPDATE ON public.saques FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_configuracoes_sistema_updated_at ON public.configuracoes_sistema;
CREATE TRIGGER update_configuracoes_sistema_updated_at BEFORE UPDATE ON public.configuracoes_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('usuarios', 'metricas_globais', 'lotes', 'chutes', 'pagamentos_pix', 'saques', 'transacoes', 'notificacoes', 'configuracoes_sistema');
    
    IF table_count = 9 THEN
        RAISE NOTICE '✅ SCHEMA CONSOLIDADO FINAL v1.2.0 APLICADO COM SUCESSO - % tabelas criadas', table_count;
    ELSE
        RAISE NOTICE '⚠️ SCHEMA PARCIALMENTE APLICADO - % de 9 tabelas criadas', table_count;
    END IF;
END $$;

-- =====================================================
-- FIM DO SCHEMA CONSOLIDADO
-- =====================================================
