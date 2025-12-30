-- SCHEMA PARA SISTEMA DE HISTÓRICO COMPLETO
-- ==========================================

-- Tabela principal para histórico de transações
CREATE TABLE IF NOT EXISTS public.user_transaction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'deposit', 'withdraw', 'game_bet', 'prize', 'bonus'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id UUID, -- ID da transação relacionada (pagamento, saque, chute)
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_transaction_history_usuario_id ON public.user_transaction_history(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_transaction_history_type ON public.user_transaction_history(type);
CREATE INDEX IF NOT EXISTS idx_user_transaction_history_created_at ON public.user_transaction_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_transaction_history_reference_id ON public.user_transaction_history(reference_id);
CREATE INDEX IF NOT EXISTS idx_user_transaction_history_status ON public.user_transaction_history(status);

-- Índice composto para consultas complexas
CREATE INDEX IF NOT EXISTS idx_user_transaction_history_user_type_date ON public.user_transaction_history(usuario_id, type, created_at);

-- RLS (Row Level Security)
ALTER TABLE public.user_transaction_history ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own transaction history" ON public.user_transaction_history
    FOR SELECT USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Service role can manage all transaction history" ON public.user_transaction_history
    FOR ALL USING (auth.role() = 'service_role');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_transaction_history_updated_at 
    BEFORE UPDATE ON public.user_transaction_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View para estatísticas de transações por usuário
CREATE OR REPLACE VIEW public.user_transaction_stats AS
SELECT 
    usuario_id,
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    COUNT(CASE WHEN type = 'deposit' THEN 1 END) as total_deposits,
    SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposit_amount,
    COUNT(CASE WHEN type = 'withdraw' THEN 1 END) as total_withdrawals,
    SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as total_withdrawal_amount,
    COUNT(CASE WHEN type = 'game_bet' THEN 1 END) as total_bets,
    SUM(CASE WHEN type = 'game_bet' THEN amount ELSE 0 END) as total_bet_amount,
    COUNT(CASE WHEN type = 'prize' THEN 1 END) as total_prizes,
    SUM(CASE WHEN type = 'prize' THEN amount ELSE 0 END) as total_prize_amount,
    MAX(created_at) as last_transaction_date,
    MIN(created_at) as first_transaction_date
FROM public.user_transaction_history
GROUP BY usuario_id;

-- View para estatísticas globais do sistema
CREATE OR REPLACE VIEW public.system_transaction_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_transactions,
    SUM(amount) as total_volume,
    COUNT(CASE WHEN type = 'deposit' THEN 1 END) as deposits_count,
    SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as deposits_volume,
    COUNT(CASE WHEN type = 'withdraw' THEN 1 END) as withdrawals_count,
    SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as withdrawals_volume,
    COUNT(CASE WHEN type = 'game_bet' THEN 1 END) as bets_count,
    SUM(CASE WHEN type = 'game_bet' THEN amount ELSE 0 END) as bets_volume,
    COUNT(CASE WHEN type = 'prize' THEN 1 END) as prizes_count,
    SUM(CASE WHEN type = 'prize' THEN amount ELSE 0 END) as prizes_volume
FROM public.user_transaction_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
