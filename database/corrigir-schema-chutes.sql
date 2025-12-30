-- =====================================================
-- CORREÇÃO: Adicionar colunas direcao e valor_aposta
-- =====================================================
-- Data: 2025-11-24
-- Descrição: Adiciona colunas necessárias para sistema atual
--            O código usa 'direcao' e 'valor_aposta' mas schema antigo usa 'zona', 'potencia', 'angulo'
-- =====================================================

-- Adicionar coluna direcao se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chutes' 
        AND column_name = 'direcao'
    ) THEN
        ALTER TABLE public.chutes ADD COLUMN direcao INTEGER;
        RAISE NOTICE '✅ Coluna direcao adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna direcao já existe';
    END IF;
END $$;

-- Adicionar coluna valor_aposta se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chutes' 
        AND column_name = 'valor_aposta'
    ) THEN
        ALTER TABLE public.chutes ADD COLUMN valor_aposta DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna valor_aposta adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna valor_aposta já existe';
    END IF;
END $$;

-- Migrar dados antigos (se existirem e colunas antigas existirem)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chutes' 
        AND column_name = 'zona'
    ) THEN
        -- Migrar zona para direcao
        UPDATE public.chutes 
        SET direcao = CASE 
            WHEN zona = 'center' THEN 1
            WHEN zona = 'left' THEN 2
            WHEN zona = 'right' THEN 3
            WHEN zona = 'top' THEN 4
            WHEN zona = 'bottom' THEN 5
            ELSE 1
        END 
        WHERE direcao IS NULL AND zona IS NOT NULL;
        
        RAISE NOTICE '✅ Dados migrados de zona para direcao';
    END IF;
END $$;

-- Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chutes' 
AND column_name IN ('direcao', 'valor_aposta', 'zona', 'potencia', 'angulo')
ORDER BY column_name;

-- ✅ Correção concluída

