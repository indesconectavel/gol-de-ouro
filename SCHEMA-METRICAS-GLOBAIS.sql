-- SCHEMA PARA MÉTRICAS GLOBAIS
-- =====================================================
-- Data: 17/10/2025
-- Status: CRIAR TABELA DE MÉTRICAS GLOBAIS
-- Versão: v4.2-metricas-globais

-- 1. Criar tabela de métricas globais
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

-- 2. Inserir registro inicial se não existir
INSERT INTO public.metricas_globais (contador_chutes_global, ultimo_gol_de_ouro)
SELECT 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.metricas_globais);

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_metricas_globais_created_at 
ON public.metricas_globais(created_at DESC);

-- 4. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'metricas_globais' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar dados iniciais
SELECT * FROM public.metricas_globais ORDER BY created_at DESC LIMIT 1;
