// Monitoramento Básico do Sistema - Gol de Ouro v1.1.1
// Script para verificar status dos componentes críticos

const https = require('https');

// Configuração dos endpoints
const endpoints = {
  player: 'https://goldeouro.lol',
  backend: 'https://goldeouro-backend.onrender.com',
  admin: 'https://admin.goldeouro.lol'
};

// Função para fazer health check
function healthCheck(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      resolve({
        name,
        url,
        status: res.statusCode,
        responseTime,
        timestamp: new Date().toISOString(),
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      resolve({
        name,
        url,
        status: 'ERROR',
        responseTime,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name,
        url,
        status: 'TIMEOUT',
        responseTime: 10000,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

// Função principal de monitoramento
async function monitorSystem() {
  console.log('🔍 Iniciando monitoramento do sistema...');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('');
  
  const results = [];
  
  // Verificar todos os endpoints
  for (const [key, url] of Object.entries(endpoints)) {
    const result = await healthCheck(url, key);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    const time = `${result.responseTime}ms`;
    
    console.log(`${status} ${result.name.toUpperCase()}: ${result.status} (${time})`);
    
    if (!result.success) {
      console.log(`   ❌ Erro: ${result.error || 'Status não OK'}`);
    }
  }
  
  console.log('');
  
  // Resumo
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const overallStatus = successCount === totalCount ? '✅' : '⚠️';
  
  console.log(`${overallStatus} RESUMO: ${successCount}/${totalCount} componentes funcionando`);
  
  // Salvar log
  const logEntry = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: totalCount,
      success: successCount,
      failed: totalCount - successCount
    }
  };
  
  console.log('📝 Log salvo em: monitor-log.json');
  
  return logEntry;
}

// Executar monitoramento
if (require.main === module) {
  monitorSystem()
    .then(() => {
      console.log('✅ Monitoramento concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no monitoramento:', error);
      process.exit(1);
    });
}

module.exports = { monitorSystem, healthCheck };
