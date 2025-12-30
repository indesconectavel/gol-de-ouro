-- SCHEMA CONSOLIDADO DO BANCO DE DADOS
-- Gerado em: 2025-12-05T13:29:14.447Z
-- Versão: V19.0.0


-- =====================================================
-- ARQUIVO: schema.sql
-- =====================================================

-- Gol de Ouro - Schema do Banco de Dados v1.1.1
-- ================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    tipo VARCHAR(50) DEFAULT 'jogador' CHECK (tipo IN ('jogador', 'admin', 'moderador')),
    ativo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    telefone VARCHAR(20),
    data_nascimento DATE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    total_apostas DECIMAL(12,2) DEFAULT 0.00,
    total_ganhos DECIMAL(12,2) DEFAULT 0.00,
    total_partidas INTEGER DEFAULT 0,
    total_gols INTEGER DEFAULT 0,
    ranking INTEGER DEFAULT 0
);

-- Tabela de partidas
CREATE TABLE IF NOT EXISTS partidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(50) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_andamento', 'finalizada', 'cancelada')),
    total_jogadores INTEGER DEFAULT 0,
    jogadores_ativos INTEGER DEFAULT 0,
    valor_aposta DECIMAL(10,2) DEFAULT 1.00,
    premio_total DECIMAL(12,2) DEFAULT 0.00,
    gols_marcados INTEGER DEFAULT 0,
    vencedor_id UUID REFERENCES usuarios(id),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de jogadores na partida
CREATE TABLE IF NOT EXISTS partida_jogadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    posicao INTEGER NOT NULL,
    apostou DECIMAL(10,2) NOT NULL,
    chutou BOOLEAN DEFAULT false,
    gol_marcado BOOLEAN DEFAULT false,
    premio_recebido DECIMAL(10,2) DEFAULT 0.00,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partida_id, usuario_id)
);

-- Tabela de chutes
CREATE TABLE IF NOT EXISTS chutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    zona VARCHAR(50) NOT NULL CHECK (zona IN ('center', 'left', 'right', 'top', 'bottom')),
    potencia INTEGER NOT NULL CHECK (potencia BETWEEN 1 AND 100),
    angulo INTEGER NOT NULL CHECK (angulo BETWEEN -45 AND 45),
    resultado JSONB NOT NULL,
    gol_marcado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('deposito', 'saque', 'aposta', 'premio', 'bonus', 'cashback')),
    valor DECIMAL(12,2) NOT NULL,
    saldo_anterior DECIMAL(12,2) NOT NULL,
    saldo_posterior DECIMAL(12,2) NOT NULL,
    descricao TEXT,
    referencia VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluida', 'cancelada', 'falhou')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de pagamentos PIX
CREATE TABLE IF NOT EXISTS pagamentos_pix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    transacao_id UUID REFERENCES transacoes(id),
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    valor DECIMAL(10,2) NOT NULL,
    qr_code TEXT,
    qr_code_base64 TEXT,
    pix_copy_paste TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de saques
CREATE TABLE IF NOT EXISTS saques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    transacao_id UUID REFERENCES transacoes(id),
    valor DECIMAL(10,2) NOT NULL,
    chave_pix VARCHAR(255) NOT NULL,
    tipo_chave VARCHAR(50) NOT NULL CHECK (tipo_chave IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'rejeitado', 'cancelado')),
    motivo_rejeicao TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fila de jogadores
CREATE TABLE IF NOT EXISTS fila_jogadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_fila VARCHAR(50) DEFAULT 'normal' CHECK (tipo_fila IN ('normal', 'premium', 'torneio')),
    posicao INTEGER NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS conquistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    icone VARCHAR(255),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('gols', 'partidas', 'apostas', 'tempo', 'especial')),
    meta INTEGER NOT NULL,
    recompensa DECIMAL(10,2) DEFAULT 0.00,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conquistas do usuário
CREATE TABLE IF NOT EXISTS usuario_conquistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conquista_id UUID NOT NULL REFERENCES conquistas(id) ON DELETE CASCADE,
    progresso INTEGER DEFAULT 0,
    desbloqueada BOOLEAN DEFAULT false,
    desbloqueada_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, conquista_id)
);

