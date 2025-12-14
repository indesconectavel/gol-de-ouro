/**
 * FULL AUDIT V19 - AUTOMAÇÃO V19
 * Script mestre de auditoria completa para ambos os ambientes
 */

const { runPipeline: runStagingPipeline } = require('./pipeline_staging');
const { runPipeline: runProductionPipeline } = require('./pipeline_production');
const { runValidationSuite } = require('./validation_suite');
const { testPIXFlow } = require('./teste_pix_v19');
const { testPremiacaoFlow } = require('./teste_premiacao_v19');
const { getClient } = require('./lib/supabase-client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOG_DIR = path.join(__dirname, '../../logs/v19/automation');

// Garantir diretório de logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  const logFile = path.join(LOG_DIR, `full_audit_v19_${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFileSync(logFile, logMessage);
  console.log(`[FULL AUDIT] ${logMessage.trim()}`);
}

/**
 * Gerar hash MD5 de um arquivo
 */
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Aplicar correções automáticas quando possível
 */
async function applyAutoFixes(environment, issues) {
  log(`Aplicando correções automáticas em ${environment}...`, 'INFO');
  const client = createSupabaseClient(environment);
  const fixesApplied = [];
  const fixesFailed = [];

  for (const issue of issues) {
    try {
      if (issue.type === 'missing_search_path' && issue.function) {
        // Tentar adicionar SET search_path à função
        log(`Tentando corrigir função ${issue.function}...`, 'INFO');
        
        // Obter definição atual da função
        const getDefSQL = `
          SELECT pg_get_functiondef(oid) as definition
          FROM pg_proc
          WHERE proname = '${issue.function}'
          LIMIT 1;
        `;

        // Nota: Esta é uma correção complexa que requer acesso direto ao banco
        // Por segurança, vamos apenas registrar que precisa correção manual
        fixesFailed.push({
          issue,
          reason: 'Requer acesso direto ao banco de dados para modificar função'
        });
      }
    } catch (error) {
      fixesFailed.push({
        issue,
        error: error.message
      });
    }
  }

  return {
    applied: fixesApplied,
    failed: fixesFailed
  };
}

/**
 * Executar auditoria completa
 */
