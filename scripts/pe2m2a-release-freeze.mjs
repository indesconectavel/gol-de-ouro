#!/usr/bin/env node
'use strict';

/**
 * RE.9B.2R.4B.2A — verificador determinístico da Release Identity schema 2.0.
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
const parent = git('rev-parse', 'HEAD^');
const status = git('status', '--porcelain');
const tag = manifest.release?.tag;
const payloadSha = manifest.release?.payload_sha;
const expectedBranch = manifest.release?.branch;
const historicalTag = 'pe2m-shadow-staging-ready';
const historicalSha = '8cb00e9a576b6a5b2c784615cc5a55b26492c112';

assert.equal(manifest.authority?.canonical, true, 'manifest não canônico');
assert.equal(manifest.authority?.operational, true, 'manifest sem autoridade operacional');
assert.equal(manifest.schema_version, '2.0.0', 'schema_version deve ser 2.0.0');
assert.equal(manifest.release?.frozen, true, 'release.frozen deve ser true');
assert.equal(tag, 'pe2m-shadow-staging-ready-r1', 'tag revisionada inválida');
assert.match(payloadSha || '', /^[0-9a-f]{40}$/, 'release.payload_sha inválido');
assert.equal(payloadSha, '8c7076356b4b968f40c6bfb6241364176021fb07');
assert.equal(manifest.release?.identity_resolver, 'git_tag_peeled');
assert.equal(Object.hasOwn(manifest.release, 'sha'), false, 'release.sha legado proibido');
assert.equal(Object.hasOwn(manifest.release, 'commit'), false, 'release.commit legado proibido');
assert.equal(Object.hasOwn(manifest.artifact, 'identity'), false, 'artifact.identity legado proibido');
assert.equal(manifest.artifact?.source_payload_sha, payloadSha);
assert.equal(manifest.target?.environment, 'staging');
assert.equal(manifest.target?.app, 'goldeouro-backend-staging');
assert.equal(manifest.target?.fly_config, 'fly.staging.toml');
assert.equal(branch, expectedBranch, `branch deve ser ${expectedBranch}`);
assert.equal(parent, payloadSha, 'parent(HEAD) diverge do payload técnico');
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
for (const input of [
  'release_tag:',
  'expected_payload_sha:',
  'expected_identity_sha:',
  'confirm_environment:',
  'dry_run:'
]) {
  assert.ok(workflow.includes(input), `workflow missing ${input}`);
}
assert.equal(workflow.includes('flyctl secrets set'), false, 'workflow muta secrets');
assert.equal(workflow.includes('expected_sha:'), false, 'workflow contém expected_sha legado');
assert.equal(workflow.includes('steps.release.outputs.sha'), false, 'workflow contém output sha genérico');

let localTagSha = null;
try {
  localTagSha = git('rev-parse', `refs/tags/${tag}^{commit}`);
} catch {
  // A ausência local é permitida antes da publicação HITL.
}
if (localTagSha !== null) {
  assert.equal(localTagSha, head, 'peeled tag local diverge do identity commit');
  const tagObjectType = git('cat-file', '-t', `refs/tags/${tag}`);
  assert.equal(tagObjectType, 'tag', 'tag candidata deve ser anotada (não lightweight)');
}

const historicalTagSha = git('rev-parse', `refs/tags/${historicalTag}^{commit}`);
assert.equal(historicalTagSha, historicalSha, 'tag histórica foi movida');

console.log(`branch=${branch}`);
console.log(`identity_commit=${head}`);
console.log(`payload_sha=${payloadSha}`);
console.log(`parent=${parent}`);
console.log(`release_tag=${tag}`);
console.log(`tag_local=${localTagSha === null ? 'ABSENT_PENDING_HITL' : localTagSha}`);
console.log(`historical_tag=${historicalTag}@${historicalTagSha}`);
console.log(
  `RE.9B Release Identity schema 2.0: ${localTagSha === null ? 'PRE_TAG PASS' : 'POST_TAG PASS'}`
);
