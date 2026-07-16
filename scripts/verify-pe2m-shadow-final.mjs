'use strict';

/**
 * PE.2M — verify Shadow/Staging Final Certification (estrutural).
 * NÃO faz deploy. NÃO toca produção.
 *
 * node scripts/verify-pe2m-shadow-final.mjs
 *
 * Exit 0 = checks estruturais OK (staging runtime pode permanecer NOT_CERTIFIED).
 * Imprime STAGING_RUNTIME=… para o operador HITL.
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FLAG_SPECS = [
  {
    name: 'PE_ADAPTER_BOUNDARY_ENABLED',
    mod: '../src/payment-engine/boundary/adapter-boundary-config',
    fn: 'isAdapterBoundaryEnabled'
  },
  {
    name: 'PE_DEPOSIT_CLAIM_PORT_ENABLED',
    mod: '../src/payment-engine/boundary/deposit-claim-port-config',
    fn: 'isDepositClaimPortEnabled'
  },
  {
    name: 'PE_IDEMPOTENCY_PORT_ENABLED',
    mod: '../src/payment-engine/boundary/idempotency-port-config',
    fn: 'isIdempotencyPortEnabled'
  },
  {
    name: 'PE_WEBHOOK_STORE_PORT_ENABLED',
    mod: '../src/payment-engine/boundary/webhook-store-port-config',
    fn: 'isWebhookStorePortEnabled'
  },
  {
    name: 'PE_CORE_FINANCE_BOUNDARY_ENABLED',
    mod: '../src/payment-engine/boundary/core-finance-boundary-config',
    fn: 'isCoreFinanceBoundaryEnabled'
  },
  {
    name: 'PE_PAYOUT_BOUNDARY_ENABLED',
    mod: '../src/payment-engine/boundary/payout-boundary-config',
    fn: 'isPayoutBoundaryEnabled'
  },
  {
    name: 'PE_RUNTIME_BOUNDARY_ENABLED',
    mod: '../src/payment-engine/boundary/runtime-boundary-config',
    fn: 'isRuntimeBoundaryEnabled'
  },
  {
    name: 'PE_PROVIDER_BOUNDARY_ENABLED',
    mod: '../src/payment-engine/boundary/provider-boundary-config',
    fn: 'isProviderBoundaryEnabled'
  }
];

const RuntimeBoundary = require('../src/payment-engine/runtime/RuntimeBoundary');
const ProviderResolver = require('../src/payment-engine/providers/ProviderResolver');
const { PaymentEngine } = require('../src/payment-engine');

const prev = Object.fromEntries(FLAG_SPECS.map((s) => [s.name, process.env[s.name]]));
let failed = 0;
let stagingRuntimeCertified = false;

function restore() {
  for (const s of FLAG_SPECS) {
    if (prev[s.name] === undefined) delete process.env[s.name];
    else process.env[s.name] = prev[s.name];
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

await test('staging fly.toml isolation', async () => {
  const toml = fs.readFileSync(path.join(root, 'fly.staging.toml'), 'utf8');
  assert.match(toml, /goldeouro-backend-staging/);
  assert.equal(/goldeouro-backend-v2/.test(toml), false);
});

await test('staging workflow anti-prod guards', async () => {
  const wf = fs.readFileSync(
    path.join(root, '.github/workflows/backend-deploy-staging.yml'),
    'utf8'
  );
  assert.match(wf, /goldeouro-backend-staging/);
  assert.match(wf, /fly\.staging\.toml/);
  assert.match(wf, /PROD_APP_NAME:\s*goldeouro-backend-v2/);
  assert.ok(wf.includes('confirm'));
  assert.ok(wf.includes('STAGING'));
});

await test('eight PE flags default false', async () => {
  for (const s of FLAG_SPECS) {
    delete process.env[s.name];
    const mod = require(s.mod);
    assert.equal(mod.DEFAULT_VALUE, false, s.name);
    assert.equal(mod[s.fn](), false, s.name);
  }
});

await test('flag OFF preserves legacy modes', async () => {
  for (const s of FLAG_SPECS) delete process.env[s.name];
  assert.equal(RuntimeBoundary.inspect().mode, 'legacy_direct');
  assert.equal(ProviderResolver.inspect().mode, 'legacy_factory');
});

await test('flag ON activates ports/facade then OFF rolls back', async () => {
  process.env.PE_RUNTIME_BOUNDARY_ENABLED = 'true';
  process.env.PE_PROVIDER_BOUNDARY_ENABLED = 'true';
  assert.equal(RuntimeBoundary.inspect().mode, 'facade');
  assert.equal(ProviderResolver.inspect().mode, 'ports_adapters');
  process.env.PE_RUNTIME_BOUNDARY_ENABLED = 'false';
  process.env.PE_PROVIDER_BOUNDARY_ENABLED = 'false';
  assert.equal(RuntimeBoundary.inspect().mode, 'legacy_direct');
  assert.equal(ProviderResolver.inspect().mode, 'legacy_factory');
});

await test('ProviderResolver + fallback semantics PE.2L.1', async () => {
  const side = ProviderResolver.deriveResolutionSide({
    requestedProvider: 'asaas',
    effectiveProvider: 'mercadopago',
    legacyFallbackActive: true
  });
  assert.equal(side.fallbackApplied, true);
  assert.equal(typeof ProviderResolver.getResolutionMetadata, 'function');
});

await test('PaymentEngine facade pe2i–pe2l health', async () => {
  for (const s of FLAG_SPECS) delete process.env[s.name];
  PaymentEngine.configure({});
  const h = PaymentEngine.health();
  assert.equal(h.pe2i.coreFinanceBoundaryEnabled, false);
  assert.equal(h.pe2j.payoutBoundaryEnabled, false);
  assert.equal(h.pe2k.runtimeBoundaryEnabled, false);
  assert.equal(h.pe2l.providerBoundaryEnabled, false);
  assert.ok(h.pe2l.resolution);
});

await test('ports and adapters inventory', async () => {
  const pe = path.join(root, 'src/payment-engine');
  // PE.2M.1A: canônico PE.2G = IdempotencyStore.js (não *Port.js)
  for (const f of [
    'ports/DepositClaimPort.js',
    'ports/IdempotencyStore.js',
    'ports/WebhookStorePort.js',
    'ports/PaymentProviderPort.js',
    'ports/TransferProviderPort.js',
    'runtime/RuntimeBoundary.js',
    'providers/ProviderResolver.js',
    'adapters/psp/AsaasPaymentAdapter.js',
    'adapters/psp/MercadoPagoPaymentAdapter.js',
    'adapters/psp/CelcoinTransferAdapter.js',
    'adapters/psp/EfiAdapters.js',
    'adapters/goldeouro/GolDeOuroIdempotencyStore.js',
    'compat/idempotencyPortBridge.js'
  ]) {
    assert.ok(fs.existsSync(path.join(pe, f)), f);
  }
  const { ports } = require('../src/payment-engine');
  assert.ok(ports.IdempotencyStore, 'require ports.IdempotencyStore');
  assert.equal(fs.existsSync(path.join(pe, 'ports/IdempotencyStorePort.js')), false);
});

await test('no prod deploy command in staging workflow', async () => {
  const wf = fs.readFileSync(
    path.join(root, '.github/workflows/backend-deploy-staging.yml'),
    'utf8'
  );
  assert.equal(/fly deploy[^\n]*goldeouro-backend-v2/.test(wf), false);
});

await test('staging deploy evidence PB-05', async () => {
  const reportPath = path.join(root, 'docs/payment-engine/staging/deploy-report.json');
  assert.ok(fs.existsSync(reportPath));
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  stagingRuntimeCertified = report.deploy_executed === true;
  // Evidência honesta: ausência de deploy NÃO é falha de verify estrutural;
  // o gate PE.2M permanece NO-GO até HITL fechar PB-05.
  assert.equal(typeof report.deploy_executed, 'boolean');
  if (!stagingRuntimeCertified) {
    console.log('INFO staging deploy_executed=false — PB-05 aberto (esperado até HITL)');
  }
});

await test('deliverables PE.2M present', async () => {
  for (const rel of [
    'docs/payment-engine/staging-final/runtime-validation.json',
    'docs/payment-engine/staging-final/go-no-go.json',
    'docs/relatorios/PE.2M-SHADOW-STAGING-FINAL-CERTIFICATION.md'
  ]) {
    assert.ok(fs.existsSync(path.join(root, rel)), rel);
  }
});

restore();

console.log(`STAGING_RUNTIME=${stagingRuntimeCertified ? 'CERTIFIED' : 'NOT_CERTIFIED'}`);

if (failed) {
  console.error(`PE.2M verify: ${failed} FAIL`);
  process.exit(1);
}

console.log('PE.2M verify-pe2m-shadow-final: STRUCTURAL ALL OK');
if (!stagingRuntimeCertified) {
  console.log('PE.2M CERTIFICATION: NO-GO (staging shadow runtime not certified)');
} else {
  console.log('PE.2M CERTIFICATION: staging runtime evidence present — operator must confirm health');
}
