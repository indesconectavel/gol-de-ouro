#!/usr/bin/env node
/**
 * P1.5B — Verificação gates PIX OUT Asaas produção (local, sem HTTP).
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

let fetchCallCount = 0;
const originalFetch = globalThis.fetch;

function installFetchSpy() {
  fetchCallCount = 0;
  globalThis.fetch = async () => {
    fetchCallCount += 1;
    throw new Error('fetch must not be called in verify mode');
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);
  installFetchSpy();

  test('production gates disabled by default', () => {
    applyEnvironment({
      NODE_ENV: 'production',
      ASAAS_ENV: 'production',
      ASAAS_ENABLED: 'true',
      ASAAS_PIX_OUT_ENABLED: 'true',
      ASAAS_API_KEY: 'aact_prod_verify_only_not_live'
    });
    clearAsaasModuleCache(require);
    const cfg = require('../src/finance/config/asaas-pix-out-config');
    if (cfg.isAsaasPixOutProductionHttpEnabled()) {
      throw new Error('production http should be disabled by default');
    }
    if (!cfg.isAsaasPixOutProductionHttpReady()) {
      throw new Error('should be production ready with api key');
    }
    const reason = cfg.getAsaasPixOutProductionBlockReason();
    if (reason !== 'ASAAS_PIX_OUT_PRODUCTION_DISABLED') {
      throw new Error(`expected ASAAS_PIX_OUT_PRODUCTION_DISABLED, got ${reason}`);
    }
  });

  test('PAYMENT_ENGINE_PIXOUT_DISABLED when gate off', () => {
    applyEnvironment({
      NODE_ENV: 'production',
      ASAAS_ENV: 'production',
      ASAAS_ENABLED: 'true',
      ASAAS_PIX_OUT_ENABLED: 'true',
      ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'true',
      ASAAS_API_KEY: 'aact_prod_verify_only_not_live'
    });
    clearAsaasModuleCache(require);
    const cfg = require('../src/finance/config/asaas-pix-out-config');
    if (cfg.getAsaasPixOutProductionBlockReason() !== 'PAYMENT_ENGINE_PIXOUT_DISABLED') {
      throw new Error('expected PAYMENT_ENGINE_PIXOUT_DISABLED');
    }
  });

  test('HTTP wired when all gates ON (P1.5C)', () => {
    applyEnvironment({
      NODE_ENV: 'production',
      ASAAS_ENV: 'production',
      ASAAS_ENABLED: 'true',
      ASAAS_PIX_OUT_ENABLED: 'true',
      ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'true',
      PAYMENT_ENGINE_PIXOUT_ENABLED: 'true',
      ASAAS_API_KEY: 'aact_prod_verify_only_not_live'
    });
    clearAsaasModuleCache(require);
    const cfg = require('../src/finance/config/asaas-pix-out-config');
    if (!cfg.isAsaasPixOutProductionConfigured()) {
      throw new Error('should be configured');
    }
    if (!cfg.isAsaasPixOutProductionHttpWired()) {
      throw new Error('expected wired after P1.5C');
    }
    if (!cfg.isAsaasPixOutProductionHttpEnabled()) {
      throw new Error('http should be enabled when configured');
    }
    if (cfg.getAsaasPixOutProductionBlockReason() !== null) {
      throw new Error(`unexpected block: ${cfg.getAsaasPixOutProductionBlockReason()}`);
    }
  });

  await runAsync('createPixWithdraw production returns explicit guard', async () => {
    applyEnvironment({
      NODE_ENV: 'production',
      ASAAS_ENV: 'production',
      ASAAS_ENABLED: 'true',
      ASAAS_PIX_OUT_ENABLED: 'true',
      ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'false',
      PAYMENT_ENGINE_PIXOUT_ENABLED: 'false',
      ASAAS_API_KEY: 'aact_prod_verify_only_not_live'
    });
    clearAsaasModuleCache(require);
    const AsaasProvider = require('../src/finance/providers/asaas/AsaasProvider');
    const result = await AsaasProvider.createPixWithdraw({
      netAmount: 5,
      pixKey: 'test@example.com',
      pixType: 'EMAIL',
      saqueId: 'saque-verify'
    });
    if (result.error !== 'ASAAS_PIX_OUT_PRODUCTION_DISABLED') {
      throw new Error(`expected ASAAS_PIX_OUT_PRODUCTION_DISABLED, got ${result.error}`);
    }
    if (result.success !== false) {
      throw new Error('success must be false');
    }
  });

  await runAsync('http client pixOutProduction blocked when gates OFF', async () => {
    applyEnvironment({
      NODE_ENV: 'production',
      ASAAS_ENV: 'production',
      ASAAS_ENABLED: 'true',
      ASAAS_PIX_OUT_ENABLED: 'true',
      ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'false',
      PAYMENT_ENGINE_PIXOUT_ENABLED: 'false',
      ASAAS_API_KEY: 'aact_prod_verify_only_not_live'
    });
    clearAsaasModuleCache(require);
    const { createPixTransfer } = require('../src/finance/providers/asaas/asaas-http-client');
    const result = await createPixTransfer({
      value: 1,
      pixAddressKey: 'cliente-a00001@pix.bcb.gov.br',
      pixAddressKeyType: 'EMAIL',
      httpGate: 'pixOutProduction'
    });
    if (result.error !== 'ASAAS_PIX_OUT_PRODUCTION_HTTP_DISABLED') {
      throw new Error(`expected ASAAS_PIX_OUT_PRODUCTION_HTTP_DISABLED, got ${result.error}`);
    }
  });

  test('sandbox pix out preserved', () => {
    applyEnvironment({
      NODE_ENV: 'development',
      ASAAS_ENV: 'sandbox',
      ASAAS_ENABLED: 'true',
      ALLOW_ASAAS_SANDBOX_AUTH: '1',
      ASAAS_PIX_OUT_ENABLED: 'true',
      ALLOW_ASAAS_SANDBOX_PIX_OUT: '1',
      ASAAS_API_KEY: 'aact_hmlg_verify'
    });
    clearAsaasModuleCache(require);
    const cfg = require('../src/finance/config/asaas-pix-out-config');
    if (!cfg.isAsaasPixOutHttpEnabled()) {
      throw new Error('sandbox http should be enabled');
    }
    if (cfg.resolveAsaasPixOutHttpGate() !== 'pixOut') {
      throw new Error('resolved gate should be pixOut');
    }
  });

  test('no HTTP calls during verification', () => {
    if (fetchCallCount !== 0) {
      throw new Error(`fetch called ${fetchCallCount} times`);
    }
  });

  restoreFetch();

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.5B)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.5B PIX OUT production gates)');
} finally {
  restoreEnvironment(envSnapshot);
}
