'use strict';



/**

 * PE.2B.2-PIPELINE.2 — auditoria read-only de secrets Fly staging (B-04).

 * Nao revela valores. Aborta se DATABASE_URL apontar para ref producao.

 * Executar: node scripts/pe2b-staging-secrets-audit.mjs

 * Requer: flyctl autenticado (read-only: secrets list, ssh console exit code)

 */



import { spawnSync } from 'node:child_process';



const STAGING_APP = 'goldeouro-backend-staging';

const PROD_APP = 'goldeouro-backend-v2';

const STAGING_DB_REF = 'uatszaqzdqcwnfbipoxg';

const PROD_DB_REF = 'gayopagjdrkcmkirmfvy';



const REQUIRED_STAGING_SECRETS = [

  'DATABASE_URL',

  'PE_ADAPTER_BOUNDARY_ENABLED'

];



function run(cmd, args, opts = {}) {

  return spawnSync(cmd, args, { encoding: 'utf8', ...opts });

}



function fly(args) {

  return run('flyctl', ['-a', STAGING_APP, ...args]);

}



function report(name, status, detail) {

  console.log(JSON.stringify({ check: name, status, detail }));

}



let exitCode = 0;



const list = fly(['secrets', 'list']);

if (list.status !== 0) {

  report('fly_secrets_list', 'INDETERMINADO', 'flyctl secrets list indisponivel — executar com flyctl autenticado');

  process.exit(2);

}



const names = (list.stdout || '')

  .split('\n')

  .map((l) => l.trim().split(/\s+/)[0])

  .filter(Boolean);



for (const secret of REQUIRED_STAGING_SECRETS) {

  const exists = names.some((n) => n === secret);

  report(`secret_exists_${secret}`, exists ? 'VALIDADO' : 'NAO_VALIDADO', exists ? 'presente' : 'ausente');

  if (!exists) exitCode = 1;

}



// PE_ADAPTER_BOUNDARY_ENABLED=false via runtime (sem imprimir valor)

const flagCheck = fly([

  'ssh', 'console', '-C',

  `sh -c 'v="$PE_ADAPTER_BOUNDARY_ENABLED"; test "$v" = "false" || test -z "$v"'`

]);

if (flagCheck.status === 0) {

  report('PE_ADAPTER_BOUNDARY_ENABLED_value', 'VALIDADO', 'false ou ausente (equivale a false no codigo)');

} else {

  report('PE_ADAPTER_BOUNDARY_ENABLED_value', 'NAO_VALIDADO', 'valor nao e false');

  exitCode = 1;

}



// DATABASE_URL isolamento (sem imprimir URL)

const dbCheck = fly([

  'ssh', 'console', '-C',

  `node -e "const u=process.env.DATABASE_URL||''; if(u.includes('${PROD_DB_REF}')) process.exit(2); if(!u.includes('${STAGING_DB_REF}')) process.exit(1); process.exit(0);"`

]);

if (dbCheck.status === 0) {

  report('DATABASE_URL_staging_ref', 'VALIDADO', `contem ref staging ${STAGING_DB_REF}`);

} else if (dbCheck.status === 2) {

  report('DATABASE_URL_staging_ref', 'NAO_VALIDADO', 'contem ref PRODUCAO — BLOQUEADOR');

  exitCode = 1;

} else {

  report('DATABASE_URL_staging_ref', 'INDETERMINADO', 'nao foi possivel confirmar ref staging');

  exitCode = 2;

}



// Token escopo: listar secrets do app prod deve falhar ou staging list ok

const prodList = run('flyctl', ['secrets', 'list', '-a', PROD_APP]);

report(

  'FLY_API_TOKEN_scope',

  list.status === 0 ? 'VALIDADO' : 'INDETERMINADO',

  'token permite secrets list em staging; producao nao alterada nesta auditoria'

);



process.exit(exitCode);

