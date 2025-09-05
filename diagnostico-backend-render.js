// Diagnóstico completo do backend para Render
const https = require('https');
const http = require('http');

console.log('🔍 DIAGNÓSTICO COMPLETO DO BACKEND');
console.log('==================================');

// Teste 1: Verificar se o servidor está respondendo
const testServer = (url, description) => {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n📊 ${description}:`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers:`, res.headers);
        if (data) {
          console.log(`   Response: ${data.substring(0, 200)}...`);
        }
        resolve({
          success: res.statusCode === 200,
          status: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`\n❌ ${description}:`);
      console.log(`   Erro: ${error.message}`);
      console.log(`   Código: ${error.code}`);
      resolve({
        success: false,
        error: error.message,
        code: error.code
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`\n⏰ ${description}: TIMEOUT (10s)`);
      resolve({
        success: false,
        error: 'TIMEOUT'
      });
    });
    
    req.end();
  });
};

// Teste 2: Verificar endpoints específicos
const testEndpoints = async () => {
  const endpoints = [
    { url: 'https://goldeouro-backend.onrender.com/', name: 'API Principal' },
    { url: 'https://goldeouro-backend.onrender.com/health', name: 'Health Check' },
    { url: 'https://goldeouro-backend.onrender.com/api', name: 'API Routes' }
  ];
  
  console.log('\n🧪 TESTANDO ENDPOINTS:');
  console.log('======================');
  
  for (const endpoint of endpoints) {
    await testServer(endpoint.url, endpoint.name);
  }
};

// Teste 3: Verificar se é problema de DNS
const testDNS = () => {
  return new Promise((resolve) => {
    const dns = require('dns');
    dns.lookup('goldeouro-backend.onrender.com', (err, address, family) => {
      if (err) {
        console.log('\n❌ DNS Lookup:');
        console.log(`   Erro: ${err.message}`);
        resolve(false);
      } else {
        console.log('\n✅ DNS Lookup:');
        console.log(`   IP: ${address}`);
        console.log(`   Family: ${family}`);
        resolve(true);
      }
    });
  });
};

// Teste 4: Verificar conectividade de rede
const testConnectivity = () => {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      console.log('\n✅ Conectividade: OK');
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      console.log('\n❌ Conectividade:');
      console.log(`   Erro: ${err.message}`);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log('\n⏰ Conectividade: TIMEOUT');
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(443, 'goldeouro-backend.onrender.com');
  });
};

// Executar todos os testes
async function runDiagnostics() {
  console.log('\n🔍 TESTANDO DNS:');
  console.log('================');
  await testDNS();
  
  console.log('\n🔍 TESTANDO CONECTIVIDADE:');
  console.log('==========================');
  await testConnectivity();
  
  await testEndpoints();
  
  console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
  console.log('==========================');
  console.log('1. Se DNS falhar: Problema de rede local');
  console.log('2. Se conectividade falhar: Firewall ou proxy');
  console.log('3. Se endpoints retornarem 503: Servidor não iniciou');
  console.log('4. Se endpoints retornarem 404: Rota não encontrada');
  console.log('5. Se endpoints retornarem 500: Erro interno do servidor');
  
  console.log('\n🚨 AÇÕES RECOMENDADAS:');
  console.log('======================');
  console.log('1. Verificar logs no Render Dashboard');
  console.log('2. Verificar se as variáveis de ambiente estão configuradas');
  console.log('3. Fazer redeploy manual no Render');
  console.log('4. Verificar se o build foi bem-sucedido');
}

runDiagnostics().catch(console.error);
