/**
 * EXECUTAR V19 - Orquestrador Principal
 * Executa auditoria completa, aplica migrations (opcional), testes e deploys
 */

const { backupSchemaAndData } = require('./backup_schema_and_data');
const { testPIXFlow } = require('./teste_pix_v19');
const { testPremiacaoFlow } = require('./teste_premiacao_v19');
const { getAdminClient } = require('./lib/supabase-client');
const fs = require('fs');
const path = require('path');
const { redactSecrets } = require('./lib/supabase-client');

const LOG_DIR = path.join(__dirname, '../logs/v19/automation');

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  const logFile = path.join(LOG_DIR, `executar_v19_${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFileSync(logFile, logMessage);
  console.log(`[EXECUTAR V19] ${logMessage.trim()}`);
}

/**
 * Validar ambiente antes de executar
 */
function validateEnvironment(env) {
  const envUpper = env.toUpperCase();
  
  if (!['STG', 'PROD'].includes(envUpper)) {
    throw new Error(`Ambiente inválido: ${env}. Use STG ou PROD`);
  }

  // Verificar variáveis de ambiente
  const requiredVars = [
    `SUPABASE_URL_${envUpper}`,
    `SUPABASE_SERVICE_ROLE_KEY_${envUpper}`
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente faltando: ${missing.join(', ')}`);
  }

  log(`Ambiente ${envUpper} validado`, 'SUCCESS');
}

/**
 * Aplicar migration V19 (se flag --apply)
 */
async function applyMigration(env, dryRun = true) {
  if (dryRun) {
    log('MODO DRY-RUN: Migration não será aplicada', 'WARN');
    return { success: true, dryRun: true };
  }

  log(`Aplicando migration V19 em ${env}...`, 'INFO');
  
  const migrationFile = path.join(__dirname, '../database/migration_v19/PRODUCAO_CORRECAO_INCREMENTAL_V19.sql');
  
  if (!fs.existsSync(migrationFile)) {
    throw new Error(`Arquivo de migration não encontrado: ${migrationFile}`);
  }

  const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
  
  // Nota: Aplicação real requer acesso direto ao PostgreSQL
  // Por enquanto, apenas validamos o arquivo
  log(`Migration file validado: ${migrationFile}`, 'SUCCESS');
  log('Para aplicar, execute manualmente no Supabase SQL Editor', 'INFO');

  return {
    success: true,
    migrationFile,
    dryRun: false,
    note: 'Execute migration manualmente no Supabase SQL Editor'
  };
}

/**
 * Executar health checks
 */
async function runHealthChecks(env) {
  log(`Executando health checks em ${env}...`, 'INFO');
  
  const client = getAdminClient(env);
  const checks = [];

  // Check 1: system_heartbeat
  try {
    const { data, error } = await client
      .from('system_heartbeat')
      .select('*')
      .order('last_heartbeat', { ascending: false })
      .limit(1);

    checks.push({
      name: 'system_heartbeat',
      status: !error && data && data.length > 0 ? 'OK' : 'FAIL',
      message: error ? error.message : 'Heartbeat encontrado'
    });
  } catch (error) {
    checks.push({
      name: 'system_heartbeat',
      status: 'FAIL',
      message: error.message
    });
  }

  // Check 2: RPCs V19
  try {
    const { data, error } = await client.rpc('rpc_get_active_lotes');
    checks.push({
      name: 'rpc_get_active_lotes',
      status: !error ? 'OK' : 'FAIL',
      message: error ? error.message : 'RPC funcionando'
    });
  } catch (error) {
    checks.push({
      name: 'rpc_get_active_lotes',
      status: 'FAIL',
      message: error.message
    });
  }

  const allPassed = checks.every(c => c.status === 'OK');
  
  log(`Health checks: ${checks.filter(c => c.status === 'OK').length}/${checks.length} passaram`, 
      allPassed ? 'SUCCESS' : 'WARN');

  return { success: allPassed, checks };
}

