require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.BACKEND_URL || 'https://goldeouro-backend.fly.dev';
const JWT_SECRET = process.env.JWT_SECRET || 'goldeouro-secret-key-2025';

// Configurações de teste
const TEST_USER_EMAIL = 'teste-aprendizado@example.com';
const TEST_USER_PASSWORD = 'senha123456';
const TEST_USER_NAME = 'Teste Aprendizado';

let authToken = '';
let testUserId = '';

// Métricas de aprendizado
const learningMetrics = {
  routeCompatibility: { tests: 0, passed: 0, failed: 0, issues: [] },
  authentication: { tests: 0, passed: 0, failed: 0, issues: [] },
  dataConsistency: { tests: 0, passed: 0, failed: 0, issues: [] },
  integration: { tests: 0, passed: 0, failed: 0, issues: [] }
};

// Função para registrar métricas de aprendizado
function recordLearningMetric(category, success, issue = null) {
  learningMetrics[category].tests++;
  if (success) {
    learningMetrics[category].passed++;
  } else {
    learningMetrics[category].failed++;
    if (issue) {
      learningMetrics[category].issues.push(issue);
    }
  }
}

// =====================================================
// FASE 1: MAPEAMENTO DE ROTAS E COMPATIBILIDADE
// =====================================================

async function testRouteCompatibility() {
  console.log('🔍 FASE 1: MAPEAMENTO DE ROTAS E COMPATIBILIDADE');
  console.log('-'.repeat(60));
  
  // Rotas que o frontend pode chamar (baseado nos erros anteriores)
  const frontendRoutes = [
    { method: 'GET', path: '/meta', description: 'Metadados do sistema' },
    { method: 'POST', path: '/auth/login', description: 'Login de usuário' },
    { method: 'GET', path: '/usuario/perfil', description: 'Perfil do usuário' },
    { method: 'GET', path: '/api/user/profile', description: 'Perfil do usuário (API)' },
    { method: 'GET', path: '/api/payments/pix/usuario', description: 'PIX do usuário' },
    { method: 'POST', path: '/api/payments/pix/criar', description: 'Criar PIX' },
    { method: 'GET', path: '/api/metrics', description: 'Métricas do sistema' },
    { method: 'GET', path: '/health', description: 'Health check' },
    { method: 'POST', path: '/api/games/shoot', description: 'Chutar no jogo' },
    { method: 'GET', path: '/api/fila/entrar', description: 'Entrar na fila' }
  ];

  console.log('📋 Testando compatibilidade de rotas...');
  
  for (const route of frontendRoutes) {
    try {
      const config = {
        method: route.method.toLowerCase(),
        url: `${BASE_URL}${route.path}`,
        timeout: 10000,
        validateStatus: () => true // Aceitar qualquer status
      };

      // Adicionar headers de autenticação se necessário
      if (authToken && route.path.includes('/usuario/') || route.path.includes('/api/user/') || route.path.includes('/api/payments/')) {
        config.headers = { Authorization: `Bearer ${authToken}` };
      }

      // Adicionar body para POST
      if (route.method === 'POST') {
        if (route.path === '/auth/login') {
          config.data = { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD };
        } else if (route.path === '/api/payments/pix/criar') {
          config.data = { amount: 10 };
        } else if (route.path === '/api/games/shoot') {
          config.data = { direction: 'center', amount: 1 };
        }
      }

      const response = await axios(config);
      
      // Considerar sucesso se não for 404 (rota não encontrada)
      const isSuccess = response.status !== 404;
      
      recordLearningMetric('routeCompatibility', isSuccess, 
        isSuccess ? null : `Rota ${route.method} ${route.path} retornou 404`);
      
      const status = isSuccess ? '✅' : '❌';
      console.log(`${status} ${route.method} ${route.path} - ${response.status} (${route.description})`);
      
    } catch (error) {
      recordLearningMetric('routeCompatibility', false, 
        `Erro ao testar ${route.method} ${route.path}: ${error.message}`);
      console.log(`❌ ${route.method} ${route.path} - ERRO: ${error.message}`);
    }
  }
  
  const successRate = Math.round((learningMetrics.routeCompatibility.passed / learningMetrics.routeCompatibility.tests) * 100);
  console.log(`📊 Compatibilidade de Rotas: ${learningMetrics.routeCompatibility.passed}/${learningMetrics.routeCompatibility.tests} (${successRate}%)`);
}

// =====================================================
// FASE 2: VERIFICAÇÃO DE AUTENTICAÇÃO
// =====================================================

