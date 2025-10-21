// 🧪 SISTEMA DE TESTES AUTOMATIZADOS - GOL DE OURO
// Data: 16 de Outubro de 2025
// Objetivo: Testes automatizados completos do sistema

const https = require('https');

class SistemaTestes {
  constructor() {
    this.config = {
      backend: 'https://goldeouro-backend.fly.dev',
      frontend: 'https://goldeouro.lol',
      admin: 'https://admin.goldeouro.lol',
      timeout: 10000
    };
    
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: this.config.timeout
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: jsonData,
              headers: res.headers
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async testBackendHealth() {
    this.log('🔍 [TEST] Testando health check do backend...');
    
    try {
      const response = await this.makeRequest(`${this.config.backend}/health`);
      
      const passed = response.status === 200 && response.data.ok === true;
      
      this.addTestResult('Backend Health Check', passed, {
        status: response.status,
        data: response.data,
        expected: { status: 200, ok: true }
      });

      return passed;
    } catch (error) {
      this.addTestResult('Backend Health Check', false, {
        error: error.message,
        expected: { status: 200, ok: true }
      });
      return false;
    }
  }

  async testAuthentication() {
    this.log('🔍 [TEST] Testando sistema de autenticação...');
    
    try {
      // Primeiro, criar um usuário de teste
      const registerResponse = await this.makeRequest(`${this.config.backend}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          username: 'teste_automatizado',
          email: 'teste.automatizado@example.com',
          password: 'test123'
        }
      });

      const registerPassed = registerResponse.status === 201 && registerResponse.data.success === true;
      
      this.addTestResult('Authentication Register', registerPassed, {
        status: registerResponse.status,
        data: registerResponse.data,
        expected: { status: 201, success: true }
      });

      // Agora testar login com o usuário criado
      const loginResponse = await this.makeRequest(`${this.config.backend}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          email: 'teste.automatizado@example.com',
          password: 'test123'
        }
      });

      const loginPassed = loginResponse.status === 200 && loginResponse.data.success === true;
      
      this.addTestResult('Authentication Login', loginPassed, {
        status: loginResponse.status,
        data: loginResponse.data,
        expected: { status: 200, success: true }
      });

      return loginPassed && registerPassed;
    } catch (error) {
      this.addTestResult('Authentication', false, {
        error: error.message,
        expected: 'Login e registro funcionando'
      });
      return false;
    }
  }

  async testPixSystem() {
    this.log('🔍 [TEST] Testando sistema PIX...');
    
    try {
      // Primeiro fazer login para obter token
      const loginResponse = await this.makeRequest(`${this.config.backend}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          email: 'teste.automatizado@example.com',
          password: 'test123'
        }
      });

      if (!loginResponse.data.success) {
        throw new Error('Falha no login para teste PIX');
      }

      const token = loginResponse.data.token;

      // Teste de criação de PIX
      const pixResponse = await this.makeRequest(`${this.config.backend}/api/payments/pix/criar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: {
          amount: 10.00,
          description: 'Teste automatizado'
        }
      });

      const pixPassed = pixResponse.status === 200 && pixResponse.data.success === true;
      
      this.addTestResult('PIX Creation', pixPassed, {
        status: pixResponse.status,
        data: pixResponse.data,
        expected: { status: 200, success: true }
      });

      // Teste de webhook PIX
      const webhookResponse = await this.makeRequest(`${this.config.backend}/api/payments/pix/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          type: 'payment',
          data: { id: 'test_payment_123' }
        }
      });

      const webhookPassed = webhookResponse.status === 200;
      
      this.addTestResult('PIX Webhook', webhookPassed, {
        status: webhookResponse.status,
        data: webhookResponse.data,
        expected: { status: 200 }
      });

      return pixPassed && webhookPassed;
    } catch (error) {
      this.addTestResult('PIX System', false, {
        error: error.message,
        expected: 'Sistema PIX funcionando'
      });
      return false;
    }
  }

  async testGameSystem() {
    this.log('🔍 [TEST] Testando sistema de jogo...');
    
    try {
      // Primeiro fazer login para obter token
      const loginResponse = await this.makeRequest(`${this.config.backend}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          email: 'teste.automatizado@example.com',
          password: 'test123'
        }
      });

      if (!loginResponse.data.success) {
        throw new Error('Falha no login para teste de jogo');
      }

      const token = loginResponse.data.token;

      // Teste de criação de lote
      const loteResponse = await this.makeRequest(`${this.config.backend}/api/games/create-lote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: {
          maxPlayers: 10,
          entryFee: 5.00
        }
      });

      const lotePassed = loteResponse.status === 200 && loteResponse.data.success === true;
      
      this.addTestResult('Game Lote Creation', lotePassed, {
        status: loteResponse.status,
        data: loteResponse.data,
        expected: { status: 200, success: true }
      });

      // Teste de chute
      const shootResponse = await this.makeRequest(`${this.config.backend}/api/games/shoot`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: {
          loteId: 'test_lote_123',
          direction: 1,
          amount: 5.00
        }
      });

      const shootPassed = shootResponse.status === 200 && shootResponse.data.success === true;
      
      this.addTestResult('Game Shoot', shootPassed, {
        status: shootResponse.status,
        data: shootResponse.data,
        expected: { status: 200, success: true }
      });

      return lotePassed && shootPassed;
    } catch (error) {
      this.addTestResult('Game System', false, {
        error: error.message,
        expected: 'Sistema de jogo funcionando'
      });
      return false;
    }
  }

  async testFrontendAccess() {
    this.log('🔍 [TEST] Testando acesso aos frontends...');
    
    try {
      // Teste do frontend player
      const playerResponse = await this.makeRequest(this.config.frontend);
      const playerPassed = playerResponse.status === 200;
      
      this.addTestResult('Frontend Player Access', playerPassed, {
        status: playerResponse.status,
        expected: { status: 200 }
      });

      // Teste do frontend admin
      const adminResponse = await this.makeRequest(this.config.admin);
      const adminPassed = adminResponse.status === 200;
      
      this.addTestResult('Frontend Admin Access', adminPassed, {
        status: adminResponse.status,
        expected: { status: 200 }
      });

      return playerPassed && adminPassed;
    } catch (error) {
      this.addTestResult('Frontend Access', false, {
        error: error.message,
        expected: 'Frontends acessíveis'
      });
      return false;
    }
  }

  addTestResult(testName, passed, details) {
    this.results.total++;
    if (passed) {
      this.results.passed++;
      this.log(`✅ [TEST] ${testName} - PASSOU`);
    } else {
      this.results.failed++;
      this.log(`❌ [TEST] ${testName} - FALHOU`);
    }

    this.results.tests.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    const successRate = this.results.total > 0 ? 
      ((this.results.passed / this.results.total) * 100).toFixed(2) : 0;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: `${successRate}%`
      },
      tests: this.results.tests
    };

    this.log(`📊 [REPORT] Relatório de testes gerado:`);
    this.log(`   Total: ${this.results.total}`);
    this.log(`   Passou: ${this.results.passed}`);
    this.log(`   Falhou: ${this.results.failed}`);
    this.log(`   Taxa de sucesso: ${successRate}%`);

    return report;
  }

  async runAllTests() {
    this.log('🚀 [TEST] Iniciando bateria completa de testes...');
    
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };

    // Executar todos os testes
    await this.testBackendHealth();
    await this.testAuthentication();
    await this.testPixSystem();
    await this.testGameSystem();
    await this.testFrontendAccess();

    // Gerar relatório
    const report = this.generateReport();
    
    if (this.results.failed === 0) {
      this.log('🎉 [TEST] Todos os testes passaram!');
    } else {
      this.log(`⚠️ [TEST] ${this.results.failed} teste(s) falharam!`);
    }

    return report;
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const testes = new SistemaTestes();
  testes.runAllTests().catch(console.error);
}

module.exports = SistemaTestes;
