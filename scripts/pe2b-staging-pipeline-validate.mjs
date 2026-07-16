'use strict';



/**

 * PE.2B.2-PIPELINE.2 — validacao local do pipeline staging (sem deploy, sem Fly write).

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

const sha = MANIFEST.release.sha;

assert.ok(sha && sha.length === 40, 'manifest deve conter SHA completo');



// B-02: release unificada

assert.ok(workflow.includes(`RELEASE_REF: ${tag}`) || workflow.includes(`'${tag}'`),

  'workflow deve usar release tag unificada');

assert.ok(workflow.includes(tag), 'workflow deve referenciar pe2b-staging-ready');

pass(`Release unificada: ${tag} @ ${sha}`);



// B-01: set deterministico da flag

assert.ok(

  workflow.includes('PE_ADAPTER_BOUNDARY_ENABLED=false'),

  'workflow deve setar PE_ADAPTER_BOUNDARY_ENABLED=false explicitamente'

);

pass('B-01: flag setada deterministicamente no workflow');



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



// SHA guard — manifest é fonte única

assert.ok(workflow.includes('release-manifest.json'), 'workflow valida via manifest');

pass(`SHA via manifest: ${sha}`);



console.log('[PE.2B.2-PIPELINE.2] pipeline validate: PASS');