async function testAuthentication() {
  console.log('\n🔐 FASE 2: VERIFICAÇÃO DE AUTENTICAÇÃO');
  console.log('-'.repeat(60));
  
  // Primeiro, fazer login para obter token
  try {
    console.log('🔑 Fazendo login para obter token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    }, { timeout: 10000 });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      testUserId = loginResponse.data.user?.id;
      console.log('✅ Login realizado com sucesso');
      recordLearningMetric('authentication', true);
    } else {
      console.log('❌ Login falhou - resposta inválida');
      recordLearningMetric('authentication', false, 'Resposta de login inválida');
    }
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.data?.message || error.message);
    recordLearningMetric('authentication', false, `Erro no login: ${error.message}`);
  }

  // Testar endpoints protegidos
  const protectedEndpoints = [
    { path: '/usuario/perfil', description: 'Perfil via compatibilidade' },
    { path: '/api/user/profile', description: 'Perfil via API' },
    { path: '/api/payments/pix/usuario', description: 'PIX do usuário' },
    { path: '/api/games/shoot', description: 'Chutar no jogo' }
  ];

  console.log('🔒 Testando endpoints protegidos...');
  
  for (const endpoint of protectedEndpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 10000,
        validateStatus: () => true
      });
      
      const isSuccess = response.status === 200;
      recordLearningMetric('authentication', isSuccess, 
        isSuccess ? null : `Endpoint ${endpoint.path} retornou ${response.status}`);
      
      const status = isSuccess ? '✅' : '❌';
      console.log(`${status} ${endpoint.path} - ${response.status} (${endpoint.description})`);
      
    } catch (error) {
      recordLearningMetric('authentication', false, 
        `Erro ao testar ${endpoint.path}: ${error.message}`);
      console.log(`❌ ${endpoint.path} - ERRO: ${error.message}`);
    }
  }
  
  const successRate = Math.round((learningMetrics.authentication.passed / learningMetrics.authentication.tests) * 100);
  console.log(`📊 Autenticação: ${learningMetrics.authentication.passed}/${learningMetrics.authentication.tests} (${successRate}%)`);
}

// =====================================================
// FASE 3: VERIFICAÇÃO DE CONSISTÊNCIA DE DADOS
// =====================================================

