// Script de Teste: Rotas da Fase 9 - Etapa 1
// ============================================
// Data: 2025-01-12
// Status: Teste das rotas organizadas
// ============================================

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:8080';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

async function testRoute(method, path, expectedStatus = 200, data = null, headers = {}) {
  testResults.total++;
  try {
    const config = {
      method,
      url: `${API_URL}${path}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      validateStatus: () => true // Aceitar qualquer status
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      logSuccess(`${method} ${path} - Status ${response.status} (esperado: ${expectedStatus})`);
      testResults.passed++;
      return true;
    } else {
      logError(`${method} ${path} - Status ${response.status} (esperado: ${expectedStatus})`);
      testResults.failed++;
      testResults.errors.push(`${method} ${path}: Status ${response.status} != ${expectedStatus}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logWarning(`${method} ${path} - Servidor não está rodando (ECONNREFUSED)`);
      testResults.failed++;
      testResults.errors.push(`${method} ${path}: Servidor não está rodando`);
      return false;
    } else {
      logError(`${method} ${path} - Erro: ${error.message}`);
      testResults.failed++;
      testResults.errors.push(`${method} ${path}: ${error.message}`);
      return false;
    }
  }
}

async function runTests() {
  log('\n' + '='.repeat(50));
  log('🧪 TESTES DAS ROTAS ORGANIZADAS - FASE 9 ETAPA 1', 'cyan');
  log('='.repeat(50));
  
  logInfo(`Testando API em: ${API_URL}`);
  logInfo('Nota: Alguns testes podem falhar se o servidor não estiver rodando\n');

  // Teste 1: Health check
  log('\n📋 Teste 1: Health Check');
  log('─'.repeat(50));
  await testRoute('GET', '/health', 200);

  // Teste 2: Rotas de autenticação (deve retornar erro de validação, não 404)
  log('\n📋 Teste 2: Rotas de Autenticação');
  log('─'.repeat(50));
  await testRoute('POST', '/api/auth/register', 400); // Esperado: erro de validação
  await testRoute('POST', '/api/auth/login', 400); // Esperado: erro de validação

  // Teste 3: Rotas de usuário (deve retornar 401 não autenticado, não 404)
  log('\n📋 Teste 3: Rotas de Usuário');
  log('─'.repeat(50));
  await testRoute('GET', '/api/user/profile', 401); // Esperado: não autenticado
  await testRoute('PUT', '/api/user/profile', 401); // Esperado: não autenticado

  // Teste 4: Rotas de jogo (deve retornar 401 não autenticado, não 404)
  log('\n📋 Teste 4: Rotas de Jogo');
  log('─'.repeat(50));
  await testRoute('GET', '/api/games/status', 200); // Pode ser público
  await testRoute('POST', '/api/games/chutar', 401); // Esperado: não autenticado

  // Teste 5: Rotas de pagamento (deve retornar 401 não autenticado, não 404)
  log('\n📋 Teste 5: Rotas de Pagamento');
  log('─'.repeat(50));
  await testRoute('POST', '/api/payments/pix/criar', 401); // Esperado: não autenticado

  // Teste 6: Rotas admin (deve retornar 401 não autenticado, não 404)
  log('\n📋 Teste 6: Rotas Admin');
  log('─'.repeat(50));
  await testRoute('GET', '/api/admin/stats', 401); // Esperado: não autenticado

  // Resumo
  log('\n' + '='.repeat(50));
  log('📊 RESUMO DOS TESTES', 'cyan');
  log('='.repeat(50));
  log(`Total: ${testResults.total}`);
  log(`✅ Passou: ${testResults.passed}`, testResults.passed > 0 ? 'green' : 'red');
  log(`❌ Falhou: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  if (testResults.errors.length > 0) {
    log('\n⚠️ Erros encontrados:', 'yellow');
    testResults.errors.slice(0, 5).forEach((error, index) => {
      log(`   ${index + 1}. ${error}`, 'yellow');
    });
    if (testResults.errors.length > 5) {
      log(`   ... e mais ${testResults.errors.length - 5} erros`, 'yellow');
    }
  }
  
  log('='.repeat(50) + '\n');
  
  if (testResults.failed === 0) {
    logSuccess('🎉 Todos os testes passaram!');
  } else {
    logWarning(`⚠️  ${testResults.failed} teste(s) falharam.`);
    logInfo('Nota: Alguns testes podem falhar se o servidor não estiver rodando.');
    logInfo('Se todas as rotas retornarem 404, verifique se o servidor está rodando.');
  }
}

// Executar
runTests().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});


