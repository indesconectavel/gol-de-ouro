const https = require('https');

// Teste de login com senha "password"
async function testLoginPassword() {
  try {
    console.log('🔐 Testando login com senha "password"...');
    
    const loginResponse = await fetch('https://goldeouro-backend-v2.fly.dev/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'password'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('📋 Login response:', loginData);
    
    if (loginData.token) {
      console.log('✅ Login funcionou!');
    } else {
      console.log('❌ Login falhou');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testLoginPassword();
