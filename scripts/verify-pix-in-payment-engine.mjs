#!/usr/bin/env node
/**
 * Verificação F4.4 — PIX IN via Payment Engine (Asaas primário + fallback MP).
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

let mpAxiosCalls = 0;
const axiosPath = require.resolve('axios');
const originalAxios = require(axiosPath);

function installMpAxiosGuard() {
  mpAxiosCalls = 0;
  const guardedAxios = function axiosGuard(url, config) {
    const href = typeof url === 'string' ? url : url?.url ?? '';
    if (/mercadopago\.com/i.test(href)) {
      mpAxiosCalls += 1;
      throw new Error(`Mercado Pago bloqueado no teste F4.4: ${href}`);
    }
    return originalAxios(url, config);
  };
  guardedAxios.post = function axiosPostGuard(url, data, config) {
    if (/mercadopago\.com/i.test(String(url))) {
      mpAxiosCalls += 1;
      throw new Error(`Mercado Pago bloqueado no teste F4.4: ${url}`);
    }
    return originalAxios.post(url, data, config);
  };
  guardedAxios.get = originalAxios.get.bind(originalAxios);
  guardedAxios.request = originalAxios.request.bind(originalAxios);
  require.cache[axiosPath].exports = guardedAxios;
}

function restoreAxios() {
  require.cache[axiosPath].exports = originalAxios;
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

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);

  const primary = require('../src/finance/config/primary-psp');
  const factory = require('../src/finance/factory/FinanceProviderFactory');

  test('asaas is architectural primary PSP', () => {
    if (primary.getArchitecturalPrimaryPsp() !== 'asaas') {
      throw new Error('expected asaas');
    }
  });

  test('legacy MP payment fallback when asaas not resolvable', () => {
    const provider = factory.resolvePaymentProvider();
    const health = factory.getHealthSnapshot();
    if (provider.name !== 'mercadopago') {
      throw new Error(`expected mercadopago fallback, got ${provider.name}`);
    }
    if (!health.paymentLegacyFallbackActive) {
      throw new Error('expected paymentLegacyFallbackActive=true');
    }
  });

  clearAsaasModuleCache(require);
  applyEnvironment({ NODE_ENV: 'production', ASAAS_PRODUCTION_ENABLED: 'false' });
  factory.resetProviderCache();
  const factoryProd = require('../src/finance/factory/FinanceProviderFactory');

  test('production without gate keeps mercadopago payment provider', () => {
    const provider = factoryProd.resolvePaymentProvider();
    if (provider.name !== 'mercadopago') {
      throw new Error(`expected mercadopago in prod, got ${provider.name}`);
    }
    if (factoryProd.getHealthSnapshot().paymentLegacyFallbackActive === true) {
      throw new Error('payment legacy fallback should be false in prod default MP');
    }
  });

  clearAsaasModuleCache(require);
  resetAsaasEnvironment();
  applyPixInPaymentEngineProfile();
  delete require.cache[require.resolve('../src/finance/compat/createPixDepositCompat.js')];
  delete require.cache[require.resolve('../src/finance/deposit/createPixDeposit.js')];
  factoryProd.resetProviderCache();
  installMpAxiosGuard();

  const factorySandbox = require('../src/finance/factory/FinanceProviderFactory');
  const { createPixDeposit } = require('../src/finance/deposit/createPixDeposit');

  test('sandbox controlled resolves asaas payment provider', () => {
    const provider = factorySandbox.resolvePaymentProvider();
    const health = factorySandbox.getHealthSnapshot();
    if (provider.name !== 'asaas') {
      throw new Error(`expected asaas, got ${provider.name}`);
    }
    if (health.paymentLegacyFallbackActive === true) {
      throw new Error('payment legacy fallback should be off');
    }
    if (!health.asaasPaymentProviderResolvable) {
      throw new Error('asaasPaymentProviderResolvable should be true');
    }
  });

  await runAsync('createPixDeposit contract fields (mocked HTTP)', async () => {
    const AsaasPaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');
    const original = AsaasPaymentProvider.createPixDeposit.bind(AsaasPaymentProvider);
    AsaasPaymentProvider.createPixDeposit = async () => ({
      success: true,
      provider: 'asaas',
      providerRef: 'pay_mock_f44',
      amount: 5,
      status: 'pending',
      qrCode: '00020126580014BR.GOV.BCB.PIX',
      qrCodeBase64: 'data:image/png;base64,abc',
      pixCopyPaste: '00020126580014BR.GOV.BCB.PIX',
      externalReference: 'goldeouro_f44_mock',
      idempotencyKey: 'pix_mock',
      financialEffect: false
    });

    const result = await createPixDeposit({
      amount: 5,
      userId: 'user-f44',
      userEmail: 'f44@test.local',
      idempotencyKey: 'pix_mock',
      externalReference: 'goldeouro_f44_mock',
      notificationUrl: 'https://example.test/webhook'
    });

    AsaasPaymentProvider.createPixDeposit = original;

    if (result.provider !== 'asaas') {
      throw new Error(`expected provider asaas, got ${result.provider}`);
    }
    const required = [
      'providerRef',
      'amount',
      'status',
      'qrCode',
      'pixCopyPaste',
      'externalReference',
      'provider'
    ];
    for (const field of required) {
      if (result[field] == null || result[field] === '') {
        throw new Error(`missing contract field: ${field}`);
      }
    }
    if (result.financialEffect !== false) {
      throw new Error('financialEffect must be false (no wallet credit in F4.4)');
    }
    if (mpAxiosCalls > 0) {
      throw new Error('Mercado Pago axios should not be called when asaas resolved');
    }
  });

  restoreAxios();

  if (process.exitCode) {
    console.error('\nVerification FAILED');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (F4.4 PIX IN Payment Engine)');
} finally {
  restoreAxios();
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
