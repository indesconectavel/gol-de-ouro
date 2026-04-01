-- =============================================================================
-- Migração incremental: public.chutes → contrato V1 (server-fly.js)
-- Data: 2026-03-31
--
-- Contexto: produção expunha modelo legado (partida_id obrigatório, direcao int,
-- resultado jsonb, gol_marcado). O backend V1 insere lote_id, direcao TL|TR|C|BL|BR,
-- resultado goal|miss, prémios, contador_global, shot_index; partida_id ausente.
--
-- Regras: não apagar linhas; renomear colunas legadas para preservação; V1 convive
-- com colunas *_legacy apenas para auditoria.
--
-- Aplicar no Supabase SQL Editor (revisar diff, backup). Idempotente na medida do possível.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) partida_id passa a opcional (chutes V1 sem partida persistida)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chutes' AND column_name = 'partida_id'
  ) THEN
    ALTER TABLE public.chutes ALTER COLUMN partida_id DROP NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chutes' AND column_name = 'partida_id'
  ) THEN
    EXECUTE $c$
      COMMENT ON COLUMN public.chutes.partida_id IS
        'Legado: referência opcional a partidas. Chutes do motor V1 deixam NULL.'
    $c$;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2) Preservar legado: renomear colunas incompatíveis com o insert V1
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'chutes'
      AND c.column_name = 'direcao' AND c.data_type = 'integer'
  ) THEN
    ALTER TABLE public.chutes RENAME COLUMN direcao TO direcao_legacy_int;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chutes' AND column_name = 'direcao_legacy_int'
  ) THEN
    EXECUTE $c$
      COMMENT ON COLUMN public.chutes.direcao_legacy_int IS
        'Legado: direção numérica antiga. Mantida para auditoria; não usada pelo motor V1.'
    $c$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'chutes'
      AND c.column_name = 'resultado' AND c.data_type = 'jsonb'
  ) THEN
    ALTER TABLE public.chutes RENAME COLUMN resultado TO resultado_legacy_jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chutes' AND column_name = 'resultado_legacy_jsonb'
  ) THEN
    EXECUTE $c$
      COMMENT ON COLUMN public.chutes.resultado_legacy_jsonb IS
        'Legado: resultado em JSONB. Mantido para auditoria; o motor V1 usa resultado TEXT.'
    $c$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'chutes'
      AND c.column_name = 'gol_marcado'
  ) THEN
    ALTER TABLE public.chutes RENAME COLUMN gol_marcado TO gol_marcado_legacy;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chutes' AND column_name = 'gol_marcado_legacy'
  ) THEN
    EXECUTE $c$
      COMMENT ON COLUMN public.chutes.gol_marcado_legacy IS
        'Legado: booleano gol_marcado. Mantido para auditoria; V1 usa is_gol_de_ouro + resultado.'
    $c$;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) Colunas V1: direcao (texto) e resultado (goal|miss)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chutes' AND column_name = 'direcao'
  ) THEN
    ALTER TABLE public.chutes ADD COLUMN direcao VARCHAR(10) NOT NULL DEFAULT 'C';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chutes' AND column_name = 'resultado'
  ) THEN
    ALTER TABLE public.chutes ADD COLUMN resultado VARCHAR(20) NOT NULL DEFAULT 'miss';
  END IF;
END $$;

-- Backfill resultado a partir do legado, quando existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chutes' AND column_name = 'gol_marcado_legacy'
  ) THEN
    UPDATE public.chutes
    SET resultado = CASE WHEN gol_marcado_legacy IS TRUE THEN 'goal' ELSE 'miss' END;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4) Demais colunas do insert V1 em server-fly.js
-- -----------------------------------------------------------------------------
ALTER TABLE public.chutes ADD COLUMN IF NOT EXISTS lote_id VARCHAR(255) NOT NULL DEFAULT 'legacy-unknown';
ALTER TABLE public.chutes ADD COLUMN IF NOT EXISTS contador_global INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.chutes ADD COLUMN IF NOT EXISTS shot_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.chutes ADD COLUMN IF NOT EXISTS premio NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.chutes ADD COLUMN IF NOT EXISTS premio_gol_de_ouro NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.chutes ADD COLUMN IF NOT EXISTS is_gol_de_ouro BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.chutes.lote_id IS 'Identificador do lote em memória (string).';
COMMENT ON COLUMN public.chutes.contador_global IS 'Contador global de chutes para marcos (ex.: Gol de Ouro).';
COMMENT ON COLUMN public.chutes.shot_index IS 'Índice do chute dentro do lote (1-based no backend).';
COMMENT ON COLUMN public.chutes.premio IS 'Prémio base em caso de gol.';
COMMENT ON COLUMN public.chutes.premio_gol_de_ouro IS 'Prémio adicional Gol de Ouro, se aplicável.';
COMMENT ON COLUMN public.chutes.is_gol_de_ouro IS 'Indica se o chute foi marco de Gol de Ouro.';

-- -----------------------------------------------------------------------------
-- 5) Constraints de domínio (ignorar se já existirem)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public.chutes
    ADD CONSTRAINT chutes_resultado_v1_chk CHECK (resultado IN ('goal', 'miss'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.chutes
    ADD CONSTRAINT chutes_direcao_v1_chk CHECK (direcao IN ('TL', 'TR', 'C', 'BL', 'BR'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 6) Índices úteis para auditoria / motor
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_chutes_contador_global ON public.chutes (contador_global);
CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON public.chutes (lote_id);
CREATE INDEX IF NOT EXISTS idx_chutes_usuario_created ON public.chutes (usuario_id, created_at DESC);

COMMIT;

-- Pós-execução (opcional, após validar inserts V1 em staging):
-- ALTER TABLE public.chutes ALTER COLUMN direcao DROP DEFAULT;
-- ALTER TABLE public.chutes ALTER COLUMN lote_id DROP DEFAULT;
-- Só remover defaults quando todos os clientes enviarem sempre os campos obrigatórios.