/**
 * Função principal de execução
 */
async function executarV19(env = 'STG', options = {}) {
  const { apply = false, skipTests = false, skipBackup = false } = options;
  const dryRun = !apply;

  log(`=== INICIANDO EXECUÇÃO V19 - ${env.toUpperCase()} ===`, 'INFO');
  log(`Modo: ${dryRun ? 'DRY-RUN' : 'APPLY'}`, dryRun ? 'WARN' : 'INFO');
  
  const startTime = Date.now();
  const results = {
    env: env.toUpperCase(),
    startTime: new Date().toISOString(),
    dryRun,
    steps: [],
    success: false
  };

  try {
    // STEP 1: Validar ambiente
    log('STEP 1: Validando ambiente...', 'INFO');
    validateEnvironment(env);
    results.steps.push({ step: 'validate', status: 'OK' });

    // STEP 2: Backup (se não pulado)
    if (!skipBackup) {
      log('STEP 2: Executando backup...', 'INFO');
      const backupResult = await backupSchemaAndData(env);
      results.steps.push({ step: 'backup', status: backupResult.success ? 'OK' : 'FAIL', data: backupResult });
      
      if (!backupResult.success) {
        throw new Error('Backup falhou');
      }
    }

    // STEP 3: Aplicar migration (se --apply)
    log('STEP 3: Processando migration...', 'INFO');
    const migrationResult = await applyMigration(env, dryRun);
    results.steps.push({ step: 'migration', status: migrationResult.success ? 'OK' : 'FAIL', data: migrationResult });

    // STEP 4: Health checks
    log('STEP 4: Executando health checks...', 'INFO');
    const healthResult = await runHealthChecks(env);
    results.steps.push({ step: 'health', status: healthResult.success ? 'OK' : 'FAIL', data: healthResult });

    // STEP 5: Testes (se não pulados)
    if (!skipTests) {
      log('STEP 5: Executando testes PIX...', 'INFO');
      const pixResult = await testPIXFlow(env);
      results.steps.push({ step: 'test_pix', status: pixResult.success ? 'OK' : 'FAIL', data: pixResult });

      log('STEP 6: Executando testes Premiação...', 'INFO');
      const premiacaoResult = await testPremiacaoFlow(env);
      results.steps.push({ step: 'test_premiacao', status: premiacaoResult.success ? 'OK' : 'FAIL', data: premiacaoResult });
    }

    const duration = Date.now() - startTime;
    results.duration = duration;
    results.endTime = new Date().toISOString();
    results.success = results.steps.every(s => s.status === 'OK');

    log(`=== EXECUÇÃO V19 CONCLUÍDA (${duration}ms) ===`, results.success ? 'SUCCESS' : 'WARN');
    log(`Status: ${results.success ? 'SUCESSO' : 'FALHA'}`, results.success ? 'SUCCESS' : 'ERROR');

    // Salvar resultados
    const resultsPath = path.join(LOG_DIR, `executar_v19_${env.toLowerCase()}_${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    log(`Resultados salvos em: ${resultsPath}`, 'INFO');

    return results;
  } catch (error) {
    log(`Erro crítico: ${redactSecrets(error.message)}`, 'ERROR');
    results.error = error.message;
    results.success = false;
    results.duration = Date.now() - startTime;
    
    const resultsPath = path.join(LOG_DIR, `executar_v19_${env.toLowerCase()}_${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const envIndex = args.findIndex(a => a.startsWith('--env='));
  const env = envIndex >= 0 ? args[envIndex].split('=')[1] : 'STG';
  
  const apply = args.includes('--apply');
  const skipTests = args.includes('--skip-tests');
  const skipBackup = args.includes('--skip-backup');

  executarV19(env, { apply, skipTests, skipBackup })
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', redactSecrets(error.message));
      process.exit(1);
    });
}

module.exports = { executarV19 };