-- Tabela de ranking
CREATE TABLE IF NOT EXISTS ranking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    posicao INTEGER NOT NULL,
    pontos INTEGER DEFAULT 0,
    gols INTEGER DEFAULT 0,
    partidas INTEGER DEFAULT 0,
    vitorias INTEGER DEFAULT 0,
    derrotas INTEGER DEFAULT 0,
    saldo DECIMAL(12,2) DEFAULT 0.00,
    periodo VARCHAR(50) DEFAULT 'mensal' CHECK (periodo IN ('diario', 'semanal', 'mensal', 'anual', 'total')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, periodo)
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    descricao TEXT,
    categoria VARCHAR(100) DEFAULT 'geral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS logs_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('debug', 'info', 'warn', 'error', 'fatal')),
    mensagem TEXT NOT NULL,
    contexto JSONB,
    usuario_id UUID REFERENCES usuarios(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS sessoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info' CHECK (tipo IN ('info', 'success', 'warning', 'error', 'premio', 'conquista')),
    lida BOOLEAN DEFAULT false,
    lida_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_ranking ON usuarios(ranking);

CREATE INDEX IF NOT EXISTS idx_partidas_status ON partidas(status);
CREATE INDEX IF NOT EXISTS idx_partidas_created_at ON partidas(created_at);

CREATE INDEX IF NOT EXISTS idx_partida_jogadores_partida ON partida_jogadores(partida_id);
CREATE INDEX IF NOT EXISTS idx_partida_jogadores_usuario ON partida_jogadores(usuario_id);

CREATE INDEX IF NOT EXISTS idx_chutes_partida ON chutes(partida_id);
CREATE INDEX IF NOT EXISTS idx_chutes_usuario ON chutes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_transacoes_usuario ON transacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status);

CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_usuario ON pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_status ON pagamentos_pix(status);

CREATE INDEX IF NOT EXISTS idx_saques_usuario ON saques(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_status ON saques(status);

CREATE INDEX IF NOT EXISTS idx_fila_jogadores_tipo ON fila_jogadores(tipo_fila);
CREATE INDEX IF NOT EXISTS idx_fila_jogadores_posicao ON fila_jogadores(posicao);

CREATE INDEX IF NOT EXISTS idx_ranking_periodo ON ranking(periodo);
CREATE INDEX IF NOT EXISTS idx_ranking_posicao ON ranking(posicao);

CREATE INDEX IF NOT EXISTS idx_logs_sistema_nivel ON logs_sistema(nivel);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_created_at ON logs_sistema(created_at);

CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token_hash);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partidas_updated_at BEFORE UPDATE ON partidas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_pix_updated_at BEFORE UPDATE ON pagamentos_pix
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saques_updated_at BEFORE UPDATE ON saques
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, tipo, descricao, categoria) VALUES
('jogo_valor_aposta_minimo', '1.00', 'number', 'Valor mínimo de aposta', 'jogo'),
('jogo_valor_aposta_maximo', '100.00', 'number', 'Valor máximo de aposta', 'jogo'),
('jogo_jogadores_por_partida', '10', 'number', 'Número de jogadores por partida', 'jogo'),
('jogo_tempo_espera_partida', '300', 'number', 'Tempo de espera para iniciar partida (segundos)', 'jogo'),
('pagamento_taxa_deposito', '0.00', 'number', 'Taxa de depósito', 'pagamento'),
('pagamento_taxa_saque', '2.00', 'number', 'Taxa de saque', 'pagamento'),
('pagamento_limite_saque_diario', '1000.00', 'number', 'Limite de saque diário', 'pagamento'),
('sistema_manutencao', 'false', 'boolean', 'Sistema em manutenção', 'sistema'),
('sistema_versao', '1.1.1', 'string', 'Versão atual do sistema', 'sistema')
ON CONFLICT (chave) DO NOTHING;

-- Inserir conquistas padrão
INSERT INTO conquistas (nome, descricao, icone, tipo, meta, recompensa) VALUES
('Primeiro Gol', 'Marque seu primeiro gol', '⚽', 'gols', 1, 5.00),
('Goleador', 'Marque 10 gols', '🥅', 'gols', 10, 25.00),
('Artilheiro', 'Marque 50 gols', '👑', 'gols', 50, 100.00),
('Primeira Partida', 'Jogue sua primeira partida', '🎮', 'partidas', 1, 2.00),
('Veterano', 'Jogue 100 partidas', '🏆', 'partidas', 100, 50.00),
('Apostador', 'Aposte R$ 100', '💰', 'apostas', 100, 10.00),
('High Roller', 'Aposte R$ 1000', '💎', 'apostas', 1000, 100.00),
('Lucky', 'Ganhe 5 partidas seguidas', '🍀', 'especial', 5, 75.00),
('Campeão', 'Fique em primeiro no ranking mensal', '🥇', 'especial', 1, 200.00)
ON CONFLICT DO NOTHING;


-- =====================================================
-- ARQUIVO: schema-completo.sql
-- =====================================================

-- 🗄️ ESTRUTURA COMPLETA DO BANCO DE DADOS - GOL DE OURO v1.1.1
-- Execute este SQL no Supabase para criar todas as tabelas necessárias

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  saldo DECIMAL(10,2) DEFAULT 0.00,
  role VARCHAR(20) DEFAULT 'player',
  account_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de chutes
