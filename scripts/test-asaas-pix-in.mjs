#!/usr/bin/env node
/**
 * Teste F4.2D — criação isolada de cobrança PIX Sandbox Asaas.
 *
 * Modo live: ASAAS_TEST_LIVE=1 + ASAAS_API_KEY no .env.
 * Default determinístico: baseline seguro → SKIP.
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyPixInLiveProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

function printResult(result, extra = {}) {
  console.log(JSON.stringify({ ...result, ...extra }, null, 2));
}

function finishSkip(message, extra = {}) {
  printResult(
    {
      result: 'SKIP',
      ok: false,
      httpCalled: false,
      chargeCreated: false,
      message,
      liveMode
    },
    extra
  );
  restoreEnv();
  process.exit(0);
}

if (liveMode) {
  applyPixInLiveProfile();
}

clearAsaasModuleCache(require);

const guards = readAsaasGuards();

if (!liveMode) {
  finishSkip(
    'Modo determinístico: ASAAS_TEST_LIVE≠1. Baseline seguro aplicado; nenhuma cobrança criada.',
    { guards }
  );
}

if (!guards.pixInEnabled) {
  finishSkip('PIX IN Asaas desabilitado (ASAAS_PIX_IN_ENABLED=false). Nenhuma cobrança criada.', {
    guards
  });
}

if (!guards.sandboxPixInAllowed) {
  finishSkip(
    'Bloqueado por segurança (ALLOW_ASAAS_SANDBOX_PIX_IN=0). Nenhuma cobrança criada.',
    { guards }
  );
}

if (!guards.asaasEnabled) {
  finishSkip('Asaas desabilitado (ASAAS_ENABLED=false). Nenhuma cobrança criada.', { guards });
}

if (!guards.sandboxAuthAllowed) {
  finishSkip('ALLOW_ASAAS_SANDBOX_AUTH=0. Nenhuma cobrança criada.', { guards });
}

if (!guards.sandboxEnv) {
  finishSkip('ASAAS_ENV≠sandbox. Nenhuma cobrança criada.', { guards });
}

if (!guards.hasApiKey) {
  finishSkip('ASAAS_API_KEY ausente. Nenhuma cobrança criada.', { guards });
}

const AsaasPaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');
const { maskApiKeyPreview } = require('../src/finance/providers/asaas/asaas-config');
const factory = require('../src/finance/factory/FinanceProviderFactory');

const defaultPayout = factory.resolvePayoutProvider();

const externalReference = `goldeouro-f4.2e-live-${Date.now()}`;

printResult({
  step: 'asaas_pix_in_live_validation_start',
  phase: 'F4.2E',
  guards,
  liveMode,
  defaultPayoutProvider: defaultPayout.name,
  apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY),
  testValue: 5,
  description: 'Gol de Ouro - Sandbox Validation',
  externalReference
});

const result = await AsaasPaymentProvider.createPixChargeSandbox({
  value: 5,
  description: 'Gol de Ouro - Sandbox Validation',
  externalReference
});

if (!result.success) {
  printResult({
    result: 'FAIL',
    ok: false,
    httpCalled: true,
    chargeCreated: false,
    error: result.error,
    message: result.message,
    httpStatus: result.httpStatus ?? null,
    errorCode: result.errorCode ?? null
  });
  restoreEnv();
  process.exit(2);
}

const statusInitial = result.payment?.status ?? null;
const statusConsulted = result.paymentStatus?.status ?? null;

printResult({
  result: 'PASS',
  ok: true,
  httpCalled: true,
  chargeCreated: true,
  financialEffect: false,
  defaultPayoutProvider: defaultPayout.name,
  endpoints: [
    'POST /v3/customers (se necessário)',
    'POST /v3/payments',
    'GET /v3/payments/{id}/pixQrCode',
    'GET /v3/payments/{id}'
  ],
  customer: result.customer,
  payment: result.payment,
  pixQrCode: result.pixQrCode,
  qrAvailable: result.pixQrCode?.hasQrCode === true,
  pixCopyPasteAvailable: result.pixQrCode?.hasPayload === true,
  pixCopyPastePreview: result.pixQrCode?.payloadPreview ?? null,
  statusComparison: {
    initial: statusInitial,
    consulted: statusConsulted,
    unchanged: statusInitial === statusConsulted
  },
  paymentStatus: result.paymentStatus,
  httpStatus: result.httpStatus ?? null,
  apiKeyPreview: result.apiKeyPreview ?? maskApiKeyPreview(process.env.ASAAS_API_KEY)
});

restoreEnv();
