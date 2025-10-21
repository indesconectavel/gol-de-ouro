const https = require('https');

// Debug do problema do jogo (HTTP 400)
async function debugGame400() {
  try {
    console.log('🔍 Debugando problema do jogo (HTTP 400)...\n');
    
    // 1. Fazer login primeiro
    console.log('🔐 1. Fazendo login...');
    const loginResponse = await fetch('https://goldeouro-backend-v2.fly.dev/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.log('✅ Token recebido:', token.substring(0, 20) + '...\n');
    
    // 2. Testar diferentes direções
    const directions = ['center', 'left', 'right', 'up', 'down'];
    
    for (const direction of directions) {
      console.log(`⚽ Testando direção: ${direction}`);
      
      try {
        const gameResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/games/shoot', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ direction: direction })
        });
        
        console.log(`📊 Status: ${gameResponse.status}`);
        
        const gameData = await gameResponse.json();
        console.log(`📄 Resposta:`, gameData);
        
        if (gameResponse.ok) {
          console.log(`✅ Direção ${direction} funcionou!\n`);
          break;
        } else {
          console.log(`❌ Direção ${direction} falhou\n`);
        }
        
      } catch (error) {
        console.log(`❌ Erro na direção ${direction}:`, error.message, '\n');
      }
    }
    
    // 3. Testar sem direção
    console.log('⚽ Testando sem direção...');
    try {
      const gameResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/games/shoot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      console.log(`📊 Status: ${gameResponse.status}`);
      const gameData = await gameResponse.json();
      console.log(`📄 Resposta:`, gameData);
      
    } catch (error) {
      console.log(`❌ Erro sem direção:`, error.message);
    }
    
    // 4. Testar GET em vez de POST
    console.log('\n⚽ Testando GET em vez de POST...');
    try {
      const gameResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/games/shoot', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Status: ${gameResponse.status}`);
      const gameData = await gameResponse.json();
      console.log(`📄 Resposta:`, gameData);
      
    } catch (error) {
      console.log(`❌ Erro GET:`, error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugGame400();
