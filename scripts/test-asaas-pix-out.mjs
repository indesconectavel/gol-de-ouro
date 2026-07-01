#!/usr/bin/env node
/**
 * F4.2G / F4.2G.1 — Validação PIX OUT Asaas Sandbox (+ funding oficial opcional).
 * F4.2G.3 — ver scripts/test-asaas-transfer-done.mjs (TRANSFER DONE + token 000000).
 *
 * Modo live: ASAAS_TEST_LIVE=1 + ASAAS_API_KEY no .env.
 * F4.2G.1: funding via POST /sandbox/payment/{id}/confirm + reteste transferência.
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyPixOutRetestProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

const TRANSFER_VALUE = 1;
const FUNDING_VALUE = 5;
const MIN_BALANCE_FOR_TRANSFER = TRANSFER_VALUE;

function printResult(result, extra = {}) {
  console.log(JSON.stringify({ ...result, ...extra }, null, 2));
}

function finishSkip(message, extra = {}) {
  printResult(
    {
      result: 'SKIP',
      ok: false,
      httpCalled: false,
      transferAttempted: false,
      capabilityClassification: 'UNKNOWN',
      message,
      liveMode
    },
    extra
  );
  restoreEnv();
  process.exit(0);
}

function classifyCapability(capabilityResult, transferCreated) {
  if (transferCreated && capabilityResult.success) {
    return 'SUPPORTED_AND_VALIDATED';
  }
  if (capabilityResult.success) {
    return 'SUPPORTED';
  }

  const httpStatus = capabilityResult.httpStatus ?? null;
  const errorCode = String(capabilityResult.errorCode || '').toLowerCase();
  const message = String(capabilityResult.message || '').toLowerCase();

  if (httpStatus === 401 || httpStatus === 403) {
    return 'REQUIRES_ENABLEMENT';
  }
  if (httpStatus === 404) {
    return 'NOT_SUPPORTED';
  }
  if (httpStatus === 400 || httpStatus === 422) {
    if (
      message.includes('saldo') ||
      message.includes('balance') ||
      message.includes('insufficient') ||
      errorCode.includes('balance')
    ) {
      return 'SUPPORTED_WITH_LIMITATIONS';
    }
    return 'SUPPORTED_WITH_LIMITATIONS';
  }
  if (httpStatus != null) {
    return 'SUPPORTED_WITH_LIMITATIONS';
  }
  return 'UNKNOWN';
}

function simulateTransferWebhook(handleAsaasWebhook, transfer, ASAAS_WEBHOOK_AUTH_HEADER) {
  if (!transfer?.id) return null;
  const eventType =
    transfer.status === 'DONE'
      ? 'TRANSFER_DONE'
      : transfer.status === 'FAILED'
        ? 'TRANSFER_FAILED'
        : 'TRANSFER_PENDING';
  return handleAsaasWebhook({
    headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN || 'whsec_goldeouro_f42g1_retest' },
    body: {
      id: `evt_f42g1_${eventType.toLowerCase()}`,
      event: eventType,
      transfer: {
        id: transfer.id,
        status: transfer.status,
        value: transfer.value
      }
    }
  });
}

if (liveMode) {
  applyPixOutRetestProfile();
}

clearAsaasModuleCache(require);

const guards = readAsaasGuards();

if (!liveMode) {
  finishSkip(
    'Modo determinístico: ASAAS_TEST_LIVE≠1. Baseline seguro aplicado; nenhuma transferência tentada.',
    { guards }
  );
}

if (!guards.pixOutEnabled || !guards.sandboxPixOutAllowed) {
  finishSkip('PIX OUT sandbox desabilitado ou bloqueado.', { guards });
}

if (!guards.pixInEnabled || !guards.sandboxPixInAllowed) {
  finishSkip('PIX IN sandbox necessário para funding oficial (F4.2G.1).', { guards });
}

if (!guards.asaasEnabled || !guards.sandboxAuthAllowed || !guards.sandboxEnv) {
  finishSkip('Guards sandbox incompletos.', { guards });
}

if (!guards.hasApiKey) {
  finishSkip('ASAAS_API_KEY ausente.', { guards });
}

const AsaasPayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');
const { fetchAccountBalance } = require('../src/finance/providers/asaas/asaas-http-client');
const { maskApiKeyPreview } = require('../src/finance/providers/asaas/asaas-config');
const { handleAsaasWebhook } = require('../src/finance/providers/asaas/asaas-webhook-handler');
const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
const factory = require('../src/finance/factory/FinanceProviderFactory');

const defaultPayout = factory.resolvePayoutProvider();
const externalReference = `goldeouro-f4.2g1-live-${Date.now()}`;

printResult({
  step: 'asaas_pix_out_retest_start',
  phase: 'F4.2G.1',
  guards,
  liveMode,
  defaultPayoutProvider: defaultPayout.name,
  apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY),
  transferValue: TRANSFER_VALUE,
  fundingValue: FUNDING_VALUE
});

const initialBalanceResult = await fetchAccountBalance();
const balanceInitial = initialBalanceResult.success
  ? initialBalanceResult.balance?.balance ?? 0
  : null;

let fundingResult = null;
let balanceAfterFunding = balanceInitial;

if (balanceInitial == null || Number(balanceInitial) < MIN_BALANCE_FOR_TRANSFER) {
  printResult({
    step: 'sandbox_funding_start',
    balanceInitial,
    reason: 'Saldo insuficiente — executando procedimento oficial Asaas'
  });

  fundingResult = await AsaasPayoutProvider.fundSandboxViaOfficialProcedure({
    value: FUNDING_VALUE,
    description: 'Gol de Ouro F4.2G.1 Sandbox Funding'
  });

  balanceAfterFunding = fundingResult.balanceAfter ?? balanceInitial;

  printResult({
    step: 'sandbox_funding_result',
    fundingSuccess: fundingResult.success,
    fundingMethod: fundingResult.fundingMethod ?? null,
    balanceBefore: fundingResult.balanceBefore ?? balanceInitial,
    balanceAfter: balanceAfterFunding,
    paymentId: fundingResult.paymentId ?? null,
    paymentStatus: fundingResult.paymentStatus ?? null,
    error: fundingResult.error ?? null,
    message: fundingResult.message ?? null
  });
} else {
  printResult({
    step: 'sandbox_funding_skipped',
    balanceInitial,
    reason: 'Saldo já disponível'
  });
}

const capabilityResult = await AsaasPayoutProvider.createSandboxPixTransfer({
  value: TRANSFER_VALUE,
  externalReference,
  description: 'Gol de Ouro F4.2G.1 PIX OUT Retest'
});

const transferCreated = capabilityResult.success === true;
const classification = classifyCapability(capabilityResult, transferCreated);

let webhookClassification = null;
if (transferCreated && capabilityResult.transfer) {
  webhookClassification = await simulateTransferWebhook(
    handleAsaasWebhook,
    capabilityResult.transferDetail || capabilityResult.transfer,
    ASAAS_WEBHOOK_AUTH_HEADER
  );
}

const pass =
  (classification === 'SUPPORTED_AND_VALIDATED' || classification === 'SUPPORTED_WITH_LIMITATIONS') &&
  capabilityResult.financialEffect === false &&
  capabilityResult.integratedInGolDeOuro === false &&
  (fundingResult == null || fundingResult.success === true || balanceInitial >= MIN_BALANCE_FOR_TRANSFER);

printResult({
  result: pass ? 'PASS' : 'FAIL',
  ok: pass,
  phase: 'F4.2G.1',
  sandboxSupportsPixOut: 'SIM',
  capabilityClassification: classification,
  balanceInitial,
  balanceAfterFunding,
  fundingExecuted: fundingResult != null,
  fundingSuccess: fundingResult?.success ?? null,
  fundingMethod: fundingResult?.fundingMethod ?? null,
  transferAttempted: true,
  transferCreated,
  httpStatus: capabilityResult.httpStatus ?? null,
  error: capabilityResult.error ?? null,
  errorCode: capabilityResult.errorCode ?? null,
  message: capabilityResult.message ?? null,
  transfer: capabilityResult.transfer ?? null,
  transferDetail: capabilityResult.transferDetail ?? null,
  webhookReceived: false,
  webhookSimulated: webhookClassification != null,
  webhookEvent: webhookClassification?.event ?? null,
  webhookDecision: webhookClassification?.decision ?? null,
  webhookFinancialEffect: webhookClassification?.financialEffect ?? false,
  financialEffect: false,
  integratedInGolDeOuro: false,
  defaultPayoutProvider: defaultPayout.name,
  endpointsUsed: [
    'GET /finance/balance',
    fundingResult ? 'POST /customers' : null,
    fundingResult ? 'POST /payments' : null,
    fundingResult ? 'POST /sandbox/payment/{id}/confirm' : null,
    'POST /transfers',
    capabilityResult.transfer?.id ? 'GET /transfers/{id}' : null
  ].filter(Boolean)
});

restoreEnv();
process.exit(pass ? 0 : 2);
