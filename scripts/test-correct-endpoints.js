const https = require('https');
const http = require('http');

// Desabilitar verificação SSL para testes locais
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testCorrectEndpoints() {
  console.log('🧪 Testando endpoints corretos da API...');
  
  const baseUrl = 'http://localhost:3000';
  const adminToken = 'adm_8d1e3c7a5b9f2a4c6e0d1f3b7a9c5e2d';
  
  try {
    // Teste 1: Lista de usuários (GET)
    console.log('\n👥 Testando Lista de Usuários (GET)...');
    const users = await makeRequest(`${baseUrl}/admin/lista-usuarios`, {
      method: 'GET',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Usuários: ${users.status}`);
    if (users.data.users) {
      console.log(`   📊 ${users.data.users.length} usuários encontrados`);
      users.data.users.slice(0, 3).forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - R$ ${user.balance}`);
      });
    }
    
    // Teste 2: Estatísticas Gerais (POST)
    console.log('\n📊 Testando Estatísticas Gerais (POST)...');
    const stats = await makeRequest(`${baseUrl}/admin/estatisticas-gerais`, {
      method: 'POST',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(`✅ Estatísticas: ${stats.status}`);
    if (stats.data) {
      console.log(`   📈 Dados: ${JSON.stringify(stats.data)}`);
    }
    
    // Teste 3: Top Jogadores (POST)
    console.log('\n🏆 Testando Top Jogadores (POST)...');
    const topPlayers = await makeRequest(`${baseUrl}/admin/top-jogadores`, {
      method: 'POST',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(`✅ Top Jogadores: ${topPlayers.status}`);
    if (topPlayers.data) {
      console.log(`   🏅 Dados: ${JSON.stringify(topPlayers.data)}`);
    }
    
    // Teste 4: Transações Recentes (POST)
    console.log('\n💳 Testando Transações Recentes (POST)...');
    const transactions = await makeRequest(`${baseUrl}/admin/transacoes-recentes`, {
      method: 'POST',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(`✅ Transações: ${transactions.status}`);
    if (transactions.data) {
      console.log(`   💰 Dados: ${JSON.stringify(transactions.data)}`);
    }
    
    // Teste 5: Chutes Recentes (POST)
    console.log('\n⚽ Testando Chutes Recentes (POST)...');
    const shots = await makeRequest(`${baseUrl}/admin/chutes-recentes`, {
      method: 'POST',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(`✅ Chutes: ${shots.status}`);
    if (shots.data) {
      console.log(`   ⚽ Dados: ${JSON.stringify(shots.data)}`);
    }
    
    // Teste 6: Relatório de Usuários (POST)
    console.log('\n👥 Testando Relatório de Usuários (POST)...');
    const userReport = await makeRequest(`${baseUrl}/admin/relatorio-usuarios`, {
      method: 'POST',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(`✅ Relatório Usuários: ${userReport.status}`);
    if (userReport.data) {
      console.log(`   📋 Dados: ${JSON.stringify(userReport.data)}`);
    }
    
    console.log('\n🎉 Testes dos endpoints corretos concluídos!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

testCorrectEndpoints();
