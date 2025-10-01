const https = require('https');

// Teste do jogo com valor e direção
async function testGameFixed() {
  try {
    console.log('⚽ Testando jogo com valor e direção...\n');
    
    // 1. Fazer login
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
    if (!loginData.token) {
      console.log('❌ Token não recebido');
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login realizado\n');
    
    // 2. Testar jogo com valor e direção
    console.log('⚽ 2. Testando jogo com valor R$ 10,00 e direção center...');
    
    const gameResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/games/shoot', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 10.00,
        direction: 'center'
      })
    });
    
    console.log(`📊 Status: ${gameResponse.status}`);
    const gameData = await gameResponse.json();
    console.log(`📄 Resposta:`, gameData);
    
    if (gameResponse.ok) {
      console.log('\n🎉 JOGO FUNCIONANDO PERFEITAMENTE!');
      console.log(`🎯 Resultado: ${gameData.result}`);
      console.log(`💰 Valor: R$ ${gameData.amount}`);
      console.log(`🎲 Multiplicador: ${gameData.multiplier}x`);
      console.log(`🏆 Ganhou: ${gameData.win ? 'SIM' : 'NÃO'}`);
      console.log(`💬 Mensagem: ${gameData.message}`);
    } else {
      console.log('\n❌ Jogo ainda com problema');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testGameFixed();
