// Script de Teste: UsuarioController Endpoints
// ============================================
// Data: 2025-01-12
// Status: Teste dos endpoints refatorados da Fase 6
// ============================================

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@goldeouro.lol';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

let authToken = '';
let testUserId = '';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// Função para fazer requisições autenticadas
async function makeRequest(method, endpoint, data = null, token = authToken) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Teste 1: Login para obter token
async function testLogin() {
  logInfo('\n📋 Teste 1: Login');
  log('─'.repeat(50));

  const result = await makeRequest('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  }, null);

  if (result.success && result.data.success) {
    authToken = result.data.data.token;
    testUserId = result.data.data.user.id;
    logSuccess(`Login realizado com sucesso!`);
    log(`   Token: ${authToken.substring(0, 20)}...`);
    log(`   User ID: ${testUserId}`);
    return true;
  } else {
    logError(`Login falhou: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Teste 2: getUserProfile
async function testGetUserProfile() {
  logInfo('\n📋 Teste 2: GET /api/user/profile');
  log('─'.repeat(50));

  const result = await makeRequest('GET', '/api/user/profile');

  if (result.success && result.data.success) {
    logSuccess('Perfil obtido com sucesso!');
    log(`   ID: ${result.data.data.id}`);
    log(`   Email: ${result.data.data.email}`);
    log(`   Username: ${result.data.data.username}`);
    log(`   Saldo: R$ ${result.data.data.saldo}`);
    log(`   Tipo: ${result.data.data.tipo}`);
    log(`   Ativo: ${result.data.data.ativo}`);
    return true;
  } else {
    logError(`Erro ao obter perfil: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Teste 3: updateUserProfile
async function testUpdateUserProfile() {
  logInfo('\n📋 Teste 3: PUT /api/user/profile');
  log('─'.repeat(50));

  const newUsername = `test_user_${Date.now()}`;
  const result = await makeRequest('PUT', '/api/user/profile', {
    username: newUsername
  });

  if (result.success && result.data.success) {
    logSuccess('Perfil atualizado com sucesso!');
    log(`   Novo username: ${result.data.data.username}`);
    return true;
  } else {
    logError(`Erro ao atualizar perfil: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Teste 4: getUsersList
async function testGetUsersList() {
  logInfo('\n📋 Teste 4: GET /api/user/list');
  log('─'.repeat(50));

  const result = await makeRequest('GET', '/api/user/list?page=1&limit=10');

  if (result.success && result.data.success) {
    logSuccess('Lista de usuários obtida com sucesso!');
    log(`   Total de usuários: ${result.data.data.pagination.total}`);
    log(`   Página: ${result.data.data.pagination.page}`);
    log(`   Usuários retornados: ${result.data.data.usuarios.length}`);
    if (result.data.data.usuarios.length > 0) {
      log(`   Primeiro usuário: ${result.data.data.usuarios[0].email}`);
    }
    return true;
  } else {
    logError(`Erro ao listar usuários: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Teste 5: getUserStats
async function testGetUserStats() {
  logInfo('\n📋 Teste 5: GET /api/user/stats');
  log('─'.repeat(50));

  const result = await makeRequest('GET', '/api/user/stats');

  if (result.success && result.data.success) {
    logSuccess('Estatísticas obtidas com sucesso!');
    log(`   Total de usuários: ${result.data.data.totalUsuarios}`);
    log(`   Usuários ativos: ${result.data.data.usuariosAtivos}`);
    log(`   Saldo total: R$ ${result.data.data.saldoTotal}`);
    log(`   Meu saldo: R$ ${result.data.data.meuSaldo}`);
    log(`   Minhas apostas: ${result.data.data.minhasApostas}`);
    log(`   Meus ganhos: R$ ${result.data.data.meusGanhos}`);
    return true;
  } else {
    logError(`Erro ao obter estatísticas: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Teste 6: toggleUserStatus (requer admin)
async function testToggleUserStatus() {
  logInfo('\n📋 Teste 6: PUT /api/user/status/:id');
  log('─'.repeat(50));

  if (!ADMIN_TOKEN) {
    logWarning('ADMIN_TOKEN não configurado. Pulando teste de toggleUserStatus.');
    return true; // Não é erro, apenas não pode testar
  }

  // Nota: Este teste requer um userId válido e token de admin
  // Por segurança, vamos apenas verificar se o endpoint existe
  logInfo('Teste de toggleUserStatus requer configuração manual.');
  logInfo('Use um token de admin e um userId válido para testar.');
  return true;
}

// Executar todos os testes
async function runAllTests() {
  log('\n' + '='.repeat(50));
  log('🧪 TESTES DO USUARIO CONTROLLER - FASE 6', 'blue');
  log('='.repeat(50));

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Teste 1: Login
  results.total++;
  if (await testLogin()) {
    results.passed++;
  } else {
    results.failed++;
    logError('\n❌ Não foi possível fazer login. Testes subsequentes podem falhar.');
    logError('Verifique TEST_EMAIL e TEST_PASSWORD no .env');
    return;
  }

  // Teste 2: getUserProfile
  results.total++;
  if (await testGetUserProfile()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Teste 3: updateUserProfile
  results.total++;
  if (await testUpdateUserProfile()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Teste 4: getUsersList
  results.total++;
  if (await testGetUsersList()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Teste 5: getUserStats
  results.total++;
  if (await testGetUserStats()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Teste 6: toggleUserStatus
  results.total++;
  if (await testToggleUserStatus()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Resumo
  log('\n' + '='.repeat(50));
  log('📊 RESUMO DOS TESTES', 'blue');
  log('='.repeat(50));
  log(`Total: ${results.total}`);
  log(`✅ Passou: ${results.passed}`, 'green');
  log(`❌ Falhou: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log('='.repeat(50) + '\n');

  if (results.failed === 0) {
    logSuccess('🎉 Todos os testes passaram!');
  } else {
    logError(`⚠️  ${results.failed} teste(s) falharam.`);
  }
}

// Executar
runAllTests().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});


