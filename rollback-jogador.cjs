#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const PLAYER_DIR = path.join(__dirname);

function rollbackJogador() {
  console.log('🔄 Iniciando rollback do Modo Jogador...');
  
  try {
    // Navegar para o diretório do player
    process.chdir(PLAYER_DIR);
    
    // Verificar se estamos no diretório correto
    const currentDir = process.cwd();
    console.log(`📁 Diretório atual: ${currentDir}`);
    
    // Verificar hash atual
    console.log('📊 Hash atual:');
    const currentHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log(currentHash);
    
    // Verificar se a tag de backup existe
    console.log('🔍 Verificando tag de backup...');
    try {
      const tagHash = execSync('git rev-parse STABLE-JOGADOR-20250922', { encoding: 'utf8' }).trim();
      console.log(`✅ Tag encontrada: ${tagHash}`);
    } catch (error) {
      console.error('❌ Tag de backup não encontrada!');
      process.exit(1);
    }
    
    // Fazer o rollback
    console.log('🔄 Executando rollback...');
    execSync('git reset --hard STABLE-JOGADOR-20250922', { stdio: 'inherit' });
    
    // Verificar hash após rollback
    console.log('📊 Hash após rollback:');
    const newHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log(newHash);
    
    console.log('✅ Rollback concluído com sucesso!');
    console.log('🎯 O Modo Jogador foi restaurado para o estado do backup.');
    
  } catch (error) {
    console.error('❌ Erro durante o rollback:', error.message);
    console.error('Certifique-se de que você está no diretório correto e que a tag de backup existe.');
    process.exit(1);
  }
}

// Verificar se é dry-run
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🧪 MODO DRY-RUN - Nenhuma alteração será feita');
  console.log('📊 Hash atual:', execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim());
  console.log('🏷️ Tag de backup:', execSync('git rev-parse STABLE-JOGADOR-20250922', { encoding: 'utf8' }).trim());
  console.log('✅ Dry-run concluído - rollback seria executado com sucesso');
} else {
  rollbackJogador();
}

