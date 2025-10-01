const https = require('https');

// Teste de rotas protegidas
async function testProtectedRoutes() {
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
        password: 'password'
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
    
    // 2. Testar rota protegida /api/user/me
    console.log('\n🔍 Testando /api/user/me...');
    const profileResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status da resposta:', profileResponse.status);
    const profileData = await profileResponse.json();
    console.log('📄 Resposta:', profileData);
    
    // 3. Testar rota PIX
    console.log('\n🔍 Testando /api/payments/pix/status...');
    const pixResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/payments/pix/status?id=test123', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status da resposta:', pixResponse.status);
    const pixData = await pixResponse.json();
    console.log('📄 Resposta:', pixData);
    
    // 4. Testar rota de saque
    console.log('\n🔍 Testando /api/withdraw/estimate...');
    const withdrawResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/withdraw/estimate?amount=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status da resposta:', withdrawResponse.status);
    const withdrawData = await withdrawResponse.json();
    console.log('📄 Resposta:', withdrawData);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testProtectedRoutes();
