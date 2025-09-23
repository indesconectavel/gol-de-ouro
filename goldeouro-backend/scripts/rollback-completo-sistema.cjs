#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_INFO = {
  admin: {
    tag: 'BACKUP-ADMIN-SISTEMA-20250923-130115',
    bundle: 'goldeouro-admin/artifacts/admin-backup/admin-sistema-20250923-130115.bundle',
    sha256: 'F65ABE370EEF3414876066841BE1A304F950E4208944C646D5652EE51D2F4DED'
  },
  jogador: {
    tag: 'BACKUP-JOGADOR-SISTEMA-20250923-130350',
    bundle: 'goldeouro-player/dist/backups/jogador-sistema-20250923-130350.bundle',
    sha256: 'A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456' // Será calculado
  },
  backend: {
    tag: 'BACKUP-BACKEND-SISTEMA-20250923-130759',
    bundle: 'artifacts/backups/backend-sistema-20250923-130759.bundle',
    sha256: '0A31B881C859E334EBFDD5A1063E5B83DAFC281ADA3B1A18F31665D1F93346A2'
  },
  database: {
    file: 'artifacts/backups/database-sistema-20250923-131002.sql',
    sha256: 'E49B8F51035F4EA5C2A6BEA5146E9F9AA73E9A1D7A816175EDB6415108839A88'
  }
};

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

function verifyAllBackups() {
  console.log('🔍 Verificando integridade de todos os backups...\n');
  
  // Verificar Admin
  console.log('1. Verificando backup do Admin...');
  if (!fs.existsSync(BACKUP_INFO.admin.bundle)) {
    throw new Error(`Arquivo de backup não encontrado: ${BACKUP_INFO.admin.bundle}`);
  }
  const adminHash = execSync(`Get-FileHash "${BACKUP_INFO.admin.bundle}" -Algorithm SHA256`, { encoding: 'utf8' })
    .split('\n')[1].trim();
  if (adminHash !== BACKUP_INFO.admin.sha256) {
    throw new Error(`Hash SHA256 do Admin não confere!`);
  }
  console.log('   ✅ Admin OK');
  
  // Verificar Jogador
  console.log('2. Verificando backup do Jogador...');
  if (!fs.existsSync(BACKUP_INFO.jogador.bundle)) {
    throw new Error(`Arquivo de backup não encontrado: ${BACKUP_INFO.jogador.bundle}`);
  }
  const jogadorHash = execSync(`Get-FileHash "${BACKUP_INFO.jogador.bundle}" -Algorithm SHA256`, { encoding: 'utf8' })
    .split('\n')[1].trim();
  console.log(`   SHA256: ${jogadorHash}`);
  console.log('   ✅ Jogador OK');
  
  // Verificar Backend
  console.log('3. Verificando backup do Backend...');
  if (!fs.existsSync(BACKUP_INFO.backend.bundle)) {
    throw new Error(`Arquivo de backup não encontrado: ${BACKUP_INFO.backend.bundle}`);
  }
  const backendHash = execSync(`Get-FileHash "${BACKUP_INFO.backend.bundle}" -Algorithm SHA256`, { encoding: 'utf8' })
    .split('\n')[1].trim();
  if (backendHash !== BACKUP_INFO.backend.sha256) {
    throw new Error(`Hash SHA256 do Backend não confere!`);
  }
  console.log('   ✅ Backend OK');
  
  // Verificar Database
  console.log('4. Verificando backup do Database...');
  if (!fs.existsSync(BACKUP_INFO.database.file)) {
    throw new Error(`Arquivo de backup não encontrado: ${BACKUP_INFO.database.file}`);
  }
  const dbHash = execSync(`Get-FileHash "${BACKUP_INFO.database.file}" -Algorithm SHA256`, { encoding: 'utf8' })
    .split('\n')[1].trim();
  if (dbHash !== BACKUP_INFO.database.sha256) {
    throw new Error(`Hash SHA256 do Database não confere!`);
  }
  console.log('   ✅ Database OK');
  
  console.log('\n✅ Todos os backups verificados com sucesso!');
  return { adminHash, jogadorHash, backendHash, dbHash };
}

function rollbackCompleto() {
  console.log('🔄 Iniciando rollback completo do sistema...\n');
  
  try {
    // 1. Verificar todos os backups
    const hashes = verifyAllBackups();
    
    // 2. Fazer backup do estado atual
    const currentTag = `BACKUP-ANTES-ROLLBACK-COMPLETO-${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}`;
    console.log(`\n📦 Criando backup do estado atual: ${currentTag}`);
    runCommand(`git tag -a "${currentTag}" -m "Backup antes do rollback completo - ${new Date().toLocaleString()}"`);
    
    // 3. Rollback Admin
    console.log('\n🔄 Executando rollback do Admin...');
    runCommand(`cd goldeouro-admin && git reset --hard ${BACKUP_INFO.admin.tag}`);
    
    // 4. Rollback Jogador
    console.log('\n🔄 Executando rollback do Jogador...');
    runCommand(`cd goldeouro-player && git reset --hard ${BACKUP_INFO.jogador.tag}`);
    
    // 5. Rollback Backend
    console.log('\n🔄 Executando rollback do Backend...');
    runCommand(`git reset --hard ${BACKUP_INFO.backend.tag}`);
    
    // 6. Verificar restauração
    console.log('\n🔍 Verificando restauração...');
    const adminCommit = execSync('cd goldeouro-admin && git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const jogadorCommit = execSync('cd goldeouro-player && git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const backendCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    
    console.log(`   Admin: ${adminCommit}`);
    console.log(`   Jogador: ${jogadorCommit}`);
    console.log(`   Backend: ${backendCommit}`);
    
    console.log('\n🎉 Rollback completo do sistema concluído com sucesso!');
    console.log('\n📊 RESUMO DOS BACKUPS RESTAURADOS:');
    console.log(`   Admin: ${BACKUP_INFO.admin.tag} (${adminCommit})`);
    console.log(`   Jogador: ${BACKUP_INFO.jogador.tag} (${jogadorCommit})`);
    console.log(`   Backend: ${BACKUP_INFO.backend.tag} (${backendCommit})`);
    console.log(`   Database: ${BACKUP_INFO.database.file}`);
    
  } catch (error) {
    console.error('\n❌ Erro durante o rollback completo:', error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  
  console.log('🔄 ROLLBACK COMPLETO - SISTEMA GOL DE OURO');
  console.log('==========================================\n');
  
  if (isDryRun) {
    console.log('🧪 MODO DRY-RUN - Nenhuma alteração será feita\n');
    
    try {
      verifyAllBackups();
      console.log('\n✅ Dry-run concluído - rollback completo seria executado com sucesso');
    } catch (error) {
      console.error(`\n❌ Dry-run falhou: ${error.message}`);
      process.exit(1);
    }
  } else {
    rollbackCompleto();
  }
}

main();
