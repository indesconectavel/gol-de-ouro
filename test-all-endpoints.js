#!/usr/bin/env node

/**
 * Script para testar todos os endpoints do backend
 * Verifica se todos os endpoints estão funcionando corretamente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('🔍 TESTANDO TODOS OS ENDPOINTS DO BACKEND...\n');

async function testEndpoint(method, endpoint, description, expectedStatus = 200) {
  try {
    console.log(`📡 Testando: ${method.toUpperCase()} ${endpoint}`);
    console.log(`   📝 ${description}`);
    
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 5000,
      validateStatus: () => true // Aceitar qualquer status
    });
    
    if (response.status === expectedStatus) {
      console.log(`   ✅ Status: ${response.status} (OK)`);
      if (response.data) {
        console.log(`   📊 Dados: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
    } else {
      console.log(`   ⚠️ Status: ${response.status} (esperado: ${expectedStatus})`);
    }
    
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAllEndpoints() {
  const results = [];
  
  console.log('🏥 TESTANDO ENDPOINTS DE SAÚDE:');
  console.log('================================');
  
  results.push(await testEndpoint('GET', '/health', 'Healthcheck básico'));
  results.push(await testEndpoint('GET', '/health/test-token', 'Teste de token'));
  
  console.log('\n🎮 TESTANDO ENDPOINTS DE JOGOS:');
  console.log('================================');
  
  results.push(await testEndpoint('GET', '/api/games/opcoes-chute', 'Opções de chute'));
  results.push(await testEndpoint('GET', '/api/games/stats', 'Estatísticas de jogos'));
  results.push(await testEndpoint('GET', '/api/games/recent', 'Jogos recentes'));
  
  console.log('\n📊 TESTANDO ENDPOINTS DE ANALYTICS:');
  console.log('===================================');
  
  results.push(await testEndpoint('GET', '/api/analytics/status', 'Status do sistema'));
  results.push(await testEndpoint('GET', '/api/analytics/metrics', 'Métricas do sistema'));
  
  console.log('\n🌐 TESTANDO ENDPOINTS PÚBLICOS:');
  console.log('===============================');
  
  results.push(await testEndpoint('GET', '/api/public/dashboard', 'Dashboard público'));
  results.push(await testEndpoint('GET', '/api/test', 'Endpoint de teste'));
  
  console.log('\n📈 TESTANDO ENDPOINTS DE MONITORAMENTO:');
  console.log('======================================');
  
  results.push(await testEndpoint('GET', '/monitoring', 'Dashboard de monitoramento'));
  results.push(await testEndpoint('GET', '/api/monitoring/realtime', 'Métricas em tempo real'));
  
  console.log('\n🔐 TESTANDO ENDPOINTS PROTEGIDOS (sem token):');
  console.log('=============================================');
  
  // Estes devem retornar 401/403
  results.push(await testEndpoint('GET', '/api/games/estatisticas', 'Estatísticas protegidas', 401));
  results.push(await testEndpoint('POST', '/api/games/fila/entrar', 'Entrar na fila', 401));
  
  console.log('\n📋 RESUMO DOS TESTES:');
  console.log('=====================');
  
  const successful = results.filter(r => r.success && (r.status >= 200 && r.status < 300)).length;
  const failed = results.filter(r => !r.success || (r.status >= 400)).length;
  const total = results.length;
  
  console.log(`✅ Sucessos: ${successful}/${total}`);
  console.log(`❌ Falhas: ${failed}/${total}`);
  console.log(`📊 Taxa de sucesso: ${((successful/total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️ ENDPOINTS COM PROBLEMAS:');
    results.forEach((result, index) => {
      if (!result.success || result.status >= 400) {
        console.log(`   ${index + 1}. Status: ${result.status || 'ERRO'}`);
      }
    });
  }
  
  console.log('\n🎉 TESTE DE ENDPOINTS CONCLUÍDO!');
  
  return { successful, failed, total };
}

// Executar testes
testAllEndpoints().then(({ successful, failed, total }) => {
  if (failed === 0) {
    console.log('\n🚀 TODOS OS ENDPOINTS ESTÃO FUNCIONANDO PERFEITAMENTE!');
  } else {
    console.log(`\n⚠️ ${failed} endpoint(s) precisam de atenção.`);
  }
}).catch(error => {
  console.error('\n❌ Erro durante os testes:', error.message);
});
