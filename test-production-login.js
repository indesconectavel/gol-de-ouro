const axios = require('axios');

async function testProductionLogin() {
  try {
    console.log('🔄 Testando login em produção...');
    
    const response = await axios.post('https://goldeouro-backend.fly.dev/api/auth/login', {
      email: 'teste.corrigido@gmail.com',
      password: 'senha123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Login realizado com sucesso!');
    console.log('📊 Resposta:', response.data);
    
    if (response.data.success && response.data.token) {
      console.log('🎯 Token JWT recebido:', response.data.token.substring(0, 50) + '...');
      console.log('👤 Usuário:', response.data.user?.email);
      console.log('💰 Saldo:', response.data.user?.saldo);
    }
    
  } catch (error) {
    console.log('❌ Erro no login:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testProductionLogin();
