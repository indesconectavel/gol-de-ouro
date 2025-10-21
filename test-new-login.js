const axios = require('axios');

async function testNewLogin() {
  try {
    console.log('🔐 Testando login com novas credenciais...');
    
    const response = await axios.post('https://goldeouro-backend-v2.fly.dev/auth/login', {
      email: 'free10signer2@gmail.com',
      password: 'Free10signer'
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ LOGIN BEM-SUCEDIDO!');
    console.log('Token:', response.data.token ? 'Presente' : 'Ausente');
    console.log('Usuário:', response.data.user);
    
    // Testar endpoint de perfil
    console.log('\n🔍 Testando endpoint de perfil...');
    const profileResponse = await axios.get('https://goldeouro-backend-v2.fly.dev/api/user/me', {
      headers: { 'Authorization': `Bearer ${response.data.token}` },
      timeout: 5000
    });
    
    console.log('✅ Perfil acessado com sucesso!');
    console.log('Dados:', profileResponse.data);
    
    console.log('\n🎉 SISTEMA DE LOGIN FUNCIONANDO PERFEITAMENTE!');
    
  } catch (error) {
    console.log('❌ Erro:', error.response?.data?.message || error.message);
  }
}

testNewLogin();
