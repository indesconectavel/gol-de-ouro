#!/usr/bin/env node
/**
 * Verificação F4.2G.2 — investigação autorização transferência (local, sem HTTP).
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
    throw new Error('fetch must not be called in verify mode');
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

try {
  resetAsaasEnvironment();
  clearAsaasModuleCache(require);
  installFetchSpy();

  const AsaasPayoutProvider = require('../src/finance/providers/asaas/AsaasPayoutProvider');

  test('transfer auth test disabled by default', () => {
    const { isAsaasTransferAuthTestEnabled } = require('../src/finance/providers/asaas/asaas-config');
    if (isAsaasTransferAuthTestEnabled()) {
      throw new Error('ASAAS_TRANSFER_AUTH_TEST should be 0');
    }
  });

  await runAsync('inspect blocked when disabled', async () => {
    const result = await AsaasPayoutProvider.inspectSandboxTransfer('test-transfer-id');
    if (result.error !== 'ASAAS_TRANSFER_AUTH_HTTP_DISABLED') {
      throw new Error(`expected ASAAS_TRANSFER_AUTH_HTTP_DISABLED, got ${result.error}`);
    }
    if (result.financialEffect !== false) {
      throw new Error('financialEffect must be false');
    }
  });

  test('classify pending unauthorized transfer', () => {
    const status = AsaasPayoutProvider.classifyTransferAuthStatus({
      status: 'PENDING',
      authorized: false
    });
    if (status !== 'PENDING_REQUIRES_2FA') {
      throw new Error(`expected PENDING_REQUIRES_2FA, got ${status}`);
    }
  });

  test('classify done authorized transfer', () => {
    const status = AsaasPayoutProvider.classifyTransferAuthStatus({
      status: 'DONE',
      authorized: true
    });
    if (status !== 'AUTHORIZED_AND_DONE') {
      throw new Error(`expected AUTHORIZED_AND_DONE, got ${status}`);
    }
  });

  applyEnvironment({
    ASAAS_ENABLED: 'true',
    ALLOW_ASAAS_SANDBOX_AUTH: '1',
    ASAAS_ENV: 'sandbox',
    ASAAS_PIX_OUT_ENABLED: 'true',
    ALLOW_ASAAS_SANDBOX_PIX_OUT: '1',
    ASAAS_TRANSFER_AUTH_TEST: '1',
    ASAAS_API_KEY: 'aact_hmlg_verify_transfer_auth'
  });
  clearAsaasModuleCache(require);

  const { isAsaasTransferAuthHttpEnabled } = require('../src/finance/providers/asaas/asaas-config');
  test('transfer auth http gate enabled with flags', () => {
    if (!isAsaasTransferAuthHttpEnabled()) {
      throw new Error('transfer auth http should be enabled');
    }
  });

  test('no HTTP calls during verification', () => {
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
