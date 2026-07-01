#!/usr/bin/env node
/**
 * P1.5D — Verificação schema provider-aware PIX OUT Asaas (read-only / estático).
 * Confirma migration aditiva, colunas legadas MP e ausência de wiring no worker.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const root = path.join(__dirname, '..');

const MIGRATION = path.join(
  root,
  'database/migrations/20260628_p15d_asaas_payout_transfer_columns.sql'
);
const ROLLBACK = path.join(
  root,
  'database/migrations/20260628_p15d_asaas_payout_transfer_columns_rollback.sql'
);
const MP_MIGRATION = path.join(
  root,
  'database/migrations/20260424_mp_payout_transaction_intents.sql'
);
const WORKER = path.join(root, 'src/domain/payout/processPendingWithdrawals.js');

const ASAAS_COLUMNS = [
  'asaas_transfer_id',
  'asaas_transfer_status',
  'asaas_payout_raw',
  'last_asaas_sync_at'
];

const LEGACY_MP_COLUMNS = [
  'mp_transaction_intent_id',
  'payout_external_reference',
  'mp_payout_status',
  'mp_payout_raw',
  'last_mp_sync_at'
];

function test(name, fn) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}:`, err.message);
    process.exitCode = 1;
  }
}

async function runAsync(name, fn) {
  try {
    await fn();
    console.log(`OK ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}:`, err.message);
    process.exitCode = 1;
  }
}

function readSql(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`arquivo ausente: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function assertIdempotentAdditive(sql, label) {
  if (!/ADD COLUMN IF NOT EXISTS/i.test(sql)) {
    throw new Error(`${label}: migration deve usar ADD COLUMN IF NOT EXISTS`);
  }
  if (/DROP COLUMN(?!\s+IF\s+EXISTS)/i.test(sql.replace(/rollback/gi, ''))) {
    // forward migration must not drop columns
  }
  if (!label.includes('rollback') && /\bDROP\s+COLUMN\b/i.test(sql)) {
    throw new Error(`${label}: migration forward não deve conter DROP COLUMN`);
  }
  if (!label.includes('rollback') && /\bALTER\s+COLUMN\b/i.test(sql)) {
    throw new Error(`${label}: migration forward não deve ALTER COLUMN`);
  }
  if (!label.includes('rollback') && /\bUPDATE\s+public\.saques\b/i.test(sql)) {
    throw new Error(`${label}: migration forward não deve UPDATE saques`);
  }
}

try {
  const forwardSql = readSql(MIGRATION);
  const rollbackSql = readSql(ROLLBACK);
  const mpSql = readSql(MP_MIGRATION);

  test('migration P1.5D existe', () => {
    if (!forwardSql.includes('public.saques')) {
      throw new Error('ALTER TABLE saques ausente');
    }
  });

  test('migration P1.5D é aditiva e idempotente', () => {
    assertIdempotentAdditive(forwardSql, 'forward');
    for (const col of ASAAS_COLUMNS) {
      if (!forwardSql.includes(col)) {
        throw new Error(`coluna ${col} ausente na migration forward`);
      }
    }
    if (!/CREATE INDEX IF NOT EXISTS/i.test(forwardSql)) {
      throw new Error('índices devem ser IF NOT EXISTS');
    }
  });

  test('rollback P1.5D é reversível', () => {
    for (const col of ASAAS_COLUMNS) {
      if (!rollbackSql.includes(col)) {
        throw new Error(`coluna ${col} ausente no rollback`);
      }
    }
    if (!/DROP COLUMN IF EXISTS/i.test(rollbackSql)) {
      throw new Error('rollback deve usar DROP COLUMN IF EXISTS');
    }
    if (/mp_transaction_intent_id|mp_payout_status|mp_payout_raw|last_mp_sync_at/i.test(rollbackSql)) {
      throw new Error('rollback não deve tocar colunas MP');
    }
  });

  test('migration MP legada preservada (referência)', () => {
    for (const col of LEGACY_MP_COLUMNS) {
      if (!mpSql.includes(col)) {
        throw new Error(`coluna legada ${col} ausente na migration MP`);
      }
    }
  });

  test('worker ainda referencia apenas mp_* (sem wiring Asaas P1.5D)', () => {
    const workerSrc = fs.readFileSync(WORKER, 'utf8');
    for (const col of ASAAS_COLUMNS) {
      if (workerSrc.includes(col)) {
        throw new Error(`worker não deve referenciar ${col} nesta etapa`);
      }
    }
    if (!workerSrc.includes('mp_transaction_intent_id')) {
      throw new Error('worker deve manter mp_transaction_intent_id');
    }
    if (!workerSrc.includes('mp_payout_status')) {
      throw new Error('worker deve manter mp_payout_status');
    }
  });

  test('tipos de coluna Asaas espelham padrão MP', () => {
    const typePairs = [
      ['asaas_transfer_id', 'TEXT'],
      ['asaas_transfer_status', 'TEXT'],
      ['asaas_payout_raw', 'JSONB'],
      ['last_asaas_sync_at', 'TIMESTAMPTZ']
    ];
    for (const [col, type] of typePairs) {
      const re = new RegExp(`${col}\\s+${type}`, 'i');
      if (!re.test(forwardSql)) {
        throw new Error(`${col} deve ser ${type}`);
      }
    }
  });

  await runAsync('DB opcional: colunas em information_schema (se DATABASE_URL)', async () => {
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!dbUrl) {
      console.log('  (skip — DATABASE_URL não definido; validação estática suficiente)');
      return;
    }
    let pg;
    try {
      pg = require('pg');
    } catch {
      console.log('  (skip — pacote pg indisponível)');
      return;
    }
    const client = new pg.Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000
    });
    await client.connect();
    try {
      const { rows } = await client.query(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'saques'
         ORDER BY ordinal_position`
      );
      const names = new Set(rows.map((r) => r.column_name));
      for (const col of [...ASAAS_COLUMNS, ...LEGACY_MP_COLUMNS]) {
        if (!names.has(col)) {
          throw new Error(`coluna ${col} ausente no banco — aplicar migration forward`);
        }
      }
      for (const col of ASAAS_COLUMNS) {
        const row = rows.find((r) => r.column_name === col);
        if (row?.is_nullable !== 'YES') {
          throw new Error(`${col} deve ser nullable (additive)`);
        }
      }
      const { rows: idxRows } = await client.query(
        `SELECT indexname FROM pg_indexes
         WHERE schemaname = 'public' AND tablename = 'saques'
           AND indexname IN ('saques_asaas_transfer_id_idx', 'saques_asaas_transfer_status_idx')`
      );
      if (idxRows.length < 2) {
        throw new Error(
          `índices Asaas ausentes (${idxRows.length}/2) — aplicar migration forward`
        );
      }
    } finally {
      await client.end();
    }
  });

  console.log('\nP1.5D schema verification complete.');
} catch (err) {
  console.error('FAIL bootstrap:', err.message);
  process.exitCode = 1;
}
