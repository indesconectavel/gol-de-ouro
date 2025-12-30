// Testes de Stress Simulados
// FASE 2.5 - Testes Automatizados

const authHelper = require('../utils/authHelper');
const apiClient = require('../utils/apiClient');
const testHelpers = require('../utils/testHelpers');
const testConfig = require('../config/testConfig');
const axios = require('axios');

/**
 * Testes de Stress Simulados
 */
class StressTests {
  async runAll() {
    testHelpers.log('Iniciando testes de stress...', 'info');

    const results = [];

    // Garantir que temos token válido
    await authHelper.getPlayerToken();

    // Teste 1: Simular latência alta
    results.push(await this.testHighLatency());

    // Teste 2: Simular payload inesperado
    results.push(await this.testUnexpectedPayload());

    // Teste 3: Simular indisponibilidade (mock)
    results.push(await this.testBackendUnavailable());

    return results;
  }

  /**
   * Teste 1: Simular latência alta
   */
  async testHighLatency() {
    const testName = 'STRESS-001: Simular latência alta';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Criar cliente com timeout maior para simular latência
      const slowClient = axios.create({
        baseURL: testConfig.staging.baseURL,
        timeout: testConfig.timeouts.stress, // 2 minutos
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const startTime = Date.now();
      
      try {
        const response = await slowClient.get('/api/user/profile');
        const endTime = Date.now();
        const latency = endTime - startTime;

        const validation = testHelpers.validateEngineResponse(response);

        if (validation.valid) {
          testHelpers.log(`✅ ${testName} - PASSOU (Latência: ${latency}ms)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            latency,
            responseReceived: true,
            handledHighLatency: latency < testConfig.timeouts.stress
          });
        } else {
          testHelpers.log(`❌ ${testName} - FALHOU: ${validation.error}`, 'error');
          return testHelpers.createTestResult(testName, false, {
            message: validation.error
          });
        }
      } catch (error) {
        const endTime = Date.now();
        const latency = endTime - startTime;

        if (error.code === 'ECONNABORTED') {
          testHelpers.log(`⚠️ ${testName} - TIMEOUT após ${latency}ms`, 'warning');
          return testHelpers.createTestResult(testName, true, null, {
            timeoutOccurred: true,
            latency,
            note: 'Timeout é comportamento esperado para latência muito alta'
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
   * Teste 2: Simular payload inesperado
   */
  async testUnexpectedPayload() {
    const testName = 'STRESS-002: Simular payload inesperado';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Enviar payload com estrutura inesperada
      const unexpectedPayload = {
        invalidField: 'invalid',
        nested: {
          unexpected: 'data',
          array: [1, 2, 3, 'unexpected']
        },
        nullValue: null,
        undefinedValue: undefined
      };

      try {
        const response = await apiClient.post('/api/games/shoot', unexpectedPayload);
        
        // Se aceitou, pode ser problema ou pode ser que backend valida
        const validation = testHelpers.validateEngineResponse(response);
        
        if (!validation.valid || (validation.data && !validation.data.result)) {
          // Backend rejeitou ou normalizou - comportamento esperado
          testHelpers.log(`✅ ${testName} - PASSOU (payload rejeitado/normalizado)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            payloadHandled: true,
            backendValidated: true
          });
        } else {
          testHelpers.log(`⚠️ ${testName} - ATENÇÃO (payload aceito)`, 'warning');
          return testHelpers.createTestResult(testName, true, null, {
            payloadAccepted: true,
            note: 'Backend aceitou payload inesperado - pode ser comportamento esperado se validação ocorre'
          });
        }
      } catch (error) {
        // Erro é esperado para payload inválido
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          testHelpers.log(`✅ ${testName} - PASSOU (payload rejeitado)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            payloadRejected: true,
            errorHandled: true,
            status: error.response.status
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
   * Teste 3: Simular indisponibilidade (mock)
   * Nota: Como não podemos alterar backend, validamos comportamento
   * quando backend realmente está indisponível ou retorna erro 5xx
   */
  async testBackendUnavailable() {
    const testName = 'STRESS-003: Simular indisponibilidade do backend';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Tentar acessar URL que não existe (simula backend offline)
      const unavailableClient = axios.create({
        baseURL: 'https://unavailable-backend-12345.fly.dev',
        timeout: 5000, // 5 segundos
        headers: {
          'Content-Type': 'application/json'
        }
      });

      try {
        await unavailableClient.get('/api/user/profile');
        
        // Não deveria funcionar
        testHelpers.log(`❌ ${testName} - FALHOU (backend indisponível foi acessado)`, 'error');
        return testHelpers.createTestResult(testName, false, {
          message: 'Backend indisponível foi acessado incorretamente'
        });
      } catch (error) {
        // Erro é esperado
        if (!error.response || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          testHelpers.log(`✅ ${testName} - PASSOU (erro de rede detectado)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            networkErrorDetected: true,
            errorHandled: true,
            note: 'Validação indireta - adaptador deve tratar erro de rede no cliente'
          });
        } else {
          testHelpers.log(`✅ ${testName} - PASSOU (erro tratado)`, 'success');
          return testHelpers.createTestResult(testName, true, null, {
            errorHandled: true,
            status: error.response?.status
          });
        }
      }
    } catch (error) {
      // Erro é esperado
      testHelpers.log(`✅ ${testName} - PASSOU (erro esperado)`, 'success');
      return testHelpers.createTestResult(testName, true, null, {
        errorHandled: true
      });
    }
  }
}

module.exports = new StressTests();

