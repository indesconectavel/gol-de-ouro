#!/usr/bin/env node
/**
 * Verificação F4.3B — guards E2E DB controlado (sem HTTP live).
 */
import { createRequire } from 'node:module';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyEnvironment
} from './helpers/asaas-test-env.mjs';
import {
  resolveControlledDbMode,
  ControlledFinanceStore,
  PROD_SUPABASE_REF
} from './helpers/asaas-controlled-ledger.mjs';

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

  test('blocks prod supabase ref in resolution', () => {
    const resolution = resolveControlledDbMode({
      SUPABASE_URL: `https://${PROD_SUPABASE_REF}.supabase.co`,
      ASAAS_E2E_USE_SUPABASE: '1'
    });
    if (resolution.mode !== 'B') {
      throw new Error('expected mode B when prod ref detected');
    }
  });

  test('defaults to option B without staging', () => {
    const resolution = resolveControlledDbMode({});
    if (resolution.mode !== 'B') {
      throw new Error(`expected B, got ${resolution.mode}`);
    }
  });

  await runAsync('controlled store persists schema tables', async () => {
    const store = new ControlledFinanceStore({ runId: 'verify_local' });
    const user = store.createTestUser();
    store.recordPixDepositPending({
      userId: user.id,
      providerPaymentId: 'pay_verify_test',
      amount: 5
    });
    const credit = store.creditDepositFromWebhook({
      providerPaymentId: 'pay_verify_test',
      event: 'PAYMENT_RECEIVED',
      amount: 5
    });
    if (!credit.credited || store.getSaldo(user.id) !== 5) {
      throw new Error('credit failed');
    }
    const replay = store.creditDepositFromWebhook({
      providerPaymentId: 'pay_verify_test',
      event: 'PAYMENT_RECEIVED',
      amount: 5
    });
    if (!replay.idempotent) {
      throw new Error('idempotency failed');
    }
    store.teardown();
  });

  applyEnvironment({
    ASAAS_E2E_DB_TEST: '1',
    ASAAS_TEST_LIVE: '0',
    NODE_ENV: 'development',
    PAYMENT_PROVIDER: 'asaas',
    PAYOUT_PROVIDER: 'asaas'
  });
  clearAsaasModuleCache(require);

  test('factory blocks asaas without primary sandbox live flags', () => {
    let threw = false;
    try {
      require('../src/finance/factory/FinanceProviderFactory').resolvePayoutProvider();
    } catch (err) {
      threw = true;
    }
    if (!threw) throw new Error('expected factory block without ASAAS_TEST_LIVE');
  });

  if (process.exitCode) {
    console.error('\nVerification FAILED');
    process.exit(process.exitCode);
  }
  console.log('\nVerification PASSED');
} finally {
  restoreEnvironment(envSnapshot);
}
