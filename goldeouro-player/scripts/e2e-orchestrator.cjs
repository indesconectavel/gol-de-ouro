#!/usr/bin/env node

/**
 * E2E Orchestrator - Gol de Ouro Player
 * 
 * Sobe backend e frontend automaticamente antes de executar os testes E2E
 * e derruba os processos ao final.
 */

const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');

// Configurações
const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5174';
const BACKEND_TIMEOUT = 120000; // 2 minutos
const FRONTEND_TIMEOUT = 120000; // 2 minutos
const HEALTH_CHECK_INTERVAL = 2000; // 2 segundos

// Processos
let backendProcess = null;
let frontendProcess = null;

// Função para aguardar URL responder
function waitForUrl(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkUrl = () => {
      const request = http.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ ${url} está respondendo`);
          resolve();
        } else {
          console.log(`⏳ ${url} retornou ${res.statusCode}, aguardando...`);
          setTimeout(checkUrl, HEALTH_CHECK_INTERVAL);
        }
      });
      
      request.on('error', (err) => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout aguardando ${url}: ${err.message}`));
        } else {
          console.log(`⏳ ${url} não está respondendo, aguardando...`);
          setTimeout(checkUrl, HEALTH_CHECK_INTERVAL);
        }
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout aguardando ${url}`));
        } else {
          setTimeout(checkUrl, HEALTH_CHECK_INTERVAL);
        }
      });
    };
    
    checkUrl();
  });
}

// Função para iniciar processo
function startProcess(command, args, cwd, name) {
  console.log(`🚀 Iniciando ${name}...`);
  console.log(`   Comando: ${command} ${args.join(' ')}`);
  console.log(`   Diretório: ${cwd}`);
  
  const process = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true
  });
  
  process.on('error', (err) => {
    console.error(`❌ Erro ao iniciar ${name}:`, err.message);
  });
  
  process.on('exit', (code) => {
    if (code !== 0) {
      console.log(`⚠️  ${name} saiu com código ${code}`);
    }
  });
  
  return process;
}

// Função para finalizar processos
function cleanup() {
  console.log('\n🧹 Finalizando processos...');
  
  if (backendProcess) {
    console.log('   Finalizando backend...');
    backendProcess.kill('SIGTERM');
    setTimeout(() => {
      if (!backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  if (frontendProcess) {
    console.log('   Finalizando frontend...');
    frontendProcess.kill('SIGTERM');
    setTimeout(() => {
      if (!frontendProcess.killed) {
        frontendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

// Função principal
async function main() {
  console.log('🎯 E2E Orchestrator - Gol de Ouro Player');
  console.log('==========================================\n');
  
  // Instalar trap para cleanup
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
  
  // Matar processos nas portas antes de começar
  console.log('🔪 Liberando portas 3000 e 5174...');
  const killProcess = spawn('node', ['scripts/kill-ports.cjs'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  await new Promise((resolve) => {
    killProcess.on('exit', resolve);
  });

  try {
    // 1. Iniciar Backend
    console.log('📡 Iniciando Backend...');
    backendProcess = startProcess('npm', ['run', 'dev:api'], path.join(__dirname, '..', '..'), 'Backend');
    
    // Aguardar backend ficar pronto
    console.log(`⏳ Aguardando backend em ${BACKEND_URL}...`);
    await waitForUrl(BACKEND_URL, BACKEND_TIMEOUT);
    
    // 2. Iniciar Frontend
    console.log('\n🎨 Iniciando Frontend...');
    frontendProcess = startProcess('npm', ['run', 'dev:player'], path.join(__dirname, '..'), 'Frontend');
    
    // Aguardar frontend ficar pronto
    console.log(`⏳ Aguardando frontend em ${FRONTEND_URL}...`);
    await waitForUrl(FRONTEND_URL, FRONTEND_TIMEOUT);
    
    // 3. Executar testes E2E
    console.log('\n🧪 Executando testes E2E...');
    console.log('==========================================\n');
    
    const testProcess = spawn('npm', ['run', 'test:e2e'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });
    
    const testExitCode = await new Promise((resolve) => {
      testProcess.on('exit', (code) => {
        console.log(`\n==========================================`);
        console.log(`🧪 Testes E2E finalizados com código: ${code}`);
        resolve(code);
      });
    });
    
    // 4. Cleanup
    cleanup();
    
    // Aguardar um pouco para os processos finalizarem
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n✅ E2E Orchestrator finalizado');
    process.exit(testExitCode);
    
  } catch (error) {
    console.error('\n❌ Erro no E2E Orchestrator:', error.message);
    cleanup();
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erro fatal:', error);
    cleanup();
    process.exit(1);
  });
}

module.exports = { main, cleanup };