async function testDataConsistency() {
  console.log('\n📊 FASE 3: VERIFICAÇÃO DE CONSISTÊNCIA DE DADOS');
  console.log('-'.repeat(60));
  
  if (!authToken) {
    console.log('⚠️ Pulando teste de dados - token não disponível');
    return;
  }

  // Testar estrutura de resposta dos endpoints
  const dataTests = [
    { 
      endpoint: '/usuario/perfil', 
      expectedFields: ['success', 'data', 'user'],
      description: 'Perfil via compatibilidade'
    },
    { 
      endpoint: '/api/user/profile', 
      expectedFields: ['success', 'data'],
      description: 'Perfil via API'
    },
    { 
      endpoint: '/api/payments/pix/usuario', 
      expectedFields: ['success', 'data', 'payments'],
      description: 'PIX do usuário'
    },
    { 
      endpoint: '/api/metrics', 
      expectedFields: ['success', 'data'],
      description: 'Métricas do sistema'
    }
  ];

  console.log('🔍 Testando estrutura de dados...');
  
  for (const test of dataTests) {
    try {
      const response = await axios.get(`${BASE_URL}${test.endpoint}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data) {
        const hasExpectedFields = test.expectedFields.every(field => 
          response.data.hasOwnProperty(field)
        );
        
        recordLearningMetric('dataConsistency', hasExpectedFields, 
          hasExpectedFields ? null : `Endpoint ${test.endpoint} não tem campos esperados: ${test.expectedFields.join(', ')}`);
        
        const status = hasExpectedFields ? '✅' : '❌';
        console.log(`${status} ${test.endpoint} - Estrutura ${hasExpectedFields ? 'OK' : 'INVÁLIDA'} (${test.description})`);
        
        if (!hasExpectedFields) {
          console.log(`   Campos encontrados: ${Object.keys(response.data).join(', ')}`);
          console.log(`   Campos esperados: ${test.expectedFields.join(', ')}`);
        }
      } else {
        recordLearningMetric('dataConsistency', false, 
          `Endpoint ${test.endpoint} retornou status ${response.status}`);
        console.log(`❌ ${test.endpoint} - Status ${response.status} (${test.description})`);
      }
      
    } catch (error) {
      recordLearningMetric('dataConsistency', false, 
        `Erro ao testar ${test.endpoint}: ${error.message}`);
      console.log(`❌ ${test.endpoint} - ERRO: ${error.message}`);
    }
  }
  
  const successRate = Math.round((learningMetrics.dataConsistency.passed / learningMetrics.dataConsistency.tests) * 100);
  console.log(`📊 Consistência de Dados: ${learningMetrics.dataConsistency.passed}/${learningMetrics.dataConsistency.tests} (${successRate}%)`);
}

// =====================================================
// FASE 4: TESTE DE INTEGRAÇÃO COMPLETA
// =====================================================

async function testIntegrationFlow() {
  console.log('\n🎮 FASE 4: TESTE DE INTEGRAÇÃO COMPLETA');
  console.log('-'.repeat(60));
  
  if (!authToken) {
    console.log('⚠️ Pulando teste de integração - token não disponível');
    return;
  }

  // Simular fluxo completo do usuário
  const integrationSteps = [
    { step: 'Login', action: () => axios.post(`${BASE_URL}/auth/login`, { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }) },
    { step: 'Verificar Meta', action: () => axios.get(`${BASE_URL}/meta`) },
    { step: 'Carregar Perfil', action: () => axios.get(`${BASE_URL}/usuario/perfil`, { headers: { Authorization: `Bearer ${authToken}` } }) },
    { step: 'Carregar PIX', action: () => axios.get(`${BASE_URL}/api/payments/pix/usuario`, { headers: { Authorization: `Bearer ${authToken}` } }) },
    { step: 'Verificar Métricas', action: () => axios.get(`${BASE_URL}/api/metrics`) },
    { step: 'Health Check', action: () => axios.get(`${BASE_URL}/health`) }
  ];

  console.log('🔄 Simulando fluxo completo do usuário...');
  
  let successfulSteps = 0;
  
  for (const step of integrationSteps) {
    try {
      const response = await step.action();
      
      if (response.status >= 200 && response.status < 300) {
        successfulSteps++;
        console.log(`✅ ${step.step} - ${response.status} OK`);
      } else {
        console.log(`❌ ${step.step} - ${response.status} ERRO`);
      }
      
    } catch (error) {
      console.log(`❌ ${step.step} - ERRO: ${error.message}`);
    }
  }
  
  const integrationSuccess = successfulSteps >= integrationSteps.length * 0.8; // 80% de sucesso
  recordLearningMetric('integration', integrationSuccess, 
    integrationSuccess ? null : `Apenas ${successfulSteps}/${integrationSteps.length} passos funcionaram`);
  
  const successRate = Math.round((successfulSteps / integrationSteps.length) * 100);
  console.log(`📊 Integração: ${successfulSteps}/${integrationSteps.length} (${successRate}%)`);
}

// =====================================================
// ANÁLISE DE APRENDIZADO E RECOMENDAÇÕES
// =====================================================

function analyzeLearningAndRecommendations() {
  console.log('\n🧠 ANÁLISE DE APRENDIZADO E RECOMENDAÇÕES');
  console.log('='.repeat(80));
  
  // Calcular métricas gerais
  let totalTests = 0;
  let totalPassed = 0;
  let totalIssues = 0;
  
  Object.keys(learningMetrics).forEach(category => {
    const metrics = learningMetrics[category];
    totalTests += metrics.tests;
    totalPassed += metrics.passed;
    totalIssues += metrics.issues.length;
  });
  
  const overallSuccessRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  
  console.log(`📊 RESUMO GERAL:`);
  console.log(`   Total de Testes: ${totalTests}`);
  console.log(`   Testes Aprovados: ${totalPassed}`);
  console.log(`   Taxa de Sucesso: ${overallSuccessRate}%`);
  console.log(`   Problemas Identificados: ${totalIssues}`);
  
  // Análise por categoria
  console.log(`\n📋 ANÁLISE POR CATEGORIA:`);
  Object.keys(learningMetrics).forEach(category => {
    const metrics = learningMetrics[category];
    const successRate = metrics.tests > 0 ? Math.round((metrics.passed / metrics.tests) * 100) : 0;
    
    console.log(`\n🔍 ${category.toUpperCase()}:`);
    console.log(`   Taxa de Sucesso: ${successRate}%`);
    console.log(`   Problemas: ${metrics.issues.length}`);
    
    if (metrics.issues.length > 0) {
      console.log(`   Detalhes dos Problemas:`);
      metrics.issues.forEach((issue, index) => {
        console.log(`     ${index + 1}. ${issue}`);
      });
    }
  });
  
  // Recomendações baseadas no aprendizado
  console.log(`\n💡 RECOMENDAÇÕES BASEADAS NO APRENDIZADO:`);
  
  if (learningMetrics.routeCompatibility.issues.length > 0) {
    console.log(`\n🛠️ COMPATIBILIDADE DE ROTAS:`);
    console.log(`   - Implementar endpoints de compatibilidade para todas as rotas antigas`);
    console.log(`   - Criar sistema de redirecionamento automático`);
    console.log(`   - Documentar todas as rotas suportadas`);
  }
  
  if (learningMetrics.authentication.issues.length > 0) {
    console.log(`\n🔐 AUTENTICAÇÃO:`);
    console.log(`   - Verificar middleware de autenticação em todos os endpoints`);
    console.log(`   - Testar tokens JWT em diferentes cenários`);
    console.log(`   - Implementar logs detalhados de autenticação`);
  }
  
  if (learningMetrics.dataConsistency.issues.length > 0) {
    console.log(`\n📊 CONSISTÊNCIA DE DADOS:`);
    console.log(`   - Padronizar estrutura de resposta de todos os endpoints`);
    console.log(`   - Implementar validação de schema de resposta`);
    console.log(`   - Criar testes automatizados para estrutura de dados`);
  }
  
  if (learningMetrics.integration.issues.length > 0) {
    console.log(`\n🎮 INTEGRAÇÃO:`);
    console.log(`   - Implementar testes de integração automatizados`);
    console.log(`   - Criar fluxos de teste end-to-end`);
    console.log(`   - Monitorar métricas de integração em tempo real`);
  }
  
  // Lições aprendidas dos erros anteriores
  console.log(`\n📚 LIÇÕES APRENDIDAS DOS ERROS ANTERIORES:`);
  console.log(`   1. SEMPRE manter compatibilidade entre versões do frontend e backend`);
  console.log(`   2. PADRONIZAR nomenclatura de colunas e campos em todo o sistema`);
  console.log(`   3. MAPEAR todas as chamadas do frontend antes de fazer deploy`);
  console.log(`   4. TESTAR autenticação em todos os endpoints protegidos`);
  console.log(`   5. IMPLEMENTAR logs detalhados para facilitar debugging`);
  console.log(`   6. CRIAR testes automatizados para prevenir regressões`);
  
  // Status final
  console.log(`\n🏆 STATUS FINAL:`);
  if (overallSuccessRate >= 90) {
    console.log(`   🟢 EXCELENTE - Sistema funcionando muito bem`);
  } else if (overallSuccessRate >= 80) {
    console.log(`   🟡 BOM - Pequenos ajustes necessários`);
  } else if (overallSuccessRate >= 70) {
    console.log(`   🟠 REGULAR - Melhorias importantes necessárias`);
  } else {
    console.log(`   🔴 CRÍTICO - Correções urgentes necessárias`);
  }
  
  console.log(`\n🎯 PRÓXIMOS PASSOS RECOMENDADOS:`);
  console.log(`   1. Corrigir problemas identificados nesta análise`);
  console.log(`   2. Implementar testes automatizados`);
  console.log(`   3. Criar documentação de API atualizada`);
  console.log(`   4. Estabelecer processo de deploy mais seguro`);
  console.log(`   5. Implementar monitoramento contínuo`);
}

// =====================================================
// FUNÇÃO PRINCIPAL DE ANÁLISE
// =====================================================

async function runLearningAnalysis() {
  console.log('🧠 INICIANDO ANÁLISE DE APRENDIZADO E VERIFICAÇÃO DE ERROS');
  console.log('='.repeat(80));
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🌐 Backend: ${BASE_URL}`);
  console.log(`👤 Usuário de Teste: ${TEST_USER_EMAIL}`);
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  
  try {
    // Executar todas as fases de análise
    await testRouteCompatibility();
    await testAuthentication();
    await testDataConsistency();
    await testIntegrationFlow();
    
    // Análise final e recomendações
    analyzeLearningAndRecommendations();
    
  } catch (error) {
    console.error('❌ [ANÁLISE] Erro crítico durante análise:', error.message);
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n⏱️ Tempo total de análise: ${Math.round(totalTime / 1000)}s`);
  console.log('\n🏆 ANÁLISE DE APRENDIZADO CONCLUÍDA!');
  console.log('='.repeat(80));
}

// Executar análise
runLearningAnalysis().catch(console.error);
