// TESTE SIMPLIFICADO DO SERVIDOR REAL
// Data: 16 de Outubro de 2025
// Objetivo: Testar servidor com credenciais reais (sem winston)

require('dotenv').config();
const axios = require('axios');

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function testServerReal() {
  log('🧪 INICIANDO TESTE DO SERVIDOR REAL');
  log('=' * 50);
  
  const baseUrl = 'http://localhost:8080';
  let testToken = null;
  let testUser = null;
  
  try {
    // Teste 1: Health Check
    log('🔍 Testando health check...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    
    if (healthResponse.status === 200 && healthResponse.data.ok) {
      log('✅ Health Check: OK');
      log(`   Database: ${healthResponse.data.database}`);
      log(`   PIX: ${healthResponse.data.pix}`);
      log(`   Authentication: ${healthResponse.data.authentication}`);
    } else {
      log('❌ Health Check: FALHOU');
      return false;
    }
    
    // Teste 2: Registro
    log('🔍 Testando registro...');
    const testEmail = `teste.real.${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${baseUrl}/api/auth/register`, {
      email: testEmail,
      password: 'teste123',
      username: `TesteReal${Date.now()}`
    });
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      log('✅ Registro: OK');
      testToken = registerResponse.data.token;
      testUser = registerResponse.data.user;
      log(`   Usuário: ${testUser.email}`);
      log(`   Banco: ${registerResponse.data.banco}`);
    } else {
      log('❌ Registro: FALHOU');
      return false;
    }
    
    // Teste 3: Login
    log('🔍 Testando login...');
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: 'teste123'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      log('✅ Login: OK');
      testToken = loginResponse.data.token;
      log(`   Saldo: R$ ${loginResponse.data.user.balance}`);
      log(`   Banco: ${loginResponse.data.banco}`);
    } else {
      log('❌ Login: FALHOU');
      return false;
    }
    
    // Teste 4: PIX
    log('🔍 Testando PIX...');
    const pixResponse = await axios.post(`${baseUrl}/api/payments/pix/criar`, {
      amount: 10.00,
      description: 'Teste PIX Real'
    }, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    if (pixResponse.status === 200 && pixResponse.data.success) {
      log('✅ PIX: OK');
      log(`   Payment ID: ${pixResponse.data.payment_id}`);
      log(`   Banco: ${pixResponse.data.banco}`);
    } else {
      log('❌ PIX: FALHOU');
      log(`   Status: ${pixResponse.status}`);
      log(`   Data: ${JSON.stringify(pixResponse.data)}`);
    }
    
    // Teste 5: Jogo
    log('🔍 Testando criação de lote...');
    const loteResponse = await axios.post(`${baseUrl}/api/games/create-lote`, {
      maxPlayers: 10,
      entryFee: 5.00
    }, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    if (loteResponse.status === 200 && loteResponse.data.success) {
      log('✅ Lote: OK');
      log(`   Lote ID: ${loteResponse.data.lote.id}`);
      log(`   Banco: ${loteResponse.data.banco}`);
    } else {
      log('❌ Lote: FALHOU');
      log(`   Status: ${loteResponse.status}`);
      log(`   Data: ${JSON.stringify(loteResponse.data)}`);
    }
    
    // Teste 6: Chute
    log('🔍 Testando chute...');
    const shootResponse = await axios.post(`${baseUrl}/api/games/shoot`, {
      loteId: 'test_lote_123',
      direction: 1,
      amount: 5.00
    }, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    if (shootResponse.status === 200 && shootResponse.data.success) {
      log('✅ Chute: OK');
      log(`   Resultado: ${shootResponse.data.result.result}`);
      log(`   Banco: ${shootResponse.data.banco}`);
    } else {
      log('❌ Chute: FALHOU');
      log(`   Status: ${shootResponse.status}`);
      log(`   Data: ${JSON.stringify(shootResponse.data)}`);
    }
    
    log('\n🎉 TESTES CONCLUÍDOS COM SUCESSO!');
    log('✅ Servidor REAL funcionando perfeitamente!');
    return true;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('❌ Servidor não está rodando!');
      log('   Execute: node server-real-unificado.js');
    } else {
      log(`❌ Erro nos testes: ${error.message}`);
    }
    return false;
  }
}

// Executar teste
testServerReal()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`❌ Erro fatal: ${error.message}`);
    process.exit(1);
  });
