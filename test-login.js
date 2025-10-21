const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 Testando login com free10signer@gmail.com...');
    
    const response = await axios.post('https://goldeouro-backend-v2.fly.dev/auth/login', {
      email: 'free10signer@gmail.com',
      password: 'Free10signer'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login bem-sucedido!');
    console.log('Token:', response.data.token ? 'Presente' : 'Ausente');
    console.log('Usuário:', response.data.user);
    
  } catch (error) {
    console.log('❌ Erro no login:');
    console.log('Status:', error.response?.status);
    console.log('Mensagem:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 Tentando criar usuário...');
      try {
        const registerResponse = await axios.post('https://goldeouro-backend-v2.fly.dev/auth/register', {
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
        console.log('Token:', registerResponse.data.token ? 'Presente' : 'Ausente');
        console.log('Usuário:', registerResponse.data.user);
        
      } catch (registerError) {
        console.log('❌ Erro ao criar usuário:');
        console.log('Status:', registerError.response?.status);
        console.log('Mensagem:', registerError.response?.data?.message || registerError.message);
      }
    }
  }
}

testLogin();
