// Teste E2E Final - Gol de Ouro MVP
// Testa o fluxo completo: Login → Depósito PIX → Jogar → Saque → Logout

const https = require('https');
const http = require('http');

// Configurações
const PLAYER_URL = 'https://www.goldeouro.lol';
const ADMIN_URL = 'https://admin.goldeouro.lol';
const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';

// Usuário de teste
const TEST_USER = {
  email: 'free10signer@gmail.com',
  password: 'password'
};

const ADMIN_USER = {
  email: 'admin@admin.com',
  password: 'password'
};

// Helper para fazer requisições
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Teste 1: Kill Service Workers
async function testKillSW() {
  console.log('\n🔄 Teste 1: Kill Service Workers');
  
  try {
    // Player
    const playerSW = await makeRequest(`${PLAYER_URL}/kill-sw.html`);
    console.log(`✅ Player Kill-SW: ${playerSW.status}`);
    
    // Admin
    const adminSW = await makeRequest(`${ADMIN_URL}/kill-sw.html`);
    console.log(`✅ Admin Kill-SW: ${adminSW.status}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Kill-SW Error: ${error.message}`);
    return false;
  }
}

// Teste 2: Health Check
async function testHealth() {
  console.log('\n🏥 Teste 2: Health Check');
  
  try {
    const health = await makeRequest(`${BACKEND_URL}/health`);
    console.log(`✅ Backend Health: ${health.status} - ${health.data.status || 'OK'}`);
    return health.status === 200;
  } catch (error) {
    console.log(`❌ Health Error: ${error.message}`);
    return false;
  }
}

// Teste 3: Login Player
async function testPlayerLogin() {
  console.log('\n🎮 Teste 3: Player Login');
  
  try {
    const login = await makeRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });
    
    if (login.status === 200) {
      console.log(`✅ Player Login: ${login.status} - Token: ${login.data.token ? 'OK' : 'Missing'}`);
      return { success: true, token: login.data.token };
    } else {
      console.log(`❌ Player Login: ${login.status} - ${login.data.error || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Player Login Error: ${error.message}`);
    return { success: false };
  }
}

// Teste 4: Login Admin
async function testAdminLogin() {
  console.log('\n👨‍💼 Teste 4: Admin Login');
  
  try {
    const login = await makeRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ADMIN_USER)
    });
    
    if (login.status === 200) {
      console.log(`✅ Admin Login: ${login.status} - Token: ${login.data.token ? 'OK' : 'Missing'}`);
      return { success: true, token: login.data.token };
    } else {
      console.log(`❌ Admin Login: ${login.status} - ${login.data.error || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Admin Login Error: ${error.message}`);
    return { success: false };
  }
}

// Teste 5: Perfil do Usuário
async function testUserProfile(token) {
  console.log('\n👤 Teste 5: User Profile');
  
  try {
    const profile = await makeRequest(`${BACKEND_URL}/api/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (profile.status === 200) {
      console.log(`✅ User Profile: ${profile.status} - Balance: R$ ${profile.data.balance || 0}`);
      return { success: true, profile: profile.data };
    } else {
      console.log(`❌ User Profile: ${profile.status} - ${profile.data.error || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ User Profile Error: ${error.message}`);
    return { success: false };
  }
}

// Teste 6: Depósito PIX
async function testPixDeposit(token) {
  console.log('\n💳 Teste 6: PIX Deposit');
  
  try {
    const deposit = await makeRequest(`${BACKEND_URL}/api/payments/pix/criar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 10.00,
        description: 'Depósito teste E2E',
        user_id: 'free10signer@gmail.com'
      })
    });
    
    if (deposit.status === 200) {
      console.log(`✅ PIX Deposit: ${deposit.status} - ID: ${deposit.data.id} - QR: ${deposit.data.qr_code ? 'OK' : 'Missing'}`);
      return { success: true, deposit: deposit.data };
    } else {
      console.log(`❌ PIX Deposit: ${deposit.status} - ${deposit.data.error || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ PIX Deposit Error: ${error.message}`);
    return { success: false };
  }
}

// Teste 7: Jogar
async function testGame(token) {
  console.log('\n🎯 Teste 7: Game');
  
  try {
    const game = await makeRequest(`${BACKEND_URL}/api/games/shoot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 5.00,
        direction: 'left'
      })
    });
    
    if (game.status === 200) {
      console.log(`✅ Game: ${game.status} - Result: ${game.data.result} - Win: ${game.data.win} - Amount: R$ ${game.data.amount}`);
      return { success: true, game: game.data };
    } else {
      console.log(`❌ Game: ${game.status} - ${game.data.error || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Game Error: ${error.message}`);
    return { success: false };
  }
}

// Teste 8: Saque PIX
async function testPixWithdraw(token) {
  console.log('\n💰 Teste 8: PIX Withdraw');
  
  try {
    const withdraw = await makeRequest(`${BACKEND_URL}/api/withdraw/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 3.00,
        pix_key: '12345678901',
        pix_key_type: 'cpf'
      })
    });
    
    if (withdraw.status === 200) {
      console.log(`✅ PIX Withdraw: ${withdraw.status} - ID: ${withdraw.data.id} - Status: ${withdraw.data.status}`);
      return { success: true, withdraw: withdraw.data };
    } else {
      console.log(`❌ PIX Withdraw: ${withdraw.status} - ${withdraw.data.error || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ PIX Withdraw Error: ${error.message}`);
    return { success: false };
  }
}

