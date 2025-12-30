/**
 * SCRIPT DE TESTE DAS FUNCIONALIDADES PRINCIPAIS
 * 
 * Testa: Login, PIX, Jogo
 */

const axios = require('axios');
const BASE_URL = process.env.API_URL || 'https://goldeouro-backend-v2.fly.dev';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

function logSuccess(message) {
  log(`  ✅ ${message}`, 'green');
}

function logError(message) {
  log(`  ❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`  ℹ️  ${message}`, 'blue');
}

// Credenciais de teste
const TEST_CREDENTIALS = {
  email: 'free10signer@gmail.com',
  password: 'Free10signer'
};

let authToken = null;
let userId = null;
let initialBalance = null;

async function testLogin() {
  logSection('1️⃣  TESTE DE AUTENTICAÇÃO (LOGIN)');
  
  try {
    logInfo(`Tentando fazer login com: ${TEST_CREDENTIALS.email}`);
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password
    }, {
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status === 200 && response.data.success) {
      authToken = response.data.token || response.data.data?.token;
      userId = response.data.user?.id || response.data.data?.user?.id;
      
      if (authToken) {
        logSuccess('Login realizado com sucesso!');
        logInfo(`Token obtido: ${authToken.substring(0, 20)}...`);
        if (userId) {
          logInfo(`User ID: ${userId}`);
        }
        return { success: true, token: authToken, userId };
      } else {
        logError('Login retornou sucesso mas sem token');
        logInfo(`Resposta: ${JSON.stringify(response.data).substring(0, 200)}`);
        return { success: false, error: 'Token não encontrado na resposta' };
      }
    } else {
      logError(`Login falhou: Status ${response.status}`);
      logInfo(`Resposta: ${JSON.stringify(response.data).substring(0, 200)}`);
      return { success: false, error: response.data.message || 'Erro desconhecido' };
    }
  } catch (error) {
    logError(`Erro ao fazer login: ${error.message}`);
    if (error.response) {
      logInfo(`Status: ${error.response.status}`);
      logInfo(`Resposta: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return { success: false, error: error.message };
  }
}

