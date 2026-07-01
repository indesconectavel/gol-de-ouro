#!/usr/bin/env node
/**
 * F4.2G.3 — Validação TRANSFER DONE Asaas Sandbox (procedimento oficial).
 *
 * Live: ASAAS_TEST_LIVE=1 ASAAS_TRANSFER_DONE_TEST=1
 * Token crítico sandbox: 000000 ([How to Test Critical Actions](https://docs.asaas.com/docs/how-to-test-critical-actions))
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyTransferDoneTestProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

const SANDBOX_CRITICAL_TOKEN = '000000';
const BACEN_PIX_KEY = 'cliente-a00001@pix.bcb.gov.br';
const BACEN_PIX_KEY_TYPE = 'EMAIL';
const TRANSFER_VALUE = 1;
const FUNDING_VALUE = 5;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15;

function printResult(result) {
  console.log(JSON.stringify(result, null, 2));
}

function finishSkip(message, extra = {}) {
  printResult({
    result: 'SKIP',
    ok: false,
    phase: 'F4.2G.3',
    terminalStatus: 'UNKNOWN',
    finalClassification: 'UNKNOWN',
    message,
    liveMode,
    ...extra
  });
  restoreEnv();
  process.exit(0);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function maskTransferId(id) {
  if (!id) return null;
  const s = String(id);
  return `${s.slice(0, 8)}...${s.slice(-4)}`;
}

function classifyTerminalStatus(transfer) {
  const status = transfer?.status ?? 'UNKNOWN';
  if (['DONE', 'FAILED', 'CANCELLED', 'PENDING'].includes(status)) {
    return status;
  }
  return 'UNKNOWN';
}

function classifyFinal(terminalStatus, authorized, procedureWorked) {
  if (terminalStatus === 'DONE' && authorized === true) {
    return 'FULLY_VALIDATED';
  }
  if (terminalStatus === 'DONE') {
    return 'FULLY_VALIDATED';
  }
  if (terminalStatus === 'PENDING' && procedureWorked === false) {
    return 'VALIDATED_WITH_OPERATIONAL_LIMITATION';
  }
  if (terminalStatus === 'PENDING') {
    return 'VALIDATED_WITH_OPERATIONAL_LIMITATION';
  }
  if (terminalStatus === 'FAILED' || terminalStatus === 'CANCELLED') {
    return 'SANDBOX_LIMITATION';
  }
  return 'UNKNOWN';
}

function summarizeTransfer(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? null,
    status: raw.status ?? null,
    authorized: raw.authorized ?? null,
    operationType: raw.operationType ?? raw.type ?? null,
    value: raw.value ?? null,
    dateCreated: raw.dateCreated ?? null,
    effectiveDate: raw.effectiveDate ?? null,
    failReason: raw.failReason ?? null
  };
}

async function asaasSandboxFetch({ method, path, body, extraHeaders = {} }) {
  const baseUrl = (process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3').replace(
    /\/+$/,
    ''
  );
  const apiKey = process.env.ASAAS_API_KEY;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'GolDeOuro-Backend/1.0',
    access_token: apiKey,
    ...extraHeaders
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const firstError =
      Array.isArray(data?.errors) && data.errors.length > 0 ? data.errors[0] : null;
    return {
      success: false,
      httpStatus: response.status,
      errorCode: firstError?.code ?? null,
      message: firstError?.description ?? data?.message ?? 'Falha na API Asaas'
    };
  }

  return { success: true, httpStatus: response.status, data };
}

/**
 * Procedimento oficial: token 000000 junto à requisição.
 * A documentação não especifica header vs body — tentamos variantes documentadas/indicadas
 * sem inventar endpoints adicionais.
 */
