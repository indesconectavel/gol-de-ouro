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