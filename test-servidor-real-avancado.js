// SCRIPT DE TESTE AVANÇADO - SERVIDOR REAL UNIFICADO
// Data: 16 de Outubro de 2025
// Objetivo: Testar servidor com credenciais reais

require('dotenv').config();
const axios = require('axios');
const { createLogger, format, transports } = require('winston');

// Configuração do logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/test-real.log' })
  ]
});

class RealServerTester {
  constructor() {
    this.baseUrl = 'http://localhost:8080';
    this.testResults = [];
    this.testToken = null;
    this.testUser = null;
  }

  log(message, level = 'info') {
    logger.log(level, message);
  }

  addTestResult(name, passed, details = {}) {
    this.testResults.push({ name, passed, details });
    this.log(`${passed ? '✅' : '❌'} [TEST] ${name} - ${passed ? 'PASSOU' : 'FALHOU'}`);
    if (!passed && Object.keys(details).length > 0) {
      this.log(`   Detalhes: ${JSON.stringify(details)}`);
    }
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await axios({
        method: options.method || 'GET',
        url: url,
        headers: options.headers || {},
        data: options.body,
        timeout: 10000,
        validateStatus: () => true
      });
      return response;
    } catch (error) {
      return {
        status: 500,
        data: { success: false, message: error.message }
      };
    }
  }

  async testServerHealth() {
    this.log('🔍 [TEST] Testando health check do servidor...');
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/health`);
      const passed = response.status === 200 && response.data.ok === true;
      
      this.addTestResult('Server Health Check', passed, {
        status: response.status,
        data: response.data,
        expected: { status: 200, ok: true }
      });
      
      if (passed) {
        this.log(`   Database: ${response.data.database}`);
        this.log(`   PIX: ${response.data.pix}`);
        this.log(`   Authentication: ${response.data.authentication}`);
      }
      
      return passed;
    } catch (error) {
      this.addTestResult('Server Health Check', false, {
        error: error.message,
        expected: 'Servidor online e saudável'
      });
      return false;
    }
  }

  async testUserRegistration() {
    this.log('🔍 [TEST] Testando registro de usuário...');
    
    try {
      const testEmail = `teste.real.${Date.now()}@example.com`;
      const testUsername = `TesteReal${Date.now()}`;
      
      const response = await this.makeRequest(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          email: testEmail,
          password: 'teste123',
          username: testUsername
        }
      });
      
      const passed = response.status === 201 && response.data.success === true;
      
      this.addTestResult('User Registration', passed, {
        status: response.status,
        data: response.data,
        expected: { status: 201, success: true }
      });
      
      if (passed) {
        this.testToken = response.data.token;
        this.testUser = response.data.user;
        this.log(`   Token obtido: ${this.testToken ? 'SIM' : 'NÃO'}`);
        this.log(`   Usuário criado: ${this.testUser?.email}`);
      }
      
      return passed;
    } catch (error) {
      this.addTestResult('User Registration', false, {
        error: error.message,
        expected: 'Registro funcionando'
      });
      return false;
    }
  }

  async testUserLogin() {
    this.log('🔍 [TEST] Testando login de usuário...');
    
    try {
      if (!this.testUser) {
        throw new Error('Usuário de teste não criado');
      }
      
      const response = await this.makeRequest(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          email: this.testUser.email,
          password: 'teste123'
        }
      });
      
      const passed = response.status === 200 && response.data.success === true;
      
      this.addTestResult('User Login', passed, {
        status: response.status,
        data: response.data,
        expected: { status: 200, success: true }
      });
      
      if (passed) {
        this.testToken = response.data.token;
        this.log(`   Login realizado: ${response.data.user.email}`);
        this.log(`   Saldo: R$ ${response.data.user.balance}`);
      }
      
      return passed;
    } catch (error) {
      this.addTestResult('User Login', false, {
        error: error.message,
        expected: 'Login funcionando'
      });
      return false;
    }
  }

  async testPixPayment() {
    this.log('🔍 [TEST] Testando criação de pagamento PIX...');
    
    try {
      if (!this.testToken) {
        throw new Error('Token de autenticação não disponível');
      }
      
      const response = await this.makeRequest(`${this.baseUrl}/api/payments/pix/criar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.testToken}`
        },
        body: {
          amount: 10.00,
          description: 'Teste PIX Real'
        }
      });
      
      const passed = response.status === 200 && response.data.success === true;
      
      this.addTestResult('PIX Payment Creation', passed, {
        status: response.status,
        data: response.data,
        expected: { status: 200, success: true }
      });
      
      if (passed) {
        this.log(`   Payment ID: ${response.data.payment_id}`);
        this.log(`   QR Code: ${response.data.qr_code ? 'GERADO' : 'NÃO GERADO'}`);
        this.log(`   Banco: ${response.data.banco}`);
      }
      
      return passed;
    } catch (error) {
      this.addTestResult('PIX Payment Creation', false, {
        error: error.message,
        expected: 'PIX funcionando'
      });
      return false;
    }
  }

  async testGameLoteCreation() {
    this.log('🔍 [TEST] Testando criação de lote de jogo...');
    
    try {
      if (!this.testToken) {
        throw new Error('Token de autenticação não disponível');
      }
      
      const response = await this.makeRequest(`${this.baseUrl}/api/games/create-lote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.testToken}`
        },
        body: {
          maxPlayers: 10,
          entryFee: 5.00
        }
      });
      
      const passed = response.status === 200 && response.data.success === true;
      
      this.addTestResult('Game Lote Creation', passed, {
        status: response.status,
        data: response.data,
        expected: { status: 200, success: true }
      });
      
      if (passed) {
        this.log(`   Lote ID: ${response.data.lote.id}`);
        this.log(`   Max Players: ${response.data.lote.max_players}`);
        this.log(`   Entry Fee: R$ ${response.data.lote.entry_fee}`);
        this.log(`   Banco: ${response.data.banco}`);
      }
      
      return passed;
    } catch (error) {
      this.addTestResult('Game Lote Creation', false, {
        error: error.message,
        expected: 'Criação de lote funcionando'
      });
      return false;
    }
  }

  async testGameShoot() {
    this.log('🔍 [TEST] Testando sistema de chute...');
    
    try {
      if (!this.testToken) {
        throw new Error('Token de autenticação não disponível');
      }
      
      const response = await this.makeRequest(`${this.baseUrl}/api/games/shoot`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.testToken}`
        },
        body: {
          loteId: 'test_lote_123',
          direction: 1,
          amount: 5.00
        }
      });
      
      const passed = response.status === 200 && response.data.success === true;
      
      this.addTestResult('Game Shoot', passed, {
        status: response.status,
        data: response.data,
        expected: { status: 200, success: true }
      });
      
      if (passed) {
        this.log(`   Resultado: ${response.data.result.result}`);
        this.log(`   Valor da aposta: R$ ${response.data.result.amount}`);
        this.log(`   Valor do prêmio: R$ ${response.data.result.win_amount}`);
        this.log(`   Banco: ${response.data.banco}`);
      }
      
      return passed;
    } catch (error) {
      this.addTestResult('Game Shoot', false, {
        error: error.message,
        expected: 'Sistema de chute funcionando'
      });
      return false;
    }
  }

  async testUserStats() {
    this.log('🔍 [TEST] Testando estatísticas do usuário...');
    
    try {
      if (!this.testToken) {
        throw new Error('Token de autenticação não disponível');
      }
      
      const response = await this.makeRequest(`${this.baseUrl}/api/stats/user`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${this.testToken}`
        }
      });
      
      const passed = response.status === 200 && response.data.success === true;
      
      this.addTestResult('User Statistics', passed, {
        status: response.status,
        data: response.data,
        expected: { status: 200, success: true }
      });
      
      if (passed) {
        this.log(`   Estatísticas obtidas: ${Object.keys(response.data.stats).length} campos`);
        this.log(`   Banco: ${response.data.banco}`);
      }
      
      return passed;
    } catch (error) {
      this.addTestResult('User Statistics', false, {
        error: error.message,
        expected: 'Estatísticas funcionando'
      });
      return false;
    }
  }

  async testSystemStats() {
    this.log('🔍 [TEST] Testando estatísticas do sistema...');
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/api/stats/system`, {
        method: 'GET'
      });
      
      const passed = response.status === 200 && response.data.success === true;
      
      this.addTestResult('System Statistics', passed, {
        status: response.status,
        data: response.data,
        expected: { status: 200, success: true }
      });
      
      if (passed) {
        this.log(`   Estatísticas do sistema obtidas: ${Object.keys(response.data.stats).length} campos`);
        this.log(`   Banco: ${response.data.banco}`);
      }
      
      return passed;
    } catch (error) {
      this.addTestResult('System Statistics', false, {
        error: error.message,
        expected: 'Estatísticas do sistema funcionando'
      });
      return false;
    }
  }

  async runAllTests() {
    this.log('🧪 INICIANDO TESTES DO SERVIDOR REAL UNIFICADO');
    this.log('=' * 60);
    
    const results = {
      health: false,
      registration: false,
      login: false,
      pix: false,
      game: false,
      shoot: false,
      userStats: false,
      systemStats: false
    };
    
    // Teste 1: Health Check
    results.health = await this.testServerHealth();
    
    // Teste 2: Registro
    results.registration = await this.testUserRegistration();
    
    // Teste 3: Login
    results.login = await this.testUserLogin();
    
    // Teste 4: PIX
    results.pix = await this.testPixPayment();
    
    // Teste 5: Criação de Lote
    results.game = await this.testGameLoteCreation();
    
    // Teste 6: Chute
    results.shoot = await this.testGameShoot();
    
    // Teste 7: Estatísticas do Usuário
    results.userStats = await this.testUserStats();
    
    // Teste 8: Estatísticas do Sistema
    results.systemStats = await this.testSystemStats();
    
    // Resultado final
    this.log('\n📊 RESULTADO DOS TESTES:');
    this.log('=' * 30);
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSOU' : '❌ FALHOU';
      const color = passed ? 'info' : 'error';
      this.log(`${test.toUpperCase()}: ${status}`, color);
    });
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
      this.log('\n🎉 TODOS OS TESTES PASSARAM!', 'info');
      this.log('✅ Servidor REAL funcionando perfeitamente!', 'info');
    } else {
      this.log('\n⚠️ ALGUNS TESTES FALHARAM!', 'error');
      this.log('❌ Verifique as configurações e credenciais', 'error');
    }
    
    return allPassed;
  }

  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    this.log('\n📊 RELATÓRIO FINAL:');
    this.log(`   Total de testes: ${totalTests}`);
    this.log(`   Testes passaram: ${passedTests}`);
    this.log(`   Testes falharam: ${failedTests}`);
    this.log(`   Taxa de sucesso: ${successRate.toFixed(2)}%`);

    if (failedTests > 0) {
      this.log('\n❌ TESTES QUE FALHARAM:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          this.log(`   - ${r.name}: ${JSON.stringify(r.details)}`);
        });
    }
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new RealServerTester();
  tester.runAllTests()
    .then(success => {
      tester.generateReport();
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error('❌ [FATAL] Erro nos testes:', error);
      process.exit(1);
    });
}

module.exports = RealServerTester;
