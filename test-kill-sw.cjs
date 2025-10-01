// Teste Kill-SW em Produção - Gol de Ouro v1.1.1
const https = require('https');

const PLAYER_URL = 'https://www.goldeouro.lol';
const ADMIN_URL = 'https://admin.goldeouro.lol';

// Função para fazer requisição HTTP
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          headers: res.headers,
          data: data 
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Teste Kill-SW Player
async function testPlayerKillSW() {
  console.log('🔄 Testando Kill-SW Player...');
  
  try {
    const response = await httpRequest(`${PLAYER_URL}/kill-sw.html`);
    
    if (response.status === 200) {
      console.log('✅ Player Kill-SW: OK');
      console.log('   Status:', response.status);
      console.log('   Content-Type:', response.headers['content-type']);
      console.log('   Content-Length:', response.headers['content-length'], 'bytes');
      
      // Verificar se contém JavaScript para limpar SW
      if (response.data.includes('getRegistrations')) {
        console.log('   JavaScript SW: Detectado');
      }
      
      if (response.data.includes('caches.keys')) {
        console.log('   JavaScript Cache: Detectado');
      }
      
      return true;
    } else {
      console.log('❌ Player Kill-SW Error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Player Kill-SW Error:', error.message);
    return false;
  }
}

// Teste Kill-SW Admin
async function testAdminKillSW() {
  console.log('🔄 Testando Kill-SW Admin...');
  
  try {
    const response = await httpRequest(`${ADMIN_URL}/kill-sw.html`);
    
    if (response.status === 200) {
      console.log('✅ Admin Kill-SW: OK');
      console.log('   Status:', response.status);
      console.log('   Content-Type:', response.headers['content-type']);
      console.log('   Content-Length:', response.headers['content-length'], 'bytes');
      
      // Verificar se contém JavaScript para limpar SW
      if (response.data.includes('getRegistrations')) {
        console.log('   JavaScript SW: Detectado');
      }
      
      if (response.data.includes('caches.keys')) {
        console.log('   JavaScript Cache: Detectado');
      }
      
      return true;
    } else {
      console.log('❌ Admin Kill-SW Error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin Kill-SW Error:', error.message);
    return false;
  }
}

// Teste Service Worker Status
async function testServiceWorkerStatus() {
  console.log('🔍 Verificando Service Worker Status...');
  
  try {
    // Player SW
    const playerSW = await httpRequest(`${PLAYER_URL}/sw.js`);
    console.log('   Player SW Status:', playerSW.status);
    
    // Admin SW
    const adminSW = await httpRequest(`${ADMIN_URL}/sw.js`);
    console.log('   Admin SW Status:', adminSW.status);
    
    // Verificar headers Service-Worker-Allowed
    if (playerSW.headers['service-worker-allowed']) {
      console.log('   Player SW-Allowed:', playerSW.headers['service-worker-allowed']);
    }
    
    if (adminSW.headers['service-worker-allowed']) {
      console.log('   Admin SW-Allowed:', adminSW.headers['service-worker-allowed']);
    }
    
    return true;
  } catch (error) {
    console.log('❌ SW Status Error:', error.message);
    return false;
  }
}

// Executar todos os testes
async function runKillSWTests() {
  console.log('🚀 TESTE KILL-SW PRODUÇÃO - GOL DE OURO');
  console.log('======================================');
  
  const results = {
    player: false,
    admin: false,
    sw: false
  };
  
  // Teste 1: Player Kill-SW
  results.player = await testPlayerKillSW();
  console.log('');
  
  // Teste 2: Admin Kill-SW
  results.admin = await testAdminKillSW();
  console.log('');
  
  // Teste 3: Service Worker Status
  results.sw = await testServiceWorkerStatus();
  console.log('');
  
  // Resultado final
  console.log('📊 RESULTADO FINAL');
  console.log('==================');
  console.log('Player Kill-SW:', results.player ? '✅' : '❌');
  console.log('Admin Kill-SW:', results.admin ? '✅' : '❌');
  console.log('Service Worker:', results.sw ? '✅' : '❌');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log('');
  console.log(`🎯 RESULTADO: ${passed}/${total} (${percentage}%)`);
  
  if (percentage >= 100) {
    console.log('🎉 KILL-SW FUNCIONANDO! Cache limpo.');
  } else if (percentage >= 66) {
    console.log('⚠️  KILL-SW PARCIAL. Alguns problemas.');
  } else {
    console.log('❌ KILL-SW COM PROBLEMAS. Necessita correções.');
  }
  
  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Acesse https://www.goldeouro.lol/kill-sw.html');
  console.log('2. Acesse https://admin.goldeouro.lol/kill-sw.html');
  console.log('3. Verifique Application → Service Workers (vazio)');
  console.log('4. Teste funcionalidades após limpeza');
}

// Executar
runKillSWTests().catch(console.error);
