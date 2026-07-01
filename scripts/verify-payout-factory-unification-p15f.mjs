#!/usr/bin/env node
/**
 * P1.5F — Verificação unificação Factory no worker/admin (sem PIX real).
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
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

const MOCK_PROD_KEY = '$aact_prod_mock_p15f_unification_not_real';

const PAYOUT_FLOW_FILES = [
  'server-fly.js',
  'controllers/adminWithdrawController.js',
  'src/domain/payout/processPendingWithdrawals.js',
  'src/workers/payout-worker.js'
];

function readRootFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

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

function applyProductionProfile(extra = {}) {
  applyEnvironment({
    NODE_ENV: 'production',
    ASAAS_ENV: 'production',
    ASAAS_ENABLED: 'true',
    ASAAS_PIX_OUT_ENABLED: 'true',
    ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'false',
    PAYMENT_ENGINE_PIXOUT_ENABLED: 'false',
    ASAAS_API_KEY: MOCK_PROD_KEY,
    ...extra
  });
  clearAsaasModuleCache(require);
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
  clearAsaasModuleCache(require);

  // Cenário 1 — Nenhum bypass direto no fluxo principal
  test('scenario 1: server-fly não injeta createPixWithdraw MP', () => {
    const src = readRootFile('server-fly.js');
    if (/createPixWithdraw/.test(src)) {
      throw new Error('server-fly ainda referencia createPixWithdraw');
    }
    if (!src.includes('processPendingWithdrawals({')) {
      throw new Error('processPendingWithdrawals call missing');
    }
    if (src.includes('createPixWithdraw:') || src.includes('createPixWithdraw,')) {
      throw new Error('server-fly ainda passa createPixWithdraw');
    }
    if (!src.includes('getTransactionIntent')) {
      throw new Error('getTransactionIntent webhook MP deve permanecer');
    }
  });

  test('scenario 1: adminWithdrawController sem pix-mercado-pago', () => {
    const src = readRootFile('controllers/adminWithdrawController.js');
    if (src.includes('pix-mercado-pago')) {
      throw new Error('admin ainda importa pix-mercado-pago');
    }
    if (src.includes('createPixWithdraw')) {
      throw new Error('admin ainda referencia createPixWithdraw');
    }
    if (!src.includes('approveAndSendWithdrawAdmin({')) {
      throw new Error('admin approve flow missing');
    }
  });

  test('scenario 1: processPendingWithdrawals usa compat layer internamente', () => {
    const src = readRootFile('src/domain/payout/processPendingWithdrawals.js');
    if (!src.includes('createPixWithdrawCompat(')) {
      throw new Error('compat layer não chamado');
    }
    if (/await createPixWithdraw\(/.test(src)) {
      throw new Error('chamada direta createPixWithdraw detectada');
    }
    if (src.includes('createPixWithdraw,')) {
      throw new Error('parâmetro createPixWithdraw ainda exposto');
    }
  });

  test('scenario 1: payout-worker sem pix-mercado-pago', () => {
    const src = readRootFile('src/workers/payout-worker.js');
    if (src.includes('pix-mercado-pago')) {
      throw new Error('worker ainda importa pix-mercado-pago');
    }
    if (src.includes('createPixWithdraw')) {
      throw new Error('worker ainda referencia createPixWithdraw');
    }
    if (!src.includes('processPendingWithdrawals({')) {
      throw new Error('worker deve chamar processPendingWithdrawals');
    }
  });

  test('scenario 1: MP provider acessível apenas via factory', () => {
    const mpProvider = readRootFile('src/finance/providers/mercadopago/MercadoPagoPayoutProvider.js');
    if (!mpProvider.includes('requestPixPayout')) {
      throw new Error('MercadoPagoPayoutProvider contract missing');
    }
    for (const rel of PAYOUT_FLOW_FILES) {
      const src = readRootFile(rel);
      if (src.includes('MercadoPagoPayoutProvider')) {
        throw new Error(`${rel} importa MercadoPagoPayoutProvider diretamente`);
      }
    }
  });

  // Cenário 2 — Mercado Pago preservado
  applyProductionProfile();
  const factory = require('../src/finance/factory/FinanceProviderFactory');
  factory.resetProviderCache();

  test('scenario 2: gates OFF resolve mercadopago', () => {
    const provider = factory.resolvePayoutProvider();
    if (provider.name !== 'mercadopago') {
      throw new Error(`expected mercadopago, got ${provider.name}`);
    }
  });

  test('scenario 2: persistence MP patch intact', () => {
    const persistence = require('../src/domain/payout/payoutProviderPersistence');
    const patch = persistence.buildProviderPersistencePatch({
      provider: 'mercadopago',
      id: 'ti_1',
      status: 'pending',
      raw: { id: 'ti_1' }
    });
    if (!patch.mp_transaction_intent_id) {
      throw new Error('mp patch broken');
    }
  });

  // Cenário 3 — Asaas bloqueado por gates
  applyProductionProfile({ PAYOUT_PROVIDER: 'asaas', ASAAS_PRODUCTION_ENABLED: 'true' });
  factory.resetProviderCache();

  await runAsync('scenario 3: asaas gates OFF blocks without HTTP', async () => {
    const originalFetch = globalThis.fetch;
    let httpCalls = 0;
    globalThis.fetch = async () => {
      httpCalls += 1;
      throw new Error('fetch must not be called');
    };
    try {
      const { createPixWithdrawCompat } = require('../src/finance/compat/createPixWithdrawCompat');
      const result = await createPixWithdrawCompat(5, 'test@example.com', 'EMAIL', 'u1', 's1', 'c1', {
        payoutExternalReference: 'goldeouro-p15f-gate-off',
        idempotencyKey: 'idem-p15f-1',
        ownerIdentification: { type: 'CPF', number: '12345678901' }
      });
      if (result.success !== false) {
        throw new Error('expected blocked payout');
      }
      if (httpCalls > 0) {
        throw new Error('HTTP must not run with gates OFF');
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // Cenário 4 e 5 — Regressões (ambiente limpo)
  resetAsaasEnvironment();
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);

  test('regression: verify-payout-provider-aware-p15e.mjs', () => {
    runRegressionScript('scripts/verify-payout-provider-aware-p15e.mjs');
  });

  const extraRegressions = [
    'scripts/verify-asaas-pix-out-production-gates.mjs',
    'scripts/verify-asaas-pix-out-production-readiness.mjs',
    'scripts/verify-asaas-pix-out-schema-p15d.mjs',
    'scripts/verify-asaas-provider.mjs',
    'scripts/verify-payment-webhook-engine.mjs'
  ];

  for (const script of extraRegressions) {
    test(`regression: ${path.basename(script)}`, () => {
      runRegressionScript(script);
    });
  }

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.5F factory unification)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.5F factory unification)');
} finally {
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
