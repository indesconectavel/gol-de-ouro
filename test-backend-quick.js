// Teste rápido do backend em produção
const https = require('https');

console.log('🚨 VERIFICAÇÃO URGENTE DO BACKEND');
console.log('==================================');

const testUrl = (url, description) => {
  return new Promise((resolve) => {
    const req = https.request(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${description}: ${res.statusCode} OK`);
        if (data) {
          try {
            const json = JSON.parse(data);
            if (json.status) console.log(`   Status: ${json.status}`);
            if (json.database) console.log(`   Database: ${json.database}`);
            if (json.environment) console.log(`   Environment: ${json.environment}`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}...`);
          }
        }
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${description}: ERROR - ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ ${description}: TIMEOUT`);
      resolve(false);
    });
    
    req.end();
  });
};

async function runTests() {
  console.log('Testando backend...\n');
  
  const healthOk = await testUrl('https://goldeouro-backend.onrender.com/health', 'Health Check');
  const apiOk = await testUrl('https://goldeouro-backend.onrender.com/', 'API Principal');
  
  console.log('\n==================================');
  if (healthOk && apiOk) {
    console.log('🎉 BACKEND FUNCIONANDO!');
    console.log('✅ Deploy ativo');
    console.log('✅ Health check OK');
    console.log('✅ API respondendo');
  } else {
    console.log('🚨 BACKEND COM PROBLEMAS!');
    console.log('❌ Verificar deploy no Render');
    console.log('❌ Configurar variáveis de ambiente');
    console.log('❌ Fazer redeploy manual');
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Acessar: https://dashboard.render.com');
  console.log('2. Localizar projeto: goldeouro-backend');
  console.log('3. Configurar variáveis de ambiente');
  console.log('4. Fazer redeploy manual');
}

runTests().catch(console.error);
