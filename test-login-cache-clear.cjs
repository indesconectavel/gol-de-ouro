#!/usr/bin/env node
// === TESTE LOGIN COM CACHE LIMPO ===

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
        'User-Agent': 'Test-Login-Cache-Clear/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
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

async function testLoginWithCacheClear() {
  console.log('🔐 Testando login com cache limpo...');
  
  // Teste 1: Login direto no backend
  console.log('\n1️⃣ Teste direto no backend:');
  try {
    const response = await httpCall('POST', 'https://goldeouro-backend-v2.fly.dev/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'free10signer@gmail.com', 
        password: 'Free10signer' 
      })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.json, null, 2)}`);
    
    if (response.status === 200) {
      console.log('   ✅ Login funcionando!');
      return response.json.token;
    } else {
      console.log('   ❌ Login falhou');
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  // Teste 2: Login via frontend (proxy)
  console.log('\n2️⃣ Teste via frontend (proxy):');
  try {
    const response = await httpCall('POST', 'https://www.goldeouro.lol/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'free10signer@gmail.com', 
        password: 'Free10signer' 
      })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.json, null, 2)}`);
    
    if (response.status === 200) {
      console.log('   ✅ Login via proxy funcionando!');
      return response.json.token;
    } else {
      console.log('   ❌ Login via proxy falhou');
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  return null;
}

testLoginWithCacheClear();

