const https = require('https');

// Teste completo do sistema em produção
async function testProductionComplete() {
  console.log('🚀 TESTE COMPLETO DO SISTEMA EM PRODUÇÃO\n');
  
  const results = {
    backend: { status: 'PENDING', details: [] },
    player: { status: 'PENDING', details: [] },
    admin: { status: 'PENDING', details: [] },
    login: { status: 'PENDING', details: [] },
    game: { status: 'PENDING', details: [] },
    pix: { status: 'PENDING', details: [] },
    withdraw: { status: 'PENDING', details: [] }
  };

  try {
    // 1. Testar Backend (Fly.io)
    console.log('🔧 1. Testando Backend (Fly.io)...');
    try {
      const healthResponse = await fetch('https://goldeouro-backend-v2.fly.dev/health');
      const healthData = await healthResponse.json();
      if (healthResponse.ok) {
        results.backend.status = 'PASS';
        results.backend.details.push('Health check OK');
        console.log('✅ Backend: Health check OK');
      } else {
        results.backend.status = 'FAIL';
        results.backend.details.push('Health check failed');
        console.log('❌ Backend: Health check failed');
      }
    } catch (error) {
      results.backend.status = 'FAIL';
      results.backend.details.push(`Error: ${error.message}`);
      console.log('❌ Backend: Error -', error.message);
    }

    // 2. Testar Player Frontend (Vercel)
    console.log('\n🎮 2. Testando Player Frontend (Vercel)...');
    try {
      const playerResponse = await fetch('https://goldeouro.lol');
      if (playerResponse.ok) {
        results.player.status = 'PASS';
        results.player.details.push('Player frontend accessible');
        console.log('✅ Player: Frontend accessible');
      } else {
        results.player.status = 'FAIL';
        results.player.details.push(`HTTP ${playerResponse.status}`);
        console.log('❌ Player: HTTP', playerResponse.status);
      }
    } catch (error) {
      results.player.status = 'FAIL';
      results.player.details.push(`Error: ${error.message}`);
      console.log('❌ Player: Error -', error.message);
    }

    // 3. Testar Admin Frontend (Vercel)
    console.log('\n👨‍💼 3. Testando Admin Frontend (Vercel)...');
    try {
      const adminResponse = await fetch('https://admin.goldeouro.lol');
      if (adminResponse.ok) {
        results.admin.status = 'PASS';
        results.admin.details.push('Admin frontend accessible');
        console.log('✅ Admin: Frontend accessible');
      } else {
        results.admin.status = 'FAIL';
        results.admin.details.push(`HTTP ${adminResponse.status}`);
        console.log('❌ Admin: HTTP', adminResponse.status);
      }
    } catch (error) {
      results.admin.status = 'FAIL';
      results.admin.details.push(`Error: ${error.message}`);
      console.log('❌ Admin: Error -', error.message);
    }

    // 4. Testar Login
    console.log('\n🔐 4. Testando Login...');
    try {
      const loginResponse = await fetch('https://goldeouro-backend-v2.fly.dev/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@admin.com',
          password: 'password'
        })
      });
      
      const loginData = await loginResponse.json();
      if (loginResponse.ok && loginData.token) {
        results.login.status = 'PASS';
        results.login.details.push('Login successful');
        results.login.token = loginData.token;
        console.log('✅ Login: Successful');
        
        // 5. Testar Jogo
        console.log('\n⚽ 5. Testando Jogo...');
        try {
          const gameResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/games/shoot', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${loginData.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ direction: 'center' })
          });
          
          const gameData = await gameResponse.json();
          if (gameResponse.ok) {
            results.game.status = 'PASS';
            results.game.details.push('Game working');
            console.log('✅ Jogo: Funcionando');
          } else {
            results.game.status = 'FAIL';
            results.game.details.push(`HTTP ${gameResponse.status}`);
            console.log('❌ Jogo: HTTP', gameResponse.status);
          }
        } catch (error) {
          results.game.status = 'FAIL';
          results.game.details.push(`Error: ${error.message}`);
          console.log('❌ Jogo: Error -', error.message);
        }

        // 6. Testar PIX
        console.log('\n💰 6. Testando PIX...');
        try {
          const pixResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/payments/pix/status?id=test123', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginData.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const pixData = await pixResponse.json();
          if (pixResponse.ok) {
            results.pix.status = 'PASS';
            results.pix.details.push('PIX working');
            console.log('✅ PIX: Funcionando');
          } else {
            results.pix.status = 'FAIL';
            results.pix.details.push(`HTTP ${pixResponse.status}`);
            console.log('❌ PIX: HTTP', pixResponse.status);
          }
        } catch (error) {
          results.pix.status = 'FAIL';
          results.pix.details.push(`Error: ${error.message}`);
          console.log('❌ PIX: Error -', error.message);
        }

        // 7. Testar Saque
        console.log('\n💸 7. Testando Saque...');
        try {
          const withdrawResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/withdraw/estimate?amount=100', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginData.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const withdrawData = await withdrawResponse.json();
          if (withdrawResponse.ok) {
            results.withdraw.status = 'PASS';
            results.withdraw.details.push('Withdraw working');
            console.log('✅ Saque: Funcionando');
          } else {
            results.withdraw.status = 'FAIL';
            results.withdraw.details.push(`HTTP ${withdrawResponse.status}`);
            console.log('❌ Saque: HTTP', withdrawResponse.status);
          }
        } catch (error) {
          results.withdraw.status = 'FAIL';
          results.withdraw.details.push(`Error: ${error.message}`);
          console.log('❌ Saque: Error -', error.message);
        }

      } else {
        results.login.status = 'FAIL';
        results.login.details.push(`Login failed: ${loginData.error || 'Unknown error'}`);
        console.log('❌ Login: Failed -', loginData.error || 'Unknown error');
      }
    } catch (error) {
      results.login.status = 'FAIL';
      results.login.details.push(`Error: ${error.message}`);
      console.log('❌ Login: Error -', error.message);
    }

    // Resumo Final
    console.log('\n📊 RESUMO FINAL:');
    console.log('================');
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r.status === 'PASS').length;
    const failedTests = Object.values(results).filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Testes Passou: ${passedTests}/${totalTests}`);
    console.log(`❌ Testes Falhou: ${failedTests}/${totalTests}`);
    
    Object.entries(results).forEach(([key, result]) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${key.toUpperCase()}: ${result.status}`);
      if (result.details.length > 0) {
        result.details.forEach(detail => console.log(`   - ${detail}`));
      }
    });

    // Status Final
    if (failedTests === 0) {
      console.log('\n🎉 SISTEMA 100% FUNCIONAL EM PRODUÇÃO!');
    } else {
      console.log('\n⚠️ ALGUNS PROBLEMAS ENCONTRADOS - VAMOS CORRIGIR!');
    }

    return results;

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return results;
  }
}

testProductionComplete();