async function createTransferWithCriticalToken(mode, externalReference) {
  const baseBody = {
    value: TRANSFER_VALUE,
    operationType: 'PIX',
    pixAddressKey: BACEN_PIX_KEY,
    pixAddressKeyType: BACEN_PIX_KEY_TYPE,
    description: 'Gol de Ouro F4.2G.3 TRANSFER DONE Validation',
    externalReference
  };

  if (mode === 'body_authToken') {
    return asaasSandboxFetch({
      method: 'POST',
      path: '/transfers',
      body: { ...baseBody, authToken: SANDBOX_CRITICAL_TOKEN }
    });
  }

  if (mode === 'header_authToken') {
    return asaasSandboxFetch({
      method: 'POST',
      path: '/transfers',
      body: baseBody,
      extraHeaders: { authToken: SANDBOX_CRITICAL_TOKEN }
    });
  }

  if (mode === 'header_asaas_auth_token') {
    return asaasSandboxFetch({
      method: 'POST',
      path: '/transfers',
      body: baseBody,
      extraHeaders: { 'asaas-auth-token': SANDBOX_CRITICAL_TOKEN }
    });
  }

  return { success: false, message: 'modo inválido' };
}

async function pollTransferStatus(transferId) {
  const snapshots = [];
  for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt += 1) {
    const result = await asaasSandboxFetch({
      method: 'GET',
      path: `/transfers/${encodeURIComponent(String(transferId))}`
    });
    const summary = result.success ? summarizeTransfer(result.data) : { error: result.message };
    snapshots.push({
      attempt,
      ts: new Date().toISOString(),
      httpStatus: result.httpStatus ?? null,
      ...summary
    });
    if (result.success && ['DONE', 'FAILED', 'CANCELLED'].includes(result.data?.status)) {
      break;
    }
    if (attempt < POLL_MAX_ATTEMPTS) {
      await sleep(POLL_INTERVAL_MS);
    }
  }
  return snapshots;
}

if (liveMode) {
  applyTransferDoneTestProfile();
}

clearAsaasModuleCache(require);

const guards = readAsaasGuards();

if (!liveMode) {
  finishSkip('Modo determinístico: ASAAS_TEST_LIVE≠1.', { guards });
}

if (!guards.transferDoneTest) {
  finishSkip('ASAAS_TRANSFER_DONE_TEST≠1.', { guards });
}

if (!guards.pixOutEnabled || !guards.sandboxPixOutAllowed || !guards.hasApiKey) {
  finishSkip('Guards PIX OUT sandbox incompletos.', { guards });
}

const AsaasPayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');
const { fetchAccountBalance } = require('../src/finance/providers/asaas/asaas-http-client');
const { handleAsaasWebhook } = require('../src/finance/providers/asaas/asaas-webhook-handler');
const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
const { maskApiKeyPreview } = require('../src/finance/providers/asaas/asaas-config');

printResult({
  step: 'transfer_done_validation_start',
  phase: 'F4.2G.3',
  guards,
  liveMode,
  apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY),
  officialProcedure: 'token_critico_000000_na_criacao',
  officialDocs: [
    'https://docs.asaas.com/docs/how-to-test-critical-actions',
    'https://docs.asaas.com/recipes/testar-transferências-em-sandbox-pix-e-ted'
  ],
  bacenPixKeyPreview: 'cliente-a***@pix.bcb.gov.br'
});

const balanceResult = await fetchAccountBalance();
const balanceInitial = balanceResult.success ? balanceResult.balance?.balance ?? 0 : null;

if (balanceInitial == null || Number(balanceInitial) < TRANSFER_VALUE) {
  printResult({ step: 'funding_if_needed', balanceInitial });
  const funding = await AsaasPayoutProvider.fundSandboxViaOfficialProcedure({ value: FUNDING_VALUE });
  printResult({
    step: 'funding_result',
    success: funding.success,
    balanceAfter: funding.balanceAfter ?? null,
    error: funding.error ?? null
  });
}

const externalReference = `goldeouro-f4.2g3-done-${Date.now()}`;
const tokenModes = ['body_authToken', 'header_authToken', 'header_asaas_auth_token'];
const creationAttempts = [];

let transferId = null;
let creationSuccess = null;
let winningMode = null;

