'use strict';

/**
 * PE.2L / PE.2L.1 — verify Provider Boundary + fallback semantics.
 * node scripts/verify-pe2l-provider-boundary.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreDir = path.join(root, 'src/payment-engine/core');
const peRoot = path.join(root, 'src/payment-engine');

const ProviderResolver = require('../src/payment-engine/providers/ProviderResolver');
const { DEFAULT_VALUE } = require('../src/payment-engine/boundary/provider-boundary-config');
const { PaymentEngine } = require('../src/payment-engine');

const prev = process.env.PE_PROVIDER_BOUNDARY_ENABLED;
const envKeys = [
  'PE_PROVIDER_BOUNDARY_ENABLED',
  'MOCK_FINANCE_ENABLED',
  'PAYMENT_PROVIDER',
  'PAYOUT_PROVIDER',
  'PRIMARY_PSP',
  'ASAAS_ENABLED',
  'ASAAS_PRODUCTION_ENABLED',
  'ASAAS_TEST_LIVE',
  'ASAAS_ENV',
  'NODE_ENV'
];
const prevEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
let failed = 0;

function restoreEnv() {
  for (const k of envKeys) {
    if (prevEnv[k] === undefined) delete process.env[k];
    else process.env[k] = prevEnv[k];
  }
  if (prev === undefined) delete process.env.PE_PROVIDER_BOUNDARY_ENABLED;
  else process.env.PE_PROVIDER_BOUNDARY_ENABLED = prev;
  try {
    ProviderResolver.resetProviderCache();
  } catch (_) {
    /* ignore */
  }
}

function withEnv(overrides, fn) {
  const keys = Object.keys(overrides);
  const snap = {};
  for (const k of keys) {
    snap[k] = process.env[k];
    if (overrides[k] === undefined) delete process.env[k];
    else process.env[k] = overrides[k];
  }
  try {
    ProviderResolver.resetProviderCache();
    return fn();
  } finally {
    for (const k of keys) {
      if (snap[k] === undefined) delete process.env[k];
      else process.env[k] = snap[k];
    }
    ProviderResolver.resetProviderCache();
  }
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`OK ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}:`, err.message);
  }
}

await test('flag default false', async () => {
  delete process.env.PE_PROVIDER_BOUNDARY_ENABLED;
  assert.equal(DEFAULT_VALUE, false);
  assert.equal(ProviderResolver.inspect().mode, 'legacy_factory');
});

