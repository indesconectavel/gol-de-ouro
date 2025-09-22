#!/usr/bin/env node
/**
 * Script de Rollback - Sidebar Icons
 * Restaura o estado anterior antes das alterações da sidebar
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔄 SCRIPT DE ROLLBACK - SIDEBAR ICONS');
console.log('=====================================');

try {
  // 1. Verificar se estamos no diretório correto
  if (!fs.existsSync('package.json')) {
    console.error('❌ Execute este script no diretório do frontend (goldeouro-player)');
    process.exit(1);
  }

  // 2. Listar tags disponíveis
  console.log('\n📋 Tags de backup disponíveis:');
  try {
    const tags = execSync('git tag --sort=-creatordate | head -10', { encoding: 'utf8' });
    console.log(tags);
  } catch (error) {
    console.log('⚠️ Nenhuma tag encontrada');
  }

  // 3. Restaurar para o último backup
  const lastBackupTag = 'BACKUP-SIDEBAR-ICONS-2025-09-21-22-46-32';
  
  console.log(`\n🔄 Restaurando para: ${lastBackupTag}`);
  
  // Reset para o commit do backup
  execSync(`git reset --hard ${lastBackupTag}`, { stdio: 'inherit' });
  
  console.log('✅ Rollback concluído com sucesso!');
  console.log('🌐 Reinicie o servidor com: npm run dev');
  
} catch (error) {
  console.error('❌ Erro durante o rollback:', error.message);
  process.exit(1);
}
