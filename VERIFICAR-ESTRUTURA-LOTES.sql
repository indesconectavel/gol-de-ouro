-- =====================================================
-- VERIFICAR ESTRUTURA DA TABELA lotes
-- Execute esta query PRIMEIRO para ver quais colunas existem
-- =====================================================

-- Ver todas as colunas da tabela lotes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;

-- Verificar se tabela lotes existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'lotes'
        ) THEN '✅ Tabela lotes EXISTE'
        ELSE '❌ Tabela lotes NÃO EXISTE'
    END as status_tabela;

-- Ver alguns registros de exemplo (usando apenas colunas básicas)
-- NOTA: posicao_atual pode não existir, então não incluímos aqui
SELECT 
    id,
    valor_aposta,
    status,
    created_at
FROM public.lotes
LIMIT 5;

