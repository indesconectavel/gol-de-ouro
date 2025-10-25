// Testes de Performance - Gol de Ouro v1.2.0
// ==========================================
const request = require('supertest');
const app = require('../server-fly');

class PerformanceTests {
  constructor() {
    this.results = [];
    this.baseUrl = 'https://goldeouro-backend.fly.dev';
  }

  // Executar todos os testes de performance
  async runPerformanceTests() {
    console.log('🚀 INICIANDO TESTES DE PERFORMANCE');
    console.log('==================================');

    try {
      // Testes de carga
      await this.testLoadCapacity();
      
      // Testes de stress
      await this.testStressCapacity();
      
      // Testes de volume
      await this.testVolumeCapacity();
      
      // Testes de spike
      await this.testSpikeCapacity();
      
      // Testes de endurance
      await this.testEnduranceCapacity();

      // Gerar relatório
      this.generatePerformanceReport();

    } catch (error) {
      console.error('❌ Erro crítico nos testes de performance:', error);
    }
  }

  // Teste de capacidade de carga
  async testLoadCapacity() {
    console.log('\n📊 TESTE DE CAPACIDADE DE CARGA...');
    
    const concurrentUsers = 50;
    const duration = 30000; // 30 segundos
    const requestsPerSecond = 10;

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.simulateUserLoad(requestsPerSecond, duration));
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
    const successfulRequests = results.reduce((sum, r) => sum + r.successful, 0);
    const averageResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length;

    this.results.push({
      test: 'Load Capacity',
      concurrentUsers,
      duration: endTime - startTime,
      totalRequests,
      successfulRequests,
      successRate: (successfulRequests / totalRequests) * 100,
      averageResponseTime,
      requestsPerSecond: totalRequests / ((endTime - startTime) / 1000)
    });