await test('core zero PSP/SDK requires', async () => {
  for (const f of fs.readdirSync(coreDir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(coreDir, f), 'utf8');
    assert.equal(/require\(['"][^'"]*asaas/i.test(src), false, f);
    assert.equal(/require\(['"][^'"]*mercadopago/i.test(src), false, f);
    assert.equal(/require\(['"][^'"]*pix-mercado-pago/.test(src), false, f);
    assert.equal(/FinanceProviderFactory/.test(src), false, f);
  }
});

await test('compat ON adapters mode', async () => {
  process.env.PE_PROVIDER_BOUNDARY_ENABLED = 'true';
  assert.equal(ProviderResolver.inspect().mode, 'ports_adapters');
  assert.ok(ProviderResolver.inspect().registeredPayment.includes('asaas'));
  assert.ok(ProviderResolver.inspect().registeredTransfer.includes('mercadopago'));
});

await test('ports exist', async () => {
  assert.ok(fs.existsSync(path.join(peRoot, 'ports/PaymentProviderPort.js')));
  assert.ok(fs.existsSync(path.join(peRoot, 'ports/TransferProviderPort.js')));
});

await test('adapters consolidated', async () => {
  for (const f of [
    'AsaasPaymentAdapter.js',
    'AsaasTransferAdapter.js',
    'MercadoPagoPaymentAdapter.js',
    'MercadoPagoTransferAdapter.js',
    'CelcoinTransferAdapter.js',
    'EfiAdapters.js'
  ]) {
    assert.ok(fs.existsSync(path.join(peRoot, 'adapters/psp', f)), f);
  }
});

await test('worker still no finance factory', async () => {
  const src = fs.readFileSync(path.join(root, 'src/workers/payout-worker.js'), 'utf8');
  assert.equal(/FinanceProviderFactory/.test(src), false);
  assert.equal(/require\(['"][^'"]*pix-mercado-pago/.test(src), false);
});

await test('providers surface via ProviderResolver', async () => {
  const src = fs.readFileSync(path.join(peRoot, 'providers/index.js'), 'utf8');
  assert.ok(/ProviderResolver/.test(src));
  assert.equal(/FinanceProviderFactory/.test(src), false);
  assert.ok(/getResolutionMetadata/.test(src));
});

await test('facade pe2l', async () => {
  process.env.PE_PROVIDER_BOUNDARY_ENABLED = 'true';
  PaymentEngine.configure({});
  assert.equal(PaymentEngine.health().pe2l.providerBoundaryEnabled, true);
  assert.ok(PaymentEngine.health().pe2l.resolution);
});

await test('efi stub throws', async () => {
  const { EfiTransferAdapter } = require('../src/payment-engine/adapters/psp');
  await assert.rejects(() => EfiTransferAdapter.requestPixPayout({}), /not implemented/);
});

await test('PE.2L.1 MP adapter no direct pix-mercado-pago require', async () => {
  const src = fs.readFileSync(
    path.join(peRoot, 'adapters/psp/MercadoPagoTransferAdapter.js'),
    'utf8'
  );
  assert.equal(/require\s*\(\s*['"][^'"]*pix-mercado-pago/.test(src), false);
});

await test('PE.2L.1 deriveResolutionSide matrix', async () => {
  const authorized = ProviderResolver.deriveResolutionSide({
    requestedProvider: 'asaas',
    effectiveProvider: 'asaas',
    legacyFallbackActive: false
  });
  assert.equal(authorized.fallbackApplied, false);
  assert.equal(authorized.legacyFallbackApplied, false);
  assert.equal(authorized.fallbackReason, null);

  const gated = ProviderResolver.deriveResolutionSide({
    requestedProvider: 'asaas',
    effectiveProvider: 'mercadopago',
    legacyFallbackActive: true
  });
  assert.equal(gated.fallbackApplied, true);
  assert.equal(gated.legacyFallbackApplied, true);
  assert.equal(gated.fallbackReason, 'ASAAS_GATE_NOT_RESOLVABLE');

  const mp = ProviderResolver.deriveResolutionSide({
    requestedProvider: 'mercadopago',
    effectiveProvider: 'mercadopago',
    legacyFallbackActive: false
  });
  assert.equal(mp.fallbackApplied, false);
});

await test('PE.2L.1 asaas gate blocked → MP fallback true', async () => {
  withEnv(
    {
      NODE_ENV: 'test',
      MOCK_FINANCE_ENABLED: 'false',
      PAYMENT_PROVIDER: undefined,
      PAYOUT_PROVIDER: undefined,
      PRIMARY_PSP: 'asaas',
      ASAAS_ENABLED: 'false',
      ASAAS_PRODUCTION_ENABLED: 'false',
      ASAAS_TEST_LIVE: undefined,
      ASAAS_ENV: 'sandbox',
      PE_PROVIDER_BOUNDARY_ENABLED: undefined
    },
    () => {
      const meta = ProviderResolver.getResolutionMetadata();
      assert.equal(meta.payment.requestedProvider, 'asaas');
      assert.equal(meta.payment.effectiveProvider, 'mercadopago');
      assert.equal(meta.payment.fallbackApplied, true);
      assert.equal(meta.payout.effectiveProvider, 'mercadopago');
      assert.equal(meta.payout.fallbackApplied, true);
    }
  );
});

await test('PE.2L.1 mercadopago requested → fallback false', async () => {
  withEnv(
    {
      NODE_ENV: 'test',
      MOCK_FINANCE_ENABLED: 'false',
      PAYMENT_PROVIDER: 'mercadopago',
      PAYOUT_PROVIDER: 'mercadopago',
      ASAAS_ENABLED: 'false',
      ASAAS_PRODUCTION_ENABLED: 'false',
      PE_PROVIDER_BOUNDARY_ENABLED: undefined
    },
    () => {
      const meta = ProviderResolver.getResolutionMetadata();
      assert.equal(meta.payment.requestedProvider, 'mercadopago');
      assert.equal(meta.payment.effectiveProvider, 'mercadopago');
      assert.equal(meta.payment.fallbackApplied, false);
      assert.equal(meta.payout.fallbackApplied, false);
    }
  );
});

await test('PE.2L.1 unknown provider no silent fallback', async () => {
  withEnv(
    {
      NODE_ENV: 'test',
      MOCK_FINANCE_ENABLED: 'false',
      PAYMENT_PROVIDER: 'unknown_psp',
      PAYOUT_PROVIDER: 'mercadopago',
      PE_PROVIDER_BOUNDARY_ENABLED: undefined
    },
    () => {
      assert.throws(() => ProviderResolver.assertBootConfig(), /Unknown PAYMENT_PROVIDER/);
    }
  );
});

restoreEnv();

if (failed) {
  console.error(`PE.2L verify: ${failed} FAIL`);
  process.exit(1);
}
console.log('PE.2L verify-pe2l-provider-boundary: ALL OK');
console.log('PE.2L.1 fallback-semantics verify: ALL OK');
