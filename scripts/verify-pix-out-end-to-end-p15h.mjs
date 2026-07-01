#!/usr/bin/env node
/**
 * P1.5H — Verificação End-to-End controlada PIX OUT Asaas (mocks, sem PIX real).
 * Certifica cadeia: Factory → HTTP → Persistência → Webhook → Reconciliação (audit).
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

const MOCK_PROD_KEY = '$aact_prod_mock_p15h_e2e_not_real';
const SAQUE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TRANSFER_ID = 'trf_p15h_e2e_001';
const EXTERNAL_REF = 'goldeouro-p15h-e2e-ref';
const CORRELATION_ID = 'corr-p15h-e2e-001';

const STATE_SCENARIOS = [
  {
    label: 'CREATED (TRANSFER_CREATED → PENDING)',
    event: 'TRANSFER_CREATED',
    transferStatus: 'PENDING',
    expectedTransferStatus: 'PENDING',
    expectedSaqueStatus: 'aguardando_confirmacao'
  },
  {
    label: 'PENDING',
    event: 'TRANSFER_PENDING',
    transferStatus: 'PENDING',
    expectedTransferStatus: 'PENDING',
    expectedSaqueStatus: 'aguardando_confirmacao'
  },
  {
    label: 'BANK_PROCESSING',
    event: 'TRANSFER_IN_BANK_PROCESSING',
    transferStatus: 'BANK_PROCESSING',
    expectedTransferStatus: 'BANK_PROCESSING',
    expectedSaqueStatus: 'aguardando_confirmacao'
  },
  {
    label: 'DONE',
    event: 'TRANSFER_DONE',
    transferStatus: 'DONE',
    expectedTransferStatus: 'DONE',
    expectedSaqueStatus: 'processado',
    terminalSuccess: true
  },
  {
    label: 'FAILED',
    event: 'TRANSFER_FAILED',
    transferStatus: 'FAILED',
    expectedTransferStatus: 'FAILED',
    expectedSaqueStatus: 'falhou',
    terminalFail: true
  },
  {
    label: 'CANCELLED',
    event: 'TRANSFER_CANCELLED',
    transferStatus: 'CANCELLED',
    expectedTransferStatus: 'CANCELLED',
    expectedSaqueStatus: 'falhou',
    terminalFail: true
  },
  {
    label: 'BLOCKED',
    event: 'TRANSFER_BLOCKED',
    transferStatus: 'BLOCKED',
    expectedTransferStatus: 'BLOCKED',
    expectedSaqueStatus: 'falhou',
    terminalFail: true
  }
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

function applyE2EProfile(extra = {}) {
  applyEnvironment({
    NODE_ENV: 'production',
    ASAAS_ENV: 'production',
    ASAAS_ENABLED: 'true',
    ASAAS_PIX_OUT_ENABLED: 'true',
    ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'true',
    PAYMENT_ENGINE_PIXOUT_ENABLED: 'true',
    ASAAS_PRODUCTION_ENABLED: 'true',
    PAYOUT_PROVIDER: 'asaas',
    PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true',
    ASAAS_WEBHOOK_ENABLED: 'true',
    ASAAS_WEBHOOK_TOKEN: 'whsec_p15h_e2e_token',
    ALLOW_ASAAS_SANDBOX_WEBHOOK: '1',
    ASAAS_API_KEY: MOCK_PROD_KEY,
    ASAAS_BASE_URL: 'https://api.asaas.com/v3',
    ...extra
  });
  clearAsaasModuleCache(require);
}

function matchLedger(entry, q) {
  if (q.correlation_id && entry.correlation_id !== q.correlation_id) return false;
  if (q.referencia && entry.referencia !== q.referencia) return false;
  if (q.tipo && entry.tipo !== q.tipo) return false;
  if (q.tipo_in && !q.tipo_in.includes(entry.tipo)) return false;
  if (q.referencia_in && !q.referencia_in.includes(entry.referencia)) return false;
  return true;
}

function createE2EMockStore(initialSaque = {}) {
  let saque = {
    id: SAQUE_ID,
    usuario_id: USER_ID,
    status: 'aguardando_confirmacao',
    correlation_id: CORRELATION_ID,
    payout_external_reference: EXTERNAL_REF,
    asaas_transfer_id: null,
    asaas_transfer_status: null,
    amount: 10,
    fee: 1,
    net_amount: 9,
    mp_transaction_intent_id: null,
    ...initialSaque
  };
  const ledgerEntries = [];
  let walletSaldo = 100;

  const supabase = {
    from(table) {
      if (table === 'saques') {
        return {
          select() {
            return {
              eq(column, value) {
                return {
                  async maybeSingle() {
                    if (column === 'asaas_transfer_id' && saque.asaas_transfer_id === value) {
                      return { data: { ...saque }, error: null };
                    }
                    if (column === 'payout_external_reference' && saque.payout_external_reference === value) {
                      return { data: { ...saque }, error: null };
                    }
                    if (column === 'id' && saque.id === value) {
                      return { data: { ...saque }, error: null };
                    }
                    return { data: null, error: null };
                  },
                  async single() {
                    return { data: { ...saque }, error: null };
                  }
                };
              },
              in() {
                return {
                  async maybeSingle() {
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
                  if (column === 'id' && saque.id === value) {
                    saque = { ...saque, ...patch };
                    return { data: null, error: null };
                  }
                  return { data: null, error: { message: 'not found' } };
                };
                return {
                  select() {
                    return {
                      async single() {
                        const r = apply();
                        return { data: saque, error: r.error };
                      }
                    };
                  },
                  then(resolve, reject) {
                    Promise.resolve(apply()).then(resolve, reject);
                  }
                };
              }
            };
          }
        };
      }
      if (table === 'ledger_financeiro') {
        const builder = {
          _q: {},
          insert(row) {
            const entry = { id: `ledger_${ledgerEntries.length + 1}`, ...row };
            ledgerEntries.push(entry);
            return {
              select() {
                return {
                  async single() {
                    return { data: entry, error: null };
                  }
                };
              }
            };
          },
          select() {
            const q = {};
            const chain = {
              eq(col, val) {
                q[col] = val;
                return chain;
              },
              async maybeSingle() {
                const hit = ledgerEntries.find((e) => matchLedger(e, q));
                return {
                  data: hit ? { id: hit.id, tipo: hit.tipo, referencia: hit.referencia } : null,
                  error: null
                };
              },
              in(col, vals) {
                q[`${col}_in`] = vals;
                return {
                  async maybeSingle() {
                    const hit = ledgerEntries.find((e) => matchLedger(e, q));
                    return {
                      data: hit ? { id: hit.id, tipo: hit.tipo, referencia: hit.referencia } : null,
                      error: null
                    };
                  },
                  then(resolve) {
                    const rows = ledgerEntries.filter((e) => matchLedger(e, q));
                    return Promise.resolve({ data: rows, error: null }).then(resolve);
                  }
                };
              }
            };
            return chain;
          }
        };
        return builder;
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
    getLedgerCount: () => ledgerEntries.length,
    getLedgerEntries: () => [...ledgerEntries],
    getWalletSaldo: () => walletSaldo,
    setWalletSaldo: (v) => {
      walletSaldo = v;
    }
  };

  return supabase;
}

function buildTransferBody(eventType, transferStatus) {
  return {
    id: `evt_${eventType.toLowerCase()}_p15h`,
    event: eventType,
    transfer: {
      id: TRANSFER_ID,
      status: transferStatus,
      externalReference: EXTERNAL_REF,
      value: 9,
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

let httpCalls = [];
let restoreFetch = null;

function installHttpMock(transferStatus = 'PENDING') {
  const originalFetch = globalThis.fetch;
  httpCalls = [];
  globalThis.fetch = async (url, init = {}) => {
    httpCalls.push({ url: String(url), method: init.method || 'GET', body: init.body });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: TRANSFER_ID,
        status: transferStatus,
        type: 'PIX',
        value: 9,
        externalReference: EXTERNAL_REF
      })
    };
  };
  restoreFetch = () => {
    globalThis.fetch = originalFetch;
  };
}

try {
  resetAsaasEnvironment();
  applyE2EProfile();
  installHttpMock('PENDING');

  const factory = require('../src/finance/factory/FinanceProviderFactory');
  factory.resetProviderCache();

  await runAsync('e2e step 1: factory resolves asaas', async () => {
    const provider = factory.resolvePayoutProvider();
    if (provider.name !== 'asaas') {
      throw new Error(`expected asaas, got ${provider.name}`);
    }
  });

  await runAsync('e2e step 2: HTTP mock POST /transfers via compat', async () => {
    const { createPixWithdrawCompat } = require('../src/finance/compat/createPixWithdrawCompat');
    const result = await createPixWithdrawCompat(9, 'test@example.com', 'EMAIL', USER_ID, SAQUE_ID, CORRELATION_ID, {
      payoutExternalReference: EXTERNAL_REF,
      idempotencyKey: `idem-${SAQUE_ID}`,
      ownerIdentification: { type: 'CPF', number: '12345678901' }
    });
    if (!result.success || result.provider !== 'asaas') {
      throw new Error(`payout failed: ${result.error}`);
    }
    const post = httpCalls.find((c) => c.url.includes('/transfers') && c.method === 'POST');
    if (!post) {
      throw new Error('POST /transfers not called');
    }
  });

  await runAsync('e2e step 3: payout persistence patch (asaas_*)', async () => {
    const persistence = require('../src/domain/payout/payoutProviderPersistence');
    const normalized = persistence.normalizePayoutResult(
      {
        success: true,
        provider: 'asaas',
        providerRef: TRANSFER_ID,
        transfer: { id: TRANSFER_ID, status: 'PENDING', externalReference: EXTERNAL_REF }
      },
      'asaas'
    );
    const patch = persistence.buildProviderPersistencePatch(normalized);
    if (patch.asaas_transfer_id !== TRANSFER_ID) {
      throw new Error('asaas_transfer_id missing in patch');
    }
    if (patch.mp_transaction_intent_id) {
      throw new Error('mp_* must not be set for asaas');
    }
  });

  await runAsync('e2e step 4: full webhook state machine', async () => {
    const { validateAsaasWebhook, ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
    const { processAsaasTransferWebhook } = require('../src/finance/webhooks/processAsaasTransferWebhook');

    for (const scenario of STATE_SCENARIOS) {
      const store = createE2EMockStore({
        asaas_transfer_id: TRANSFER_ID,
        asaas_transfer_status: null,
        status: 'aguardando_confirmacao'
      });
      store.setWalletSaldo(100);

      const body = buildTransferBody(scenario.event, scenario.transferStatus);
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

      if (!result.success) {
        throw new Error(`${scenario.label}: webhook failed ${result.error}`);
      }
      const row = store.getSaque();
      if (row.asaas_transfer_status !== scenario.expectedTransferStatus) {
        throw new Error(
          `${scenario.label}: expected transfer ${scenario.expectedTransferStatus}, got ${row.asaas_transfer_status}`
        );
      }
      if (row.status !== scenario.expectedSaqueStatus) {
        throw new Error(`${scenario.label}: expected saque ${scenario.expectedSaqueStatus}, got ${row.status}`);
      }
      const ledgerCount = store.getLedgerCount();
      const wallet = store.getWalletSaldo();
      if (scenario.terminalSuccess) {
        if (!store.getLedgerEntries().some((e) => e.tipo === 'payout_confirmado')) {
          throw new Error(`${scenario.label}: expected payout_confirmado`);
        }
        if (wallet !== 100) {
          throw new Error(`${scenario.label}: wallet unchanged on DONE`);
        }
      } else if (scenario.terminalFail) {
        if (!store.getLedgerEntries().some((e) => e.tipo === 'falha_payout')) {
          throw new Error(`${scenario.label}: expected falha_payout`);
        }
        if (wallet !== 110) {
          throw new Error(`${scenario.label}: wallet rollback expected 110, got ${wallet}`);
        }
      } else if (ledgerCount > 0) {
        throw new Error(`${scenario.label}: non-terminal must not write ledger`);
      } else if (wallet !== 100) {
        throw new Error(`${scenario.label}: wallet saldo must not change on non-terminal webhook`);
      }
    }
  });

  await runAsync('e2e step 5: happy path PENDING → BANK_PROCESSING → DONE', async () => {
    const { validateAsaasWebhook, ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
    const { processAsaasTransferWebhook } = require('../src/finance/webhooks/processAsaasTransferWebhook');
    const store = createE2EMockStore({
      asaas_transfer_id: TRANSFER_ID,
      status: 'aguardando_confirmacao'
    });

    const steps = [
      ['TRANSFER_PENDING', 'PENDING'],
      ['TRANSFER_IN_BANK_PROCESSING', 'BANK_PROCESSING'],
      ['TRANSFER_DONE', 'DONE']
    ];

    for (const [event, status] of steps) {
      const body = buildTransferBody(event, status);
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
      if (!result.success) {
        throw new Error(`step ${event} failed`);
      }
    }
    const row = store.getSaque();
    if (row.asaas_transfer_status !== 'DONE' || row.status !== 'processado') {
      throw new Error(`final state wrong: ${row.asaas_transfer_status}/${row.status}`);
    }
  });

  await runAsync('e2e step 6: webhook replay idempotent', async () => {
    const { validateAsaasWebhook, ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
    const { processAsaasTransferWebhook } = require('../src/finance/webhooks/processAsaasTransferWebhook');
    const store = createE2EMockStore({
      asaas_transfer_id: TRANSFER_ID,
      asaas_transfer_status: 'DONE',
      status: 'processado'
    });

    const body = buildTransferBody('TRANSFER_DONE', 'DONE');
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });

    const r1 = await processAsaasTransferWebhook({ validation, body, supabase: store, financeLog: () => {} });
    const r2 = await processAsaasTransferWebhook({ validation, body, supabase: store, financeLog: () => {} });

    if (!r1.success || !r2.success || !r2.idempotent || !r2.replay) {
      throw new Error('replay must be idempotent');
    }
    if (store.getLedgerCount() > 0) {
      throw new Error('replay must not create ledger');
    }
  });

  await runAsync('e2e step 7: HTTP replay audit (provider-level)', async () => {
    httpCalls = [];
    const { createPixWithdrawCompat } = require('../src/finance/compat/createPixWithdrawCompat');
    const opts = {
      payoutExternalReference: EXTERNAL_REF,
      idempotencyKey: `idem-replay-${SAQUE_ID}`,
      ownerIdentification: { type: 'CPF', number: '12345678901' }
    };
    await createPixWithdrawCompat(9, 'test@example.com', 'EMAIL', USER_ID, SAQUE_ID, CORRELATION_ID, opts);
    await createPixWithdrawCompat(9, 'test@example.com', 'EMAIL', USER_ID, SAQUE_ID, CORRELATION_ID, opts);
    if (httpCalls.length !== 2) {
      throw new Error('HTTP replay would hit provider twice — idempotency at webhook/ledger layer');
    }
  });

  test('e2e audit: ledger reconciliation wired', () => {
    const src = require('node:fs').readFileSync(
      path.join(root, 'src/finance/webhooks/processAsaasTransferWebhook.js'),
      'utf8'
    );
    if (!src.includes('payout_confirmado') || !src.includes('falha_payout')) {
      throw new Error('ledger reconciliation missing');
    }
    if (src.includes('ledgerPending')) {
      throw new Error('ledgerPending stub must be removed after P1.5I');
    }
    const mpWebhook = require('node:fs').readFileSync(path.join(root, 'server-fly.js'), 'utf8');
    if (!mpWebhook.includes('payout_confirmado')) {
      throw new Error('MP reference for ledger pattern missing');
    }
  });

  test('e2e audit: gates remain simulation-only (mock key)', () => {
    if (!String(process.env.ASAAS_API_KEY || '').includes('mock_p15h')) {
      throw new Error('must use mock key in e2e');
    }
  });

  if (restoreFetch) restoreFetch();
  resetAsaasEnvironment();
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);

  const regressions = [
    'scripts/verify-payout-factory-unification-p15f.mjs',
    'scripts/verify-payout-provider-aware-p15e.mjs',
    'scripts/verify-asaas-transfer-webhook-p15g.mjs',
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
    console.error('\nVerification FAILED (P1.5H E2E controlled)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.5H E2E controlled — ledger reconciliation wired P1.5I)');
} finally {
  if (restoreFetch) restoreFetch();
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
