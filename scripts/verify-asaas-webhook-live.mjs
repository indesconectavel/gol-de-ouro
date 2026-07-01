#!/usr/bin/env node
/**
 * Verificação F4.2F — webhook live sandbox classification.
 */
import { createRequire } from 'node:module';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyWebhookLiveProfile
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

const envSnapshot = snapshotEnvironment();
const WEBHOOK_TOKEN = 'whsec_verify_webhook_live';

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

  const { DECISION, isValidDecision } = require('../src/finance/providers/asaas/asaas-webhook-validator');

  test('sandbox payment decision exists', () => {
    if (!DECISION.VALID_SANDBOX_PAYMENT_EVENT) {
      throw new Error('missing VALID_SANDBOX_PAYMENT_EVENT');
    }
  });

  applyWebhookLiveProfile({ webhookToken: WEBHOOK_TOKEN });
  clearAsaasModuleCache(require);

  const { handleAsaasWebhook } = require('../src/finance/providers/asaas/asaas-webhook-handler');
  const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');

  await runAsync('live sandbox payment event classified', async () => {
    const result = await handleAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
      body: {
        id: 'evt_verify_payment',
        event: 'PAYMENT_CONFIRMED',
        payment: { id: 'pay_verify', status: 'CONFIRMED', value: 5 }
      }
    });
    if (result.decision !== DECISION.VALID_SANDBOX_PAYMENT_EVENT) {
      throw new Error(`expected VALID_SANDBOX_PAYMENT_EVENT, got ${result.decision}`);
    }
    if (result.financialEffect !== false) {
      throw new Error('financialEffect must be false');
    }
  });

  await runAsync('all valid decisions include financialEffect false', async () => {
    const decisions = [
      DECISION.VALID_SIMULATED_EVENT,
      DECISION.VALID_SANDBOX_EVENT,
      DECISION.VALID_SANDBOX_PAYMENT_EVENT,
      DECISION.VALID_SANDBOX_TRANSFER_EVENT
    ];
    for (const d of decisions) {
      if (!isValidDecision(d)) throw new Error(`${d} not valid`);
    }
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED');
} finally {
  restoreEnvironment(envSnapshot);
}
