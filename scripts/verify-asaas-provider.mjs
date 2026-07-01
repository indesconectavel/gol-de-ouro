#!/usr/bin/env node
/**
 * Verificação F4.2B — Asaas provider stub + factory readiness.
 * Ambiente isolado via asaas-test-env (F4.2D.1).
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
    throw new Error('fetch should not be called in this verification step');
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);

  const factory = require('../src/finance/factory/FinanceProviderFactory');
  const AsaasProvider = require('../src/finance/providers/asaas/AsaasProvider');
  const AsaasPaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');
  const AsaasPayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');

  test('asaas provider registered (name)', () => {
    if (AsaasProvider.getName() !== 'asaas') {
      throw new Error(`expected asaas, got ${AsaasProvider.getName()}`);
    }
  });

  test('asaas disabled by default', () => {
    if (AsaasProvider.isEnabled()) {
      throw new Error('ASAAS_ENABLED should be false by default in this script');
    }
  });

  factory.assertBootConfig();

  test('legacy fallback payout when asaas not resolvable (F4.3C)', () => {
    const provider = factory.resolvePayoutProvider();
    const health = factory.getHealthSnapshot();
    if (provider.name !== 'mercadopago') {
      throw new Error(`expected mercadopago fallback, got ${provider.name}`);
    }
    if (!health.legacyFallbackActive) {
      throw new Error('expected legacyFallbackActive=true');
    }
    if (health.architecturalPrimaryPsp !== 'asaas') {
      throw new Error('architecturalPrimaryPsp should be asaas');
    }
  });

  test('health snapshot lists asaas as registered', () => {
    const health = factory.getHealthSnapshot();
    if (!Array.isArray(health.registeredPayoutProviders)) {
      throw new Error('registeredPayoutProviders missing from health snapshot');
    }
    if (!health.registeredPayoutProviders.includes('asaas')) {
      throw new Error('asaas not in registeredPayoutProviders');
    }
    if (health.asaasEnabled !== false) {
      throw new Error('asaasEnabled should be false');
    }
    if (health.payoutProvider !== 'mercadopago') {
      throw new Error(`active payoutProvider should be mercadopago (fallback), got ${health.payoutProvider}`);
    }
  });

  test('payout_provider=asaas explicit blocked when not resolvable', () => {
    clearAsaasModuleCache(require);
    resetAsaasEnvironment();
    applyEnvironment({ PAYOUT_PROVIDER: 'asaas' });
    const f2 = require('../src/finance/factory/FinanceProviderFactory');
    let threw = false;
    try {
      f2.assertBootConfig();
    } catch (err) {
      threw = true;
      if (!/asaas resolvable/i.test(err.message)) {
        throw new Error(`unexpected error: ${err.message}`);
      }
    }
    if (!threw) throw new Error('expected assertBootConfig to throw for explicit asaas without gates');
    resetAsaasEnvironment();
    clearAsaasModuleCache(require);
  });

  installFetchSpy();

  await runAsync('health does not call HTTP when asaas disabled', async () => {
    resetAsaasEnvironment();
    clearAsaasModuleCache(require);
    const provider = require('../src/finance/providers/asaas/AsaasProvider');
    const result = await provider.health();
    if (result.error !== 'ASAAS_DISABLED') {
      throw new Error(`expected ASAAS_DISABLED, got ${result.error}`);
    }
    if (fetchCallCount !== 0) {
      throw new Error(`fetch called ${fetchCallCount} times`);
    }
  });

  await runAsync('health does not call HTTP when sandbox auth disallowed', async () => {
    resetAsaasEnvironment();
    applyEnvironment({
      ASAAS_ENABLED: 'true',
      ASAAS_API_KEY: '$aact_hmlg_test_key_only',
      ALLOW_ASAAS_SANDBOX_AUTH: '0',
      ASAAS_PIX_IN_ENABLED: 'false',
      ALLOW_ASAAS_SANDBOX_PIX_IN: '0'
    });
    clearAsaasModuleCache(require);
    const provider = require('../src/finance/providers/asaas/AsaasProvider');
    const result = await provider.health();
    if (!result.ok || result.httpVerified !== false) {
      throw new Error('expected local health without HTTP verification');
    }
    if (fetchCallCount !== 0) {
      throw new Error(`fetch called ${fetchCallCount} times`);
    }
  });

  restoreFetch();

  resetAsaasEnvironment();
  applyEnvironment({
    ASAAS_ENABLED: 'true',
    ASAAS_API_KEY: '$aact_hmlg_test_key_only',
    ALLOW_ASAAS_SANDBOX_AUTH: '0',
    ASAAS_PIX_IN_ENABLED: 'false',
    ALLOW_ASAAS_SANDBOX_PIX_IN: '0'
  });
  clearAsaasModuleCache(require);

  const AsaasProviderEnabled = require('../src/finance/providers/asaas/AsaasProvider');
  const PaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');
  const PayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');

  await runAsync('payment stub returns ASAAS_PAYMENT_NOT_IMPLEMENTED', async () => {
    const result = await PaymentProvider.createPixDeposit({ amount: 10, userId: 'u1' });
    if (result.error !== 'ASAAS_PAYMENT_NOT_IMPLEMENTED') {
      throw new Error(`expected ASAAS_PAYMENT_NOT_IMPLEMENTED, got ${result.error}`);
    }
  });

  await runAsync('payout stub returns ASAAS_PAYOUT_NOT_IMPLEMENTED', async () => {
    const result = await PayoutProvider.requestPixPayout({
      netAmount: 10,
      pixKey: 'k',
      pixType: 'email',
      userId: 'u1',
      saqueId: 's1',
      correlationId: 'c1',
      payoutExternalReference: 'r1',
      idempotencyKey: 'i1',
      ownerIdentification: { type: 'CPF', number: '00000000000' }
    });
    if (result.error !== 'ASAAS_PAYOUT_NOT_IMPLEMENTED') {
      throw new Error(`expected ASAAS_PAYOUT_NOT_IMPLEMENTED, got ${result.error}`);
    }
  });

  await runAsync('authenticate local-only when http guards off', async () => {
    const result = await AsaasProviderEnabled.authenticate();
    if (!result.success || result.httpVerified !== false) {
      throw new Error('expected local authenticate without HTTP');
    }
    if (!result.apiKeyPreview || result.apiKeyPreview.includes('test_key_only')) {
      throw new Error('apiKeyPreview should be masked');
    }
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (6/6 + async checks)');
} finally {
  restoreEnvironment(envSnapshot);
}
