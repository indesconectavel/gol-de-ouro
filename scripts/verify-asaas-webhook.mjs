#!/usr/bin/env node
/**
 * Verificação F4.2C — Asaas webhook stub + validation readiness.
 * Ambiente isolado via asaas-test-env (F4.2D.1).
 */
import { createRequire } from 'node:module';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyEnvironment
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

let fetchCallCount = 0;
const originalFetch = globalThis.fetch;

function installFetchSpy() {
  fetchCallCount = 0;
  globalThis.fetch = async () => {
    fetchCallCount += 1;
    throw new Error('fetch must not be called');
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);
  installFetchSpy();

  const { DECISION, ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
  const { handleAsaasWebhook } = require('../src/finance/providers/asaas/asaas-webhook-handler');

  test('webhook disabled by default', () => {
    const { isAsaasWebhookEnabled } = require('../src/finance/providers/asaas/asaas-config');
    if (isAsaasWebhookEnabled()) {
      throw new Error('ASAAS_WEBHOOK_ENABLED should be false');
    }
  });

  await runAsync('disabled webhook returns IGNORED_DISABLED', async () => {
    const result = await handleAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: 'whsec_test' },
      body: { id: 'evt_1', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1' } }
    });
    if (result.decision !== DECISION.IGNORED_DISABLED) {
      throw new Error(`expected IGNORED_DISABLED, got ${result.decision}`);
    }
    if (result.financialEffect !== false) {
      throw new Error('financialEffect must be false');
    }
  });

  resetAsaasEnvironment();
  applyEnvironment({
    ASAAS_WEBHOOK_ENABLED: 'true',
    ASAAS_WEBHOOK_TOKEN: 'whsec_valid_token_123456',
    ASAAS_PIX_IN_ENABLED: 'false',
    ALLOW_ASAAS_SANDBOX_PIX_IN: '0'
  });
  clearAsaasModuleCache(require);

  const { validateAsaasWebhook } = require('../src/finance/providers/asaas/asaas-webhook-validator');
  const AsaasPaymentProvider = require('../src/finance/providers/asaas/AsaasPaymentProvider');
  const AsaasPayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');

  await runAsync('empty payload is INVALID_PAYLOAD', async () => {
    const result = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body: {}
    });
    if (result.decision !== DECISION.INVALID_PAYLOAD) {
      throw new Error(`expected INVALID_PAYLOAD, got ${result.decision}`);
    }
  });

  await runAsync('unknown event is IGNORED_UNKNOWN_EVENT', async () => {
    const result = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body: { id: 'evt_unknown', event: 'CUSTOM_TEST_EVENT_XYZ' }
    });
    if (result.decision !== DECISION.IGNORED_UNKNOWN_EVENT) {
      throw new Error(`expected IGNORED_UNKNOWN_EVENT, got ${result.decision}`);
    }
  });

  await runAsync('valid simulated payment event passes without financial effect', async () => {
    const result = await handleAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body: {
        id: 'evt_pay_001',
        event: 'PAYMENT_RECEIVED',
        payment: { id: 'pay_001', status: 'RECEIVED', value: 10 }
      }
    });
    if (result.decision !== DECISION.VALID_SIMULATED_EVENT) {
      throw new Error(`expected VALID_SIMULATED_EVENT, got ${result.decision}`);
    }
    if (result.financialEffect !== false) {
      throw new Error('must not have financial effect');
    }
    if (result.category !== 'payment') {
      throw new Error(`expected payment category, got ${result.category}`);
    }
  });

  await runAsync('invalid token is rejected in strict mode', async () => {
    const result = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: 'whsec_wrong_token' },
      body: { id: 'evt_2', event: 'PAYMENT_CREATED', payment: { id: 'pay_2' } }
    });
    if (result.decision !== DECISION.INVALID_SIGNATURE_OR_TOKEN) {
      throw new Error(`expected INVALID_SIGNATURE_OR_TOKEN, got ${result.decision}`);
    }
  });

  await runAsync('payment provider not invoked on webhook handle', async () => {
    let called = false;
    const original = AsaasPaymentProvider.createPixDeposit;
    AsaasPaymentProvider.createPixDeposit = async () => {
      called = true;
      return { success: true };
    };
    try {
      await handleAsaasWebhook({
        headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
        body: { id: 'evt_3', event: 'TRANSFER_DONE', transfer: { id: 'tr_1' } }
      });
      if (called) throw new Error('PaymentProvider should not be called');
    } finally {
      AsaasPaymentProvider.createPixDeposit = original;
    }
  });

  await runAsync('payout provider not invoked on webhook handle', async () => {
    let called = false;
    const original = AsaasPayoutProvider.requestPixPayout;
    AsaasPayoutProvider.requestPixPayout = async () => {
      called = true;
      return { success: true };
    };
    try {
      await handleAsaasWebhook({
        headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
        body: { id: 'evt_4', event: 'TRANSFER_FAILED', transfer: { id: 'tr_2' } }
      });
      if (called) throw new Error('PayoutProvider should not be called');
    } finally {
      AsaasPayoutProvider.requestPixPayout = original;
    }
  });

  test('no real HTTP calls during verification', () => {
    if (fetchCallCount !== 0) {
      throw new Error(`fetch called ${fetchCallCount} times`);
    }
  });

  restoreFetch();

  if (process.exitCode) {
    console.error('\nVerification FAILED');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED');
} finally {
  restoreEnvironment(envSnapshot);
}
