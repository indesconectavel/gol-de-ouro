// Script de teste para verificar o backend em produção
const https = require('https');

const BACKEND_URL = 'https://goldeouro-backend.onrender.com';

console.log('🔍 VERIFICAÇÃO CRÍTICA DO BACKEND EM PRODUÇÃO');
console.log('================================================');
console.log(`URL: ${BACKEND_URL}`);
console.log('');

// Função para fazer requisição HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

// Teste 1: Health Check
async function testHealthCheck() {
  console.log('1. 🏥 Testando Health Check...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    if (response.statusCode === 200) {
      console.log('   ✅ Health Check: OK');
      console.log(`   📊 Status: ${response.statusCode}`);
      try {
        const data = JSON.parse(response.data);
        console.log(`   🗄️  Database: ${data.database || 'N/A'}`);
        console.log(`   🌍 Environment: ${data.environment || 'N/A'}`);
        console.log(`   ⏱️  Uptime: ${data.uptime || 'N/A'}s`);
      } catch (e) {
        console.log(`   📄 Response: ${response.data.substring(0, 100)}...`);
      }
    } else {
      console.log(`   ❌ Health Check: FAILED (${response.statusCode})`);
    }
  } catch (error) {
    console.log(`   ❌ Health Check: ERROR - ${error.message}`);
  }
  console.log('');
}

// Teste 2: API Principal
async function testMainAPI() {
  console.log('2. 🚀 Testando API Principal...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/`);
    if (response.statusCode === 200) {
      console.log('   ✅ API Principal: OK');
      console.log(`   📊 Status: ${response.statusCode}`);
      try {
        const data = JSON.parse(response.data);
        console.log(`   💬 Message: ${data.message || 'N/A'}`);
        console.log(`   🔢 Version: ${data.version || 'N/A'}`);
        console.log(`   🌍 Environment: ${data.environment || 'N/A'}`);
      } catch (e) {
        console.log(`   📄 Response: ${response.data.substring(0, 100)}...`);
      }
    } else {
      console.log(`   ❌ API Principal: FAILED (${response.statusCode})`);
    }
  } catch (error) {
    console.log(`   ❌ API Principal: ERROR - ${error.message}`);
  }
  console.log('');
}

// Teste 3: CORS Headers
async function testCORS() {
  console.log('3. 🌐 Testando CORS...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://goldeouro-player.vercel.app',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };
    
    if (corsHeaders['access-control-allow-origin']) {
      console.log('   ✅ CORS: Configurado');
      console.log(`   🎯 Allow Origin: ${corsHeaders['access-control-allow-origin']}`);
      console.log(`   🔧 Allow Methods: ${corsHeaders['access-control-allow-methods'] || 'N/A'}`);
      console.log(`   📋 Allow Headers: ${corsHeaders['access-control-allow-headers'] || 'N/A'}`);
    } else {
      console.log('   ⚠️  CORS: Headers não encontrados');
    }
  } catch (error) {
    console.log(`   ❌ CORS: ERROR - ${error.message}`);
  }
  console.log('');
}

// Teste 4: Mercado Pago Webhook
async function testMercadoPagoWebhook() {
  console.log('4. 💳 Testando Webhook Mercado Pago...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200 || response.statusCode === 400) {
      console.log('   ✅ Webhook: Endpoint ativo');
      console.log(`   📊 Status: ${response.statusCode}`);
    } else {
      console.log(`   ⚠️  Webhook: Status inesperado (${response.statusCode})`);
    }
  } catch (error) {
    console.log(`   ❌ Webhook: ERROR - ${error.message}`);
  }
  console.log('');
}

// Executar todos os testes
async function runAllTests() {
  console.log('Iniciando testes...\n');
  
  await testHealthCheck();
  await testMainAPI();
  await testCORS();
  await testMercadoPagoWebhook();
  
  console.log('================================================');
  console.log('🏁 Testes concluídos!');
  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Se algum teste falhou, verificar logs do Render');
  console.log('2. Configurar variáveis de ambiente no Render');
  console.log('3. Fazer redeploy se necessário');
  console.log('4. Verificar conectividade com banco de dados');
}

// Executar
runAllTests().catch(console.error);
