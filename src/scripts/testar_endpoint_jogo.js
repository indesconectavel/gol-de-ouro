/**
 * SCRIPT PARA TESTAR ENDPOINT /jogo
 */

const axios = require('axios');
const BASE_URL = process.env.API_URL || 'https://goldeouro-backend-v2.fly.dev';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

async function testEndpoint(method, path, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      timeout: 10000,
      validateStatus: () => true,
      headers
    };

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    const status = response.status;
    const statusColor = status >= 200 && status < 300 ? 'green' : status >= 400 && status < 500 ? 'yellow' : 'red';
    
    log(`  ${method} ${path}`, statusColor);
    log(`    Status: ${status}`, statusColor);
    log(`    Tempo: ${duration}ms`, statusColor);
    
    if (status >= 200 && status < 300) {
      log(`    ✅ Sucesso`, 'green');
      return { success: true, status, duration, data: response.data };
    } else {
      log(`    ⚠️  Erro`, 'yellow');
      if (response.data) {
        log(`    Resposta: ${JSON.stringify(response.data).substring(0, 200)}`, 'yellow');
      }
      return { success: false, status, duration, error: response.data };
    }
  } catch (error) {
    log(`  ${method} ${path}`, 'red');
    log(`    ❌ Erro: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testLogin() {
  logSection('1️⃣  TESTE DE LOGIN');
  
  const result = await testEndpoint('POST', '/api/auth/login', {
    email: 'free10signer@gmail.com',
    password: 'Free10signer'
  });

  if (result.success && result.data) {
    // Tentar diferentes formatos de resposta
    const token = result.data.token || result.data.data?.token || result.data.data?.accessToken;
    if (token) {
      log(`  ✅ Token obtido: ${token.substring(0, 20)}...`, 'green');
      return token;
    } else {
      log(`  ⚠️  Resposta não contém token: ${JSON.stringify(result.data).substring(0, 200)}`, 'yellow');
    }
  }
  return null;
}

async function main() {
  logSection('🚀 TESTE DO ENDPOINT /jogo');
  
  log(`URL Base: ${BASE_URL}`, 'blue');
  log(`Timestamp: ${new Date().toISOString()}\n`, 'blue');

  // 1. Fazer login
  const token = await testLogin();
  
  if (!token) {
    log('\n❌ Não foi possível fazer login - abortando testes', 'red');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  // 2. Testar endpoints relacionados ao jogo
  logSection('2️⃣  TESTE DE ENDPOINTS DO JOGO');

  const endpoints = [
    { method: 'GET', path: '/api/games/status', description: 'Status do jogo' },
    { method: 'GET', path: '/api/games/stats', description: 'Estatísticas do jogo' },
    { method: 'GET', path: '/api/games/history', description: 'Histórico de chutes' },
    { method: 'POST', path: '/api/games/shoot', data: { direction: 'left', amount: 5.00 }, description: 'Fazer chute' }
  ];

  const results = {};
  
  for (const endpoint of endpoints) {
    results[endpoint.path] = await testEndpoint(
      endpoint.method,
      endpoint.path,
      endpoint.data,
      headers
    );
  }

  // Resumo
  logSection('📊 RESUMO DOS TESTES');
  
  const passed = Object.values(results).filter(r => r && r.success).length;
  const total = Object.keys(results).length;

  log(`Total de testes: ${total}`, 'blue');
  log(`✅ Passou: ${passed}`, 'green');
  log(`❌ Falhou: ${total - passed}`, total - passed > 0 ? 'red' : 'green');

  console.log('\n' + '='.repeat(70));
  
  // Detalhes
  console.log('\n📋 DETALHES:');
  Object.entries(results).forEach(([path, result]) => {
    if (result) {
      log(`\n  ${path}:`, result.success ? 'green' : 'red');
      log(`    Status: ${result.status}`, result.success ? 'green' : 'red');
      log(`    Tempo: ${result.duration}ms`, 'blue');
      if (result.error) {
        log(`    Erro: ${JSON.stringify(result.error).substring(0, 200)}`, 'yellow');
      }
    }
  });

  console.log('\n' + '='.repeat(70));
  
  if (passed === total) {
    log('\n🎉 TODOS OS TESTES PASSARAM!', 'green');
    log('✅ Endpoint /jogo está funcional!', 'green');
  } else {
    log('\n⚠️  ALGUNS TESTES FALHARAM', 'yellow');
    log('⚠️  Verifique os detalhes acima', 'yellow');
  }

  console.log('\n');
}

main().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

