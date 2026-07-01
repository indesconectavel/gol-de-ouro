#!/usr/bin/env node
/**
 * P1.5C — Prontidão HTTP PIX OUT Asaas produção (mock fetch, sem transferência real).
 */
import { createRequire } from 'node:module';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyEnvironment
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);
const envSnapshot = snapshotEnvironment();

const MOCK_PROD_KEY = '$aact_prod_mock_p15c_readiness_only_not_real';

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

function applyProductionPixOutProfile(extra = {}) {
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
    httpCalls.push({ url: String(url), method: init.method || 'GET', body: init.body });
    return {
      ok: false,
      status: 401,
      json: async () => ({ errors: [{ code: 'mock_p15c', description: 'mocked — no real transfer' }] })
    };
  };
  restoreFetch = () => {
    globalThis.fetch = originalFetch;
  };
}

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);

  test('production PIX OUT gates OFF by default', () => {
    applyProductionPixOutProfile();
    const cfg = require('../src/finance/config/asaas-pix-out-config');
    if (cfg.isAsaasPixOutProductionHttpEnabled()) {
      throw new Error('http should be disabled with gates OFF');
    }
    if (!cfg.isAsaasPixOutProductionHttpReady()) {
      throw new Error('expected production http ready');
    }
    if (cfg.isAsaasPixOutProductionHttpWired()) {
      throw new Error('wired requires configured gates');
    }
  });

  applyProductionPixOutProfile();
  const { getAsaasBaseUrl } = require('../src/finance/providers/asaas/asaas-config');

  test('production base URL official Asaas', () => {
    const base = getAsaasBaseUrl();
    if (!base.includes('api.asaas.com/v3')) {
      throw new Error(`unexpected base: ${base}`);
    }
  });

  test('transfer endpoint POST /transfers', () => {
    const cfg = require('../src/finance/config/asaas-pix-out-config');
    const ep = cfg.getAsaasPixOutProductionTransferEndpoint();
    if (ep.method !== 'POST' || ep.path !== '/transfers') {
      throw new Error(JSON.stringify(ep));
    }
  });

  applyProductionPixOutProfile({
    ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'true',
    PAYMENT_ENGINE_PIXOUT_ENABLED: 'true'
  });
  const wiredCfg = require('../src/finance/config/asaas-pix-out-config');

  test('wired + http enabled when all gates ON', () => {
    if (!wiredCfg.isAsaasPixOutProductionConfigured()) {
      throw new Error('expected configured');
    }
    if (!wiredCfg.isAsaasPixOutProductionHttpWired()) {
      throw new Error('expected wired');
    }
    if (!wiredCfg.isAsaasPixOutProductionHttpEnabled()) {
      throw new Error('expected http enabled');
    }
    if (wiredCfg.resolveAsaasPixOutHttpGate() !== 'pixOutProduction') {
      throw new Error('expected pixOutProduction gate');
    }
    if (wiredCfg.getAsaasPixOutProductionBlockReason() !== null) {
      throw new Error(`unexpected block: ${wiredCfg.getAsaasPixOutProductionBlockReason()}`);
    }
  });

  applyProductionPixOutProfile();
  installHttpMock();

  await runAsync('gate OFF blocks createPixTransfer without HTTP', async () => {
    const { createPixTransfer } = require('../src/finance/providers/asaas/asaas-http-client');
    const result = await createPixTransfer({
      value: 5,
      pixAddressKey: 'test@example.com',
      pixAddressKeyType: 'EMAIL',
      httpGate: 'pixOutProduction'
    });
    if (result.error !== 'ASAAS_PIX_OUT_PRODUCTION_HTTP_DISABLED') {
      throw new Error(`expected disabled, got ${result.error}`);
    }
    if (httpCalls.length > 0) {
      throw new Error('HTTP must not run with gates OFF');
    }
  });

  applyProductionPixOutProfile({
    ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'true',
    PAYMENT_ENGINE_PIXOUT_ENABLED: 'true'
  });

  await runAsync('gate ON routes POST /v3/transfers (mocked)', async () => {
    httpCalls = [];
    const { createPixTransfer, TRANSFERS_PATH } = require('../src/finance/providers/asaas/asaas-http-client');
    const result = await createPixTransfer({
      value: 5,
      pixAddressKey: 'test@example.com',
      pixAddressKeyType: 'EMAIL',
      httpGate: 'pixOutProduction'
    });
    if (httpCalls.length !== 1) {
      throw new Error(`expected 1 HTTP call, got ${httpCalls.length}`);
    }
    const call = httpCalls[0];
    if (call.method !== 'POST') {
      throw new Error(`expected POST, got ${call.method}`);
    }
    if (!call.url.includes('api.asaas.com/v3') || !call.url.endsWith(TRANSFERS_PATH)) {
      throw new Error(`unexpected url: ${call.url}`);
    }
    if (result.success) {
      throw new Error('mock must not succeed — no real transfer in P1.5C');
    }
  });

  await runAsync('createPixWithdraw production uses pixOutProduction when gated ON', async () => {
    httpCalls = [];
    const AsaasProvider = require('../src/finance/providers/asaas/AsaasProvider');
    const result = await AsaasProvider.createPixWithdraw({
      netAmount: 5,
      pixKey: 'test@example.com',
      pixType: 'EMAIL',
      saqueId: 'saque-p15c-readiness'
    });
    if (httpCalls.length !== 1) {
      throw new Error('expected HTTP attempt via provider');
    }
    if (result.success) {
      throw new Error('mock must not report success');
    }
  });

  if (restoreFetch) restoreFetch();

  applyProductionPixOutProfile();
  clearAsaasModuleCache(require);

  test('sandbox PIX OUT gate unchanged', () => {
    applyEnvironment({
      NODE_ENV: 'development',
      ASAAS_ENV: 'sandbox',
      ASAAS_ENABLED: 'true',
      ALLOW_ASAAS_SANDBOX_AUTH: '1',
      ASAAS_PIX_OUT_ENABLED: 'true',
      ALLOW_ASAAS_SANDBOX_PIX_OUT: '1',
      ASAAS_API_KEY: 'aact_hmlg_p15c'
    });
    clearAsaasModuleCache(require);
    const cfg = require('../src/finance/config/asaas-pix-out-config');
    if (!cfg.isAsaasPixOutHttpEnabled()) {
      throw new Error('sandbox should remain enabled');
    }
    if (cfg.resolveAsaasPixOutHttpGate() !== 'pixOut') {
      throw new Error('production gate must not override sandbox');
    }
  });

  applyProductionPixOutProfile();
  const factory = require('../src/finance/factory/FinanceProviderFactory');
  factory.resetProviderCache();

  test('Mercado Pago payout fallback preserved (gate OFF)', () => {
    const provider = factory.resolvePayoutProvider();
    if (provider.name !== 'mercadopago') {
      throw new Error(`expected mercadopago, got ${provider.name}`);
    }
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.5C PIX OUT production readiness)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.5C PIX OUT production readiness)');
} finally {
  if (restoreFetch) restoreFetch();
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
