#!/usr/bin/env node
/**
 * F4.2G.2 — Investigação autorização transferência PIX OUT Asaas Sandbox.
 * F4.2G.3 — validação DONE: scripts/test-asaas-transfer-done.mjs
 *
 * Live: ASAAS_TEST_LIVE=1 ASAAS_TRANSFER_AUTH_TEST=1 ALLOW_ASAAS_SANDBOX_PIX_OUT=1
 * Transfer ID opcional: ASAAS_SANDBOX_TRANSFER_ID
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyTransferAuthTestProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

const DEFAULT_TRANSFER_ID = 'ad0e8afb-f56e-4147-bd5c-e472b18692c8';
const AUTH_ENDPOINT_DOCUMENTED = false;

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

function printResult(result) {
  console.log(JSON.stringify(result, null, 2));
}

function finishSkip(message, extra = {}) {
  printResult({
    result: 'SKIP',
    ok: false,
    httpCalled: false,
    authClassification: 'UNKNOWN',
    message,
    liveMode,
    ...extra
  });
  restoreEnv();
  process.exit(0);
}

function mapFinalClassification(transfer, beforeStatus, afterStatus) {
  if (afterStatus === 'AUTHORIZED_AND_DONE' || transfer?.status === 'DONE') {
    return 'AUTHORIZED_AND_DONE';
  }
  if (transfer?.authorized === false && transfer?.status === 'PENDING') {
    return 'PENDING_REQUIRES_2FA';
  }
  if (afterStatus === 'PENDING_ASYNC_PROCESSING' || transfer?.status === 'BANK_PROCESSING') {
    return 'PENDING_ASYNC_PROCESSING';
  }
  if (beforeStatus === afterStatus && transfer?.authorized === false) {
    return 'PENDING_REQUIRES_2FA';
  }
  return 'UNKNOWN';
}

function buildWebhookEventType(transfer) {
  if (!transfer?.status) return 'TRANSFER_PENDING';
  if (transfer.status === 'DONE') return 'TRANSFER_DONE';
  if (transfer.status === 'FAILED') return 'TRANSFER_FAILED';
  if (transfer.status === 'CANCELLED') return 'TRANSFER_CANCELLED';
  return 'TRANSFER_PENDING';
}

if (liveMode) {
  applyTransferAuthTestProfile();
}

clearAsaasModuleCache(require);

const guards = readAsaasGuards();

if (!liveMode) {
  finishSkip(
    'Modo determinístico: ASAAS_TEST_LIVE≠1. Nenhuma consulta HTTP.',
    { guards }
  );
}

if (!guards.transferAuthTest) {
  finishSkip('ASAAS_TRANSFER_AUTH_TEST≠1.', { guards });
}

if (!guards.pixOutEnabled || !guards.sandboxPixOutAllowed) {
  finishSkip('PIX OUT sandbox desabilitado ou bloqueado.', { guards });
}

if (!guards.asaasEnabled || !guards.sandboxAuthAllowed || !guards.sandboxEnv) {
  finishSkip('Guards sandbox incompletos.', { guards });
}

if (!guards.hasApiKey) {
  finishSkip('ASAAS_API_KEY ausente.', { guards });
}

const AsaasPayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');
const { handleAsaasWebhook } = require('../src/finance/providers/asaas/asaas-webhook-handler');
const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
const { maskApiKeyPreview } = require('../src/finance/providers/asaas/asaas-config');

const transferId = process.env.ASAAS_SANDBOX_TRANSFER_ID || DEFAULT_TRANSFER_ID;

printResult({
  step: 'transfer_auth_investigation_start',
  phase: 'F4.2G.2',
  guards,
  liveMode,
  transferIdPreview: `${String(transferId).slice(0, 8)}...${String(transferId).slice(-4)}`,
  apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY),
  authEndpointDocumented: AUTH_ENDPOINT_DOCUMENTED,
  documentedAuthMethods: [
    'SMS/APP token (critical action) — painel ou token na criação (000000 sandbox)',
    'Webhook de validação de transferência — APPROVED/REFUSED',
    'Whitelist IP + desativar evento crítico',
    'Suporte Asaas — desabilitar token no Sandbox'
  ]
});

const beforeInspection = await AsaasPayoutProvider.inspectSandboxTransfer(transferId);

printResult({
  step: 'transfer_status_before',
  success: beforeInspection.success,
  httpStatus: beforeInspection.httpStatus ?? null,
  authStatus: beforeInspection.authStatus ?? null,
  transfer: beforeInspection.transfer ?? null,
  error: beforeInspection.error ?? null,
  message: beforeInspection.message ?? null
});

let authorizationAttempted = false;
let authorizationResult = null;

if (!AUTH_ENDPOINT_DOCUMENTED) {
  printResult({
    step: 'authorization_api_skipped',
    reason:
      'Nenhum endpoint oficial documentado para autorizar transferência existente (GET/POST /transfers/{id}/authorize ausente na referência API).',
    panelPath:
      'sandbox.asaas.com → Integrações → Mecanismos de segurança / aprovação manual de saques',
    sandboxTokenHint: 'Token crítico sandbox documentado: 000000 (enviado na criação, não pós-criação)'
  });
} else {
  authorizationAttempted = true;
}

await new Promise((resolve) => setTimeout(resolve, 3000));

const afterInspection = await AsaasPayoutProvider.inspectSandboxTransfer(transferId);

printResult({
  step: 'transfer_status_after',
  success: afterInspection.success,
  httpStatus: afterInspection.httpStatus ?? null,
  authStatus: afterInspection.authStatus ?? null,
  transfer: afterInspection.transfer ?? null,
  statusChanged:
    beforeInspection.transfer?.status !== afterInspection.transfer?.status ||
    beforeInspection.transfer?.authorized !== afterInspection.transfer?.authorized
});

const transferForWebhook = afterInspection.transfer || beforeInspection.transfer;
const webhookEvent = buildWebhookEventType(transferForWebhook);
const webhookResult = transferForWebhook
  ? await handleAsaasWebhook({
      headers: {
        [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN || 'whsec_goldeouro_f42g2_auth_test'
      },
      body: {
        id: `evt_f42g2_${webhookEvent.toLowerCase()}`,
        event: webhookEvent,
        transfer: {
          id: transferForWebhook.id,
          status: transferForWebhook.status,
          value: transferForWebhook.value,
          authorized: transferForWebhook.authorized
        }
      }
    })
  : null;

const authClassification = mapFinalClassification(
  afterInspection.transfer || beforeInspection.transfer,
  beforeInspection.authStatus,
  afterInspection.authStatus
);

const pass =
  beforeInspection.success === true &&
  authClassification !== 'UNKNOWN' &&
  (webhookResult?.financialEffect === false || webhookResult == null);

printResult({
  result: pass ? 'PASS' : 'FAIL',
  ok: pass,
  phase: 'F4.2G.2',
  transferIdPreview: `${String(transferId).slice(0, 8)}...${String(transferId).slice(-4)}`,
  statusBefore: beforeInspection.transfer?.status ?? null,
  authorizedBefore: beforeInspection.transfer?.authorized ?? null,
  statusAfter: afterInspection.transfer?.status ?? null,
  authorizedAfter: afterInspection.transfer?.authorized ?? null,
  authClassification,
  whyPending:
    beforeInspection.transfer?.authorized === false
      ? 'authorized=false — aguardando token SMS/APP ou aprovação manual (autorização crítica habilitada)'
      : null,
  authorizationAttempted,
  authorizationResult,
  authEndpointFound: AUTH_ENDPOINT_DOCUMENTED,
  webhookReceived: false,
  webhookSimulated: webhookResult != null,
  webhookEvent: webhookResult?.event ?? webhookEvent,
  webhookDecision: webhookResult?.decision ?? null,
  webhookFinancialEffect: webhookResult?.financialEffect ?? false,
  financialEffect: false,
  integratedInGolDeOuro: false,
  endpointsUsed: ['GET /transfers/{id}']
});

restoreEnv();
process.exit(pass ? 0 : 2);
