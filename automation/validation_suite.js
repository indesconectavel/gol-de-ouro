/**
 * VALIDATION SUITE - AUTOMAÇÃO V19
 * Suite completa de validações para ambos os ambientes
 */

const { createSupabaseClient, compareEnvironments } = require('./lib/supabase-client');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs/v19/automation');

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  const logFile = path.join(LOG_DIR, `validation_suite_${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFileSync(logFile, logMessage);
  console.log(`[VALIDATION] ${logMessage.trim()}`);
}

/**
 * Validar estrutura V19
 */
async function validateV19Structure(environment) {
  log(`Validando estrutura V19 em ${environment}...`, 'INFO');
  const client = createSupabaseClient(environment);
  const issues = [];

  // Tabelas V19 obrigatórias
  const requiredTables = [
    'lotes',
    'rewards',
    'webhook_events',
    'system_heartbeat'
  ];

  // RPCs V19 obrigatórios
  const requiredRPCs = [
    'rpc_add_balance',
    'rpc_deduct_balance',
    'rpc_transfer_balance',
    'rpc_get_balance',
    'rpc_get_or_create_lote',
    'rpc_update_lote_after_shot',
    'rpc_get_active_lotes',
    'rpc_register_reward',
    'rpc_mark_reward_credited',
    'rpc_get_user_rewards',
    'rpc_register_webhook_event',
    'rpc_check_webhook_event_processed',
    'rpc_mark_webhook_event_processed'
  ];

  try {
    // Verificar tabelas
    for (const table of requiredTables) {
      const { data, error } = await client.from(table).select('*').limit(1);
      if (error) {
        issues.push({
          type: 'missing_table',
          table: table,
          severity: 'critical',
          message: `Tabela ${table} não existe ou não está acessível`
        });
      }
    }

    // Verificar RPCs (via query direta)
    const rpcCheckSQL = `
      SELECT proname 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND proname IN (${requiredRPCs.map(r => `'${r}'`).join(', ')});
    `;

    // Tentar executar via client
    const existingRPCs = [];
    for (const rpc of requiredRPCs) {
      try {
        await client.rpc(rpc, {});
        existingRPCs.push(rpc);
      } catch (error) {
        // RPC não existe ou tem assinatura diferente
        if (!error.message.includes('function') && !error.message.includes('does not exist')) {
          existingRPCs.push(rpc);
        }
      }
    }

    const missingRPCs = requiredRPCs.filter(rpc => !existingRPCs.includes(rpc));
    missingRPCs.forEach(rpc => {
      issues.push({
        type: 'missing_rpc',
        rpc: rpc,
        severity: 'critical',
        message: `RPC ${rpc} não existe`
      });
    });

    // Verificar índices V19
    const requiredIndexes = [
      { table: 'lotes', index: 'idx_lotes_status' },
      { table: 'rewards', index: 'idx_rewards_user_id' },
      { table: 'webhook_events', index: 'idx_webhook_events_idempotency' }
    ];

    for (const idx of requiredIndexes) {
      const { data, error } = await client.rpc('check_index_exists', {
        table_name: idx.table,
        index_name: idx.index
      });
      
      if (error || !data) {
        issues.push({
          type: 'missing_index',
          table: idx.table,
          index: idx.index,
          severity: 'medium',
          message: `Índice ${idx.index} não existe na tabela ${idx.table}`
        });
      }
    }

    return {
      environment,
      valid: issues.length === 0,
      issues,
      summary: {
        tables: {
          required: requiredTables.length,
          found: requiredTables.length - issues.filter(i => i.type === 'missing_table').length
        },
        rpcs: {
          required: requiredRPCs.length,
          found: requiredRPCs.length - issues.filter(i => i.type === 'missing_rpc').length
        },
        indexes: {
          required: requiredIndexes.length,
          found: requiredIndexes.length - issues.filter(i => i.type === 'missing_index').length
        }
      }
    };
  } catch (error) {
    log(`Erro ao validar estrutura V19: ${error.message}`, 'ERROR');
    return {
      environment,
      valid: false,
      issues: [{
        type: 'validation_error',
        severity: 'critical',
        message: error.message
      }],
      summary: null
    };
  }
}

/**
 * Comparar ambientes
 */
async function validateEnvironmentsSync() {
  log('Comparando ambientes staging e production...', 'INFO');
  
  try {
    const comparison = await compareEnvironments();
    
    const differences = {
      tables: {
        onlyInStaging: comparison.tables.diff.onlyInStaging.length,
        onlyInProduction: comparison.tables.diff.onlyInProduction.length,
        common: comparison.tables.diff.common.length
      },
      rpcs: {
        onlyInStaging: comparison.rpcs.diff.onlyInStaging.length,
        onlyInProduction: comparison.rpcs.diff.onlyInProduction.length,
        common: comparison.rpcs.diff.common.length
      }
    };

    const issues = [];
    
    if (differences.tables.onlyInStaging > 0) {
      issues.push({
        type: 'table_sync',
        severity: 'high',
        message: `${differences.tables.onlyInStaging} tabelas existem apenas em staging`
      });
    }

    if (differences.tables.onlyInProduction > 0) {
      issues.push({
        type: 'table_sync',
        severity: 'high',
        message: `${differences.tables.onlyInProduction} tabelas existem apenas em production`
      });
    }

    if (differences.rpcs.onlyInStaging > 0) {
      issues.push({
        type: 'rpc_sync',
        severity: 'high',
        message: `${differences.rpcs.onlyInStaging} RPCs existem apenas em staging`
      });
    }

    if (differences.rpcs.onlyInProduction > 0) {
      issues.push({
        type: 'rpc_sync',
        severity: 'high',
        message: `${differences.rpcs.onlyInProduction} RPCs existem apenas em production`
      });
    }

    return {
      valid: issues.length === 0,
      differences,
      issues,
      comparison
    };
  } catch (error) {
    log(`Erro ao comparar ambientes: ${error.message}`, 'ERROR');
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Executar suite completa de validação
 */
async function runValidationSuite() {
  log('=== INICIANDO VALIDATION SUITE ===', 'INFO');
  const startTime = Date.now();

  const results = {
    startTime: new Date().toISOString(),
    validations: {},
    errors: []
  };

  try {
    // Validar staging
    log('Validando ambiente staging...', 'INFO');
    results.validations.staging = await validateV19Structure('staging');

    // Validar production
    log('Validando ambiente production...', 'INFO');
    results.validations.production = await validateV19Structure('production');

    // Comparar ambientes
    log('Comparando ambientes...', 'INFO');
    results.validations.sync = await validateEnvironmentsSync();

    const endTime = Date.now();
    results.endTime = new Date().toISOString();
    results.duration = endTime - startTime;
    results.overallValid = 
      results.validations.staging?.valid &&
      results.validations.production?.valid &&
      results.validations.sync?.valid;

    log(`=== VALIDATION SUITE CONCLUÍDA (${results.duration}ms) ===`, 
        results.overallValid ? 'SUCCESS' : 'WARN');

    // Salvar resultados
    const resultsPath = path.join(LOG_DIR, `validation_suite_results_${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    log(`Resultados salvos em: ${resultsPath}`, 'INFO');

    return results;
  } catch (error) {
    log(`❌ ERRO CRÍTICO: ${error.message}`, 'ERROR');
    results.errors.push({ step: 'critical', error: error.message });
    results.overallValid = false;
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runValidationSuite()
    .then(results => {
      process.exit(results.overallValid ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  validateV19Structure,
  validateEnvironmentsSync,
  runValidationSuite
};

