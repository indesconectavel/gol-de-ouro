// Teste E2E Básico - Gol de Ouro v1.1.1
const https = require('https');

const PLAYER_URL = 'https://www.goldeouro.lol';
const ADMIN_URL = 'https://admin.goldeouro.lol';
const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';

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

// Teste 1: Backend Health
async function testBackendHealth() {
  console.log('🔍 Testando Backend Health...');
  
  try {
    const response = await httpRequest(`${BACKEND_URL}/health`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log('✅ Backend OK:', data.ok ? 'Online' : 'Offline');
      console.log('   Database:', data.database || 'Unknown');
      console.log('   Uptime:', Math.round(data.uptime / 60), 'minutos');
      return true;
    } else {
      console.log('❌ Backend Error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend Error:', error.message);
    return false;
  }
}

// Teste 2: Player Frontend
async function testPlayerFrontend() {
  console.log('🎮 Testando Player Frontend...');
  
  try {
    const response = await httpRequest(PLAYER_URL);
    
    if (response.status === 200) {
      console.log('✅ Player OK:', response.status);
      console.log('   Content-Type:', response.headers['content-type']);
      console.log('   Content-Length:', response.headers['content-length'], 'bytes');
      
      // Verificar se é HTML
      if (response.data.includes('<html')) {
        console.log('   HTML: Detectado');
      } else {
        console.log('   HTML: Não detectado');
      }
      
      return true;
    } else {
      console.log('❌ Player Error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Player Error:', error.message);
    return false;
  }
}

// Teste 3: Admin Frontend
async function testAdminFrontend() {
  console.log('👨‍💼 Testando Admin Frontend...');
  
  try {
    const response = await httpRequest(ADMIN_URL);
    
    if (response.status === 200) {
      console.log('✅ Admin OK:', response.status);
      console.log('   Content-Type:', response.headers['content-type']);
      console.log('   Content-Length:', response.headers['content-length'], 'bytes');
      
      // Verificar se é HTML
      if (response.data.includes('<html')) {
        console.log('   HTML: Detectado');
      } else {
        console.log('   HTML: Não detectado');
      }
      
      return true;
    } else {
      console.log('❌ Admin Error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin Error:', error.message);
    return false;
  }
}

// Teste 4: Kill SW Pages
async function testKillSWPages() {
  console.log('🔄 Testando Kill SW Pages...');
  
  try {
    // Player Kill SW
    const playerKillSW = await httpRequest(`${PLAYER_URL}/kill-sw.html`);
    if (playerKillSW.status === 200) {
      console.log('✅ Player Kill SW: OK');
    } else {
      console.log('❌ Player Kill SW:', playerKillSW.status);
    }
    
    // Admin Kill SW
    const adminKillSW = await httpRequest(`${ADMIN_URL}/kill-sw.html`);
    if (adminKillSW.status === 200) {
      console.log('✅ Admin Kill SW: OK');
    } else {
      console.log('❌ Admin Kill SW:', adminKillSW.status);
    }
    
    return playerKillSW.status === 200 && adminKillSW.status === 200;
  } catch (error) {
    console.log('❌ Kill SW Error:', error.message);
    return false;
  }
}

// Teste 5: PIX Creation
async function testPixCreation() {
  console.log('💳 Testando Criação PIX...');
  
  try {
    const pixData = {
      amount: 10.00,
      description: 'Teste E2E',
      user_id: 'test_e2e_123'
    };
    
    const response = await httpRequest(`${BACKEND_URL}/api/payments/pix/criar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pixData)
    });
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log('✅ PIX Criado:', data.id);
      console.log('   Status:', data.status);
      console.log('   QR Code:', data.qr_code ? 'Gerado' : 'Não gerado');
      console.log('   Mensagem:', data.message);
      return true;
    } else {
      console.log('❌ PIX Error:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ PIX Error:', error.message);
    return false;
  }
}

// Teste 6: Game API
async function testGameAPI() {
  console.log('🎯 Testando Game API...');
  
  try {
    // Primeiro fazer login para obter token
    const loginData = {
      email: 'free10signer@gmail.com',
      password: 'Free10signer'
    };
    
    const loginResponse = await httpRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    if (loginResponse.status === 200) {
      const loginResult = JSON.parse(loginResponse.data);
      const token = loginResult.token;
      
      console.log('✅ Login OK:', loginResult.message);
      
      // Testar jogo
      const gameData = {
        amount: 5.00,
        direction: 'left'
      };
      
      const gameResponse = await httpRequest(`${BACKEND_URL}/api/games/shoot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameData)
      });
      
      if (gameResponse.status === 200) {
        const gameResult = JSON.parse(gameResponse.data);
        console.log('✅ Game OK:', gameResult.result);
        console.log('   Amount:', gameResult.amount);
        console.log('   Win:', gameResult.win);
        return true;
      } else {
        console.log('❌ Game Error:', gameResponse.status, gameResponse.data);
        return false;
      }
    } else {
      console.log('❌ Login Error:', loginResponse.status, loginResponse.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Game Error:', error.message);
    return false;
  }
}

// Executar todos os testes
async function runE2ETests() {
  console.log('🚀 INICIANDO TESTE E2E BÁSICO - GOL DE OURO');
  console.log('============================================');
  
  const results = {
    backend: false,
    player: false,
    admin: false,
    killsw: false,
    pix: false,
    game: false
  };
  
  // Teste 1: Backend
  results.backend = await testBackendHealth();
  console.log('');
  
  // Teste 2: Player
  results.player = await testPlayerFrontend();
  console.log('');
  
  // Teste 3: Admin
  results.admin = await testAdminFrontend();
  console.log('');
  
  // Teste 4: Kill SW
  results.killsw = await testKillSWPages();
  console.log('');
  
  // Teste 5: PIX
  results.pix = await testPixCreation();
  console.log('');
  
  // Teste 6: Game
  results.game = await testGameAPI();
  console.log('');
  
  // Resultado final
  console.log('📊 RESULTADO FINAL');
  console.log('==================');
  console.log('Backend:', results.backend ? '✅' : '❌');
  console.log('Player:', results.player ? '✅' : '❌');
  console.log('Admin:', results.admin ? '✅' : '❌');
  console.log('Kill SW:', results.killsw ? '✅' : '❌');
  console.log('PIX:', results.pix ? '✅' : '❌');
  console.log('Game:', results.game ? '✅' : '❌');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log('');
  console.log(`🎯 RESULTADO: ${passed}/${total} (${percentage}%)`);
  
  if (percentage >= 80) {
    console.log('🎉 SISTEMA FUNCIONAL! Pronto para produção.');
  } else if (percentage >= 60) {
    console.log('⚠️  SISTEMA PARCIAL. Alguns problemas encontrados.');
  } else {
    console.log('❌ SISTEMA COM PROBLEMAS. Necessita correções.');
  }
}

// Executar
runE2ETests().catch(console.error);
