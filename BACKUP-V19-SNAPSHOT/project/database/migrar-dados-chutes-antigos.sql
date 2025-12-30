-- =====================================================
-- MIGRAÇÃO: Migrar dados de zona/potencia/angulo para direcao/valor_aposta
-- =====================================================
-- Data: 2025-11-24
-- Descrição: Migra dados antigos para novo formato
-- ⚠️ EXECUTAR ANTES DE TORNAR COLUNAS NOT NULL
-- =====================================================

-- Verificar quantos registros precisam ser migrados
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN direcao IS NULL THEN 1 END) as sem_direcao,
    COUNT(CASE WHEN valor_aposta IS NULL THEN 1 END) as sem_valor_aposta,
    COUNT(CASE WHEN zona IS NOT NULL THEN 1 END) as com_zona_antiga
FROM chutes;

-- Migrar zona para direcao (se ainda não migrado)
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

-- Nota sobre valor_aposta:
-- Se não houver coluna antiga para migrar, valor_aposta deve ser preenchido pelo código
-- ao criar novos chutes. Registros antigos sem valor_aposta podem precisar de migração manual
-- baseada em lote_id ou outros critérios de negócio.

-- Verificar resultado após migração
SELECT 
    COUNT(*) as total,
    COUNT(direcao) as com_direcao,
    COUNT(valor_aposta) as com_valor_aposta,
    COUNT(zona) as com_zona,
    COUNT(potencia) as com_potencia,
    COUNT(angulo) as com_angulo
FROM chutes;

-- Mostrar amostra de registros migrados
SELECT 
    id,
    direcao,
    zona,
    valor_aposta,
    created_at
FROM chutes
WHERE direcao IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ✅ Migração concluída

