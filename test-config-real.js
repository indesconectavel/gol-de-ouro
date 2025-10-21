// SCRIPT DE TESTE DE CONFIGURAÇÃO REAL - GOL DE OURO v2.0
require('dotenv').config();
const axios = require('axios');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSupabase() {
  log('\n🗄️ Testando Supabase...', 'blue');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      log('❌ Credenciais Supabase não configuradas', 'red');
      return false;
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Teste de conexão
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      log(`❌ Erro Supabase: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ Supabase: Conectado com sucesso', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Erro Supabase: ${error.message}`, 'red');
    return false;
  }
}

async function testMercadoPago() {
  log('\n💳 Testando Mercado Pago...', 'blue');
  
  try {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      log('❌ Token Mercado Pago não configurado', 'red');
      return false;
    }
    
    const response = await axios.get(
      'https://api.mercadopago.com/v1/payment_methods',
      {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.status === 200) {
      log('✅ Mercado Pago: Conectado com sucesso', 'green');
      return true;
    } else {
      log(`❌ Mercado Pago: Status ${response.status}`, 'red');
      return false;
    }
    
  } catch (error) {
    if (error.response?.status === 401) {
      log('❌ Mercado Pago: Token inválido', 'red');
    } else {
      log(`❌ Mercado Pago: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testServerEndpoints() {
  log('\n🚀 Testando endpoints do servidor...', 'blue');
  
  try {
    const baseUrl = 'http://localhost:8080';
    
    // Teste Health Check
    const healthResponse = await axios.get(`${baseUrl}/health`);
    if (healthResponse.status === 200) {
      log('✅ Health Check: OK', 'green');
      log(`   Database: ${healthResponse.data.database}`, 'yellow');
      log(`   PIX: ${healthResponse.data.pix}`, 'yellow');
    } else {
      log('❌ Health Check: Falhou', 'red');
      return false;
    }
    
    // Teste Registro
    const registerData = {
      email: `teste.${Date.now()}@example.com`,
      password: 'teste123',
      username: 'TesteUsuario'
    };
    
    const registerResponse = await axios.post(`${baseUrl}/api/auth/register`, registerData);
    if (registerResponse.status === 201) {
      log('✅ Registro: OK', 'green');
      
      // Teste Login
      const loginData = {
        email: registerData.email,
        password: registerData.password
      };
      
      const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, loginData);
      if (loginResponse.status === 200) {
        log('✅ Login: OK', 'green');
        
        const token = loginResponse.data.token;
        
        // Teste PIX
        const pixData = {
          amount: 10.00,
          description: 'Teste PIX'
        };
        
        const pixResponse = await axios.post(
          `${baseUrl}/api/payments/pix/criar`,
          pixData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (pixResponse.status === 200) {
          log('✅ PIX: OK', 'green');
        } else {
          log('❌ PIX: Falhou', 'red');
        }
        
        // Teste Jogo
        const gameData = {
          maxPlayers: 10,
          entryFee: 5.00
        };
        
        const gameResponse = await axios.post(
          `${baseUrl}/api/games/create-lote`,
          gameData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (gameResponse.status === 200) {
          log('✅ Jogo: OK', 'green');
        } else {
          log('❌ Jogo: Falhou', 'red');
        }
        
      } else {
        log('❌ Login: Falhou', 'red');
      }
    } else {
      log('❌ Registro: Falhou', 'red');
    }
    
    return true;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('❌ Servidor não está rodando. Execute: node server-final-unified.js', 'red');
    } else {
      log(`❌ Erro nos testes: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testEnvironmentVariables() {
  log('\n🔧 Verificando variáveis de ambiente...', 'blue');
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MERCADO_PAGO_ACCESS_TOKEN',
    'JWT_SECRET'
  ];
  
  const optionalVars = [
    'MERCADO_PAGO_PUBLIC_KEY',
    'MERCADO_PAGO_WEBHOOK_SECRET',
    'BCRYPT_ROUNDS',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS'
  ];
  
  let allRequired = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: Configurado`, 'green');
    } else {
      log(`❌ ${varName}: Não configurado`, 'red');
      allRequired = false;
    }
  });
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: Configurado`, 'green');
    } else {
      log(`⚠️ ${varName}: Não configurado (opcional)`, 'yellow');
    }
  });
  
  return allRequired;
}

async function runAllTests() {
  log('🧪 INICIANDO TESTES DE CONFIGURAÇÃO REAL', 'blue');
  log('=' * 50, 'blue');
  
  const results = {
    environment: false,
    supabase: false,
    mercadoPago: false,
    server: false
  };
  
  // Teste 1: Variáveis de ambiente
  results.environment = await testEnvironmentVariables();
  
  // Teste 2: Supabase
  results.supabase = await testSupabase();
  
  // Teste 3: Mercado Pago
  results.mercadoPago = await testMercadoPago();
  
  // Teste 4: Servidor
  results.server = await testServerEndpoints();
  
  // Resultado final
  log('\n📊 RESULTADO DOS TESTES:', 'blue');
  log('=' * 30, 'blue');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU';
    const color = passed ? 'green' : 'red';
    log(`${test.toUpperCase()}: ${status}`, color);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    log('\n🎉 TODOS OS TESTES PASSARAM!', 'green');
    log('✅ Sistema pronto para produção real!', 'green');
  } else {
    log('\n⚠️ ALGUNS TESTES FALHARAM!', 'red');
    log('❌ Configure as credenciais antes de prosseguir', 'red');
  }
  
  return allPassed;
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSupabase,
  testMercadoPago,
  testServerEndpoints,
  testEnvironmentVariables,
  runAllTests
};
