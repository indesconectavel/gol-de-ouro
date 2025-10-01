const https = require('https');

// Teste simples de rotas
async function testSimpleRoutes() {
  try {
    console.log('🔍 Testando rotas simples...');
    
    // 1. Testar /health
    console.log('\n1️⃣ Testando /health...');
    const healthResponse = await fetch('https://goldeouro-backend-v2.fly.dev/health');
    console.log('Status:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('Resposta:', healthData);
    
    // 2. Testar /meta
    console.log('\n2️⃣ Testando /meta...');
    const metaResponse = await fetch('https://goldeouro-backend-v2.fly.dev/meta');
    console.log('Status:', metaResponse.status);
    if (metaResponse.status === 200) {
      const metaData = await metaResponse.json();
      console.log('Resposta:', metaData);
    } else {
      const metaText = await metaResponse.text();
      console.log('Resposta:', metaText);
    }
    
    // 3. Testar /version
    console.log('\n3️⃣ Testando /version...');
    const versionResponse = await fetch('https://goldeouro-backend-v2.fly.dev/version');
    console.log('Status:', versionResponse.status);
    if (versionResponse.status === 200) {
      const versionData = await versionResponse.json();
      console.log('Resposta:', versionData);
    } else {
      const versionText = await versionResponse.text();
      console.log('Resposta:', versionText);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSimpleRoutes();
