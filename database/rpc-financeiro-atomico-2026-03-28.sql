-- =============================================================================
-- RPCs atómicas — crédito PIX e pedido de saque (transação única no Postgres)
-- Aplicar manualmente no Supabase SQL Editor (produção/staging) antes de depender
-- do caminho RPC em server-fly.js. Reversível: DROP FUNCTION ...
-- Data: 2026-03-28
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Crédito PIX: saldo e status approved na mesma transação (sem janela intermédia)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.creditar_pix_aprovado_mp(p_payment_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.pagamentos_pix%ROWTYPE;
  saldo_antes numeric;
  credit numeric;
  novo_saldo numeric;
  n int;
BEGIN
  IF p_payment_id IS NULL OR btrim(p_payment_id) = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_id');
  END IF;

  SELECT * INTO r FROM public.pagamentos_pix
  WHERE payment_id = btrim(p_payment_id)
  ORDER BY id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT * INTO r FROM public.pagamentos_pix
    WHERE external_id = btrim(p_payment_id)
    ORDER BY id
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'pix_not_found');
  END IF;

  IF r.status = 'approved' THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_processed');
  END IF;

  IF r.status IS DISTINCT FROM 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unexpected_status', 'detail', r.status);
  END IF;

  credit := COALESCE(r.amount, r.valor, 0)::numeric;

  IF credit <= 0 THEN
    UPDATE public.pagamentos_pix SET status = 'approved', updated_at = now()
    WHERE id = r.id AND status = 'pending';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n = 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'claim_lost');
    END IF;
    RETURN jsonb_build_object('ok', true, 'reason', 'zero_credit');
  END IF;

  SELECT saldo INTO saldo_antes FROM public.usuarios WHERE id = r.usuario_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'user_not_found');
  END IF;

  novo_saldo := saldo_antes + credit;
  UPDATE public.usuarios SET saldo = novo_saldo
  WHERE id = r.usuario_id AND saldo = saldo_antes;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'saldo_race');
  END IF;

  UPDATE public.pagamentos_pix SET status = 'approved', updated_at = now()
  WHERE id = r.id AND status = 'pending';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    UPDATE public.usuarios SET saldo = saldo_antes
    WHERE id = r.usuario_id AND saldo = novo_saldo;
    RETURN jsonb_build_object('ok', false, 'reason', 'claim_lost');
  END IF;

  RETURN jsonb_build_object('ok', true, 'reason', 'credited');
END;
$$;

REVOKE ALL ON FUNCTION public.creditar_pix_aprovado_mp(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.creditar_pix_aprovado_mp(text) TO service_role;

COMMENT ON FUNCTION public.creditar_pix_aprovado_mp(text) IS
  'Atomiza crédito em usuarios.saldo + pagamentos_pix.approved; lookup payment_id primeiro, external_id fallback.';

-- -----------------------------------------------------------------------------
-- 2) Saque: INSERT em saques + débito de saldo na mesma transação
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.solicitar_saque_pix_atomico(
  p_usuario_id uuid,
  p_amount numeric,
  p_pix_key text,
  p_pix_type text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  saldo_ant numeric;
  novo_saldo numeric;
  sid public.saques.id%TYPE;
  n int;
  k text;
  t text;
  ts timestamptz := now();
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  k := btrim(COALESCE(p_pix_key, ''));
  t := lower(btrim(COALESCE(p_pix_type, '')));
  IF k = '' OR t = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_pix_fields');
  END IF;

  SELECT saldo INTO saldo_ant FROM public.usuarios WHERE id = p_usuario_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'user_not_found');
  END IF;

  IF saldo_ant < p_amount THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_funds');
  END IF;

  novo_saldo := saldo_ant - p_amount;

  INSERT INTO public.saques (
    usuario_id, amount, valor, pix_key, chave_pix, pix_type, tipo_chave, status, created_at
  ) VALUES (
    p_usuario_id, p_amount, p_amount, k, k, t, t, 'pendente', ts
  )
  RETURNING id INTO sid;

  UPDATE public.usuarios SET saldo = novo_saldo
  WHERE id = p_usuario_id AND saldo = saldo_ant;
  GET DIAGNOSTICS n = ROW_COUNT;

  IF n = 0 THEN
    DELETE FROM public.saques WHERE id = sid;
    RETURN jsonb_build_object('ok', false, 'reason', 'saldo_race');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'reason', 'created',
    'saque_id', sid::text,
    'created_at', ts::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.solicitar_saque_pix_atomico(uuid, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.solicitar_saque_pix_atomico(uuid, numeric, text, text) TO service_role;

COMMENT ON FUNCTION public.solicitar_saque_pix_atomico(uuid, numeric, text, text) IS
  'INSERT saques + débito saldo atómico; remove linha de saque se lock otimista do saldo falhar.';
