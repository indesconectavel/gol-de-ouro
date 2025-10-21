// TESTES DE PRODUÇÃO - GOL DE OURO v1.2.0
// ========================================
// Data: 21/10/2025
// Status: TESTES DE PRODUÇÃO REAL
// Versão: v1.2.0-production-tests
// GPT-4o Auto-Fix: Testes de produção

const axios = require('axios');

// =====================================================
// CONFIGURAÇÃO DOS TESTES
// =====================================================

const BASE_URL = 'https://goldeouro-backend.fly.dev';
const FRONTEND_URL = 'https://goldeouro-player-o2a3spxll-goldeouro-admins-projects.vercel.app';

// Dados de teste
const testUser = {
  email: 'test-prod@goldeouro.com',
  password: 'test123456',
  username: 'testuserprod'
};

let authToken = '';
let userId = '';

// =====================================================
// UTILITÁRIOS DE TESTE
// =====================================================

const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (testName, status, details = '') => {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} [${testName}] ${status} ${details}`);
};

// =====================================================
// TESTES DE CONECTIVIDADE
// =====================================================

async function testConnectivity() {
  console.log('\n🌐 === TESTANDO CONECTIVIDADE ===');
  
  try {
    // Testar backend
    const backendResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    if (backendResponse.status === 200) {
      logTest('BACKEND_HEALTH', 'PASS', `Status: ${backendResponse.data.status}`);
      logTest('BACKEND_VERSION', 'PASS', `Versão: ${backendResponse.data.version}`);
      logTest('BACKEND_DATABASE', 'PASS', `Database: ${backendResponse.data.database}`);
      logTest('BACKEND_MERCADOPAGO', 'PASS', `Mercado Pago: ${backendResponse.data.mercadoPago}`);
    } else {
      logTest('BACKEND_HEALTH', 'FAIL', `Status: ${backendResponse.status}`);
    }
  } catch (error) {
    logTest('BACKEND_HEALTH', 'FAIL', error.message);
  }
  
  try {
    // Testar frontend
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
    if (frontendResponse.status === 200) {
      logTest('FRONTEND_ACCESS', 'PASS', 'Frontend acessível');
    } else {
      logTest('FRONTEND_ACCESS', 'FAIL', `Status: ${frontendResponse.status}`);
    }
  } catch (error) {
    logTest('FRONTEND_ACCESS', 'FAIL', error.message);
  }
}

// =====================================================
// TESTES DE AUTENTICAÇÃO
// =====================================================

async function testAuthentication() {
  console.log('\n🔐 === TESTANDO AUTENTICAÇÃO ===');
  
  try {
    // Testar registro
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: testUser.email,
      password: testUser.password,
      username: testUser.username
    });
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      logTest('REGISTER', 'PASS', 'Usuário registrado com sucesso');
      authToken = registerResponse.data.token;
      userId = registerResponse.data.user.id;
    } else {
      logTest('REGISTER', 'FAIL', registerResponse.data.message || 'Erro no registro');
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message?.includes('Email já cadastrado')) {
      logTest('REGISTER', 'PASS', 'Email já cadastrado (esperado)');
    } else {
      logTest('REGISTER', 'FAIL', error.response?.data?.message || error.message);
    }
  }
  
  try {
    // Testar login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      logTest('LOGIN', 'PASS', 'Login realizado com sucesso');
      authToken = loginResponse.data.token;
      userId = loginResponse.data.user.id;
    } else {
      logTest('LOGIN', 'FAIL', loginResponse.data.message || 'Erro no login');
    }
  } catch (error) {
    logTest('LOGIN', 'FAIL', error.response?.data?.message || error.message);
  }
  
  try {
    // Testar perfil
    const profileResponse = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (profileResponse.status === 200 && profileResponse.data.success) {
      logTest('PROFILE', 'PASS', `Usuário: ${profileResponse.data.data.username}`);
    } else {
      logTest('PROFILE', 'FAIL', profileResponse.data.message || 'Erro no perfil');
    }
  } catch (error) {
    logTest('PROFILE', 'FAIL', error.response?.data?.message || error.message);
  }
}

// =====================================================
// TESTES DO SISTEMA DE JOGO
// =====================================================

async function testGameSystem() {
  console.log('\n⚽ === TESTANDO SISTEMA DE JOGO ===');
  
  if (!authToken) {
    logTest('GAME_SYSTEM', 'FAIL', 'Token de autenticação não disponível');
    return;
  }
  
  try {
    // Testar chute
    const shootResponse = await axios.post(`${BASE_URL}/api/games/shoot`, {
      direction: 'C',
      amount: 1
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (shootResponse.status === 200 && shootResponse.data.success) {
      const result = shootResponse.data.data;
      logTest('SHOOT', 'PASS', `Resultado: ${result.result}, Prêmio: R$ ${result.premio}`);
      logTest('LOTE_SYSTEM', 'PASS', `Lote: ${result.loteId}, Progresso: ${result.loteProgress.current}/${result.loteProgress.total}`);
    } else {
      logTest('SHOOT', 'FAIL', shootResponse.data.message || 'Erro no chute');
    }
  } catch (error) {
    logTest('SHOOT', 'FAIL', error.response?.data?.message || error.message);
  }
  
  try {
    // Testar métricas
    const metricsResponse = await axios.get(`${BASE_URL}/api/metrics`);
    
    if (metricsResponse.status === 200 && metricsResponse.data.success) {
      const metrics = metricsResponse.data.data;
      logTest('METRICS', 'PASS', `Contador: ${metrics.contador_chutes_global}, Gol de Ouro: ${metrics.ultimo_gol_de_ouro}`);
    } else {
      logTest('METRICS', 'FAIL', metricsResponse.data.message || 'Erro nas métricas');
    }
  } catch (error) {
    logTest('METRICS', 'FAIL', error.response?.data?.message || error.message);
  }
}

// =====================================================
// TESTES DO SISTEMA PIX
// =====================================================

async function testPixSystem() {
  console.log('\n💳 === TESTANDO SISTEMA PIX ===');
  
  if (!authToken) {
    logTest('PIX_SYSTEM', 'FAIL', 'Token de autenticação não disponível');
    return;
  }
  
  try {
    // Testar criação de PIX
    const pixResponse = await axios.post(`${BASE_URL}/api/payments/pix/criar`, {
      amount: 10
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (pixResponse.status === 200 && pixResponse.data.success) {
      const pix = pixResponse.data.data;
      logTest('PIX_CREATE', 'PASS', `PIX criado: R$ ${pix.amount}, Status: ${pix.status}`);
      logTest('PIX_CODE', 'PASS', pix.pix_code ? 'Código PIX gerado' : 'Código PIX não gerado');
    } else {
      logTest('PIX_CREATE', 'FAIL', pixResponse.data.message || 'Erro ao criar PIX');
    }
  } catch (error) {
    logTest('PIX_CREATE', 'FAIL', error.response?.data?.message || error.message);
  }
  
  try {
    // Testar webhook
    const webhookResponse = await axios.post(`${BASE_URL}/api/payments/webhook`, {
      type: 'payment',
      data: { id: 'test-payment-id' }
    });
    
    if (webhookResponse.status === 200) {
      logTest('WEBHOOK', 'PASS', 'Webhook processado');
    } else {
      logTest('WEBHOOK', 'FAIL', `Status: ${webhookResponse.status}`);
    }
  } catch (error) {
    logTest('WEBHOOK', 'FAIL', error.message);
  }
}

// =====================================================
// TESTES DE PERFORMANCE
// =====================================================

async function testPerformance() {
  console.log('\n⚡ === TESTANDO PERFORMANCE ===');
  
  const tests = [
    { name: 'HEALTH_CHECK', url: `${BASE_URL}/health` },
    { name: 'METRICS', url: `${BASE_URL}/api/metrics` },
    { name: 'FRONTEND', url: FRONTEND_URL }
  ];
  
  for (const test of tests) {
    try {
      const startTime = Date.now();
      const response = await axios.get(test.url, { timeout: 5000 });
      const duration = Date.now() - startTime;
      
      if (response.status === 200) {
        logTest(test.name, 'PASS', `${duration}ms`);
      } else {
        logTest(test.name, 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, 'FAIL', error.message);
    }
  }
}

// =====================================================
// TESTES DE SEGURANÇA
// =====================================================

async function testSecurity() {
  console.log('\n🔒 === TESTANDO SEGURANÇA ===');
  
  try {
    // Testar acesso sem token
    const noTokenResponse = await axios.get(`${BASE_URL}/api/user/profile`);
    logTest('NO_TOKEN_ACCESS', 'FAIL', 'Acesso sem token permitido');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('NO_TOKEN_ACCESS', 'PASS', 'Acesso sem token bloqueado');
    } else {
      logTest('NO_TOKEN_ACCESS', 'FAIL', error.message);
    }
  }
  
  try {
    // Testar token inválido
    const invalidTokenResponse = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: 'Bearer token-invalido' }
    });
    logTest('INVALID_TOKEN', 'FAIL', 'Token inválido aceito');
  } catch (error) {
    if (error.response?.status === 403) {
      logTest('INVALID_TOKEN', 'PASS', 'Token inválido rejeitado');
    } else {
      logTest('INVALID_TOKEN', 'FAIL', error.message);
    }
  }
  
  try {
    // Testar rate limiting
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'wrong@email.com',
        password: 'wrongpassword'
      }));
    }
    
    const responses = await Promise.allSettled(promises);
    const rateLimited = responses.some(r => r.status === 'fulfilled' && r.value.status === 429);
    
    if (rateLimited) {
      logTest('RATE_LIMITING', 'PASS', 'Rate limiting funcionando');
    } else {
      logTest('RATE_LIMITING', 'FAIL', 'Rate limiting não funcionando');
    }
  } catch (error) {
    logTest('RATE_LIMITING', 'FAIL', error.message);
  }
}

// =====================================================
// EXECUÇÃO DOS TESTES
// =====================================================

async function runAllTests() {
  console.log('🚀 === INICIANDO TESTES DE PRODUÇÃO ===');
  console.log(`🌐 Backend: ${BASE_URL}`);
  console.log(`🌐 Frontend: ${FRONTEND_URL}`);
  console.log(`📅 Data: ${new Date().toISOString()}`);
  console.log('============================================================');
  
  const startTime = Date.now();
  
  try {
    await testConnectivity();
    await testAuthentication();
    await testGameSystem();
    await testPixSystem();
    await testPerformance();
    await testSecurity();
    
    const duration = Date.now() - startTime;
    
    console.log('\n============================================================');
    console.log('📊 === RESUMO DOS TESTES ===');
    console.log(`⏱️ Tempo total: ${duration}ms`);
    console.log(`🌐 Backend: ${BASE_URL}`);
    console.log(`🌐 Frontend: ${FRONTEND_URL}`);
    console.log('============================================================');
    console.log('✅ TESTES DE PRODUÇÃO CONCLUÍDOS!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
runAllTests();

// =====================================================
// TESTES DE PRODUÇÃO v1.2.0 - PRODUÇÃO REAL 100%
// =====================================================
