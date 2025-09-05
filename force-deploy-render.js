// Script para forçar deploy no Render
const https = require('https');

console.log('🚀 FORÇANDO DEPLOY NO RENDER');
console.log('============================');

// Verificar se o servidor otimizado está funcionando
const testOptimizedServer = () => {
  return new Promise((resolve) => {
    const req = https.request('https://goldeouro-backend.onrender.com/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('📊 Status do servidor atual:');
          console.log(`   Status: ${json.status}`);
          console.log(`   Environment: ${json.environment}`);
          console.log(`   Memory: ${json.memory ? json.memory.heapPercent + '%' : 'N/A'}`);
          console.log(`   Uptime: ${json.uptime}s`);
          resolve(true);
        } catch (e) {
          console.log('❌ Erro ao parsear resposta:', e.message);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Erro na requisição:', error.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('⏰ Timeout na requisição');
      resolve(false);
    });
    
    req.end();
  });
};

// Verificar se há erros no servidor
const checkServerErrors = () => {
  return new Promise((resolve) => {
    const req = https.request('https://goldeouro-backend.onrender.com/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📊 Resposta da API:');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data.substring(0, 200)}...`);
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Erro na API:', error.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('⏰ Timeout na API');
      resolve(false);
    });
    
    req.end();
  });
};

// Executar verificações
async function forceDeploy() {
  console.log('🔍 Verificando status atual do servidor...\n');
  
  const healthOk = await testOptimizedServer();
  const apiOk = await checkServerErrors();
  
  console.log('\n📋 DIAGNÓSTICO:');
  console.log('================');
  
  if (healthOk && apiOk) {
    console.log('✅ Servidor está funcionando');
    console.log('⚠️ Mas pode estar usando server.js original');
    console.log('🔧 Solução: Fazer redeploy manual no Render');
  } else {
    console.log('❌ Servidor com problemas');
    console.log('🔧 Solução: Verificar logs e fazer redeploy');
  }
  
  console.log('\n🚀 AÇÕES RECOMENDADAS:');
  console.log('======================');
  console.log('1. Acessar: https://dashboard.render.com');
  console.log('2. Ir para: goldeouro-backend');
  console.log('3. Clicar em: "Manual Deploy"');
  console.log('4. Aguardar: Conclusão do build');
  console.log('5. Verificar: Logs para confirmar server-optimized.js');
  
  console.log('\n📊 VERIFICAÇÕES PÓS-DEPLOY:');
  console.log('===========================');
  console.log('1. Verificar se logs mostram "Servidor otimizado rodando"');
  console.log('2. Confirmar que monitoramento está ativo');
  console.log('3. Verificar se uso de memória diminuiu');
  console.log('4. Confirmar que limpezas de emergência pararam');
}

forceDeploy().catch(console.error);
