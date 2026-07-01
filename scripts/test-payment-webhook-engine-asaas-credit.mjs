#!/usr/bin/env node
/**
 * F4.6 — E2E webhook Asaas com crédito wallet/ledger controlado (Opção B).
 * ASAAS_TEST_LIVE=1 + flags controlled credit.
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyPaymentWebhookControlledCreditProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';
import { resolveControlledDbMode, maskId } from './helpers/asaas-controlled-ledger.mjs';

const require = createRequire(import.meta.url);

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

function printResult(payload) {
  console.log(JSON.stringify({ phase: 'F4.6', ...payload }, null, 2));
}

function finishSkip(message, extra = {}) {
  printResult({ result: 'SKIP', ok: false, message, liveMode, ...extra });
  restoreEnv();
  process.exit(0);
}

const resolution = resolveControlledDbMode(process.env);

if (liveMode) {
  applyPaymentWebhookControlledCreditProfile();
}

clearAsaasModuleCache(require);

const guards = readAsaasGuards();

if (!liveMode) {
  finishSkip('Modo determinístico: ASAAS_TEST_LIVE≠1.', { guards, environment: resolution });
}

const { isAsaasControlledCreditEnabled } = require('../src/finance/config/payment-webhook-config');
const { processPaymentWebhook } = require('../src/finance/webhooks/processPaymentWebhook');
const { PaymentWebhookControlledCreditStore } = require('../src/finance/webhooks/paymentWebhookControlledCreditStore');
const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');

if (!isAsaasControlledCreditEnabled()) {
  finishSkip('Crédito controlado não habilitado.', { guards, environment: resolution });
}

const store = new PaymentWebhookControlledCreditStore();
const user = store.createControlledUser({ email: 'f46-live@goldeouro.test', nome: 'F46 Live Controlado' });
const saldoInicial = store.getSaldo(user.id);

const paymentId = `pay_f46_live_${Date.now()}`;
const externalReference = `goldeouro-f46-live-${Date.now()}`;
const eventId = `evt_f46_live_${Date.now()}`;
const amount = 5;

store.recordPixDepositPending({
  userId: user.id,
  providerPaymentId: paymentId,
  amount,
  externalReference
});

const body = {
  id: eventId,
  event: 'PAYMENT_RECEIVED',
  payment: {
    id: paymentId,
    status: 'RECEIVED',
    value: amount,
    externalReference
  }
};

printResult({
  step: 'controlled_credit_test_start',
  environment: resolution,
  guards,
  userIdPreview: maskId(user.id),
  saldoInicial,
  paymentIdPreview: maskId(paymentId),
  externalReference
});

const first = await processPaymentWebhook({
  provider: 'asaas',
  body,
  headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
  deps: { controlledCreditStore: store }
});

const saldoAposCredito = store.getSaldo(user.id);
const ledger = store.getLedgerDeposits();

if (first.creditDecision !== 'credited' || saldoAposCredito !== amount) {
  printResult({
    result: 'FAIL',
    ok: false,
    first,
    saldoAposCredito,
    expected: amount
  });
  restoreEnv();
  process.exit(2);
}

const second = await processPaymentWebhook({
  provider: 'asaas',
  body,
  headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
  deps: { controlledCreditStore: store }
});

const saldoFinal = store.getSaldo(user.id);

if (second.creditDecision !== 'ignored_duplicate' || saldoFinal !== amount) {
  printResult({
    result: 'FAIL',
    ok: false,
    message: 'idempotência falhou — double credit',
    second,
    saldoFinal
  });
  restoreEnv();
  process.exit(2);
}

printResult({
  result: 'PASS',
  ok: true,
  environment: resolution,
  provider: 'asaas',
  saldoInicial,
  deposito: amount,
  saldoAposPrimeiroEvento: saldoAposCredito,
  saldoFinal,
  idempotencyReplay: second.creditDecision,
  ledgerEntry: {
    tipo: ledger[0]?.tipo,
    provider: ledger[0]?.provider,
    valor: ledger[0]?.valor,
    paymentIdPreview: maskId(ledger[0]?.payment_id),
    eventIdPreview: maskId(ledger[0]?.event_id),
    idempotencyKeyPreview: ledger[0]?.idempotency_key
      ? `${String(ledger[0].idempotency_key).slice(0, 16)}...`
      : null
  },
  supabaseProducaoTocado: false,
  financialEffectScope: 'controlled_local_only'
});

restoreEnv();
