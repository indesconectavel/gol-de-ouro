#!/usr/bin/env node
/**
 * P1.6W — Verificação do desacoplamento webhook Asaas vs gates PIX OUT / produção financeira.
 */
import { createRequire } from 'node:module';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
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

function asaasHeaders() {
  const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
  return { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN || 'whsec_p16w_test_token_min32chars' };
}

function applyDecoupledProductionProfile() {
  applyEnvironment({
    NODE_ENV: 'production',
    ASAAS_ENV: 'production',
    ASAAS_ENABLED: 'true',
    ASAAS_API_KEY: '$aact_prod_test_key_placeholder',
    ASAAS_WEBHOOK_ENABLED: 'true',
    ASAAS_WEBHOOK_STRICT_MODE: 'false',
    ASAAS_WEBHOOK_TOKEN: 'whsec_p16w_test_token_min32chars',
    ASAAS_PRODUCTION_ENABLED: 'false',
    ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'false',
    PAYMENT_ENGINE_PIXOUT_ENABLED: 'false',
    PAYOUT_PIX_ENABLED: 'false',
    PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true',
    PAYMENT_PROVIDER: null,
    PAYOUT_PROVIDER: null
  });
}

function loadWebhookModule() {
  delete require.cache[require.resolve('../src/finance/webhooks/processPaymentWebhook.js')];
  const mod = require('../src/finance/webhooks/processPaymentWebhook');
  return {
    processPaymentWebhook: mod,
    isAsaasWebhookRouteAllowed: mod.isAsaasWebhookRouteAllowed
  };
}

try {
  resetAsaasEnvironment();
  applyDecoupledProductionProfile();

  test('Caso A setup — route allowed without ASAAS_PRODUCTION_ENABLED', () => {
    const { isAsaasWebhookRouteAllowed } = loadWebhookModule();
    if (!isAsaasWebhookRouteAllowed()) {
      throw new Error('expected route allowed with ASAAS_WEBHOOK_ENABLED=true');
    }
  });

  await runAsync('Caso A — PAYMENT_CREATED returns success (HTTP 200 path)', async () => {
    const { processPaymentWebhook } = loadWebhookModule();
    const result = await processPaymentWebhook.processPaymentWebhook({
      provider: 'asaas',
      body: {
        id: 'evt_p16w_created',
        event: 'PAYMENT_CREATED',
        payment: { id: 'pay_p16w_1', status: 'PENDING', value: 10 }
      },
      headers: asaasHeaders(),
      deps: { financeLog: () => {} }
    });
    if (result.rejected || result.httpStatus === 403) {
      throw new Error(`unexpected reject/403: ${result.error}`);
    }
    if (!result.success) {
      throw new Error(`expected success, got ${result.error}`);
    }
  });

  await runAsync('Caso B — PAYMENT_RECEIVED returns 200 ignored when financial gate OFF', async () => {
    const { processPaymentWebhook } = loadWebhookModule();
    const result = await processPaymentWebhook.processPaymentWebhook({
      provider: 'asaas',
      body: {
        id: 'evt_p16w_received',
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_p16w_2',
          status: 'RECEIVED',
          value: 10,
          externalReference: 'p16w-ref'
        }
      },
      headers: asaasHeaders(),
      deps: {
        financeLog: () => {},
        supabase: {
          from() {
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              maybeSingle: async () => ({ data: null, error: null })
            };
          }
        }
      }
    });
    if (result.rejected || result.httpStatus === 403) {
      throw new Error('must not return 403 — Asaas penalizes non-200');
    }
    if (!result.success) {
      throw new Error(`expected success, got ${result.error}`);
    }
    if (!result.ignored && result.creditDecision !== 'production_credit_gate_closed') {
      throw new Error(`expected ignored or production_credit_gate_closed, got ${result.creditDecision}`);
    }
  });

  await runAsync('Caso B credit ON — PAYMENT_RECEIVED credits when ASAAS_PRODUCTION_ENABLED=true', async () => {
    applyEnvironment({ ASAAS_PRODUCTION_ENABLED: 'true' });
    const { processPaymentWebhook } = loadWebhookModule();
    const claims = [];
    const result = await processPaymentWebhook.processPaymentWebhook({
      provider: 'asaas',
      body: {
        id: 'evt_p16w_credit',
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_p16w_3',
          status: 'RECEIVED',
          value: 5,
          externalReference: 'p16w-credit'
        }
      },
      headers: asaasHeaders(),
      deps: {
        financeLog: () => {},
        supabase: {
          from() {
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              maybeSingle: async () => ({ data: null, error: null })
            };
          }
        },
        claimAndCreditApprovedPixDeposit: async (id) => {
          claims.push(id);
          return true;
        }
      }
    });
    if (!result.productionCredit || !result.credited) {
      throw new Error('expected production credit when ASAAS_PRODUCTION_ENABLED=true');
    }
    if (claims.length !== 1) {
      throw new Error('expected single claim');
    }
  });

  await runAsync('Caso C — TRANSFER_DONE does not 403 when auth webhook gate OFF', async () => {
    applyDecoupledProductionProfile();
    process.env.ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED = 'false';
    const { processPaymentWebhook } = loadWebhookModule();
    const result = await processPaymentWebhook.processPaymentWebhook({
      provider: 'asaas',
      body: {
        id: 'evt_p16w_transfer',
        event: 'TRANSFER_DONE',
        transfer: {
          id: 'tr_p16w_unknown',
          status: 'DONE',
          value: 8,
          externalReference: 'wd_nonexistent_ref'
        }
      },
      headers: asaasHeaders(),
      deps: {
        financeLog: () => {},
        supabase: {
          from() {
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              maybeSingle: async () => ({ data: null, error: null })
            };
          }
        }
      }
    });
    if (result.rejected && result.httpStatus === 403) {
      throw new Error('TRANSFER_DONE must not 403 on general webhook');
    }
    if (result.httpStatus === 403) {
      throw new Error('must not propagate 403 to compat layer');
    }
  });

  test('Caso D — PIX OUT production gate remains closed', () => {
    applyDecoupledProductionProfile();
    delete require.cache[require.resolve('../src/finance/config/asaas-pix-out-config.js')];
    const { guardAsaasPixOutProduction } = require('../src/finance/config/asaas-pix-out-config');
    const guard = guardAsaasPixOutProduction();
    if (!guard || guard.success !== false) {
      throw new Error('expected PIX OUT production guard to block');
    }
  });

  test('Caso D — PAYOUT_PROVIDER unset keeps payout path closed', () => {
    if (process.env.PAYOUT_PROVIDER) {
      throw new Error('PAYOUT_PROVIDER must be unset for decoupled profile');
    }
  });

  test('ASAAS_WEBHOOK_ENABLED=false still blocks route', () => {
    applyEnvironment({ ASAAS_WEBHOOK_ENABLED: 'false' });
    const { isAsaasWebhookRouteAllowed } = loadWebhookModule();
    if (isAsaasWebhookRouteAllowed()) {
      throw new Error('route must be blocked when ASAAS_WEBHOOK_ENABLED=false');
    }
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.6W webhook gate decoupling)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.6W webhook gate decoupling)');
} finally {
  restoreEnvironment(envSnapshot);
  delete require.cache[require.resolve('../src/finance/webhooks/processPaymentWebhook.js')];
}
