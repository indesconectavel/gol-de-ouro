#!/usr/bin/env node
'use strict';

/**
 * RE.9B.2R.3 / R6 — verificador determinístico do freeze.
 * Somente leitura: não escreve manifest, não cria tag, não faz push/deploy.
 */

import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = 'docs/payment-engine/staging/release-manifest.json';
const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestPath), 'utf8'));

const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const branch = git('branch', '--show-current');
const head = git('rev-parse', 'HEAD');
const status = git('status', '--porcelain');
const tag = manifest.release?.tag;
const expectedSha = manifest.release?.sha;
const expectedBranch = manifest.release?.branch;

assert.equal(manifest.authority?.canonical, true, 'manifest não canônico');
assert.equal(manifest.authority?.operational, true, 'manifest sem autoridade operacional');
assert.equal(manifest.release?.frozen, true, 'release.frozen deve ser true');
assert.match(tag || '', /^pe2m-shadow-staging-ready(-r\d+)?$/, 'tag staging inválida');
assert.match(expectedSha || '', /^[0-9a-f]{40}$/, 'release.sha inválido');
assert.equal(manifest.release?.commit, expectedSha, 'release.commit != release.sha');
assert.equal(manifest.artifact?.identity, expectedSha, 'artifact.identity != release.sha');
assert.equal(manifest.target?.environment, 'staging');
assert.equal(manifest.target?.app, 'goldeouro-backend-staging');
assert.equal(manifest.target?.fly_config, 'fly.staging.toml');
assert.equal(branch, expectedBranch, `branch deve ser ${expectedBranch}`);
assert.equal(head, expectedSha, 'HEAD diverge do manifest');
assert.equal(status, '', 'working tree deve estar limpa');

const required = [
  '.github/workflows/backend-deploy-staging.yml',
  '.github/workflows/a2r-staging-asaas-sandbox.yml',
  'fly.staging.toml',
  'Dockerfile',
  'server-fly.js',
  'scripts/validate-staging-deployment-contract.mjs',
  'scripts/pe2b-staging-pipeline-validate.mjs',
  'scripts/pe2m-shadow-final-smoke.mjs',
  'scripts/verify-pe2m-shadow-final.mjs'
];
for (const relativePath of required) {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `missing ${relativePath}`);
}

const flyStaging = fs.readFileSync(path.join(root, 'fly.staging.toml'), 'utf8');
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
  assert.ok(flyStaging.includes(`${key} = "false"`), `${key} deve estar false`);
}

const workflow = fs.readFileSync(
  path.join(root, '.github/workflows/backend-deploy-staging.yml'),
  'utf8'
);
for (const input of ['release_tag:', 'expected_sha:', 'confirm_staging:', 'dry_run:']) {
  assert.ok(workflow.includes(input), `workflow missing ${input}`);
}
assert.equal(workflow.includes('flyctl secrets set'), false, 'workflow muta secrets');

let localTagSha = null;
try {
  localTagSha = git('rev-parse', `refs/tags/${tag}^{commit}`);
} catch {
  // A ausência local é permitida antes da publicação HITL.
}
if (localTagSha !== null) {
  assert.equal(localTagSha, expectedSha, 'tag local diverge do manifest');
}

console.log(`branch=${branch}`);
console.log(`sha=${head}`);
console.log(`tag=${tag}`);
console.log(`tag_local=${localTagSha === null ? 'ABSENT_PENDING_HITL' : localTagSha}`);
console.log('RE.9B deterministic release freeze contract: PASS');
console.log('NEXT HITL (não executado):');
if (localTagSha === null) {
  console.log(`  git tag -a ${tag} -m "Deterministic shadow staging release" ${expectedSha}`);
}
console.log(`  git push origin ${expectedBranch}`);
console.log(`  git push origin refs/tags/${tag}`);
