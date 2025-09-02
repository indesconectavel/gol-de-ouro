-- Schema do Banco de Dados - Gol de Ouro - Fase 3
-- Sistema de Jogos com 5 Opções de Chute

-- Atualizar tabela de jogos para nova mecânica
ALTER TABLE games ADD COLUMN IF NOT EXISTS bet_amount DECIMAL(10,2) DEFAULT 1.00;
ALTER TABLE games ADD COLUMN IF NOT EXISTS total_pot DECIMAL(10,2) DEFAULT 10.00;
ALTER TABLE games ADD COLUMN IF NOT EXISTS winner_prize DECIMAL(10,2) DEFAULT 5.00;
ALTER TABLE games ADD COLUMN IF NOT EXISTS house_cut DECIMAL(10,2) DEFAULT 5.00;
ALTER TABLE games ADD COLUMN IF NOT EXISTS winner_user_id INTEGER REFERENCES users(id);
ALTER TABLE games ADD COLUMN IF NOT EXISTS winner_selected_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_started_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_finished_at TIMESTAMP;

-- Tabela de opções de chute
CREATE TABLE IF NOT EXISTS shot_options (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(100),
    position_x DECIMAL(5,2) NOT NULL, -- Posição X no gol (0-100)
    position_y DECIMAL(5,2) NOT NULL, -- Posição Y no gol (0-100)
    difficulty_level INTEGER DEFAULT 1, -- 1-5 (facilidade de acertar)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir as 5 opções de chute
INSERT INTO shot_options (name, description, position_x, position_y, difficulty_level) VALUES
('Canto Superior Esquerdo', 'Chute no canto superior esquerdo', 20, 20, 2),
('Canto Superior Direito', 'Chute no canto superior direito', 80, 20, 2),
('Centro Superior', 'Chute no centro superior', 50, 15, 1),
('Canto Inferior Esquerdo', 'Chute no canto inferior esquerdo', 20, 80, 3),
('Canto Inferior Direito', 'Chute no canto inferior direito', 80, 80, 3)
ON CONFLICT DO NOTHING;

-- Tabela de chutes dos jogadores
CREATE TABLE IF NOT EXISTS player_shots (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    shot_option_id INTEGER NOT NULL REFERENCES shot_options(id),
    was_winner BOOLEAN DEFAULT FALSE,
    was_goal BOOLEAN DEFAULT FALSE,
    shot_time TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de animações de jogo
CREATE TABLE IF NOT EXISTS game_animations (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    animation_type VARCHAR(50) NOT NULL, -- 'shot', 'save', 'goal', 'miss', 'golden_goal'
    animation_data JSONB, -- Dados específicos da animação
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de contadores globais
CREATE TABLE IF NOT EXISTS global_counters (
    id SERIAL PRIMARY KEY,
    counter_name VARCHAR(50) UNIQUE NOT NULL,
    counter_value BIGINT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Inserir contador de chutes
INSERT INTO global_counters (counter_name, counter_value) VALUES ('total_shots', 0) ON CONFLICT (counter_name) DO NOTHING;

-- Atualizar tabela de fila para nova mecânica
ALTER TABLE queue_board ADD COLUMN IF NOT EXISTS bet_amount DECIMAL(10,2) DEFAULT 1.00;
ALTER TABLE queue_board ADD COLUMN IF NOT EXISTS game_id INTEGER REFERENCES games(id);
ALTER TABLE queue_board ADD COLUMN IF NOT EXISTS shot_option_id INTEGER REFERENCES shot_options(id);
ALTER TABLE queue_board ADD COLUMN IF NOT EXISTS shot_time TIMESTAMP;
ALTER TABLE queue_board ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT FALSE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_board_status ON queue_board(status);
CREATE INDEX IF NOT EXISTS idx_queue_board_game_id ON queue_board(game_id);
CREATE INDEX IF NOT EXISTS idx_player_shots_game_id ON player_shots(game_id);
CREATE INDEX IF NOT EXISTS idx_player_shots_user_id ON player_shots(user_id);
CREATE INDEX IF NOT EXISTS idx_shot_options_difficulty ON shot_options(difficulty_level);

-- Função para criar nova partida
CREATE OR REPLACE FUNCTION create_new_game()
RETURNS INTEGER AS $$
DECLARE
    new_game_id INTEGER;
BEGIN
    INSERT INTO games (
        players, 
        status, 
        bet_amount, 
        total_pot, 
        winner_prize, 
        house_cut,
        created_at
    ) VALUES (
        '[]'::jsonb, 
        'waiting', 
        1.00, 
        10.00, 
        5.00, 
        5.00,
        NOW()
    ) RETURNING id INTO new_game_id;
    
    RETURN new_game_id;
END;
$$ LANGUAGE plpgsql;

-- Função para selecionar vencedor aleatório
CREATE OR REPLACE FUNCTION select_random_winner(game_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    winner_user_id INTEGER;
    game_players INTEGER[];
BEGIN
    -- Buscar jogadores da partida
    SELECT players INTO game_players FROM games WHERE id = game_id;
    
    -- Selecionar vencedor aleatório
    SELECT game_players[floor(random() * array_length(game_players, 1)) + 1] INTO winner_user_id;
    
    -- Atualizar jogo com vencedor
    UPDATE games 
    SET winner_user_id = winner_user_id, 
        winner_selected_at = NOW(),
        status = 'active',
        game_started_at = NOW()
    WHERE id = game_id;
    
    RETURN winner_user_id;
END;
$$ LANGUAGE plpgsql;

-- Função para processar chute
CREATE OR REPLACE FUNCTION process_shot(
    p_game_id INTEGER,
    p_user_id INTEGER,
    p_shot_option_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    is_winner BOOLEAN := FALSE;
    is_goal BOOLEAN := FALSE;
    is_golden_goal BOOLEAN := FALSE;
    winner_user_id INTEGER;
    total_shots BIGINT;
    golden_goal_prize DECIMAL(10,2) := 50.00;
BEGIN
    -- Verificar se é o vencedor
    SELECT winner_user_id INTO winner_user_id FROM games WHERE id = p_game_id;
    is_winner := (p_user_id = winner_user_id);
    is_goal := is_winner; -- Se é vencedor, marca gol
    
    -- Atualizar contador global de chutes
    UPDATE global_counters 
    SET counter_value = counter_value + 1, last_updated = NOW() 
    WHERE counter_name = 'total_shots' 
    RETURNING counter_value INTO total_shots;
    
    -- Verificar se é o milésimo chute (Gol de Ouro)
    IF total_shots % 1000 = 0 AND is_goal THEN
        is_golden_goal := TRUE;
    END IF;
    
    -- Registrar chute
    INSERT INTO player_shots (game_id, user_id, shot_option_id, was_winner, was_goal)
    VALUES (p_game_id, p_user_id, p_shot_option_id, is_winner, is_goal);
    
    -- Registrar animação especial para Gol de Ouro
    IF is_golden_goal THEN
        INSERT INTO game_animations (game_id, user_id, animation_type, animation_data)
        VALUES (p_game_id, p_user_id, 'golden_goal', 
                jsonb_build_object(
                    'shot_number', total_shots,
                    'prize_amount', golden_goal_prize,
                    'special_animation', true
                ));
    END IF;
    
    -- Se marcou gol, creditar prêmio
    IF is_goal THEN
        -- Prêmio normal + prêmio especial se for Gol de Ouro
        IF is_golden_goal THEN
            UPDATE users SET balance = balance + 5.00 + golden_goal_prize WHERE id = p_user_id;
            INSERT INTO transactions (user_id, amount, type) VALUES (p_user_id, 5.00, 'reward');
            INSERT INTO transactions (user_id, amount, type) VALUES (p_user_id, golden_goal_prize, 'golden_goal');
        ELSE
            UPDATE users SET balance = balance + 5.00 WHERE id = p_user_id;
            INSERT INTO transactions (user_id, amount, type) VALUES (p_user_id, 5.00, 'reward');
        END IF;
    END IF;
    
    RETURN is_goal;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_shots_updated_at
    BEFORE UPDATE ON player_shots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
