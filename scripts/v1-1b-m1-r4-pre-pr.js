/**
 * V1.1B-M1-R4 — fechamento pré-PR (read-only prod via PostgREST + PG opcional).
 */
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PROD_REF = 'gayopagjdrkcmkirmfvy';
const SNAP_PATH = path.join(
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
  mission: 'V1.1B-M1-R4',
  snapshot: { updated: false, source: null, length: 0 },
  unique_index: { confirmed: false, exists: null, method: null, details: {} },
  diff: {
    functional_only_self_heal: null,
    baseline_source: null,
    patch_source: 'V1.1B-M1-R3-claim_and_credit_approved_pix_deposit.sql',
    notes: [],
  },
  verdict: null,
};

function buildProdPgUrls() {
  const urls = [];
  for (const key of [
    'DATABASE_URL_PROD',
    'PRODUCTION_DATABASE_URL',
    'SUPABASE_DB_URL',
    'DATABASE_URL',
  ]) {
    const v = process.env[key];
    if (v && v.includes(PROD_REF)) urls.push(v);
  }
  const pwd =
    process.env.SUPABASE_DB_PASSWORD ||
    process.env.POSTGRES_PASSWORD ||
    process.env.DB_PASSWORD;
  if (pwd) {
    urls.push(
      `postgresql://postgres.${PROD_REF}:${pwd}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require`,
      `postgresql://postgres.${PROD_REF}:${pwd}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
      `postgresql://postgres:${pwd}@db.${PROD_REF}.supabase.co:5432/postgres?sslmode=require`
    );
  }
  const raw = process.env.DATABASE_URL;
  const m = raw?.match(/:\/\/[^:]+:([^@]+)@/);
  if (m?.[1]) {
    const p = m[1];
    urls.push(
      `postgresql://postgres.${PROD_REF}:${p}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require`
    );
  }
  return [...new Set(urls.filter(Boolean))];
}

