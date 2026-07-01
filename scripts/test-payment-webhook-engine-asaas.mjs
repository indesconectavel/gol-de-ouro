#!/usr/bin/env node
/**
 * F4.5 — Teste sandbox Asaas webhook via Payment Engine (dry-run).
 * ASAAS_TEST_LIVE=1 + PAYMENT_WEBHOOK_ENGINE_ENABLED=true (via profile).
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyPaymentWebhookEngineProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

function printResult(payload) {
  console.log(JSON.stringify({ phase: 'F4.5', ...payload }, null, 2));
}

function finishSkip(message, extra = {}) {
  printResult({ result: 'SKIP', ok: false, message, liveMode, ...extra });
  restoreEnv();
  process.exit(0);
}

if (liveMode) {
  applyPaymentWebhookEngineProfile();
}

clearAsaasModuleCache(require);

const guards = readAsaasGuards();

if (!liveMode) {
  finishSkip('Modo determinístico: ASAAS_TEST_LIVE≠1.', { guards });
}

const { isPaymentWebhookEngineEnabled } = require('../src/finance/config/payment-webhook-config');
const { processPaymentWebhook } = require('../src/finance/webhooks/processPaymentWebhook');
const { PaymentWebhookDryRunStore } = require('../src/finance/webhooks/paymentWebhookDryRunStore');
const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');

if (!isPaymentWebhookEngineEnabled()) {
  finishSkip('PAYMENT_WEBHOOK_ENGINE_ENABLED=false.', { guards });
}

if (!guards.webhookEnabled || !guards.sandboxWebhookAllowed) {
  finishSkip('Webhook Asaas sandbox não habilitado.', { guards });
}

const dryRunStore = new PaymentWebhookDryRunStore();
const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
const body = {
  id: `evt_f45_live_${Date.now()}`,
  event: 'PAYMENT_RECEIVED',
  payment: {
    id: `pay_f45_live_${Date.now()}`,
    status: 'RECEIVED',
    value: 5,
    externalReference: `goldeouro-f45-live-${Date.now()}`
  }
};

printResult({
  step: 'payment_webhook_engine_asaas_start',
  guards,
  event: body.event,
  paymentId: body.payment.id
});

const result = await processPaymentWebhook({
  provider: 'asaas',
  body,
  headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: webhookToken },
  deps: { dryRunStore }
});

if (!result.success) {
  printResult({
    result: 'FAIL',
    ok: false,
    error: result.error,
    message: result.message,
    rejected: result.rejected === true
  });
  restoreEnv();
  process.exit(2);
}

const duplicate = await processPaymentWebhook({
  provider: 'asaas',
  body,
  headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: webhookToken },
  deps: { dryRunStore }
});

printResult({
  result: 'PASS',
  ok: true,
  provider: result.provider,
  eventType: result.event?.eventType,
  paymentId: result.event?.paymentId,
  status: result.event?.status,
  shouldCreditWallet: result.shouldCreditWallet,
  creditDecision: result.creditDecision,
  dryRun: result.dryRun === true,
  financialEffect: false,
  walletTouched: false,
  ledgerTouched: false,
  idempotencySecondPass: duplicate.idempotent === true,
  store: dryRunStore.snapshot()
});

restoreEnv();
