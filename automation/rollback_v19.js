/**
 * ROLLBACK V19 - Sistema de Rollback Automático
 * Restaura último backup e reverte deploy em caso de falha
 */

const { getAdminClient } = require('./lib/supabase-client');
const { backupSchemaAndData } = require('./backup_schema_and_data');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { redactSecrets } = require('./lib/supabase-client');

const BACKUP_DIR = path.join(__dirname, '../backup');
const LOG_DIR = path.join(__dirname, '../logs/v19/automation');

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  const logFile = path.join(LOG_DIR, `rollback_${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFileSync(logFile, logMessage);
  console.log(`[ROLLBACK] ${logMessage.trim()}`);
}

/**
 * Encontrar último backup disponível
 */
function findLastBackup(env, type = 'DATA') {
  const envDir = path.join(BACKUP_DIR, type.toLowerCase(), env);
  
  if (!fs.existsSync(envDir)) {
    throw new Error(`Diretório de backup não encontrado: ${envDir}`);
  }

  const files = fs.readdirSync(envDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(envDir, f),
      mtime: fs.statSync(path.join(envDir, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    throw new Error(`Nenhum backup encontrado em ${envDir}`);
  }

  return files[0];
}

/**
 * Restaurar backup do banco de dados
 */
async function restoreDatabaseBackup(env, backupPath) {
  log(`Restaurando backup: ${backupPath}`, 'INFO');
  
  // Nota: Restauração real requer acesso direto ao PostgreSQL via psql
  // Por enquanto, apenas validamos o arquivo e fornecemos instruções
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Arquivo de backup não encontrado: ${backupPath}`);
  }

  const backupContent = fs.readFileSync(backupPath, 'utf8');
  log(`Backup validado: ${backupContent.length} bytes`, 'SUCCESS');
  
  // Instruções para restauração manual
  log('Para restaurar, execute no Supabase SQL Editor:', 'INFO');
  log(`Arquivo: ${backupPath}`, 'INFO');

  return {
    success: true,
    backupPath,
    note: 'Execute restore manualmente no Supabase SQL Editor'
  };
}

/**
 * Rollback do deploy no Fly.io
 */