CREATE TABLE IF NOT EXISTS chutes (
  id SERIAL PRIMARY KEY,
  lote_id VARCHAR(100) NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  zona VARCHAR(20) NOT NULL,
  potencia INTEGER NOT NULL,
  angulo INTEGER NOT NULL,
  valor_aposta DECIMAL(10,2) NOT NULL,
  resultado VARCHAR(20),
  gol_marcado BOOLEAN DEFAULT FALSE,
  premio DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de pagamentos PIX
CREATE TABLE IF NOT EXISTS pagamentos_pix (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  qr_code TEXT,
  qr_code_base64 TEXT,
  pix_copy_paste TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  tipo VARCHAR(20) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_posterior DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  referencia VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pendente',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de saques
CREATE TABLE IF NOT EXISTS saques (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  valor DECIMAL(10,2) NOT NULL,
  chave_pix VARCHAR(255) NOT NULL,
  tipo_chave VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Tabela de lotes (para controle)
CREATE TABLE IF NOT EXISTS lotes (
  id VARCHAR(100) PRIMARY KEY,
  chutes_coletados INTEGER DEFAULT 0,
  ganhador_indice INTEGER,
  status VARCHAR(20) DEFAULT 'coletando',
  created_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chutes_usuario ON chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote ON chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario ON pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario ON transacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_usuario ON saques(usuario_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saques ENABLE ROW LEVEL SECURITY;

-- Política para usuários (podem ver apenas seus próprios dados)
CREATE POLICY "Usuários podem ver apenas seus próprios dados" ON usuarios
  FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Usuários podem ver apenas seus próprios chutes" ON chutes
  FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem ver apenas seus próprios pagamentos" ON pagamentos_pix
  FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem ver apenas suas próprias transações" ON transacoes
  FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem ver apenas seus próprios saques" ON saques
  FOR ALL USING (auth.uid()::text = usuario_id::text);

-- Política para admins (podem ver tudo)
CREATE POLICY "Admins podem ver todos os usuários" ON usuarios
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins podem ver todos os chutes" ON chutes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins podem ver todos os pagamentos" ON pagamentos_pix
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins podem ver todas as transações" ON transacoes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins podem ver todos os saques" ON saques
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_pix_updated_at BEFORE UPDATE ON pagamentos_pix
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO usuarios (email, password_hash, username, saldo, role) VALUES
('admin@goldeouro.lol', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1000.00, 'admin')
ON CONFLICT (email) DO NOTHING;

-- Inserir usuário de teste (senha: test123)
INSERT INTO usuarios (email, password_hash, username, saldo, role) VALUES
('test@goldeouro.lol', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'testuser', 100.00, 'player')
ON CONFLICT (email) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema Gol de Ouro';
COMMENT ON TABLE chutes IS 'Tabela de chutes dos jogadores';
COMMENT ON TABLE pagamentos_pix IS 'Tabela de pagamentos PIX via Mercado Pago';
COMMENT ON TABLE transacoes IS 'Tabela de transações financeiras';
COMMENT ON TABLE saques IS 'Tabela de solicitações de saque';
COMMENT ON TABLE lotes IS 'Tabela de controle de lotes de chutes';

-- Verificar se as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('usuarios', 'chutes', 'pagamentos_pix', 'transacoes', 'saques', 'lotes')
ORDER BY table_name;



-- =====================================================
-- ARQUIVO: schema-lotes-persistencia.sql
-- =====================================================

-- =====================================================
-- SCHEMA: Persistência de Lotes Ativos
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Garantir que lotes sobrevivam reinicialização
--
-- Este schema melhora a persistência de lotes ativos,
-- garantindo que reinicialização do servidor não perca dados.
-- =====================================================

-- =====================================================
-- 1. ATUALIZAR TABELA LOTES (se necessário)
-- =====================================================

-- Garantir que tabela lotes existe com campos corretos
CREATE TABLE IF NOT EXISTS public.lotes (
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

-- Adicionar coluna completed_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.lotes ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lotes_status ON public.lotes(status);
CREATE INDEX IF NOT EXISTS idx_lotes_valor_aposta ON public.lotes(valor_aposta);
CREATE INDEX IF NOT EXISTS idx_lotes_created_at ON public.lotes(created_at);

-- =====================================================
-- 3. RPC FUNCTIONS: Gerenciar Lotes
-- =====================================================

-- Função: Criar ou obter lote ativo
CREATE OR REPLACE FUNCTION public.rpc_get_or_create_lote(
    p_lote_id VARCHAR(100),
    p_valor_aposta DECIMAL(10,2),
    p_tamanho INTEGER,
    p_indice_vencedor INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lote RECORD;
    v_result JSON;
BEGIN
    -- Verificar se existe lote ativo para este valor
    SELECT * INTO v_lote
    FROM public.lotes
    WHERE valor_aposta = p_valor_aposta
    AND status = 'ativo'
    AND posicao_atual < tamanho
    LIMIT 1;

    -- Se não existe, criar novo
    IF v_lote IS NULL THEN
        INSERT INTO public.lotes (
            id,
            valor_aposta,
            tamanho,
            posicao_atual,
            indice_vencedor,
            status,
            total_arrecadado,
            premio_total
        ) VALUES (
            p_lote_id,
            p_valor_aposta,
            p_tamanho,
            0,
            p_indice_vencedor,
            'ativo',
            0.00,
            0.00
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING * INTO v_lote;

        -- Se ainda não existe (conflito), buscar novamente
        IF v_lote IS NULL THEN
            SELECT * INTO v_lote
            FROM public.lotes
            WHERE id = p_lote_id;
        END IF;
    END IF;

    -- Retornar lote
    v_result := json_build_object(
        'success', true,
        'lote', json_build_object(
            'id', v_lote.id,
            'valor_aposta', v_lote.valor_aposta,
            'tamanho', v_lote.tamanho,
            'posicao_atual', v_lote.posicao_atual,
            'indice_vencedor', v_lote.indice_vencedor,
            'status', v_lote.status,
            'total_arrecadado', v_lote.total_arrecadado,
            'premio_total', v_lote.premio_total
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Função: Atualizar lote após chute
CREATE OR REPLACE FUNCTION public.rpc_update_lote_after_shot(
    p_lote_id VARCHAR(100),
    p_valor_aposta DECIMAL(10,2),
    p_premio DECIMAL(10,2) DEFAULT 0.00,
    p_premio_gol_de_ouro DECIMAL(10,2) DEFAULT 0.00,
    p_is_goal BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lote RECORD;
    v_nova_posicao INTEGER;
    v_novo_status VARCHAR(20);
    v_result JSON;
BEGIN
    -- Buscar lote
    SELECT * INTO v_lote
    FROM public.lotes
    WHERE id = p_lote_id
    FOR UPDATE;

    IF v_lote IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Lote não encontrado'
        );
    END IF;

    -- Atualizar posição e valores
    v_nova_posicao := v_lote.posicao_atual + 1;
    v_novo_status := v_lote.status;

    -- Se gol, finalizar lote
    IF p_is_goal THEN
        v_novo_status := 'completed';
    END IF;

    -- Se atingiu tamanho máximo, finalizar
    IF v_nova_posicao >= v_lote.tamanho THEN
        v_novo_status := 'completed';
    END IF;

    -- Atualizar lote
    UPDATE public.lotes
    SET 
        posicao_atual = v_nova_posicao,
        status = v_novo_status,
        total_arrecadado = total_arrecadado + p_valor_aposta,
        premio_total = premio_total + p_premio + p_premio_gol_de_ouro,
        updated_at = NOW(),
        completed_at = CASE WHEN v_novo_status = 'completed' THEN NOW() ELSE completed_at END
    WHERE id = p_lote_id
    RETURNING * INTO v_lote;

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'lote', json_build_object(
            'id', v_lote.id,
            'posicao_atual', v_lote.posicao_atual,
            'status', v_lote.status,
            'total_arrecadado', v_lote.total_arrecadado,
            'premio_total', v_lote.premio_total,
            'is_complete', v_lote.status = 'completed'
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Função: Sincronizar lotes ativos ao iniciar servidor
CREATE OR REPLACE FUNCTION public.rpc_get_active_lotes()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lote RECORD;
    v_lotes JSON[] := '{}';
    v_result JSON;
BEGIN
    -- Buscar todos os lotes ativos
    FOR v_lote IN
        SELECT *
        FROM public.lotes
        WHERE status = 'ativo'
        ORDER BY created_at ASC
    LOOP
        v_lotes := array_append(v_lotes, json_build_object(
            'id', v_lote.id,
            'valor_aposta', v_lote.valor_aposta,
            'tamanho', v_lote.tamanho,
            'posicao_atual', v_lote.posicao_atual,
            'indice_vencedor', v_lote.indice_vencedor,
            'status', v_lote.status,
            'total_arrecadado', v_lote.total_arrecadado,
            'premio_total', v_lote.premio_total,
            'created_at', v_lote.created_at
        ));
    END LOOP;

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'lotes', v_lotes,
        'count', array_length(v_lotes, 1)
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'lotes', '[]'::json,
            'count', 0
        );
END;
$$;

-- =====================================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.lotes IS 'Lotes ativos do sistema de jogo';
COMMENT ON FUNCTION public.rpc_get_or_create_lote IS 'Cria ou obtém lote ativo para valor de aposta';
COMMENT ON FUNCTION public.rpc_update_lote_after_shot IS 'Atualiza lote após chute (posição, valores, status)';
COMMENT ON FUNCTION public.rpc_get_active_lotes IS 'Retorna todos os lotes ativos para sincronização';

-- =====================================================
-- FIM DO SCHEMA DE PERSISTÊNCIA DE LOTES
-- =====================================================




-- =====================================================
-- ARQUIVO: schema-rewards.sql
-- =====================================================

-- =====================================================
-- SCHEMA: Sistema de Recompensas
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Garantir integridade financeira nas recompensas
--
-- Este schema implementa sistema completo de recompensas,
-- garantindo rastreabilidade e integridade financeira.
-- =====================================================

-- =====================================================
-- 1. TABELA REWARDS (Histórico de Recompensas)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.rewards (
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

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rewards_usuario_id ON public.rewards(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rewards_lote_id ON public.rewards(lote_id);
CREATE INDEX IF NOT EXISTS idx_rewards_chute_id ON public.rewards(chute_id);
CREATE INDEX IF NOT EXISTS idx_rewards_tipo ON public.rewards(tipo);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON public.rewards(created_at);
CREATE INDEX IF NOT EXISTS idx_rewards_usuario_tipo ON public.rewards(usuario_id, tipo);
CREATE INDEX IF NOT EXISTS idx_rewards_usuario_status ON public.rewards(usuario_id, status);

-- =====================================================
-- 3. RPC FUNCTIONS: Gerenciar Recompensas
-- =====================================================

-- Função: Registrar recompensa (sem creditar ainda)
CREATE OR REPLACE FUNCTION public.rpc_register_reward(
    p_usuario_id UUID,
    p_lote_id VARCHAR(100),
    p_chute_id UUID,
    p_tipo VARCHAR(50),
    p_valor DECIMAL(10,2),
    p_descricao TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward_id INTEGER;
    v_usuario_saldo DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- Validar parâmetros
    IF p_usuario_id IS NULL OR p_valor IS NULL OR p_valor <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Parâmetros inválidos: usuario_id e valor são obrigatórios'
        );
    END IF;

    -- Buscar saldo atual do usuário
    SELECT saldo INTO v_usuario_saldo
    FROM public.usuarios
    WHERE id = p_usuario_id;

    IF v_usuario_saldo IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;

    -- Inserir recompensa
    INSERT INTO public.rewards (
        usuario_id,
        lote_id,
        chute_id,
        tipo,
        valor,
        descricao,
        status,
        saldo_anterior,
        metadata,
        created_at
    ) VALUES (
        p_usuario_id,
        p_lote_id,
        p_chute_id,
        p_tipo,
        p_valor,
        p_descricao,
        'pendente',
        v_usuario_saldo,
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_reward_id;

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'reward_id', v_reward_id,
        'usuario_id', p_usuario_id,
        'valor', p_valor,
        'tipo', p_tipo,
        'status', 'pendente',
        'saldo_anterior', v_usuario_saldo
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Função: Marcar recompensa como creditada
CREATE OR REPLACE FUNCTION public.rpc_mark_reward_credited(
    p_reward_id INTEGER,
    p_transacao_id UUID,
    p_saldo_posterior DECIMAL(10,2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward RECORD;
    v_result JSON;
BEGIN
    -- Buscar recompensa
    SELECT * INTO v_reward
    FROM public.rewards
    WHERE id = p_reward_id
    FOR UPDATE;

    IF v_reward IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Recompensa não encontrada'
        );
    END IF;

    -- Atualizar status
    UPDATE public.rewards
    SET 
        status = 'creditado',
        transacao_id = p_transacao_id,
        saldo_posterior = p_saldo_posterior,
        credited_at = NOW(),
        updated_at = NOW()
    WHERE id = p_reward_id;

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'reward_id', p_reward_id,
        'status', 'creditado',
        'transacao_id', p_transacao_id
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Função: Obter recompensas de um usuário
CREATE OR REPLACE FUNCTION public.rpc_get_user_rewards(
    p_usuario_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_tipo VARCHAR(50) DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward RECORD;
    v_rewards JSON[] := '{}';
    v_total_count INTEGER;
    v_result JSON;
BEGIN
    -- Contar total
    SELECT COUNT(*) INTO v_total_count
    FROM public.rewards
    WHERE usuario_id = p_usuario_id
    AND (p_tipo IS NULL OR tipo = p_tipo)
    AND (p_status IS NULL OR status = p_status);

    -- Buscar recompensas
    FOR v_reward IN
        SELECT *
        FROM public.rewards
        WHERE usuario_id = p_usuario_id
        AND (p_tipo IS NULL OR tipo = p_tipo)
        AND (p_status IS NULL OR status = p_status)
        ORDER BY created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    LOOP
        v_rewards := array_append(v_rewards, json_build_object(
            'id', v_reward.id,
            'lote_id', v_reward.lote_id,
            'chute_id', v_reward.chute_id,
            'tipo', v_reward.tipo,
            'valor', v_reward.valor,
            'descricao', v_reward.descricao,
            'status', v_reward.status,
            'saldo_anterior', v_reward.saldo_anterior,
            'saldo_posterior', v_reward.saldo_posterior,
            'created_at', v_reward.created_at,
            'credited_at', v_reward.credited_at,
            'metadata', v_reward.metadata
        ));
    END LOOP;

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'rewards', v_rewards,
        'total', v_total_count,
        'limit', p_limit,
        'offset', p_offset
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'rewards', '[]'::json,
            'total', 0
        );
END;
$$;

-- =====================================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.rewards IS 'Histórico completo de todas as recompensas dadas aos jogadores';
COMMENT ON FUNCTION public.rpc_register_reward IS 'Registra uma nova recompensa (status: pendente)';
COMMENT ON FUNCTION public.rpc_mark_reward_credited IS 'Marca recompensa como creditada após usar FinancialService';
COMMENT ON FUNCTION public.rpc_get_user_rewards IS 'Retorna histórico de recompensas de um usuário com paginação';

-- =====================================================
-- FIM DO SCHEMA DE RECOMPENSAS
-- =====================================================




-- =====================================================
-- ARQUIVO: schema-webhook-events.sql
-- =====================================================

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




-- =====================================================
-- ARQUIVO: rpc-financial-acid.sql
-- =====================================================

-- =====================================================
-- RPC FUNCTIONS PARA SISTEMA FINANCEIRO ACID
-- Gol de Ouro v4.0 - Fase 1: Sistema Financeiro ACID
-- =====================================================
-- Data: 2025-01-12
-- Status: CRÍTICO - Garantir integridade financeira
-- 
-- Estas funções garantem operações ACID para atualização de saldo,
-- eliminando race conditions e garantindo consistência total.
-- =====================================================

-- =====================================================
-- FUNÇÃO 1: Adicionar Saldo (Crédito) com Transação ACID
-- =====================================================
-- Esta função adiciona saldo ao usuário de forma segura e atômica,
-- criando automaticamente o registro de transação.
-- 
-- Parâmetros:
--   p_user_id: UUID do usuário
--   p_amount: Valor a ser creditado (DECIMAL positivo)
--   p_description: Descrição da transação
--   p_reference_id: ID de referência (ex: payment_id, reward_id)
--   p_reference_type: Tipo de referência (ex: 'deposito', 'premio')
--
-- Retorna:
--   JSON com { success: boolean, new_balance: decimal, transaction_id: integer, error: text }
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_add_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT DEFAULT NULL,
  p_reference_id INTEGER DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id INTEGER;
  v_error TEXT;
BEGIN
  -- Validar parâmetros
  IF p_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User ID é obrigatório'
    );
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Valor deve ser maior que zero'
    );
  END IF;

  -- Iniciar transação implícita (cada função RPC é uma transação)
  -- Usar SELECT FOR UPDATE para lock de linha (row-level locking)
  SELECT saldo INTO v_old_balance
  FROM public.usuarios
  WHERE id = p_user_id
  FOR UPDATE; -- 🔒 LOCK: Garante que nenhuma outra operação modifique este saldo simultaneamente

  -- Verificar se usuário existe
  IF v_old_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Calcular novo saldo
  v_new_balance := v_old_balance + p_amount;

  -- Atualizar saldo do usuário (dentro da mesma transação)
  UPDATE public.usuarios
  SET saldo = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Criar registro de transação (dentro da mesma transação)
  INSERT INTO public.transacoes (
    usuario_id,
    tipo,
    valor,
    saldo_anterior,
    saldo_posterior,
    descricao,
    referencia_id,
    referencia_tipo,
    status,
    processed_at
  ) VALUES (
    p_user_id,
    'credito',
    p_amount,
    v_old_balance,
    v_new_balance,
    COALESCE(p_description, 'Crédito de saldo'),
    p_reference_id,
    p_reference_type,
    'concluido',
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Retornar sucesso com dados
  RETURN json_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, fazer rollback automático (transação implícita)
    v_error := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- =====================================================
-- FUNÇÃO 2: Deduzir Saldo (Débito) com Transação ACID
-- =====================================================
-- Esta função deduz saldo do usuário de forma segura e atômica,
-- verificando saldo suficiente e criando registro de transação.
-- 
-- Parâmetros:
--   p_user_id: UUID do usuário
--   p_amount: Valor a ser debitado (DECIMAL positivo)
--   p_description: Descrição da transação
--   p_reference_id: ID de referência
--   p_reference_type: Tipo de referência (ex: 'saque', 'aposta')
--   p_allow_negative: BOOLEAN - Permitir saldo negativo? (padrão: false)
--
-- Retorna:
--   JSON com { success: boolean, new_balance: decimal, transaction_id: integer, error: text }
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_deduct_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT DEFAULT NULL,
  p_reference_id INTEGER DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL,
  p_allow_negative BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id INTEGER;
  v_error TEXT;
BEGIN
  -- Validar parâmetros
  IF p_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User ID é obrigatório'
    );
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Valor deve ser maior que zero'
    );
  END IF;

  -- Iniciar transação implícita com lock de linha
  SELECT saldo INTO v_old_balance
  FROM public.usuarios
  WHERE id = p_user_id
  FOR UPDATE; -- 🔒 LOCK: Garante que nenhuma outra operação modifique este saldo simultaneamente

  -- Verificar se usuário existe
  IF v_old_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Verificar saldo suficiente (se não permitir negativo)
  IF NOT p_allow_negative AND v_old_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Saldo insuficiente',
      'current_balance', v_old_balance,
      'required_amount', p_amount,
      'shortage', p_amount - v_old_balance
    );
  END IF;

  -- Calcular novo saldo
  v_new_balance := v_old_balance - p_amount;

  -- Atualizar saldo do usuário (dentro da mesma transação)
  UPDATE public.usuarios
  SET saldo = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Criar registro de transação (dentro da mesma transação)
  INSERT INTO public.transacoes (
    usuario_id,
    tipo,
    valor,
    saldo_anterior,
    saldo_posterior,
    descricao,
    referencia_id,
    referencia_tipo,
    status,
    processed_at
  ) VALUES (
    p_user_id,
    'debito',
    -p_amount, -- Valor negativo para débito
    v_old_balance,
    v_new_balance,
    COALESCE(p_description, 'Débito de saldo'),
    p_reference_id,
    p_reference_type,
    'concluido',
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Retornar sucesso com dados
  RETURN json_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, fazer rollback automático
    v_error := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- =====================================================
-- FUNÇÃO 3: Transferir Saldo entre Usuários (ACID)
-- =====================================================
-- Esta função transfere saldo de um usuário para outro de forma atômica,
-- garantindo que ambas as operações aconteçam ou nenhuma aconteça.
-- 
-- Parâmetros:
--   p_from_user_id: UUID do usuário origem
--   p_to_user_id: UUID do usuário destino
--   p_amount: Valor a ser transferido
--   p_description: Descrição da transação
--
-- Retorna:
--   JSON com { success: boolean, from_balance: decimal, to_balance: decimal, transaction_ids: integer[], error: text }
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_transfer_balance(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_old_balance DECIMAL(10,2);
  v_from_new_balance DECIMAL(10,2);
  v_to_old_balance DECIMAL(10,2);
  v_to_new_balance DECIMAL(10,2);
  v_from_transaction_id INTEGER;
  v_to_transaction_id INTEGER;
  v_error TEXT;
BEGIN
  -- Validar parâmetros
  IF p_from_user_id IS NULL OR p_to_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'IDs de usuário são obrigatórios'
    );
  END IF;

  IF p_from_user_id = p_to_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Não é possível transferir para o mesmo usuário'
    );
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Valor deve ser maior que zero'
    );
  END IF;

  -- Lock ambas as linhas simultaneamente (ordem fixa para evitar deadlock)
  -- Ordenar por UUID para garantir ordem consistente
  IF p_from_user_id < p_to_user_id THEN
    -- Lock origem primeiro
    SELECT saldo INTO v_from_old_balance
    FROM public.usuarios
    WHERE id = p_from_user_id
    FOR UPDATE;

    -- Lock destino segundo
    SELECT saldo INTO v_to_old_balance
    FROM public.usuarios
    WHERE id = p_to_user_id
    FOR UPDATE;
  ELSE
    -- Lock destino primeiro
    SELECT saldo INTO v_to_old_balance
    FROM public.usuarios
    WHERE id = p_to_user_id
    FOR UPDATE;

    -- Lock origem segundo
    SELECT saldo INTO v_from_old_balance
    FROM public.usuarios
    WHERE id = p_from_user_id
    FOR UPDATE;
  END IF;

  -- Verificar se ambos usuários existem
  IF v_from_old_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário origem não encontrado'
    );
  END IF;

  IF v_to_old_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário destino não encontrado'
    );
  END IF;

  -- Verificar saldo suficiente
  IF v_from_old_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Saldo insuficiente para transferência',
      'current_balance', v_from_old_balance,
      'required_amount', p_amount
    );
  END IF;

  -- Calcular novos saldos
  v_from_new_balance := v_from_old_balance - p_amount;
  v_to_new_balance := v_to_old_balance + p_amount;

  -- Atualizar saldo do usuário origem
  UPDATE public.usuarios
  SET saldo = v_from_new_balance,
      updated_at = NOW()
  WHERE id = p_from_user_id;

  -- Atualizar saldo do usuário destino
  UPDATE public.usuarios
  SET saldo = v_to_new_balance,
      updated_at = NOW()
  WHERE id = p_to_user_id;

  -- Criar transação de débito (origem)
  INSERT INTO public.transacoes (
    usuario_id,
    tipo,
    valor,
    saldo_anterior,
    saldo_posterior,
    descricao,
    referencia_id,
    referencia_tipo,
    status,
    processed_at
  ) VALUES (
    p_from_user_id,
    'debito',
    -p_amount,
    v_from_old_balance,
    v_from_new_balance,
    COALESCE(p_description, 'Transferência enviada') || ' → ' || p_to_user_id::text,
    NULL,
    'transferencia',
    'concluido',
    NOW()
  ) RETURNING id INTO v_from_transaction_id;

  -- Criar transação de crédito (destino)
  INSERT INTO public.transacoes (
    usuario_id,
    tipo,
    valor,
    saldo_anterior,
    saldo_posterior,
    descricao,
    referencia_id,
    referencia_tipo,
    status,
    processed_at
  ) VALUES (
    p_to_user_id,
    'credito',
    p_amount,
    v_to_old_balance,
    v_to_new_balance,
    COALESCE(p_description, 'Transferência recebida') || ' ← ' || p_from_user_id::text,
    NULL,
    'transferencia',
    'concluido',
    NOW()
  ) RETURNING id INTO v_to_transaction_id;

  -- Retornar sucesso com dados
  RETURN json_build_object(
    'success', true,
    'from_balance', v_from_new_balance,
    'to_balance', v_to_new_balance,
    'transaction_ids', ARRAY[v_from_transaction_id, v_to_transaction_id],
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, fazer rollback automático
    v_error := SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- =====================================================
-- FUNÇÃO 4: Obter Saldo Atual (com Lock Opcional)
-- =====================================================
-- Esta função retorna o saldo atual do usuário.
-- Útil para verificação antes de operações críticas.
-- 
-- Parâmetros:
--   p_user_id: UUID do usuário
--   p_with_lock: BOOLEAN - Fazer lock da linha? (padrão: false)
--
-- Retorna:
--   JSON com { success: boolean, balance: decimal, error: text }
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_get_balance(
  p_user_id UUID,
  p_with_lock BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL(10,2);
  v_error TEXT;
BEGIN
  -- Validar parâmetros
  IF p_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User ID é obrigatório'
    );
  END IF;

  -- Buscar saldo (com ou sem lock)
  IF p_with_lock THEN
    SELECT saldo INTO v_balance
    FROM public.usuarios
    WHERE id = p_user_id
    FOR UPDATE; -- 🔒 LOCK: Para operações que precisam garantir consistência
  ELSE
    SELECT saldo INTO v_balance
    FROM public.usuarios
    WHERE id = p_user_id;
  END IF;

  -- Verificar se usuário existe
  IF v_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Retornar sucesso com saldo
  RETURN json_build_object(
    'success', true,
    'balance', v_balance
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
-- GRANT PERMISSIONS
-- =====================================================
-- Permitir que service_role execute essas funções
-- (já são SECURITY DEFINER, então executam com privilégios elevados)

-- Nota: Em produção, essas funções devem ser chamadas apenas pelo backend
-- usando service_role key, nunca diretamente pelo frontend.

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.rpc_add_balance IS 'Adiciona saldo ao usuário de forma ACID, criando transação automaticamente';
COMMENT ON FUNCTION public.rpc_deduct_balance IS 'Deduz saldo do usuário de forma ACID, verificando saldo suficiente';
COMMENT ON FUNCTION public.rpc_transfer_balance IS 'Transfere saldo entre usuários de forma ACID (ambas operações atômicas)';
COMMENT ON FUNCTION public.rpc_get_balance IS 'Obtém saldo atual do usuário (com lock opcional)';

-- =====================================================
-- FIM DO ARQUIVO RPC FINANCIAL ACID
-- =====================================================



