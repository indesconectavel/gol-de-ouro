#!/usr/bin/env node
// === DEBUG LOGIN ===

const https = require('https');

function httpCall(method, url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: { 'User-Agent': 'Debug-Login/1.0', ...options.headers },
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

async function debugLogin() {
  console.log('🔍 Debug login...');
  
  // Testar com diferentes emails
  const testCases = [
    { email: 'free10signer@gmail.com', password: 'Free10signer' },
    { email: 'teste@teste.com', password: 'teste123' },
    { email: 'admin@admin.com', password: 'admin123' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📧 Testando: ${testCase.email}`);
    
    try {
      const response = await httpCall('POST', 'https://goldeouro-backend-v2.fly.dev/auth/login', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase)
      });
      
      console.log(`   Status: ${response.status}`);
      if (response.json) {
        console.log(`   Message: ${response.json.message || response.json.error}`);
        if (response.json.user) {
          console.log(`   User: ${response.json.user.name} (${response.json.user.email})`);
          console.log(`   Balance: R$ ${response.json.user.balance}`);
        }
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
}

debugLogin();

