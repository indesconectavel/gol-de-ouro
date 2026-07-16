'use strict';

/**
 * PE.2M — Shadow/Staging Final Certification smoke (estrutural + flags).
 * NÃO faz deploy. NÃO toca produção. NÃO muta saldo/PIX/ledger.
 *
 * node scripts/pe2m-shadow-final-smoke.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FLAG_MODULES = [
  ['PE_ADAPTER_BOUNDARY_ENABLED', '../src/payment-engine/boundary/adapter-boundary-config', 'isAdapterBoundaryEnabled'],
  ['PE_DEPOSIT_CLAIM_PORT_ENABLED', '../src/payment-engine/boundary/deposit-claim-port-config', 'isDepositClaimPortEnabled'],
  ['PE_IDEMPOTENCY_PORT_ENABLED', '../src/payment-engine/boundary/idempotency-port-config', 'isIdempotencyPortEnabled'],
  ['PE_WEBHOOK_STORE_PORT_ENABLED', '../src/payment-engine/boundary/webhook-store-port-config', 'isWebhookStorePortEnabled'],
  ['PE_CORE_FINANCE_BOUNDARY_ENABLED', '../src/payment-engine/boundary/core-finance-boundary-config', 'isCoreFinanceBoundaryEnabled'],
  ['PE_PAYOUT_BOUNDARY_ENABLED', '../src/payment-engine/boundary/payout-boundary-config', 'isPayoutBoundaryEnabled'],
  ['PE_RUNTIME_BOUNDARY_ENABLED', '../src/payment-engine/boundary/runtime-boundary-config', 'isRuntimeBoundaryEnabled'],
  ['PE_PROVIDER_BOUNDARY_ENABLED', '../src/payment-engine/boundary/provider-boundary-config', 'isProviderBoundaryEnabled']
];

const RuntimeBoundary = require('../src/payment-engine/runtime/RuntimeBoundary');
const ProviderResolver = require('../src/payment-engine/providers/ProviderResolver');
const { PaymentEngine } = require('../src/payment-engine');
const { resolveFinanceSurface } = require('../src/payment-engine/boundary/resolveFinanceSurface');

const flagPrev = Object.fromEntries(FLAG_MODULES.map(([name]) => [name, process.env[name]]));

function restoreFlags() {
  for (const [name] of FLAG_MODULES) {
    if (flagPrev[name] === undefined) delete process.env[name];
    else process.env[name] = flagPrev[name];
  }
  try {
    ProviderResolver.resetProviderCache();
  } catch (_) {
    /* ignore */
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function readJson(rel) {
  return JSON.parse(read(rel));
}

