-- staging aws-0-sa-east-1.pooler.supabase.com
CREATE OR REPLACE FUNCTION public.claim_and_credit_approved_pix_deposit(p_mercadopago_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mp_id           text;
  v_pix             public.pagamentos_pix%ROWTYPE;
  v_user_id         uuid;
  v_credit          numeric(12, 2);
  v_ledger_id       uuid;
  v_saldo_before    numeric(12, 2);
  v_saldo_after     numeric(12, 2);
  v_rows_claimed    integer;
  v_status_norm     text;
  v_ledger_ref      text;
BEGIN
  v_mp_id := nullif(trim(p_mercadopago_id), '');
  IF v_mp_id IS NULL OR v_mp_id !~ '^\d+$' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'credited', false,
      'idempotent', false,
      'reason', 'error',
      'error', 'invalid_mercadopago_id'
    );
  END IF;

  -- Localizar e travar o PIX (payment_id preferencial; fallback external_id)
  SELECT p.*
  INTO v_pix
  FROM public.pagamentos_pix AS p
  WHERE p.payment_id = v_mp_id
  ORDER BY p.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT p.*
    INTO v_pix
    FROM public.pagamentos_pix AS p
    WHERE p.external_id = v_mp_id
    ORDER BY p.created_at DESC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'credited', false,
      'idempotent', false,
      'reason', 'not_found',
      'payment_id', v_mp_id
    );
  END IF;

  v_user_id := v_pix.usuario_id;
  v_credit := round(COALESCE(v_pix.amount, v_pix.valor, 0)::numeric, 2);
  v_ledger_ref := v_pix.id::text;
  v_status_norm := lower(trim(COALESCE(v_pix.status::text, '')));

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'credited', false,
      'idempotent', false,
      'reason', 'error',
      'payment_id', v_mp_id,
      'pagamentos_pix_id', v_pix.id,
      'error', 'missing_usuario_id'
    );
  END IF;

  IF v_credit IS NULL OR v_credit <= 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'credited', false,
      'idempotent', false,
      'reason', 'invalid_amount',
      'payment_id', v_mp_id,
      'pagamentos_pix_id', v_pix.id,
      'error', 'credit_amount_must_be_positive'
    );
  END IF;

  -- Ledger já existe? (canónico pagamentos_pix.id OU legado payment_id)
  SELECT l.id
  INTO v_ledger_id
  FROM public.ledger_financeiro AS l
  WHERE l.correlation_id = v_mp_id
    AND l.tipo = 'deposito'
    AND l.referencia IN (v_ledger_ref, v_mp_id)
  ORDER BY CASE WHEN l.referencia = v_ledger_ref THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_ledger_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'credited', false,
      'idempotent', true,
      'reason', 'already_credited',
      'payment_id', v_mp_id,
      'pagamentos_pix_id', v_pix.id,
      'ledger_id', v_ledger_id
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- Ramo A: já approved (legado V1 sem ledger) — backfill só de ledger
  -- Não altera saldo (assume crédito já aplicado pelo fluxo anterior).
  -- -------------------------------------------------------------------------
  IF v_status_norm = 'approved' THEN
    INSERT INTO public.ledger_financeiro (
      correlation_id,
      tipo,
      valor,
      referencia,
      user_id,
      usuario_id,
      created_at
    )
    VALUES (
      v_mp_id,
      'deposito',
      v_credit,
      v_ledger_ref,
      v_user_id,
      v_user_id,
      timezone('utc', now())
    )
    ON CONFLICT (correlation_id, tipo, referencia) DO NOTHING
    RETURNING id INTO v_ledger_id;

    IF v_ledger_id IS NULL THEN
      SELECT l.id
      INTO v_ledger_id
      FROM public.ledger_financeiro AS l
      WHERE l.correlation_id = v_mp_id
        AND l.tipo = 'deposito'
        AND l.referencia IN (v_ledger_ref, v_mp_id)
      ORDER BY CASE WHEN l.referencia = v_ledger_ref THEN 0 ELSE 1 END
      LIMIT 1;
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'credited', false,
      'idempotent', true,
      'reason', 'ledger_backfill',
      'payment_id', v_mp_id,
      'pagamentos_pix_id', v_pix.id,
      'ledger_id', v_ledger_id
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- Ramo B: claim + saldo + ledger (transação única; falha = rollback total)
  -- -------------------------------------------------------------------------
  UPDATE public.pagamentos_pix
  SET
    status = 'approved',
    updated_at = timezone('utc', now()),
    approved_at = COALESCE(approved_at, timezone('utc', now()))
  WHERE id = v_pix.id
    AND lower(trim(COALESCE(status::text, ''))) <> 'approved';

  GET DIAGNOSTICS v_rows_claimed = ROW_COUNT;

  IF v_rows_claimed = 0 THEN
    -- Concorrência: outro worker aprovou entre o SELECT e o UPDATE
    SELECT lower(trim(COALESCE(status::text, '')))
    INTO v_status_norm
    FROM public.pagamentos_pix
    WHERE id = v_pix.id;

    IF v_status_norm = 'approved' THEN
      INSERT INTO public.ledger_financeiro (
        correlation_id,
        tipo,
        valor,
        referencia,
        user_id,
        usuario_id,
        created_at
      )
      VALUES (
        v_mp_id,
        'deposito',
        v_credit,
        v_ledger_ref,
        v_user_id,
        v_user_id,
        timezone('utc', now())
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_ledger_id;

      IF v_ledger_id IS NULL THEN
        SELECT l.id
        INTO v_ledger_id
        FROM public.ledger_financeiro AS l
        WHERE l.correlation_id = v_mp_id
          AND l.tipo = 'deposito'
          AND l.referencia IN (v_ledger_ref, v_mp_id)
        ORDER BY CASE WHEN l.referencia = v_ledger_ref THEN 0 ELSE 1 END
        LIMIT 1;
      END IF;

      RETURN jsonb_build_object(
        'ok', true,
        'credited', false,
        'idempotent', true,
        'reason', 'already_credited',
        'payment_id', v_mp_id,
        'pagamentos_pix_id', v_pix.id,
        'ledger_id', v_ledger_id
      );
    END IF;

    RETURN jsonb_build_object(
      'ok', false,
      'credited', false,
      'idempotent', false,
      'reason', 'error',
      'payment_id', v_mp_id,
      'pagamentos_pix_id', v_pix.id,
      'error', 'claim_failed_unexpected_status'
    );
  END IF;

  -- Travar utilizador e creditar saldo
  SELECT u.saldo
  INTO v_saldo_before
  FROM public.usuarios AS u
  WHERE u.id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'claim_pix_user_not_found:%', v_user_id
      USING ERRCODE = 'P0001';
  END IF;

  -- Ledger antes do saldo: falha no insert aborta sem crédito; ON CONFLICT = outro worker ganhou
  INSERT INTO public.ledger_financeiro (
    correlation_id,
    tipo,
    valor,
    referencia,
    user_id,
    usuario_id,
    created_at
  )
  VALUES (
    v_mp_id,
    'deposito',
    v_credit,
    v_ledger_ref,
    v_user_id,
    v_user_id,
    timezone('utc', now())
  )
  ON CONFLICT (correlation_id, tipo, referencia) DO NOTHING
  RETURNING id INTO v_ledger_id;

  IF v_ledger_id IS NULL THEN
    SELECT l.id
    INTO v_ledger_id
    FROM public.ledger_financeiro AS l
    WHERE l.correlation_id = v_mp_id
      AND l.tipo = 'deposito'
      AND l.referencia IN (v_ledger_ref, v_mp_id)
    ORDER BY CASE WHEN l.referencia = v_ledger_ref THEN 0 ELSE 1 END
    LIMIT 1;

    RETURN jsonb_build_object(
      'ok', true,
      'credited', false,
      'idempotent', true,
      'reason', 'already_credited',
      'payment_id', v_mp_id,
      'pagamentos_pix_id', v_pix.id,
      'ledger_id', v_ledger_id
    );
  END IF;

  v_saldo_after := round(COALESCE(v_saldo_before, 0)::numeric + v_credit, 2);

  UPDATE public.usuarios
  SET
    saldo = v_saldo_after,
    updated_at = timezone('utc', now())
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'credited', true,
    'idempotent', false,
    'reason', 'credited_now',
    'payment_id', v_mp_id,
    'pagamentos_pix_id', v_pix.id,
    'ledger_id', v_ledger_id,
    'saldo_before', v_saldo_before,
    'saldo_after', v_saldo_after,
    'valor', v_credit
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
    'ok', false,
    'credited', false,
    'idempotent', false,
    'reason', 'error',
    'payment_id', v_mp_id,
    'pagamentos_pix_id', COALESCE(v_pix.id::text, null),
    'error', left(SQLERRM, 500)
  );
END;
$function$

