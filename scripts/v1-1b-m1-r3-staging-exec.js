/**
 * V1.1B-M1-R3-STAGING-EXEC — patch cirúrgico real (baseline prod + fix self-heal).
 * Somente staging (uatszaqzdqcwnfbipoxg). Produção bloqueada.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PROD_REF = 'gayopagjdrkcmkirmfvy';
const PROD_FINGERPRINT = { pix_total: 354, approved: 42 };
const TEST_EMAIL = 'stg-m1-pix-ledger@test.local';
const MP_IDS = {
  S1S2: '999000000000001',
  S3: '999000000000003',
  S4: '999000000000004',
  S5B: '999000000000007',
  S6: '999000000000006',
};
const CREDIT = 7.77;
const SNAP_PROD = path.join(
  __dirname,
  '..',
  'docs',
  'relatorios',
  'snapshots',
  'claim_and_credit_approved_pix_deposit-ANTES-M1-producao-2026-05-17.sql'
);
const PATCH_R3 = path.join(
  __dirname,
  '..',
  'database',
  'patches',
  'V1.1B-M1-R3-claim_and_credit_approved_pix_deposit.sql'
);
const BASELINE_SYNTH = path.join(
  __dirname,
  '..',
  'database',
  'patches',
  'V1.1B-M1-R3-PROD-BASELINE-claim_and_credit_approved_pix_deposit.sql'
);

const out = {
  timestamp: new Date().toISOString(),
  mission: 'V1.1B-M1-R3',
  database_host: null,
  blocked: false,
  block_reason: null,
  prod_snapshot: {},
  preflight: {},
  baseline_apply: {},
  patch_apply: {},
  pre_patch_regression: {},
  tests: {},
  drift: { detected: false, only_self_heal_changed: null, notes: [] },
  cleanup: {},
  verdict: null,
};

function buildStagingUrls() {
  const raw = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
  if (!raw || raw.includes(PROD_REF)) return [];
  const passMatch = raw.match(/:\/\/[^:]+:([^@]+)@/);
  const password = passMatch ? passMatch[1] : null;
  const projectId = 'uatszaqzdqcwnfbipoxg';
  const urls = [];
  if (password) {
    urls.push(
      `postgresql://postgres.${projectId}:${password}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require`
    );
  }
  if (!raw.includes(PROD_REF)) urls.push(raw.replace(':6543/', ':5432/'));
  return [...new Set(urls)];
}

async function connect() {
  const candidates = buildStagingUrls();
  if (candidates.length === 0) {
    out.blocked = true;
    out.block_reason = 'Sem URL staging';
    throw new Error(out.block_reason);
  }
  let lastErr;
  for (const url of candidates) {
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      out.database_host = url.match(/@([^:/]+)/)?.[1];
      return client;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('connect failed');
}

function loadProdBaselineSql() {
  const snap = fs.readFileSync(SNAP_PROD, 'utf8');
  if (/CREATE\s+OR\s+REPLACE\s+FUNCTION/i.test(snap)) {
    out.prod_snapshot.source = 'file_snapshot';
    out.prod_snapshot.path = SNAP_PROD;
    const idx = snap.search(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i);
    return idx >= 0 ? snap.slice(idx) : snap;
  }
  out.prod_snapshot.source = 'synthetic_baseline';
  out.prod_snapshot.path = BASELINE_SYNTH;
  out.drift.notes.push(
    'Snapshot produção no repo ainda placeholder — baseline sintético (advisory lock + self-heal com saldo)'
  );
  return fs.readFileSync(BASELINE_SYNTH, 'utf8');
}

function extractSelfHealBlock(def) {
  const anchor = def.indexOf('IF v_ledger_id IS NOT NULL THEN');
  const slice = anchor >= 0 ? def.slice(anchor) : def;
  const m = slice.match(/IF\s+v_status_norm\s*=\s*'approved'\s+THEN[\s\S]*?END\s+IF;/);
  return m ? m[0] : null;
}

function analyzeDrift(baselineDef, patchedDef) {
  const b = extractSelfHealBlock(baselineDef);
  const p = extractSelfHealBlock(patchedDef);
  const onlySelf =
    b &&
    p &&
    b !== p &&
    baselineDef.replace(b, '') === patchedDef.replace(p, '');
  out.drift.only_self_heal_changed = !!onlySelf;
  out.drift.detected = baselineDef !== patchedDef;
  out.drift.baseline_len = baselineDef.length;
  out.drift.patched_len = patchedDef.length;
  out.drift.baseline_has_advisory = baselineDef.includes('pg_advisory_xact_lock');
  out.drift.patched_has_advisory = patchedDef.includes('pg_advisory_xact_lock');
  out.drift.patched_has_ledger_backfill = patchedDef.includes('ledger_backfill');
  out.drift.baseline_self_heal_credits_saldo =
    b && /UPDATE\s+public\.usuarios/i.test(b) && b.includes('v_saldo_after');
  out.drift.patched_self_heal_credits_saldo =
    p && /UPDATE\s+public\.usuarios/i.test(p);
  if (!onlySelf) {
    out.drift.notes.push('Diff além do bloco self-heal — rever pg_get_functiondef real vs patch');
  }
}

async function getRpcDef(client) {
  const r = await client.query(`
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'claim_and_credit_approved_pix_deposit'
  `);
  return r.rows[0]?.def || '';
}

async function applySqlFile(client, filePath, label) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
  const def = await getRpcDef(client);
  return { file: path.basename(filePath), def_length: def.length, def };
}

async function fingerprint(client) {
  const total = await client.query('SELECT count(*)::int AS n FROM public.pagamentos_pix');
  const approved = await client.query(
    "SELECT count(*)::int AS n FROM public.pagamentos_pix WHERE status = 'approved'"
  );
  const fp = { pix_total: total.rows[0].n, approved: approved.rows[0].n };
  out.preflight.fingerprint = fp;
  if (fp.pix_total === PROD_FINGERPRINT.pix_total && fp.approved === PROD_FINGERPRINT.approved) {
    out.blocked = true;
    out.block_reason = 'Fingerprint produção — abortado';
    throw new Error(out.block_reason);
  }
}

async function ensureIndex(client) {
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ledger_financeiro_correlation_tipo_ref_idx
      ON public.ledger_financeiro (correlation_id, tipo, referencia)
  `);
}

async function rpc(client, mpId) {
  const r = await client.query(
    `SELECT public.claim_and_credit_approved_pix_deposit($1::text) AS result`,
    [mpId]
  );
  return r.rows[0].result;
}

async function state(client, userId, mpId) {
  const saldo = await client.query(`SELECT saldo FROM public.usuarios WHERE id = $1`, [userId]);
  const pix = await client.query(
    `SELECT id, status FROM public.pagamentos_pix WHERE payment_id = $1`,
    [mpId]
  );
  const ledgers = await client.query(
    `SELECT id, referencia FROM public.ledger_financeiro
     WHERE correlation_id = $1 AND tipo = 'deposito'`,
    [mpId]
  );
  return {
    saldo: Number(saldo.rows[0]?.saldo ?? 0),
    status: pix.rows[0]?.status,
    pix_id: pix.rows[0]?.id,
    ledger_count: ledgers.rows.length,
    ledger_refs: ledgers.rows.map((r) => r.referencia),
  };
}

async function cleanupMassa(client) {
  await client.query(`DELETE FROM public.ledger_financeiro WHERE correlation_id LIKE '999000000000%'`);
  await client.query(`DELETE FROM public.pagamentos_pix WHERE payment_id LIKE '999000000000%'`);
  await client.query('DROP TRIGGER IF EXISTS stg_m1_fail_ledger ON public.ledger_financeiro');
  await client.query('DROP FUNCTION IF EXISTS public.stg_m1_fail_ledger_insert()');
}

async function ensureTestUser(client) {
  const existing = await client.query(`SELECT id FROM public.usuarios WHERE email = $1 LIMIT 1`, [
    TEST_EMAIL,
  ]);
  if (existing.rows[0]) return existing.rows[0].id;
  const ins = await client.query(
    `INSERT INTO public.usuarios (
       id, email, username, senha_hash, saldo, created_at, updated_at
     ) VALUES (
       gen_random_uuid(), $1, 'stg_m1_pix', 'STG_NO_LOGIN', 0,
       timezone('utc', now()), timezone('utc', now())
     ) RETURNING id`,
    [TEST_EMAIL]
  );
  return ins.rows[0].id;
}

async function seedS1(client, userId) {
  await client.query(
    `INSERT INTO public.pagamentos_pix (
       id, usuario_id, payment_id, external_id, status, amount, valor, created_at, updated_at
     ) VALUES (
       gen_random_uuid(), $1, $2, $2, 'pending', $3, $3,
       timezone('utc', now()), timezone('utc', now())
     )`,
    [userId, MP_IDS.S1S2, CREDIT]
  );
}

async function seedS3(client, userId) {
  const pix = await client.query(
    `INSERT INTO public.pagamentos_pix (
       id, usuario_id, payment_id, external_id, status, amount, valor,
       approved_at, created_at, updated_at
     ) VALUES (
       gen_random_uuid(), $1, $2, $2, 'approved', $3, $3,
       timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
     ) RETURNING id, payment_id`,
    [userId, MP_IDS.S3, CREDIT]
  );
  const row = pix.rows[0];
  await client.query(
    `INSERT INTO public.ledger_financeiro (
       correlation_id, tipo, valor, referencia, user_id, usuario_id, created_at
     ) VALUES ($1, 'deposito', $2, $1, $3, $3, timezone('utc', now()))`,
    [row.payment_id, CREDIT, userId]
  );
  await client.query(`UPDATE public.usuarios SET saldo = saldo + $2 WHERE id = $1`, [userId, CREDIT]);
  return row;
}

async function seedS4(client, userId, mpId, creditSaldo) {
  await client.query(
    `INSERT INTO public.pagamentos_pix (
       id, usuario_id, payment_id, external_id, status, amount, valor,
       approved_at, created_at, updated_at
     ) VALUES (
       gen_random_uuid(), $1, $2, $2, 'approved', $3, $3,
       timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
     )`,
    [userId, mpId, CREDIT]
  );
  if (creditSaldo) {
    await client.query(`UPDATE public.usuarios SET saldo = saldo + $2 WHERE id = $1`, [userId, CREDIT]);
  }
}

async function runPrePatchRegression(client, userId) {
  try {
    await cleanupMassa(client);
    const saldo0 = Number((await client.query(`SELECT saldo FROM usuarios WHERE id=$1`, [userId])).rows[0].saldo);
    await seedS4(client, userId, MP_IDS.S4, true);
    const saldoAfterSeed = saldo0 + CREDIT;
    const r = await rpc(client, MP_IDS.S4);
    const st = await state(client, userId, MP_IDS.S4);
    out.pre_patch_regression = {
      pass:
        r.credited === true &&
        r.reason === 'credited_now' &&
        Math.abs(st.saldo - (saldoAfterSeed + CREDIT)) < 0.01,
      result: r,
      state: st,
      note: 'Baseline prod (bug): self-heal deve creditar saldo de novo',
    };
  } catch (e) {
    out.pre_patch_regression = { pass: false, error: e.message };
  }
}

async function runTests(client, userId) {
  const tests = {};

  try {
    await cleanupMassa(client);
    const saldo0 = Number((await client.query(`SELECT saldo FROM usuarios WHERE id=$1`, [userId])).rows[0].saldo);
    await seedS1(client, userId);
    const r1 = await rpc(client, MP_IDS.S1S2);
    const st1 = await state(client, userId, MP_IDS.S1S2);
    tests.S1 = {
      pass:
        r1.ok &&
        r1.credited === true &&
        r1.reason === 'credited_now' &&
        st1.status === 'approved' &&
        st1.ledger_count === 1 &&
        Math.abs(st1.saldo - (saldo0 + CREDIT)) < 0.01,
      result: r1,
      state: st1,
    };
  } catch (e) {
    tests.S1 = { pass: false, error: e.message };
  }

  try {
    const saldoBefore = Number((await client.query(`SELECT saldo FROM usuarios WHERE id=$1`, [userId])).rows[0].saldo);
    const lcBefore = (await state(client, userId, MP_IDS.S1S2)).ledger_count;
    const r2 = await rpc(client, MP_IDS.S1S2);
    const st2 = await state(client, userId, MP_IDS.S1S2);
    tests.S2 = {
      pass:
        r2.ok &&
        r2.credited === false &&
        r2.idempotent === true &&
        r2.reason === 'already_credited' &&
        st2.ledger_count === lcBefore &&
        Math.abs(st2.saldo - saldoBefore) < 0.01,
      result: r2,
      state: st2,
    };
  } catch (e) {
    tests.S2 = { pass: false, error: e.message };
  }

  try {
    await client.query(`DELETE FROM ledger_financeiro WHERE correlation_id=$1`, [MP_IDS.S3]);
    await client.query(`DELETE FROM pagamentos_pix WHERE payment_id=$1`, [MP_IDS.S3]);
    const saldoBeforeSeed = Number(
      (await client.query(`SELECT saldo FROM usuarios WHERE id=$1`, [userId])).rows[0].saldo
    );
    await seedS3(client, userId);
    const saldoAfterSeed = saldoBeforeSeed + CREDIT;
    const r3 = await rpc(client, MP_IDS.S3);
    const st3 = await state(client, userId, MP_IDS.S3);
    tests.S3 = {
      pass:
        r3.ok &&
        r3.credited === false &&
        r3.reason === 'already_credited' &&
        st3.ledger_count === 1 &&
        Math.abs(st3.saldo - saldoAfterSeed) < 0.01,
      result: r3,
      state: st3,
    };
  } catch (e) {
    tests.S3 = { pass: false, error: e.message };
  }

  try {
    await client.query(`DELETE FROM ledger_financeiro WHERE correlation_id=$1`, [MP_IDS.S4]);
    await client.query(`DELETE FROM pagamentos_pix WHERE payment_id=$1`, [MP_IDS.S4]);
    const saldoBeforeSeed = Number(
      (await client.query(`SELECT saldo FROM usuarios WHERE id=$1`, [userId])).rows[0].saldo
    );
    await seedS4(client, userId, MP_IDS.S4, true);
    const saldoAfterSeed = saldoBeforeSeed + CREDIT;
    const r4 = await rpc(client, MP_IDS.S4);
    const st4 = await state(client, userId, MP_IDS.S4);
    tests.S4 = {
      pass:
        r4.ok &&
        r4.credited === false &&
        r4.reason === 'ledger_backfill' &&
        st4.ledger_count === 1 &&
        Math.abs(st4.saldo - saldoAfterSeed) < 0.01,
      result: r4,
      state: st4,
    };
  } catch (e) {
    tests.S4 = { pass: false, error: e.message };
  }

  try {
    await client.query(`DELETE FROM ledger_financeiro WHERE correlation_id=$1`, [MP_IDS.S5B]);
    await client.query(`DELETE FROM pagamentos_pix WHERE payment_id=$1`, [MP_IDS.S5B]);
    await client.query(`UPDATE public.usuarios SET saldo = 0 WHERE id = $1`, [userId]);
    await seedS4(client, userId, MP_IDS.S5B, false);
    const r5b = await rpc(client, MP_IDS.S5B);
    const st5b = await state(client, userId, MP_IDS.S5B);
    tests.S5 = {
      pass:
        r5b.ok &&
        r5b.credited === false &&
        r5b.reason === 'ledger_backfill' &&
        st5b.ledger_count === 1 &&
        Math.abs(st5b.saldo) < 0.01,
      result: r5b,
      state: st5b,
      runbook_manual: true,
    };
  } catch (e) {
    tests.S5 = { pass: false, error: e.message };
  }

  try {
    await client.query(`DELETE FROM ledger_financeiro WHERE correlation_id=$1`, [MP_IDS.S6]);
    await client.query(`DELETE FROM pagamentos_pix WHERE payment_id=$1`, [MP_IDS.S6]);
    const saldo0 = Number((await client.query(`SELECT saldo FROM usuarios WHERE id=$1`, [userId])).rows[0].saldo);
    await client.query(
      `INSERT INTO public.pagamentos_pix (
         id, usuario_id, payment_id, external_id, status, amount, valor, created_at, updated_at
       ) VALUES (
         gen_random_uuid(), $1, $2, $2, 'pending', $3, $3,
         timezone('utc', now()), timezone('utc', now())
       )`,
      [userId, MP_IDS.S6, CREDIT]
    );
    const url = buildStagingUrls()[0];
    const clientB = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await clientB.connect();
    const [a, b] = await Promise.all([
      client.query(`SELECT public.claim_and_credit_approved_pix_deposit($1::text) AS result`, [MP_IDS.S6]),
      clientB.query(`SELECT public.claim_and_credit_approved_pix_deposit($1::text) AS result`, [MP_IDS.S6]),
    ]);
    await clientB.end().catch(() => {});
    const ra = a.rows[0].result;
    const rb = b.rows[0].result;
    const creditedCount = [ra, rb].filter((x) => x.credited === true).length;
    const st6 = await state(client, userId, MP_IDS.S6);
    tests.S6 = {
      pass:
        creditedCount === 1 &&
        [ra, rb].every((x) => x.ok === true) &&
        st6.ledger_count === 1 &&
        st6.status === 'approved' &&
        Math.abs(st6.saldo - (saldo0 + CREDIT)) < 0.01,
      result_a: ra,
      result_b: rb,
      state: st6,
    };
  } catch (e) {
    tests.S6 = { pass: false, error: e.message };
  }

  out.tests = tests;
}

async function main() {
  let client;
  let baselineDefStored = '';
  try {
    client = await connect();
    await fingerprint(client);
    await ensureIndex(client);

    const defBefore = await getRpcDef(client);
    out.preflight.rpc_def_length_before = defBefore.length;
    out.preflight.had_m1_draft = defBefore.includes('referencia IN (v_ledger_ref, v_mp_id)');

    const baselineSql = loadProdBaselineSql();
    const tmpBaseline = path.join(__dirname, '..', 'database', 'patches', '_r3_staging_baseline_tmp.sql');
    fs.writeFileSync(tmpBaseline, baselineSql, 'utf8');
    const baseRes = await applySqlFile(client, tmpBaseline, 'baseline');
    baselineDefStored = baseRes.def;
    out.baseline_apply = {
      ok: baseRes.def.includes('pg_advisory_xact_lock'),
      def_length: baseRes.def_length,
      self_heal_credits_saldo: extractSelfHealBlock(baseRes.def)?.includes('UPDATE public.usuarios'),
    };

    const userId = await ensureTestUser(client);
    out.test_user_id = userId;
    await runPrePatchRegression(client, userId);

    const patchRes = await applySqlFile(client, PATCH_R3, 'r3');
    out.patch_apply = {
      ok: patchRes.def.includes('ledger_backfill') && patchRes.def.includes('pg_advisory_xact_lock'),
      def_length: patchRes.def_length,
    };
    analyzeDrift(baselineDefStored, patchRes.def);

    await runTests(client, userId);

    const keys = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    const allPass = keys.every((k) => out.tests[k]?.pass === true);
    out.verdict =
      allPass && out.patch_apply.ok && out.drift.only_self_heal_changed !== false
        ? 'GO'
        : allPass
          ? 'GO COM RESSALVAS'
          : 'NO-GO';

    await cleanupMassa(client);
    out.cleanup.ok = true;
  } catch (e) {
    out.error = e.message;
    out.verdict = out.blocked ? 'BLOCKED' : 'NO-GO';
  } finally {
    if (client) {
      try {
        await cleanupMassa(client);
      } catch (_) {
        /* ignore */
      }
      await client.end();
    }
  }

  const jsonPath = path.join(
    __dirname,
    '..',
    'docs',
    'relatorios',
    'V1-1B-M1-R3-STAGING-EXEC-DATA-2026-05-17.json'
  );
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        verdict: out.verdict,
        tests: Object.fromEntries(
          Object.entries(out.tests || {}).map(([k, v]) => [k, v?.pass])
        ),
        drift: out.drift,
        prod_snapshot: out.prod_snapshot,
      },
      null,
      2
    )
  );
  process.exit(out.verdict === 'GO' || out.verdict === 'GO COM RESSALVAS' ? 0 : 1);
}

main();
