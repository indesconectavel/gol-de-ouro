#!/usr/bin/env node
/**
 * P1.5I — Homologação operacional PIX OUT Asaas (mock controlado + auditoria gates).
 * Não executa PIX real — valida reconciliação ledger e prontidão operacional.
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

const SAQUE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const TRANSFER_ID = 'trf_p15i_homolog_001';
const EXTERNAL_REF = 'goldeouro-p15i-homolog-ref';
const CORRELATION_ID = 'corr-p15i-homolog-001';

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

function createHomologStore(initial = {}) {
  let saque = {
    id: SAQUE_ID,
    usuario_id: USER_ID,
    status: 'aguardando_confirmacao',
    correlation_id: CORRELATION_ID,
    payout_external_reference: EXTERNAL_REF,
    asaas_transfer_id: TRANSFER_ID,
    asaas_transfer_status: 'BANK_PROCESSING',
    amount: 10,
    fee: 1,
    net_amount: 9,
    ...initial
  };
  let walletSaldo = initial.walletSaldo ?? 91;
  const ledger = [];

  const supabase = {
    from(table) {
      if (table === 'saques') {
        return {
          select() {
            return {
              eq(col, val) {
                return {
                  async maybeSingle() {
                    if (col === 'asaas_transfer_id' && saque.asaas_transfer_id === val) {
                      return { data: { ...saque }, error: null };
                    }
                    if (col === 'payout_external_reference' && saque.payout_external_reference === val) {
                      return { data: { ...saque }, error: null };
                    }
                    return { data: null, error: null };
                  },
                  in() {
                    return { async maybeSingle() { return { data: null, error: null }; } };
                  },
                  async single() {
                    return { data: { ...saque }, error: null };
                  }
                };
              }
            };
          },
          update(patch) {
            return {
              eq(col, val) {
                const apply = () => {
                  if (col === 'id' && saque.id === val) {
                    saque = { ...saque, ...patch };
                    return { error: null };
                  }
                  return { error: { message: 'not found' } };
                };
                return {
                  select() {
                    return {
                      async single() {
                        const r = apply();
                        return { data: r.error ? null : saque, error: r.error };
                      }
                    };
                  },
                  then: (r) => Promise.resolve(apply()).then(r)
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
                const rows = ledger.filter((e) => match(e));
                return Promise.resolve({ data: rows, error: null }).then(resolve);
              }
            };
          }
        };
        return {
          select() {
            Object.keys(query).forEach((k) => delete query[k]);
            return chain;
          },
          insert(row) {
            const entry = { id: `ledger_${ledger.length + 1}`, ...row };
            ledger.push(entry);
            return {
              select() {
                return { async single() { return { data: entry, error: null }; } };
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
                    return { data: { id: USER_ID, saldo: walletSaldo }, error: null };
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
    getSaque: () => ({ ...saque }),
    getLedger: () => [...ledger],
    getWalletSaldo: () => walletSaldo,
    setWalletSaldo: (v) => { walletSaldo = v; }
  };
  return supabase;
}

function buildBody(event, status) {
  return {
    id: `evt_${event.toLowerCase()}_p15i`,
    event,
    transfer: {
      id: TRANSFER_ID,
      status,
      externalReference: EXTERNAL_REF,
      value: 9,
      type: 'PIX'
    }
  };
}

function runRegression(relativePath) {
  const result = spawnSync(process.execPath, [path.join(root, relativePath)], {
    cwd: root,
    env: { ...process.env },
    encoding: 'utf8',
    timeout: 600000
  });
  if (result.status !== 0) {
    throw new Error(`${relativePath} failed`);
  }
}

try {
  resetAsaasEnvironment();
  applyEnvironment({
    PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true',
    ASAAS_WEBHOOK_ENABLED: 'true',
    ASAAS_WEBHOOK_TOKEN: 'whsec_p15i_homolog',
    ALLOW_ASAAS_SANDBOX_WEBHOOK: '1',
    ASAAS_ENABLED: 'true',
    NODE_ENV: 'development',
    ASAAS_ENV: 'sandbox'
  });
  clearAsaasModuleCache(require);

  const { validateAsaasWebhook, ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
  const { processAsaasTransferWebhook } = require('../src/finance/webhooks/processAsaasTransferWebhook');

  test('gates audit: production OUT gates OFF by default', () => {
    resetAsaasEnvironment();
    applyEnvironment({
      NODE_ENV: 'production',
      ASAAS_ENV: 'production',
      ASAAS_ENABLED: 'true',
      ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'false',
      PAYMENT_ENGINE_PIXOUT_ENABLED: 'false'
    });
    clearAsaasModuleCache(require);
    const cfg = require('../src/finance/config/asaas-pix-out-config');
    if (cfg.isAsaasPixOutProductionHttpEnabled()) {
      throw new Error('production gates must be OFF by default');
    }
    resetAsaasEnvironment();
    applyEnvironment({
      PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true',
      ASAAS_WEBHOOK_ENABLED: 'true',
      ASAAS_WEBHOOK_TOKEN: 'whsec_p15i_homolog',
      ALLOW_ASAAS_SANDBOX_WEBHOOK: '1'
    });
    clearAsaasModuleCache(require);
  });

  await runAsync('homolog: DONE → payout_confirmado + wallet unchanged', async () => {
    const store = createHomologStore({ walletSaldo: 91 });
    const before = store.getWalletSaldo();
    const body = buildBody('TRANSFER_DONE', 'DONE');
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });
    const result = await processAsaasTransferWebhook({
      validation,
      body,
      supabase: store,
      financeLog: () => {}
    });
    if (!result.success || result.ledgerTipo !== 'payout_confirmado') {
      throw new Error(`expected payout_confirmado, got ${JSON.stringify(result)}`);
    }
    if (store.getWalletSaldo() !== before) {
      throw new Error('wallet must not change on DONE (already debited at request)');
    }
    const ledger = store.getLedger();
    if (!ledger.some((e) => e.tipo === 'payout_confirmado')) {
      throw new Error('payout_confirmado missing');
    }
    if (store.getSaque().status !== 'processado') {
      throw new Error('saque must be processado');
    }
  });

  await runAsync('homolog: FAILED → falha_payout + rollback wallet', async () => {
    const store = createHomologStore({ walletSaldo: 91, asaas_transfer_status: 'PENDING' });
    const before = store.getWalletSaldo();
    const body = buildBody('TRANSFER_FAILED', 'FAILED');
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });
    const result = await processAsaasTransferWebhook({
      validation,
      body,
      supabase: store,
      financeLog: () => {}
    });
    if (!result.success || result.ledgerTipo !== 'falha_payout' || !result.rollbackApplied) {
      throw new Error(`expected fail path, got ${JSON.stringify(result)}`);
    }
    if (store.getWalletSaldo() !== before + 10) {
      throw new Error(`wallet should restore amount (91→101), got ${store.getWalletSaldo()}`);
    }
    const tipos = store.getLedger().map((e) => e.tipo);
    if (!tipos.includes('falha_payout') || !tipos.includes('rollback')) {
      throw new Error(`ledger tipos expected falha_payout+rollback, got ${tipos.join(',')}`);
    }
  });

  await runAsync('homolog: ledger replay idempotent', async () => {
    const store = createHomologStore({ status: 'processado', asaas_transfer_status: 'DONE' });
    store.from('ledger_financeiro').insert({
      tipo: 'payout_confirmado',
      valor: 9,
      referencia: SAQUE_ID,
      correlation_id: CORRELATION_ID,
      user_id: USER_ID
    });
    const body = buildBody('TRANSFER_DONE', 'DONE');
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });
    const r1 = await processAsaasTransferWebhook({ validation, body, supabase: store, financeLog: () => {} });
    const countBefore = store.getLedger().length;
    const r2 = await processAsaasTransferWebhook({ validation, body, supabase: store, financeLog: () => {} });
    if (!r2.ledgerIdempotent && !r2.idempotent) {
      throw new Error('replay must be ledger idempotent');
    }
    if (store.getLedger().length !== countBefore) {
      throw new Error('no duplicate ledger on replay');
    }
  });

  test('code audit: ledger wired in transfer webhook', () => {
    const src = require('node:fs').readFileSync(
      path.join(root, 'src/finance/webhooks/processAsaasTransferWebhook.js'),
      'utf8'
    );
    if (!src.includes('payout_confirmado') || !src.includes('falha_payout')) {
      throw new Error('ledger reconciliation missing');
    }
    if (src.includes('ledgerPending')) {
      throw new Error('ledgerPending stub must be removed');
    }
  });

  resetAsaasEnvironment();
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);

  const regressions = [
    'scripts/verify-pix-out-end-to-end-p15h.mjs',
    'scripts/verify-asaas-transfer-webhook-p15g.mjs',
    'scripts/verify-payout-factory-unification-p15f.mjs',
    'scripts/verify-payout-provider-aware-p15e.mjs',
    'scripts/verify-asaas-pix-out-production-gates.mjs',
    'scripts/verify-asaas-pix-out-production-readiness.mjs'
  ];
  for (const s of regressions) {
    test(`regression: ${path.basename(s)}`, () => runRegression(s));
  }

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.5I homologation)');
    process.exit(process.exitCode);
  }
  console.log('\nVerification PASSED (P1.5I mock homologation — production transfer requires gate authorization)');
} finally {
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
