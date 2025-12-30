// Testes de API - Admin
// FASE 2.5 - Testes Automatizados

const authHelper = require('../utils/authHelper');
const apiClient = require('../utils/apiClient');
const testHelpers = require('../utils/testHelpers');
const testConfig = require('../config/testConfig');

/**
 * Testes de Admin
 */
class AdminTests {
  async runAll() {
    testHelpers.log('Iniciando testes de admin...', 'info');

    const results = [];

    // Garantir que temos token admin válido
    await authHelper.getAdminToken();

    // Teste 1: Obter estatísticas gerais
    results.push(await this.testGetGeneralStats());

    // Teste 2: Obter estatísticas de jogo
    results.push(await this.testGetGameStats());

    // Teste 3: Endpoint protegido sem token
    results.push(await this.testProtectedEndpointWithoutToken());

    return results;
  }

  /**
   * Teste 1: Obter estatísticas gerais
   */
  async testGetGeneralStats() {
    const testName = 'API-ADMIN-001: Obter estatísticas gerais';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      const adminToken = await authHelper.getAdminToken();
      const response = await apiClient.requestWithToken(
        'GET',
        '/api/admin/stats',
        null,
        adminToken,
        true // isAdmin
      );

      const validation = testHelpers.validateEngineResponse(response);

      if (validation.valid && validation.data) {
        testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          totalUsers: validation.data.totalUsers || 0,
          activeUsers: validation.data.activeUsers || 0,
          totalGames: validation.data.totalGames || 0,
          totalRevenue: validation.data.totalRevenue || 0,
          statsReceived: true
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
   * Teste 2: Obter estatísticas de jogo
   */
  async testGetGameStats() {
    const testName = 'API-ADMIN-002: Obter estatísticas de jogo';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      const adminToken = await authHelper.getAdminToken();
      const response = await apiClient.requestWithToken(
        'GET',
        '/api/admin/game-stats?period=all',
        null,
        adminToken,
        true // isAdmin
      );

      const validation = testHelpers.validateEngineResponse(response);

      if (validation.valid && validation.data) {
        testHelpers.log(`✅ ${testName} - PASSOU`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          gameStatsReceived: true,
          period: validation.data.period || 'all'
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
   * Teste 3: Endpoint protegido sem token
   */
  async testProtectedEndpointWithoutToken() {
    const testName = 'API-ADMIN-003: Endpoint protegido sem token';
    testHelpers.log(`Executando: ${testName}`, 'debug');

    try {
      // Tentar acessar sem token
      const response = await apiClient.get('/api/admin/stats');

      // Não deveria funcionar
      testHelpers.log(`❌ ${testName} - FALHOU (deveria ter retornado 401)`, 'error');
      return testHelpers.createTestResult(testName, false, {
        message: 'Endpoint protegido foi acessado sem autenticação'
      });
    } catch (error) {
      // Deve retornar 401 ou 403
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        testHelpers.log(`✅ ${testName} - PASSOU (${error.response.status} retornado)`, 'success');
        return testHelpers.createTestResult(testName, true, null, {
          status401or403Received: true,
          errorHandled: true
        });
      } else {
        testHelpers.log(`❌ ${testName} - ERRO: ${error.message}`, 'error');
        return testHelpers.createTestResult(testName, false, error);
      }
    }
  }
}

module.exports = new AdminTests();