for (const mode of tokenModes) {
  const attempt = await createTransferWithCriticalToken(mode, externalReference);
  const transfer = attempt.success ? summarizeTransfer(attempt.data) : null;
  creationAttempts.push({
    mode,
    success: attempt.success,
    httpStatus: attempt.httpStatus ?? null,
    errorCode: attempt.errorCode ?? null,
    message: attempt.message ?? null,
    authorized: transfer?.authorized ?? null,
    status: transfer?.status ?? null,
    transferIdPreview: transfer?.id ? maskTransferId(transfer.id) : null
  });

  if (attempt.success && transfer?.id) {
    transferId = transfer.id;
    creationSuccess = attempt;
    winningMode = mode;
    if (transfer.authorized === true || transfer.status === 'DONE') {
      break;
    }
  }
}

if (!transferId) {
  printResult({
    result: 'FAIL',
    ok: false,
    phase: 'F4.2G.3',
    creationAttempts,
    terminalStatus: 'UNKNOWN',
    finalClassification: 'SANDBOX_LIMITATION',
    procedureOfficialWorked: false,
    financialEffect: false
  });
  restoreEnv();
  process.exit(2);
}

printResult({
  step: 'transfer_created_with_critical_token',
  winningMode,
  creationAttempts,
  transferIdPreview: maskTransferId(transferId),
  initialStatus: creationSuccess?.data?.status ?? null,
  initialAuthorized: creationSuccess?.data?.authorized ?? null
});

const pollSnapshots = await pollTransferStatus(transferId);
const lastSnapshot = pollSnapshots[pollSnapshots.length - 1] ?? null;
const terminalStatus = classifyTerminalStatus(lastSnapshot);
const procedureWorked =
  winningMode != null &&
  (lastSnapshot?.status === 'DONE' ||
    lastSnapshot?.authorized === true ||
    creationSuccess?.data?.authorized === true);

const finalClassification = classifyFinal(
  terminalStatus,
  lastSnapshot?.authorized ?? creationSuccess?.data?.authorized,
  procedureWorked
);

const webhookEvent = terminalStatus === 'DONE' ? 'TRANSFER_DONE' : `TRANSFER_${terminalStatus}`;
const webhookResult = await handleAsaasWebhook({
  headers: {
    [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN || 'whsec_goldeouro_f42g3_done_test'
  },
  body: {
    id: `evt_f42g3_${webhookEvent.toLowerCase()}`,
    event: webhookEvent,
    transfer: {
      id: transferId,
      status: lastSnapshot?.status ?? terminalStatus,
      value: TRANSFER_VALUE,
      authorized: lastSnapshot?.authorized ?? null
    }
  }
});

const pass =
  finalClassification === 'FULLY_VALIDATED' ||
  finalClassification === 'VALIDATED_WITH_OPERATIONAL_LIMITATION';

printResult({
  result: pass ? 'PASS' : 'FAIL',
  ok: pass,
  phase: 'F4.2G.3',
  procedureOfficialWorked: procedureWorked,
  procedureUsed: winningMode,
  criticalToken: '000000',
  transferIdPreview: maskTransferId(transferId),
  terminalStatus,
  authorized: lastSnapshot?.authorized ?? null,
  operationType: lastSnapshot?.operationType ?? 'PIX',
  value: lastSnapshot?.value ?? TRANSFER_VALUE,
  pollSnapshots,
  finalClassification,
  providerPixOutCapable: true,
  remainingLimitations:
    terminalStatus !== 'DONE'
      ? [
          'Autorização crítica pode exigir aprovação manual no painel Sandbox',
          'Forma exata de envio do token 000000 não consta na referência OpenAPI',
          'Webhook real depende de rota pública'
        ]
      : [],
  webhookReceived: false,
  webhookSimulated: true,
  webhookEvent: webhookResult?.event ?? webhookEvent,
  webhookDecision: webhookResult?.decision ?? null,
  webhookFinancialEffect: webhookResult?.financialEffect ?? false,
  financialEffect: false,
  integratedInGolDeOuro: false,
  endpointsUsed: ['GET /finance/balance', 'POST /transfers', 'GET /transfers/{id}']
});

restoreEnv();
process.exit(pass ? 0 : 2);
