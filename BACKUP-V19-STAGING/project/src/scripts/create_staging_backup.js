/**
 * CREATE STAGING BACKUP - Cria backup completo antes da migration V19
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'BACKUP-V19-STAGING');
const PROJECT_ROOT = path.join(__dirname, '..', '..');

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}

async function calcularChecksum(arquivo) {
  const content = await fs.readFile(arquivo);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function contarArquivos(dir, ignorePatterns = []) {
  let count = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(PROJECT_ROOT, fullPath);
    
    // Ignorar padrões
    if (ignorePatterns.some(pattern => relativePath.includes(pattern))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      if (!relativePath.includes('BACKUP-V19') && !relativePath.includes('node_modules')) {
        count += await contarArquivos(fullPath, ignorePatterns);
      }
    } else {
      count++;
    }
  }
  
  return count;
}

async function criarSnapshotArquivos() {
  console.log('📦 Criando snapshot de arquivos...');
  
  const projectBackupDir = path.join(BACKUP_DIR, 'project');
  await ensureDir(projectBackupDir);
  
  // Lista de diretórios/arquivos a copiar
  const itemsToBackup = [
    'src',
    'prisma',
    'scripts',
    'config',
    'database',
    'server-fly.js',
    'package.json',
    '.env.local',
    'package-lock.json'
  ];
  
  let filesCopied = 0;
  
  for (const item of itemsToBackup) {
    const sourcePath = path.join(PROJECT_ROOT, item);
    const destPath = path.join(projectBackupDir, item);
    
    try {
      const stats = await fs.stat(sourcePath);
      
      if (stats.isDirectory()) {
        // Copiar diretório recursivamente
        await fs.cp(sourcePath, destPath, { recursive: true });
        const count = await contarArquivos(sourcePath);
        filesCopied += count;
        console.log(`   ✅ ${item}/ (${count} arquivos)`);
      } else {
        // Copiar arquivo
        await fs.copyFile(sourcePath, destPath);
        filesCopied++;
        console.log(`   ✅ ${item}`);
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log(`   ⚠️  ${item} não encontrado (ignorado)`);
      } else {
        throw e;
      }
    }
  }
  
  return filesCopied;
}

async function gerarChecksums() {
  console.log('\n🔐 Gerando checksums...');
  
  const checksums = {};
  const projectBackupDir = path.join(BACKUP_DIR, 'project');
  
  async function processarDiretorio(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(projectBackupDir, fullPath);
      
      if (entry.isDirectory()) {
        await processarDiretorio(fullPath);
      } else {
        try {
          const checksum = await calcularChecksum(fullPath);
          checksums[relativePath] = checksum;
        } catch (e) {
          console.log(`   ⚠️  Erro ao calcular checksum de ${relativePath}: ${e.message}`);
        }
      }
    }
  }
  
  await processarDiretorio(projectBackupDir);
  
  const checksumFile = path.join(BACKUP_DIR, 'checksums.json');
  await fs.writeFile(checksumFile, JSON.stringify(checksums, null, 2));
  
  console.log(`   ✅ ${Object.keys(checksums).length} checksums gerados`);
  
  return checksums;
}

async function tentarDumpBanco() {
  console.log('\n💾 Tentando criar dump do banco...');
  
  require('dotenv').config({ path: '.env.local' });
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('   ⚠️  DATABASE_URL não configurada - pulando dump');
    return { success: false, error: 'DATABASE_URL não configurada' };
  }
  
  const dumpFile = path.join(BACKUP_DIR, 'database', 'backup.dump');
  await ensureDir(path.dirname(dumpFile));
  
  try {
    // Tentar pg_dump
    execSync(`pg_dump "${dbUrl}" -F c -f "${dumpFile}"`, {
      stdio: 'pipe',
      timeout: 30000
    });
    
    const stats = await fs.stat(dumpFile);
    const checksum = await calcularChecksum(dumpFile);
    
    console.log(`   ✅ Dump criado: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   ✅ Checksum: ${checksum.substring(0, 16)}...`);
    
    return { success: true, file: dumpFile, size: stats.size, checksum };
  } catch (error) {
    console.log(`   ⚠️  Não foi possível criar dump: ${error.message}`);
    console.log('   💡 Instrução alternativa:');
    console.log('      1. Acesse Supabase Dashboard → Database');
    console.log('      2. Clique em "Backups"');
    console.log('      3. Crie um backup manual');
    
    return { success: false, error: error.message, alternativa: 'Supabase Dashboard' };
  }
}

async function main() {
  console.log('============================================================');
  console.log(' BACKUP PRÉ-MIGRATION V19');
  console.log('============================================================\n');
  
  const timestamp = new Date().toISOString();
  const backupReport = {
    timestamp,
    etapa: 'BACKUP_PRE_MIGRATION',
    files_count: 0,
    checksums: {},
    dump_status: {}
  };
  
  try {
    // Criar snapshot de arquivos
    const filesCount = await criarSnapshotArquivos();
    backupReport.files_count = filesCount;
    
    // Gerar checksums
    const checksums = await gerarChecksums();
    backupReport.checksums = checksums;
    
    // Tentar dump do banco
    const dumpResult = await tentarDumpBanco();
    backupReport.dump_status = dumpResult;
    
    // Salvar relatório
    const reportFile = path.join(BACKUP_DIR, 'backup.json');
    await fs.writeFile(reportFile, JSON.stringify(backupReport, null, 2));
    
    console.log('\n============================================================');
    console.log(' BACKUP CONCLUÍDO');
    console.log('============================================================');
    console.log(`✅ Arquivos copiados: ${filesCount}`);
    console.log(`✅ Checksums gerados: ${Object.keys(checksums).length}`);
    console.log(`✅ Dump do banco: ${dumpResult.success ? 'SIM' : 'NÃO (use Supabase Dashboard)'}`);
    console.log(`\n📄 Relatório: ${reportFile}`);
    
    return backupReport;
  } catch (error) {
    console.error('\n❌ ERRO ao criar backup:', error.message);
    throw error;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Falha no backup:', error);
    process.exit(1);
  });
}

module.exports = { main };

