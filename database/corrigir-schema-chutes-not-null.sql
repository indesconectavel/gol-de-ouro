-- =====================================================
-- CORREÇÃO: Tornar colunas direcao e valor_aposta NOT NULL
-- =====================================================
-- Data: 2025-11-24
-- Descrição: Após migração completa, tornar colunas obrigatórias
-- ⚠️ EXECUTAR APENAS APÓS GARANTIR QUE TODOS OS DADOS FORAM MIGRADOS
-- =====================================================

-- Verificar se há registros com valores NULL
DO $$
DECLARE
    v_null_direcao INTEGER;
    v_null_valor_aposta INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_null_direcao FROM chutes WHERE direcao IS NULL;
    SELECT COUNT(*) INTO v_null_valor_aposta FROM chutes WHERE valor_aposta IS NULL;
    
    RAISE NOTICE 'Registros com direcao NULL: %', v_null_direcao;
    RAISE NOTICE 'Registros com valor_aposta NULL: %', v_null_valor_aposta;
    
    -- Verificar se há NULLs antes de alterar
    IF v_null_direcao = 0 THEN
        ALTER TABLE public.chutes ALTER COLUMN direcao SET NOT NULL;
        RAISE NOTICE '✅ Coluna direcao agora é NOT NULL';
    ELSE
        RAISE NOTICE '⚠️ Existem % registros com direcao NULL, migração necessária primeiro', v_null_direcao;
    END IF;

    IF v_null_valor_aposta = 0 THEN
        ALTER TABLE public.chutes ALTER COLUMN valor_aposta SET NOT NULL;
        RAISE NOTICE '✅ Coluna valor_aposta agora é NOT NULL';
    ELSE
        RAISE NOTICE '⚠️ Existem % registros com valor_aposta NULL, migração necessária primeiro', v_null_valor_aposta;
    END IF;
END $$;

-- Verificar resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chutes' 
AND column_name IN ('direcao', 'valor_aposta')
ORDER BY column_name;

-- ✅ Verificação concluída

