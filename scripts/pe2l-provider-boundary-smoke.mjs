'use strict';

/**
 * PE.2L / PE.2L.1 — smoke Provider Boundary + fallback semantics (sem produção).
 * node scripts/pe2l-provider-boundary-smoke.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreDir = path.join(root, 'src/payment-engine/core');

const ProviderResolver = require('../src/payment-engine/providers/ProviderResolver');
const {
  isProviderBoundaryEnabled,
  FLAG_NAME,
  DEFAULT_VALUE
} = require('../src/payment-engine/boundary/provider-boundary-config');
const {
  AsaasPaymentAdapter,
  AsaasTransferAdapter,
  MercadoPagoPaymentAdapter,
  MercadoPagoTransferAdapter,
  CelcoinTransferAdapter,
  EfiTransferAdapter
} = require('../src/payment-engine/adapters/psp');
const { PaymentEngine } = require('../src/payment-engine');

const prev = process.env.PE_PROVIDER_BOUNDARY_ENABLED;
const prevMock = process.env.MOCK_FINANCE_ENABLED;
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

function restoreEnv() {
  for (const k of envKeys) {
    if (prevEnv[k] === undefined) delete process.env[k];
    else process.env[k] = prevEnv[k];
  }
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

try {
  delete process.env.PE_PROVIDER_BOUNDARY_ENABLED;
  assert.equal(DEFAULT_VALUE, false);
  assert.equal(FLAG_NAME, 'PE_PROVIDER_BOUNDARY_ENABLED');
  assert.equal(isProviderBoundaryEnabled(), false);
  assert.equal(ProviderResolver.inspect().mode, 'legacy_factory');

  // Core: zero PSP names in require paths / SDKs
  const forbidden = [
    /require\s*\(\s*['"][^'"]*mercadopago/i,
    /require\s*\(\s*['"][^'"]*asaas/i,
    /require\s*\(\s*['"][^'"]*pix-mercado-pago/,
    /require\s*\(\s*['"][^'"]*FinanceProviderFactory/
  ];
  for (const f of fs.readdirSync(coreDir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(coreDir, f), 'utf8');
    for (const re of forbidden) {
      assert.equal(re.test(src), false, `core/${f} forbidden ${re}`);
    }
  }

  // Adapters present
  assert.equal(AsaasPaymentAdapter.name, 'asaas');
  assert.equal(AsaasTransferAdapter.name, 'asaas');
  assert.equal(MercadoPagoPaymentAdapter.name, 'mercadopago');
  assert.equal(MercadoPagoTransferAdapter.name, 'mercadopago');
  assert.equal(CelcoinTransferAdapter.name, 'celcoin');
  assert.equal(EfiTransferAdapter.name, 'efi');

  // resolveByName
  assert.equal(ProviderResolver.resolveByName('payment', 'asaas').name, 'asaas');
  assert.equal(ProviderResolver.resolveByName('transfer', 'mercadopago').name, 'mercadopago');

  // Flag OFF resolve (uses factory; may pick MP or asaas by ENV — only check shape)
  process.env.MOCK_FINANCE_ENABLED = 'true';
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  ProviderResolver.resetProviderCache();
  const payOff = ProviderResolver.resolvePaymentProvider();
  const poutOff = ProviderResolver.resolvePayoutProvider();
  assert.ok(payOff && typeof payOff.isConfigured === 'function');
  assert.ok(poutOff && typeof poutOff.requestPixPayout === 'function');

  // Flag ON — adapters
  process.env.PE_PROVIDER_BOUNDARY_ENABLED = 'true';
  ProviderResolver.resetProviderCache();
  assert.equal(ProviderResolver.inspect().mode, 'ports_adapters');
  const payOn = ProviderResolver.resolvePaymentProvider();
  const poutOn = ProviderResolver.resolvePayoutProvider();
  assert.equal(typeof payOn.createPixDeposit, 'function');
  assert.equal(typeof poutOn.requestPixPayout, 'function');
  assert.ok(payOn.name);
  assert.ok(poutOn.name);

  PaymentEngine.configure({});
  const health = PaymentEngine.health();
  assert.equal(health.pe2l.providerBoundaryEnabled, true);
  assert.equal(typeof PaymentEngine.providers().inspect, 'function');
  assert.equal(typeof PaymentEngine.providers().resolution, 'function');
  assert.ok(health.pe2l.resolution);
  assert.ok(health.pe2l.resolution.payment);
  assert.ok(health.pe2l.resolution.payout);

  // providers/index must not export FinanceProviderFactory path string as direct public
  const providersSrc = fs.readFileSync(
    path.join(root, 'src/payment-engine/providers/index.js'),
    'utf8'
  );
  assert.ok(/ProviderResolver/.test(providersSrc));
  assert.equal(/FinanceProviderFactory/.test(providersSrc), false);

  // PE.2L.1 — adapter MP encapsula; comentário pode citar o legado, require direto é proibido
  const mpAdapter = fs.readFileSync(
    path.join(root, 'src/payment-engine/adapters/psp/MercadoPagoTransferAdapter.js'),
    'utf8'
  );
  assert.equal(
    /require\s*\(\s*['"][^'"]*pix-mercado-pago/.test(mpAdapter),
    false,
    'MercadoPagoTransferAdapter must not require services/pix-mercado-pago'
  );

  // ── PE.2L.1 — matriz semântica pura (sem alterar seleção produtiva) ──
  const matrix = [
    {
      requestedProvider: 'asaas',
      effectiveProvider: 'asaas',
      legacyFallbackActive: false,
      expectFallback: false,
      expectReason: null
    },
    {
      requestedProvider: 'asaas',
      effectiveProvider: 'mercadopago',
      legacyFallbackActive: true,
      expectFallback: true,
      expectReason: 'ASAAS_GATE_NOT_RESOLVABLE'
    },
    {
      requestedProvider: 'mercadopago',
      effectiveProvider: 'mercadopago',
      legacyFallbackActive: false,
      expectFallback: false,
      expectReason: null
    }
  ];
  for (const row of matrix) {
    const side = ProviderResolver.deriveResolutionSide(row);
    assert.equal(side.requestedProvider, row.requestedProvider);
    assert.equal(side.effectiveProvider, row.effectiveProvider);
    assert.equal(side.fallbackApplied, row.expectFallback);
    assert.equal(side.legacyFallbackApplied, row.expectFallback);
    assert.equal(side.fallbackReason, row.expectReason);
  }

  // Flag OFF preserva factory legada
  delete process.env.PE_PROVIDER_BOUNDARY_ENABLED;
  ProviderResolver.resetProviderCache();
  assert.equal(ProviderResolver.inspect().mode, 'legacy_factory');
  assert.equal(isProviderBoundaryEnabled(), false);

  // Integração: Asaas solicitado + gate bloqueado → MP + fallback=true
  withEnv(
    {
      NODE_ENV: 'test',
      MOCK_FINANCE_ENABLED: 'false',
      PAYMENT_PROVIDER: 'asaas',
      PAYOUT_PROVIDER: 'asaas',
      PRIMARY_PSP: 'asaas',
      ASAAS_ENABLED: 'false',
      ASAAS_PRODUCTION_ENABLED: 'false',
      ASAAS_TEST_LIVE: undefined,
      ASAAS_ENV: 'sandbox',
      PE_PROVIDER_BOUNDARY_ENABLED: undefined
    },
    () => {
      // explicit asaas + não resolvível → assertBoot deve falhar (comportamento homologado)
      assert.throws(() => ProviderResolver.assertBootConfig(), /PAYMENT_PROVIDER=asaas explicit/);
    }
  );

  // Sem PAYMENT_PROVIDER explícito: arquitetura asaas + gate off → MP com fallback (não silent se explícito)
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
      assert.equal(meta.boundaryEnabled, false);
      assert.equal(meta.boundaryMode, 'legacy_factory');
      assert.equal(meta.payment.requestedProvider, 'asaas');
      assert.equal(meta.payment.effectiveProvider, 'mercadopago');
      assert.equal(meta.payment.fallbackApplied, true);
      assert.equal(meta.payment.legacyFallbackApplied, true);
      assert.equal(meta.payment.fallbackReason, 'ASAAS_GATE_NOT_RESOLVABLE');
      assert.equal(meta.payout.requestedProvider, 'asaas');
      assert.equal(meta.payout.effectiveProvider, 'mercadopago');
      assert.equal(meta.payout.fallbackApplied, true);
    }
  );

  // Mercado Pago solicitado → efetivo MP, fallback=false
  withEnv(
    {
      NODE_ENV: 'test',
      MOCK_FINANCE_ENABLED: 'false',
      PAYMENT_PROVIDER: 'mercadopago',
      PAYOUT_PROVIDER: 'mercadopago',
      PRIMARY_PSP: 'asaas',
      ASAAS_ENABLED: 'false',
      ASAAS_PRODUCTION_ENABLED: 'false',
      ASAAS_TEST_LIVE: undefined,
      PE_PROVIDER_BOUNDARY_ENABLED: undefined
    },
    () => {
      const meta = ProviderResolver.getResolutionMetadata();
      assert.equal(meta.payment.requestedProvider, 'mercadopago');
      assert.equal(meta.payment.effectiveProvider, 'mercadopago');
      assert.equal(meta.payment.fallbackApplied, false);
      assert.equal(meta.payout.requestedProvider, 'mercadopago');
      assert.equal(meta.payout.effectiveProvider, 'mercadopago');
      assert.equal(meta.payout.fallbackApplied, false);
    }
  );

  // Provider desconhecido → comportamento definido (erro de boot), sem fallback silencioso
  withEnv(
    {
      NODE_ENV: 'test',
      MOCK_FINANCE_ENABLED: 'false',
      PAYMENT_PROVIDER: 'unknown_psp',
      PAYOUT_PROVIDER: 'mercadopago',
      ASAAS_PRODUCTION_ENABLED: 'false',
      PE_PROVIDER_BOUNDARY_ENABLED: undefined
    },
    () => {
      assert.throws(() => ProviderResolver.assertBootConfig(), /Unknown PAYMENT_PROVIDER/);
    }
  );

  // Flag true local: ports/adapters
  withEnv(
    {
      NODE_ENV: 'test',
      MOCK_FINANCE_ENABLED: 'true',
      PE_PROVIDER_BOUNDARY_ENABLED: 'true'
    },
    () => {
      assert.equal(ProviderResolver.inspect().mode, 'ports_adapters');
      const pay = ProviderResolver.resolvePaymentProvider();
      assert.ok(pay && pay.name);
    }
  );

  console.log('PE.2L provider-boundary smoke: PASS');
  console.log('PE.2L.1 fallback-semantics smoke: PASS');
} finally {
  restoreEnv();
  if (prev === undefined) delete process.env.PE_PROVIDER_BOUNDARY_ENABLED;
  else process.env.PE_PROVIDER_BOUNDARY_ENABLED = prev;
  if (prevMock === undefined) delete process.env.MOCK_FINANCE_ENABLED;
  else process.env.MOCK_FINANCE_ENABLED = prevMock;
}
