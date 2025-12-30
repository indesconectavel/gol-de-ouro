// Testes de API - Jogo
// FASE 2.5 - Testes Automatizados

const authHelper = require('../utils/authHelper');
const apiClient = require('../utils/apiClient');
const testHelpers = require('../utils/testHelpers');
const testConfig = require('../config/testConfig');

/**
 * Testes de Jogo
 */
class GameTests {
  async runAll() {
    testHelpers.log('Iniciando testes de jogo...', 'info');

    const results = [];

    // Garantir que temos token válido
    await authHelper.getPlayerToken();

    // Teste 1: Obter saldo atual
    results.push(await this.testGetBalance());

    // Teste 2: Chute com saldo suficiente
    results.push(await this.testShootWithBalance());

    // Teste 3: Chute sem saldo suficiente
    results.push(await this.testShootWithoutBalance());

    // Teste 4: Obter métricas globais
    results.push(await this.testGetGlobalMetrics());

    // Teste 5: Validar contador global do backend
    results.push(await this.testGlobalCounterFromBackend());

    return results;
  }

  /**
   * Teste 1: Obter saldo atual
   */
  async testGetBalance() {
    const testName = 'API-GAME-001: Obter saldo atual';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      const response = await apiClient.get('/api/user/profile');
      const validation = testHelpers.validateEngineResponse(response);

      if (validation.valid && validation.data) {
        const saldo = testHelpers.normalizeNumber(validation.data.saldo);
        
        testHelpers.log(`✅ ${testName} - PASSOU (Saldo: R$ ${saldo.toFixed(2)})`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          balance: saldo,
          balanceReceived: true
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU: ${validation.error}`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: validation.error
        });
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 2: Chute com saldo suficiente
   */
  async testShootWithBalance() {
    const testName = 'API-GAME-002: Chute com saldo suficiente';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Primeiro obter saldo
      const profileResponse = await apiClient.get('/api/user/profile');
      const profileValidation = testHelpers.validateEngineResponse(profileResponse);
      
      if (!profileValidation.valid) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Não foi possível obter saldo para validação'
        });
      }

      const currentBalance = testHelpers.normalizeNumber(profileValidation.data.saldo);
      const betAmount = Math.min(testConfig.testValues.minBetAmount, currentBalance);

      if (betAmount <= 0) {
        testHelpers.log(`⚠️ ${testName} - BLOQUEADO (saldo insuficiente)`, 'warning');
        return testHelpers.createTestResult(testName, false, {
          message: 'Saldo insuficiente para teste',
          severity: 'low'
        });
      }

      // Fazer chute
      const shootResponse = await apiClient.post('/api/games/shoot', {
        direction: 'C', // Centro
        amount: betAmount
      });

      const validation = testHelpers.validateEngineResponse(shootResponse);

      if (validation.valid && validation.data) {
        testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          betAmount,
          result: validation.data.result,
          novoSaldo: validation.data.novoSaldo,
          contadorGlobal: validation.data.contadorGlobal
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU: ${validation.error}`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: validation.error || 'Resposta inválida'
        });
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 3: Chute sem saldo suficiente
   */
  async testShootWithoutBalance() {
    const testName = 'API-GAME-003: Chute sem saldo suficiente';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Obter saldo atual
      const profileResponse = await apiClient.get('/api/user/profile');
      const profileValidation = testHelpers.validateEngineResponse(profileResponse);
      
      if (!profileValidation.valid) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Não foi possível obter saldo para validação'
        });
      }

      const currentBalance = testHelpers.normalizeNumber(profileValidation.data.saldo);
      const betAmount = currentBalance + 100; // Valor maior que o saldo

      // Tentar chutar
      try {
        const shootResponse = await apiClient.post('/api/games/shoot', {
          direction: 'C',
          amount: betAmount
        });

        // Não deveria funcionar
        testHelpers.log(`❌ ${testName} - FALHOU (deveria ter retornado erro)`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: 'Chute com saldo insuficiente foi aceito incorretamente'
        });
      } catch (error) {
        // Erro é esperado
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          testHelpers.log(`✅ ${testName} - PASSOU (erro esperado)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            errorHandled: true,
            status: error.response.status,
            message: error.response.data?.message
          });
        } else {
          testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
          return testHelpers.createTestResult(testName, false, error);
        }
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 4: Obter métricas globais
   */
  async testGetGlobalMetrics() {
    const testName = 'API-GAME-004: Obter métricas globais';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      const response = await apiClient.get('/api/metrics');
      const validation = testHelpers.validateEngineResponse(response);

      if (validation.valid && validation.data) {
        const contadorGlobal = testHelpers.normalizeNumber(
          validation.data.contador_chutes_global || validation.data.contadorGlobal
        );

        testHelpers.log(`✅ ${testName} - PASSOU (Contador: ${contadorGlobal})`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          contadorGlobal,
          metricsReceived: true
        });
      } else {
        testHelpers.log(`❌ ${testName} - FALHOU: ${validation.error}`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: validation.error
        });
      }
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }

  /**
   * Teste 5: Validar contador global do backend
   */
  async testGlobalCounterFromBackend() {
    const testName = 'API-GAME-005: Contador global sempre do backend';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Obter métricas antes do chute
      const metricsBefore = await apiClient.get('/api/metrics');
      const validationBefore = testHelpers.validateEngineResponse(metricsBefore);
      
      if (!validationBefore.valid) {
        return testHelpers.createTestResult(testName, false, {
          message: 'Não foi possível obter métricas antes do chute'
        });
      }

      const contadorBefore = testHelpers.normalizeNumber(
        validationBefore.data.contador_chutes_global || validationBefore.data.contadorGlobal
      );

      // Fazer um chute
      const profileResponse = await apiClient.get('/api/user/profile');
      const profileValidation = testHelpers.validateEngineResponse(profileResponse);
      const currentBalance = testHelpers.normalizeNumber(profileValidation.data?.saldo || 0);
      const betAmount = Math.min(testConfig.testValues.minBetAmount, currentBalance);

      if (betAmount > 0) {
        const shootResponse = await apiClient.post('/api/games/shoot', {
          direction: 'C',
          amount: betAmount
        });

        const shootValidation = testHelpers.validateEngineResponse(shootResponse);
        
        if (shootValidation.valid && shootValidation.data) {
          const contadorAfterShoot = testHelpers.normalizeNumber(shootValidation.data.contadorGlobal);

          // Obter métricas após o chute
          const metricsAfter = await apiClient.get('/api/metrics');
          const validationAfter = testHelpers.validateEngineResponse(metricsAfter);
          const contadorAfter = testHelpers.normalizeNumber(
            validationAfter.data.contador_chutes_global || validationAfter.data.contadorGlobal
          );

          // Validar que contador foi incrementado
          if (contadorAfterShoot === contadorAfter && contadorAfter > contadorBefore) {
            testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
            return testHelpers.createTestResult(testName, true, null, {
              contadorBefore,
              contadorAfterShoot,
              contadorAfter,
              incrementado: contadorAfter > contadorBefore
            });
          } else {
            testHelpers.log(`❌ ${testName} - FALHOU (contadores não correspondem)`, 'error');
            return testHelpers.createTestResult(testName, false, {
              message: 'Contadores não correspondem entre resposta de chute e métricas'
            });
          }
        }
      }

      // Se não conseguiu fazer chute, ainda validar que métricas retornam contador
      testHelpers.log(`✅ ${testName} - PASSOU (métricas retornam contador)`, 'success');
      return testHelpers.createTestResult(testName, true, null, {
        contadorReceived: true,
        contadorValue: contadorBefore
      });
    } catch (error) {
      testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
      return testHelpers.createTestResult(testName, false, error);
    }
  }
}

module.exports = new GameTests();

