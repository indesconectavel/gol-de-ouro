#!/usr/bin/env node
// === VALIDACAO REAL PRODUCAO - SEM FALSOS POSITIVOS ===

const https = require('https');
const fs = require('fs');

const CONFIG = {
  PLAYER: 'https://www.goldeouro.lol',
  ADMIN: 'https://admin.goldeouro.lol',
  BACKEND: 'https://goldeouro-backend-v2.fly.dev',
  TIMEOUT: 15000
};

const results = {
  timestamp: new Date().toISOString(),
  config: CONFIG,
  checks: [],
  summary: { total: 0, pass: 0, warn: 0, fail: 0 },
  criticalIssues: []
};

function httpCall(method, url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: { 'User-Agent': 'GolDeOuro-RealValidation/1.0', ...options.headers },
      timeout: CONFIG.TIMEOUT
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

function addCheck(name, url, method, status, result, notes, critical = true) {
  results.summary.total++;
  if (result === 'pass') results.summary.pass++;
  else if (result === 'warn') results.summary.warn++;
  else if (result === 'fail') {
    results.summary.fail++;
    if (critical) results.criticalIssues.push({ name, url, notes });
  }

  results.checks.push({
    name, url, method, statusCode: status, result, notes, critical,
    timestamp: new Date().toISOString()
  });

  const icon = result === 'pass' ? '✅' : result === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${name}: ${notes}`);
}

async function main() {
  console.log('🚨 VALIDACAO REAL PRODUCAO - SEM FALSOS POSITIVOS');
  console.log('==================================================');

  // 1) Teste de Login Real
  console.log('\n🔐 1) Teste de Login Real');
  try {
    const loginResponse = await httpCall('POST', `${CONFIG.PLAYER}/api/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'free10signer@gmail.com', password: 'Free10signer' })
    });
    
    if (loginResponse.status === 200 && loginResponse.json?.token) {
      addCheck('Login Real', `${CONFIG.PLAYER}/api/auth/login`, 'POST', 
        loginResponse.status, 'pass', 'Login funcionando', true);
      
      // 2) Teste de Perfil com Token Real
      console.log('\n👤 2) Teste de Perfil com Token Real');
      const profileResponse = await httpCall('GET', `${CONFIG.PLAYER}/api/user/me`, {
        headers: { 'Authorization': `Bearer ${loginResponse.json.token}` }
      });
      
      if (profileResponse.status === 200) {
        const userData = profileResponse.json;
        if (userData.email === 'free10signer@gmail.com') {
          addCheck('Perfil Real', `${CONFIG.PLAYER}/api/user/me`, 'GET', 
            profileResponse.status, 'pass', 'Dados corretos do usuário', true);
        } else {
          addCheck('Perfil Real', `${CONFIG.PLAYER}/api/user/me`, 'GET', 
            profileResponse.status, 'fail', `Dados incorretos: ${userData.email} (esperado: free10signer@gmail.com)`, true);
        }
      } else {
        addCheck('Perfil Real', `${CONFIG.PLAYER}/api/user/me`, 'GET', 
          profileResponse.status, 'fail', `Status: ${profileResponse.status}`, true);
      }
      
      // 3) Teste de Saldo Real
      console.log('\n💰 3) Teste de Saldo Real');
      if (profileResponse.status === 200) {
        const balance = profileResponse.json.balance || 0;
        if (balance === 0) {
          addCheck('Saldo Real', `${CONFIG.PLAYER}/api/user/me`, 'GET', 
            profileResponse.status, 'pass', `Saldo correto: R$ ${balance}`, true);
        } else {
          addCheck('Saldo Real', `${CONFIG.PLAYER}/api/user/me`, 'GET', 
            profileResponse.status, 'fail', `Saldo incorreto: R$ ${balance} (esperado: R$ 0)`, true);
        }
      }
      
      // 4) Teste de PIX Real
      console.log('\n💳 4) Teste de PIX Real');
      const pixResponse = await httpCall('POST', `${CONFIG.PLAYER}/api/payments/pix/create`, {
        headers: { 
          'Authorization': `Bearer ${loginResponse.json.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ amount: 10 })
      });
      
      if (pixResponse.status === 200 && (pixResponse.json?.qr_code || pixResponse.json?.payment_id)) {
        addCheck('PIX Real', `${CONFIG.PLAYER}/api/payments/pix/create`, 'POST', 
          pixResponse.status, 'pass', 'PIX funcionando', true);
      } else {
        addCheck('PIX Real', `${CONFIG.PLAYER}/api/payments/pix/create`, 'POST', 
          pixResponse.status, 'fail', `PIX não funcionando: ${JSON.stringify(pixResponse.json)}`, true);
      }
      
      // 5) Teste de Logout Real
      console.log('\n🚪 5) Teste de Logout Real');
      const logoutResponse = await httpCall('POST', `${CONFIG.PLAYER}/api/auth/logout`, {
        headers: { 'Authorization': `Bearer ${loginResponse.json.token}` }
      });
      
      if (logoutResponse.status === 200) {
        addCheck('Logout Real', `${CONFIG.PLAYER}/api/auth/logout`, 'POST', 
          logoutResponse.status, 'pass', 'Logout funcionando', true);
      } else {
        addCheck('Logout Real', `${CONFIG.PLAYER}/api/auth/logout`, 'POST', 
          logoutResponse.status, 'fail', `Logout não funcionando: ${logoutResponse.status}`, true);
      }
      
    } else {
      addCheck('Login Real', `${CONFIG.PLAYER}/api/auth/login`, 'POST', 
        loginResponse.status, 'fail', `Login falhou: ${JSON.stringify(loginResponse.json)}`, true);
    }
  } catch (error) {
    addCheck('Login Real', `${CONFIG.PLAYER}/api/auth/login`, 'POST', 
      0, 'fail', `Error: ${error.message}`, true);
  }

  // 6) Teste de Jogo Real
  console.log('\n⚽ 6) Teste de Jogo Real');
  try {
    const loginResponse = await httpCall('POST', `${CONFIG.PLAYER}/api/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'free10signer@gmail.com', password: 'Free10signer' })
    });
    
    if (loginResponse.status === 200 && loginResponse.json?.token) {
      const gameResponse = await httpCall('POST', `${CONFIG.PLAYER}/api/games/shoot`, {
        headers: { 
          'Authorization': `Bearer ${loginResponse.json.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ power: 75, direction: 'center' })
      });
      
      if (gameResponse.status === 200) {
        addCheck('Jogo Real', `${CONFIG.PLAYER}/api/games/shoot`, 'POST', 
          gameResponse.status, 'pass', 'Jogo funcionando', true);
      } else {
        addCheck('Jogo Real', `${CONFIG.PLAYER}/api/games/shoot`, 'POST', 
          gameResponse.status, 'fail', `Jogo não funcionando: ${gameResponse.status}`, true);
      }
    }
  } catch (error) {
    addCheck('Jogo Real', `${CONFIG.PLAYER}/api/games/shoot`, 'POST', 
      0, 'fail', `Error: ${error.message}`, true);
  }

  // Resumo Final
  console.log('\n📊 RESUMO FINAL REAL');
  console.log('=====================');
  console.log(`Total: ${results.summary.total}`);
  console.log(`✅ Pass: ${results.summary.pass}`);
  console.log(`❌ Fail: ${results.summary.fail}`);
  console.log(`⚠️  Warn: ${results.summary.warn}`);

  if (results.criticalIssues.length > 0) {
    console.log('\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:');
    results.criticalIssues.forEach(issue => {
      console.log(`   ❌ ${issue.name}: ${issue.notes}`);
    });
  }

  // Salvar resultados
  fs.writeFileSync('validate-real-output.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Resultados salvos em validate-real-output.json');

  // Determinar GO/NO-GO REAL
  if (results.summary.fail === 0) {
    console.log('\n🎉 STATUS: GO! (100% funcional)');
    process.exit(0);
  } else {
    console.log('\n❌ STATUS: NO-GO (problemas críticos encontrados)');
    process.exit(1);
  }
}

main().catch(console.error);

