#!/usr/bin/env node
/**
 * Verificação F4.2G — PIX OUT sandbox capability (local, sem HTTP live).
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

  const AsaasPayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');
  const AsaasProvider = require('../src/finance/providers/asaas/AsaasProvider');
  const factory = require('../src/finance/factory/FinanceProviderFactory');

  test('pix out disabled by default', () => {
    const { isAsaasPixOutEnabled } = require('../src/finance/providers/asaas/asaas-config');
    if (isAsaasPixOutEnabled()) {
      throw new Error('ASAAS_PIX_OUT_ENABLED should be false');
    }
  });

  await runAsync('createSandboxPixTransfer blocked when disabled', async () => {
    const result = await AsaasPayoutProvider.createSandboxPixTransfer({ value: 1 });
    if (result.error !== 'ASAAS_PIX_OUT_DISABLED') {
      throw new Error(`expected ASAAS_PIX_OUT_DISABLED, got ${result.error}`);
    }
    if (result.financialEffect !== false) {
      throw new Error('financialEffect must be false');
    }
    if (result.capabilityOnly !== true) {
      throw new Error('capabilityOnly must be true');
    }
  });

  applyEnvironment({
    ASAAS_ENABLED: 'true',
    ALLOW_ASAAS_SANDBOX_AUTH: '1',
    ASAAS_ENV: 'sandbox',
    ASAAS_PIX_OUT_ENABLED: 'true',
    ALLOW_ASAAS_SANDBOX_PIX_OUT: '1',
    ASAAS_API_KEY: 'aact_hmlg_verify_stub_only_not_live'
  });
  clearAsaasModuleCache(require);
  const PayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');

  await runAsync('invalid value rejected locally', async () => {
    const result = await PayoutProvider.createSandboxPixTransfer({ value: 99 });
    if (result.error !== 'ASAAS_PIX_OUT_INVALID_VALUE') {
      throw new Error(`expected ASAAS_PIX_OUT_INVALID_VALUE, got ${result.error}`);
    }
  });

  await runAsync('requestPixPayout remains stub (not integrated)', async () => {
    const result = await AsaasPayoutProvider.requestPixPayout({
      netAmount: 10,
      pixKey: '09493012301',
      pixType: 'CPF',
      userId: 'user_test',
      saqueId: 'saque_test'
    });
    if (result.error !== 'ASAAS_PAYOUT_NOT_IMPLEMENTED') {
      throw new Error(`expected ASAAS_PAYOUT_NOT_IMPLEMENTED, got ${result.error}`);
    }
  });

  test('factory still blocks PAYOUT_PROVIDER=asaas without primary sandbox', () => {
    applyEnvironment({ PAYOUT_PROVIDER: 'asaas', ASAAS_ENABLED: 'true' });
    clearAsaasModuleCache(require);
    const f = require('../src/finance/factory/FinanceProviderFactory');
    let threw = false;
    try {
      f.resolvePayoutProvider();
    } catch (err) {
      threw = true;
      const msg = String(err.message);
      if (
        !msg.includes('primary sandbox mode') &&
        !msg.includes('not wired') &&
        !msg.includes('requires Asaas resolvable')
      ) {
        throw err;
      }
    }
    if (!threw) throw new Error('expected factory to block asaas payout outside F4.3A mode');
  });

  test('no HTTP calls during verification', () => {
    if (fetchCallCount !== 0) {
      throw new Error(`fetch called ${fetchCallCount} times`);
    }
  });

  restoreFetch();

  if (process.exitCode) {
    console.error('\nVerification FAILED');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED');
} finally {
  restoreEnvironment(envSnapshot);
}
