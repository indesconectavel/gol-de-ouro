const https = require('https');

// Teste final completo do sistema
async function testFinalComplete() {
  console.log('🚀 TESTE FINAL COMPLETO - SISTEMA GOL DE OURO\n');
  
  const results = {
    backend: { status: 'PENDING', details: [] },
    player: { status: 'PENDING', details: [] },
    admin: { status: 'PENDING', details: [] },
    login: { status: 'PENDING', details: [] },
    game: { status: 'PENDING', details: [] },
    pix: { status: 'PENDING', details: [] },
    withdraw: { status: 'PENDING', details: [] },
    logout: { status: 'PENDING', details: [] }
  };

  try {
    // 1. Backend Health
    console.log('🔧 1. Backend Health Check...');
    try {
      const healthResponse = await fetch('https://goldeouro-backend-v2.fly.dev/health');
      if (healthResponse.ok) {
        results.backend.status = 'PASS';
        results.backend.details.push('Health check OK');
        console.log('✅ Backend: OK');
      }
    } catch (error) {
      results.backend.status = 'FAIL';
      results.backend.details.push(`Error: ${error.message}`);
      console.log('❌ Backend: Error');
    }

    // 2. Player Frontend
    console.log('\n🎮 2. Player Frontend...');
    try {
      const playerResponse = await fetch('https://goldeouro.lol');
      if (playerResponse.ok) {
        results.player.status = 'PASS';
        results.player.details.push('Player accessible');
        console.log('✅ Player: OK');
      }
    } catch (error) {
      results.player.status = 'FAIL';
      results.player.details.push(`Error: ${error.message}`);
      console.log('❌ Player: Error');
    }

    // 3. Admin Frontend
    console.log('\n👨‍💼 3. Admin Frontend...');
    try {
      const adminResponse = await fetch('https://admin.goldeouro.lol');
      if (adminResponse.ok) {
        results.admin.status = 'PASS';
        results.admin.details.push('Admin accessible');
        console.log('✅ Admin: OK');
      }
    } catch (error) {
      results.admin.status = 'FAIL';
      results.admin.details.push(`Error: ${error.message}`);
      console.log('❌ Admin: Error');
    }

    // 4. Login
    console.log('\n🔐 4. Login...');
    let token = null;
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
        token = loginData.token;
        console.log('✅ Login: OK');
      } else {
        results.login.status = 'FAIL';
        results.login.details.push(`Login failed: ${loginData.error}`);
        console.log('❌ Login: Failed');
      }
    } catch (error) {
      results.login.status = 'FAIL';
      results.login.details.push(`Error: ${error.message}`);
      console.log('❌ Login: Error');
    }

    if (token) {
      // 5. Jogo
      console.log('\n⚽ 5. Jogo...');
      try {
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
        
        const gameData = await gameResponse.json();
        if (gameResponse.ok) {
          results.game.status = 'PASS';
          results.game.details.push(`Game working - Result: ${gameData.result}`);
          console.log('✅ Jogo: OK');
        } else {
          results.game.status = 'FAIL';
          results.game.details.push(`Game failed: ${gameData.error}`);
          console.log('❌ Jogo: Failed');
        }
      } catch (error) {
        results.game.status = 'FAIL';
        results.game.details.push(`Error: ${error.message}`);
        console.log('❌ Jogo: Error');
      }

      // 6. PIX
      console.log('\n💰 6. PIX...');
      try {
        const pixResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/payments/pix/status?id=test123', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const pixData = await pixResponse.json();
        if (pixResponse.ok) {
          results.pix.status = 'PASS';
          results.pix.details.push('PIX working');
          console.log('✅ PIX: OK');
        } else {
          results.pix.status = 'FAIL';
          results.pix.details.push(`PIX failed: ${pixData.error}`);
          console.log('❌ PIX: Failed');
        }
      } catch (error) {
        results.pix.status = 'FAIL';
        results.pix.details.push(`Error: ${error.message}`);
        console.log('❌ PIX: Error');
      }

      // 7. Saque
      console.log('\n💸 7. Saque...');
      try {
        const withdrawResponse = await fetch('https://goldeouro-backend-v2.fly.dev/api/withdraw/estimate?amount=100', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const withdrawData = await withdrawResponse.json();
        if (withdrawResponse.ok) {
          results.withdraw.status = 'PASS';
          results.withdraw.details.push('Withdraw working');
          console.log('✅ Saque: OK');
        } else {
          results.withdraw.status = 'FAIL';
          results.withdraw.details.push(`Withdraw failed: ${withdrawData.error}`);
          console.log('❌ Saque: Failed');
        }
      } catch (error) {
        results.withdraw.status = 'FAIL';
        results.withdraw.details.push(`Error: ${error.message}`);
        console.log('❌ Saque: Error');
      }

      // 8. Logout
      console.log('\n🚪 8. Logout...');
      try {
        const logoutResponse = await fetch('https://goldeouro-backend-v2.fly.dev/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const logoutData = await logoutResponse.json();
        if (logoutResponse.ok) {
          results.logout.status = 'PASS';
          results.logout.details.push('Logout working');
          console.log('✅ Logout: OK');
        } else {
          results.logout.status = 'FAIL';
          results.logout.details.push(`Logout failed: ${logoutData.error}`);
          console.log('❌ Logout: Failed');
        }
      } catch (error) {
        results.logout.status = 'FAIL';
        results.logout.details.push(`Error: ${error.message}`);
        console.log('❌ Logout: Error');
      }
    }

    // Resumo Final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL - SISTEMA GOL DE OURO');
    console.log('='.repeat(50));
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r.status === 'PASS').length;
    const failedTests = Object.values(results).filter(r => r.status === 'FAIL').length;
    
    console.log(`\n✅ Testes Passou: ${passedTests}/${totalTests}`);
    console.log(`❌ Testes Falhou: ${failedTests}/${totalTests}`);
    console.log(`📈 Taxa de Sucesso: ${Math.round((passedTests/totalTests)*100)}%`);
    
    console.log('\n📋 DETALHES:');
    Object.entries(results).forEach(([key, result]) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${key.toUpperCase()}: ${result.status}`);
      if (result.details.length > 0) {
        result.details.forEach(detail => console.log(`   - ${detail}`));
      }
    });

    // Status Final
    console.log('\n' + '='.repeat(50));
    if (failedTests === 0) {
      console.log('🎉 SISTEMA 100% FUNCIONAL EM PRODUÇÃO!');
      console.log('🚀 PRONTO PARA USO!');
    } else {
      console.log('⚠️ ALGUNS PROBLEMAS ENCONTRADOS');
      console.log('🔧 VAMOS CORRIGIR OS PROBLEMAS RESTANTES');
    }
    console.log('='.repeat(50));

    return results;

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return results;
  }
}

testFinalComplete();
