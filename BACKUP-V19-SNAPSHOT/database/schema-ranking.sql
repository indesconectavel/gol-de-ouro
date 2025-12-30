-- SCHEMA PARA SISTEMA DE RANKING E ESTATÍSTICAS
-- ==============================================

-- Adicionar coluna de posição no ranking na tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS ranking_position INTEGER DEFAULT NULL;

-- Adicionar coluna de última atualização do ranking
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS ranking_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Índice para performance do ranking
CREATE INDEX IF NOT EXISTS idx_usuarios_ranking_position ON public.usuarios(ranking_position);
CREATE INDEX IF NOT EXISTS idx_usuarios_total_ganhos ON public.usuarios(total_ganhos DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_total_apostas ON public.usuarios(total_apostas DESC);

-- Tabela para cache de estatísticas do sistema
CREATE TABLE IF NOT EXISTS public.system_stats_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_type VARCHAR(50) NOT NULL,
    stat_data JSONB NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT 'all', -- 'all', 'month', 'week', 'day'
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    UNIQUE(stat_type, period)
);

-- Índices para cache de estatísticas
CREATE INDEX IF NOT EXISTS idx_system_stats_cache_type_period ON public.system_stats_cache(stat_type, period);
CREATE INDEX IF NOT EXISTS idx_system_stats_cache_expires_at ON public.system_stats_cache(expires_at);

-- Tabela para histórico de rankings (snapshots)
CREATE TABLE IF NOT EXISTS public.ranking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ranking_type VARCHAR(50) NOT NULL, -- 'general', 'biggest_winners', 'most_active', etc.
    period VARCHAR(20) NOT NULL DEFAULT 'all',
    ranking_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para histórico de rankings
CREATE INDEX IF NOT EXISTS idx_ranking_history_type_period ON public.ranking_history(ranking_type, period);
CREATE INDEX IF NOT EXISTS idx_ranking_history_created_at ON public.ranking_history(created_at);

-- View para ranking geral atual
CREATE OR REPLACE VIEW public.current_ranking AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.total_apostas,
    u.total_ganhos,
    u.saldo,
    u.ranking_position,
    u.created_at,
    CASE 
        WHEN u.total_apostas > 0 THEN 
            (SELECT COUNT(*) FROM public.chutes c WHERE c.usuario_id = u.id AND c.result = 'goal')::FLOAT / u.total_apostas * 100
        ELSE 0 
    END as win_rate,
    (SELECT MAX(c.premio + c.premio_gol_de_ouro) FROM public.chutes c WHERE c.usuario_id = u.id AND c.result = 'goal') as biggest_win,
    (SELECT COUNT(*) FROM public.chutes c WHERE c.usuario_id = u.id AND c.premio_gol_de_ouro > 0) as gol_de_ouro_count
FROM public.usuarios u
WHERE u.ativo = true AND u.total_apostas > 0
ORDER BY u.total_ganhos DESC;

-- View para estatísticas de jogos por usuário
CREATE OR REPLACE VIEW public.user_game_stats AS
SELECT 
    u.id as usuario_id,
    u.username,
    COUNT(c.id) as total_shots,
    COUNT(CASE WHEN c.result = 'goal' THEN 1 END) as total_wins,
    SUM(c.amount) as total_bet_amount,
    SUM(CASE WHEN c.result = 'goal' THEN c.premio + c.premio_gol_de_ouro ELSE 0 END) as total_prize_amount,
    MAX(CASE WHEN c.result = 'goal' THEN c.premio + c.premio_gol_de_ouro ELSE 0 END) as biggest_win,
    COUNT(CASE WHEN c.premio_gol_de_ouro > 0 THEN 1 END) as gol_de_ouro_count,
    AVG(c.amount) as average_bet,
    CASE 
        WHEN COUNT(c.id) > 0 THEN 
            COUNT(CASE WHEN c.result = 'goal' THEN 1 END)::FLOAT / COUNT(c.id) * 100
        ELSE 0 
    END as win_rate
