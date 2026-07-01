#!/usr/bin/env node
/**
 * F4.4 — Live sandbox: PIX IN via Payment Engine + Asaas.
 * Requer ASAAS_TEST_LIVE=1 + ASAAS_API_KEY no .env.
 * Não processa webhook, não credita wallet/ledger.
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyPixInPaymentEngineProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

const mpAxiosCalls = [];
const axiosPath = require.resolve('axios');
const originalAxios = require(axiosPath);

function installMpAxiosGuard() {
  const guardedAxios = function axiosGuard(url, config) {
    const href = typeof url === 'string' ? url : url?.url ?? '';
    if (/mercadopago\.com/i.test(href)) {
      mpAxiosCalls.push(href);
      throw new Error(`Mercado Pago bloqueado neste teste F4.4: ${href}`);
    }
    return originalAxios(url, config);
  };
  guardedAxios.post = function axiosPostGuard(url, data, config) {
    if (/mercadopago\.com/i.test(String(url))) {
      mpAxiosCalls.push(String(url));
      throw new Error(`Mercado Pago bloqueado neste teste F4.4: ${url}`);
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

function printResult(payload) {
  console.log(JSON.stringify({ phase: 'F4.4', ...payload }, null, 2));
}

function finishSkip(message, extra = {}) {
  printResult({ result: 'SKIP', ok: false, message, liveMode, ...extra });
  restoreAxios();
  restoreEnv();
  process.exit(0);
}

if (liveMode) {
  applyPixInPaymentEngineProfile();
}

installMpAxiosGuard();
clearAsaasModuleCache(require);
delete require.cache[require.resolve('../src/finance/compat/createPixDepositCompat.js')];
delete require.cache[require.resolve('../src/finance/deposit/createPixDeposit.js')];

const guards = readAsaasGuards();

if (!liveMode) {
  finishSkip('Modo determinístico: ASAAS_TEST_LIVE≠1.', { guards });
}

if (!guards.hasApiKey) {
  finishSkip('ASAAS_API_KEY ausente.', { guards });
}

if (!guards.pixInEnabled || !guards.sandboxPixInAllowed) {
  finishSkip('PIX IN sandbox não habilitado.', { guards });
}

const { createPixDeposit } = require('../src/finance/deposit/createPixDeposit');
const factory = require('../src/finance/factory/FinanceProviderFactory');
const { maskApiKeyPreview } = require('../src/finance/providers/asaas/asaas-config');

const paymentProvider = factory.resolvePaymentProvider();
if (paymentProvider.name !== 'asaas') {
  finishSkip(`Provider resolvido=${paymentProvider.name}, esperado asaas.`, { guards });
}

const externalReference = `goldeouro-f44-live-${Date.now()}`;
const idempotencyKey = `pix_f44_${Date.now()}`;

printResult({
  step: 'pix_in_payment_engine_live_start',
  guards,
  paymentProvider: paymentProvider.name,
  apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY),
  amount: 5,
  externalReference
});

const result = await createPixDeposit({
  amount: 5,
  userId: 'f44-sandbox-user',
  userEmail: 'f44-sandbox@goldeouro.test',
  userName: 'F44 Sandbox',
  idempotencyKey,
  externalReference,
  notificationUrl: 'https://example.test/api/payments/webhook',
  description: 'Gol de Ouro F4.4 PIX IN Payment Engine'
});

if (!result.success) {
  printResult({
    result: 'FAIL',
    ok: false,
    error: result.error,
    message: result.message,
    provider: result.provider ?? paymentProvider.name
  });
  restoreAxios();
  restoreEnv();
  process.exit(2);
}

if (mpAxiosCalls.length > 0) {
  printResult({
    result: 'FAIL',
    ok: false,
    message: 'Mercado Pago foi invocado durante teste Asaas',
    mpAxiosCalls
  });
  restoreAxios();
  restoreEnv();
  process.exit(2);
}

printResult({
  result: 'PASS',
  ok: true,
  provider: result.provider,
  chargeCreated: true,
  providerRef: result.providerRef,
  amount: result.amount,
  status: result.status,
  externalReference: result.externalReference,
  qrAvailable: Boolean(result.qrCode),
  pixCopyPasteAvailable: Boolean(result.pixCopyPaste),
  pixCopyPastePreview:
    result.pixCopyPaste && result.pixCopyPaste.length > 24
      ? `${result.pixCopyPaste.slice(0, 20)}...${result.pixCopyPaste.slice(-8)}`
      : '[masked]',
  qrCodeBase64Available: Boolean(result.qrCodeBase64),
  financialEffect: false,
  walletTouched: false,
  ledgerTouched: false,
  webhookProcessed: false
});

restoreAxios();
restoreEnv();
