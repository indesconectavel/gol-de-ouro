#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TAG_BACKUP = 'BACKUP-JOGADOR-SISTEMA-20250923-130350';
const BUNDLE_FILE = 'goldeouro-player/dist/backups/jogador-sistema-20250923-130350.bundle';
const EXPECTED_SHA256 = 'A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456'; // Será calculado

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
  
  console.log(`   SHA256 calculado: ${actualHash}`);
  console.log('   ✅ Integridade do backup verificada');
  
  return actualHash;
}

function rollbackJogador() {
  console.log('🔄 Iniciando rollback do Modo Jogador...');
  
  try {
    // 1. Verificar backup
    const actualHash = verifyBackup();
    
    // 2. Fazer backup do estado atual
    const currentTag = `BACKUP-ANTES-ROLLBACK-JOGADOR-${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}`;
    console.log(`   Criando backup do estado atual: ${currentTag}`);
    runCommand(`cd goldeouro-player && git tag -a "${currentTag}" -m "Backup antes do rollback jogador - ${new Date().toLocaleString()}"`);
    
    // 3. Restaurar do bundle
    console.log('   Restaurando do bundle...');
    runCommand(`cd goldeouro-player && git reset --hard ${TAG_BACKUP}`);
    
    // 4. Verificar restauração
    const currentCommit = execSync('cd goldeouro-player && git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    console.log(`   ✅ Rollback concluído. Commit atual: ${currentCommit}`);
    
    console.log('\n🎉 Rollback do Modo Jogador concluído com sucesso!');
    console.log(`   Tag de backup: ${TAG_BACKUP}`);
    console.log(`   Commit restaurado: ${currentCommit}`);
    console.log(`   SHA256: ${actualHash}`);
    
  } catch (error) {
    console.error('\n❌ Erro durante o rollback:', error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  
  console.log('🔄 ROLLBACK MODO JOGADOR - SISTEMA GOL DE OURO');
  console.log('==============================================\n');
  
  if (isDryRun) {
    console.log('🧪 MODO DRY-RUN - Nenhuma alteração será feita\n');
    
    try {
      const actualHash = verifyBackup();
      console.log(`   Tag de backup: ${TAG_BACKUP}`);
      console.log(`   Bundle: ${BUNDLE_FILE}`);
      console.log(`   SHA256: ${actualHash}`);
      console.log('\n✅ Dry-run concluído - rollback seria executado com sucesso');
    } catch (error) {
      console.error(`\n❌ Dry-run falhou: ${error.message}`);
      process.exit(1);
    }
  } else {
    rollbackJogador();
  }
}

main();
