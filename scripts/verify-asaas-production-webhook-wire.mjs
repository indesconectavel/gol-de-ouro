#!/usr/bin/env node
/**
 * P1.0 — Verificação do wire produção Asaas (sem abrir gate real).
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

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);

  test('ASAAS_PRODUCTION_ENABLED default is OFF', () => {
    const { isAsaasProductionEnabled } = require('../src/finance/config/primary-psp');
    if (isAsaasProductionEnabled()) {
      throw new Error('gate should be closed by default');
    }
  });

  clearAsaasModuleCache(require);
  applyPaymentWebhookEngineProfile();
  delete require.cache[require.resolve('../src/finance/webhooks/processPaymentWebhook.js')];
  const { processPaymentWebhook } = require('../src/finance/webhooks/processPaymentWebhook');
  const { isAsaasProductionWebhookCreditEnabled } = require('../src/finance/config/payment-webhook-config');

  test('production credit path disabled without gate', () => {
    applyEnvironment({ NODE_ENV: 'production', ASAAS_PRODUCTION_ENABLED: 'false' });
    clearAsaasModuleCache(require);
    const cfg = require('../src/finance/config/payment-webhook-config');
    if (cfg.isAsaasProductionWebhookCreditEnabled()) {
      throw new Error('production credit should require ASAAS_PRODUCTION_ENABLED');
    }
  });

  clearAsaasModuleCache(require);
  applyEnvironment({
    NODE_ENV: 'production',
    ASAAS_PRODUCTION_ENABLED: 'true',
    ASAAS_WEBHOOK_ENABLED: 'true',
    ASAAS_ENV: 'production',
    PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true'
  });
  delete require.cache[require.resolve('../src/finance/webhooks/processPaymentWebhook.js')];
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

  clearAsaasModuleCache(require);
  applyEnvironment({ NODE_ENV: 'production', ASAAS_PRODUCTION_ENABLED: 'false', PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true' });
  const processBlocked = require('../src/finance/webhooks/processPaymentWebhook');

  await runAsync('production without gate remains blocked', async () => {
    const result = await processBlocked.processPaymentWebhook({
      provider: 'asaas',
      body: ASAAS_BODY,
      headers: asaasHeaders()
    });
    if (!result.rejected || result.httpStatus !== 403) {
      throw new Error('expected 403 when gate OFF in production');
    }
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.0 Asaas production wire)');
    process.exit(process.exitCode);
  }

  console.log('\nVerification PASSED (P1.0 Asaas production webhook wire)');
} finally {
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
