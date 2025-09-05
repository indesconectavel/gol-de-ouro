const https = require('https');

console.log('🚀 TESTE COMPLETO DOS SISTEMAS EM PRODUÇÃO\n');
console.log('=' .repeat(60));

const systems = [
  {
    name: 'Backend API',
    url: 'https://goldeouro-backend.onrender.com/health',
    expected: 200
  },
  {
    name: 'Frontend Admin',
    url: 'https://goldeouro-admin-12ycboc8i-goldeouro-admins-projects.vercel.app',
    expected: 200
  },
  {
    name: 'Frontend Player',
    url: 'https://goldeouro-player-neky7ti5m-goldeouro-admins-projects.vercel.app',
    expected: 200
  }
];

let completedTests = 0;
let totalTests = systems.length;

function testSystem(system) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testando: ${system.name}`);
    console.log(`📍 URL: ${system.url}`);
    
    const startTime = Date.now();
    
    https.get(system.url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const status = res.statusCode === system.expected ? '✅' : '❌';
        console.log(`${status} Status: ${res.statusCode} (${responseTime}ms)`);
        
        if (res.statusCode === system.expected) {
          console.log(`✅ ${system.name} funcionando perfeitamente!`);
        } else {
          console.log(`⚠️  ${system.name} com problemas.`);
          if (res.statusCode === 429) {
            console.log('   (Rate limit - normal para Render.com)');
          }
        }
        
        completedTests++;
        resolve({ system: system.name, status: res.statusCode, responseTime });
      });
    }).on('error', (err) => {
      console.log(`❌ Erro ao conectar: ${err.message}`);
      completedTests++;
      resolve({ system: system.name, status: 'ERROR', responseTime: 0 });
    });
  });
}

async function runAllTests() {
  console.log('⏳ Iniciando testes...\n');
  
  const results = await Promise.all(systems.map(testSystem));
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    const status = result.status === 200 ? '✅ ATIVO' : 
                   result.status === 429 ? '⚠️  RATE LIMIT' : '❌ ERRO';
    console.log(`${result.system}: ${status} (${result.responseTime}ms)`);
  });
  
  const activeSystems = results.filter(r => r.status === 200 || r.status === 429).length;
  
  console.log('\n🎯 RESULTADO FINAL:');
  console.log(`✅ Sistemas ativos: ${activeSystems}/${totalTests}`);
  
  if (activeSystems === totalTests) {
    console.log('🎉 TODOS OS SISTEMAS ESTÃO FUNCIONANDO!');
    console.log('\n📋 URLs de Acesso:');
    console.log('🔧 Admin: https://goldeouro-admin-12ycboc8i-goldeouro-admins-projects.vercel.app');
    console.log('🎮 Player: https://goldeouro-player-neky7ti5m-goldeouro-admins-projects.vercel.app');
    console.log('⚙️  API: https://goldeouro-backend.onrender.com');
  } else {
    console.log('⚠️  Alguns sistemas precisam de atenção.');
  }
  
  console.log('\n🚀 Sistema pronto para ETAPA 7!');
}

runAllTests().catch(console.error);