async function runFullAudit() {
  log('=== INICIANDO FULL AUDIT V19 ===', 'INFO');
  const startTime = Date.now();

  const auditResults = {
    startTime: new Date().toISOString(),
    staging: {},
    production: {},
    comparison: {},
    validation: {},
    tests: {},
    fixes: {},
    backups: {},
    summary: {}
  };

  try {
    // PHASE 1: Auditoria Staging
    log('PHASE 1: Executando auditoria STAGING...', 'INFO');
    try {
      auditResults.staging = await runStagingPipeline();
      log('✅ Auditoria staging concluída', 'SUCCESS');
    } catch (error) {
      log(`❌ Erro na auditoria staging: ${error.message}`, 'ERROR');
      auditResults.staging.error = error.message;
    }

    // PHASE 2: Auditoria Production
    log('PHASE 2: Executando auditoria PRODUCTION...', 'INFO');
    try {
      auditResults.production = await runProductionPipeline();
      log('✅ Auditoria production concluída', 'SUCCESS');
    } catch (error) {
      log(`❌ Erro na auditoria production: ${error.message}`, 'ERROR');
      auditResults.production.error = error.message;
    }

    // PHASE 3: Comparação entre ambientes
    log('PHASE 3: Comparando ambientes...', 'INFO');
    try {
      auditResults.comparison = await compareEnvironments();
      log('✅ Comparação concluída', 'SUCCESS');
    } catch (error) {
      log(`❌ Erro na comparação: ${error.message}`, 'ERROR');
      auditResults.comparison.error = error.message;
    }

    // PHASE 4: Validação V19
    log('PHASE 4: Executando validação V19...', 'INFO');
    try {
      auditResults.validation = await runValidationSuite();
      log('✅ Validação V19 concluída', 'SUCCESS');
    } catch (error) {
      log(`❌ Erro na validação: ${error.message}`, 'ERROR');
      auditResults.validation.error = error.message;
    }

    // PHASE 5: Testes PIX
    log('PHASE 5: Executando testes PIX...', 'INFO');
    try {
      auditResults.tests.pixStaging = await testPIXFlow('staging');
      auditResults.tests.pixProduction = await testPIXFlow('production');
      log('✅ Testes PIX concluídos', 'SUCCESS');
    } catch (error) {
      log(`❌ Erro nos testes PIX: ${error.message}`, 'ERROR');
      auditResults.tests.pixError = error.message;
    }

    // PHASE 6: Testes Premiação
    log('PHASE 6: Executando testes Premiação...', 'INFO');
    try {
      auditResults.tests.premiacaoStaging = await testPremiacaoFlow('staging');
      auditResults.tests.premiacaoProduction = await testPremiacaoFlow('production');
      log('✅ Testes Premiação concluídos', 'SUCCESS');
    } catch (error) {
      log(`❌ Erro nos testes Premiação: ${error.message}`, 'ERROR');
      auditResults.tests.premiacaoError = error.message;
    }

    // PHASE 7: Aplicar correções automáticas
    log('PHASE 7: Aplicando correções automáticas...', 'INFO');
    try {
      const stagingIssues = auditResults.staging.steps?.security || [];
      const productionIssues = auditResults.production.steps?.security || [];

      auditResults.fixes.staging = await applyAutoFixes('staging', stagingIssues);
      auditResults.fixes.production = await applyAutoFixes('production', productionIssues);
      log('✅ Correções automáticas processadas', 'SUCCESS');
    } catch (error) {
      log(`❌ Erro ao aplicar correções: ${error.message}`, 'ERROR');
      auditResults.fixes.error = error.message;
    }

    // PHASE 8: Coletar hashes dos backups
    log('PHASE 8: Coletando hashes dos backups...', 'INFO');
    try {
      const backupDir = path.join(__dirname, '../../backup');
      const stagingBackups = [];
      const productionBackups = [];

      // Buscar backups de staging
      const stagingSchemaPath = auditResults.staging.steps?.schemaBackup?.path;
      const stagingDataPath = auditResults.staging.steps?.dataBackup?.path;

      if (stagingSchemaPath && fs.existsSync(stagingSchemaPath)) {
        stagingBackups.push({
          file: path.basename(stagingSchemaPath),
          path: stagingSchemaPath,
          hash: getFileHash(stagingSchemaPath),
          type: 'schema'
        });
      }

      if (stagingDataPath && fs.existsSync(stagingDataPath)) {
        stagingBackups.push({
          file: path.basename(stagingDataPath),
          path: stagingDataPath,
          hash: getFileHash(stagingDataPath),
          type: 'data'
        });
      }

      // Buscar backups de production
      const productionSchemaPath = auditResults.production.steps?.schemaBackup?.path;
      const productionDataPath = auditResults.production.steps?.dataBackup?.path;

      if (productionSchemaPath && fs.existsSync(productionSchemaPath)) {
        productionBackups.push({
          file: path.basename(productionSchemaPath),
          path: productionSchemaPath,
          hash: getFileHash(productionSchemaPath),
          type: 'schema'
        });
      }

      if (productionDataPath && fs.existsSync(productionDataPath)) {
        productionBackups.push({
          file: path.basename(productionDataPath),
          path: productionDataPath,
          hash: getFileHash(productionDataPath),
          type: 'data'
        });
      }

      auditResults.backups = {
        staging: stagingBackups,
        production: productionBackups
      };

      log('✅ Hashes dos backups coletados', 'SUCCESS');
    } catch (error) {
      log(`❌ Erro ao coletar hashes: ${error.message}`, 'ERROR');
      auditResults.backups.error = error.message;
    }

    // Gerar resumo
    const endTime = Date.now();
    auditResults.endTime = new Date().toISOString();
    auditResults.duration = endTime - startTime;

    auditResults.summary = {
      staging: {
        success: auditResults.staging.success || false,
        errors: auditResults.staging.errors?.length || 0
      },
      production: {
        success: auditResults.production.success || false,
        errors: auditResults.production.errors?.length || 0
      },
      validation: {
        valid: auditResults.validation.overallValid || false
      },
      tests: {
        pix: {
          staging: auditResults.tests.pixStaging?.success || false,
          production: auditResults.tests.pixProduction?.success || false
        },
        premiacao: {
          staging: auditResults.tests.premiacaoStaging?.success || false,
          production: auditResults.tests.premiacaoProduction?.success || false
        }
      },
      overallSuccess: 
        auditResults.staging.success &&
        auditResults.production.success &&
        auditResults.validation.overallValid
    };

    log(`=== FULL AUDIT CONCLUÍDO (${auditResults.duration}ms) ===`, 
        auditResults.summary.overallSuccess ? 'SUCCESS' : 'WARN');

    // Salvar resultados
    const resultsPath = path.join(LOG_DIR, `full_audit_v19_results_${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2), 'utf8');
    log(`Resultados salvos em: ${resultsPath}`, 'INFO');

    // Gerar relatório Markdown
    await generateMarkdownReport(auditResults);

    return auditResults;
  } catch (error) {
    log(`❌ ERRO CRÍTICO: ${error.message}`, 'ERROR');
    auditResults.error = error.message;
    auditResults.summary.overallSuccess = false;
    throw error;
  }
}

/**
 * Gerar relatório Markdown
 */
async function generateMarkdownReport(results) {
  const reportPath = path.join(__dirname, '../../RELATORIO_FINAL_AUDITORIA_V19.md');
  
  let markdown = `# RELATÓRIO FINAL AUDITORIA V19\n\n`;
  markdown += `**Data:** ${new Date().toISOString()}\n`;
  markdown += `**Duração:** ${results.duration}ms\n\n`;
  
  markdown += `## Status Geral\n\n`;
  markdown += `- **Staging:** ${results.summary.staging.success ? '✅' : '❌'}\n`;
  markdown += `- **Production:** ${results.summary.production.success ? '✅' : '❌'}\n`;
  markdown += `- **Validação:** ${results.summary.validation.valid ? '✅' : '❌'}\n`;
  markdown += `- **Overall:** ${results.summary.overallSuccess ? '✅ SUCESSO' : '❌ FALHAS ENCONTRADAS'}\n\n`;

  markdown += `## Diferenças Encontradas\n\n`;
  if (results.comparison.differences) {
    markdown += `### Tabelas\n`;
    markdown += `- Apenas em Staging: ${results.comparison.differences.tables?.onlyInStaging || 0}\n`;
    markdown += `- Apenas em Production: ${results.comparison.differences.tables?.onlyInProduction || 0}\n`;
    markdown += `- Comuns: ${results.comparison.differences.tables?.common || 0}\n\n`;
    
    markdown += `### RPCs\n`;
    markdown += `- Apenas em Staging: ${results.comparison.differences.rpcs?.onlyInStaging || 0}\n`;
    markdown += `- Apenas em Production: ${results.comparison.differences.rpcs?.onlyInProduction || 0}\n`;
    markdown += `- Comuns: ${results.comparison.differences.rpcs?.common || 0}\n\n`;
  }

  markdown += `## Correções Aplicadas\n\n`;
  markdown += `### Staging\n`;
  markdown += `- Aplicadas: ${results.fixes.staging?.applied?.length || 0}\n`;
  markdown += `- Falharam: ${results.fixes.staging?.failed?.length || 0}\n\n`;
  
  markdown += `### Production\n`;
  markdown += `- Aplicadas: ${results.fixes.production?.applied?.length || 0}\n`;
  markdown += `- Falharam: ${results.fixes.production?.failed?.length || 0}\n\n`;

  markdown += `## Status Pós-Correção\n\n`;
  markdown += `### Tabelas\n`;
  if (results.staging.steps?.tables) {
    markdown += `- Staging: ${results.staging.steps.tables.length || 0} tabelas\n`;
  }
  if (results.production.steps?.tables) {
    markdown += `- Production: ${results.production.steps.tables.length || 0} tabelas\n`;
  }

  markdown += `### RPCs\n`;
  if (results.staging.steps?.rpcs) {
    markdown += `- Staging: ${results.staging.steps.rpcs.length || 0} RPCs\n`;
  }
  if (results.production.steps?.rpcs) {
    markdown += `- Production: ${results.production.steps.rpcs.length || 0} RPCs\n`;
  }

  markdown += `## Testes PIX\n\n`;
  markdown += `### Staging\n`;
  markdown += `- Status: ${results.tests.pixStaging?.success ? '✅ PASSOU' : '❌ FALHOU'}\n`;
  markdown += `- Passou: ${results.tests.pixStaging?.passed || 0}/${results.tests.pixStaging?.tests?.length || 0}\n\n`;
  
  markdown += `### Production\n`;
  markdown += `- Status: ${results.tests.pixProduction?.success ? '✅ PASSOU' : '❌ FALHOU'}\n`;
  markdown += `- Passou: ${results.tests.pixProduction?.passed || 0}/${results.tests.pixProduction?.tests?.length || 0}\n\n`;

  markdown += `## Testes Premiação\n\n`;
  markdown += `### Staging\n`;
  markdown += `- Status: ${results.tests.premiacaoStaging?.success ? '✅ PASSOU' : '❌ FALHOU'}\n`;
  markdown += `- Passou: ${results.tests.premiacaoStaging?.passed || 0}/${results.tests.premiacaoStaging?.tests?.length || 0}\n\n`;
  
  markdown += `### Production\n`;
  markdown += `- Status: ${results.tests.premiacaoProduction?.success ? '✅ PASSOU' : '❌ FALHOU'}\n`;
  markdown += `- Passou: ${results.tests.premiacaoProduction?.passed || 0}/${results.tests.premiacaoProduction?.tests?.length || 0}\n\n`;

  markdown += `## Hash dos Backups\n\n`;
  markdown += `### Staging\n`;
  if (results.backups.staging) {
    results.backups.staging.forEach(backup => {
      markdown += `- **${backup.file}** (${backup.type}): \`${backup.hash}\`\n`;
    });
  }
  
  markdown += `### Production\n`;
  if (results.backups.production) {
    results.backups.production.forEach(backup => {
      markdown += `- **${backup.file}** (${backup.type}): \`${backup.hash}\`\n`;
    });
  }

  fs.writeFileSync(reportPath, markdown, 'utf8');
  log(`Relatório Markdown gerado em: ${reportPath}`, 'INFO');
}

// Executar se chamado diretamente
if (require.main === module) {
  runFullAudit()
    .then(results => {
      process.exit(results.summary.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { runFullAudit };