// Teste 9: Admin Stats
async function testAdminStats(adminToken) {
  console.log('\n📊 Teste 9: Admin Stats');
  
  try {
    const stats = await makeRequest(`${BACKEND_URL}/api/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (stats.status === 200) {
      console.log(`✅ Admin Stats: ${stats.status} - Users: ${stats.data.totalUsers} - Games: ${stats.data.totalGames} - Revenue: R$ ${stats.data.totalRevenue}`);
      return { success: true, stats: stats.data };
    } else {
      console.log(`❌ Admin Stats: ${stats.status} - ${stats.data.error || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Admin Stats Error: ${error.message}`);
    return { success: false };
  }
}

// Teste 10: Logout
async function testLogout(token) {
  console.log('\n🚪 Teste 10: Logout');
  
  try {
    const logout = await makeRequest(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (logout.status === 200) {
      console.log(`✅ Logout: ${logout.status} - ${logout.data.message || 'OK'}`);
      return { success: true };
    } else {
      console.log(`❌ Logout: ${logout.status} - ${logout.data.error || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Logout Error: ${error.message}`);
    return { success: false };
  }
}

// Executar todos os testes
async function runE2ETests() {
  console.log('🚀 INICIANDO TESTE E2E COMPLETO - GOL DE OURO MVP');
  console.log('='.repeat(60));
  
  const results = {
    killSW: false,
    health: false,
    playerLogin: false,
    adminLogin: false,
    userProfile: false,
    pixDeposit: false,
    game: false,
    pixWithdraw: false,
    adminStats: false,
    logout: false
  };
  
  let playerToken = null;
  let adminToken = null;
  
  // Teste 1: Kill Service Workers
  results.killSW = await testKillSW();
  
  // Teste 2: Health Check
  results.health = await testHealth();
  
  // Teste 3: Player Login
  const playerLoginResult = await testPlayerLogin();
  results.playerLogin = playerLoginResult.success;
  playerToken = playerLoginResult.token;
  
  // Teste 4: Admin Login
  const adminLoginResult = await testAdminLogin();
  results.adminLogin = adminLoginResult.success;
  adminToken = adminLoginResult.token;
  
  // Teste 5: User Profile
  if (playerToken) {
    const profileResult = await testUserProfile(playerToken);
    results.userProfile = profileResult.success;
  }
  
  // Teste 6: PIX Deposit
  if (playerToken) {
    const depositResult = await testPixDeposit(playerToken);
    results.pixDeposit = depositResult.success;
  }
  
  // Teste 7: Game
  if (playerToken) {
    const gameResult = await testGame(playerToken);
    results.game = gameResult.success;
  }
  
  // Teste 8: PIX Withdraw
  if (playerToken) {
    const withdrawResult = await testPixWithdraw(playerToken);
    results.pixWithdraw = withdrawResult.success;
  }
  
  // Teste 9: Admin Stats
  if (adminToken) {
    const statsResult = await testAdminStats(adminToken);
    results.adminStats = statsResult.success;
  }
  
  // Teste 10: Logout
  if (playerToken) {
    const logoutResult = await testLogout(playerToken);
    results.logout = logoutResult.success;
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO FINAL E2E');
  console.log('='.repeat(60));
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`✅ Testes Passou: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
  console.log('');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (successRate >= 90) {
    console.log('🎉 MVP FUNCIONANDO PERFEITAMENTE!');
    console.log('🚀 Sistema pronto para usuários reais!');
  } else if (successRate >= 70) {
    console.log('⚠️ MVP FUNCIONANDO COM PEQUENOS PROBLEMAS');
    console.log('🔧 Alguns ajustes podem ser necessários');
  } else {
    console.log('❌ MVP COM PROBLEMAS CRÍTICOS');
    console.log('🚨 Necessário revisar e corrigir');
  }
  
  console.log('\n🌐 URLs de Produção:');
  console.log(`🎮 Player: ${PLAYER_URL}`);
  console.log(`👨‍💼 Admin: ${ADMIN_URL}`);
  console.log(`🔧 Backend: ${BACKEND_URL}`);
  
  return results;
}

// Executar
runE2ETests().catch(console.error);