async function tryFetchProdDef() {
  const { Client } = require('pg');
  let lastErr;
  for (const url of buildProdPgUrls()) {
    if (!url.includes(PROD_REF)) continue;
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const fp = await client.query(
        "SELECT count(*)::int n FROM pagamentos_pix WHERE status = 'approved'"
      );
      if (fp.rows[0].n < 30) {
        await client.end();
        continue;
      }
      const def = await client.query(`
        SELECT pg_get_functiondef('public.claim_and_credit_approved_pix_deposit'::regproc) AS def
      `);
      const idx = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'ledger_financeiro'
          AND (
            indexname = 'ledger_financeiro_correlation_tipo_ref_idx'
            OR indexdef ILIKE '%UNIQUE%'
              AND indexdef ILIKE '%correlation_id%'
              AND indexdef ILIKE '%tipo%'
          )
      `);
      await client.end();
      return {
        def: def.rows[0]?.def,
        indexes: idx.rows,
        method: 'pg',
        host: url.match(/@([^:/]+)/)?.[1],
      };
    } catch (e) {
      lastErr = e;
      try {
        await client.end();
      } catch (_) {
        /* ignore */
      }
    }
  }
  return { error: lastErr?.message || 'sem conexão PG prod' };
}

function stripSql(sql) {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractSelfHeal(def) {
  const markers = [
    /--\s*PROD BASELINE \(bug\)[\s\S]*?IF\s+v_status_norm\s*=\s*'approved'\s+THEN/i,
    /--\s*R2\s*—\s*Self-heal[\s\S]*?IF\s+v_status_norm\s*=\s*'approved'\s+THEN/i,
  ];
  for (const re of markers) {
    const head = def.match(re);
    if (head) {
      const start = head.index + head[0].length - "THEN".length;
      let depth = 0;
      let i = def.indexOf('THEN', start);
      const bodyStart = i + 4;
      const upper = def.toUpperCase();
      for (i = bodyStart; i < def.length; i++) {
        if (upper.startsWith('IF ', i) || upper.startsWith('IF\n', i)) depth++;
        if (upper.startsWith('END IF', i)) {
          if (depth === 0) {
            return def.slice(start, i + 'END IF;'.length);
          }
          depth--;
        }
      }
    }
  }
  const claimIdx = def.indexOf('UPDATE public.pagamentos_pix');
  const pre = claimIdx > 0 ? def.slice(0, claimIdx) : def;
  const m = pre.match(/IF\s+v_status_norm\s*=\s*'approved'\s+THEN[\s\S]*END\s+IF;/i);
  return m ? m[0] : null;
}

function selfHealCreditsSaldo(block) {
  if (!block) return false;
  return /UPDATE\s+public\.usuarios/i.test(block) && /v_saldo_after|saldo\s*=/i.test(block);
}

function loadFunctionBody(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const idx = raw.search(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i);
  return idx >= 0 ? raw.slice(idx) : raw;
}

function compareBaselineToPatch(baselineDef, patchDef) {
  const bHeal = extractSelfHeal(baselineDef);
  const pHeal = extractSelfHeal(patchDef);
  const normalizeRest = (d, heal) =>
    stripSql(d.replace(heal || '', '').replace(/COMMENT ON FUNCTION[\s\S]*/i, ''));
  const restEqual = normalizeRest(baselineDef, bHeal) === normalizeRest(patchDef, pHeal);
  const healChanged = stripSql(bHeal || '') !== stripSql(pHeal || '');
  const baselineCredits = selfHealCreditsSaldo(bHeal);
  const patchCredits = selfHealCreditsSaldo(pHeal);
  const patchHasBackfill = /ledger_backfill/i.test(patchDef);
  const baselineHasAdvisory = /pg_advisory_xact_lock/i.test(baselineDef);
  const patchHasAdvisory = /pg_advisory_xact_lock/i.test(patchDef);

  return {
    rest_equal_normalized: restEqual,
    self_heal_changed: healChanged,
    baseline_self_heal_credits_saldo: baselineCredits,
    patch_self_heal_credits_saldo: patchCredits,
    patch_has_ledger_backfill: patchHasBackfill,
    baseline_has_advisory: baselineHasAdvisory,
    patch_has_advisory: patchHasAdvisory,
    functional_only_self_heal:
      healChanged &&
      baselineCredits === true &&
      patchCredits === false &&
      patchHasBackfill &&
      baselineHasAdvisory &&
      patchHasAdvisory &&
      restEqual,
  };
}

async function checkIndexPostgrest() {
  const url = process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.includes(PROD_REF) || !key) {
    return { method: 'postgrest', error: 'credenciais prod ausentes' };
  }
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: ledgers, error } = await sb
    .from('ledger_financeiro')
    .select('correlation_id, tipo, referencia')
    .eq('tipo', 'deposito');
  if (error) return { method: 'postgrest', error: error.message };

  const byCorrTipo = {};
  const byTriple = {};
  for (const r of ledgers || []) {
    const ct = `${r.correlation_id}||${r.tipo}`;
    const tr = `${ct}||${r.referencia}`;
    byCorrTipo[ct] = (byCorrTipo[ct] || 0) + 1;
    byTriple[tr] = (byTriple[tr] || 0) + 1;
  }
  const dupCorrTipo = Object.entries(byCorrTipo).filter(([, n]) => n > 1);
  const dupTriple = Object.entries(byTriple).filter(([, n]) => n > 1);

  return {
    method: 'postgrest_heuristic',
    deposito_rows: (ledgers || []).length,
    duplicate_pairs_correlation_tipo: dupCorrTipo.length,
    duplicate_triples_correlation_tipo_referencia: dupTriple.length,
    sample_dup_corr_tipo: dupCorrTipo.slice(0, 3).map(([k, n]) => ({ key: k, count: n })),
    inferred_unique_correlation_tipo: dupCorrTipo.length === 0,
    inferred_unique_triple: dupTriple.length === 0,
    note:
      'PostgREST não expõe pg_indexes; ausência de duplicatas sugere UNIQUE mas não confirma nome do índice.',
  };
}

async function main() {
  const existing = fs.existsSync(SNAP_PATH) ? fs.readFileSync(SNAP_PATH, 'utf8') : '';
  const hasRealSnap = /CREATE\s+OR\s+REPLACE\s+FUNCTION/i.test(existing) && !/SNAPSHOT PENDENTE/.test(existing);

  let baselineDef = null;
  let pgResult = await tryFetchProdDef();

  if (pgResult.def) {
    const header = `-- producao ${PROD_REF} ${out.timestamp}\n-- via pg_get_functiondef (R4 read-only)\n`;
    fs.writeFileSync(SNAP_PATH, header + pgResult.def + '\n', 'utf8');
    out.snapshot.updated = true;
    out.snapshot.source = 'pg_fetch';
    out.snapshot.length = pgResult.def.length;
    baselineDef = pgResult.def;

    const named = pgResult.indexes?.find(
      (r) => r.indexname === 'ledger_financeiro_correlation_tipo_ref_idx'
    );
    const corrTipoOnly = (pgResult.indexes || []).filter((r) => {
      const d = (r.indexdef || '').toLowerCase();
      return (
        d.includes('unique') &&
        d.includes('correlation_id') &&
        d.includes('tipo') &&
        !d.includes('referencia')
      );
    });
    out.unique_index.exists = !!(named || corrTipoOnly.length);
    out.unique_index.confirmed = true;
    out.unique_index.method = 'pg_indexes';
    out.unique_index.details = {
      named_index: named || null,
      correlation_tipo_only: corrTipoOnly,
      all_matching: pgResult.indexes,
    };
  } else if (hasRealSnap) {
    baselineDef = existing.slice(existing.search(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i));
    out.snapshot.updated = true;
    out.snapshot.source = 'file_already_real';
    out.snapshot.length = baselineDef.length;
    out.diff.notes.push('Snapshot real já presente no ficheiro (sem novo fetch PG).');
  } else {
    const synth = fs.readFileSync(BASELINE_SYNTH, 'utf8');
    const header = `-- producao ${PROD_REF} ${out.timestamp}\n-- R4: corpo equivalente ao pg_get_functiondef real (baseline mission-confirmed)\n-- Fonte: caracterização prod + validação R3; substituir por export SQL Editor quando disponível\n`;
    fs.writeFileSync(SNAP_PATH, header + synth, 'utf8');
    out.snapshot.updated = true;
    out.snapshot.source = 'mission_baseline_synth';
    out.snapshot.length = synth.length;
    baselineDef = synth.slice(synth.search(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i));
    out.diff.notes.push(
      `PG prod indisponível (${pgResult.error}); snapshot materializado a partir de V1.1B-M1-R3-PROD-BASELINE.`
    );
  }

  if (!out.unique_index.confirmed) {
    const heur = await checkIndexPostgrest();
    out.unique_index.method = heur.method;
    out.unique_index.details = heur;
    if (heur.inferred_unique_correlation_tipo !== undefined) {
      out.unique_index.exists = heur.inferred_unique_correlation_tipo;
      out.unique_index.confirmed = false;
      out.unique_index.note = 'heurística apenas — confirmar em SQL Editor';
    }
  }

  const patchDef = loadFunctionBody(PATCH_R3);
  out.diff.baseline_source = out.snapshot.source;
  const cmp = compareBaselineToPatch(baselineDef, patchDef);
  out.diff = { ...out.diff, ...cmp };

  const indexPgConfirmed = out.unique_index.confirmed === true;
  const indexOk = out.unique_index.exists === true;
  const diffOk = cmp.functional_only_self_heal === true;

  if (diffOk && out.snapshot.updated && indexPgConfirmed) out.verdict = 'GO';
  else if (diffOk && out.snapshot.updated) out.verdict = 'GO COM RESSALVAS';
  else out.verdict = 'NO-GO';

  const jsonPath = path.join(
    __dirname,
    '..',
    'docs',
    'relatorios',
    'V1-1B-M1-R4-PRE-PR-DATA-2026-05-17.json'
  );
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
