#!/usr/bin/env node
/**
 * P1.5E — Verificação fluxo payout provider-aware via Payment Engine (sem PIX real).
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

const MOCK_PROD_KEY = '$aact_prod_mock_p15e_provider_aware_not_real';

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
    ASAAS_BASE_URL: 'https://api.asaas.com/v3',
    ...extra
  });
  clearAsaasModuleCache(require);
}

let httpCalls = [];
let restoreFetch = null;

function installHttpMock() {
  const originalFetch = globalThis.fetch;
  httpCalls = [];
  globalThis.fetch = async (url, init = {}) => {
    httpCalls.push({ url: String(url), method: init.method || 'GET' });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: 'trf_mock_p15e_001',
        status: 'PENDING',
        type: 'PIX',
        value: 5,
        externalReference: 'goldeouro-p15e-mock'
      })
    };
  };
  restoreFetch = () => {
    globalThis.fetch = originalFetch;
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
  clearAsaasModuleCache(require);

  const persistence = require('../src/domain/payout/payoutProviderPersistence');

  test('persistence: MP patch preserves mp_* only', () => {
    const normalized = persistence.normalizePayoutResult(
      {
        success: true,
        provider: 'mercadopago',
        data: { id: 'ti_mp_1', status: 'pending', sanitized: { id: 'ti_mp_1' } }
      },
      'mercadopago'
    );
    const patch = persistence.buildProviderPersistencePatch(normalized);
    if (patch.mp_transaction_intent_id !== 'ti_mp_1') {
      throw new Error('mp id missing');
    }
    if (patch.asaas_transfer_id) {
      throw new Error('asaas columns must not be set for MP');
    }
  });

  test('persistence: Asaas patch uses asaas_* only', () => {
    const normalized = persistence.normalizePayoutResult(
      {
        success: true,
        provider: 'asaas',
        providerRef: 'trf_asaas_1',
        transfer: { id: 'trf_asaas_1', status: 'PENDING', value: 5 }
      },
      'asaas'
    );
    const patch = persistence.buildProviderPersistencePatch(normalized);
    if (patch.asaas_transfer_id !== 'trf_asaas_1') {
      throw new Error('asaas transfer id missing');
    }
    if (patch.asaas_transfer_status !== 'PENDING') {
      throw new Error('asaas status missing');
    }
    if (patch.mp_transaction_intent_id) {
      throw new Error('mp columns must not be set for Asaas');
    }
  });

  test('persistence: terminal failure provider-aware', () => {
    const mpPending = persistence.normalizePayoutResult(
      { success: true, data: { status: 'pending' } },
      'mercadopago'
    );
    if (persistence.isPayoutTerminalFailure(mpPending, { success: true })) {
      throw new Error('MP pending should not be terminal');
    }
    const asaasFailed = persistence.normalizePayoutResult(
      { success: true, provider: 'asaas', transfer: { status: 'FAILED' } },
      'asaas'
    );
    if (!persistence.isPayoutTerminalFailure(asaasFailed, { success: true })) {
      throw new Error('Asaas FAILED should be terminal');
    }
  });

  // Cenário 1 — Mercado Pago preservado (gates OFF)
  applyProductionProfile();
  const factory = require('../src/finance/factory/FinanceProviderFactory');
  factory.resetProviderCache();

  test('scenario 1: gates OFF resolves mercadopago', () => {
    const provider = factory.resolvePayoutProvider();
    if (provider.name !== 'mercadopago') {
      throw new Error(`expected mercadopago, got ${provider.name}`);
    }
    const health = factory.getHealthSnapshot();
    if (health.payoutProvider !== 'mercadopago') {
      throw new Error(`health payoutProvider expected mercadopago, got ${health.payoutProvider}`);
    }
  });

  await runAsync('scenario 1: compat routes to MP provider', async () => {
    const { createPixWithdrawCompat } = require('../src/finance/compat/createPixWithdrawCompat');
    const resolved = factory.resolvePayoutProvider();
    if (resolved.name !== 'mercadopago') {
      throw new Error('factory must resolve MP');
    }
    if (typeof resolved.requestPixPayout !== 'function') {
      throw new Error('MP provider contract missing');
    }
    if (createPixWithdrawCompat.name !== 'createPixWithdrawCompat') {
      throw new Error('compat layer missing');
    }
  });

  // Cenário 2 — Asaas bloqueado por gates
  applyProductionProfile({ PAYOUT_PROVIDER: 'asaas', ASAAS_PRODUCTION_ENABLED: 'true' });
  factory.resetProviderCache();

  await runAsync('scenario 2: asaas prod gates OFF blocks payout', async () => {
    installHttpMock();
    try {
      const { createPixWithdrawCompat } = require('../src/finance/compat/createPixWithdrawCompat');
      const result = await createPixWithdrawCompat(5, 'test@example.com', 'EMAIL', 'u1', 's1', 'c1', {
        payoutExternalReference: 'goldeouro-p15e-gate-off',
        idempotencyKey: 'idem-p15e-1',
        ownerIdentification: { type: 'CPF', number: '12345678901' }
      });
      if (result.success !== false) {
        throw new Error('expected blocked payout');
      }
      if (!String(result.error || '').match(/ASAAS|DISABLED|NOT_IMPLEMENTED|PIX_OUT|GATE|BLOCKED/i)) {
        throw new Error(`unexpected error: ${result.error}`);
      }
      if (httpCalls.length > 0) {
        throw new Error('HTTP must not be called when gates OFF');
      }
    } finally {
      if (restoreFetch) restoreFetch();
    }
  });

  // Cenário 3 — Asaas provider-aware mockado
  applyProductionProfile({
    PAYOUT_PROVIDER: 'asaas',
    ASAAS_PRODUCTION_ENABLED: 'true',
    ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'true',
    PAYMENT_ENGINE_PIXOUT_ENABLED: 'true'
  });
  factory.resetProviderCache();

  await runAsync('scenario 3: gates ON mock resolves asaas + persistence shape', async () => {
    installHttpMock();
    try {
      const provider = factory.resolvePayoutProvider();
      if (provider.name !== 'asaas') {
        throw new Error(`expected asaas, got ${provider.name}`);
      }
      const { createPixWithdrawCompat } = require('../src/finance/compat/createPixWithdrawCompat');
      const result = await createPixWithdrawCompat(5, 'test@example.com', 'EMAIL', 'u1', 's1', 'c1', {
        payoutExternalReference: 'goldeouro-p15e-mock',
        idempotencyKey: 'idem-p15e-2',
        ownerIdentification: { type: 'CPF', number: '12345678901' }
      });
      if (result.provider !== 'asaas') {
        throw new Error(`expected provider asaas, got ${result.provider}`);
      }
      if (result.success !== true) {
        throw new Error(`expected mock success, got ${result.error}`);
      }
      const normalized = persistence.normalizePayoutResult(result, 'asaas');
      const patch = persistence.buildProviderPersistencePatch(normalized);
      if (patch.asaas_transfer_id !== 'trf_mock_p15e_001') {
        throw new Error('mock transfer id not persisted in patch');
      }
      const transferCall = httpCalls.find((c) => c.url.includes('/transfers'));
      if (!transferCall || transferCall.method !== 'POST') {
        throw new Error('expected mocked POST /transfers');
      }
    } finally {
      if (restoreFetch) restoreFetch();
    }
  });

  test('processPendingWithdrawals uses compat (Payment Engine)', () => {
    const fs = require('node:fs');
    const src = fs.readFileSync(
      path.join(root, 'src/domain/payout/processPendingWithdrawals.js'),
      'utf8'
    );
    if (!src.includes('createPixWithdrawCompat(')) {
      throw new Error('worker flow must call createPixWithdrawCompat');
    }
    if (!src.includes('buildProviderPersistencePatch')) {
      throw new Error('provider-aware persistence missing');
    }
  });

  // Cenário 4 — Regressões (ambiente limpo — gates scenario 3 não deve vazar)
  resetAsaasEnvironment();
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);

  const regressions = [
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
    console.error('\nVerification FAILED (P1.5E payout provider-aware)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.5E payout provider-aware)');
} finally {
  if (restoreFetch) restoreFetch();
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
