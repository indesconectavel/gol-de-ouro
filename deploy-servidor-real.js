// SCRIPT DE DEPLOY AUTOMATIZADO - SERVIDOR REAL
// Data: 16 de Outubro de 2025
// Objetivo: Deploy automático do servidor real para produção

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Executando: ${command}`);
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        log(`❌ Erro: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        log(`⚠️ Stderr: ${stderr}`);
      }
      if (stdout) {
        log(`✅ Output: ${stdout.trim()}`);
      }
      resolve(stdout);
    });
  });
}

async function deployToFlyIo() {
  log('🚀 Iniciando deploy para Fly.io...');
  
  try {
    // Verificar se fly CLI está instalado
    await executeCommand('fly version');
    
    // Verificar se está autenticado
    await executeCommand('fly auth whoami');
    
    // Fazer deploy
    await executeCommand('fly deploy');
    
    log('✅ Deploy para Fly.io concluído com sucesso!');
    return true;
  } catch (error) {
    log(`❌ Erro no deploy para Fly.io: ${error.message}`);
    return false;
  }
}

async function verifyDeploy() {
  log('🔍 Verificando deploy...');
  
  try {
    // Verificar status
    await executeCommand('fly status');
    
    // Verificar logs
    await executeCommand('fly logs --limit 10');
    
    // Testar health check
    const axios = require('axios');
    const response = await axios.get('https://goldeouro-backend.fly.dev/health');
    
    if (response.status === 200 && response.data.ok) {
      log('✅ Health check OK');
      log(`   Database: ${response.data.database}`);
      log(`   PIX: ${response.data.pix}`);
      log(`   Authentication: ${response.data.authentication}`);
      return true;
    } else {
      log('❌ Health check falhou');
      return false;
    }
  } catch (error) {
    log(`❌ Erro na verificação: ${error.message}`);
    return false;
  }
}

async function runDeploy() {
  log('🚀 INICIANDO DEPLOY DO SERVIDOR REAL');
  log('=' * 50);
  
  try {
    // Passo 1: Verificar arquivos necessários
    log('🔍 Verificando arquivos necessários...');
    
    const requiredFiles = [
      'server-real-unificado.js',
      'Dockerfile',
      'package.json',
      '.env'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        log(`❌ Arquivo necessário não encontrado: ${file}`);
        return false;
      }
      log(`✅ ${file} encontrado`);
    }
    
    // Passo 2: Deploy
    const deploySuccess = await deployToFlyIo();
    if (!deploySuccess) {
      log('❌ Deploy falhou');
      return false;
    }
    
    // Passo 3: Verificar deploy
    const verifySuccess = await verifyDeploy();
    if (!verifySuccess) {
      log('❌ Verificação do deploy falhou');
      return false;
    }
    
    log('\n🎉 DEPLOY CONCLUÍDO COM SUCESSO!');
    log('✅ Servidor REAL em produção!');
    log('🌐 URL: https://goldeouro-backend.fly.dev');
    
    return true;
  } catch (error) {
    log(`❌ Erro fatal no deploy: ${error.message}`);
    return false;
  }
}

// Executar deploy se chamado diretamente
if (require.main === module) {
  runDeploy()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Erro fatal: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runDeploy, deployToFlyIo, verifyDeploy };