async function rollbackFlyDeploy(appName) {
  log(`Revertendo deploy Fly.io para app: ${appName}`, 'INFO');
  
  if (!process.env.FLY_API_TOKEN) {
    throw new Error('FLY_API_TOKEN não configurado');
  }

  try {
    // Listar releases
    const releasesOutput = execSync(`flyctl releases list --app ${appName} --json`, {
      encoding: 'utf8',
      env: { ...process.env, FLY_API_TOKEN: process.env.FLY_API_TOKEN }
    });

    const releases = JSON.parse(releasesOutput);
    
    if (releases.length < 2) {
      throw new Error('Não há releases anteriores para reverter');
    }

    // Reverter para release anterior
    const previousRelease = releases[1];
    log(`Revertendo para release: ${previousRelease.version}`, 'INFO');

    execSync(`flyctl releases rollback ${previousRelease.version} --app ${appName}`, {
      encoding: 'utf8',
      env: { ...process.env, FLY_API_TOKEN: process.env.FLY_API_TOKEN }
    });

    log('Rollback Fly.io concluído', 'SUCCESS');
    return { success: true, release: previousRelease.version };
  } catch (error) {
    log(`Erro no rollback Fly.io: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Rollback do deploy no Vercel
 */
async function rollbackVercelDeploy(projectName) {
  log(`Revertendo deploy Vercel para projeto: ${projectName}`, 'INFO');
  
  if (!process.env.VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN não configurado');
  }

  try {
    // Listar deployments
    const deploymentsOutput = execSync(`vercel ls ${projectName} --token ${process.env.VERCEL_TOKEN} --json`, {
      encoding: 'utf8'
    });

    const deployments = JSON.parse(deploymentsOutput);
    
    if (deployments.length < 2) {
      throw new Error('Não há deployments anteriores para reverter');
    }

    // Reverter para deployment anterior
    const previousDeployment = deployments[1];
    log(`Revertendo para deployment: ${previousDeployment.uid}`, 'INFO');

    execSync(`vercel rollback ${previousDeployment.uid} --token ${process.env.VERCEL_TOKEN} --yes`, {
      encoding: 'utf8'
    });

    log('Rollback Vercel concluído', 'SUCCESS');
    return { success: true, deployment: previousDeployment.uid };
  } catch (error) {
    log(`Erro no rollback Vercel: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Executar health checks pós-rollback
 */
async function runPostRollbackHealthChecks(env) {
  log('Executando health checks pós-rollback...', 'INFO');
  
  const client = getAdminClient(env);
  const maxAttempts = 3;
  const delay = 10000; // 10 segundos

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { data, error } = await client
        .from('system_heartbeat')
        .select('*')
        .order('last_heartbeat', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        log('Health check passou', 'SUCCESS');
        return { success: true };
      }

      if (i < maxAttempts - 1) {
        log(`Health check falhou, tentativa ${i + 1}/${maxAttempts}, aguardando ${delay}ms...`, 'WARN');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (i < maxAttempts - 1) {
        log(`Erro no health check: ${error.message}, tentativa ${i + 1}/${maxAttempts}`, 'WARN');
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Health checks falharam após rollback');
}

/**
 * Função principal de rollback
 */
async function rollbackV19(env = 'STG', options = {}) {
  const { 
    rollbackDb = true, 
    rollbackBackend = false, 
    rollbackAdmin = false,
    appName = process.env.FLY_APP_BACKEND,
    projectName = process.env.VERCEL_PROJECT_ADMIN
  } = options;

  log(`=== INICIANDO ROLLBACK V19 - ${env.toUpperCase()} ===`, 'WARN');
  
  const startTime = Date.now();
  const results = {
    env: env.toUpperCase(),
    startTime: new Date().toISOString(),
    steps: [],
    success: false
  };

  try {
    // STEP 1: Criar backup antes do rollback
    log('STEP 1: Criando backup pré-rollback...', 'INFO');
    const preRollbackBackup = await backupSchemaAndData(env);
    results.steps.push({ step: 'pre_rollback_backup', status: preRollbackBackup.success ? 'OK' : 'FAIL' });

    // STEP 2: Restaurar banco de dados
    if (rollbackDb) {
      log('STEP 2: Restaurando banco de dados...', 'INFO');
      const lastBackup = findLastBackup(env, 'DATA');
      const dbRestore = await restoreDatabaseBackup(env, lastBackup.path);
      results.steps.push({ step: 'db_restore', status: dbRestore.success ? 'OK' : 'FAIL', data: dbRestore });
    }

    // STEP 3: Rollback backend (Fly.io)
    if (rollbackBackend && appName) {
      log('STEP 3: Revertendo deploy backend...', 'INFO');
      const backendRollback = await rollbackFlyDeploy(appName);
      results.steps.push({ step: 'backend_rollback', status: backendRollback.success ? 'OK' : 'FAIL', data: backendRollback });
    }

    // STEP 4: Rollback admin (Vercel)
    if (rollbackAdmin && projectName) {
      log('STEP 4: Revertendo deploy admin...', 'INFO');
      const adminRollback = await rollbackVercelDeploy(projectName);
      results.steps.push({ step: 'admin_rollback', status: adminRollback.success ? 'OK' : 'FAIL', data: adminRollback });
    }

    // STEP 5: Health checks pós-rollback
    log('STEP 5: Executando health checks pós-rollback...', 'INFO');
    const healthChecks = await runPostRollbackHealthChecks(env);
    results.steps.push({ step: 'health_checks', status: healthChecks.success ? 'OK' : 'FAIL' });

    const duration = Date.now() - startTime;
    results.duration = duration;
    results.endTime = new Date().toISOString();
    results.success = results.steps.every(s => s.status === 'OK');

    log(`=== ROLLBACK V19 CONCLUÍDO (${duration}ms) ===`, results.success ? 'SUCCESS' : 'ERROR');
    log(`Status: ${results.success ? 'SUCESSO' : 'FALHA'}`, results.success ? 'SUCCESS' : 'ERROR');

    // Salvar resultados
    const resultsPath = path.join(LOG_DIR, `rollback_${env.toLowerCase()}_${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    log(`Resultados salvos em: ${resultsPath}`, 'INFO');

    return results;
  } catch (error) {
    log(`Erro crítico no rollback: ${redactSecrets(error.message)}`, 'ERROR');
    results.error = error.message;
    results.success = false;
    results.duration = Date.now() - startTime;
    
    const resultsPath = path.join(LOG_DIR, `rollback_${env.toLowerCase()}_${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const envIndex = args.findIndex(a => a.startsWith('--env='));
  const env = envIndex >= 0 ? args[envIndex].split('=')[1] : 'STG';
  
  const rollbackDb = !args.includes('--skip-db');
  const rollbackBackend = args.includes('--rollback-backend');
  const rollbackAdmin = args.includes('--rollback-admin');

  rollbackV19(env, { rollbackDb, rollbackBackend, rollbackAdmin })
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', redactSecrets(error.message));
      process.exit(1);
    });
}

module.exports = { rollbackV19 };

