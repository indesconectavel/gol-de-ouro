/**
 * VALIDATE METRICS ENDPOINT - Valida endpoint /metrics (Prometheus)
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:8080';

async function validarMetricsEndpoint() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DO ENDPOINT /metrics');
  console.log('============================================================\n');
  
  console.log(`🔍 Acessando: ${API_URL}/metrics\n`);
  
  try {
    const response = await axios.get(`${API_URL}/metrics`, {
      timeout: 5000,
      headers: {
        'Accept': 'text/plain'
      }
    });
    
    if (response.status !== 200) {
      console.error(`❌ Status HTTP inválido: ${response.status}`);
      return { success: false, error: `Status ${response.status}` };
    }
    
    const metricsText = response.data;
    
    // Validar formato Prometheus
    const validacoes = {
      contentType: response.headers['content-type']?.includes('text/plain'),
      processCpu: metricsText.includes('process_cpu_user_seconds_total'),
      httpRequestDuration: metricsText.includes('http_request_duration_seconds'),
      engineV19Active: metricsText.includes('engine_v19_active 1')
    };
    
    console.log('📋 Validações:');
    Object.entries(validacoes).forEach(([campo, valido]) => {
      if (valido) {
        console.log(`   ✅ ${campo}: OK`);
      } else {
        console.log(`   ❌ ${campo}: FALHOU`);
      }
    });
    
    // Mostrar métricas relevantes
    console.log('\n📊 Métricas encontradas:');
    const linhas = metricsText.split('\n');
    const metricasRelevantes = linhas.filter(l => 
      l.includes('engine_v19') || 
      l.includes('goldeouro_') ||
      l.includes('process_cpu') ||
      l.includes('http_request')
    ).slice(0, 10);
    
    metricasRelevantes.forEach(m => {
      if (m.trim() && !m.startsWith('#')) {
        console.log(`   ${m}`);
      }
    });
    
    const todasValidas = Object.values(validacoes).every(v => v === true);
    
    if (!todasValidas) {
      console.log('\n❌ Algumas validações falharam');
      console.log('\n💡 Diagnóstico:');
      if (!validacoes.engineV19Active) {
        console.log('   - engine_v19_active não está presente ou não é 1');
        console.log('   - Verifique se USE_ENGINE_V19=true');
      }
    } else {
      console.log('\n✅ Todas as validações passaram!');
    }
    
    return {
      success: todasValidas,
      metricsText: metricsText.substring(0, 500), // Primeiros 500 chars
      validacoes
    };
  } catch (error) {
    console.error('❌ Erro ao acessar /metrics:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Diagnóstico:');
      console.error('   - Servidor não está rodando');
      console.error('   - Execute: npm start');
    }
    
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  validarMetricsEndpoint()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Endpoint /metrics validado com sucesso');
        process.exit(0);
      } else {
        console.log('\n❌ Validação do endpoint /metrics falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarMetricsEndpoint };

