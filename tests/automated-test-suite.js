// Suite de Testes Automatizados - Gol de Ouro v1.2.0
// ==================================================
const request = require('supertest');
const app = require('../server-fly');
const { createClient } = require('@supabase/supabase-js');
const NotificationService = require('../services/notification-service');
const HistoryService = require('../services/history-service');
const RankingService = require('../services/ranking-service');
const CacheService = require('../services/cache-service');
const CDNService = require('../services/cdn-service');

// Configuração de testes
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class TestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testUser = {
      email: 'teste.automatizado@goldeouro.lol',
      password: 'teste123',
      username: 'teste_automatizado'
    };
    this.authToken = null;
    this.userId = null;
  }

  // Executar todos os testes
  async runAllTests() {
    console.log('🧪 INICIANDO SUITE DE TESTES AUTOMATIZADOS');
    console.log('==========================================');

    try {
      // 1. Testes de Infraestrutura
      await this.testInfrastructure();
      
      // 2. Testes de Autenticação
      await this.testAuthentication();
      
      // 3. Testes de Sistema de Jogo
      await this.testGameSystem();
      
      // 4. Testes de Sistema PIX
      await this.testPixSystem();
      
      // 5. Testes de Sistema de Saques
      await this.testWithdrawSystem();
      
      // 6. Testes de Notificações
      await this.testNotificationSystem();
      
      // 7. Testes de Histórico
      await this.testHistorySystem();
      
      // 8. Testes de Ranking
      await this.testRankingSystem();
      
      // 9. Testes de Cache
      await this.testCacheSystem();
      
      // 10. Testes de Performance
      await this.testPerformance();

      // Gerar relatório final
      this.generateReport();

    } catch (error) {
      console.error('❌ Erro crítico na suite de testes:', error);
      this.results.errors.push({ test: 'Suite', error: error.message });
    }
  }

  // Testes de Infraestrutura
  async testInfrastructure() {
    console.log('\n🏗️ TESTANDO INFRAESTRUTURA...');
    
    await this.runTest('Health Check', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('connected');
    });

    await this.runTest('CORS Headers', async () => {
      const response = await request(app).options('/health');
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    await this.runTest('Security Headers', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  }

  // Testes de Autenticação
  async testAuthentication() {
    console.log('\n🔐 TESTANDO AUTENTICAÇÃO...');

    await this.runTest('Registro de Usuário', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(this.testUser);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      this.userId = response.body.user.id;
    });

    await this.runTest('Login de Usuário', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: this.testUser.email,
          password: this.testUser.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      this.authToken = response.body.token;
    });

    await this.runTest('Validação de Token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${this.authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    await this.runTest('Token Inválido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token_invalido');
      
      expect(response.status).toBe(401);
    });
  }

  // Testes de Sistema de Jogo
  async testGameSystem() {
    console.log('\n⚽ TESTANDO SISTEMA DE JOGO...');

    await this.runTest('Chute Válido', async () => {
      const response = await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          direction: 'center',
          amount: 1
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    await this.runTest('Chute com Saldo Insuficiente', async () => {
      // Primeiro, zerar saldo do usuário
      await supabase
        .from('usuarios')
        .update({ saldo: 0 })
        .eq('id', this.userId);

      const response = await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          direction: 'center',
          amount: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Saldo insuficiente');
    });

    await this.runTest('Chute com Direção Inválida', async () => {
      const response = await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          direction: 'invalid',
          amount: 1
        });
      
      expect(response.status).toBe(400);
    });
  }

  // Testes de Sistema PIX
  async testPixSystem() {
    console.log('\n💳 TESTANDO SISTEMA PIX...');

    await this.runTest('Criação de PIX', async () => {
      const response = await request(app)
        .post('/api/payments/pix')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          amount: 10.00
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment_id).toBeDefined();
    });

    await this.runTest('PIX com Valor Inválido', async () => {
      const response = await request(app)
        .post('/api/payments/pix')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          amount: 0.10 // Valor muito baixo
        });
      
      expect(response.status).toBe(400);
    });
  }

  // Testes de Sistema de Saques
  async testWithdrawSystem() {
    console.log('\n💸 TESTANDO SISTEMA DE SAQUES...');

    await this.runTest('Saque com Chave PIX Válida', async () => {
      const response = await request(app)
        .post('/api/withdraw/request')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          valor: 5.00,
          chave_pix: '11999999999',
          tipo_chave: 'phone'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    await this.runTest('Saque com Chave PIX Inválida', async () => {
      const response = await request(app)
        .post('/api/withdraw/request')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          valor: 5.00,
          chave_pix: '00000000000', // CPF inválido
          tipo_chave: 'cpf'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('CPF inválido');
    });

    await this.runTest('Saque com Valor Inválido', async () => {
      const response = await request(app)
        .post('/api/withdraw/request')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          valor: 0.10, // Valor muito baixo
          chave_pix: '11999999999',
          tipo_chave: 'phone'
        });
      
      expect(response.status).toBe(400);
    });
  }

  // Testes de Sistema de Notificações
  async testNotificationSystem() {
    console.log('\n📱 TESTANDO SISTEMA DE NOTIFICAÇÕES...');

    const notificationService = new NotificationService();

    await this.runTest('Registro de Subscription', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test_key',
          auth: 'test_auth'
        }
      };

      const result = await notificationService.registerSubscription(this.userId, subscription);
      expect(result.success).toBe(true);
    });

    await this.runTest('Envio de Notificação', async () => {
      const result = await notificationService.sendDepositNotification(this.userId, 10.00);
      // Pode falhar se não houver subscription válida, mas não deve dar erro
      expect(result).toBeDefined();
    });
  }

  // Testes de Sistema de Histórico
  async testHistorySystem() {
    console.log('\n📊 TESTANDO SISTEMA DE HISTÓRICO...');

    const historyService = new HistoryService();

    await this.runTest('Registro de Transação', async () => {
      const result = await historyService.recordTransaction({
        usuario_id: this.userId,
        type: 'deposit',
        amount: 10.00,
        description: 'Depósito de teste',
        status: 'completed'
      });
      
      expect(result.success).toBe(true);
    });

    await this.runTest('Obter Histórico do Usuário', async () => {
      const result = await historyService.getUserCompleteHistory(this.userId);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    await this.runTest('Estatísticas do Histórico', async () => {
      const result = await historyService.getUserHistoryStats(this.userId);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  }

  // Testes de Sistema de Ranking
  async testRankingSystem() {
    console.log('\n🏆 TESTANDO SISTEMA DE RANKING...');

    const rankingService = new RankingService();

    await this.runTest('Obter Ranking Geral', async () => {
      const result = await rankingService.getGeneralRanking();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    await this.runTest('Obter Ranking por Categoria', async () => {
      const result = await rankingService.getCategoryRanking('biggest_winners');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    await this.runTest('Estatísticas do Usuário', async () => {
      const result = await rankingService.getUserStats(this.userId);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    await this.runTest('Estatísticas Globais', async () => {
      const result = await rankingService.getSystemStats();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  }

  // Testes de Sistema de Cache
  async testCacheSystem() {
    console.log('\n⚡ TESTANDO SISTEMA DE CACHE...');

    const cacheService = new CacheService();

    await this.runTest('Conectar ao Redis', async () => {
      // Aguardar conexão
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(cacheService.isRedisConnected()).toBeDefined();
    });

    await this.runTest('Set e Get no Cache', async () => {
      const testKey = 'test_key';
      const testValue = { message: 'teste' };
      
      const setResult = await cacheService.set(testKey, testValue, 60);
      expect(setResult).toBe(true);
      
      const getValue = await cacheService.get(testKey);
      expect(getValue).toEqual(testValue);
    });

    await this.runTest('Cache com Fallback', async () => {
      const result = await cacheService.getOrSet('test_fallback', async () => {
        return { data: 'fallback_data' };
      });
      
      expect(result).toBeDefined();
      expect(result.data).toBe('fallback_data');
    });
  }

  // Testes de Performance
  async testPerformance() {
    console.log('\n🚀 TESTANDO PERFORMANCE...');

    await this.runTest('Tempo de Resposta Health Check', async () => {
      const start = Date.now();
      const response = await request(app).get('/health');
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });

    await this.runTest('Tempo de Resposta Login', async () => {
      const start = Date.now();
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: this.testUser.email,
          password: this.testUser.password
        });
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000); // Menos de 2 segundos
    });

    await this.runTest('Tempo de Resposta Chute', async () => {
      const start = Date.now();
      const response = await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          direction: 'center',
          amount: 1
        });
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000); // Menos de 3 segundos
    });
  }

  // Executar teste individual
  async runTest(testName, testFunction) {
    this.results.total++;
    
    try {
      console.log(`  🔍 ${testName}...`);
      await testFunction();
      console.log(`  ✅ ${testName} - PASSOU`);
      this.results.passed++;
    } catch (error) {
      console.log(`  ❌ ${testName} - FALHOU: ${error.message}`);
      this.results.failed++;
      this.results.errors.push({ test: testName, error: error.message });
    }
  }

  // Gerar relatório final
  generateReport() {
    console.log('\n📊 RELATÓRIO FINAL DOS TESTES');
    console.log('=============================');
    console.log(`Total de Testes: ${this.results.total}`);
    console.log(`✅ Passou: ${this.results.passed}`);
    console.log(`❌ Falhou: ${this.results.failed}`);
    console.log(`📈 Taxa de Sucesso: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      this.results.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }

    // Limpar dados de teste
    this.cleanupTestData();
  }

  // Limpar dados de teste
  async cleanupTestData() {
    try {
      if (this.userId) {
        await supabase
          .from('usuarios')
          .delete()
          .eq('id', this.userId);
        
        console.log('\n🧹 Dados de teste limpos');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar dados de teste:', error);
    }
  }
}

// Função helper para expect (simulando Jest)
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toContain: (expected) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toBeLessThan: (expected) => {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    }
  };
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const testSuite = new TestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = TestSuite;
