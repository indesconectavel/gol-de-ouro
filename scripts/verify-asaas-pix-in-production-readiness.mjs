#!/usr/bin/env node
/**
 * P1.3F — Prontidão PIX IN Asaas produção (sem cobrança real, sem abrir gate).
 */
import { createRequire } from 'node:module';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyEnvironment,
  applyPixInPaymentEngineProfile
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);
const envSnapshot = snapshotEnvironment();

const MOCK_PROD_KEY = '$aact_prod_mock_p13f_readiness_only_not_real';

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

function applyProductionPixInProfile(extra = {}) {
  applyEnvironment({
    NODE_ENV: 'production',
    ASAAS_PRODUCTION_ENABLED: 'false',
    ASAAS_ENABLED: 'true',
    ASAAS_ENV: 'production',
    ASAAS_PIX_IN_ENABLED: 'true',
    ASAAS_API_KEY: MOCK_PROD_KEY,
    ASAAS_WEBHOOK_TOKEN: 'whsec_p13f_readiness_token_min32chars',
    ASAAS_WEBHOOK_ENABLED: 'true',
    PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true',
    PRIMARY_PSP: 'asaas',
    ...extra
  });
  clearAsaasModuleCache(require);
}

let httpCalls = 0;

function installHttpBlocker() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    httpCalls += 1;
    throw new Error(`HTTP bloqueado no teste P1.3F: ${String(args[0])}`);
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);

  test('ASAAS_PRODUCTION_ENABLED default is OFF', () => {
    const { isAsaasProductionEnabled } = require('../src/finance/config/primary-psp');
    if (isAsaasProductionEnabled()) {
      throw new Error('gate should remain closed');
    }
  });

  applyProductionPixInProfile();
  const cfg = require('../src/finance/providers/asaas/asaas-config');

  test('production base URL when ASAAS_ENV=production', () => {
    if (!cfg.getAsaasBaseUrl().includes('api.asaas.com')) {
      throw new Error(`unexpected base url: ${cfg.getAsaasBaseUrl()}`);
    }
  });

  test('API key diagnostics without exposing secret', () => {
    const diag = cfg.getAsaasApiKeyDiagnostics();
    if (!diag.present || diag.empty || diag.length < 10) {
      throw new Error('expected mock api key present');
    }
    if (!diag.sha256Prefix || diag.sha256Prefix.length !== 16) {
      throw new Error('expected sha256 prefix');
    }
    const serialized = JSON.stringify(diag);
    if (serialized.includes(MOCK_PROD_KEY)) {
      throw new Error('diagnostics leaked raw api key');
    }
  });

  test('empty API key detected without exposure', () => {
    applyProductionPixInProfile({ ASAAS_API_KEY: '   ' });
    const emptyCfg = require('../src/finance/providers/asaas/asaas-config');
    const diag = emptyCfg.getAsaasApiKeyDiagnostics();
    if (!diag.empty || diag.length !== 0) {
      throw new Error('whitespace-only key should be empty');
    }
    if (!emptyCfg.hasValidAsaasApiKey()) {
      return;
    }
    throw new Error('hasValidAsaasApiKey should be false for whitespace key');
  });

  applyProductionPixInProfile();

  test('production HTTP ready with gate OFF', () => {
    const readyCfg = require('../src/finance/providers/asaas/asaas-config');
    if (!readyCfg.isAsaasPixInProductionHttpReady()) {
      throw new Error('expected production http ready');
    }
    if (readyCfg.isAsaasPixInProductionHttpEnabled()) {
      throw new Error('gate OFF should block production http enabled');
    }
  });

  applyProductionPixInProfile({ ASAAS_PRODUCTION_ENABLED: 'true' });
  const gatedCfg = require('../src/finance/providers/asaas/asaas-config');

  test('production HTTP enabled only when gate ON', () => {
    if (!gatedCfg.isAsaasPixInProductionHttpEnabled()) {
      throw new Error('expected production http enabled with gate ON');
    }
  });

  applyProductionPixInProfile();
  const factory = require('../src/finance/factory/FinanceProviderFactory');
  factory.resetProviderCache();

  test('Mercado Pago fallback preserved when gate OFF', () => {
    const provider = factory.resolvePaymentProvider();
    const health = factory.getHealthSnapshot();
    if (provider.name !== 'mercadopago') {
      throw new Error(`expected mercadopago fallback, got ${provider.name}`);
    }
    if (health.asaasPaymentProviderResolvable) {
      throw new Error('asaas should not be resolvable with gate OFF');
    }
  });

  applyPixInPaymentEngineProfile();
  clearAsaasModuleCache(require);
  const factorySandbox = require('../src/finance/factory/FinanceProviderFactory');
  factorySandbox.resetProviderCache();

  test('sandbox PIX IN path unchanged', () => {
    const provider = factorySandbox.resolvePaymentProvider();
    if (provider.name !== 'asaas') {
      throw new Error(`expected asaas sandbox, got ${provider.name}`);
    }
    const AsaasPaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');
    if (!AsaasPaymentProvider.isPixInSandboxReady()) {
      throw new Error('sandbox should remain ready');
    }
  });

  applyProductionPixInProfile();
  const AsaasPaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');
  const restoreFetch = installHttpBlocker();
  httpCalls = 0;

  await runAsync('gate OFF blocks production charge without HTTP', async () => {
    const result = await AsaasPaymentProvider.createPixDeposit({
      amount: 5,
      userId: 'user-p13f',
      userEmail: 'p13f@test.local',
      userName: 'P13F Test',
      payerCpf: '52998224725',
      idempotencyKey: 'pix_p13f_gate_off',
      externalReference: 'goldeouro_p13f_gate_off'
    });
    if (result.error !== 'ASAAS_PIX_IN_PRODUCTION_GATE_CLOSED') {
      throw new Error(`expected gate closed, got ${result.error}`);
    }
    if (httpCalls > 0) {
      throw new Error('HTTP should not be called with gate OFF');
    }
  });

  applyProductionPixInProfile({ ASAAS_PRODUCTION_ENABLED: 'true' });
  clearAsaasModuleCache(require);
  const AsaasProd = require('../src/finance/providers/asaas/AsaasPaymentProvider');
  httpCalls = 0;

  await runAsync('production path uses HTTP gate (mocked, no real charge persisted)', async () => {
    const result = await AsaasProd.createPixDeposit({
      amount: 5,
      userId: 'user-p13f',
      userEmail: 'p13f@test.local',
      userName: 'P13F Test',
      payerCpf: '52998224725',
      idempotencyKey: 'pix_p13f_gate_on',
      externalReference: 'goldeouro_p13f_gate_on'
    });
    if (httpCalls < 1) {
      throw new Error('production path should attempt HTTP when gate ON');
    }
    if (result.success) {
      throw new Error('mocked HTTP must not create a successful charge in P1.3F');
    }
    if (result.financialEffect === true) {
      throw new Error('no financial effect allowed in readiness test');
    }
  });

  restoreFetch();

  applyProductionPixInProfile();
  clearAsaasModuleCache(require);

  test('required flags documented in config snapshot', () => {
    const config = require('../src/finance/providers/asaas/asaas-config').getAsaasConfig();
    const checks = {
      enabled: config.enabled,
      env: config.env,
      pixInEnabled: config.pixInEnabled,
      webhookEnabled: config.webhookEnabled,
      apiKeyEmpty: config.apiKeyDiagnostics.empty,
      productionGate: require('../src/finance/config/primary-psp').isAsaasProductionEnabled()
    };
    if (checks.env !== 'production') throw new Error('ASAAS_ENV should be production');
    if (!checks.enabled) throw new Error('ASAAS_ENABLED expected true');
    if (!checks.pixInEnabled) throw new Error('ASAAS_PIX_IN_ENABLED expected true');
    if (!checks.webhookEnabled) throw new Error('ASAAS_WEBHOOK_ENABLED expected true');
    if (checks.apiKeyEmpty) throw new Error('ASAAS_API_KEY should be present in profile');
    if (checks.productionGate) throw new Error('ASAAS_PRODUCTION_ENABLED must stay false in P1.3F');
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.3F PIX IN production readiness)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.3F PIX IN production readiness)');
} finally {
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
