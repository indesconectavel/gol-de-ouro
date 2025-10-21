// test-production-credentials.js
const axios = require('axios');

async function testProductionCredentials() {
  console.log('🔍 [TESTE] Testando credenciais em produção...');
  
  try {
    // Teste 1: Health check
    console.log('🔄 [TESTE] Testando health check...');
    const healthResponse = await axios.get('https://goldeouro-backend.fly.dev/health');
    
    console.log('✅ [TESTE] Health check OK');
    console.log('📊 [TESTE] Status:', healthResponse.data);
    
    // Teste 2: Teste de registro (para verificar banco)
    console.log('🔄 [TESTE] Testando registro de usuário...');
    const testEmail = `teste.${Date.now()}@example.com`;
    
    const registerResponse = await axios.post('https://goldeouro-backend.fly.dev/api/auth/register', {
      email: testEmail,
      password: 'test123',
      username: 'TesteCredenciais'
    });
    
    console.log('✅ [TESTE] Registro OK');
    console.log('📊 [TESTE] Resposta:', registerResponse.data);
    
    // Teste 3: Teste de login
    console.log('🔄 [TESTE] Testando login...');
    const loginResponse = await axios.post('https://goldeouro-backend.fly.dev/api/auth/login', {
      email: testEmail,
      password: 'test123'
    });
    
    console.log('✅ [TESTE] Login OK');
    console.log('📊 [TESTE] Token recebido:', loginResponse.data.token ? 'Sim' : 'Não');
    console.log('📊 [TESTE] Banco usado:', loginResponse.data.banco);
    
    return true;
    
  } catch (error) {
    console.log('❌ [TESTE] Erro:', error.message);
    if (error.response) {
      console.log('❌ [TESTE] Status:', error.response.status);
      console.log('❌ [TESTE] Dados:', error.response.data);
    }
    return false;
  }
}

// Executar teste
testProductionCredentials()
  .then(success => {
    if (success) {
      console.log('🎉 [TESTE] Sistema em produção funcionando!');
    } else {
      console.log('🚨 [TESTE] Sistema em produção com problemas!');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.log('💥 [TESTE] Erro fatal:', error);
    process.exit(1);
  });



