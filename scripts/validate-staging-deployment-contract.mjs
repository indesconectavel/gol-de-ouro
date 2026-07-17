#!/usr/bin/env node
'use strict';

/**
 * RE.9B.2R.4A / R7 — validação estática do contrato de deployment staging.
 * Somente leitura: não acessa Fly, banco, rede ou Git remoto.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(read(relativePath));

const manifest = readJson('docs/payment-engine/staging/release-manifest.json');
const workflow = read('.github/workflows/backend-deploy-staging.yml');
const a2r = read('.github/workflows/a2r-staging-asaas-sandbox.yml');
const flyStaging = read('fly.staging.toml');
const server = read('server-fly.js');
const dockerfile = read('Dockerfile');

assert.equal(manifest.authority?.canonical, true, 'manifest deve ser canônico');
assert.equal(manifest.authority?.operational, true, 'manifest deve ser operacional');
assert.equal(manifest.release?.frozen, true, 'release deve estar frozen');
assert.match(manifest.release?.tag || '', /^pe2m-shadow-staging-ready(-r\d+)?$/);
assert.match(manifest.release?.sha || '', /^[0-9a-f]{40}$/);
assert.equal(manifest.release.commit, manifest.release.sha, 'release.commit != release.sha');
assert.equal(manifest.artifact?.identity, manifest.release.sha, 'artifact.identity != release.sha');
assert.equal(manifest.target?.environment, 'staging');
assert.equal(manifest.target?.app, 'goldeouro-backend-staging');
assert.equal(manifest.target?.fly_config, 'fly.staging.toml');

for (const required of [
  'workflow_dispatch:',
  'release_tag:',
  'expected_sha:',
  'confirm_staging:',
  'dry_run:',
  'refs/tags/',
  'TAG_SHA',
  'EXPECTED_SHA',
  'steps.baseline.outputs.rollback_version',
  'actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5',
  'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
  'superfly/flyctl-actions/setup-flyctl@ed8efb33836e8b2096c7fd3ba1c8afe303ebbff1',
  "version: '0.4.71'",
  'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
  'flyctl image show',
  'deployed-artifact.json'
]) {
  assert.ok(workflow.includes(required), `workflow missing ${required}`);
}

assert.equal(/^\s+push:/m.test(workflow), false, 'workflow não pode ter trigger push');
assert.equal(workflow.includes('flyctl secrets set'), false, 'workflow não pode mutar secrets');
assert.ok(workflow.includes('goldeouro-backend-staging'), 'app staging ausente');
assert.ok(workflow.includes('fly.staging.toml'), 'config staging ausente');
assert.ok(workflow.includes("inputs.dry_run == false"), 'deploy deve estar condicionado a dry_run=false');
assert.ok(workflow.includes("NODE_VERSION: '20.20.2'"), 'Node CI deve estar fixado');
assert.ok(workflow.includes('runs-on: ubuntu-24.04'), 'runner deve evitar alias latest');
assert.equal(/uses:\s+\S+@(v\d+|master|main)\s*$/m.test(workflow), false, 'action mutável no deployer');

assert.equal(/flyctl|fly\s+deploy|secrets\./i.test(a2r), false, 'A2R deve permanecer estático');
assert.ok(
  a2r.includes('actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5'),
  'checkout A2R deve estar fixado'
);
assert.equal(/uses:\s+\S+@(v\d+|master|main)\s*$/m.test(a2r), false, 'action mutável no A2R');

assert.ok(
  dockerfile.includes(
    'FROM node:20.20.2-alpine3.22@sha256:8f47899606d000b0704e992f927fe7335adcd0d6c98851600072fb6e14a13e60'
  ),
  'imagem base deve estar fixada por digest OCI'
);
assert.ok(dockerfile.includes('RUN npm ci --omit=dev'), 'dependências devem usar npm ci');
assert.equal(/\bRUN npm install\b/.test(dockerfile), false, 'npm install não determinístico no Dockerfile');

for (const key of [
  'PE_ADAPTER_BOUNDARY_ENABLED',
  'PE_DEPOSIT_CLAIM_PORT_ENABLED',
  'PE_IDEMPOTENCY_PORT_ENABLED',
  'PE_WEBHOOK_STORE_PORT_ENABLED',
  'PE_CORE_FINANCE_BOUNDARY_ENABLED',
  'PE_PAYOUT_BOUNDARY_ENABLED',
  'PE_RUNTIME_BOUNDARY_ENABLED',
  'PE_PROVIDER_BOUNDARY_ENABLED',
  'MP_RECONCILE_ENABLED',
  'ASAAS_PAYOUT_RECOVERY_ENABLED',
  'ENABLE_PIX_PAYOUT_WORKER'
]) {
  assert.match(
    flyStaging,
    new RegExp(`^\\s*${key}\\s*=\\s*"false"\\s*$`, 'm'),
    `${key} deve estar false`
  );
}

assert.match(flyStaging, /^\s*app\s*=\s*"goldeouro-backend-staging"\s*$/m);
assert.equal(flyStaging.includes('goldeouro-backend-v2'), false);
assert.ok(server.includes('assertShadowRuntimeFailClosed()'));
assert.equal(/environment:\s*'production'/.test(server), false);
assert.ok(server.includes('financialSchedulers'));
assert.ok(server.includes('payoutWorkerEnabled'));

console.log('RE.9B.2R.4A deterministic staging artifact contract: STATIC PASS');
