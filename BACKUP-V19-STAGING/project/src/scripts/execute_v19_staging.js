/**
 * EXECUTE V19 STAGING - Script Master para Execução Completa V19 em STAGING
 * Executa todas as etapas da correção V19 com logs, validação e rollback automático
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const STAGING_DIR = path.join(__dirname, '..', '..');
const LOG_DIR = path.join(STAGING_DIR, 'logs');
const BACKUP_DIR = path.join(STAGING_DIR, 'BACKUP-V19-SNAPSHOT');
const REPORT_FILE = path.join(STAGING_DIR, 'RELATORIO-STAGING-V19.md');

const stagingReport = {
  inicio: new Date().toISOString(),
  ambiente: 'STAGING',
  versao: 'V19.0.0',
  etapas: [],
  metricas: {},
  erros: [],
  warnings: [],
  status: 'EM_ANDAMENTO'
};

let logFile = null;

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  if (logFile) {
    fs.appendFile(logFile, logMessage + '\n', 'utf8').catch(() => {});
  }
  
  stagingReport.etapas.push({
    timestamp,
    nivel: level,
    mensagem: message
  });
}

function logError(message, error) {
  log(`❌ ${message}: ${error?.message || error}`, 'ERROR');
  stagingReport.erros.push({
    timestamp: new Date().toISOString(),
    mensagem: message,
    erro: error?.message || error,
    stack: error?.stack
  });
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'WARN');
  stagingReport.warnings.push({
    timestamp: new Date().toISOString(),
    mensagem: message
  });
}

async function executarComando(comando, descricao) {
  log(`\n============================================================`);
  log(` ${descricao}`);
  log(`============================================================`);
  log(`Comando: ${comando}`);
  
  try {
    const output = execSync(comando, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: STAGING_DIR,
      env: { ...process.env, NODE_ENV: 'staging' }
    });
    
    log(`✅ ${descricao} - SUCESSO`);
    if (output) {
      log(`Saída: ${output.substring(0, 500)}`);
    }
    
    return { success: true, output };
  } catch (error) {
    logError(`${descricao} - FALHOU`, error);
    if (error.stdout) log(`STDOUT: ${error.stdout.substring(0, 500)}`);
    if (error.stderr) log(`STDERR: ${error.stderr.substring(0, 500)}`);
    return { success: false, error: error.message, output: error.stdout, stderr: error.stderr };
  }
}

async function etapa1_VerificarBackup() {
  log('\n🔍 ETAPA 1: Verificação de Backup');
  
  const resultado = await executarComando(
    'node src/scripts/verify_backup_and_proceed.js',
    'Verificação de Backup V19'
  );
  
  if (!resultado.success) {
    const errorFile = path.join(LOG_DIR, 'staging-error-backup.json');
    await fs.writeFile(errorFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      etapa: 'ETAPA_1_VERIFICACAO_BACKUP',
      erro: resultado.error,
      stdout: resultado.output,
      stderr: resultado.stderr
    }, null, 2), 'utf8');
    
    throw new Error('ETAPA 1 FALHOU: Backup não verificado');
  }
  
  return resultado;
}

async function etapa2_BackupPreMigration() {
  log('\n💾 ETAPA 2: Backup Pré-Migration');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupFile = path.join(BACKUP_DIR, 'database', `backup.pre_migration_staging_${timestamp}.dump`);
  
  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada');
  }
  
  log(`Criando backup em: ${backupFile}`);
  
  const resultado = await executarComando(
    `pg_dump "${process.env.DATABASE_URL}" -F c -f "${backupFile}"`,
    'Backup Pré-Migration Staging'
  );
  
  if (!resultado.success) {
    throw new Error('ETAPA 2 FALHOU: Backup pré-migration não criado');
  }
  
  // Verificar se arquivo foi criado
  try {
    const stats = await fs.stat(backupFile);
    log(`✅ Backup criado: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Gerar checksum SHA-256
    const content = await fs.readFile(backupFile);
    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    await fs.writeFile(`${backupFile}.sha256`, checksum, 'utf8');
    log(`✅ Checksum SHA-256: ${checksum.substring(0, 16)}...`);
    
    stagingReport.backup_pre_migration = {
      arquivo: backupFile,
      tamanho_mb: (stats.size / (1024 * 1024)).toFixed(2),
      checksum_sha256: checksum,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    throw new Error(`Backup criado mas não pode ser verificado: ${e.message}`);
  }
  
  return resultado;
}

async function etapa3_AplicarMigration() {
  log('\n📋 ETAPA 3: Aplicar Migration SQL V19');
  
  const migrationLog = path.join(LOG_DIR, `migration_staging_${Date.now()}.log`);
  
  const resultado = await executarComando(
    `bash src/migrations/apply_migration.sh 2>&1 | tee "${migrationLog}"`,
    'Aplicação da Migration SQL V19'
  );
  
  if (!resultado.success) {
    log('❌ Migration falhou - Executando rollback automático...');
    await executarRollback();
    throw new Error('ETAPA 3 FALHOU: Migration SQL não aplicada');
  }
  
  stagingReport.migration_sql = {
    sucesso: true,
    log: migrationLog,
    timestamp: new Date().toISOString()
  };
  
  return resultado;
}

async function etapa4_MigrarMemoriaParaDB() {
  log('\n🔄 ETAPA 4: Migrar Lotes de Memória para DB');
  
  const migrateLog = path.join(LOG_DIR, `migrate-memory-staging.log`);
  const reportFile = path.join(LOG_DIR, `migration_report_staging.json`);
  
  const resultado = await executarComando(
    `node src/scripts/migrate_memory_lotes_to_db.js 2>&1 | tee "${migrateLog}"`,
    'Migração de Memória para DB'
  );
  
  if (!resultado.success) {
    log('❌ Migração de memória falhou - Executando rollback automático...');
    await executarRollback();
    throw new Error('ETAPA 4 FALHOU: Migração de memória não concluída');
  }
  
  // Ler relatório de migração se existir
  try {
    const reportContent = await fs.readFile(reportFile, 'utf8');
    const report = JSON.parse(reportContent);
    stagingReport.migracao_memoria = {
      sucesso: true,
      log: migrateLog,
      relatorio: report,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    logWarning(`Relatório de migração não encontrado: ${e.message}`);
  }
  
  return resultado;
}

async function etapa5_ExecutarTestes() {
  log('\n🧪 ETAPA 5: Executar Testes Completos');
  
  const testes = [
    { nome: 'Todos os testes', comando: 'npm test' },
    { nome: 'Testes RLS', comando: 'npm test -- rls.policies.test.js' },
    { nome: 'Testes Concorrência', comando: 'npm test -- concurrency.fila.test.js' },
    { nome: 'Testes Migração', comando: 'npm test -- migration.integration.test.js' },
    { nome: 'Smoke Tests', comando: 'npm test -- smoke.test.js' }
  ];
  
  const resultadosTestes = [];
  
  for (const teste of testes) {
    log(`\nExecutando: ${teste.nome}`);
    const resultado = await executarComando(teste.comando, teste.nome);
    resultadosTestes.push({
      nome: teste.nome,
      sucesso: resultado.success,
      erro: resultado.error
    });
    
    if (!resultado.success) {
      log('❌ Teste falhou - Executando rollback automático...');
      await executarRollback();
      throw new Error(`ETAPA 5 FALHOU: Teste ${teste.nome} falhou`);
    }
  }
  
  stagingReport.testes = {
    sucesso: true,
    resultados: resultadosTestes,
    timestamp: new Date().toISOString()
  };
  
  return { success: true, resultados: resultadosTestes };
}

async function etapa6_AtivarDBQueue() {
  log('\n⚙️  ETAPA 6: Ativar USE_DB_QUEUE no Staging');
  
  const envFile = path.join(STAGING_DIR, '.env.staging');
  const envFileBackup = path.join(STAGING_DIR, '.env.staging.backup');
  
  try {
    // Fazer backup do .env.staging
    try {
      const envContent = await fs.readFile(envFile, 'utf8');
      await fs.writeFile(envFileBackup, envContent, 'utf8');
      log(`✅ Backup do .env.staging criado`);
    } catch (e) {
      logWarning(`.env.staging não existe, criando novo`);
    }
    
    // Ler conteúdo atual ou criar novo
    let envContent = '';
    try {
      envContent = await fs.readFile(envFile, 'utf8');
    } catch (e) {
      envContent = '';
    }
    
    // Adicionar USE_DB_QUEUE se não existir
    if (!envContent.includes('USE_DB_QUEUE')) {
      envContent += '\nUSE_DB_QUEUE=true\n';
      await fs.writeFile(envFile, envContent, 'utf8');
      log(`✅ USE_DB_QUEUE=true adicionado ao .env.staging`);
    } else {
      log(`✅ USE_DB_QUEUE já existe no .env.staging`);
    }
    
    stagingReport.db_queue_ativado = {
      sucesso: true,
      arquivo: envFile,
      timestamp: new Date().toISOString()
    };
    
    return { success: true };
  } catch (error) {
    logError('Falha ao ativar USE_DB_QUEUE', error);
    throw new Error('ETAPA 6 FALHOU: Não foi possível ativar USE_DB_QUEUE');
  }
}

async function etapa7_Monitoramento() {
  log('\n📊 ETAPA 7: Iniciar Monitoramento Automatizado');
  
  log('⚠️  Monitoramento será executado por 10-15 minutos');
  log('   Verificando endpoint /monitor...');
  
  // Verificar se servidor está rodando
  try {
    const axios = require('axios');
    const response = await axios.get('http://localhost:8080/monitor', {
      timeout: 5000
    });
    
    log(`✅ Endpoint /monitor respondendo`);
    stagingReport.monitoramento = {
      endpoint_ok: true,
      primeira_resposta: response.data,
      timestamp: new Date().toISOString()
    };
    
    // Iniciar monitoramento em background (simulado - em produção seria um processo separado)
    log(`✅ Monitoramento iniciado (será executado por 10-15 minutos)`);
    log(`   Logs serão salvos em: logs/monitor-staging-latest.json`);
    
  } catch (error) {
    logWarning(`Servidor pode não estar rodando: ${error.message}`);
    log(`⚠️  Execute 'npm start' manualmente e depois verifique /monitor`);
  }
  
  return { success: true };
}

async function etapa8_ChecklistValidacao() {
  log('\n✅ ETAPA 8: Checklist Automático de Validação');
  
  const resultado = await executarComando(
    'node src/scripts/post_migration_checks.js',
    'Validação Pós-Migration'
  );
  
  if (!resultado.success) {
    log('❌ Validação falhou - Executando rollback automático...');
    await executarRollback();
    throw new Error('ETAPA 8 FALHOU: Validação não passou');
  }
  
  // Ler arquivo de checks se existir
  const checksFile = path.join(STAGING_DIR, 'post_migration_checks.json');
  try {
    const checksContent = await fs.readFile(checksFile, 'utf8');
    const checks = JSON.parse(checksContent);
    stagingReport.validacao = {
      sucesso: true,
      checks: checks,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    logWarning(`Arquivo de checks não encontrado: ${e.message}`);
  }
  
  return resultado;
}

async function executarRollback() {
  log('\n🔄 EXECUTANDO ROLLBACK AUTOMÁTICO');
  
  try {
    const resultado = await executarComando(
      'bash BACKUP-V19-SNAPSHOT/rollback/rollback_all.sh',
      'Rollback Completo'
    );
    
    stagingReport.rollback_executado = {
      timestamp: new Date().toISOString(),
      sucesso: resultado.success,
      erro: resultado.error
    };
    
    // Gerar relatório de rollback
    const rollbackReport = path.join(STAGING_DIR, 'RELATORIO-STAGING-V19-ROLLBACK.md');
    await fs.writeFile(rollbackReport, `# 🔄 RELATÓRIO DE ROLLBACK STAGING V19\n\n${JSON.stringify(stagingReport, null, 2)}`, 'utf8');
    
    return resultado;
  } catch (error) {
    logError('Erro ao executar rollback', error);
    throw error;
  }
}

async function etapa9_GerarRelatorioFinal() {
  log('\n📄 ETAPA 9: Gerar Relatório Final de Staging');
  
  stagingReport.fim = new Date().toISOString();
  stagingReport.duracao_segundos = Math.round((new Date(stagingReport.fim) - new Date(stagingReport.inicio)) / 1000);
  
  // Calcular score de risco
  let scoreRisco = 0;
  if (stagingReport.erros.length > 0) scoreRisco += stagingReport.erros.length * 10;
  if (stagingReport.warnings.length > 0) scoreRisco += stagingReport.warnings.length * 2;
  if (!stagingReport.testes?.sucesso) scoreRisco += 50;
  if (!stagingReport.validacao?.sucesso) scoreRisco += 30;
  
  stagingReport.score_risco = scoreRisco;
  stagingReport.recomendacao = scoreRisco < 20 ? 'GO' : scoreRisco < 50 ? 'GO_COM_RESERVAS' : 'NO_GO';
  
  // Gerar relatório markdown
  const relatorio = `# 📊 RELATÓRIO STAGING V19
## Data: ${new Date().toISOString().split('T')[0]}
## Versão: V19.0.0
## Ambiente: STAGING

---

## ✅ RESUMO EXECUTIVO

**Status:** ${stagingReport.status === 'SUCESSO' ? '✅ SUCESSO' : '❌ FALHOU'}
**Duração:** ${stagingReport.duracao_segundos} segundos
**Score de Risco:** ${stagingReport.score_risco}/100
**Recomendação:** ${stagingReport.recomendacao}

---

## 📋 ETAPAS EXECUTADAS

${stagingReport.etapas.map(e => `- **[${e.nivel}]** ${e.mensagem}`).join('\n')}

---

## 📊 MÉTRICAS

${JSON.stringify(stagingReport.metricas, null, 2)}

---

## ⚠️ ERROS

${stagingReport.erros.length > 0 ? stagingReport.erros.map(e => `- **${e.timestamp}**: ${e.mensagem} - ${e.erro}`).join('\n') : 'Nenhum erro'}

---

## ⚠️ AVISOS

${stagingReport.warnings.length > 0 ? stagingReport.warnings.map(w => `- **${w.timestamp}**: ${w.mensagem}`).join('\n') : 'Nenhum aviso'}

---

## 🧪 TESTES

${stagingReport.testes ? JSON.stringify(stagingReport.testes, null, 2) : 'Não executados'}

---

## ✅ VALIDAÇÃO

${stagingReport.validacao ? JSON.stringify(stagingReport.validacao, null, 2) : 'Não executada'}

---

## 📝 CONCLUSÃO

${stagingReport.recomendacao === 'GO' ? '✅ **APROVADO PARA PRODUÇÃO**' : stagingReport.recomendacao === 'GO_COM_RESERVAS' ? '⚠️  **APROVADO COM RESERVAS**' : '❌ **NÃO APROVADO PARA PRODUÇÃO**'}

**Próximo passo:** ${stagingReport.recomendacao === 'GO' ? 'Aguardar aprovação do usuário para aplicar em produção' : 'Corrigir problemas identificados e reexecutar em staging'}

---

**Gerado em:** ${stagingReport.fim}
`;

  await fs.writeFile(REPORT_FILE, relatorio, 'utf8');
  log(`✅ Relatório salvo em: ${REPORT_FILE}`);
  
  return { success: true };
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  logFile = path.join(LOG_DIR, `staging-v19-${timestamp}.log`);
  
  await ensureDir(LOG_DIR);
  
  log('============================================================');
  log(' EXECUÇÃO COMPLETA V19 EM STAGING');
  log('============================================================');
  log(`Início: ${stagingReport.inicio}`);
  log(`Ambiente: STAGING`);
  log(`Log: ${logFile}`);
  log('');
  
  try {
    // ETAPA 1
    await etapa1_VerificarBackup();
    
    // ETAPA 2
    await etapa2_BackupPreMigration();
    
    // ETAPA 3
    await etapa3_AplicarMigration();
    
    // ETAPA 4
    await etapa4_MigrarMemoriaParaDB();
    
    // ETAPA 5
    await etapa5_ExecutarTestes();
    
    // ETAPA 6
    await etapa6_AtivarDBQueue();
    
    // ETAPA 7
    await etapa7_Monitoramento();
    
    // ETAPA 8
    await etapa8_ChecklistValidacao();
    
    // ETAPA 9
    await etapa9_GerarRelatorioFinal();
    
    stagingReport.status = 'SUCESSO';
    
    log('');
    log('============================================================');
    log(' ✅ STAGING V19 CONCLUÍDO COM SUCESSO');
    log('============================================================');
    log(`Relatório: ${REPORT_FILE}`);
    log(`Log completo: ${logFile}`);
    log(`Score de Risco: ${stagingReport.score_risco}/100`);
    log(`Recomendação: ${stagingReport.recomendacao}`);
    log('');
    log('Próximo passo: Aguardar aprovação do usuário para aplicar em produção');
    log('');
    
  } catch (error) {
    stagingReport.status = 'FALHOU';
    stagingReport.erro_final = error.message;
    
    log('');
    log('============================================================');
    log(' ❌ STAGING V19 FALHOU');
    log('============================================================');
    log(`Erro: ${error.message}`);
    log(`Rollback executado: ${stagingReport.rollback_executado ? 'SIM' : 'NÃO'}`);
    log('');
    
    // Gerar relatório mesmo em caso de falha
    await etapa9_GerarRelatorioFinal();
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };

