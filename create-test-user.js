const axios = require('axios');

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');
    
    const response = await axios.post('https://goldeouro-backend-v2.fly.dev/auth/register', {
      name: 'Free10 Signer',
      email: 'free10signer@gmail.com',
      password: 'Free10signer'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('Token:', response.data.token ? 'Presente' : 'Ausente');
    console.log('Usuário:', response.data.user);
    
    // Testar login
    console.log('\n🔍 Testando login...');
    const loginResponse = await axios.post('https://goldeouro-backend-v2.fly.dev/auth/login', {
      email: 'free10signer@gmail.com',
      password: 'Free10signer'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login bem-sucedido!');
    console.log('Token:', loginResponse.data.token ? 'Presente' : 'Ausente');
    console.log('Usuário:', loginResponse.data.user);
    
  } catch (error) {
    console.log('❌ Erro:');
    console.log('Status:', error.response?.status);
    console.log('Mensagem:', error.response?.data?.message || error.message);
    console.log('Dados:', error.response?.data);
  }
}

createTestUser();
