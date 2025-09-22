const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
const appSimplePath = path.join(__dirname, 'src', 'App-simple.jsx');
const appBackupPath = path.join(__dirname, 'src', 'App-backup.jsx');

function switchToSimple() {
  try {
    // Fazer backup do App.jsx atual
    if (fs.existsSync(appPath)) {
      fs.copyFileSync(appPath, appBackupPath);
      console.log('✅ Backup do App.jsx criado');
    }
    
    // Copiar App-simple.jsx para App.jsx
    fs.copyFileSync(appSimplePath, appPath);
    console.log('✅ Alterado para versão simples');
    console.log('🌐 Acesse: http://localhost:5174');
    console.log('🧪 Teste: http://localhost:5174/test');
  } catch (error) {
    console.error('❌ Erro ao alterar para versão simples:', error.message);
  }
}

function switchToFull() {
  try {
    // Restaurar App.jsx original
    if (fs.existsSync(appBackupPath)) {
      fs.copyFileSync(appBackupPath, appPath);
      console.log('✅ Restaurado para versão completa');
    } else {
      console.log('❌ Backup não encontrado');
    }
  } catch (error) {
    console.error('❌ Erro ao restaurar versão completa:', error.message);
  }
}

function showStatus() {
  try {
    const appContent = fs.readFileSync(appPath, 'utf8');
    if (appContent.includes('SimpleLogin')) {
      console.log('📱 Status: Versão SIMPLES ativa');
    } else {
      console.log('🎮 Status: Versão COMPLETA ativa');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'simple':
    switchToSimple();
    break;
  case 'full':
    switchToFull();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log('🔧 Script de Alternância de Versões - Gol de Ouro Player');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  node switch-app.js simple  - Alterar para versão simples');
    console.log('  node switch-app.js full    - Restaurar versão completa');
    console.log('  node switch-app.js status  - Verificar versão ativa');
    console.log('');
    console.log('Versão simples: Ideal para testar se o React está funcionando');
    console.log('Versão completa: Aplicação com todas as funcionalidades');
}
