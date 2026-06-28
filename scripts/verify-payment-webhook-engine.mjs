#!/usr/bin/env node
/**
 * Verificação F4.5 — Payment Webhook Engine provider-agnostic.
 */
import { createRequire } from 'node:module';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyEnvironment,
  applyPaymentWebhookEngineProfile
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

  const { isPaymentWebhookEngineEnabled } = require('../src/finance/config/payment-webhook-config');
  const { processPaymentWebhook } = require('../src/finance/webhooks/processPaymentWebhook');
  const { PaymentWebhookDryRunStore } = require('../src/finance/webhooks/paymentWebhookDryRunStore');
  const { validateMercadoPagoDepositWebhook } = require('../src/finance/providers/mercadopago/mercadopago-webhook-validator');
  const { normalizeMercadoPagoPaymentWebhook } = require('../src/finance/providers/mercadopago/mercadopago-webhook-normalizer');
  const { normalizeAsaasPaymentWebhook } = require('../src/finance/providers/asaas/asaas-webhook-normalizer');
  const { validateAsaasWebhook, DECISION, ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
  const { isProductionRuntime, isAsaasProductionEnabled } = require('../src/finance/config/primary-psp');

  test('webhook engine disabled by default', () => {
    if (isPaymentWebhookEngineEnabled()) {
      throw new Error('PAYMENT_WEBHOOK_ENGINE_ENABLED should be false');
    }
  });

  await runAsync('engine disabled returns PAYMENT_WEBHOOK_ENGINE_DISABLED', async () => {
    const result = await processPaymentWebhook({
      provider: 'mercadopago',
      body: { type: 'payment', data: { id: '123' } }
    });
    if (result.error !== 'PAYMENT_WEBHOOK_ENGINE_DISABLED') {
      throw new Error(`unexpected: ${result.error}`);
    }
  });

  test('Mercado Pago signature validator preserved', () => {
    if (typeof validateMercadoPagoDepositWebhook !== 'function') {
      throw new Error('validateMercadoPagoDepositWebhook missing');
    }
    const result = validateMercadoPagoDepositWebhook({
      body: { type: 'payment', data: { id: '1' } },
      headers: {}
    });
    if (result.valid === true) {
      throw new Error('expected invalid without signature');
    }
  });

  test('Mercado Pago event normalizes to internal contract', () => {
    const normalized = normalizeMercadoPagoPaymentWebhook({
      body: { type: 'payment', data: { id: '12345' } },
      mpPayment: {
        status: 'approved',
        transaction_amount: 10,
        external_reference: 'goldeouro_test'
      }
    });
    if (!normalized.success || !normalized.event) {
      throw new Error('normalization failed');
    }
    const e = normalized.event;
    if (e.provider !== 'mercadopago') throw new Error('provider mismatch');
    if (e.paymentId !== '12345') throw new Error('paymentId mismatch');
    if (!e.shouldCreditWallet) throw new Error('should credit on approved');
    if (e.externalReference !== 'goldeouro_test') throw new Error('externalReference missing');
  });

  clearAsaasModuleCache(require);
  applyPaymentWebhookEngineProfile();
  delete require.cache[require.resolve('../src/finance/webhooks/processPaymentWebhook.js')];
  const processEnabled = require('../src/finance/webhooks/processPaymentWebhook');

  test('Asaas PAYMENT_RECEIVED normalizes in sandbox', () => {
    const body = {
      id: 'evt_f45_1',
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_f45_1',
        status: 'RECEIVED',
        value: 5,
        externalReference: 'goldeouro-f45'
      }
    };
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });
    const normalized = normalizeAsaasPaymentWebhook({ body, validation });
    if (!normalized.success || !normalized.event) {
      throw new Error('asaas normalization failed');
    }
    if (normalized.event.provider !== 'asaas') throw new Error('provider mismatch');
    if (!normalized.event.shouldCreditWallet) throw new Error('should credit PAYMENT_RECEIVED');
  });

  test('invalid Asaas payload rejected', () => {
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body: {}
    });
    if (validation.decision !== DECISION.INVALID_PAYLOAD) {
      throw new Error(`expected INVALID_PAYLOAD, got ${validation.decision}`);
    }
  });

  test('invalid Asaas token rejected', () => {
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: 'wrong-token' },
      body: { id: 'evt_x', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_x', status: 'RECEIVED' } }
    });
    if (validation.decision !== DECISION.INVALID_SIGNATURE_OR_TOKEN) {
      throw new Error(`expected token mismatch, got ${validation.decision}`);
    }
  });

  test('unknown Asaas event ignored', () => {
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body: { id: 'evt_u', event: 'UNKNOWN_EVENT_XYZ', payment: { id: 'pay_u' } }
    });
    if (validation.decision !== DECISION.IGNORED_UNKNOWN_EVENT) {
      throw new Error(`expected IGNORED_UNKNOWN_EVENT, got ${validation.decision}`);
    }
  });

  await runAsync('idempotency prevents duplicate dry-run credit', async () => {
    const store = new PaymentWebhookDryRunStore();
    const body = {
      id: 'evt_dup',
      event: 'PAYMENT_RECEIVED',
      payment: { id: 'pay_dup', status: 'RECEIVED', value: 5, externalReference: 'dup' }
    };
    const first = await processEnabled.processPaymentWebhook({
      provider: 'asaas',
      body,
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      deps: { dryRunStore: store }
    });
    const second = await processEnabled.processPaymentWebhook({
      provider: 'asaas',
      body,
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      deps: { dryRunStore: store }
    });
    if (!first.success || first.idempotent) throw new Error('first should process');
    if (!second.idempotent) throw new Error('second should be idempotent');
    if (second.financialEffect !== false) throw new Error('no real financial effect');
  });

  clearAsaasModuleCache(require);
  applyEnvironment({ NODE_ENV: 'production', ASAAS_PRODUCTION_ENABLED: 'false', PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true' });
  const processProd = require('../src/finance/webhooks/processPaymentWebhook');

  await runAsync('production blocks Asaas webhook route', async () => {
    if (!isProductionRuntime()) throw new Error('expected production runtime');
    if (isAsaasProductionEnabled()) throw new Error('gate should be closed');
    const result = await processProd.processPaymentWebhook({
      provider: 'asaas',
      body: { id: 'evt_p', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_p', status: 'RECEIVED' } },
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: 'token' }
    });
    if (!result.rejected || result.httpStatus !== 403) {
      throw new Error('expected 403 blocked asaas in prod');
    }
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (F4.5 Payment Webhook Engine)');
} finally {
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
