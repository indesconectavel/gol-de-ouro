#!/usr/bin/env node
/**
 * P1.0 — Verificação do wire produção Asaas (sem abrir gate real).
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

const ASAAS_BODY = {
  id: 'evt_p10_1',
  event: 'PAYMENT_RECEIVED',
  payment: {
    id: 'pay_p10_1',
    status: 'RECEIVED',
    value: 10,
    externalReference: 'goldeouro-p10'
  }
};

function asaasHeaders() {
  const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
  return { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN };
}

function reloadWebhookModules() {
  delete require.cache[require.resolve('../src/finance/config/payment-webhook-config.js')];
  delete require.cache[require.resolve('../src/finance/config/primary-psp.js')];
  delete require.cache[require.resolve('../src/finance/webhooks/processPaymentWebhook.js')];
}

function applyProductionWebhookBase() {
  applyEnvironment({
    NODE_ENV: 'production',
    ASAAS_ENV: 'production',
    ASAAS_ENABLED: 'true',
    ASAAS_API_KEY: '$aact_prod_test_key_placeholder',
    PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true',
    ASAAS_WEBHOOK_ENABLED: 'true',
    ASAAS_WEBHOOK_STRICT_MODE: 'false',
    ASAAS_WEBHOOK_TOKEN: 'whsec_goldeouro_p10_wire_token_min32',
    PAYMENT_PROVIDER: null,
    PAYOUT_PROVIDER: null
  });
}

try {
  resetAsaasEnvironment();
  applyEnvironment({ PAYMENT_PROVIDER: null, PAYOUT_PROVIDER: null });

  test('ASAAS_PRODUCTION_ENABLED default is OFF', () => {
    const { isAsaasProductionEnabled } = require('../src/finance/config/primary-psp');
    if (isAsaasProductionEnabled()) {
      throw new Error('gate should be closed by default');
    }
  });

  applyProductionWebhookBase();
  applyEnvironment({ ASAAS_PRODUCTION_ENABLED: 'false' });
  reloadWebhookModules();
  const { processPaymentWebhook } = require('../src/finance/webhooks/processPaymentWebhook');

  test('production credit path disabled without gate', () => {
    applyEnvironment({ NODE_ENV: 'production', ASAAS_PRODUCTION_ENABLED: 'false' });
    reloadWebhookModules();
    const cfg = require('../src/finance/config/payment-webhook-config');
    if (cfg.isAsaasProductionWebhookCreditEnabled()) {
      throw new Error('production credit should require ASAAS_PRODUCTION_ENABLED');
    }
  });

  applyProductionWebhookBase();
  applyEnvironment({ ASAAS_PRODUCTION_ENABLED: 'true' });
  reloadWebhookModules();
  const processProd = require('../src/finance/webhooks/processPaymentWebhook');
  const cfgProd = require('../src/finance/config/payment-webhook-config');

  test('production credit path enabled when gate ON', () => {
    if (!cfgProd.isAsaasProductionWebhookCreditEnabled()) {
      throw new Error('expected production credit path when gate ON');
    }
  });

  await runAsync('production credit requires claim handler', async () => {
    const result = await processProd.processPaymentWebhook({
      provider: 'asaas',
      body: ASAAS_BODY,
      headers: asaasHeaders()
    });
    if (result.error !== 'CLAIM_HANDLER_MISSING') {
      throw new Error(`expected CLAIM_HANDLER_MISSING, got ${result.error}`);
    }
    if (!result.productionCredit) {
      throw new Error('expected productionCredit flag');
    }
  });

  await runAsync('production credit idempotency + claim wired', async () => {
    const claims = [];
    const mockSupabase = {
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
    };
    const claimAndCreditApprovedPixDeposit = async (id) => {
      claims.push(id);
      return claims.length === 1;
    };

    const first = await processProd.processPaymentWebhook({
      provider: 'asaas',
      body: ASAAS_BODY,
      headers: asaasHeaders(),
      deps: { supabase: mockSupabase, claimAndCreditApprovedPixDeposit, financeLog: () => {} }
    });
    if (!first.productionCredit || !first.credited || first.financialEffect !== true) {
      throw new Error('first webhook should credit');
    }

    const approvedSupabase = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          maybeSingle: async () => ({ data: { id: 'pix_1', status: 'approved' }, error: null })
        };
      }
    };

    const second = await processProd.processPaymentWebhook({
      provider: 'asaas',
      body: ASAAS_BODY,
      headers: asaasHeaders(),
      deps: { supabase: approvedSupabase, claimAndCreditApprovedPixDeposit, financeLog: () => {} }
    });
    if (!second.idempotent || second.financialEffect !== false) {
      throw new Error('replay should be idempotent');
    }
    if (claims.length !== 1) {
      throw new Error('claim should run only once');
    }
  });

  applyProductionWebhookBase();
  applyEnvironment({ ASAAS_PRODUCTION_ENABLED: 'false' });
  reloadWebhookModules();
  const processBlocked = require('../src/finance/webhooks/processPaymentWebhook');

  await runAsync('production without financial gate returns 200 ignored (P1.6W)', async () => {
    const result = await processBlocked.processPaymentWebhook({
      provider: 'asaas',
      body: ASAAS_BODY,
      headers: asaasHeaders()
    });
    if (result.rejected || result.httpStatus === 403) {
      throw new Error('expected HTTP 200 path when ASAAS_WEBHOOK_ENABLED without ASAAS_PRODUCTION_ENABLED');
    }
    if (!result.ignored && result.creditDecision !== 'production_credit_gate_closed') {
      throw new Error(`expected ignored/production_credit_gate_closed, got ${result.creditDecision}`);
    }
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.0 Asaas production wire)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.0 Asaas production webhook wire)');
} finally {
  restoreEnvironment(envSnapshot);
  reloadWebhookModules();
}