    console.log(`✅ Teste de carga concluído: ${successfulRequests}/${totalRequests} requisições bem-sucedidas`);
  }

  // Teste de capacidade de stress
  async testStressCapacity() {
    console.log('\n⚡ TESTE DE CAPACIDADE DE STRESS...');
    
    const concurrentUsers = 100;
    const duration = 60000; // 1 minuto
    const requestsPerSecond = 20;

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.simulateUserLoad(requestsPerSecond, duration));
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
    const successfulRequests = results.reduce((sum, r) => sum + r.successful, 0);
    const averageResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length;

    this.results.push({
      test: 'Stress Capacity',
      concurrentUsers,
      duration: endTime - startTime,
      totalRequests,
      successfulRequests,
      successRate: (successfulRequests / totalRequests) * 100,
      averageResponseTime,
      requestsPerSecond: totalRequests / ((endTime - startTime) / 1000)
    });

    console.log(`✅ Teste de stress concluído: ${successfulRequests}/${totalRequests} requisições bem-sucedidas`);
  }

  // Teste de capacidade de volume
  async testVolumeCapacity() {
    console.log('\n📈 TESTE DE CAPACIDADE DE VOLUME...');
    
    const totalRequests = 1000;
    const batchSize = 50;
    const delayBetweenBatches = 1000; // 1 segundo

    const startTime = Date.now();
    let successfulRequests = 0;
    let totalResponseTime = 0;

    for (let batch = 0; batch < totalRequests / batchSize; batch++) {
      const batchPromises = [];
      
      for (let i = 0; i < batchSize; i++) {
        batchPromises.push(this.makeRequest());
      }

      const batchResults = await Promise.all(batchPromises);
      
      successfulRequests += batchResults.filter(r => r.success).length;
      totalResponseTime += batchResults.reduce((sum, r) => sum + r.responseTime, 0);

      if (batch < (totalRequests / batchSize) - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const endTime = Date.now();
    const averageResponseTime = totalResponseTime / totalRequests;

    this.results.push({
      test: 'Volume Capacity',
      totalRequests,
      successfulRequests,
      successRate: (successfulRequests / totalRequests) * 100,
      averageResponseTime,
      duration: endTime - startTime,
      requestsPerSecond: totalRequests / ((endTime - startTime) / 1000)
    });

    console.log(`✅ Teste de volume concluído: ${successfulRequests}/${totalRequests} requisições bem-sucedidas`);
  }

  // Teste de capacidade de spike
  async testSpikeCapacity() {
    console.log('\n📊 TESTE DE CAPACIDADE DE SPIKE...');
    
    const normalLoad = 20; // usuários normais
    const spikeLoad = 200; // usuários no spike
    const spikeDuration = 10000; // 10 segundos
    const normalDuration = 20000; // 20 segundos

    // Fase 1: Carga normal
    console.log('  📊 Fase 1: Carga normal...');
    const normalStart = Date.now();
    const normalPromises = [];

    for (let i = 0; i < normalLoad; i++) {
      normalPromises.push(this.simulateUserLoad(5, normalDuration));
    }

    const normalResults = await Promise.all(normalPromises);
    const normalEnd = Date.now();

    // Fase 2: Spike de carga
    console.log('  ⚡ Fase 2: Spike de carga...');
    const spikeStart = Date.now();
    const spikePromises = [];

    for (let i = 0; i < spikeLoad; i++) {
      spikePromises.push(this.simulateUserLoad(10, spikeDuration));
    }

    const spikeResults = await Promise.all(spikePromises);
    const spikeEnd = Date.now();

    // Calcular métricas
    const normalTotalRequests = normalResults.reduce((sum, r) => sum + r.requests, 0);
    const normalSuccessfulRequests = normalResults.reduce((sum, r) => sum + r.successful, 0);
    
    const spikeTotalRequests = spikeResults.reduce((sum, r) => sum + r.requests, 0);
    const spikeSuccessfulRequests = spikeResults.reduce((sum, r) => sum + r.successful, 0);

    this.results.push({
      test: 'Spike Capacity',
      normalLoad: {
        users: normalLoad,
        requests: normalTotalRequests,
        successful: normalSuccessfulRequests,
        successRate: (normalSuccessfulRequests / normalTotalRequests) * 100,
        duration: normalEnd - normalStart
      },
      spikeLoad: {
        users: spikeLoad,
        requests: spikeTotalRequests,
        successful: spikeSuccessfulRequests,
        successRate: (spikeSuccessfulRequests / spikeTotalRequests) * 100,
        duration: spikeEnd - spikeStart
      }
    });

    console.log(`✅ Teste de spike concluído: Normal ${normalSuccessfulRequests}/${normalTotalRequests}, Spike ${spikeSuccessfulRequests}/${spikeTotalRequests}`);
  }

  // Teste de capacidade de endurance
  async testEnduranceCapacity() {
    console.log('\n⏱️ TESTE DE CAPACIDADE DE ENDURANCE...');
    
    const concurrentUsers = 30;
    const duration = 300000; // 5 minutos
    const requestsPerSecond = 5;

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.simulateUserLoad(requestsPerSecond, duration));
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
    const successfulRequests = results.reduce((sum, r) => sum + r.successful, 0);
    const averageResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length;

    this.results.push({
      test: 'Endurance Capacity',
      concurrentUsers,
      duration: endTime - startTime,
      totalRequests,
      successfulRequests,
      successRate: (successfulRequests / totalRequests) * 100,
      averageResponseTime,
      requestsPerSecond: totalRequests / ((endTime - startTime) / 1000)
    });

    console.log(`✅ Teste de endurance concluído: ${successfulRequests}/${totalRequests} requisições bem-sucedidas`);
  }

  // Simular carga de usuário
  async simulateUserLoad(requestsPerSecond, duration) {
    const startTime = Date.now();
    const requests = [];
    let successful = 0;
    let totalResponseTime = 0;

    while (Date.now() - startTime < duration) {
      const requestStart = Date.now();
      
      try {
        const response = await this.makeRequest();
        requests.push(response);
        
        if (response.success) {
          successful++;
        }
        
        totalResponseTime += response.responseTime;
        
      } catch (error) {
        requests.push({ success: false, responseTime: Date.now() - requestStart });
      }

      // Aguardar intervalo entre requisições
      const interval = 1000 / requestsPerSecond;
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return {
      requests: requests.length,
      successful,
      averageResponseTime: totalResponseTime / requests.length
    };
  }

  // Fazer requisição individual
  async makeRequest() {
    const startTime = Date.now();
    
    try {
      const response = await request(app).get('/health');
      const responseTime = Date.now() - startTime;
      
      return {
        success: response.status === 200,
        status: response.status,
        responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error.message,
        responseTime
      };
    }
  }

  // Gerar relatório de performance
  generatePerformanceReport() {
    console.log('\n📊 RELATÓRIO DE PERFORMANCE');
    console.log('===========================');

    this.results.forEach(result => {
      console.log(`\n${result.test}:`);
      console.log(`  Usuários Concorrentes: ${result.concurrentUsers || 'N/A'}`);
      console.log(`  Duração: ${result.duration ? (result.duration / 1000).toFixed(2) + 's' : 'N/A'}`);
      console.log(`  Total de Requisições: ${result.totalRequests || 'N/A'}`);
      console.log(`  Requisições Bem-sucedidas: ${result.successfulRequests || 'N/A'}`);
      console.log(`  Taxa de Sucesso: ${result.successRate ? result.successRate.toFixed(2) + '%' : 'N/A'}`);
      console.log(`  Tempo Médio de Resposta: ${result.averageResponseTime ? result.averageResponseTime.toFixed(2) + 'ms' : 'N/A'}`);
      console.log(`  Requisições por Segundo: ${result.requestsPerSecond ? result.requestsPerSecond.toFixed(2) : 'N/A'}`);
    });

    // Calcular métricas gerais
    const totalRequests = this.results.reduce((sum, r) => sum + (r.totalRequests || 0), 0);
    const totalSuccessful = this.results.reduce((sum, r) => sum + (r.successfulRequests || 0), 0);
    const averageSuccessRate = this.results.reduce((sum, r) => sum + (r.successRate || 0), 0) / this.results.length;
    const averageResponseTime = this.results.reduce((sum, r) => sum + (r.averageResponseTime || 0), 0) / this.results.length;

    console.log('\n📈 MÉTRICAS GERAIS:');
    console.log(`Total de Requisições: ${totalRequests}`);
    console.log(`Total Bem-sucedidas: ${totalSuccessful}`);
    console.log(`Taxa Média de Sucesso: ${averageSuccessRate.toFixed(2)}%`);
    console.log(`Tempo Médio de Resposta: ${averageResponseTime.toFixed(2)}ms`);

    // Avaliar performance
    if (averageSuccessRate >= 95 && averageResponseTime <= 1000) {
      console.log('\n✅ PERFORMANCE EXCELENTE');
    } else if (averageSuccessRate >= 90 && averageResponseTime <= 2000) {
      console.log('\n🟡 PERFORMANCE BOA');
    } else {
      console.log('\n❌ PERFORMANCE NECESSITA MELHORIAS');
    }
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const performanceTests = new PerformanceTests();
  performanceTests.runPerformanceTests().catch(console.error);
}

module.exports = PerformanceTests;
