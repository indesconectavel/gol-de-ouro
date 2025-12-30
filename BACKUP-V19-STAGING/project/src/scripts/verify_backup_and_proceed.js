/**
 * VERIFY BACKUP AND PROCEED - Script de Verificação de Backup V19
 * Verifica integridade do backup antes de aplicar migrations
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'BACKUP-V19-SNAPSHOT');
const CHECKSUMS_FILE = path.join(BACKUP_DIR, 'checksums.json');
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

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
}

function calcularSHA256(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

async function verificarBackup() {
  log('============================================================');
  log(' VERIFICAÇÃO DE BACKUP V19');
  log('============================================================');
  log('');

  // 1. Verificar se diretório de backup existe
  try {
    await fs.access(BACKUP_DIR);
    log(`✅ Diretório de backup encontrado: ${BACKUP_DIR}`);
  } catch (e) {
    log(`❌ ERRO CRÍTICO: Diretório de backup não encontrado: ${BACKUP_DIR}`, 'ERROR');
    throw new Error('Backup não encontrado');
  }

  // 2. Verificar checksums.json
  let checksums = null;
  try {
    const checksumsContent = await fs.readFile(CHECKSUMS_FILE, 'utf8');
    checksums = JSON.parse(checksumsContent);
    log(`✅ Arquivo checksums.json encontrado`);
    log(`   Total de checksums: ${Object.keys(checksums.checksums || {}).length}`);
  } catch (e) {
    log(`⚠️  AVISO: checksums.json não encontrado ou inválido: ${e.message}`, 'WARN');
    log(`   Continuando sem validação de checksums...`);
  }

  // 3. Verificar arquivos críticos do backup
  const arquivosCriticos = [
    'project/server-fly.js',
    'project/package.json',
    'database/schema-consolidado.sql',
    'rollback/rollback_all.sh'
  ];

  let arquivosFaltando = [];
  for (const arquivo of arquivosCriticos) {
    const caminhoCompleto = path.join(BACKUP_DIR, arquivo);
    try {
      await fs.access(caminhoCompleto);
      log(`✅ Arquivo crítico encontrado: ${arquivo}`);
      
      // Validar checksum se disponível
      if (checksums && checksums.checksums) {
        const hashEsperado = checksums.checksums[arquivo] || checksums.checksums[arquivo.replace(/\//g, '\\')];
        if (hashEsperado) {
          const hashAtual = calcularSHA256(caminhoCompleto);
          if (hashAtual === hashEsperado) {
            log(`   ✅ Checksum validado`);
          } else {
            log(`   ⚠️  Checksum não confere (esperado: ${hashEsperado.substring(0, 8)}..., atual: ${hashAtual?.substring(0, 8)}...)`, 'WARN');
          }
        }
      }
    } catch (e) {
      log(`❌ Arquivo crítico não encontrado: ${arquivo}`, 'ERROR');
      arquivosFaltando.push(arquivo);
    }
  }

  if (arquivosFaltando.length > 0) {
    log(`❌ ERRO CRÍTICO: ${arquivosFaltando.length} arquivo(s) crítico(s) faltando`, 'ERROR');
    throw new Error(`Arquivos críticos faltando: ${arquivosFaltando.join(', ')}`);
  }

  // 4. Verificar se backup.dump existe (opcional mas recomendado)
  const backupDump = path.join(BACKUP_DIR, 'database', 'backup.dump');
  try {
    await fs.access(backupDump);
    const stats = await fs.stat(backupDump);
    log(`✅ backup.dump encontrado (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
  } catch (e) {
    log(`⚠️  AVISO: backup.dump não encontrado (opcional)`, 'WARN');
    log(`   Continuando com validação de checksums...`);
  }

  log('');
  log('✅ Verificação de backup concluída com sucesso');
  log('');
  
  return true;
}

async function executarMigration() {
  log('============================================================');
  log(' EXECUTANDO MIGRATION V19');
  log('============================================================');
  log('');

  const migrationFile = path.join(__dirname, '..', '..', 'prisma', 'migrations', '20251205_v19_rls_indexes_migration.sql');
  
  try {
    await fs.access(migrationFile);
    log(`✅ Arquivo de migration encontrado: ${migrationFile}`);
  } catch (e) {
    log(`❌ ERRO: Arquivo de migration não encontrado: ${migrationFile}`, 'ERROR');
    throw new Error('Migration não encontrada');
  }

  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    log(`❌ ERRO: DATABASE_URL não configurada`, 'ERROR');
    throw new Error('DATABASE_URL não configurada');
  }

  log(`📋 Executando migration via psql...`);
  log(`   Arquivo: ${migrationFile}`);
  log('');

  try {
    // Executar migration via psql
    const command = `psql "${process.env.DATABASE_URL}" -f "${migrationFile}"`;
    log(`Executando: ${command}`);
    
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    log('✅ Migration executada com sucesso');
    log('');
    log('Saída:');
    log(output);
    
    return true;
  } catch (e) {
    log(`❌ ERRO ao executar migration: ${e.message}`, 'ERROR');
    if (e.stdout) log(`STDOUT: ${e.stdout}`);
    if (e.stderr) log(`STDERR: ${e.stderr}`);
    throw e;
  }
}

async function executarRollback() {
  log('');
  log('============================================================');
  log(' EXECUTANDO ROLLBACK AUTOMÁTICO');
  log('============================================================');
  log('');

  const rollbackScript = path.join(__dirname, '..', '..', 'BACKUP-V19-SNAPSHOT', 'rollback', 'rollback_all.sh');
  
  try {
    await fs.access(rollbackScript);
    log(`✅ Script de rollback encontrado: ${rollbackScript}`);
  } catch (e) {
    log(`⚠️  Script de rollback não encontrado, tentando rollback manual...`, 'WARN');
    // Rollback manual seria executado aqui
    return false;
  }

  try {
    log(`Executando rollback...`);
    execSync(`bash "${rollbackScript}"`, {
      encoding: 'utf8',
      stdio: 'inherit',
      env: { ...process.env }
    });
    log('✅ Rollback executado');
    return true;
  } catch (e) {
    log(`❌ ERRO ao executar rollback: ${e.message}`, 'ERROR');
    return false;
  }
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  logFile = path.join(LOG_DIR, `migration-${timestamp}.log`);
  
  await ensureDir(LOG_DIR);
  
  try {
    // Verificar backup
    await verificarBackup();
    
    // Perguntar confirmação (se não for modo --force)
    const args = process.argv.slice(2);
    const forceMode = args.includes('--force');
    
    if (!forceMode) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const resposta = await new Promise(resolve => {
        rl.question('\n⚠️  Deseja prosseguir com a migration? (s/N): ', resolve);
      });
      
      rl.close();
      
      if (resposta.toLowerCase() !== 's') {
        log('❌ Migration cancelada pelo usuário');
        process.exit(0);
      }
    }
    
    // Executar migration
    await executarMigration();
    
    log('');
    log('============================================================');
    log(' MIGRATION V19 CONCLUÍDA COM SUCESSO');
    log('============================================================');
    log('');
    log(`Log completo salvo em: ${logFile}`);
    
    process.exit(0);
  } catch (error) {
    log('');
    log('============================================================');
    log(' ERRO CRÍTICO - INICIANDO ROLLBACK');
    log('============================================================');
    log(`Erro: ${error.message}`, 'ERROR');
    log('');
    
    try {
      await executarRollback();
    } catch (rollbackError) {
      log(`❌ ERRO ao executar rollback: ${rollbackError.message}`, 'ERROR');
    }
    
    log(`Log completo salvo em: ${logFile}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verificarBackup, executarMigration };

