-- =============================================================================
-- Correção crítica: chutes.resultado_legacy_jsonb — permitir INSERT V1 sem valor
-- Data: 2026-04-01
--
-- Contexto: backend V1 não envia resultado_legacy_jsonb; NOT NULL causava 500.
-- Regras: não remove coluna; não altera outras tabelas; não UPDATE em dados.
-- Reversível: ver comentário ROLLBACK no final.
-- Aplicar no Supabase SQL Editor (produção/staging).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ETAPA 1 — READ-ONLY (executar antes; copiar resultado para evidência)
-- -----------------------------------------------------------------------------
-- SELECT column_name, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'chutes'
--   AND column_name = 'resultado_legacy_jsonb';

-- -----------------------------------------------------------------------------
-- ETAPA 2 — DDL principal
-- -----------------------------------------------------------------------------
ALTER TABLE public.chutes
  ALTER COLUMN resultado_legacy_jsonb DROP NOT NULL;

-- -----------------------------------------------------------------------------
-- ETAPA 3 — Hardening (recomendado)
-- -----------------------------------------------------------------------------
ALTER TABLE public.chutes
  ALTER COLUMN resultado_legacy_jsonb SET DEFAULT '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- ETAPA 4 — READ-ONLY (executar depois; esperado: is_nullable = YES, default '{}'::jsonb)
-- -----------------------------------------------------------------------------
-- SELECT column_name, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'chutes'
--   AND column_name = 'resultado_legacy_jsonb';

-- -----------------------------------------------------------------------------
-- ROLLBACK (só se não existirem NULLs na coluna; validar antes)
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.chutes ALTER COLUMN resultado_legacy_jsonb DROP DEFAULT;
-- ALTER TABLE public.chutes ALTER COLUMN resultado_legacy_jsonb SET NOT NULL;
