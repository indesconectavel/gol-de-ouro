const https = require('https');

// Teste de login e token
async function testLoginAndToken() {
  try {
    console.log('🔐 Testando login...');
    
    // 1. Fazer login
    const loginResponse = await fetch('https://goldeouro-backend-v2.fly.dev/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('📋 Login response:', loginData);
    
    if (!loginData.token) {
      console.log('❌ Token não recebido');
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Token recebido:', token.substring(0, 20) + '...');
    
    // 2. Testar rota protegida
    console.log('\n🔍 Testando rota protegida...');
    const profileResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status da resposta:', profileResponse.status);
    console.log('📋 Headers:', Object.fromEntries(profileResponse.headers.entries()));
    
    const profileData = await profileResponse.text();
    console.log('📄 Resposta:', profileData);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testLoginAndToken();