try {
  // ── Isolamento staging vs produção ──
  const stagingToml = read('fly.staging.toml');
  assert.match(stagingToml, /app\s*=\s*"goldeouro-backend-staging"/);
  assert.equal(/goldeouro-backend-v2/.test(stagingToml), false);
  assert.match(stagingToml, /NODE_ENV\s*=\s*"staging"/);

  const wf = read('.github/workflows/backend-deploy-staging.yml');
  assert.match(wf, /FLY_APP_NAME:\s*goldeouro-backend-staging/);
  assert.match(wf, /PROD_APP_NAME:\s*goldeouro-backend-v2/);
  assert.match(wf, /FLY_CONFIG:\s*fly\.staging\.toml/);
  assert.match(wf, /confirm.*STAGING/s);
  assert.equal(/fly deploy --app goldeouro-backend-v2/.test(wf), false);

  // ── Oito flags: default false + OFF ──
  for (const [flagName, modPath, fnName] of FLAG_MODULES) {
    delete process.env[flagName];
    const mod = require(modPath);
    assert.equal(mod.DEFAULT_VALUE, false, `${flagName} DEFAULT_VALUE`);
    assert.equal(mod.FLAG_NAME, flagName);
    assert.equal(mod[fnName](), false, `${flagName} OFF when unset`);
  }

  assert.equal(RuntimeBoundary.inspect().mode, 'legacy_direct');
  assert.equal(ProviderResolver.inspect().mode, 'legacy_factory');
  assert.equal(resolveFinanceSurface().mode, 'legacy_direct');

  // ── Rollback imediato: ON → OFF restaura legado ──
  process.env.PE_RUNTIME_BOUNDARY_ENABLED = 'true';
  process.env.PE_PROVIDER_BOUNDARY_ENABLED = 'true';
  process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED = 'true';
  assert.equal(RuntimeBoundary.inspect().mode, 'facade');
  assert.equal(ProviderResolver.inspect().mode, 'ports_adapters');
  assert.equal(resolveFinanceSurface().mode, 'core_bridge');

  process.env.PE_RUNTIME_BOUNDARY_ENABLED = 'false';
  process.env.PE_PROVIDER_BOUNDARY_ENABLED = 'false';
  process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED = 'false';
  assert.equal(RuntimeBoundary.inspect().mode, 'legacy_direct');
  assert.equal(ProviderResolver.inspect().mode, 'legacy_factory');
  assert.equal(resolveFinanceSurface().mode, 'legacy_direct');

  // ── Superfícies PE.2E–PE.2L presentes ──
  // PE.2M.1A: contrato canônico PE.2G = IdempotencyStore.js (não IdempotencyStorePort.js)
  const surfaces = [
    'src/payment-engine/ports/PaymentProviderPort.js',
    'src/payment-engine/ports/TransferProviderPort.js',
    'src/payment-engine/ports/DepositClaimPort.js',
    'src/payment-engine/ports/IdempotencyStore.js',
    'src/payment-engine/ports/WebhookStorePort.js',
    'src/payment-engine/providers/ProviderResolver.js',
    'src/payment-engine/runtime/RuntimeBoundary.js',
    'src/payment-engine/api/PaymentEngine.js',
    'src/payment-engine/adapters/psp/MercadoPagoTransferAdapter.js',
    'src/payment-engine/adapters/psp/AsaasPaymentAdapter.js'
  ];
  for (const rel of surfaces) {
    assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
  }
  const idempotencyPort = require('../src/payment-engine/ports/IdempotencyStore');
  assert.ok(idempotencyPort, 'IdempotencyStore port must be require-loadable');
  const pePorts = require('../src/payment-engine').ports;
  assert.ok(pePorts.IdempotencyStore, 'barrel ports.IdempotencyStore');
  assert.equal(
    fs.existsSync(path.join(root, 'src/payment-engine/ports/IdempotencyStorePort.js')),
    false,
    'must not invent duplicate IdempotencyStorePort.js'
  );

  // ── ProviderResolver + PE.2L.1 semantics ──
  const gated = ProviderResolver.deriveResolutionSide({
    requestedProvider: 'asaas',
    effectiveProvider: 'mercadopago',
    legacyFallbackActive: true
  });
  assert.equal(gated.fallbackApplied, true);
  assert.equal(gated.legacyFallbackApplied, true);

  delete process.env.PE_PROVIDER_BOUNDARY_ENABLED;
  PaymentEngine.configure({});
  const health = PaymentEngine.health();
  assert.equal(health.pe2l.providerBoundaryEnabled, false);
  assert.ok(health.pe2l.resolution);
  assert.equal(typeof PaymentEngine.providers().resolution, 'function');

  // ── Worker/scheduler ainda via RuntimeBoundary (PE.2K) ──
  const worker = read('src/workers/payout-worker.js');
  assert.ok(/RuntimeBoundary/.test(worker));
  assert.equal(/FinanceProviderFactory/.test(worker), false);

  // ── Evidência staging histórico (PB-05) — não falha smoke estrutural ──
  const deployReport = readJson('docs/payment-engine/staging/deploy-report.json');
  const stagingRuntimeCertified = deployReport.deploy_executed === true;
  if (!stagingRuntimeCertified) {
    console.warn(
      'PE.2M WARN: staging shadow deploy ainda NÃO executado (PB-05). Smoke estrutural OK; certificação runtime BLOCKED.'
    );
  }

  console.log('PE.2M shadow-final smoke: STRUCTURAL PASS');
  console.log(
    `PE.2M staging_runtime_certified=${stagingRuntimeCertified ? 'YES' : 'NO'}`
  );
  if (!stagingRuntimeCertified) {
    console.log('PE.2M gate implication: NO-GO until HITL staging deploy + post-deploy health');
  }
} finally {
  restoreFlags();
}
