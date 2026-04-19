-- =============================================================================
-- FASE 2.2B — Transação atómica: métricas + lote (obter/criar) + chutes + saldo
-- Executar no SQL Editor do Supabase (ou psql) com privilégios adequados.
--
-- Remove assinaturas antigas para evitar ambiguidade no PostgREST.
DROP FUNCTION IF EXISTS public.shoot_apply(
  uuid, text, text, numeric, text, numeric, numeric, boolean, integer, integer
);
DROP FUNCTION IF EXISTS public.shoot_apply(uuid, text, text, numeric, text, integer);
--
-- Pré-requisitos:
--   - public.metricas_globais id = 1
--   - public.lotes (id, valor_aposta, tamanho, posicao_atual, indice_vencedor, status, …)
--   - public.chutes com FK para lotes
-- Recomendado (evita dois lotes ativos para o mesmo valor):
--   CREATE UNIQUE INDEX IF NOT EXISTS idx_lotes_um_ativo_por_valor
--     ON public.lotes (valor_aposta) WHERE (status = 'ativo');
-- =============================================================================

CREATE OR REPLACE FUNCTION public.shoot_apply(
  p_usuario_id uuid,
  p_direcao text,
  p_valor_aposta numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tamanho integer;
  v_lote_id text;
  v_lote_tamanho integer;
  v_indice integer;
  v_cnt integer;
  v_new_pos integer;
  v_is_goal boolean;
  v_resultado text;
  v_is_lote_complete boolean;
  v_contador_atual integer;
  v_ultimo_go integer;
  v_novo_contador integer;
  v_milestone boolean;
  v_premio numeric;
  v_premio_gol numeric;
  v_saldo numeric;
  v_credito numeric;
  v_novo_saldo numeric;
  v_chute_id chutes.id%TYPE;
  v_ultimo_go_novo integer;
  v_retry integer;
  v_alloc_ok boolean;
BEGIN
  IF p_direcao IS NULL OR p_direcao NOT IN ('TL', 'TR', 'C', 'BL', 'BR') THEN
    RAISE EXCEPTION 'SHOOT_APPLY_DIRECAO_INVALIDA'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_valor_aposta IS NULL OR p_valor_aposta <= 0 THEN
    RAISE EXCEPTION 'SHOOT_APPLY_VALOR_INVALIDO'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_valor_aposta NOT IN (1::numeric, 2::numeric, 5::numeric, 10::numeric) THEN
    RAISE EXCEPTION 'SHOOT_APPLY_VALOR_INVALIDO'
      USING ERRCODE = 'P0001';
  END IF;

  v_tamanho := CASE p_valor_aposta::numeric
    WHEN 1 THEN 10
    WHEN 2 THEN 5
    WHEN 5 THEN 2
    WHEN 10 THEN 1
  END;

  SELECT m.contador_chutes_global, m.ultimo_gol_de_ouro
  INTO v_contador_atual, v_ultimo_go
  FROM public.metricas_globais AS m
  WHERE m.id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHOOT_APPLY_METRICAS_AUSENTE'
      USING ERRCODE = 'P0001';
  END IF;

  v_contador_atual := coalesce(v_contador_atual, 0);
  v_ultimo_go := coalesce(v_ultimo_go, 0);
  v_novo_contador := v_contador_atual + 1;
  v_milestone := (v_novo_contador % 1000 = 0);

  -- Obter lote aberto (ativo e ainda com vagas) ou criar; FOR UPDATE serializa por linha.
  v_retry := 0;
  v_alloc_ok := false;
  WHILE NOT v_alloc_ok AND v_retry < 32 LOOP
    v_retry := v_retry + 1;

    SELECT l.id, l.tamanho, l.indice_vencedor
    INTO v_lote_id, v_lote_tamanho, v_indice
    FROM public.lotes AS l
    WHERE l.valor_aposta = p_valor_aposta
      AND l.status = 'ativo'
      AND (
        SELECT count(*)::integer
        FROM public.chutes AS c
        WHERE c.lote_id = l.id
      ) < l.tamanho
    ORDER BY l.created_at ASC NULLS LAST, l.id ASC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      v_alloc_ok := true;
    ELSE
      BEGIN
        v_lote_id :=
          'lote_' || trim(both ' ' FROM p_valor_aposta::text) || '_' ||
          (floor(extract(epoch FROM clock_timestamp()) * 1000))::bigint::text || '_' ||
          encode(gen_random_bytes(6), 'hex');
        v_indice := floor(random() * v_tamanho)::integer;
        IF v_indice < 0 OR v_indice >= v_tamanho THEN
          v_indice := 0;
        END IF;

        INSERT INTO public.lotes (
          id,
          valor_aposta,
          tamanho,
          posicao_atual,
          indice_vencedor,
          status,
          total_arrecadado,
          premio_total
        ) VALUES (
          v_lote_id,
          p_valor_aposta,
          v_tamanho,
          0,
          v_indice,
          'ativo',
          0,
          0
        );

        v_lote_tamanho := v_tamanho;
        v_alloc_ok := true;
      EXCEPTION
        WHEN SQLSTATE '23505' THEN
          v_alloc_ok := false;
      END;
    END IF;
  END LOOP;

  IF NOT v_alloc_ok OR v_lote_id IS NULL THEN
    RAISE EXCEPTION 'SHOOT_APPLY_LOTE_ALOCAR_FALHOU'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::integer
  INTO v_cnt
  FROM public.chutes AS c
  WHERE c.lote_id = v_lote_id;

  IF v_cnt >= v_lote_tamanho THEN
    RAISE EXCEPTION 'SHOOT_APPLY_LOTE_CHEIO'
      USING ERRCODE = 'P0001';
  END IF;

  v_is_goal := (v_cnt = v_indice);
  v_resultado := CASE WHEN v_is_goal THEN 'goal' ELSE 'miss' END;
  v_new_pos := v_cnt + 1;
  v_is_lote_complete := v_is_goal OR (v_new_pos >= v_lote_tamanho);

  v_premio := CASE WHEN v_is_goal THEN 5::numeric ELSE 0::numeric END;
  v_premio_gol := CASE
    WHEN v_is_goal AND v_milestone THEN 100::numeric
    ELSE 0::numeric
  END;

  SELECT u.saldo INTO STRICT v_saldo
  FROM public.usuarios AS u
  WHERE u.id = p_usuario_id
  FOR UPDATE;

  v_saldo := coalesce(v_saldo, 0);

  IF v_saldo < p_valor_aposta THEN
    RAISE EXCEPTION 'SHOOT_APPLY_SALDO_INSUFICIENTE'
      USING ERRCODE = 'P0001';
  END IF;

  v_credito := v_premio + v_premio_gol;
  v_novo_saldo := v_saldo - p_valor_aposta + v_credito;

  INSERT INTO public.chutes (
    usuario_id,
    lote_id,
    direcao,
    valor_aposta,
    resultado,
    premio,
    premio_gol_de_ouro,
    is_gol_de_ouro,
    contador_global,
    shot_index
  ) VALUES (
    p_usuario_id,
    v_lote_id,
    p_direcao,
    p_valor_aposta,
    v_resultado,
    v_premio,
    v_premio_gol,
    v_milestone,
    v_novo_contador,
    v_new_pos
  )
  RETURNING id INTO v_chute_id;

  UPDATE public.usuarios AS u
  SET
    saldo = v_novo_saldo,
    total_apostas = coalesce(u.total_apostas, 0) + 1,
    total_ganhos = coalesce(u.total_ganhos, 0) + v_credito,
    total_gols_de_ouro = coalesce(u.total_gols_de_ouro, 0) + CASE
      WHEN v_is_goal AND v_milestone THEN 1
      ELSE 0
    END,
    updated_at = now()
  WHERE u.id = p_usuario_id;

  v_ultimo_go_novo := CASE
    WHEN v_is_goal AND v_milestone THEN v_novo_contador
    ELSE v_ultimo_go
  END;

  UPDATE public.metricas_globais AS m
  SET
    contador_chutes_global = v_novo_contador,
    ultimo_gol_de_ouro = v_ultimo_go_novo,
    updated_at = now()
  WHERE m.id = 1;

  UPDATE public.lotes AS l
  SET
    posicao_atual = v_new_pos,
    total_arrecadado = l.total_arrecadado + p_valor_aposta,
    premio_total = l.premio_total + v_premio + v_premio_gol,
    status = CASE WHEN v_is_lote_complete THEN 'finalizado' ELSE 'ativo' END,
    updated_at = now()
  WHERE l.id = v_lote_id;

  RETURN jsonb_build_object(
    'lote_id', to_jsonb(v_lote_id::text),
    'posicao_lote', to_jsonb(v_new_pos),
    'tamanho_lote', to_jsonb(v_lote_tamanho),
    'is_lote_complete', to_jsonb(v_is_lote_complete),
    'novo_saldo', v_novo_saldo,
    'chute_id', to_jsonb(v_chute_id),
    'resultado', to_jsonb(v_resultado::text),
    'contador_global', to_jsonb(v_novo_contador),
    'is_gol_de_ouro', to_jsonb(v_milestone),
    'premio', v_premio,
    'premio_gol_de_ouro', v_premio_gol,
    'premios', jsonb_build_object(
      'premio', v_premio,
      'premio_gol_de_ouro', v_premio_gol
    ),
    'ultimo_gol_de_ouro', to_jsonb(v_ultimo_go_novo)
  );
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE EXCEPTION 'SHOOT_APPLY_USUARIO_NAO_ENCONTRADO'
      USING ERRCODE = 'P0001';
END;
$$;

COMMENT ON FUNCTION public.shoot_apply(uuid, text, numeric) IS
  'Atómico: métricas + lote (SELECT FOR UPDATE / INSERT) + chutes + usuarios.saldo + atualização do lote.';

REVOKE ALL ON FUNCTION public.shoot_apply(uuid, text, numeric) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.shoot_apply(uuid, text, numeric) TO service_role;
