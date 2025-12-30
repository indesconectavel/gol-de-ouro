/**
 * SCRIPT DE VALIDAÇÃO DO SERVIDOR OPERACIONAL
 * 
 * Valida que o servidor está funcionando corretamente após correção do prom-client
 */

const axios = require('axios');
const BASE_URL = process.env.API_URL || 'https://goldeouro-backend-v2.fly.dev';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

async function testEndpoint(method, path, data = null, description) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      timeout: 10000,
      validateStatus: () => true // Aceitar qualquer status para análise
    };

    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }

    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    const status = response.status;
    const statusColor = status >= 200 && status < 300 ? 'green' : status >= 400 && status < 500 ? 'yellow' : 'red';
    
    log(`  ${description}`, statusColor);
    log(`    Status: ${status}`, statusColor);
    log(`    Tempo: ${duration}ms`, statusColor);
    
    if (status >= 200 && status < 300) {
      log(`    ✅ Sucesso`, 'green');
      return { success: true, status, duration, data: response.data };
    } else {
      log(`    ⚠️  Resposta não esperada`, 'yellow');
      if (response.data) {
        log(`    Resposta: ${JSON.stringify(response.data).substring(0, 100)}`, 'yellow');
      }
      return { success: false, status, duration, error: response.data };
    }
  } catch (error) {
    log(`  ${description}`, 'red');
    log(`    ❌ Erro: ${error.message}`, 'red');
    if (error.code === 'ECONNABORTED') {
      log(`    ⚠️  Timeout após 10s`, 'yellow');
    }
    return { success: false, error: error.message };
  }
}

async function main() {
  logSection('🚀 VALIDAÇÃO DO SERVIDOR OPERACIONAL');
  
  log(`URL Base: ${BASE_URL}`, 'blue');
  log(`Timestamp: ${new Date().toISOString()}\n`, 'blue');

  const results = {
    health: null,
    monitor: null,
    metrics: null,
    meta: null
  };

  // 1. Teste de Health Check
  logSection('1️⃣  TESTE DE HEALTH CHECK');
  results.health = await testEndpoint('GET', '/health', null, 'GET /health');

  // 2. Teste de Monitoramento
  logSection('2️⃣  TESTE DE MONITORAMENTO');
  results.monitor = await testEndpoint('GET', '/monitor', null, 'GET /monitor');

  // 3. Teste de Métricas Prometheus (opcional)
  logSection('3️⃣  TESTE DE MÉTRICAS PROMETHEUS');
  results.metrics = await testEndpoint('GET', '/metrics', null, 'GET /metrics');

  // 4. Teste de Meta (versão)
  logSection('4️⃣  TESTE DE META/VERSÃO');
  results.meta = await testEndpoint('GET', '/meta', null, 'GET /meta');

  // Resumo Final
  logSection('📊 RESUMO DOS TESTES');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r && r.success).length;
  const failedTests = totalTests - passedTests;

  log(`Total de testes: ${totalTests}`, 'blue');
  log(`✅ Passou: ${passedTests}`, 'green');
  log(`❌ Falhou: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

  console.log('\n' + '='.repeat(70));
  
  // Detalhes dos resultados
  console.log('\n📋 DETALHES:');
  
  if (results.health) {
    log(`\n  Health Check:`, results.health.success ? 'green' : 'red');
    log(`    Status: ${results.health.status}`, results.health.success ? 'green' : 'red');
    log(`    Tempo: ${results.health.duration}ms`, 'blue');
  }

  if (results.monitor) {
    log(`\n  Monitor:`, results.monitor.success ? 'green' : 'red');
    log(`    Status: ${results.monitor.status}`, results.monitor.success ? 'green' : 'red');
    log(`    Tempo: ${results.monitor.duration}ms`, 'blue');
    if (results.monitor.data && results.monitor.data.metrics) {
      log(`    Lotes ativos: ${results.monitor.data.metrics.lotes_ativos_count || 0}`, 'blue');
      log(`    Prometheus disponível: ${results.monitor.data.prometheus_available ? 'Sim' : 'Não'}`, 'blue');
    }
  }

  if (results.metrics) {
    log(`\n  Métricas Prometheus:`, results.metrics.success ? 'green' : 'yellow');
    log(`    Status: ${results.metrics.status}`, results.metrics.status === 503 ? 'yellow' : results.metrics.success ? 'green' : 'red');
    if (results.metrics.status === 503) {
      log(`    ⚠️  Prometheus não disponível (esperado se não configurado)`, 'yellow');
    }
  }

  if (results.meta) {
    log(`\n  Meta/Versão:`, results.meta.success ? 'green' : 'red');
    log(`    Status: ${results.meta.status}`, results.meta.success ? 'green' : 'red');
    if (results.meta.data) {
      log(`    Versão: ${results.meta.data.version || 'N/A'}`, 'blue');
    }
  }

  console.log('\n' + '='.repeat(70));
  
  // Conclusão
  if (failedTests === 0) {
    log('\n🎉 TODOS OS TESTES PASSARAM!', 'green');
    log('✅ Servidor está operacional e funcionando corretamente!', 'green');
  } else if (results.health && results.health.success) {
    log('\n⚠️  ALGUNS TESTES FALHARAM', 'yellow');
    log('✅ Mas o health check está funcionando - servidor operacional!', 'green');
  } else {
    log('\n❌ PROBLEMAS DETECTADOS', 'red');
    log('⚠️  Verifique os logs do servidor para mais detalhes', 'yellow');
  }

  console.log('\n');
  
  // Salvar resultados
  const fs = require('fs');
  const path = require('path');
  const logDir = path.join(__dirname, '../../logs/v19/VERIFICACAO_SUPREMA');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, '25_validacao_servidor_operacional.json');
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    base_url: BASE_URL,
    results: results,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      server_operational: results.health && results.health.success
    }
  }, null, 2));
  
  log(`📝 Resultados salvos em: ${logFile}`, 'blue');
  console.log('\n');
}

main().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

