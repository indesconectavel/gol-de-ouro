'use strict';



/**

 * RE.9B.2R.4B.2A — validação local da Release Identity schema 2.0.

 * Executar: node scripts/pe2b-staging-pipeline-validate.mjs

 */



import assert from 'node:assert/strict';

import { readFileSync, existsSync } from 'node:fs';

import { fileURLToPath } from 'node:url';

import { dirname, join } from 'node:path';



const __dirname = dirname(fileURLToPath(import.meta.url));

const ROOT = join(__dirname, '..');



const MANIFEST = JSON.parse(

  readFileSync(join(ROOT, 'docs/payment-engine/staging/release-manifest.json'), 'utf8')

);

const WORKFLOW_PATH = join(ROOT, '.github/workflows/backend-deploy-staging.yml');

const FLY_STAGING = join(ROOT, 'fly.staging.toml');



function fail(msg) {

  console.error(`[PE.2B.2-PIPELINE.2] FAIL: ${msg}`);

  process.exit(1);

}



function pass(msg) {

  console.log(`[PE.2B.2-PIPELINE.2] OK: ${msg}`);

}



if (!existsSync(WORKFLOW_PATH)) fail('backend-deploy-staging.yml ausente');

if (!existsSync(FLY_STAGING)) fail('fly.staging.toml ausente');



const workflow = readFileSync(WORKFLOW_PATH, 'utf8');

const flyStaging = readFileSync(FLY_STAGING, 'utf8');



const tag = MANIFEST.release.tag;

const payloadSha = MANIFEST.release.payload_sha;

assert.equal(MANIFEST.schema_version, '2.0.0', 'manifest deve usar schema 2.0.0');
assert.match(payloadSha || '', /^[0-9a-f]{40}$/, 'manifest deve conter payload SHA completo');
assert.equal(payloadSha, '8c7076356b4b968f40c6bfb6241364176021fb07');
assert.equal(MANIFEST.release.identity_resolver, 'git_tag_peeled');
assert.equal(Object.hasOwn(MANIFEST.release, 'sha'), false, 'release.sha legado proibido');
assert.equal(Object.hasOwn(MANIFEST.release, 'commit'), false, 'release.commit legado proibido');
assert.equal(Object.hasOwn(MANIFEST.artifact, 'identity'), false, 'artifact.identity legado proibido');



// B-02: release unificada

for (const input of [
  'release_tag:',
  'expected_payload_sha:',
  'expected_identity_sha:',
  'confirm_environment:',
  'dry_run:'
]) {
  assert.ok(workflow.includes(input), `workflow deve declarar input ${input}`);
}

assert.ok(workflow.includes('RELEASE_REF: ${{ inputs.release_tag }}'),
  'workflow deve derivar RELEASE_REF exclusivamente do input release_tag');
assert.ok(workflow.includes('PARENT_SHA=$(git rev-parse HEAD^)'), 'workflow deve resolver parent');
assert.ok(workflow.includes('test "$HEAD_SHA" = "$TAG_SHA"'), 'HEAD deve igualar peeled tag');
assert.ok(workflow.includes('test "$PARENT_SHA" = "$PAYLOAD_SHA"'), 'parent deve igualar payload');
assert.ok(!workflow.includes('expected_sha:'), 'expected_sha legado proibido');
assert.ok(!workflow.includes('steps.release.outputs.sha'), 'output sha genérico proibido');

pass(`Release Identity: tag=${tag} payload=${payloadSha} identity=peeled-tag`);



// B-01: configuração versionada e determinística das oito flags

for (const flag of [
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
  assert.ok(
    flyStaging.includes(`${flag} = "false"`),
    `fly.staging.toml deve declarar ${flag} = "false"`
  );
}

assert.ok(!workflow.includes('flyctl secrets set'), 'workflow não deve mutar Fly secrets');

pass('B-01: flags PE e guards de runtime versionados; workflow sem secrets set');



// B-03: workflow_dispatch only

assert.ok(workflow.includes('workflow_dispatch:'), 'workflow_dispatch obrigatorio');

assert.ok(!workflow.match(/^\s+push:/m), 'sem trigger push no workflow staging');

pass('B-03: somente workflow_dispatch');



// Guards anti-producao

assert.ok(workflow.includes('goldeouro-backend-staging'), 'app staging');

assert.ok(workflow.includes('fly.staging.toml'), 'config staging');

assert.ok(workflow.includes('goldeouro-backend-v2'), 'gate producao read-only');

pass('Guards anti-producao presentes');



// B-04: auditoria secrets

assert.ok(workflow.includes('DATABASE_URL'), 'gate DATABASE_URL');

assert.ok(workflow.includes('FLY_API_TOKEN'), 'gate FLY_API_TOKEN');

assert.ok(workflow.includes('uatszaqzdqcwnfbipoxg'), 'ref staging supabase');

assert.ok(workflow.includes('gayopagjdrkcmkirmfvy'), 'bloqueio ref producao supabase');

pass('B-04: gates de secrets no workflow');



// fly.staging.toml

assert.ok(flyStaging.includes('goldeouro-backend-staging'), 'fly app staging');

assert.ok(!flyStaging.includes('goldeouro-backend-v2'), 'fly sem ref prod');

assert.ok(flyStaging.includes('DATABASE_ENV = "staging"'), 'DATABASE_ENV staging');

pass('fly.staging.toml validado');



// Release Identity guard — manifest governa payload; tag peeled governa identidade

assert.ok(workflow.includes('release-manifest.json'), 'workflow valida via manifest');

pass(`Payload via manifest: ${payloadSha}`);



console.log('[PE.2B.2-PIPELINE.2] pipeline validate: PASS');

