#!/usr/bin/env node
/**
 * P1.5G — Verificação webhook TRANSFER Asaas (mock Supabase, sem PIX real).
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyEnvironment
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envSnapshot = snapshotEnvironment();

const SAQUE_ID = '11111111-1111-4111-8111-111111111111';
const TRANSFER_ID = 'trf_p15g_verify_001';
const EXTERNAL_REF = 'goldeouro-p15g-ref-001';

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

function createMockSupabase(initialRow) {
  let row = {
    amount: 10,
    fee: 1,
    net_amount: 9,
    ...initialRow
  };
  const ledger = [];
  let walletSaldo = 100;

  const api = {
    from(table) {
      if (table === 'saques') {
        return {
          select() {
            return {
              eq(column, value) {
                return {
                  async maybeSingle() {
                    if (column === 'asaas_transfer_id' && row.asaas_transfer_id === value) {
                      return { data: { ...row }, error: null };
                    }
                    if (column === 'payout_external_reference' && row.payout_external_reference === value) {
                      return { data: { ...row }, error: null };
                    }
                    return { data: null, error: null };
                  }
                };
              }
            };
          },
          update(patch) {
            return {
              eq(column, value) {
                const apply = () => {
                  if (column === 'id' && row.id === value) {
                    row = { ...row, ...patch };
                    return { error: null };
                  }
                  return { error: { message: 'not found' } };
                };
                return {
                  select() {
                    return {
                      async single() {
                        const r = apply();
                        return { data: r.error ? null : row, error: r.error };
                      }
                    };
                  },
                  async then(resolve, reject) {
                    try {
                      resolve(apply());
                    } catch (err) {
                      reject(err);
                    }
                  }
                };
              }
            };
          }
        };
      }
      if (table === 'ledger_financeiro') {
        const query = {};
        const match = (e) => {
          if (query.correlation_id && e.correlation_id !== query.correlation_id) return false;
          if (query.referencia && e.referencia !== query.referencia) return false;
          if (query.tipo && e.tipo !== query.tipo) return false;
          if (query.referencia_in && !query.referencia_in.includes(e.referencia)) return false;
          if (query.tipo_in && !query.tipo_in.includes(e.tipo)) return false;
          return true;
        };
        const chain = {
          eq(col, val) {
            query[col] = val;
            return chain;
          },
          async maybeSingle() {
            const hit = ledger.find((e) => match(e));
            return { data: hit ? { id: hit.id, tipo: hit.tipo, referencia: hit.referencia } : null, error: null };
          },
          in(col, vals) {
            query[`${col}_in`] = vals;
            return {
              async maybeSingle() {
                const hit = ledger.find((e) => match(e));
                return { data: hit ? { id: hit.id, tipo: hit.tipo, referencia: hit.referencia } : null, error: null };
              },
              then(resolve) {
                return Promise.resolve({ data: ledger.filter((e) => match(e)), error: null }).then(resolve);
              }
            };
          }
        };
        return {
          select() {
            Object.keys(query).forEach((k) => delete query[k]);
            return chain;
          },
          insert(entry) {
            const rowEntry = { id: `ledger_${ledger.length + 1}`, ...entry };
            ledger.push(rowEntry);
            return {
              select() {
                return { async single() { return { data: rowEntry, error: null }; } };
              }
            };
          }
        };
      }
      if (table === 'usuarios') {
        return {
          select() {
            return {
              eq() {
                return {
                  async single() {
                    return { data: { id: row.usuario_id, saldo: walletSaldo }, error: null };
                  }
                };
              }
            };
          },
          update(patch) {
            walletSaldo = patch.saldo ?? walletSaldo;
            return { eq: () => ({ then: (r) => r({ error: null }) }) };
          }
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    getRow() {
      return { ...row };
    },
    getLedger() {
      return [...ledger];
    }
  };
  return api;
}

function buildTransferBody(eventType, status) {
  return {
    id: `evt_${eventType.toLowerCase()}_001`,
    event: eventType,
    transfer: {
      id: TRANSFER_ID,
      status,
      externalReference: EXTERNAL_REF,
      value: 10,
      type: 'PIX'
    }
  };
}

function runRegressionScript(relativePath) {
  const scriptPath = path.join(root, relativePath);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    env: { ...process.env },
    encoding: 'utf8',
    timeout: 600000
  });
  if (result.status !== 0) {
    const tail = (result.stderr || result.stdout || '').split('\n').slice(-8).join('\n');
    throw new Error(`${relativePath} exit ${result.status}\n${tail}`);
  }
}

try {
  resetAsaasEnvironment();
  applyEnvironment({
    PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true',
    ASAAS_WEBHOOK_ENABLED: 'true',
    ASAAS_WEBHOOK_TOKEN: 'whsec_p15g_verify_token',
    ASAAS_ENABLED: 'true',
    ALLOW_ASAAS_SANDBOX_AUTH: '1',
    ALLOW_ASAAS_SANDBOX_WEBHOOK: '1',
    ASAAS_ENV: 'sandbox',
    NODE_ENV: 'development'
  });
  clearAsaasModuleCache(require);

  const { validateAsaasWebhook, ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
  const { processAsaasTransferWebhook } = require('../src/finance/webhooks/processAsaasTransferWebhook');
  const { processPaymentWebhook } = require('../src/finance/webhooks/processPaymentWebhook');

  const baseSaque = {
    id: SAQUE_ID,
    usuario_id: '22222222-2222-4222-8222-222222222222',
    status: 'aguardando_confirmacao',
    correlation_id: 'corr-p15g-001',
    payout_external_reference: EXTERNAL_REF,
    asaas_transfer_id: TRANSFER_ID,
    asaas_transfer_status: 'PENDING',
    mp_transaction_intent_id: null
  };

  await runAsync('scenario 1: valid transfer webhook updates saque', async () => {
    const supabase = createMockSupabase(baseSaque);
    const body = buildTransferBody('TRANSFER_IN_BANK_PROCESSING', 'BANK_PROCESSING');
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });
    const result = await processAsaasTransferWebhook({
      validation,
      body,
      supabase,
      financeLog: () => {}
    });
    if (!result.success || result.idempotent) {
      throw new Error(`expected success update, got ${JSON.stringify(result)}`);
    }
    const row = supabase.getRow();
    if (row.asaas_transfer_status !== 'BANK_PROCESSING') {
      throw new Error(`expected BANK_PROCESSING, got ${row.asaas_transfer_status}`);
    }
    if (!row.last_asaas_sync_at) {
      throw new Error('last_asaas_sync_at missing');
    }
    if (!row.asaas_payout_raw?.id) {
      throw new Error('asaas_payout_raw missing');
    }
  });

  await runAsync('scenario 2: replay same webhook is idempotent', async () => {
    const supabase = createMockSupabase({
      ...baseSaque,
      asaas_transfer_status: 'BANK_PROCESSING',
      status: 'aguardando_confirmacao'
    });
    const body = buildTransferBody('TRANSFER_IN_BANK_PROCESSING', 'BANK_PROCESSING');
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });
    const result = await processAsaasTransferWebhook({
      validation,
      body,
      supabase,
      financeLog: () => {}
    });
    if (!result.success || !result.idempotent || !result.replay) {
      throw new Error('expected idempotent replay');
    }
  });

  await runAsync('scenario 3: status advances to DONE / processado', async () => {
    const supabase = createMockSupabase({
      ...baseSaque,
      asaas_transfer_status: 'BANK_PROCESSING',
      status: 'aguardando_confirmacao'
    });
    const body = buildTransferBody('TRANSFER_DONE', 'DONE');
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });
    const result = await processAsaasTransferWebhook({
      validation,
      body,
      supabase,
      financeLog: () => {}
    });
    if (!result.success || result.terminalSuccess !== true) {
      throw new Error('expected terminal success');
    }
    const row = supabase.getRow();
    if (row.asaas_transfer_status !== 'DONE') {
      throw new Error(`expected DONE, got ${row.asaas_transfer_status}`);
    }
    if (row.status !== 'processado') {
      throw new Error(`expected processado, got ${row.status}`);
    }
    if (!supabase.getLedger().some((e) => e.tipo === 'payout_confirmado')) {
      throw new Error('expected payout_confirmado ledger on DONE');
    }
    if (result.ledgerTipo !== 'payout_confirmado') {
      throw new Error(`expected ledgerTipo payout_confirmado, got ${result.ledgerTipo}`);
    }
  });

  await runAsync('scenario 4: missing withdrawal returns controlled 404', async () => {
    const supabase = createMockSupabase({
      ...baseSaque,
      asaas_transfer_id: 'other-id',
      payout_external_reference: 'other-ref'
    });
    const body = buildTransferBody('TRANSFER_DONE', 'DONE');
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });
    const result = await processAsaasTransferWebhook({
      validation,
      body,
      supabase,
      financeLog: () => {}
    });
    if (result.error !== 'WITHDRAWAL_NOT_FOUND' || result.httpStatus !== 404) {
      throw new Error(`expected WITHDRAWAL_NOT_FOUND 404, got ${result.error}`);
    }
  });

  await runAsync('integration: processPaymentWebhook routes transfer category', async () => {
    const supabase = createMockSupabase({
      ...baseSaque,
      asaas_transfer_status: 'PENDING'
    });
    const body = buildTransferBody('TRANSFER_PENDING', 'PENDING');
    const result = await processPaymentWebhook({
      provider: 'asaas',
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body,
      deps: { supabase, financeLog: () => {} }
    });
    if (!result.success || result.category !== 'transfer') {
      throw new Error('processPaymentWebhook must handle transfer branch');
    }
  });

  test('mp_* fields untouched by asaas transfer patch', () => {
    const { buildAsaasPersistencePatch } = require('../src/finance/webhooks/processAsaasTransferWebhook');
    const patch = buildAsaasPersistencePatch({
      transferId: TRANSFER_ID,
      transferStatus: 'PENDING',
      sanitizedTransfer: { id: TRANSFER_ID, status: 'PENDING' }
    });
    if (patch.mp_transaction_intent_id || patch.mp_payout_status) {
      throw new Error('patch must not include mp_* fields');
    }
  });

  resetAsaasEnvironment();
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);

  const regressions = [
    'scripts/verify-payout-factory-unification-p15f.mjs',
    'scripts/verify-payout-provider-aware-p15e.mjs',
    'scripts/verify-asaas-pix-out-production-gates.mjs',
    'scripts/verify-asaas-pix-out-production-readiness.mjs',
    'scripts/verify-asaas-pix-out-schema-p15d.mjs',
    'scripts/verify-asaas-provider.mjs',
    'scripts/verify-payment-webhook-engine.mjs'
  ];

  for (const script of regressions) {
    test(`regression: ${path.basename(script)}`, () => {
      runRegressionScript(script);
    });
  }

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.5G transfer webhook)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.5G transfer webhook)');
} finally {
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
