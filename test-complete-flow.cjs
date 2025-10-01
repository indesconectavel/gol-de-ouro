#!/usr/bin/env node
// === TESTE FLUXO COMPLETO ===

const https = require('https');

function httpCall(method, url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: { 
        'User-Agent': 'Test-Complete-Flow/1.0',
        ...options.headers 
      },
      timeout: 15000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, json, raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (error) => resolve({ error: error.message, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'Timeout', status: 0 }); });

    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testCompleteFlow() {
  console.log('🚀 TESTE FLUXO COMPLETO - GOL DE OURO');
  console.log('=====================================');
  
  let authToken = null;
  
  // 1) LOGIN
  console.log('\n1️⃣ LOGIN');
  try {
    const loginResponse = await httpCall('POST', 'https://goldeouro-backend-v2.fly.dev/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@admin.com', 
        password: 'admin123' 
      })
    });
    
    if (loginResponse.status === 200 && loginResponse.json?.token) {
      authToken = loginResponse.json.token;
      console.log('   ✅ Login realizado com sucesso');
      console.log(`   👤 Usuário: ${loginResponse.json.user.name} (${loginResponse.json.user.email})`);
      console.log(`   💰 Saldo: R$ ${loginResponse.json.user.balance}`);
    } else {
      console.log('   ❌ Login falhou');
      return;
    }
  } catch (error) {
    console.log(`   ❌ Erro no login: ${error.message}`);
    return;
  }
  
  // 2) PERFIL DO USUÁRIO
  console.log('\n2️⃣ PERFIL DO USUÁRIO');
  try {
    const profileResponse = await httpCall('GET', 'https://goldeouro-backend-v2.fly.dev/api/user/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (profileResponse.status === 200) {
      console.log('   ✅ Perfil obtido com sucesso');
      console.log(`   👤 Nome: ${profileResponse.json.name}`);
      console.log(`   📧 Email: ${profileResponse.json.email}`);
      console.log(`   💰 Saldo: R$ ${profileResponse.json.balance}`);
    } else {
      console.log(`   ❌ Perfil falhou: ${profileResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro no perfil: ${error.message}`);
  }
  
  // 3) CRIAR PIX
  console.log('\n3️⃣ CRIAR PIX');
  try {
    const pixResponse = await httpCall('POST', 'https://goldeouro-backend-v2.fly.dev/api/payments/pix/create', {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ amount: 50 })
    });
    
    if (pixResponse.status === 200) {
      console.log('   ✅ PIX criado com sucesso');
      console.log(`   💳 ID: ${pixResponse.json.payment_id || pixResponse.json.id}`);
      console.log(`   🔗 URL: ${pixResponse.json.checkout_url || 'N/A'}`);
    } else {
      console.log(`   ❌ PIX falhou: ${pixResponse.status}`);
      console.log(`   📝 Resposta: ${JSON.stringify(pixResponse.json)}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro no PIX: ${error.message}`);
  }
  
  // 4) JOGAR
  console.log('\n4️⃣ JOGAR');
  try {
    const gameResponse = await httpCall('POST', 'https://goldeouro-backend-v2.fly.dev/api/games/shoot', {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ power: 75, direction: 'center' })
    });
    
    if (gameResponse.status === 200) {
      console.log('   ✅ Jogo realizado com sucesso');
      console.log(`   ⚽ Resultado: ${gameResponse.json.result || 'N/A'}`);
      console.log(`   💰 Saldo atualizado: R$ ${gameResponse.json.balance || 'N/A'}`);
    } else {
      console.log(`   ❌ Jogo falhou: ${gameResponse.status}`);
      console.log(`   📝 Resposta: ${JSON.stringify(gameResponse.json)}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro no jogo: ${error.message}`);
  }
  
  // 5) ESTIMATIVA DE SAQUE
  console.log('\n5️⃣ ESTIMATIVA DE SAQUE');
  try {
    const estimateResponse = await httpCall('GET', 'https://goldeouro-backend-v2.fly.dev/api/withdraw/estimate?amount=25', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (estimateResponse.status === 200) {
      console.log('   ✅ Estimativa obtida com sucesso');
      console.log(`   💰 Valor: R$ ${estimateResponse.json.amount}`);
      console.log(`   💸 Taxa: R$ ${estimateResponse.json.fee}`);
      console.log(`   💵 Líquido: R$ ${estimateResponse.json.net}`);
    } else {
      console.log(`   ❌ Estimativa falhou: ${estimateResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro na estimativa: ${error.message}`);
  }
  
  // 6) SOLICITAR SAQUE
  console.log('\n6️⃣ SOLICITAR SAQUE');
  try {
    const withdrawResponse = await httpCall('POST', 'https://goldeouro-backend-v2.fly.dev/api/withdraw/request', {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        amount: 25, 
        pix_key: '12345678901' 
      })
    });
    
    if (withdrawResponse.status === 200) {
      console.log('   ✅ Saque solicitado com sucesso');
      console.log(`   🆔 ID: ${withdrawResponse.json.id}`);
      console.log(`   📊 Status: ${withdrawResponse.json.status}`);
    } else {
      console.log(`   ❌ Saque falhou: ${withdrawResponse.status}`);
      console.log(`   📝 Resposta: ${JSON.stringify(withdrawResponse.json)}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro no saque: ${error.message}`);
  }
  
  // 7) LOGOUT
  console.log('\n7️⃣ LOGOUT');
  try {
    const logoutResponse = await httpCall('POST', 'https://goldeouro-backend-v2.fly.dev/auth/logout', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (logoutResponse.status === 200) {
      console.log('   ✅ Logout realizado com sucesso');
    } else {
      console.log(`   ❌ Logout falhou: ${logoutResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro no logout: ${error.message}`);
  }
  
  console.log('\n🎉 TESTE FLUXO COMPLETO FINALIZADO!');
}

testCompleteFlow();

