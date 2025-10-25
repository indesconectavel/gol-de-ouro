-- SCHEMA PARA SISTEMA DE NOTIFICAÇÕES PUSH
-- =========================================

-- Tabela para armazenar subscriptions dos usuários
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, endpoint)
);

-- Tabela para histórico de notificações
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'general',
    data JSONB,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_usuario_id ON public.user_subscriptions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_usuario_id ON public.notification_history(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON public.notification_history(type);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON public.notification_history(sent_at);

-- RLS (Row Level Security)
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can manage their own subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Users can view their own notification history" ON public.notification_history
    FOR SELECT USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Service role can manage all notifications" ON public.notification_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');
