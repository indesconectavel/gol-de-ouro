#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TAG_BACKUP = 'BACKUP-BACKEND-SISTEMA-20250923-130759';
const BUNDLE_FILE = 'artifacts/backups/backend-sistema-20250923-130759.bundle';
const EXPECTED_SHA256 = '0A31B881C859E334EBFDD5A1063E5B83DAFC281ADA3B1A18F31665D1F93346A2';

function runCommand(command, options = {}) {
  try {
    console.log(`   Executando: ${command}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'inherit', ...options });
    return result;
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
    throw error;
  }
}

function verifyBackup() {
  console.log('🔍 Verificando integridade do backup...');
  
  if (!fs.existsSync(BUNDLE_FILE)) {
    throw new Error(`Arquivo de backup não encontrado: ${BUNDLE_FILE}`);
  }
  
  const actualHash = execSync(`Get-FileHash "${BUNDLE_FILE}" -Algorithm SHA256`, { encoding: 'utf8' })
    .split('\n')[1].trim();
  
  if (actualHash !== EXPECTED_SHA256) {
    throw new Error(`Hash SHA256 não confere! Esperado: ${EXPECTED_SHA256}, Atual: ${actualHash}`);
  }
  
  console.log('   ✅ Integridade do backup verificada');
}

function rollbackBackend() {
  console.log('🔄 Iniciando rollback do Backend...');
  
  try {
    // 1. Verificar backup
    verifyBackup();
    
    // 2. Fazer backup do estado atual
    const currentTag = `BACKUP-ANTES-ROLLBACK-BACKEND-${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}`;
    console.log(`   Criando backup do estado atual: ${currentTag}`);
    runCommand(`git tag -a "${currentTag}" -m "Backup antes do rollback backend - ${new Date().toLocaleString()}"`);
    
    // 3. Restaurar do bundle
    console.log('   Restaurando do bundle...');
    runCommand(`git reset --hard ${TAG_BACKUP}`);
    
    // 4. Verificar restauração
    const currentCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    console.log(`   ✅ Rollback concluído. Commit atual: ${currentCommit}`);
    
    console.log('\n🎉 Rollback do Backend concluído com sucesso!');
    console.log(`   Tag de backup: ${TAG_BACKUP}`);
    console.log(`   Commit restaurado: ${currentCommit}`);
    
  } catch (error) {
    console.error('\n❌ Erro durante o rollback:', error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  
  console.log('🔄 ROLLBACK BACKEND - SISTEMA GOL DE OURO');
  console.log('=========================================\n');
  
  if (isDryRun) {
    console.log('🧪 MODO DRY-RUN - Nenhuma alteração será feita\n');
    
    try {
      verifyBackup();
      console.log(`   Tag de backup: ${TAG_BACKUP}`);
      console.log(`   Bundle: ${BUNDLE_FILE}`);
      console.log(`   SHA256: ${EXPECTED_SHA256}`);
      console.log('\n✅ Dry-run concluído - rollback seria executado com sucesso');
    } catch (error) {
      console.error(`\n❌ Dry-run falhou: ${error.message}`);
      process.exit(1);
    }
  } else {
    rollbackBackend();
  }
}

main();