async function getProfile() {
  if (!authToken) {
    logWarning('Token não disponível - pulando verificação de perfil');
    return null;
  }

  try {
    logInfo('Verificando perfil do usuário...');
    
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status === 200 && response.data.success) {
      const saldo = response.data.data?.saldo || response.data.saldo || response.data.data?.balance || 0;
      initialBalance = parseFloat(saldo);
      logSuccess(`Perfil obtido com sucesso!`);
      logInfo(`Saldo atual: R$ ${initialBalance.toFixed(2)}`);
      return { success: true, saldo: initialBalance, data: response.data };
    } else {
      logWarning(`Não foi possível obter perfil: Status ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    logWarning(`Erro ao obter perfil: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createPIX(valor = 5.00) {
  logSection('2️⃣  TESTE DE CRIAÇÃO DE PIX');
  
  if (!authToken) {
    logError('Token não disponível - necessário fazer login primeiro');
    return { success: false, error: 'Token não disponível' };
  }

  try {
    logInfo(`Criando PIX no valor de R$ ${valor.toFixed(2)}...`);
    
    const response = await axios.post(`${BASE_URL}/api/payments/pix/criar`, {
      valor: valor
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000,
      validateStatus: () => true
    });

    if (response.status === 200 || response.status === 201) {
      const data = response.data.data || response.data;
      
      if (data.qr_code || data.qr_code_base64 || data.pix_copy_paste) {
        logSuccess('PIX criado com sucesso!');
        logInfo(`Payment ID: ${data.payment_id || data.id || 'N/A'}`);
        logInfo(`Status: ${data.status || 'N/A'}`);
        logInfo(`Valor: R$ ${data.valor || data.amount || valor}`);
        
        if (data.qr_code_base64) {
          logInfo('QR Code Base64 gerado');
        }
        if (data.pix_copy_paste) {
          logInfo('PIX Copy & Paste gerado');
        }
        
        return { 
          success: true, 
          paymentId: data.payment_id || data.id,
          qrCode: data.qr_code_base64 || data.qr_code,
          pixCopyPaste: data.pix_copy_paste,
          valor: data.valor || data.amount || valor,
          data: data
        };
      } else {
        logError('PIX criado mas sem QR Code');
        logInfo(`Resposta: ${JSON.stringify(data).substring(0, 300)}`);
        return { success: false, error: 'QR Code não encontrado' };
      }
    } else {
      logError(`Criação de PIX falhou: Status ${response.status}`);
      logInfo(`Resposta: ${JSON.stringify(response.data).substring(0, 300)}`);
      return { success: false, error: response.data.message || 'Erro desconhecido', status: response.status };
    }
  } catch (error) {
    logError(`Erro ao criar PIX: ${error.message}`);
    if (error.response) {
      logInfo(`Status: ${error.response.status}`);
      logInfo(`Resposta: ${JSON.stringify(error.response.data).substring(0, 300)}`);
    }
    return { success: false, error: error.message };
  }
}

async function playGame(direction = 'left', amount = 5.00) {
  logSection('3️⃣  TESTE DE JOGO (CHUTE)');
  
  if (!authToken) {
    logError('Token não disponível - necessário fazer login primeiro');
    return { success: false, error: 'Token não disponível' };
  }

  try {
    logInfo(`Fazendo chute: ${direction}, valor: R$ ${amount.toFixed(2)}...`);
    
    const response = await axios.post(`${BASE_URL}/api/games/shoot`, {
      direction: direction,
      amount: amount
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000,
      validateStatus: () => true
    });

    if (response.status === 200 || response.status === 201) {
      const data = response.data.data || response.data;
      
      logSuccess('Chute processado com sucesso!');
      logInfo(`Resultado: ${data.resultado || data.result || 'N/A'}`);
      logInfo(`Lote ID: ${data.lote_id || data.loteId || 'N/A'}`);
      logInfo(`Posição: ${data.posicao || data.position || 'N/A'}`);
      
      if (data.is_winner !== undefined) {
        logInfo(`Ganhou: ${data.is_winner ? 'SIM 🎉' : 'Não'}`);
      }
      
      if (data.saldo !== undefined) {
        logInfo(`Saldo após chute: R$ ${parseFloat(data.saldo).toFixed(2)}`);
      }
      
      return { 
        success: true, 
        resultado: data.resultado || data.result,
        loteId: data.lote_id || data.loteId,
        isWinner: data.is_winner,
        saldo: data.saldo,
        data: data
      };
    } else {
      logError(`Chute falhou: Status ${response.status}`);
      logInfo(`Resposta: ${JSON.stringify(response.data).substring(0, 300)}`);
      return { success: false, error: response.data.message || 'Erro desconhecido', status: response.status };
    }
  } catch (error) {
    logError(`Erro ao fazer chute: ${error.message}`);
    if (error.response) {
      logInfo(`Status: ${error.response.status}`);
      logInfo(`Resposta: ${JSON.stringify(error.response.data).substring(0, 300)}`);
    }
    return { success: false, error: error.message };
  }
}

async function verifyBalanceAfterGame() {
  if (!authToken) {
    return null;
  }

  try {
    const profile = await getProfile();
    if (profile && profile.success) {
      const newBalance = profile.saldo;
      if (initialBalance !== null) {
        const difference = initialBalance - newBalance;
        logInfo(`Saldo inicial: R$ ${initialBalance.toFixed(2)}`);
        logInfo(`Saldo atual: R$ ${newBalance.toFixed(2)}`);
        logInfo(`Diferença: R$ ${difference.toFixed(2)}`);
        
        if (difference > 0) {
          logSuccess('Saldo foi debitado corretamente!');
        } else if (difference === 0) {
          logWarning('Saldo não foi debitado - verificar se o jogo realmente debitou');
        } else {
          logWarning('Saldo aumentou - pode ter havido crédito ou erro');
        }
        return { success: true, saldo: newBalance, difference: difference };
      }
      return { success: true, saldo: newBalance };
    }
  } catch (error) {
    logWarning(`Erro ao verificar saldo: ${error.message}`);
  }
  return null;
}

async function main() {
  logSection('🚀 TESTE DAS FUNCIONALIDADES PRINCIPAIS');
  
  log(`URL Base: ${BASE_URL}`, 'blue');
  log(`Timestamp: ${new Date().toISOString()}\n`, 'blue');

  const results = {
    login: null,
    profile: null,
    pix: null,
    game: null,
    balanceCheck: null
  };

  // 1. Teste de Login
  results.login = await testLogin();
  
  if (!results.login.success) {
    logError('\n❌ Login falhou - não é possível continuar os testes');
    logInfo('Verifique as credenciais e tente novamente\n');
    process.exit(1);
  }

  // 2. Verificar perfil e saldo inicial
  results.profile = await getProfile();

  // 3. Criar PIX
  results.pix = await createPIX(5.00);

  // 4. Fazer chute no jogo
  results.game = await playGame('left', 5.00);

  // 5. Verificar saldo após jogo
  if (results.game.success) {
    logSection('4️⃣  VERIFICAÇÃO DE SALDO APÓS JOGO');
    results.balanceCheck = await verifyBalanceAfterGame();
  }

  // Resumo Final
  logSection('📊 RESUMO DOS TESTES');
  
  const tests = [
    { name: 'Login', result: results.login },
    { name: 'Perfil/Saldo', result: results.profile },
    { name: 'Criação de PIX', result: results.pix },
    { name: 'Jogo (Chute)', result: results.game },
    { name: 'Verificação de Saldo', result: results.balanceCheck }
  ];

  const passedTests = tests.filter(t => t.result && t.result.success).length;
  const totalTests = tests.filter(t => t.result !== null).length;

  console.log('\n');
  tests.forEach(test => {
    if (test.result) {
      if (test.result.success) {
        logSuccess(`${test.name}: PASSOU`);
      } else {
        logError(`${test.name}: FALHOU`);
        if (test.result.error) {
          logInfo(`  Erro: ${test.result.error}`);
        }
      }
    } else {
      logWarning(`${test.name}: NÃO EXECUTADO`);
    }
  });

  console.log('\n' + '='.repeat(70));
  log(`\nTotal de testes: ${totalTests}`, 'blue');
  log(`✅ Passou: ${passedTests}`, 'green');
  log(`❌ Falhou: ${totalTests - passedTests}`, totalTests - passedTests > 0 ? 'red' : 'green');

  // Conclusão
  console.log('\n' + '='.repeat(70));
  
  if (passedTests === totalTests && totalTests >= 3) {
    log('\n🎉 TODOS OS TESTES PRINCIPAIS PASSARAM!', 'green');
    log('✅ Sistema está funcionando corretamente!', 'green');
  } else if (results.login.success && results.game.success) {
    log('\n⚠️  ALGUNS TESTES FALHARAM', 'yellow');
    log('✅ Mas funcionalidades críticas (Login e Jogo) estão funcionando!', 'green');
  } else {
    log('\n❌ PROBLEMAS DETECTADOS', 'red');
    log('⚠️  Verifique os logs acima para mais detalhes', 'yellow');
  }

  // Salvar resultados
  const fs = require('fs');
  const path = require('path');
  const logDir = path.join(__dirname, '../../logs/v19/VERIFICACAO_SUPREMA');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, '26_testes_funcionalidades_principais.json');
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    base_url: BASE_URL,
    results: results,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      critical_tests_passed: results.login.success && results.game.success
    }
  }, null, 2));
  
  log(`\n📝 Resultados salvos em: ${logFile}`, 'blue');
  console.log('\n');
}

main().catch(error => {
  logError(`\n❌ Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});

