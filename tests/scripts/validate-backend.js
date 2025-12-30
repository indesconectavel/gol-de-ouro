// Script para Validar Conectividade com Backend
// FASE 2.5 - Validação de Ambiente

const axios = require('axios');
const testConfig = require('../config/testConfig');

/**
 * Validar conectividade e endpoints do backend
 */
async function validateBackend() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 VALIDAÇÃO DE CONECTIVIDADE COM BACKEND');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🌐 Backend: ${testConfig.staging.baseURL}`);
  console.log('');

  const results = {
    health: false,
    endpoints: {},
    errors: []
  };

  // Teste 1: Health Check
  try {
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await axios.get(`${testConfig.staging.baseURL}/health`, {
      timeout: 5000
    });
    
    if (healthResponse.status === 200) {
      console.log('   ✅ Health Check OK');
      results.health = true;
      results.endpoints.health = {
        status: healthResponse.status,
        data: healthResponse.data
      };
    } else {
      console.log(`   ⚠️ Health Check retornou status ${healthResponse.status}`);
      results.endpoints.health = { status: healthResponse.status };
    }
  } catch (error) {
    console.log(`   ❌ Health Check falhou: ${error.message}`);
    results.errors.push(`Health Check: ${error.message}`);
  }

  console.log('');

  // Teste 2: Endpoint de Login (sem autenticação)
  try {
    console.log('2️⃣ Testando endpoint de Login...');
    const loginResponse = await axios.post(
      `${testConfig.staging.baseURL}/api/auth/login`,
      { email: 'test@invalid.com', password: 'invalid' },
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true // Aceitar qualquer status
      }
    );
    
    // Deve retornar 401 ou 400 (não 404 ou 500)
    if (loginResponse.status === 401 || loginResponse.status === 400) {
      console.log(`   ✅ Endpoint de Login acessível (status ${loginResponse.status} esperado)`);
      results.endpoints.login = {
        status: loginResponse.status,
        accessible: true
      };
    } else if (loginResponse.status === 404) {
      console.log(`   ❌ Endpoint de Login não encontrado (404)`);
      results.errors.push('Endpoint /api/auth/login retorna 404');
    } else {
      console.log(`   ⚠️ Endpoint de Login retornou status ${loginResponse.status}`);
      results.endpoints.login = {
        status: loginResponse.status,
        accessible: loginResponse.status < 500
      };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log(`   ❌ Backend não acessível: ${error.message}`);
      results.errors.push(`Backend não acessível: ${error.message}`);
    } else {
      console.log(`   ⚠️ Erro ao testar Login: ${error.message}`);
      results.errors.push(`Login: ${error.message}`);
    }
  }

  console.log('');

  // Teste 3: Endpoint de Métricas (público)
  try {
    console.log('3️⃣ Testando endpoint de Métricas...');
    const metricsResponse = await axios.get(
      `${testConfig.staging.baseURL}/api/metrics`,
      { timeout: 5000 }
    );
    
    if (metricsResponse.status === 200) {
      console.log('   ✅ Endpoint de Métricas acessível');
      results.endpoints.metrics = {
        status: metricsResponse.status,
        accessible: true
      };
    } else {
      console.log(`   ⚠️ Métricas retornou status ${metricsResponse.status}`);
      results.endpoints.metrics = { status: metricsResponse.status };
    }
  } catch (error) {
    console.log(`   ⚠️ Erro ao testar Métricas: ${error.message}`);
    results.errors.push(`Métricas: ${error.message}`);
  }

  console.log('');

  // Teste 4: Endpoint Admin (deve retornar 401/403 sem token)
  try {
    console.log('4️⃣ Testando endpoint Admin (sem token)...');
    const adminResponse = await axios.get(
      `${testConfig.staging.baseURL}/api/admin/stats`,
      {
        timeout: 5000,
        validateStatus: () => true
      }
    );
    
    if (adminResponse.status === 401 || adminResponse.status === 403) {
      console.log(`   ✅ Endpoint Admin protegido corretamente (status ${adminResponse.status})`);
      results.endpoints.admin = {
        status: adminResponse.status,
        protected: true
      };
    } else if (adminResponse.status === 404) {
      console.log(`   ⚠️ Endpoint Admin não encontrado (404) - pode estar em rota diferente`);
      results.endpoints.admin = {
        status: adminResponse.status,
        note: 'Endpoint pode estar em rota diferente'
      };
    } else {
      console.log(`   ⚠️ Endpoint Admin retornou status ${adminResponse.status}`);
      results.endpoints.admin = { status: adminResponse.status };
    }
  } catch (error) {
    console.log(`   ⚠️ Erro ao testar Admin: ${error.message}`);
    results.errors.push(`Admin: ${error.message}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMO DA VALIDAÇÃO');
  console.log('═══════════════════════════════════════════════════════');

  if (results.health) {
    console.log('✅ Backend está acessível');
  } else {
    console.log('❌ Backend não está acessível');
  }

  if (results.endpoints.login?.accessible) {
    console.log('✅ Endpoint de Login acessível');
  } else {
    console.log('⚠️ Endpoint de Login pode ter problemas');
  }

  if (results.endpoints.metrics?.accessible) {
    console.log('✅ Endpoint de Métricas acessível');
  } else {
    console.log('⚠️ Endpoint de Métricas pode ter problemas');
  }

  if (results.errors.length > 0) {
    console.log('');
    console.log('⚠️ Erros encontrados:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('═══════════════════════════════════════════════════════');

  return results;
}

// Executar se chamado diretamente
if (require.main === module) {
  validateBackend()
    .then(results => {
      process.exit(results.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = validateBackend;

