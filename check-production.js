const https = require('https');

console.log('🔍 Verificando status da produção...\n');

const testUrl = 'https://goldeouro-backend.onrender.com/health';

https.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📊 Response: ${data}`);
    
    if (res.statusCode === 200) {
      console.log('\n🎉 Produção funcionando perfeitamente!');
    } else {
      console.log('\n⚠️  Produção com problemas, verificar logs.');
    }
  });
}).on('error', (err) => {
  console.log(`❌ Erro ao conectar: ${err.message}`);
  console.log('\n🔧 Possíveis soluções:');
  console.log('1. Verificar se o deploy foi concluído');
  console.log('2. Aguardar alguns minutos (cold start)');
  console.log('3. Verificar variáveis de ambiente no Render.com');
});
