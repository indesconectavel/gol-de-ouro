'use strict';

/**
 * PE.2M.2A — Freeze helper (HITL local).
 * NÃO faz deploy. NÃO toca Fly/produção.
 *
 * Após commit único da RC na branch pe/pe2b-staging-deploy:
 *   node scripts/pe2m2a-release-freeze.mjs
 *
 * Depois (HITL):
 *   git tag -a pe2m-shadow-staging-ready -m "PE.2M shadow staging ready" <SHA>
 *   git push origin pe/pe2b-staging-deploy pe2m-shadow-staging-ready
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAG = 'pe2m-shadow-staging-ready';
const BRANCH = 'pe/pe2b-staging-deploy';

const REQUIRED = [
  'src/payment-engine/ports/IdempotencyStore.js',
  'src/payment-engine/ports/DepositClaimPort.js',
  'src/payment-engine/ports/WebhookStorePort.js',
  'src/payment-engine/providers/ProviderResolver.js',
  'src/payment-engine/runtime/RuntimeBoundary.js',
  'scripts/pe2m-shadow-final-smoke.mjs',
  'scripts/verify-pe2m-shadow-final.mjs',
  '.github/workflows/backend-deploy-staging.yml',
  'fly.staging.toml',
  'docs/payment-engine/staging/release-manifest.json'
];

function sh(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
}

const branch = sh('git branch --show-current');
const sha = sh('git rev-parse HEAD');
const dirty = sh('git status --porcelain');

console.log(`branch=${branch}`);
console.log(`sha=${sha}`);

if (branch !== BRANCH) {
  console.error(`FAIL: branch deve ser ${BRANCH}`);
  process.exit(1);
}

if (dirty) {
  console.error('FAIL: working tree suja — commitar somente escopo PE.2E–PE.2M antes do freeze');
  console.error(dirty.split('\n').slice(0, 40).join('\n'));
  process.exit(1);
}

for (const rel of REQUIRED) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`FAIL: missing ${rel}`);
    process.exit(1);
  }
}

const wf = fs.readFileSync(path.join(root, '.github/workflows/backend-deploy-staging.yml'), 'utf8');
for (const flag of [
  'PE_ADAPTER_BOUNDARY_ENABLED=false',
  'PE_DEPOSIT_CLAIM_PORT_ENABLED=false',
  'PE_IDEMPOTENCY_PORT_ENABLED=false',
  'PE_WEBHOOK_STORE_PORT_ENABLED=false',
  'PE_CORE_FINANCE_BOUNDARY_ENABLED=false',
  'PE_PAYOUT_BOUNDARY_ENABLED=false',
  'PE_RUNTIME_BOUNDARY_ENABLED=false',
  'PE_PROVIDER_BOUNDARY_ENABLED=false'
]) {
  if (!wf.includes(flag)) {
    console.error(`FAIL: workflow missing explicit ${flag}`);
    process.exit(1);
  }
}
if (!wf.includes(`RELEASE_REF: ${TAG}`)) {
  console.error(`FAIL: workflow RELEASE_REF must be ${TAG}`);
  process.exit(1);
}

const manifestPaths = [
  'docs/payment-engine/staging/release-manifest.json',
  'docs/payment-engine/staging-final/release-manifest.json'
];

const releaseBlock = {
  tag: TAG,
  sha,
  frozen: true,
  payload_sha: sha,
  release_commit: sha,
  release_branch: BRANCH,
  release_version: TAG,
  release_date: new Date().toISOString().slice(0, 10),
  git_tag: TAG,
  branch_source: BRANCH,
  series: ['PE.2E', 'PE.2F', 'PE.2G', 'PE.2H', 'PE.2I', 'PE.2J', 'PE.2K', 'PE.2L', 'PE.2L.1', 'PE.2M'],
  technical_anchor_tag: 'pe2b-adapter-boundary-safe',
  technical_anchor_sha: '73bca758789ad6ba23561f9f5695abb2b20a3a9d',
  supersedes_branch_head: 'a651de6563b09025adec91ceb84dfa7933088a48',
  freeze_note: 'PE.2M.2A freeze — pe2m-shadow-staging-ready'
};

for (const rel of manifestPaths) {
  const full = path.join(root, rel);
  let doc = {};
  if (fs.existsSync(full)) {
    doc = JSON.parse(fs.readFileSync(full, 'utf8'));
  }
  doc.gate = 'PE.2M.2A';
  doc.title = 'Release determinística — shadow staging PE.2E–PE.2M';
  doc.date = releaseBlock.release_date;
  doc.release = { ...(doc.release || {}), ...releaseBlock };
  doc.deploy = {
    release_ref: TAG,
    git_tag_meta: TAG,
    fly_app: 'goldeouro-backend-staging',
    fly_config: 'fly.staging.toml',
    confirm_token: 'STAGING',
    eight_pe_flags: false
  };
  doc.immutability = {
    override_release_ref_allowed: false,
    override_git_tag_allowed: false,
    checkout_must_match_manifest_sha: true
  };
  fs.writeFileSync(full, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`updated ${rel}`);
}

console.log('');
console.log('PE.2M.2A freeze manifests pinned.');
console.log('NEXT HITL (não executado por este script):');
console.log(`  git add docs/payment-engine/staging/release-manifest.json docs/payment-engine/staging-final/release-manifest.json`);
console.log(`  git commit -m "chore(staging): pin pe2m-shadow-staging-ready @ ${sha.slice(0, 12)}"`);
console.log(`  # Re-run this script after the pin commit OR manually set SHA to that commit`);
console.log(`  git tag -a ${TAG} -m "PE.2M shadow staging ready" ${sha}`);
console.log(`  git push origin ${BRANCH} ${TAG}`);
console.log('');
console.log('NOTE: Ideal flow is commit RC → run freeze → amend/pin commit with frozen manifests → tag that commit.');
