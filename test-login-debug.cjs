// Teste Login Debug - Gol de Ouro v1.1.1
const https = require('https');

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';

// Função para fazer requisição HTTP
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
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

// Teste Login Debug
async function testLoginDebug() {
  console.log('🔐 TESTE LOGIN DEBUG - GOL DE OURO');
  console.log('==================================');
  
  // 1. Verificar health
  console.log('🔍 Verificando health...');
  try {
    const healthResponse = await httpRequest(`${BACKEND_URL}/health`);
    console.log('   Health Status:', healthResponse.status);
    console.log('   Health Data:', healthResponse.data);
  } catch (error) {
    console.log('   Health Error:', error.message);
  }
  
  console.log('');
  
  // 2. Testar login com diferentes credenciais
  const testCredentials = [
    { email: 'free10signer@gmail.com', password: 'Free10signer' },
    { email: 'free10signer@gmail.com', password: 'password' },
    { email: 'test@test.com', password: 'test' },
    { email: 'admin@admin.com', password: 'admin' }
  ];
  
  for (const creds of testCredentials) {
    console.log(`🔐 Testando login: ${creds.email} / ${creds.password}`);
    
    try {
      const response = await httpRequest(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(creds)
      });
      
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      
      if (response.status === 200) {
        console.log('   ✅ LOGIN SUCESSO!');
        console.log('   Token:', response.data.token ? 'Gerado' : 'Não gerado');
        console.log('   User:', response.data.user ? 'Presente' : 'Ausente');
        break;
      } else {
        console.log('   ❌ Login falhou');
      }
    } catch (error) {
      console.log('   ❌ Erro:', error.message);
    }
    
    console.log('');
  }
  
  // 3. Verificar usuários no backend
  console.log('👥 Verificando usuários no backend...');
  try {
    // Tentar acessar rota que lista usuários (se existir)
    const usersResponse = await httpRequest(`${BACKEND_URL}/api/users`);
    console.log('   Users Status:', usersResponse.status);
    console.log('   Users Data:', usersResponse.data);
  } catch (error) {
    console.log('   Users Error:', error.message);
  }
  
  console.log('');
  console.log('✅ TESTE LOGIN DEBUG CONCLUÍDO');
}

// Executar
testLoginDebug().catch(console.error);