FROM public.usuarios u
LEFT JOIN public.chutes c ON u.id = c.usuario_id
WHERE u.ativo = true
GROUP BY u.id, u.username;

-- View para estatísticas globais do sistema
CREATE OR REPLACE VIEW public.system_game_stats AS
SELECT 
    COUNT(DISTINCT u.id) as total_players,
    COUNT(DISTINCT CASE WHEN u.total_apostas > 0 THEN u.id END) as active_players,
    COUNT(c.id) as total_shots,
    SUM(c.amount) as total_volume,
    SUM(CASE WHEN c.result = 'goal' THEN c.premio + c.premio_gol_de_ouro ELSE 0 END) as total_prizes,
    COUNT(CASE WHEN c.premio_gol_de_ouro > 0 THEN 1 END) as gol_de_ouro_count,
    AVG(c.amount) as average_bet,
    CASE 
        WHEN COUNT(c.id) > 0 THEN 
            COUNT(CASE WHEN c.result = 'goal' THEN 1 END)::FLOAT / COUNT(c.id) * 100
        ELSE 0 
    END as global_win_rate,
    COUNT(DISTINCT CASE WHEN DATE(u.created_at) = CURRENT_DATE THEN u.id END) as new_players_today
FROM public.usuarios u
LEFT JOIN public.chutes c ON u.id = c.usuario_id
WHERE u.ativo = true;

-- Função para atualizar ranking automaticamente
CREATE OR REPLACE FUNCTION update_user_ranking()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar posição no ranking baseado no total_ganhos
    UPDATE public.usuarios 
    SET 
        ranking_position = subquery.rank,
        ranking_updated_at = NOW()
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY total_ganhos DESC) as rank
        FROM public.usuarios 
        WHERE ativo = true AND total_apostas > 0
    ) subquery
    WHERE public.usuarios.id = subquery.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar ranking quando total_ganhos muda
CREATE OR REPLACE TRIGGER trigger_update_ranking
    AFTER UPDATE OF total_ganhos ON public.usuarios
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_user_ranking();

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.system_stats_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas em cache ou calcular
CREATE OR REPLACE FUNCTION get_cached_stats(stat_type_param VARCHAR, period_param VARCHAR DEFAULT 'all')
RETURNS JSONB AS $$
DECLARE
    cached_data JSONB;
    result JSONB;
BEGIN
    -- Tentar buscar do cache
    SELECT stat_data INTO cached_data
    FROM public.system_stats_cache
    WHERE stat_type = stat_type_param 
      AND period = period_param 
      AND expires_at > NOW();
    
    -- Se não encontrou no cache, calcular e salvar
    IF cached_data IS NULL THEN
        -- Calcular estatísticas baseado no tipo
        CASE stat_type_param
            WHEN 'general_ranking' THEN
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'username', username,
                        'total_ganhos', total_ganhos,
                        'total_apostas', total_apostas,
                        'win_rate', win_rate,
                        'ranking_position', ranking_position
                    )
                ) INTO result
                FROM public.current_ranking
                LIMIT 50;
                
            WHEN 'system_stats' THEN
                SELECT row_to_json(t) INTO result
                FROM public.system_game_stats t;
                
            ELSE
                result := '{}'::jsonb;
        END CASE;
        
        -- Salvar no cache
        INSERT INTO public.system_stats_cache (stat_type, stat_data, period, expires_at)
        VALUES (stat_type_param, result, period_param, NOW() + INTERVAL '1 hour')
        ON CONFLICT (stat_type, period) 
        DO UPDATE SET 
            stat_data = result,
            calculated_at = NOW(),
            expires_at = NOW() + INTERVAL '1 hour';
            
        cached_data := result;
    END IF;
    
    RETURN cached_data;
END;
$$ LANGUAGE plpgsql;
