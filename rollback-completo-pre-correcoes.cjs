#!/usr/bin/env node
// Script de Rollback Completo - Gol de Ouro
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const timestamp = process.argv[2] || '20250923-1820';
const backupTag = `BACKUP-PRE-CORRECOES-${timestamp}`;

console.log(`🔄 Iniciando rollback para ${backupTag}...`);

try {
  // Verificar se o bundle existe
  const bundlePath = `BACKUP-PRE-CORRECOES-${timestamp}.bundle`;
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Bundle não encontrado: ${bundlePath}`);
  }
  
  // Restaurar do bundle
  console.log('📦 Restaurando do bundle...');
  execSync(`git bundle verify ${bundlePath}`, { stdio: 'inherit' });
  execSync(`git fetch ${bundlePath} ${backupTag}:${backupTag}`, { stdio: 'inherit' });
  execSync(`git checkout ${backupTag}`, { stdio: 'inherit' });
  
  console.log('✅ Rollback concluído com sucesso!');
  console.log(`📋 Tag restaurada: ${backupTag}`);
  
} catch (error) {
  console.error('❌ Erro no rollback:', error.message);
  process.exit(1);
}
