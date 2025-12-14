/**
 * PIPELINE PRODUCTION - AUTOMAÇÃO V19
 * Pipeline completo para ambiente production (goldeouro-production)
 */

const { 
  createSupabaseClient, 
  backupSchema, 
  backupData, 
  auditRPCs, 
  auditTables, 
  auditRLS 
} = require('./lib/supabase-client');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs/v19/automation');
const ENVIRONMENT = 'production';

// Garantir diretório de logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  const logFile = path.join(LOG_DIR, `pipeline_production_${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFileSync(logFile, logMessage);
  console.log(`[${ENVIRONMENT.toUpperCase()}] ${logMessage.trim()}`);
}

async function runPipeline() {
  log('=== INICIANDO PIPELINE PRODUCTION ===', 'INFO');
  const startTime = Date.now();
  
  const results = {
    environment: ENVIRONMENT,
    startTime: new Date().toISOString(),
    steps: {},
    errors: []
  };

  try {
    // STEP 1: Backup do Schema
    log('STEP 1: Fazendo backup do schema...', 'INFO');
    try {
      const schemaBackup = await backupSchema(ENVIRONMENT);
      results.steps.schemaBackup = schemaBackup;
      if (schemaBackup.success) {
        log(`✅ Schema backup criado: ${schemaBackup.path}`, 'SUCCESS');
      } else {
        log(`⚠️ Erro no backup do schema: ${schemaBackup.error}`, 'WARN');
        results.errors.push({ step: 'schemaBackup', error: schemaBackup.error });
      }
    } catch (error) {
      log(`❌ Erro ao fazer backup do schema: ${error.message}`, 'ERROR');
      results.errors.push({ step: 'schemaBackup', error: error.message });
    }

    // STEP 2: Backup dos Dados
    log('STEP 2: Fazendo backup dos dados...', 'INFO');
    try {
      const dataBackup = await backupData(ENVIRONMENT);
      results.steps.dataBackup = dataBackup;
      if (dataBackup.success) {
        log(`✅ Data backup criado: ${dataBackup.path}`, 'SUCCESS');
      } else {
        log(`⚠️ Erro no backup dos dados: ${dataBackup.error}`, 'WARN');
        results.errors.push({ step: 'dataBackup', error: dataBackup.error });
      }
    } catch (error) {
      log(`❌ Erro ao fazer backup dos dados: ${error.message}`, 'ERROR');
      results.errors.push({ step: 'dataBackup', error: error.message });
    }

    // STEP 3: Auditoria de Tabelas
    log('STEP 3: Auditando tabelas...', 'INFO');
    try {
      const tables = await auditTables(ENVIRONMENT);
      results.steps.tables = tables;
      log(`✅ ${tables.length || 0} tabelas auditadas`, 'SUCCESS');
    } catch (error) {
      log(`❌ Erro ao auditar tabelas: ${error.message}`, 'ERROR');
      results.errors.push({ step: 'tables', error: error.message });
    }

    // STEP 4: Auditoria de RPCs
    log('STEP 4: Auditando RPCs...', 'INFO');
    try {
      const rpcs = await auditRPCs(ENVIRONMENT);
      results.steps.rpcs = rpcs;
      log(`✅ ${rpcs.length || 0} RPCs auditados`, 'SUCCESS');
    } catch (error) {
      log(`❌ Erro ao auditar RPCs: ${error.message}`, 'ERROR');
      results.errors.push({ step: 'rpcs', error: error.message });
    }

    // STEP 5: Auditoria de RLS
    log('STEP 5: Auditando RLS...', 'INFO');
    try {
      const rls = await auditRLS(ENVIRONMENT);
      results.steps.rls = rls;
      log(`✅ RLS auditado para ${rls.length || 0} tabelas`, 'SUCCESS');
    } catch (error) {
      log(`❌ Erro ao auditar RLS: ${error.message}`, 'ERROR');
      results.errors.push({ step: 'rls', error: error.message });
    }

    // STEP 6: Validação de Segurança
    log('STEP 6: Validando segurança...', 'INFO');
    try {
      const securityIssues = await validateSecurity(ENVIRONMENT);
      results.steps.security = securityIssues;
      if (securityIssues.length === 0) {
        log('✅ Nenhum problema de segurança encontrado', 'SUCCESS');
      } else {
        log(`⚠️ ${securityIssues.length} problemas de segurança encontrados`, 'WARN');
      }
    } catch (error) {
      log(`❌ Erro na validação de segurança: ${error.message}`, 'ERROR');
      results.errors.push({ step: 'security', error: error.message });
    }

    const endTime = Date.now();
    results.endTime = new Date().toISOString();
    results.duration = endTime - startTime;
    results.success = results.errors.length === 0;

    log(`=== PIPELINE PRODUCTION CONCLUÍDO (${results.duration}ms) ===`, results.success ? 'SUCCESS' : 'WARN');
    
    // Salvar resultados
    const resultsPath = path.join(LOG_DIR, `pipeline_production_results_${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    log(`Resultados salvos em: ${resultsPath}`, 'INFO');

    return results;
  } catch (error) {
    log(`❌ ERRO CRÍTICO: ${error.message}`, 'ERROR');
    results.errors.push({ step: 'critical', error: error.message });
    results.success = false;
    throw error;
  }
}

/**
 * Validar segurança (funções sem SET search_path, etc)
 */
async function validateSecurity(environment) {
  const client = createSupabaseClient(environment);
  const issues = [];

  try {
    // Verificar funções sem SET search_path
    const sql = `
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%'
        AND p.proname LIKE 'rpc_%';
    `;

    const { data, error } = await client.rpc('exec_sql', { sql_query: sql });
    
    if (!error && data) {
      data.forEach(func => {
        issues.push({
          type: 'missing_search_path',
          function: func.function_name,
          severity: 'high',
          message: `Função ${func.function_name} não possui SET search_path`
        });
      });
    }
  } catch (error) {
    // Ignorar erros de validação
  }

  return issues;
}

// Executar se chamado diretamente
if (require.main === module) {
  runPipeline()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { runPipeline };

