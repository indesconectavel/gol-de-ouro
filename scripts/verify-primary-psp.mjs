#!/usr/bin/env node
/**
 * Verificação F4.3C — PSP primário arquitetural (Asaas) vs provider efetivo de runtime.
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

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);

  const factory = require('../src/finance/factory/FinanceProviderFactory');
  const primary = require('../src/finance/config/primary-psp');

  test('architectural primary PSP is asaas', () => {
    if (primary.getArchitecturalPrimaryPsp() !== 'asaas') {
      throw new Error(`expected asaas, got ${primary.getArchitecturalPrimaryPsp()}`);
    }
  });

  test('dev default effective env is asaas when unset', () => {
    if (primary.getEffectiveProviderEnv('PAYOUT_PROVIDER') !== 'asaas') {
      throw new Error('expected asaas effective payout in dev');
    }
  });

  test('legacy fallback when asaas not resolvable', () => {
    const provider = factory.resolvePayoutProvider();
    const health = factory.getHealthSnapshot();
    if (provider.name !== 'mercadopago') {
      throw new Error(`expected mercadopago fallback, got ${provider.name}`);
    }
    if (health.legacyFallbackActive !== true) {
      throw new Error('expected legacyFallbackActive=true');
    }
    if (health.architecturalPrimaryPsp !== 'asaas') {
      throw new Error('architecturalPrimaryPsp should be asaas');
    }
    if (health.payoutProviderRole !== 'legacy') {
      throw new Error(`expected legacy role on active payout, got ${health.payoutProviderRole}`);
    }
  });

  clearAsaasModuleCache(require);
  applyEnvironment({ NODE_ENV: 'production', ASAAS_PRODUCTION_ENABLED: 'false' });
  factory.resetProviderCache();
  const factoryProd = require('../src/finance/factory/FinanceProviderFactory');
  const primaryProd = require('../src/finance/config/primary-psp');

  test('production without gate keeps mercadopago effective', () => {
    if (primaryProd.getEffectiveProviderEnv('PAYOUT_PROVIDER') !== 'mercadopago') {
      throw new Error('production should default to mercadopago without ASAAS_PRODUCTION_ENABLED');
    }
    const health = factoryProd.getHealthSnapshot();
    if (health.payoutProvider !== 'mercadopago') {
      throw new Error(`expected mercadopago in prod, got ${health.payoutProvider}`);
    }
    if (health.legacyFallbackActive === true) {
      throw new Error('legacyFallbackActive should be false when prod explicitly uses mercadopago');
    }
  });

  clearAsaasModuleCache(require);
  resetAsaasEnvironment();
  applyEnvironment({ PAYOUT_PROVIDER: 'asaas' });
  factoryProd.resetProviderCache();
  const factoryExplicit = require('../src/finance/factory/FinanceProviderFactory');

  test('explicit asaas without resolvable gates throws at boot', () => {
    let threw = false;
    try {
      factoryExplicit.assertBootConfig();
    } catch (err) {
      threw = true;
      if (!/asaas resolvable/i.test(err.message)) {
        throw new Error(`unexpected error: ${err.message}`);
      }
    }
    if (!threw) {
      throw new Error('expected assertBootConfig to throw');
    }
  });

  clearAsaasModuleCache(require);
  resetAsaasEnvironment();
  applyEnvironment({
    NODE_ENV: 'development',
    PAYMENT_PROVIDER: 'asaas',
    PAYOUT_PROVIDER: 'asaas',
    ASAAS_TEST_LIVE: '1',
    ASAAS_ENABLED: 'true',
    ASAAS_API_KEY: '$aact_hmlg_test_key_only',
    ALLOW_ASAAS_SANDBOX_AUTH: '1',
    ASAAS_PIX_IN_ENABLED: 'true',
    ALLOW_ASAAS_SANDBOX_PIX_IN: '1',
    ASAAS_PIX_OUT_ENABLED: 'true',
    ALLOW_ASAAS_SANDBOX_PIX_OUT: '1',
    ASAAS_WEBHOOK_ENABLED: 'true'
  });
  factoryExplicit.resetProviderCache();
  const factorySandbox = require('../src/finance/factory/FinanceProviderFactory');

  test('F4.3A sandbox mode resolves asaas providers', () => {
    const payout = factorySandbox.resolvePayoutProvider();
    const payment = factorySandbox.resolvePaymentProvider();
    if (payout.name !== 'asaas') {
      throw new Error(`expected asaas payout, got ${payout.name}`);
    }
    if (!payment || payment.name !== 'asaas') {
      throw new Error('expected asaas payment provider');
    }
    const health = factorySandbox.getHealthSnapshot();
    if (health.legacyFallbackActive === true) {
      throw new Error('legacy fallback should be off in sandbox primary mode');
    }
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (F4.3C primary PSP)');
} finally {
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
