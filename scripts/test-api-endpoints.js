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

async function testAPIEndpoints() {
  console.log('🧪 Testando endpoints da API para o painel...');
  
  const baseUrl = 'http://localhost:3000';
  const adminToken = 'adm_8d1e3c7a5b9f2a4c6e0d1f3b7a9c5e2d';
  
  try {
    // Teste 1: Health Check
    console.log('\n🏥 Testando Health Check...');
    const health = await makeRequest(`${baseUrl}/health`);
    console.log(`✅ Health: ${health.status} - ${JSON.stringify(health.data)}`);
    
    // Teste 2: Lista de usuários (Admin)
    console.log('\n👥 Testando Lista de Usuários...');
    const users = await makeRequest(`${baseUrl}/admin/lista-usuarios`, {
      method: 'GET',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Usuários: ${users.status} - ${users.data.users ? users.data.users.length : 0} usuários encontrados`);
    
    // Teste 3: Estatísticas (Admin)
    console.log('\n📊 Testando Estatísticas...');
    const stats = await makeRequest(`${baseUrl}/admin/estatisticas`, {
      method: 'GET',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Estatísticas: ${stats.status} - ${JSON.stringify(stats.data)}`);
    
    // Teste 4: Relatório de jogos (Admin)
    console.log('\n🎮 Testando Relatório de Jogos...');
    const games = await makeRequest(`${baseUrl}/admin/relatorio-jogos`, {
      method: 'GET',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Jogos: ${games.status} - ${JSON.stringify(games.data)}`);
    
    // Teste 5: Relatório de apostas (Admin)
    console.log('\n💰 Testando Relatório de Apostas...');
    const bets = await makeRequest(`${baseUrl}/admin/relatorio-apostas`, {
      method: 'GET',
      headers: {
        'x-admin-token': adminToken,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Apostas: ${bets.status} - ${JSON.stringify(bets.data)}`);
    
    // Teste 6: Status da fila
    console.log('\n📋 Testando Status da Fila...');
    const queue = await makeRequest(`${baseUrl}/fila/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(`✅ Fila: ${queue.status} - ${JSON.stringify(queue.data)}`);
    
    console.log('\n🎉 Testes da API concluídos!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

testAPIEndpoints();
