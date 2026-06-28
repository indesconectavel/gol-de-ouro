#!/usr/bin/env node
/**
 * Verificação F4.6 — crédito controlado wallet/ledger via webhook Asaas.
 */
import { createRequire } from 'node:module';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyEnvironment,
  applyPaymentWebhookControlledCreditProfile
} from './helpers/asaas-test-env.mjs';
import { resolveControlledDbMode } from './helpers/asaas-controlled-ledger.mjs';

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

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);

  const resolution = resolveControlledDbMode(process.env);
  test('environment audit chooses Option B when prod risk', () => {
    if (resolution.mode !== 'B') {
      throw new Error(`expected mode B, got ${resolution.mode}`);
    }
  });

  const { isAsaasControlledCreditEnabled } = require('../src/finance/config/payment-webhook-config');

  test('controlled credit disabled by default', () => {
    if (isAsaasControlledCreditEnabled()) {
      throw new Error('should be disabled by default');
    }
  });

  clearAsaasModuleCache(require);
  applyPaymentWebhookControlledCreditProfile();
  delete require.cache[require.resolve('../src/finance/webhooks/processPaymentWebhook.js')];
  delete require.cache[require.resolve('../src/finance/config/payment-webhook-config.js')];

  const config = require('../src/finance/config/payment-webhook-config');
  const { processPaymentWebhook } = require('../src/finance/webhooks/processPaymentWebhook');
  const { PaymentWebhookControlledCreditStore } = require('../src/finance/webhooks/paymentWebhookControlledCreditStore');
  const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');

  test('controlled credit enabled in sandbox profile', () => {
    if (!config.isAsaasControlledCreditEnabled()) {
      throw new Error('expected controlled credit enabled');
    }
  });

  await runAsync('wallet credit + ledger on PAYMENT_RECEIVED', async () => {
    const store = new PaymentWebhookControlledCreditStore();
    const user = store.createControlledUser();
    const paymentId = 'pay_f46_verify_1';
    const externalReference = 'goldeouro-f46-verify';
    store.recordPixDepositPending({
      userId: user.id,
      providerPaymentId: paymentId,
      amount: 5,
      externalReference
    });

    const body = {
      id: 'evt_f46_verify_1',
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: paymentId,
        status: 'RECEIVED',
        value: 5,
        externalReference
      }
    };

    const first = await processPaymentWebhook({
      provider: 'asaas',
      body,
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      deps: { controlledCreditStore: store }
    });

    if (first.creditDecision !== 'credited' || first.saldo !== 5) {
      throw new Error(`expected credited saldo=5, got ${first.creditDecision} saldo=${first.saldo}`);
    }
    if (store.getLedgerDeposits().length !== 1) {
      throw new Error('expected one ledger deposit');
    }

    const second = await processPaymentWebhook({
      provider: 'asaas',
      body,
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      deps: { controlledCreditStore: store }
    });

    if (second.creditDecision !== 'ignored_duplicate') {
      throw new Error(`expected ignored_duplicate, got ${second.creditDecision}`);
    }
    if (store.getSaldo(user.id) !== 5) {
      throw new Error(`double credit detected: saldo=${store.getSaldo(user.id)}`);
    }
  });

  clearAsaasModuleCache(require);
  applyEnvironment({
    NODE_ENV: 'production',
    ASAAS_PRODUCTION_ENABLED: 'false',
    PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true',
    ASAAS_CONTROLLED_CREDIT_ENABLED: 'true',
    PAYMENT_WEBHOOK_CONTROLLED_CREDIT: '1',
    CONTROLLED_CREDIT_STORE: 'local',
    ASAAS_ENV: 'sandbox',
    ASAAS_WEBHOOK_ENABLED: 'true',
    ALLOW_ASAAS_SANDBOX_WEBHOOK: '1'
  });
  delete require.cache[require.resolve('../src/finance/config/payment-webhook-config.js')];
  delete require.cache[require.resolve('../src/finance/webhooks/processPaymentWebhook.js')];
  const configProd = require('../src/finance/config/payment-webhook-config');
  const processProd = require('../src/finance/webhooks/processPaymentWebhook');

  test('production blocks controlled credit flags', () => {
    if (configProd.isAsaasControlledCreditEnabled()) {
      throw new Error('controlled credit must be off in production');
    }
  });

  await runAsync('production webhook returns blocked_prod when flags set', async () => {
    const store = new PaymentWebhookControlledCreditStore();
    const result = await processProd.processPaymentWebhook({
      provider: 'asaas',
      body: {
        id: 'evt_prod',
        event: 'PAYMENT_RECEIVED',
        payment: { id: 'pay_prod', status: 'RECEIVED', value: 5 }
      },
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: 'any' },
      deps: { controlledCreditStore: store }
    });
    if (result.creditDecision !== 'blocked_prod' || !result.rejected) {
      throw new Error(`expected blocked_prod, got ${result.creditDecision}`);
    }
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (F4.6 controlled credit)');
  console.log(JSON.stringify({ environment: resolution }, null, 2));
} finally {
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
