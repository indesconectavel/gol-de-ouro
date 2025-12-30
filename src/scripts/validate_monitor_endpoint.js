/**
 * VALIDATE MONITOR ENDPOINT - Valida endpoint /monitor
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:8080';

async function validarMonitorEndpoint() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DO ENDPOINT /monitor');
  console.log('============================================================\n');
  
  console.log(`🔍 Acessando: ${API_URL}/monitor\n`);
  
  try {
    const response = await axios.get(`${API_URL}/monitor`, {
      timeout: 5000
    });
    
    if (response.status !== 200) {
      console.error(`❌ Status HTTP inválido: ${response.status}`);
      return { success: false, error: `Status ${response.status}` };
    }
    
    const data = response.data;
    
    console.log('✅ Resposta recebida:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');
    
    // Validar campos obrigatórios
    const validacoes = {
      status: data.status === 'ok',
      engineVersion: data.engineVersion === 'V19',
      dbQueue: data.dbQueue === true,
      heartbeat: data.heartbeat === true,
      metricsCount: data.metrics && Object.keys(data.metrics).length > 0,
      filaSize: typeof data.filaSize === 'number' && data.filaSize >= 0,
      lotesAtivos: typeof data.lotesAtivos === 'number' && data.lotesAtivos >= 0
    };
    
    console.log('📋 Validações:');
    Object.entries(validacoes).forEach(([campo, valido]) => {
      if (valido) {
        console.log(`   ✅ ${campo}: OK`);
      } else {
        console.log(`   ❌ ${campo}: FALHOU`);
        console.log(`      Valor recebido: ${JSON.stringify(data[campo])}`);
      }
    });
    
    const todasValidas = Object.values(validacoes).every(v => v === true);
    
    if (!todasValidas) {
      console.log('\n❌ Algumas validações falharam');
      console.log('\n💡 Diagnóstico:');
      if (!validacoes.status) {
        console.log('   - Status não é "ok" - verifique logs do servidor');
      }
      if (!validacoes.engineVersion) {
        console.log('   - ENGINE_VERSION não está configurado como "V19"');
      }
      if (!validacoes.dbQueue) {
        console.log('   - USE_DB_QUEUE não está ativado');
      }
      if (!validacoes.heartbeat) {
        console.log('   - Heartbeat não está funcionando');
      }
    } else {
      console.log('\n✅ Todas as validações passaram!');
    }
    
    return {
      success: todasValidas,
      data,
      validacoes
    };
  } catch (error) {
    console.error('❌ Erro ao acessar /monitor:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Diagnóstico:');
      console.error('   - Servidor não está rodando');
      console.error('   - Execute: npm start');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Diagnóstico:');
      console.error('   - Servidor não respondeu a tempo');
      console.error('   - Verifique se está rodando na porta 8080');
    }
    
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  validarMonitorEndpoint()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Endpoint /monitor validado com sucesso');
        process.exit(0);
      } else {
        console.log('\n❌ Validação do endpoint /monitor falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarMonitorEndpoint };

