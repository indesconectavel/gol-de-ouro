-- =============================================================================
-- Correção legado: chutes.direcao_legacy_int — permitir INSERT V1 sem valor
-- Data: 2026-04-01
--
-- Contexto: insert V1 não preenche direcao_legacy_int; NOT NULL causava 23502.
-- Regras: não remove coluna; não apaga dados; não altera outras tabelas.
-- Reversível: ver ROLLBACK no final.
-- Aplicar no Supabase SQL Editor.
-- =============================================================================

-- ETAPA 1 — READ-ONLY (copiar resultado para evidência)
-- SELECT column_name, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'chutes'
--   AND column_name = 'direcao_legacy_int';

-- ETAPA 2 — DDL
ALTER TABLE public.chutes
  ALTER COLUMN direcao_legacy_int DROP NOT NULL;

ALTER TABLE public.chutes
  ALTER COLUMN direcao_legacy_int SET DEFAULT 0;

-- ETAPA 3 — READ-ONLY (esperado: is_nullable = YES; default 0)
-- SELECT column_name, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'chutes'
--   AND column_name = 'direcao_legacy_int';

-- ROLLBACK (cuidado: falha se existirem NULLs ao repor NOT NULL)
-- ALTER TABLE public.chutes ALTER COLUMN direcao_legacy_int DROP DEFAULT;
-- ALTER TABLE public.chutes ALTER COLUMN direcao_legacy_int SET NOT NULL;
